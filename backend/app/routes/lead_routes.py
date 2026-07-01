# routes/lead_routes.py

import io
import csv
from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.controllers import auth_controller, lead_controller
from app.models.user_model import User, UserRole
from app.models.lead import LeadStatus
from app.schemas.lead_schema import (
    LeadImportRequest, LeadImportResponse, LeadOut, 
    LeadStatusUpdate, KanbanBoardResponse
)

router = APIRouter(prefix="/leads", tags=["Leads"])

def require_payment(current_user: User = Depends(auth_controller.get_current_user)):
    """Gate checks to ensure tenant has active payment done before accessing leads API."""
    if not current_user.tenant or not current_user.tenant.is_payment_done:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Subscription payment required to access Lead Pipeline features."
        )
    return current_user

@router.get("/template")
def download_csv_template(
    current_user: User = Depends(require_payment)
):
    """
    Download CSV template containing columns: name, phone, email, notes.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    # Write headers
    writer.writerow(["name", "phone", "email", "notes"])
    # Write dummy sample row
    writer.writerow(["John Doe", "+15550199", "john@example.com", "Interested in React course"])
    
    csv_data = output.getvalue()
    output.close()
    
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads_template.csv"}
    )

@router.post("/upload-preview")
def upload_csv_preview(
    file: UploadFile = File(...),
    current_user: User = Depends(require_payment)
):
    """
    Upload CSV file and parse first 5 rows to return headers and row values preview.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only CSV files are supported."
        )
        
    try:
        content = file.file.read().decode("utf-8")
        # Reset file pointer
        file.file.seek(0)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read CSV file: {str(e)}"
        )
        
    csv_file = io.StringIO(content)
    reader = csv.reader(csv_file)
    
    try:
        headers = next(reader)
    except StopIteration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded CSV file is empty."
        )
        
    # Clean headers (strip spaces and lowercase them)
    cleaned_headers = [h.strip().lower() for h in headers if h.strip()]
    
    preview_rows = []
    for _ in range(5):
        try:
            row = next(reader)
            # Map row to cleaned headers keys
            row_dict = {}
            for i, val in enumerate(row):
                if i < len(cleaned_headers):
                    row_dict[cleaned_headers[i]] = val.strip()
            if row_dict:
                preview_rows.append(row_dict)
        except StopIteration:
            break
            
    return {
        "headers": cleaned_headers,
        "preview_rows": preview_rows
    }

@router.post("/import", response_model=LeadImportResponse)
def import_leads_endpoint(
    request_in: LeadImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_payment)
):
    """
    Bulk import leads with phone format and email validation.
    """
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant workspace."
        )
        
    result = lead_controller.import_leads(db, tenant_id, request_in.leads)
    return result

@router.get("", response_model=List[LeadOut])
def get_leads_endpoint(
    status: Optional[LeadStatus] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_payment)
):
    """
    List and search leads scoped to the tenant workspace.
    """
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant workspace."
        )
        
    items, _ = lead_controller.get_leads(db, tenant_id, status, search, skip, limit)
    return items

@router.get("/kanban", response_model=KanbanBoardResponse)
def get_kanban_leads_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_payment)
):
    """
    Retrieve all leads grouped by status for Kanban view.
    """
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant workspace."
        )
        
    kanban_data = lead_controller.get_kanban_leads(db, tenant_id)
    return {"columns": kanban_data}

@router.patch("/{lead_id}/status", response_model=LeadOut)
def update_lead_status_endpoint(
    lead_id: UUID,
    request_in: LeadStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_payment)
):
    """
    Update lead status (e.g. on Kanban board drag & drop).
    """
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant workspace."
        )
        
    db_lead = lead_controller.get_lead_by_id(db, lead_id, tenant_id)
    if not db_lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found or access denied."
        )
        
    updated_lead = lead_controller.update_lead_status(db, db_lead, request_in.status)
    return updated_lead
