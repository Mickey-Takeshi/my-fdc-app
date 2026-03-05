# Incident Response Guide

## Severity Levels

| Level | Description | Target Recovery Time |
|-------|-------------|---------------------|
| P1 | Full outage | 1 hour |
| P2 | Major feature broken | 4 hours |
| P3 | Minor issue | 24 hours |
| P4 | Enhancement request | Next release |

## Response Flow

1. **Detect**: Alert or user report
2. **Assess**: Determine severity and impact
3. **Respond**: Investigate and fix
4. **Recover**: Deploy fix and verify
5. **Report**: Create incident report

## Quick Actions

### Rollback Deployment
- Vercel Dashboard > Deployments > Select previous > Promote to Production

### Database Issues
- Check Supabase Dashboard > Database Health
- If data corruption: Use Point-in-time Recovery

### API Errors
- Check Vercel Functions logs
- Check Supabase API logs

## Postmortem Template
After every P1/P2 incident:
1. Timeline of events
2. Root cause analysis
3. Impact assessment
4. Corrective actions
5. Preventive measures
