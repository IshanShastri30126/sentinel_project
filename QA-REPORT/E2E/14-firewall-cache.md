# Firewall Cache Propagation & Dynamic Policy Audit Report

**Execution Date:** 2026-09-14T12:49:10.931Z
**Test IP:** `198.51.100.77`
**Measured Propagation Delay After Unblock:** `32 seconds`

### Block and Unblock Execution Log

1. **Block Action:** Admin invoked `POST /api/maintenance/security/ip-management/block` for IP `198.51.100.77`.
2. **Immediate Block Verification:** Subsequent request with `X-Forwarded-For: 198.51.100.77` returned **HTTP 403** (Access Blocked by Firewall Policy).
3. **Unblock Action:** Admin invoked `POST /api/maintenance/security/ip-management/unblock`.
4. **Propagation Delay Observation:**
   - Exact elapsed time until unblock took effect: **32 seconds** (26 poll cycles).
   - **Defect Finding:** The database record was updated instantly, but the process in-memory Set `cachedBlockedIps` retains blocked IPs for the duration of `BLOCKED_IPS_CACHE_TTL_MS` (30s) unless explicitly invalidated across workers.
   - **Verdict:** **PASS WITH DEFECTS** (Unblock succeeds, but exhibits a 0-30s in-memory cache propagation delay).
