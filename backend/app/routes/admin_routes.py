# routes/admin_routes.py

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID
import uuid
import os
import shutil
import json
from typing import List, Optional

from app.database.connection import get_db
from app.config.settings import settings
from app.models.user_model import User, UserRole
from app.models.tenant import Tenant
from app.models.document import Document
from app.models.embedding_log import EmbeddingLog
from app.models.prompt_version import PromptVersion
from app.models.tool_schema import ToolSchema
from app.controllers import auth_controller, tenant_controller
from app.schemas.admin_schema import (
    PromptVersionCreate, PromptVersionOut, ToolSchemaCreate, ToolSchemaOut, KnowledgeFileOut
)

router = APIRouter(prefix="/admin", tags=["Admin Control Panel"])

# ---------------------------------------------------------
# 1. SYSTEM PROMPTS MANAGEMENT
# ---------------------------------------------------------

@router.post("/prompts", response_model=PromptVersionOut)
def create_prompt_version(
    payload: PromptVersionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_role([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]))
):
    """Create a new system prompt version for the tenant. Sets it as active."""
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="User not associated with any tenant.")

    # Find last version number
    last_prompt = db.query(PromptVersion).filter(
        PromptVersion.tenant_id == tenant_id
    ).order_by(PromptVersion.version.desc()).first()
    
    next_version = 1 if not last_prompt else last_prompt.version + 1

    # Mark other versions inactive
    db.query(PromptVersion).filter(
        PromptVersion.tenant_id == tenant_id
    ).update({"is_active": False})

    # Create new active version
    db_prompt = PromptVersion(
        tenant_id=tenant_id,
        version=next_version,
        prompt_text=payload.prompt_text,
        is_active=True
    )
    db.add(db_prompt)

    # Also update Tenant record system_prompt and version for backward compatibility
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if tenant:
        tenant.system_prompt = payload.prompt_text
        tenant.system_prompt_version = next_version

    db.commit()
    db.refresh(db_prompt)
    return db_prompt

@router.get("/prompts", response_model=List[PromptVersionOut])
def list_prompt_versions(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_role([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]))
):
    """List all system prompt versions for the tenant."""
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="User not associated with any tenant.")
        
    return db.query(PromptVersion).filter(
        PromptVersion.tenant_id == tenant_id
    ).order_by(PromptVersion.version.desc()).all()

@router.put("/prompts/{prompt_id}/activate", response_model=PromptVersionOut)
def activate_prompt_version(
    prompt_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_role([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]))
):
    """Set a specific prompt version as the active prompt."""
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="User not associated with any tenant.")

    db_prompt = db.query(PromptVersion).filter(
        PromptVersion.id == prompt_id,
        PromptVersion.tenant_id == tenant_id
    ).first()

    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt version not found.")

    # Mark others inactive
    db.query(PromptVersion).filter(
        PromptVersion.tenant_id == tenant_id
    ).update({"is_active": False})

    # Set this active
    db_prompt.is_active = True

    # Update Tenant record
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if tenant:
        tenant.system_prompt = db_prompt.prompt_text
        tenant.system_prompt_version = db_prompt.version

    db.commit()
    db.refresh(db_prompt)
    return db_prompt

@router.delete("/prompts/{prompt_id}")
def delete_prompt_version(
    prompt_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_role([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]))
):
    """Delete a prompt version. Active prompt versions cannot be deleted."""
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="User not associated with any tenant.")

    db_prompt = db.query(PromptVersion).filter(
        PromptVersion.id == prompt_id,
        PromptVersion.tenant_id == tenant_id
    ).first()

    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt version not found.")

    if db_prompt.is_active:
        raise HTTPException(status_code=400, detail="Cannot delete the active prompt version. Please activate another one first.")

    db.delete(db_prompt)
    db.commit()
    return {"status": "success", "message": "Prompt version successfully deleted."}

# ---------------------------------------------------------
# 2. TOOL SCHEMA REGISTRATION
# ---------------------------------------------------------

