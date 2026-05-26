"""
Run this script to add post_link column to comments table:
    python run_add_post_link_migration.py
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app.db import get_snowflake_connection

def run_migration():
    print("Starting migration: Add post_link to comments table...")
    
    with get_snowflake_connection() as conn:
        cursor = conn.cursor()
        
        # Add post_link column
        print("Adding post_link column...")
        cursor.execute("""
            ALTER TABLE comments ADD COLUMN IF NOT EXISTS post_link VARCHAR(500)
        """)
        
        # Update existing comments to populate post_link from posts table
        print("Populating post_link for existing comments...")
        cursor.execute("""
            UPDATE comments c
            SET post_link = p.link
            FROM posts p
            WHERE c.post_id = p.id AND c.post_link IS NULL
        """)
        
        conn.commit()
        print("✓ Migration completed successfully!")

if __name__ == "__main__":
    run_migration()
