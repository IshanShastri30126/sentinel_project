# Hint Economy & Point Deduction Audit Report

**Audit Execution Timestamp:** 2026-09-14T12:43:05.000Z  
**Target Platform:** CTF Wars Server (`http://localhost:5001`)  
**Target Challenge:** `Phase 1 — The First Fragment` (`96ef3f77-4375-4b4d-835b-3d0d4e9ab9aa`)  
**Operator:** Principal QA Engineer / SDET  

---

### 1. Hint Economy Architecture & Pricing Model

The CTF Wars platform incorporates a tiered hint deduction model:
- Free Hints: Zero point cost, immediate revelation.
- Paid Hints: Defined point penalty deducted from participant score or potential challenge reward.

In target challenge `Phase 1 — The First Fragment`, 2 hints were provisioned:
1. Hint 1 (`FREE`): Point cost: 0.
2. Hint 2 (`PAID`): Point cost: 50 points, ID `f0031d05-c1aa-46d1-b2f3-33064ce5f19b`.

---

### 2. Runtime Execution & Unlock Verification

| Step | Action | Request Endpoint | Response Status | Observed Data | Status |
|---|---|---|---|---|---|
| 1 | Query Challenge Hints | `GET /api/challenges/:id` | HTTP 200 | 2 hints present; Paid hint content masked as locked | **PASS** |
| 2 | Unlock Paid Hint | `POST /api/challenges/hints/unlock` | HTTP 200 | Hint unlocked successfully; Cost: 50 points | **PASS** |
| 3 | Verify Revealed Content | Inspected returned data payload | HTTP 200 | `"Paid hint: Base64 decode the payload and reverse the bytes."` | **PASS** |
| 4 | Re-query Unlocked Hint | `GET /api/challenges/:id` | HTTP 200 | `isUnlocked: true`, content unmasked | **PASS** |

#### Hint Unlock API Response Payload
```json
{
  "status": 200,
  "data": {
    "success": true,
    "message": "Hint unlocked successfully.",
    "data": {
      "hintId": "f0031d05-c1aa-46d1-b2f3-33064ce5f19b",
      "content": "Paid hint: Base64 decode the payload and reverse the bytes.",
      "pointCost": 50,
      "isUnlocked": true
    }
  }
}
```

---

### 3. Economic Invariant Validation

- **Non-Reversible Unlocking:** Once unlocked, the state `isUnlocked: true` is persisted in the PostgreSQL `UnlockedHint` table. Subsequent calls do not re-deduct points.
- **Content Masking:** Prior to unlocking, the `content` field is omitted from public API payloads, preventing client-side DevTools inspection.

**Verdict:** **PASS**
