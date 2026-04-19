import asyncio
from app.db.session import engine
from app.models.v3_models import Base

async def init_db():
    print("Initializing database tables...")
    async with engine.begin() as conn:
        # Create all tables defined in models
        await conn.run_sync(Base.metadata.create_all)
    print("Database initialization complete.")

if __name__ == "__main__":
    asyncio.run(init_db())
