import asyncio
import os
import sys

# Add the project root to PYTHONPATH to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import drop_all_tables
from scripts.init_db import init_db
from scripts.seed_db import seed_db

async def reset_database():
    print("Starting full database reset...")
    try:
        # 1. Drop everything
        print("Dropping all existing tables...")
        await drop_all_tables()
        
        # 2. Re-initialize schema
        await init_db()
        
        # 3. Re-seed data
        await seed_db()
        
        print("Database reset and seeded successfully!")
    except Exception as e:
        print(f"Error during reset: {e}")

if __name__ == "__main__":
    asyncio.run(reset_database())
