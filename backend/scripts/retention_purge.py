"""
Cipherium AI - Automated Data Retention & Privacy Purge Utility (NFR-PRIV-01)

Purges historical AI Tutor chat transcripts older than a configurable retention window
(default 90 days) for users who have disabled conversation retention in their privacy settings
(or globally when requested).

Usage:
  python backend/scripts/retention_purge.py [--days 90] [--dry-run] [--all]
"""

import argparse
import sys
import os
from datetime import datetime, timedelta, timezone

# Ensure backend package can be imported regardless of execution path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import TutorMessage, UserSettings, User


def purge_stale_tutor_messages(
    db: Session,
    days: int = 90,
    dry_run: bool = False,
    only_opted_out: bool = True,
) -> int:
    """
    Deletes TutorMessage rows older than `days` days.
    
    Args:
        db: Active SQLAlchemy database session.
        days: Retention window in days (default 90).
        dry_run: If True, calculates records eligible for deletion without deleting them.
        only_opted_out: If True, restricts purge to users with notification_retention == False.
                        If False, purges all messages older than the retention threshold.
                        
    Returns:
        int: Number of deleted (or identified) message rows.
    """
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)

    query = db.query(TutorMessage).filter(TutorMessage.created_at < cutoff_date)

    if only_opted_out:
        # Subquery users with notification_retention disabled
        opted_out_user_ids = (
            db.query(UserSettings.user_id)
            .filter(UserSettings.notification_retention == False)
        )
        query = query.filter(TutorMessage.user_id.in_(opted_out_user_ids))

    count = query.count()

    if not dry_run and count > 0:
        query.delete(synchronize_session=False)
        db.commit()

    return count


def main():
    parser = argparse.ArgumentParser(description="Purge stale AI Tutor transcripts per data retention policy.")
    parser.add_argument("--days", type=int, default=90, help="Retention period threshold in days (default: 90).")
    parser.add_argument("--dry-run", action="store_true", help="Simulate purge without deleting records.")
    parser.add_argument("--all", action="store_true", help="Purge messages for all users, not just opted-out users.")
    args = parser.parse_args()

    db: Session = SessionLocal()
    try:
        only_opted_out = not args.all
        mode_str = "OPTED-OUT users" if only_opted_out else "ALL users"
        print(f"[*] Running data retention purge (threshold: {args.days} days, target: {mode_str}, dry_run={args.dry_run})...")

        deleted = purge_stale_tutor_messages(
            db=db,
            days=args.days,
            dry_run=args.dry_run,
            only_opted_out=only_opted_out,
        )

        status_prefix = "[SIMULATION] Eligible for purge" if args.dry_run else "[SUCCESS] Purged"
        print(f"{status_prefix}: {deleted} messages older than {args.days} days.")
    except Exception as exc:
        print(f"[ERROR] Data retention purge failed: {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
