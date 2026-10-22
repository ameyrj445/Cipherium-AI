from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

# Load backend/.env before reading connection settings.
load_dotenv()

# PostgreSQL is the default. Override DATABASE_URL for another environment if needed.
# Example: postgresql+psycopg://cipherium_user:your_password@localhost:5432/cipherium_ai
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://cipherium_user:change_me@localhost:5432/cipherium_ai",
)

# SQLite requires check_same_thread; PostgreSQL does not.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()