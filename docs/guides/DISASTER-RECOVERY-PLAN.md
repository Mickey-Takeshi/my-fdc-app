# Disaster Recovery Plan

## 1. 3-Layer Architecture Backup Overview

FDC Modular Starter follows a 3-layer architecture. Each layer has its own backup and recovery strategy.

| Layer | Technology | Backup Method | RPO (Recovery Point Objective) |
|-------|-----------|---------------|-------------------------------|
| Frontend | Next.js on Vercel | Git repository + Vercel deployments | RPO = 0 (every commit is preserved) |
| Backend (API) | Next.js API Routes on Vercel | Git repository + Vercel deployments | RPO = 0 (every commit is preserved) |
| Database | Supabase PostgreSQL | Supabase automatic backups | RPO = 24h (Free plan daily backups) |

### Key Insight

Frontend and backend code has zero data loss risk because every change is committed to Git and every deployment is preserved in Vercel's deployment history. The primary risk area is the database layer.

---

## 2. Git Rollback Procedures

### Revert a Specific Commit (Safe -- Creates New Commit)

```bash
# Revert the most recent commit
git revert HEAD

# Revert a specific commit by hash
git revert <commit-hash>

# Revert without auto-committing (to review changes first)
git revert --no-commit <commit-hash>
```

Use `git revert` when:
- The problematic commit is already pushed to the remote.
- You want to preserve the full history.
- Other team members may have pulled the commit.

### Reset to a Previous State (Destructive -- Rewrites History)

```bash
# Soft reset: undo commit but keep changes staged
git reset --soft <commit-hash>

# Mixed reset: undo commit and unstage changes (default)
git reset <commit-hash>

# Hard reset: undo commit and discard all changes
git reset --hard <commit-hash>
```

Use `git reset` only when:
- The commit has NOT been pushed to the remote.
- You are the only one working on the branch.
- You understand the changes will be lost (for `--hard`).

**Warning**: Never force push to `main` after a reset without team coordination.

---

## 3. Vercel Deployment Rollback

### Instant Rollback via Dashboard

1. Go to the Vercel dashboard for the FDC project.
2. Navigate to the **Deployments** tab.
3. Find the last known good deployment.
4. Click the three-dot menu and select **Promote to Production**.

This instantly switches production traffic to the selected deployment without a new build.

### Rollback via CLI

```bash
# List recent deployments
vercel ls

# Promote a specific deployment to production
vercel promote <deployment-url>
```

### Rollback Timing

- Vercel rollback is instant (no rebuild required).
- The previous deployment is already built and cached.
- DNS propagation is not needed since the domain stays the same.

---

## 4. Supabase Backup Strategy

### Free Plan

- **Automatic Backups**: Daily backups, retained for 7 days.
- **RPO**: 24 hours (you may lose up to 24 hours of data).
- **Restore**: Contact Supabase support or restore from the dashboard.
- **Limitations**: No PITR, no custom backup schedule.

### Pro Plan ($25/month per project)

- **Automatic Backups**: Daily backups, retained for 7 days.
- **RPO**: 24 hours (same as Free without PITR add-on).
- **Additional**: Access to PITR as a paid add-on.

### Team Plan ($599/month)

- **Automatic Backups**: Daily backups, retained for 14 days.
- **RPO**: Can be reduced to minutes with PITR.
- **Additional**: Priority support for restore operations.

---

## 5. Point-in-Time Recovery (PITR)

### What is PITR?

PITR allows you to restore the database to any specific point in time, not just the daily backup snapshots. This is critical for recovering from accidental data deletion or corruption.

### Requirements

- Pro plan or higher.
- PITR add-on enabled (separate pricing based on compute size).
- WAL (Write-Ahead Logging) archiving enabled (automatic with the add-on).

### Pricing (as of 2025)

| Compute Size | PITR Add-on Cost |
|-------------|-----------------|
| Small | $100/month |
| Medium | $100/month |
| Large | $200/month |

### Usage

1. Go to Supabase Dashboard > Database > Backups > Point in Time.
2. Select the target date and time.
3. Initiate the restore (creates a new project or restores in-place depending on the plan).

### Recommendation

For production workloads with user data, PITR is strongly recommended. The cost is justified by the ability to recover from human error (accidental DELETE without WHERE clause, bad migration, etc.).

---

## 6. Environment Variable Backup Strategy

### Risk

Environment variables (.env files) are NOT committed to Git. Loss of these values can prevent the application from functioning.

### Backup Approach

1. **Vercel Environment Variables**: Stored in Vercel's dashboard. Export them periodically.
   ```bash
   # Export current env vars via Vercel CLI
   vercel env ls
   vercel env pull .env.local
   ```

