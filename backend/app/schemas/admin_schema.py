# schemas/admin_schema.py

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from uuid import UUID
from typing import Optional, Dict, Any

class PromptVersionCreate(BaseModel):
    prompt_text: str = Field(..., min_length=10, max_length=10000)

class PromptVersionOut(BaseModel):
    id: UUID
    tenant_id: UUID
    version: int
    prompt_text: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ToolSchemaCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    json_schema: Dict[str, Any]

class ToolSchemaOut(BaseModel):
    id: UUID
    tenant_id: UUID
    name: str
    description: Optional[str] = None
    json_schema: Dict[str, Any]
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class KnowledgeFileOut(BaseModel):
    id: UUID
    tenant_id: UUID
    file_name: str
    file_url: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
