---
name: secure-coding-practices
description: "OWASP-based Secure Coding Practices checklist (200+ test cases across 14 security categories) for web, database, system, and backend development."
---

# OWASP-Based Secure Coding Practices Checklist & Guidelines

This document establishes the mandatory security rules and constraints for all application, website, database, and system development across this workspace.

---

## 1. Input Validation
- **1.1 Server-Side Validation**: Conduct all data validation on a trusted server, never relying solely on client-side controls.
- **1.2 Data Source Classification**: Classify sources as trusted or untrusted. Validate all untrusted input (user forms, headers, external APIs, URL params).
- **1.3 Centralized Routine**: Use a centralized, reusable input validation module.
- **1.4 Character Encodings**: Standardize input character set to UTF-8 before validation.
- **1.5 Strict Failure Handling**: Any input validation failure MUST immediately result in request rejection.
- **1.6 Extended Encodings**: Validate input only after canonicalization and decoding (e.g. UTF-8 decoding).
- **1.7 Validate All Client Data**: Enforce validation for parameters, cookies, HTTP headers, query strings, and postback data.
- **1.8 Header Sanitization**: Ensure HTTP request and response header values contain only ASCII characters.
- **1.9 Redirect Validation**: Validate data coming from redirect targets before processing.
- **1.10 Type, Range & Length**: Enforce strict data type checking, range limits, and maximum length constraints.
- **1.11 Allowlist Approach**: Use positive allowlists (whitelists) of acceptable characters/formats over blocklists.
- **1.12 Hazardous Characters**: Handle hazardous characters (`< > ' " % ( ) & + \`) with proper escaping, output encoding, or rejection.
- **1.13 Specific Dangerous Inputs**: Explicitly screen for null bytes (`%00`), newline injection (`\r`, `\n`), and path traversal sequences (`../`, `..\`).

---

## 2. Output Encoding
- **2.1 Server-Side Encoding**: Perform all output encoding on trusted server components before sending data to clients.
- **2.2 Standardized Encoding Routines**: Use tested, standard encoding libraries for contextual outbound encoding.
- **2.3 Context-Aware Encoding**: Apply context-appropriate encoding based on output destination:
  - HTML Body (`&lt;`, `&gt;`, `&amp;`, `&quot;`, `&#x27;`)
  - HTML Attribute
  - JavaScript context
  - CSS context
  - URL parameters
- **2.4 Query Sanitization**: Contextually sanitize untrusted data before incorporating into SQL, XML, or LDAP queries.
- **2.5 OS Command Sanitization**: Sanitize untrusted data before passing to operating system commands.

---

## 3. Authentication and Password Management
- **3.1 Require Authentication**: Protect all non-public endpoints, pages, APIs, and resources behind authentication.
- **3.2 Server-Side Enforcment**: Enforce all authentication logic strictly on the server.
- **3.3 Standard Auth Protocols**: Use established, peer-reviewed authentication services/libraries (e.g. OAuth 2.0, OpenID Connect).
- **3.4 Centralized Mechanism**: Centralize all authentication handling across the application.
- **3.5 Segregated Auth Logic**: Keep authentication logic isolated from requested application resources.
- **3.6 Generic Failure Messages**: Provide generic error messages on authentication failure (e.g., "Invalid username or password") to prevent credential enumeration.
- **3.7 Equal Controls for Admin/Mgmt**: Apply equal or stronger security controls to administrative and account management features.
- **3.8 Secure Password Hashing**: Store passwords using cryptographically strong, salted, one-way adaptive hashes (e.g., argon2id, bcrypt, PBKDF2).
- **3.9 Server-Side Hashing**: Perform password hashing exclusively on the server.
- **3.10 Sequential Auth Validation**: Validate multi-step authentication data only after all required inputs are received.
- **3.11 External System Auth**: Require authentication and secure credentials for connecting to external systems.
- **3.12 Encrypted Credential Storage**: Store external API keys and DB credentials in encrypted environment configurations, never in source code.
- **3.13 HTTP POST for Credentials**: Transmit authentication credentials only via HTTP POST requests over encrypted TLS connections.
- **3.14 Password Complexity**: Enforce minimum password length (at least 8–12+ characters) and complexity requirements.
- **3.15 Obscure Entry**: Mask password inputs on user screens (`type="password"`).
- **3.16 Rate Limiting & Account Lockout**: Lock or rate-limit accounts after a specified number of consecutive invalid login attempts.
- **3.17 Secure Password Resets**: Send reset links/tokens with short expiration times exclusively to pre-registered email addresses.
- **3.18 Change Temporary Passwords**: Require immediate password change upon first login with a temporary password.
- **3.19 Notify User on Reset**: Send notification emails to users whenever password resets or security setting changes occur.
- **3.20 Prevent Password Reuse**: Discourage or enforce rules against reusing recent passwords.
- **3.21 Disable "Remember Me"**: Avoid storing raw credentials in browser local storage or persistent autocomplete fields.
- **3.22 Session & Account Audit**: Report last login activity and detect credential stuffing / multi-account attacks.
- **3.23 Re-authentication**: Require users to re-enter credentials before performing critical or sensitive operations.
- **3.24 Multi-Factor Authentication**: Implement MFA for sensitive, financial, or administrative accounts.

---

## 4. Session Management
- **4.1 Framework Session Management**: Use proven web framework session mechanisms rather than custom implementations.
- **4.2 Server-Side Session Creation**: Generate session identifiers exclusively on the server upon successful authentication.
- **4.3 Cryptographically Secure Session IDs**: Use cryptographically secure random number generators (CSPRNG) to generate unpredictably long session IDs.
- **4.4 Cookie Attributes**:
  - `HttpOnly`: Set to `true` to block client-side JavaScript access.
  - `Secure`: Set to `true` to transmit only over HTTPS connections.
  - `SameSite`: Set to `Strict` or `Lax` to mitigate CSRF attacks.
  - Restrict `Domain` and `Path` scope.
- **4.5 Session Termination on Logout**: Ensure logout completely invalidates the session server-side.
- **4.6 Session Timeouts**: Enforce short inactivity timeouts (e.g. 15-30 minutes) and absolute session expiration times.
- **4.7 Session Regeneration**: Regenerate session identifiers on authentication state changes (e.g., login, privilege escalation, password change, HTTP to HTTPS transition).
- **4.8 Prevent Concurrent Logins**: Terminate or prevent duplicate active sessions under the same user ID when policy requires.
- **4.9 Hide Session IDs**: Never expose session IDs in URLs, log files, or error messages.
- **4.10 CSRF Protection**: Implement strong, anti-CSRF tokens (per-request or per-session) for all state-changing state POST/PUT/DELETE endpoints.

---

## 5. Access Control
- **5.1 Server-Side Authorization**: Make all authorization decisions using server-side session objects.
- **5.2 Single Access Control Point**: Implement centralized authorization checks across all routes and API endpoints.
- **5.3 Deny by Default**: Default to denying access when authorization rules or configuration are unavailable or undefined.
- **5.4 Enforce on Every Request**: Perform explicit authorization verification on every request (REST APIs, GraphQL, server-rendered routes).
- **5.5 Segregate Privileged Logic**: Isolate administrative and privileged code modules from general user workflows.
- **5.6 Restrict Direct Object References (IDOR)**: Verify that the authenticated user owns or is authorized to access specific object IDs passed in URLs or payloads.
- **5.7 Data & Resource Protection**: Restrict access to files, URLs, system functions, user attributes, and configuration data based on least privilege.
- **5.8 Rate Limiting & Transaction Limits**: Enforce transaction limits and rate limits per user/IP to prevent automated abuse.
- **5.9 Re-Validate Privileges**: Periodically re-check user authorizations during long-running sessions.
- **5.10 Least Privilege Service Accounts**: Configure service accounts with minimal necessary permissions.

---

## 6. Cryptographic Practices
- **6.1 Server-Side Execution**: Perform all cryptographic operations on trusted server hardware/environments.
- **6.2 Protect Master Secrets**: Store cryptographic keys, master secrets, and certificates securely (e.g., KMS, environment secrets) outside code repositories.
- **6.3 Fail Securely**: Ensure cryptographic operations fail securely without revealing key material or state.
- **6.4 CSPRNG**: Use approved cryptographic random number generators for keys, tokens, salt, and nonces.
- **6.5 Standard Algorithms**: Use standard, up-to-date algorithms (e.g. AES-GCM, RSA-2048+, ECC, SHA-256+) complying with FIPS 140-3 standards.
- **6.6 Key Management**: Implement procedures for key generation, rotation, storage, and revocation.

---

## 7. Error Handling and Logging
- **7.1 Generic Error Responses**: Return friendly, generic error messages to clients; never expose raw stack traces, database schema errors, or system details.
- **7.2 Centralized Logging**: Implement a centralized logging framework on trusted server components.
- **7.3 Security Audit Logging**: Log both successes and failures for key security events:
  - Authentication attempts & password changes
  - Access control / authorization failures
  - Input validation failures
  - Tampering attempts & invalid session tokens
  - Admin actions & security setting modifications
  - Cryptographic and TLS connection failures
- **7.4 Log Structure & Metadata**: Include timestamp (UTC), severity level, user/account ID, client IP address, event outcome, and description in log entries.
- **7.5 Sanitize Log Data**: Sanitize and encode user input in log messages to prevent Log Injection / Log Forgery attacks.
- **7.6 NO Sensitive Data in Logs**: Exclude passwords, raw tokens, credit card numbers, PII, and session IDs from log files.
- **7.7 Restrict Log Access**: Secure log files against unauthorized access, tampering, or deletion.

---

## 8. Data Protection
- **8.1 Principle of Least Privilege**: Restrict user access strictly to the data and functionality needed for their tasks.
- **8.2 Encrypt Sensitive Data at Rest**: Use strong encryption for stored sensitive data (PII, credentials, payment info).
- **8.3 Purge Temporary Data**: Delete temporary or cached files containing sensitive data as soon as processing completes.
- **8.4 Protect Source Code**: Ensure server-side source code, configuration files, and scripts are protected from unauthorized download.
- **8.5 No Sensitive Data on Client**: Never store cleartext passwords, secret keys, or DB connection strings on client devices (e.g. LocalStorage, Cookies, JS variables).
- **8.6 Strip Sensitive Comments**: Remove code comments, internal IP addresses, and architecture notes from production code assets.
- **8.7 No GET Requests for Sensitive Data**: Do not pass sensitive fields or credentials in HTTP GET parameters to prevent URL/logging exposure.
- **8.8 Disable Caching for Sensitive Content**: Include HTTP response headers `Cache-Control: no-store, no-cache` and `Pragma: no-cache` for pages containing sensitive data.

---

## 9. Communication Security
- **9.1 TLS in Transit**: Encrypt all network communications carrying sensitive data or requiring authentication using TLS (HTTPS).
- **9.2 Certificate Validity**: Ensure TLS certificates are valid, unexpired, configured with correct domain names, and backed by trusted intermediate certs.
- **9.3 Disable Insecure Protocols & Fallback**: Block fallback to unencrypted HTTP or outdated TLS versions (TLS 1.0/1.1 disabled; enforce TLS 1.2+).
- **9.4 Referer Header Filtering**: Strip sensitive query parameters from the `Referer` header when linking to external sites (`Referrer-Policy: strict-origin-when-cross-origin`).

---

## 10. System Configuration
- **10.1 Patch & Update**: Keep all operating systems, web servers, database engines, runtimes, and third-party dependencies updated and patched.
- **10.2 Disable Directory Listing**: Disable web server directory browsing (return HTTP 403 Forbidden).
- **10.3 Restrict Web Server Privileges**: Run web servers and backend processes under low-privilege dedicated service accounts.
- **10.4 Remove Unused Functionality**: Remove unused components, test scripts, sample code, and unnecessary API endpoints before deployment.
- **10.5 Restrict HTTP Methods**: Limit allowed HTTP methods (e.g., allow GET, POST, PUT, DELETE; disable WebDAV, TRACE, OPTIONS unless explicitly required).
- **10.6 Suppress Server Banners**: Hide server banner details (`Server`, `X-Powered-By`) in HTTP response headers.
- **10.7 Environment Isolation**: Completely isolate development and testing environments from production networks.

---

## 11. Database Security
- **11.1 Strongly Typed Parameterized Queries**: Use parameterized queries / prepared statements (or vetted ORMs) exclusively to prevent SQL injection.
- **11.2 Input Validation & Encoding**: Validate database inputs and handle meta-characters before executing queries.
- **11.3 Least Privilege DB Accounts**: Connect to the database using accounts with the minimum necessary privileges (avoid superuser/DBA accounts for web apps).
- **11.4 Encrypted Connection Strings**: Store database credentials and connection strings in encrypted environment variables outside the codebase.
- **11.5 Close DB Connections**: Promptly release/close database connections after query execution.
- **11.6 Remove Default DB Content**: Remove default database accounts, sample tables, default passwords, and unused stored procedures.

---

## 12. File Management
- **12.1 No User Data in File Includes**: Never pass untrusted user input to dynamic file inclusion functions or path resolution mechanisms.
- **12.2 Authenticated Uploads**: Require authentication before permitting file uploads.
- **12.3 File Type & Header Validation**: Validate uploaded file extensions against an allowlist AND verify MIME/header content types.
- **12.4 Store Uploads Outside Web Root**: Store uploaded files outside the public web root or in isolated content storage (e.g. S3 bucket, DB).
- **12.5 Disable Execution Permissions**: Disable execute permissions on directories used for user file uploads.
- **12.6 Prevent Executable Uploads**: Block upload of server-executable scripts (e.g. `.php`, `.jsp`, `.exe`, `.sh`, `.html`, `.js`).
- **12.7 Path Traversal Prevention**: Use sanitized file names or generated UUIDs instead of raw user-supplied filenames.
- **12.8 Relative Paths Only**: Never return absolute server file paths to client applications.
- **12.9 Malware Scanning**: Automatically scan user-uploaded files for malware and viruses.

---

## 13. Memory Management
- **13.1 Buffer Overflow Prevention**: Check input lengths and destination buffer sizes before copying data.
- **13.2 Safe Functions**: Use bounded, safe functions (avoid functions susceptible to buffer overflows such as `strcpy`, `strcat`, `gets`, `sprintf` without bounds).
- **13.3 Explicit Resource Cleanup**: Explicitly close file descriptors, sockets, database handles, and free dynamically allocated memory at all function exit points.
- **13.4 Non-Executable Stacks**: Enable stack protection (NX/DEP, ASLR) on compiled binaries.

---

## 14. General Coding Practices
- **14.1 Managed Code & Standard Libraries**: Prefer well-tested managed runtimes and standard APIs over custom unmanaged code.
- **14.2 Task-Specific APIs**: Use built-in programming language APIs instead of invoking OS shell commands (avoid `eval()`, `exec()`, `system()`).
- **14.3 Synchronization & Race Conditions**: Use mutexes, thread-safe primitives, or locking mechanisms when accessing shared resources in multi-threaded contexts.
- **14.4 Explicit Variable Initialization**: Explicitly initialize variables upon declaration or prior to first use.
- **14.5 Minimum Privilege Elevation**: If elevated privileges are needed, elevate as late as possible and drop privileges immediately after completion.
- **14.6 Calculation Error Prevention**: Guard against integer overflow, underflow, floating-point precision loss, and division by zero.
- **14.7 Code Injection Prevention**: Never pass user-controlled strings to code evaluation mechanisms (`eval`, `new Function`).
- **14.8 Dependency Auditing**: Audit third-party packages for vulnerabilities (`npm audit`, dependency scanners) before deployment.
- **14.9 Signed Updates**: Ensure software updates are cryptographically signed and verified before execution.
