#!/usr/bin/env python3
"""
Migration Script: Add session_id to simulation_realtime table
Run this to add the session_id column needed for filtering lap history
"""

import os
import sys
from pathlib import Path
from supabase import create_client, Client

def run_migration():
    """Execute the session_id migration"""
    
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: Supabase credentials not found")
        print("Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables")
        return False
    
    print("🔌 Connecting to Supabase...")
    client: Client = create_client(supabase_url, supabase_key)
    
    # Read SQL migration file
    sql_file = Path(__file__).parent / "add_session_id_to_realtime.sql"
    
    if not sql_file.exists():
        print(f"❌ Error: Migration file not found: {sql_file}")
        return False
    
    print(f"📄 Reading migration from: {sql_file}")
    with open(sql_file, 'r') as f:
        sql = f.read()
    
    # Execute migration
    print("🚀 Executing migration...")
    try:
        # Note: Supabase Python client doesn't have direct SQL execution
        # You need to run this via Supabase Dashboard SQL Editor or use PostgREST
        print("⚠️  Manual Step Required:")
        print("=" * 60)
        print("Copy and run this SQL in your Supabase Dashboard SQL Editor:")
        print("=" * 60)
        print(sql)
        print("=" * 60)
        print("\n📍 Steps:")
        print("1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql")
        print("2. Paste the SQL above")
        print("3. Click 'Run'")
        print("\n✅ After running, restart your backend server")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
