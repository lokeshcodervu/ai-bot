import sys
import os

sys.path.insert(0, os.getcwd())

from app.database.connection import SessionLocal
from app.models.user_model import User, UserRole
from app.utils.helpers import hash_password

def create_or_update_superadmin(
    email="admin@codervu.com",
    username="superadmin",
    password="SuperAdminPassword123!",
    full_name="Super Admin"
):
    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(
            (User.email == email) | (User.username == username)
        ).first()

        if existing_user:
            existing_user.username = username
            existing_user.email = email
            existing_user.hashed_password = hash_password(password)
            existing_user.role = UserRole.SUPER_ADMIN
            existing_user.is_active = True
            existing_user.full_name = full_name
            db.commit()
            db.refresh(existing_user)
            print(f"[SUCCESS] Updated existing user '{existing_user.email}' to SUPER_ADMIN!")
            return existing_user
        else:
            new_user = User(
                username=username,
                email=email,
                hashed_password=hash_password(password),
                role=UserRole.SUPER_ADMIN,
                is_active=True,
                full_name=full_name
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            print(f"[SUCCESS] Created new SUPER_ADMIN user '{new_user.email}' successfully!")
            return new_user
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to create superadmin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_or_update_superadmin()
