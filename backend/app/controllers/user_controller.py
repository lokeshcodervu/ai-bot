# controllers/user_controller.py

from uuid import UUID
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from datetime import datetime

from app.models.user_model import User
from app.schemas.user_schema import UserCreate, UserUpdate
from app.utils.helpers import hash_password

# =========================================================
# GET USER BY ID
# =========================================================

def get_user_by_id(
    db: Session,
    user_id: UUID,
    tenant_id: UUID = None
):
    query = db.query(User).filter(
        User.id == user_id,
        User.is_deleted == False
    )
    
    # Tenant Isolation
    if tenant_id:
        query = query.filter(User.tenant_id == tenant_id)
        
    return query.first()

# =========================================================
# GET USER BY USERNAME
# =========================================================

def get_user_by_username(
    db: Session,
    username: str
):
    return db.query(User).filter(
        User.username == username,
        User.is_deleted == False
    ).first()

# =========================================================
# GET USER BY EMAIL
# =========================================================

def get_user_by_email(
    db: Session,
    email: str
):
    return db.query(User).filter(
        User.email == email,
        User.is_deleted == False
    ).first()

# =========================================================
# GET USER BY PHONE
# =========================================================

def get_user_by_phone(
    db: Session,
    phone_number: str
):
    return db.query(User).filter(
        User.phone_number == phone_number,
        User.is_deleted == False
    ).first()

# =========================================================
# GET USERS BY TENANT
# =========================================================

def get_users_by_tenant(
    db: Session,
    tenant_id: UUID
):
    return db.query(User).filter(
        User.tenant_id == tenant_id,
        User.is_deleted == False
    ).all()

# =========================================================
# GET ALL USERS (PAGINATION)
# =========================================================

def get_all_users(
    db: Session,
    skip: int = 0,
    limit: int = 10
):
    return db.query(User).filter(
        User.is_deleted == False
    ).offset(skip).limit(limit).all()

# =========================================================
# GET ACTIVE USERS
# =========================================================

def get_active_users(
    db: Session
):
    return db.query(User).filter(
        User.is_active == True,
        User.is_deleted == False
    ).all()

# =========================================================
# CREATE USER
# =========================================================

def create_user(
    db: Session,
    user: UserCreate
):
    # Verify tenant exists if tenant_id is provided
    if user.tenant_id:
        from app.models.tenant import Tenant
        tenant_exists = db.query(Tenant).filter(Tenant.id == user.tenant_id, Tenant.is_deleted == False).first()
        if not tenant_exists:
            raise HTTPException(
                status_code=404,
                detail="Tenant not found"
            )

    # Duplicate check
    dup_filter = (User.email == user.email) | (User.username == user.username)
    if user.phone_number:
        dup_filter = dup_filter | (User.phone_number == user.phone_number)
        
    existing_user = db.query(User).filter(
        dup_filter,
        User.is_deleted == False
    ).first()
    
    if existing_user:
        if existing_user.username == user.username:
            detail_msg = "Username already registered"
        elif existing_user.email == user.email:
            detail_msg = "Email already registered"
        else:
            detail_msg = "Phone number already registered"
        raise HTTPException(
            status_code=400,
            detail=detail_msg
        )
        
    try:
        hashed_pwd = hash_password(user.password)
        
        db_user = User(
            tenant_id=user.tenant_id,
            username=user.username,
            email=user.email,
            hashed_password=hashed_pwd,
            full_name=user.full_name,
            phone_number=user.phone_number,
            role=user.role
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# =========================================================
# UPDATE USER
# =========================================================

def update_user(
    db: Session,
    db_user: User,
    user_in: UserUpdate
):
    try:
        update_data = user_in.model_dump(
            exclude_unset=True
        )
        
        for key, value in update_data.items():
            setattr(db_user, key, value)
            
        db.commit()
        db.refresh(db_user)
        
        return db_user
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# =========================================================
# SOFT DELETE USER
# =========================================================

def delete_user(
    db: Session,
    db_user: User
):
    try:
        db_user.is_deleted = True
        db_user.deleted_at = func.now()
        
        db.commit()
        db.refresh(db_user)
        
        return db_user
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# =========================================================
# SAVE PASSWORD RESET TOKEN
# =========================================================

def save_reset_token(
    db: Session,
    db_user: User,
    token: str,
    expires_at: datetime
):
    try:
        db_user.reset_token = token
        db_user.reset_token_expires_at = expires_at
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# =========================================================
# GET USER BY RESET TOKEN
# =========================================================

def get_user_by_reset_token(
    db: Session,
    token: str
):
    return db.query(User).filter(
        User.reset_token == token,
        User.is_deleted == False
    ).first()

# =========================================================
# CLEAR PASSWORD RESET TOKEN
# =========================================================

def clear_reset_token(
    db: Session,
    db_user: User
):
    try:
        db_user.reset_token = None
        db_user.reset_token_expires_at = None
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