@router.post("/tools", response_model=ToolSchemaOut)
def register_tool_schema(
    payload: ToolSchemaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_role([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]))
):
    """Register or update an LLM action tool schema in database."""
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="User not associated with any tenant.")

    # Upsert logic based on name + tenant_id
    db_tool = db.query(ToolSchema).filter(
        ToolSchema.tenant_id == tenant_id,
        ToolSchema.name == payload.name
    ).first()

    if db_tool:
        db_tool.description = payload.description
        db_tool.json_schema = payload.json_schema
        db_tool.is_active = True
    else:
        db_tool = ToolSchema(
            tenant_id=tenant_id,
            name=payload.name,
            description=payload.description,
            json_schema=payload.json_schema,
            is_active=True
        )
        db.add(db_tool)

    db.commit()
    db.refresh(db_tool)
    return db_tool

@router.get("/tools", response_model=List[ToolSchemaOut])
def list_tool_schemas(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_role([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]))
):
    """List all registered tools for the tenant."""
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="User not associated with any tenant.")

    return db.query(ToolSchema).filter(
        ToolSchema.tenant_id == tenant_id
    ).order_by(ToolSchema.name.asc()).all()

@router.delete("/tools/{tool_id}")
def delete_tool_schema(
    tool_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_role([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]))
):
    """Remove a tool registration."""
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="User not associated with any tenant.")

    db_tool = db.query(ToolSchema).filter(
        ToolSchema.id == tool_id,
        ToolSchema.tenant_id == tenant_id
    ).first()

    if not db_tool:
        raise HTTPException(status_code=404, detail="Tool schema not found.")

    db.delete(db_tool)
    db.commit()
    return {"status": "success", "message": "Tool schema successfully removed."}

@router.post("/tools/bootstrap", response_model=List[ToolSchemaOut])
def bootstrap_default_tools(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_role([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]))
):
    """Load default JSON tool schemas from the system directory and register them in DB."""
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="User not associated with any tenant.")

    tools_dir = os.path.join(os.getcwd(), "data", "tools")
    os.makedirs(tools_dir, exist_ok=True)

    default_tools = {
        "book_callback": {
            "name": "book_callback",
            "description": "Schedule a callback or appointment with a senior insurance advisor for the lead.",
            "json_schema": {
                "type": "object",
                "properties": {
                    "date": {"type": "string", "description": "The date of the callback in YYYY-MM-DD format."},
                    "time": {"type": "string", "description": "The time of the callback (e.g. 10:00 AM)."}
                },
                "required": ["date", "time"]
            }
        },
        "calculate_premium": {
            "name": "calculate_premium",
            "description": "Estimate monthly premium for term life, health, or retirement insurance policies.",
            "json_schema": {
                "type": "object",
                "properties": {
                    "age": {"type": "integer", "description": "The age of the applicant (e.g., 30)."},
                    "policy_type": {
                        "type": "string",
                        "enum": ["term", "health", "retirement"],
                        "description": "The type of insurance policy."
                    },
                    "coverage_amount": {"type": "number", "description": "The coverage amount in USD (e.g. 500000)."}
                },
                "required": ["age", "policy_type", "coverage_amount"]
            }
        },
        "search_knowledge": {
            "name": "search_knowledge",
            "description": "Query the vector search knowledge base for specific information, syllabi, fee structure, or FAQs.",
            "json_schema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The detailed query search term."}
                },
                "required": ["query"]
            }
        },
        "update_lead_status": {
            "name": "update_lead_status",
            "description": "Update the pipeline/CRM status of the active lead.",
            "json_schema": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["Imported", "Pending Queue", "Ready To Call", "Connected", "Converted", "Needs Follow-up", "Not Interested"],
                        "description": "The new status of the lead."
                    }
                },
                "required": ["status"]
            }
        },
        "blacklist_number": {
            "name": "blacklist_number",
            "description": "Blacklist the current user phone number from calling lists (opt-out / Do Not Call request).",
            "json_schema": {
                "type": "object",
                "properties": {
                    "phone": {"type": "string", "description": "The phone number to blacklist."},
                    "reason": {"type": "string", "description": "The reason for blacklisting."}
                },
                "required": ["phone"]
            }
        }
    }

    # Write default json files if they do not exist
    for key, value in default_tools.items():
        file_path = os.path.join(tools_dir, f"{key}.json")
        if not os.path.exists(file_path):
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(value, f, indent=2)

    registered_tools = []
    
    # Process files
    for key in default_tools.keys():
        file_path = os.path.join(tools_dir, f"{key}.json")
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        db_tool = db.query(ToolSchema).filter(
            ToolSchema.tenant_id == tenant_id,
            ToolSchema.name == data["name"]
        ).first()

        if db_tool:
            db_tool.description = data.get("description", "")
            db_tool.json_schema = data.get("json_schema", {})
            db_tool.is_active = True
        else:
            db_tool = ToolSchema(
                tenant_id=tenant_id,
                name=data["name"],
                description=data.get("description", ""),
                json_schema=data.get("json_schema", {}),
                is_active=True
            )
            db.add(db_tool)
        
        registered_tools.append(db_tool)

    db.commit()
    for t in registered_tools:
        db.refresh(t)

    return registered_tools

