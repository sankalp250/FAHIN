import asyncio
from sqlalchemy import text
from app.db.session import engine
from app.models.v3_models import Base

async def fix_database():
    print("Fixing database schema...")
    async with engine.begin() as conn:
        # 1. Create system_config table if it doesn't exist
        print("Ensuring system_config table existence...")
        await conn.run_sync(Base.metadata.create_all)
        
        # 2. Add 'city' column to 'reports' table if it doesn't exist
        print("Checking/Adding 'city' column to 'reports' table...")
        try:
            await conn.execute(text("ALTER TABLE reports ADD COLUMN city VARCHAR DEFAULT 'Kolkata'"))
            print("Added 'city' to 'reports'.")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("'city' already exists in 'reports'.")
            else:
                print(f"Note: {e}")

        # 3. Add 'city' column to 'alerts' table if it doesn't exist
        print("Checking/Adding 'city' column to 'alerts' table...")
        try:
            await conn.execute(text("ALTER TABLE alerts ADD COLUMN city VARCHAR DEFAULT 'Kolkata'"))
            print("Added 'city' to 'alerts'.")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("'city' already exists in 'alerts'.")
            else:
                print(f"Note: {e}")

    print("Database schema fix complete.")

if __name__ == "__main__":
    asyncio.run(fix_database())
