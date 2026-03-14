# Backup & Disaster Recovery

## Backup Strategy

### Automatic Backups (Supabase)
- Daily backups (7-day retention)
- Point-in-time Recovery (Pro plan+)

### Manual Backup
```bash
# Export via Supabase Dashboard
# Project Settings > Database > Backups

# Or via pg_dump (requires connection string)
# pg_dump "postgresql://..." > backup_$(date +%Y%m%d).sql
```

## Recovery Procedures

### From Supabase Dashboard
1. Go to Project Settings > Database > Backups
2. Select the backup point
3. Click Restore

### Migration Rollback
Always prepare DOWN migration alongside UP migration.

## Data Retention Policy
| Data Type | Retention | Archive Strategy |
|-----------|-----------|-----------------|
| audit_logs | 90 days | Monthly archive to cold storage |
| tasks (completed) | Indefinite | No archival |
| system_metrics | 90 days | Monthly aggregation |
