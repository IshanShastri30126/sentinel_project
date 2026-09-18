/**
 * Five-Role RBAC Automated Certification Test
 * 
 * Verifies all 5 canonical roles across protected route actions:
 * 1. FACULTY_COORDINATOR
 * 2. STUDENT_COORDINATOR
 * 3. DEVELOPMENT_TEAM
 * 4. SOCIAL_MEDIA_COORDINATOR
 * 5. MEMBER
 */

import http from "http";
import jwt from "../../server/node_modules/jsonwebtoken";

const JWT_SECRET = "dPODk2j6UWgpUQ+32iQ4TOEklySKbMYpha7T431LW1kXbo7QEcNuTlmuF61Y/98xboEH6xHoc4uKFXgLCq0FZg==";
const API_BASE = "http://localhost:4000/api";

type Role =
  | "FACULTY_COORDINATOR"
  | "STUDENT_COORDINATOR"
  | "DEVELOPMENT_TEAM"
  | "SOCIAL_MEDIA_COORDINATOR"
  | "MEMBER";

const ROLES: Role[] = [
  "FACULTY_COORDINATOR",
  "STUDENT_COORDINATOR",
  "DEVELOPMENT_TEAM",
  "SOCIAL_MEDIA_COORDINATOR",
  "MEMBER",
];

interface ActionTest {
  name: string;
  method: string;
  path: string;
  body?: any;
  allowedRoles: Role[];
}

const ACTION_TESTS: ActionTest[] = [
  {
    name: "User Management (List Users)",
    method: "GET",
    path: "/users",
    allowedRoles: ["FACULTY_COORDINATOR"],
  },
  {
    name: "Role Management (Update User Role)",
    method: "PATCH",
    path: "/users/target-user-id/role",
    body: { role: "MEMBER" },
    allowedRoles: ["FACULTY_COORDINATOR"],
  },
  {
    name: "Certificate Template Creation",
    method: "POST",
    path: "/certificates/templates",
    allowedRoles: ["FACULTY_COORDINATOR", "STUDENT_COORDINATOR", "DEVELOPMENT_TEAM", "SOCIAL_MEDIA_COORDINATOR"],
  },
  {
    name: "Bulk Certificate Issuance",
    method: "POST",
    path: "/certificates/bulk",
    body: { eventId: "00000000-0000-0000-0000-000000000000", recipients: [{ name: "Test" }] },
    allowedRoles: ["FACULTY_COORDINATOR", "DEVELOPMENT_TEAM"],
  },
  {
    name: "System Maintenance Logs",
    method: "GET",
    path: "/maintenance",
    allowedRoles: ["FACULTY_COORDINATOR", "DEVELOPMENT_TEAM"],
  },
  {
    name: "Event Analytics Review",
    method: "GET",
    path: "/events/00000000-0000-0000-0000-000000000000/analytics",
    allowedRoles: ["FACULTY_COORDINATOR", "STUDENT_COORDINATOR", "DEVELOPMENT_TEAM"],
  },
  {
    name: "Event Creation",
    method: "POST",
    path: "/events",
    body: { title: "Test Event" },
    allowedRoles: ["FACULTY_COORDINATOR", "STUDENT_COORDINATOR", "DEVELOPMENT_TEAM"],
  },
];

function request(method: string, path: string, token: string, body?: any): Promise<number> {
  return new Promise((resolve) => {
    const url = new URL(`${API_BASE}${path}`);
    const req = http.request(
      url,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Sentinel-Slug": "sentinel",
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        resolve(res.statusCode || 0);
      }
    );
    req.on("error", () => resolve(500));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runRbacMatrix() {
  console.log("=============================================================");
  console.log("PHASE 28 — FIVE-ROLE RBAC AUTHORIZATION MATRIX BENCHMARK");
  console.log("=============================================================");

  const SEEDED_USER_MAP: Record<Role, string> = {
    FACULTY_COORDINATOR: "417ec698-5c88-4771-b5aa-9a0b9264c42e",
    STUDENT_COORDINATOR: "ab4620c9-c133-4125-a7c8-9a33af69e3b3",
    DEVELOPMENT_TEAM: "3524b578-ee89-4bb2-a85c-c22f625087e4",
    SOCIAL_MEDIA_COORDINATOR: "ba70758e-20a1-4bb1-a330-385b0f937ef5",
    MEMBER: "467ac0f5-8565-4db5-8135-9b46951f6675",
  };

  const roleTokens: Record<Role, string> = {} as any;
  for (const role of ROLES) {
    roleTokens[role] = jwt.sign(
      { userId: SEEDED_USER_MAP[role], email: `test_${role.toLowerCase()}@charusat.edu.in`, role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
  }

  let totalTests = 0;
  let passedTests = 0;

  console.log("\nAction | Role | Expected | Actual Status | Result");
  console.log("-------------------------------------------------------------");

  for (const action of ACTION_TESTS) {
    for (const role of ROLES) {
      totalTests++;
      const isAllowed = action.allowedRoles.includes(role);
      const token = roleTokens[role];
      const status = await request(action.method, action.path, token, action.body);

      // If allowed: status should NOT be 401 or 403 (could be 200, 400 validation error, or 404 not found on mock id)
      // If denied: status MUST be 403 Forbidden (or 401)
      const passed = isAllowed
        ? status !== 401 && status !== 403
        : status === 401 || status === 403;

      if (passed) passedTests++;

      const mark = passed ? "PASS" : "FAIL";
      console.log(`${action.name.padEnd(30)} | ${role.padEnd(25)} | ${isAllowed ? "ALLOW" : "DENY "} | HTTP ${status} | ${mark}`);
    }
  }

  console.log("\n=============================================================");
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
  console.log("FINAL PHASE 28 VERDICT:", passedTests === totalTests ? "PASS" : "FAIL");
}

runRbacMatrix().catch(console.error);
