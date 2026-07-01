# routes/user_routes.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.database.connection import get_db
from app.schemas.user_schema import UserOut, UserCreate, UserUpdate
from app.controllers import user_controller, auth_controller
from app.models.user_model import User, UserRole

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(auth_controller.get_current_user)):
    """Retrieve details of the currently authenticated user."""
    return current_user

@router.get("", response_model=list[UserOut])
def read_all_users(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.get_current_user)
):
    """List all users scoped to the currently authenticated user's tenant (SUPER_ADMIN sees all users)."""
    if current_user.role == UserRole.SUPER_ADMIN:
        # Super admin can view all users across all tenants with pagination
        return user_controller.get_all_users(db, skip=skip, limit=limit)
        
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant."
        )
        
    # Query tenant users with pagination
    query = db.query(User).filter(User.tenant_id == current_user.tenant_id, User.is_deleted == False)
    return query.offset(skip).limit(limit).all()

@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def invite_or_create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_role([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]))
):
    """Add or invite a new user to the tenant (Requires BUSINESS_OWNER or SUPER_ADMIN)."""
    # Enforce tenant_id scoping for BUSINESS_OWNER
    if current_user.role != UserRole.SUPER_ADMIN:
        user_in.tenant_id = current_user.tenant_id
        if user_in.role == UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot create a SUPER_ADMIN user."
            )
            
    # Check if username exists
    if user_controller.get_user_by_username(db, user_in.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
        
    # Check if email exists
    if user_controller.get_user_by_email(db, user_in.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    # Check if phone number exists
    if user_in.phone_number and user_controller.get_user_by_phone(db, user_in.phone_number):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )
        
    return user_controller.create_user(db, user_in)


@router.get("/{user_id}", response_model=UserOut)
def read_user_by_id(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.get_current_user)
):
    """Retrieve details of a specific user by their database ID."""
    db_user = user_controller.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    # Isolation check: users can only view others in their own tenant
    if current_user.role != UserRole.SUPER_ADMIN and db_user.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. User belongs to a different tenant."
        )
        
    return db_user

@router.patch("/{user_id}", response_model=UserOut)
def update_user_details(
    user_id: UUID,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.get_current_user)
):
    """Update details of a user. Regular users can edit themselves, Admins/Owners can edit anyone within their tenant."""
    db_user = user_controller.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    # Permission logic
    is_self = db_user.id == current_user.id
    is_authorized_admin = (
        current_user.role == UserRole.SUPER_ADMIN or
        (current_user.role == UserRole.BUSINESS_OWNER and db_user.tenant_id == current_user.tenant_id)
    )
    
    if not (is_self or is_authorized_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to edit this user's profile."
        )
        
    # Prevent self-demotion or changing own role unless Admin/Owner
    if is_self and user_in.role and user_in.role != db_user.role:
        if not is_authorized_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot change your own role."
            )
            
    return user_controller.update_user(db, db_user, user_in)

@router.delete("/{user_id}", response_model=UserOut)
def delete_user_account(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_role([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]))
):
    """Soft delete a user account (Requires BUSINESS_OWNER or SUPER_ADMIN)."""
    db_user = user_controller.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    # Check tenant boundary
    if current_user.role != UserRole.SUPER_ADMIN and db_user.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete user belonging to another tenant."
        )
        
    # Prevent deleting self
    if db_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account."
        )
        
    return user_controller.delete_user(db, db_user)