# ---------------------------------------------------------
# 3. KNOWLEDGE FILE MANAGEMENT
# ---------------------------------------------------------

@router.post("/knowledge/upload")
def upload_knowledge_base_file(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_role([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]))
):
    """Alternative API endpoint to upload PDF documents and trigger vectorization."""
    from app.routes.tenant_routes import upload_knowledge_base
    return upload_knowledge_base(background_tasks, files, db, current_user)

@router.get("/knowledge/files", response_model=List[KnowledgeFileOut])
def list_knowledge_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_role([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]))
):
    """Retrieve list of all uploaded knowledge documents for the tenant."""
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="User not associated with any tenant.")

    return db.query(Document).filter(Document.tenant_id == tenant_id).all()

@router.delete("/knowledge/files/{document_id}")
def delete_knowledge_file(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_role([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]))
):
    """Delete a knowledge file, clean up associated Pinecone vectors, and remove the local file."""
    import pinecone
    
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="User not associated with any tenant.")

    db_doc = db.query(Document).filter(
        Document.id == document_id,
        Document.tenant_id == tenant_id
    ).first()

    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # 1. Pinecone Clean up
    if settings.PINECONE_API_KEY:
        try:
            # Check dimension and index name
            if settings.GEMINI_API_KEY:
                index_name = "ai-bot-index-gemini"
            else:
                index_name = settings.PINECONE_INDEX_NAME or "ai-bot-index"

            # Check chunks count from logs
            log = db.query(EmbeddingLog).filter(EmbeddingLog.document_id == document_id).first()
            chunks_count = log.chunks if log else 100 # default to deleting up to 100 chunks if not found
            
            pc = pinecone.Pinecone(api_key=settings.PINECONE_API_KEY)
            index = pc.Index(index_name)
            
            # Construct IDs to delete: "{document_id}_{chunk_index}"
            ids_to_delete = [f"{document_id}_{i}" for i in range(chunks_count)]
            print(f"[PINECONE CLEANUP] Deleting vectors: {ids_to_delete} from index: {index_name}, namespace: {tenant_id}")
            index.delete(ids=ids_to_delete, namespace=str(tenant_id))
            print(f"[PINECONE CLEANUP SUCCESS] Vectors deleted successfully.")
        except Exception as e:
            print(f"[PINECONE CLEANUP ERROR] Failed to delete vectors from Pinecone: {str(e)}")

    # 2. Local physical file cleanup
    if db_doc.file_url.startswith("/uploads/"):
        file_path = os.path.join(os.getcwd(), "uploads", os.path.basename(db_doc.file_url))
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                print(f"[FILE CLEANUP SUCCESS] Deleted local file: {file_path}")
            except Exception as e:
                print(f"[FILE CLEANUP ERROR] Failed to delete local file: {str(e)}")

    # 3. Database records deletion
    db.delete(db_doc)
    db.commit()

    return {"status": "success", "message": "Document and associated vectors successfully deleted."}
