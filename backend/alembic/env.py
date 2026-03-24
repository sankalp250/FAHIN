import asyncio
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
from app.core.config import settings
from app.db.session import Base
import app.models  # noqa: F401 — ensures models are registered

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
if config.config_file_name:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_online():
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async def do_run():
        async with connectable.connect() as connection:
            await connection.run_sync(context.configure, target_metadata=target_metadata, compare_type=True)
            async with context.begin_transaction():
                await connection.run_sync(context.run_migrations)

    asyncio.run(do_run())


run_migrations_online()