2. **Document Required Variables**: The `.env.example` file lists all required variables with placeholder values. Keep this updated.

3. **Secure Storage**: Store actual production values in a password manager (1Password, Bitwarden, etc.) or a secure vault.

4. **Team Access**: Ensure at least two team members have access to production environment variables.

### Required Environment Variables for FDC

Reference `.env.example` for the full list. Critical variables include:

- `NEXT_PUBLIC_SUPABASE_URL` -- Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` -- Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` -- Supabase service role key (server-side only)
- `GOOGLE_CLIENT_ID` -- Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` -- Google OAuth client secret
- `RESEND_API_KEY` -- Email service API key

---

## 7. DR Plan Template

### Scenario 1: Deploy Failure

| Item | Detail |
|------|--------|
| **Trigger** | Vercel build fails or deployment causes errors |
| **Detection** | Vercel build notifications, error monitoring, user reports |
| **Response** | Rollback to previous deployment via Vercel dashboard |
| **Recovery Time** | Less than 5 minutes |
| **Steps** | 1. Confirm the issue in Vercel build logs. 2. Promote the last known good deployment. 3. Investigate and fix the issue on a branch. 4. Deploy the fix after testing. |

### Scenario 2: Database Failure

| Item | Detail |
|------|--------|
| **Trigger** | Supabase outage, data corruption, accidental deletion |
| **Detection** | Health check API failure, Supabase status page, user reports |
| **Response** | Restore from latest backup or PITR |
| **Recovery Time** | 30 minutes to 2 hours (depending on data size and plan) |
| **Steps** | 1. Check Supabase status page for platform-wide outages. 2. If data issue, restore from daily backup (Free) or PITR (Pro+). 3. Verify data integrity after restore. 4. Re-run any migrations if needed. 5. Notify affected users. |

### Scenario 3: Environment Variable Loss

| Item | Detail |
|------|--------|
| **Trigger** | Vercel project reset, accidental deletion of env vars |
| **Detection** | Application errors (auth failures, API connection errors) |
| **Response** | Restore from secure backup |
| **Recovery Time** | 15-30 minutes |
| **Steps** | 1. Identify which variables are missing from error logs. 2. Retrieve values from password manager or secure vault. 3. Re-add variables in Vercel dashboard. 4. Trigger a redeployment. 5. Verify the application functions correctly. |

### Scenario 4: Git Repository Loss

| Item | Detail |
|------|--------|
| **Trigger** | Repository deletion, corruption |
| **Detection** | Unable to push/pull, GitHub notification |
| **Response** | Restore from local clones or GitHub support |
| **Recovery Time** | 15 minutes to 24 hours |
| **Steps** | 1. Check if any team member has a recent local clone. 2. Contact GitHub support for repository restoration. 3. If no backup exists, recreate from the latest Vercel deployment source. |

---

## 8. Free Plan Manual Backup with pg_dump

For Free plan users without PITR, manual backups using `pg_dump` provide additional protection.

### Prerequisites

- PostgreSQL client tools installed (`pg_dump` command available).
- Supabase database connection string (found in Supabase Dashboard > Settings > Database).

### Backup Command

```bash
# Full database dump
pg_dump "postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres" \
  --format=custom \
  --no-owner \
  --no-privileges \
  -f backup_$(date +%Y%m%d_%H%M%S).dump

# Schema only (for migration reference)
pg_dump "postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres" \
  --schema-only \
  --no-owner \
  -f schema_$(date +%Y%m%d_%H%M%S).sql

# Data only (for data migration)
pg_dump "postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres" \
  --data-only \
  --no-owner \
  -f data_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Command

```bash
# Restore to a new Supabase project or local PostgreSQL
pg_restore \
  --dbname="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres" \
  --no-owner \
  --no-privileges \
  backup_YYYYMMDD_HHMMSS.dump
```

### Automation (Cron Job)

```bash
# Add to crontab for daily backups at 2:00 AM
0 2 * * * /path/to/backup-script.sh >> /var/log/fdc-backup.log 2>&1
```

### Backup Script Example

```bash
#!/bin/bash
BACKUP_DIR="$HOME/fdc-backups"
DB_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

pg_dump "$DB_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  -f "$BACKUP_DIR/backup_$DATE.dump"

# Keep only the last 7 days of backups
find "$BACKUP_DIR" -name "backup_*.dump" -mtime +7 -delete

echo "Backup completed: backup_$DATE.dump"
```

### Important Notes

- Store backups in a separate location from the database (different cloud provider or local storage).
- Test restore procedures periodically to ensure backups are valid.
- Encrypt backups if they contain sensitive user data.
- The database connection string contains the password -- keep it secure and do not commit it to Git.
