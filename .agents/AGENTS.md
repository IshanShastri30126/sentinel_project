# Workspace Rules & Instructions

## Automatic Git Commit & Push Rule
- **Mandatory Workflow**: Whenever completing any task or modification requested by the user, automatically stage all modified and new files (`git add .`), create a clear, descriptive commit message, and push changes directly to the remote repository (`https://github.com/IshanShastri30126/Chakravyuhclub.git`).
- **No Confirmation Prompt Needed**: Do not ask for permission before staging, committing, or pushing project work after completion.
- **Git Binary Path**: On this Windows environment, use `& "C:\Program Files\Git\cmd\git.exe"` if standard `git` command is not in PATH.

## Mandatory OWASP Secure Coding Practices Rule
- **Mandatory Security Rule**: Apply all security constraints from the OWASP-based 67-page Secure Coding Practices guide ([SKILL.md](file:///a:/SENITINAL-MAIN%C2%A9/.agents/skills/secure-coding-practices/SKILL.md)) across ALL project development, website creation, API design, database queries, and system configuration without requiring explicit user instructions.
- **Core Security Directives**:
  1. **Input Validation**: Server-side validation, allowlists, canonicalization, reject invalid input, screen hazardous chars (`< > ' " % ( ) & + \`), null bytes (`%00`), traversal (`../`).
  2. **Output Encoding**: Contextual output encoding (HTML body/attr, JS, CSS, URL) to prevent XSS.
  3. **Authentication & Passwords**: Server-side auth, generic failure messages ("Invalid username or password"), bcrypt/argon2id password hashing, rate limiting, lockout, POST-only credential transport.
  4. **Session Management**: Server-generated CSPRNG session IDs, `HttpOnly`, `Secure`, `SameSite` cookies, short timeouts, ID rotation on auth state change, anti-CSRF tokens.
  5. **Access Control**: Deny by default, server-side authorization checks on EVERY request, IDOR protection, least privilege service accounts.
  6. **Cryptographic Practices**: Server-side crypto, CSPRNG, FIPS 140-3 approved algorithms (AES-GCM, RSA/ECC, SHA-256), encrypted credential storage (never hardcoded in code).
  7. **Error Handling & Logging**: Generic error pages, suppress stack traces/db details, audit logging of auth/access/validation events with UTC timestamp/IP/identity/outcome, sanitize log inputs, NO sensitive data in logs.
  8. **Data Protection**: Encryption at rest, purge temp files, `Cache-Control: no-store` on sensitive responses, no sensitive data in GET params or client JS storage.
  9. **Communication Security**: Mandatory TLS 1.2+ for data in transit, valid certificates, strip sensitive params from `Referer` header.
  10. **System Configuration**: Disable directory listing (403), remove unused endpoints/test code, suppress `Server`/`X-Powered-By` headers, restrict HTTP methods.
  11. **Database Security**: Strongly typed parameterized queries (prepared statements) for ALL database interactions to eliminate SQL injection, lowest privilege DB users, close DB connections immediately.
  12. **File Management**: Authenticated uploads, allowlist extensions & headers, store files outside web root, disable execution on upload dirs, UUID filenames, relative paths only.
  13. **Memory Management**: Bounded string functions, explicit resource deallocation at exit points, overflow prevention.
  14. **General Coding Practices**: Built-in language APIs instead of OS shell execution (`eval`/`exec`), explicit variable initialization, locking for shared resources, dependency vulnerability auditing.

## Mandatory Network Inspection Protection & Security Workflow
- **Network Inspection Protection Enabled**: For any change made in the project (JS/TS, JSON, API routes, or client pages), ensure Network Inspection Protection is actively enforced:
  - Strict Content-Security-Policy (CSP) restricting network connections (`connect-src`), frame embedding, script execution, and resource loads.
  - Disable browser source maps in production (`productionBrowserSourceMaps: false`) to prevent DevTools source inspection.
  - Strict `Cache-Control: no-store, no-cache, must-revalidate, private` on sensitive routes/APIs/dashboard responses to prevent caching and inspection.
  - Payload sanitization and defense against network data leakage (strip sensitive tokens, passwords, server internals from network responses).
  - Production console log sanitization (no credentials, tokens, or PII exposed to browser console/network inspectors).
- **Mandatory Workflow**:
  1. Make required changes in code (JS/TS, JSON, Backend, Frontend).
  2. Ensure Network Inspection Protection, OWASP Secure Coding Rules, and constraints are strictly satisfied.
  3. Automatically stage all changes (`git add .`), commit with a descriptive message, and push to GitHub repository.

role based profile management in faculty studentid should be replaced by the employee id and the semester column will be removed .

new constraint the 
mobile number section in any form exactly 10 integer input , no string or character should returned .