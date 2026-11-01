"""
Cipherium AI - Administrative Role Provisioning Utility

Usage:
    python backend/scripts/make_admin.py <user_email>
"""

import sys
from pathlib import Path
from typing import Optional
from sqlalchemy.orm import Session

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.database import SessionLocal
from app.models import User


def promote_user_to_admin(email: str, db: Optional[Session] = None):
    """
    Promotes a registered user to the 'admin' role.
    Optionally accepts an active database session for programmatic/test usage.
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True
    try:
        user = db.query(User).filter(User.email == email.strip()).first()
        if not user:
            print(f"Error: User with email '{email}' not found.")
            if should_close:
                sys.exit(1)
            return None
        
        user.role = "admin"
        db.commit()
        print(f"Success: User '{user.name}' ({user.email}) has been granted 'admin' privileges.")
        return user
    finally:
        if should_close:
            db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python backend/scripts/make_admin.py <user_email>")
        sys.exit(1)
    
    target_email = sys.argv[1]
    promote_user_to_admin(target_email)
