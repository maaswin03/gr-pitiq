"""
Background Scheduler for GR PitIQ Simulation
Runs simulation updates every 2 seconds independently of API requests
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from typing import Dict
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from simulation.sim_engine import SimulationEngine
from simulation.supabase_service import SupabaseService


class SimulationScheduler:
    """
    Manages background simulation updates for all active users
    Updates every 2 seconds, stores to Supabase automatically
    """
    
    def __init__(self):
        """Initialize scheduler and services"""
        self.scheduler = BackgroundScheduler()
        self.supabase_service = SupabaseService()
        
        # Active simulation instances keyed by user_id
        self.active_simulations: Dict[str, SimulationEngine] = {}
        
        # Track lap completion for history storage
        self.last_lap_numbers: Dict[str, int] = {}
        
        print("✅ Simulation scheduler initialized")
        
    def start_simulation(self, user_id: str, track: str = "Barber", config: Dict = None) -> bool:
        """
        Start a new simulation for a user
        
        Args:
            user_id: Unique user identifier
            track: Track name (default "Barber")
            config: User configuration dictionary (optional)
            
        Returns:
            bool: True if started successfully
        """
        try:
            # Stop and clean up any existing simulation for this user
            if user_id in self.active_simulations:
                print(f"⚠️  Stopping existing simulation for user {user_id}")
                old_sim = self.active_simulations[user_id]
                old_sim.stop()
                del self.active_simulations[user_id]
                if user_id in self.last_lap_numbers:
                    del self.last_lap_numbers[user_id]
            
            # Clean up old session data
            self.supabase_service.delete_user_session(user_id)
            
            # Check if scheduler needs recreation (multiple checks for robustness)
            needs_recreation = False
            
            # Check 1: Scheduler stopped flag
            if hasattr(self.scheduler, '_stopped') and self.scheduler._stopped:
                print("⚠️  Scheduler stopped flag detected")
                needs_recreation = True
            
            # Check 2: Executor pool shutdown
            try:
                if self.scheduler._executors.get('default'):
                    executor = self.scheduler._executors.get('default')
                    if hasattr(executor, '_pool') and executor._pool._shutdown:
                        print("⚠️  Executor pool shutdown detected")
                        needs_recreation = True
            except Exception as e:
                print(f"⚠️  Executor check failed: {e}")
                needs_recreation = True
            
            # If recreation needed, cleanly shutdown and create new scheduler
            if needs_recreation:
                try:
                    # Remove all jobs first
                    self.scheduler.remove_all_jobs()
                    # Force shutdown
                    self.scheduler.shutdown(wait=False)
                except Exception as e:
                    print(f"⚠️  Error during scheduler cleanup: {e}")
                
                # Create fresh scheduler
                print("✨ Creating new scheduler instance")
                self.scheduler = BackgroundScheduler()
            
            # Create new simulation engine with user config
            sim_engine = SimulationEngine(user_id=user_id, track=track, config=config)
            sim_engine.start()
            
            # Store in active simulations
            self.active_simulations[user_id] = sim_engine
            self.last_lap_numbers[user_id] = 1
            
            # Start scheduler if not running
            if not self.scheduler.running:
                try:
                    self.scheduler.add_job(
                        func=self._update_all_simulations,
                        trigger=IntervalTrigger(seconds=2),
                        id="simulation_update_job",
                        name="Update all active simulations",
                        replace_existing=True
                    )
                    self.scheduler.start()
                    print("🚀 Background scheduler started")
                except RuntimeError as e:
                    if "shutdown" in str(e).lower():
                        # Scheduler was shutdown, recreate it
                        print("⚠️  Recreating scheduler after shutdown error")
                        self.scheduler = BackgroundScheduler()
                        self.scheduler.add_job(
                            func=self._update_all_simulations,
                            trigger=IntervalTrigger(seconds=2),
                            id="simulation_update_job",
                            name="Update all active simulations",
                            replace_existing=True
                        )
                        self.scheduler.start()
                        print("🚀 Background scheduler recreated and started")
                    else:
                        raise
            
            # Immediately save initial state to avoid 404 errors
            initial_snapshot = sim_engine.get_snapshot()
            if initial_snapshot:
                self.supabase_service.save_realtime_snapshot(
                    user_id=user_id,
                    snapshot=initial_snapshot,
                    engineered_features=initial_snapshot.get("engineered_features", {}),
                    max_laps=sim_engine.max_laps,
                    session_id=sim_engine.session_id
                )
                print(f"✅ Initial state saved for user {user_id} (session: {sim_engine.session_id})")
            
            print(f"✅ Simulation started for user {user_id} on {track}")
            return True
            
        except Exception as e:
            print(f"❌ Error starting simulation for user {user_id}: {e}")
            import traceback
            traceback.print_exc()
            return False
            
    def update_simulation(self, user_id: str, config: Dict) -> bool:
        """
        Update configuration for an active simulation
        
        Args:
            user_id: User identifier
            config: New configuration dictionary
            
        Returns:
            bool: True if updated successfully
        """
        try:
            if user_id not in self.active_simulations:
                print(f"⚠️  No active simulation for user {user_id}")
                return False
                
            # Update the simulation engine config
            sim_engine = self.active_simulations[user_id]
            success = sim_engine.update_config(config)
            
            if success:
                print(f"✅ Configuration updated for user {user_id}")
            
            return success
            
        except Exception as e:
            print(f"❌ Error updating simulation config for user {user_id}: {e}")
            return False
    
    def pit_stop(self, user_id: str) -> Dict:
        """
        Execute manual pit stop for user's simulation
        
        Args:
            user_id: User identifier
            
        Returns:
            Dict with pit stop result
        """
        try:
            if user_id not in self.active_simulations:
                return {
                    "success": False,
                    "error": "No active simulation found"
                }
                
            # Execute pit stop
            sim_engine = self.active_simulations[user_id]
            result = sim_engine.pit_stop()
            
            return result
            
        except Exception as e:
            print(f"❌ Error executing pit stop for user {user_id}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def resume(self, user_id: str) -> Dict:
        """
        Resume simulation after pit stop
        
        Args:
            user_id: User identifier
            
        Returns:
            Dict with resume result
        """
        try:
            if user_id not in self.active_simulations:
                return {
                    "success": False,
                    "error": "No active simulation found"
                }
                
            # Resume simulation
            sim_engine = self.active_simulations[user_id]
            result = sim_engine.resume()
            
            return result
            
        except Exception as e:
            print(f"❌ Error resuming simulation for user {user_id}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def stop_simulation(self, user_id: str) -> bool:
        """
        Stop simulation for a user
        
        Args:
            user_id: User identifier
            
        Returns:
            bool: True if stopped successfully
        """
        try:
            if user_id not in self.active_simulations:
                print(f"⚠️  No active simulation for user {user_id}")
                return False
                
            # Stop the simulation engine
            sim_engine = self.active_simulations[user_id]
            sim_engine.stop()
            
            # Mark session as inactive in DB
            self.supabase_service.mark_session_inactive(user_id)
            
            # Remove from active simulations
            del self.active_simulations[user_id]
            if user_id in self.last_lap_numbers:
                del self.last_lap_numbers[user_id]
                
            # Stop scheduler if no active simulations
            if len(self.active_simulations) == 0:
                try:
                    # Remove ALL jobs first before shutting down
                    self.scheduler.remove_all_jobs()
                    print("✅ Removed all scheduler jobs")
                except Exception as e:
                    print(f"⚠️  Could not remove jobs: {e}")
                
                try:
                    # Pause scheduler to prevent new job submissions
                    if self.scheduler.running:
                        self.scheduler.pause()
                        print("⏸️  Paused scheduler")
                except Exception as e:
                    print(f"⚠️  Could not pause scheduler: {e}")
                
                try:
                    # Now shutdown
                    self.scheduler.shutdown(wait=False)
                    print("🛑 Background scheduler stopped (no active simulations)")
                except Exception as e:
                    print(f"⚠️  Error during scheduler shutdown: {e}")
                
            print(f"✅ Simulation stopped for user {user_id}")
            return True
            
        except Exception as e:
            print(f"❌ Error stopping simulation for user {user_id}: {e}")
            return False
            
    def _update_all_simulations(self):
        """
        Update all active simulations (called every 2 seconds by scheduler)
        This is the main background task
        """
        try:
            # Safety check: don't run if scheduler is stopped
            if not self.scheduler.running:
                print("⚠️  Scheduler stopped, skipping update")
                return
            
            # Check if executor is shutdown
            try:
                executor = self.scheduler._executors.get('default')
                if executor and hasattr(executor, '_pool') and executor._pool._shutdown:
                    print("⚠️  Executor shutdown detected, stopping updates")
                    return
            except Exception:
                pass  # Continue if check fails
                
            if not self.active_simulations:
                return
        except Exception as e:
            print(f"⚠️  Pre-update check failed: {e}")
            return
            
        for user_id, sim_engine in list(self.active_simulations.items()):
            try:
                # Check if simulation has completed (is_running = False)
                if not sim_engine.is_running:
                    print(f"🏁 Simulation completed for user {user_id}, cleaning up...")
                    self.supabase_service.mark_session_inactive(user_id)
                    del self.active_simulations[user_id]
                    if user_id in self.last_lap_numbers:
                        del self.last_lap_numbers[user_id]
                    continue
                
                # Update simulation (2 second delta)
                snapshot = sim_engine.update(delta_time=2.0)
                
                if snapshot is None:
                    continue
                    
                # Save real-time state to Supabase
                self.supabase_service.save_realtime_snapshot(
                    user_id=user_id,
                    snapshot=snapshot,
                    engineered_features=snapshot.get("engineered_features", {}),
                    max_laps=sim_engine.max_laps,
                    session_id=sim_engine.session_id
                )
                
                # Check if lap was completed
                current_lap = sim_engine.current_lap
                if current_lap > self.last_lap_numbers.get(user_id, 1):
                    # Lap completed - save to history with session_id
                    lap_data = sim_engine.get_lap_data_for_history()
                    
                    if lap_data:
                        self.supabase_service.save_completed_lap(
                            user_id=user_id,
                            lap_number=lap_data["lap_number"],
                            lap_data=lap_data,
                            engineered_features=lap_data.get("engineered_features", {}),
                            session_id=sim_engine.session_id
                        )
                        
                    # Update last lap number
                    self.last_lap_numbers[user_id] = current_lap
                    
            except Exception as e:
                print(f"❌ Error updating simulation for user {user_id}: {e}")
                # Continue to next user instead of crashing
        
        # Check if all simulations completed and stop scheduler
        if len(self.active_simulations) == 0:
            try:
                # Remove ALL jobs first before shutting down
                self.scheduler.remove_all_jobs()
                print("✅ Removed all scheduler jobs")
            except Exception as e:
                print(f"⚠️  Could not remove jobs: {e}")
            
            try:
                # Pause scheduler to prevent new job submissions
                if self.scheduler.running:
                    self.scheduler.pause()
                    print("⏸️  Paused scheduler")
            except Exception as e:
                print(f"⚠️  Could not pause scheduler: {e}")
            
            try:
                # Now shutdown
                self.scheduler.shutdown(wait=False)
                print("🛑 Background scheduler stopped (all simulations completed)")
            except Exception as e:
                print(f"⚠️  Error during scheduler shutdown: {e}")
                
    def get_active_users(self) -> list:
        """Get list of users with active simulations"""
        return list(self.active_simulations.keys())
        
    def is_simulation_active(self, user_id: str) -> bool:
        """Check if a user has an active simulation"""
        return user_id in self.active_simulations
        
    def get_simulation_status(self, user_id: str) -> dict:
        """
        Get status information for a user's simulation
        
        Args:
            user_id: User identifier
            
        Returns:
            Status dict with current state info
        """
        if user_id not in self.active_simulations:
            return {
                "active": False,
                "message": "No active simulation"
            }
            
        sim_engine = self.active_simulations[user_id]
        
        return {
            "active": True,
            "is_running": sim_engine.is_running,
            "current_lap": sim_engine.current_lap,
            "current_sector": sim_engine.current_sector,
            "track": sim_engine.track,
            "uptime_seconds": sim_engine.start_time and (sim_engine.start_time - sim_engine.start_time),
            "total_laps_completed": len(sim_engine.lap_history)
        }


# Global scheduler instance (singleton)
_scheduler_instance = None


def get_scheduler() -> SimulationScheduler:
    """Get or create the global scheduler instance"""
    global _scheduler_instance
    if _scheduler_instance is None:
        _scheduler_instance = SimulationScheduler()
    return _scheduler_instance
