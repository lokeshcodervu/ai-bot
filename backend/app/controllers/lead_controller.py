# controllers/lead_controller.py

import re
from uuid import UUID
import uuid
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.lead import Lead, LeadStatus
from app.models.tenant_usage import TenantUsage
from app.schemas.lead_schema import LeadImportItem, LeadImportResponse

# Phone number cleaning & validation regex: optional +, followed by 7-15 digits
PHONE_REGEX = re.compile(r"^\+?\d{7,15}$")
# Simple email validation regex
EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

def clean_phone_number(phone: str) -> str:
    """Remove spaces, hyphens, parentheses, and other characters, keeping + and digits."""
    if not phone:
        return ""
    # Strip spaces, hyphens, brackets
    cleaned = re.sub(r"[\s\-\(\)]", "", phone)
    return cleaned

def get_lead_by_id(db: Session, lead_id: UUID, tenant_id: UUID) -> Optional[Lead]:
    """Retrieve a single lead by ID, scoped to a specific tenant."""
    return db.query(Lead).filter(Lead.id == lead_id, Lead.tenant_id == tenant_id).first()

def get_leads(
    db: Session, 
    tenant_id: UUID, 
    status: Optional[LeadStatus] = None, 
    search_query: Optional[str] = None, 
    skip: int = 0, 
    limit: int = 100
) -> Tuple[List[Lead], int]:
    """Retrieve a paginated list of leads for a tenant, with optional search and status filter."""
    query = db.query(Lead).filter(Lead.tenant_id == tenant_id)
    
    if status:
        query = query.filter(Lead.status == status)
        
    if search_query:
        search_filter = f"%{search_query}%"
        query = query.filter(
            or_(
                Lead.name.ilike(search_filter),
                Lead.phone.ilike(search_filter),
                Lead.email.ilike(search_filter),
                Lead.notes.ilike(search_filter)
            )
        )
        
    total = query.count()
    items = query.order_by(Lead.created_at.desc()).offset(skip).limit(limit).all()
    return items, total

def get_kanban_leads(db: Session, tenant_id: UUID) -> Dict[str, Dict[str, any]]:
    """Retrieve all leads for a tenant grouped by their pipeline statuses."""
    leads = db.query(Lead).filter(Lead.tenant_id == tenant_id).all()
    
    # Initialize dictionary for all statuses
    board = {s.value: [] for s in LeadStatus}
    
    for lead in leads:
        if lead.status.value in board:
            board[lead.status.value].append(lead)
            
    # Return formatted columns
    result = {}
    for status_val in board:
        result[status_val] = {
            "status": status_val,
            "leads": board[status_val],
            "count": len(board[status_val])
        }
    return result

def import_leads(db: Session, tenant_id: UUID, leads_in: List[LeadImportItem]) -> Dict[str, any]:
    """
    Import a list of leads with validation:
    - Cleans and validates phone numbers.
    - Validates emails.
    - Rejects duplicate phone numbers within the import batch or existing in the database for the tenant.
    - Updates TenantUsage count.
    """
    imported_lead_ids = []
    failed_leads = []
    seen_phones_in_batch = set()
    
    # Fetch existing phone numbers for this tenant to check database duplicates
    existing_phones = {
        row[0] for row in db.query(Lead.phone).filter(Lead.tenant_id == tenant_id).all()
    }
    
    for item in leads_in:
        name = item.name.strip() if item.name else ""
        phone = item.phone.strip() if item.phone else ""
        email = item.email.strip() if item.email else None
        notes = item.notes.strip() if item.notes else None
        
        # 1. Validate name
        if not name:
            failed_leads.append({
                "name": name,
                "phone": phone,
                "error": "Name is required and cannot be empty."
            })
            continue
            
        # 2. Clean and validate phone number
        cleaned_phone = clean_phone_number(phone)
        if not cleaned_phone or not PHONE_REGEX.match(cleaned_phone):
            failed_leads.append({
                "name": name,
                "phone": phone,
                "error": "Invalid phone number format. Must be 7-15 digits and optional leading '+'."
            })
            continue
            
        # 3. Validate email if provided
        if email:
            if not EMAIL_REGEX.match(email):
                failed_leads.append({
                    "name": name,
                    "phone": phone,
                    "error": f"Invalid email format: '{email}'."
                })
                continue
                
        # 4. Check for duplicates in the current import batch
        if cleaned_phone in seen_phones_in_batch:
            failed_leads.append({
                "name": name,
                "phone": phone,
                "error": f"Duplicate phone number in import batch."
            })
            continue
            
        # 5. Check for duplicates in the database for this tenant
        if cleaned_phone in existing_phones:
            failed_leads.append({
                "name": name,
                "phone": phone,
                "error": f"Lead with phone number '{cleaned_phone}' already exists for this workspace."
            })
            continue
            
        # All validations passed, create lead record
        db_lead = Lead(
            tenant_id=tenant_id,
            name=name,
            phone=cleaned_phone,
            email=email,
            notes=notes,
            status=LeadStatus.IMPORTED
        )
        db.add(db_lead)
        db.flush() # get generated UUID
        
        imported_lead_ids.append(db_lead.id)
        seen_phones_in_batch.add(cleaned_phone)
        
    # Increment TenantUsage stats if we successfully imported any leads
    imported_count = len(imported_lead_ids)
    if imported_count > 0:
        db_usage = db.query(TenantUsage).filter(TenantUsage.tenant_id == tenant_id).first()
        if db_usage:
            db_usage.total_leads = (db_usage.total_leads or 0) + imported_count
            
    # Commit changes
    db.commit()
    
    return {
        "status": "success",
        "total_received": len(leads_in),
        "total_imported": imported_count,
        "total_failed": len(failed_leads),
        "imported_leads": imported_lead_ids,
        "failed_leads": failed_leads
    }

def update_lead_status(db: Session, db_lead: Lead, new_status: LeadStatus) -> Lead:
    """Update lead status in database."""
    db_lead.status = new_status
    db.commit()
    db.refresh(db_lead)
    return db_lead
