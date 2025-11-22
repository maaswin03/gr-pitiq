"""
Supabase Service for GR PitIQ Simulation
Handles all database operations for real-time simulation data
"""

import os
from typing import Dict, Any, List, Optional
from supabase import create_client, Client
from datetime import datetime


class SupabaseService:
    """
    Service class for managing Supabase operations
    Tables:
    - simulation_realtime: Latest state for each active user (upsert)
    - simulation_lap_history: Historical lap data (insert only)
    """
    
    def __init__(self):
        """Initialize Supabase client"""
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_ANON_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("❌ Supabase credentials not found. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.")
            
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
        print("✅ Supabase client initialized")
        
    def save_realtime_snapshot(
        self,
        user_id: str,
        snapshot: Dict[str, Any],
        engineered_features: Dict[str, Any],
        max_laps: int = 999,
        session_id: str = None
    ) -> bool:
        """
        Save/update the current simulation state to simulation_realtime table
        Uses upsert to maintain only the latest state per user
        
        Args:
            user_id: Unique user identifier
            snapshot: Complete raw telemetry snapshot
            engineered_features: All ML-ready engineered features
            max_laps: Maximum laps for this simulation session
            session_id: Unique session identifier for current simulation run
            
        Returns:
            bool: True if successful, False otherwise
        """
        
        try:
            # Prepare data for storage
            current_time = datetime.now().isoformat()
            
            # Debug: Log session_id
            if not session_id:
                print(f"⚠️  WARNING: session_id is None or empty for user {user_id}")
            else:
                print(f"📊 Saving state with session_id: {session_id} for user {user_id}")
            
            data = {
                "user_id": user_id,
                "session_id": session_id or "unknown",
                "timestamp": current_time,
                "current_lap": snapshot.get("current_lap", 1),
                "current_sector": snapshot.get("sector", 1),
                "sector_progress": snapshot.get("sector_progress", 0.0),
            
                
                # Raw telemetry (all 97+ model parameters)
                "raw_telemetry": snapshot.get("raw_snapshot", {}),
                
                # Engineered features (50+ ML features)
                "engineered_features": engineered_features,
                
                # Quick access fields
                "lap_time": snapshot.get("raw_snapshot", {}).get("LAP_TIME_SECONDS", 0),
                "speed": snapshot.get("raw_snapshot", {}).get("KPH", 0),
                "fuel": snapshot.get("raw_snapshot", {}).get("FUEL_CURRENT", 0),
                "tire_age": snapshot.get("raw_snapshot", {}).get("TIRE_AGE", 0),
                "track": snapshot.get("raw_snapshot", {}).get("TRACK", "Unknown"),
                "max_laps": max_laps,
                
                # Pit stop state
                "is_paused": snapshot.get("is_paused", False),
                "pause_reason": snapshot.get("pause_reason", ""),
                
                # Session metadata
                "is_active": True,
                "updated_at": current_time
            }
            
            # Upsert (insert or update based on user_id)
            response = self.client.table("simulation_realtime").upsert(
                data,
                on_conflict="user_id"
            ).execute()
            
            if response.data:
                return True
            else:
                print(f"⚠️  No data returned from upsert for user {user_id}")
                return False
                
        except Exception as e:
            print(f"❌ Error saving realtime snapshot: {e}")
            return False
            
    def save_completed_lap(
        self,
        user_id: str,
        lap_number: int,
        lap_data: Dict[str, Any],
        engineered_features: Dict[str, Any],
        session_id: str = None
    ) -> bool:
        """
        Save completed lap to simulation_lap_history table
        Appends to history (no updates)
        
        Args:
            user_id: Unique user identifier
            lap_number: Lap number
            lap_data: Complete lap data with all metrics
            engineered_features: ML features for this lap
            session_id: Unique session identifier for this simulation run
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            data = {
                "user_id": user_id,
                "session_id": session_id or "unknown",  # Track which simulation session this lap belongs to
                "lap_number": lap_number,
                "lap_time": lap_data.get("lap_time", 0),
                "sector_times": lap_data.get("sector_times", {}),
                "speed_stats": lap_data.get("speed_stats", {}),
                "tire_stats": lap_data.get("tire_stats", {}),
                "fuel_stats": lap_data.get("fuel_stats", {}),
                "weather": lap_data.get("weather", {}),
                "engineered_features": engineered_features,
                "timestamp": lap_data.get("timestamp", datetime.now().isoformat()),
                "created_at": datetime.now().isoformat()
            }
            
            response = self.client.table("simulation_lap_history").insert(data).execute()
            
            if response.data:
                print(f"✅ Lap {lap_number} saved to history for user {user_id}")
                return True
            else:
                print(f"⚠️  No data returned from insert for lap {lap_number}")
                return False
                
        except Exception as e:
            print(f"❌ Error saving lap history: {e}")
            return False
            
    def delete_user_session(self, user_id: str) -> bool:
        """
        Clean up realtime data for a user before starting new simulation
        NOTE: Keeps lap history for analytics - only deletes active state
        
        Args:
            user_id: User to clean up
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Delete from realtime (active state only)
            self.client.table("simulation_realtime").delete().eq("user_id", user_id).execute()
            
            # NOTE: Lap history is preserved for historical analysis and ML training
            # Each lap now has a session_id to distinguish between different races
            
            print(f"✅ Cleaned realtime data for user {user_id} (history preserved)")
            return True
            
        except Exception as e:
            print(f"❌ Error deleting user session: {e}")
            return False
            
    def get_current_state(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the current simulation state for a user
        
        Args:
            user_id: User identifier
            
        Returns:
            Current state dict or None if not found
        """
        try:
            response = self.client.table("simulation_realtime").select("*").eq("user_id", user_id).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            else:
                return None
                
        except Exception as e:
            print(f"❌ Error getting current state: {e}")
            return None
            
    def get_lap_history(self, user_id: str, limit: int = 50, session_id: str = None) -> List[Dict[str, Any]]:
        """
        Get lap history for a user, optionally filtered by session
        
        Args:
            user_id: User identifier
            limit: Maximum number of laps to return (default 50)
            session_id: Optional session ID to filter by current simulation only
            
        Returns:
            List of lap data dicts, ordered by lap_number
        """
        try:
            query = (
                self.client.table("simulation_lap_history")
                .select("*")
                .eq("user_id", user_id)
            )
            
            # If session_id provided, filter to current session only
            if session_id:
                query = query.eq("session_id", session_id)
            
            response = query.order("lap_number", desc=False).limit(limit).execute()
            
            if response.data:
                return response.data
            else:
                return []
                
        except Exception as e:
            print(f"❌ Error getting lap history: {e}")
            return []
            
    def mark_session_inactive(self, user_id: str) -> bool:
        """
        Mark a session as inactive (simulation stopped)
        
        Args:
            user_id: User identifier
            
        Returns:
            bool: True if successful
        """
        try:
            data = {
                "is_active": False,
                "updated_at": datetime.now().isoformat()
            }
            
            response = (
                self.client.table("simulation_realtime")
                .update(data)
                .eq("user_id", user_id)
                .execute()
            )
            
            if response.data:
                print(f"✅ Session marked inactive for user {user_id}")
                return True
            else:
                return False
                
        except Exception as e:
            print(f"❌ Error marking session inactive: {e}")
            return False
            
    def get_active_sessions(self) -> List[str]:
        """
        Get list of all active user sessions
        
        Returns:
            List of user_ids with active sessions
        """
        try:
            response = (
                self.client.table("simulation_realtime")
                .select("user_id")
                .eq("is_active", True)
                .execute()
            )
            
            if response.data:
                return [row["user_id"] for row in response.data]
            else:
                return []
                
        except Exception as e:
            print(f"❌ Error getting active sessions: {e}")
            return []
    
    def get_user_sessions(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get all simulation sessions for a user
        
        Args:
            user_id: User identifier
            limit: Maximum number of sessions to return
            
        Returns:
            List of session summaries with stats
        """
        try:
            # Get distinct sessions with lap count and best lap
            response = (
                self.client.table("simulation_lap_history")
                .select("session_id, lap_number, lap_time, timestamp")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(limit * 50)  # Get more laps to cover multiple sessions
                .execute()
            )
            
            if not response.data:
                return []
            
            # Group by session
            sessions = {}
            for lap in response.data:
                session_id = lap.get("session_id", "unknown")
                if session_id not in sessions:
                    sessions[session_id] = {
                        "session_id": session_id,
                        "lap_count": 0,
                        "best_lap": float('inf'),
                        "last_timestamp": lap.get("timestamp")
                    }
                
                sessions[session_id]["lap_count"] += 1
                lap_time = lap.get("lap_time", float('inf'))
                if lap_time < sessions[session_id]["best_lap"]:
                    sessions[session_id]["best_lap"] = lap_time
            
            # Convert to list and sort by timestamp
            session_list = list(sessions.values())
            session_list.sort(key=lambda x: x.get("last_timestamp", ""), reverse=True)
            
            return session_list[:limit]
            
        except Exception as e:
            print(f"❌ Error getting user sessions: {e}")
            return []
    
    def get_session_laps(self, user_id: str, session_id: str) -> List[Dict[str, Any]]:
        """
        Get all laps for a specific session
        
        Args:
            user_id: User identifier
            session_id: Session identifier
            
        Returns:
            List of lap data for the session
        """
        try:
            response = (
                self.client.table("simulation_lap_history")
                .select("*")
                .eq("user_id", user_id)
                .eq("session_id", session_id)
                .order("lap_number", desc=False)
                .execute()
            )
            
            return response.data if response.data else []
            
        except Exception as e:
            print(f"❌ Error getting session laps: {e}")
            return []

