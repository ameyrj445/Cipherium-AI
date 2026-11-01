"""Alembic environment configured from Cipherium's runtime settings."""

from logging.config import fileConfig

from alembic import context

from app.config import settings
from app.database import Base
import app.models  # Register all SQLAlchemy models with Base.metadata.


config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Do not use alembic.ini's development placeholder in deployed environments.
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = config.attributes.get("connection")
    if connectable is not None:
        context.configure(connection=connectable, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
        return

    from sqlalchemy import create_engine, pool

    connectable = create_engine(settings.DATABASE_URL, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
