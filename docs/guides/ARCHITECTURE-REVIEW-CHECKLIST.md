# Architecture Review Checklist

Phase 32 で導入した設計レビュー観点。PR レビューや四半期レビューで活用する。

## 9 Design Review Perspectives

### 1. Data Model & Domain Design
- [ ] Data structure can be explained in one sentence
- [ ] No duplicate data management
- [ ] Clear entity relationships

### 2. API Design (Boundaries & Contracts)
- [ ] One endpoint, one responsibility
- [ ] Appropriate response granularity
- [ ] Consistent naming conventions (REST)

### 3. Cache & Read Patterns
- [ ] Cache strategy is defined (where and how long)
- [ ] Avoid over-fetching
- [ ] Loading states handled properly

### 4. Write Patterns & Consistency
- [ ] Transaction boundaries defined for cross-table updates
- [ ] Concurrent update behavior is documented
- [ ] Idempotent write operations

### 5. Error Handling & Fallback
- [ ] User knows what to do next on error
- [ ] Graceful degradation for external API failures
- [ ] Network error recovery path exists

### 6. Multi-tenant & Security
- [ ] Tenant boundary is enforced (workspace_id)
- [ ] RBAC rules are clear (OWNER/ADMIN/MEMBER)
- [ ] RLS policies match application logic

### 7. Extensibility
- [ ] Schema can accommodate feature additions
- [ ] API design won't break with new features
- [ ] Component structure supports composition

### 8. Observability (Logs & Metrics)
- [ ] Key operations are logged (Pino)
- [ ] Error context is captured
- [ ] Health check endpoint exists (/api/health)

### 9. Final Review (12 items)
1. [ ] Data structure explainable without diagrams
2. [ ] All business data has workspace_id
3. [ ] APIs follow "one endpoint, one responsibility"
4. [ ] Use-case APIs vs resource APIs are organized
5. [ ] Cache strategy is decided
6. [ ] Cross-table updates have transaction design
7. [ ] Concurrent update behavior is documented
8. [ ] Main write paths are idempotent
9. [ ] Error messages tell user what to do next
10. [ ] Tenant boundary rules fit on one page
11. [ ] Schema and API can handle additions in 6 months
12. [ ] Monitoring metrics and logs are defined
