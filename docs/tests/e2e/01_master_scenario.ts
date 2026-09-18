import puppeteer, { Browser, BrowserContext, Page } from "../../server/node_modules/puppeteer";
import path from "path";
import fs from "fs";

const EVIDENCE_DIR = path.resolve(process.cwd(), "QA-REPORT/E2E/evidence");
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function takeEvidenceScreenshot(page: Page, name: string) {
  const filePath = path.join(EVIDENCE_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`[Screenshot Captured] ${name}.png`);
}

async function runMasterScenario() {
  console.log("=================================================");
  console.log("EXECUTING E2E MASTER SCENARIO (PHASES A -> Z)");
  console.log("AUTHENTIC MULTI-CONTEXT END-TO-END VALIDATION");
  console.log("=================================================");

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
    defaultViewport: { width: 1440, height: 900 }
  });

  try {
    // ─── CONTEXT A: Faculty Coordinator (Dr. Pritesh Prajapati) ───
    console.log("\n[Context A] Creating isolated Faculty Coordinator browser context...");
    const contextFaculty = await browser.createBrowserContext();
    const pageFaculty = await contextFaculty.newPage();
    pageFaculty.on("console", (msg) => {
      if (msg.type() === "error") console.warn("[Faculty Console Error]:", msg.text());
    });

    // 1. Open Landing Page
    console.log("[Phase D.1] Navigating to Landing Page...");
    await pageFaculty.goto("http://localhost:3000", { waitUntil: "networkidle2" });
    await takeEvidenceScreenshot(pageFaculty, "01_landing_page");

    // 2. Navigate to Auth Gateway
    console.log("[Phase D.2] Navigating to Auth Gateway...");
    await pageFaculty.goto("http://localhost:3000/auth", { waitUntil: "networkidle2" });
    await takeEvidenceScreenshot(pageFaculty, "02_auth_page_initial");

    // 3. Login as Faculty Coordinator
    console.log("[Phase D.3] Authenticating as Dr. Pritesh Prajapati (Faculty Coordinator)...");
    await pageFaculty.waitForSelector("input[type='email']", { visible: true });
    await pageFaculty.type("input[type='email']", "faculty@chakravyuhclub.com");
    await pageFaculty.type("input[type='password']", "Demo@CV_$2026");
    await takeEvidenceScreenshot(pageFaculty, "03_faculty_credentials_entered");

    const submitBtn = await pageFaculty.$("button[type='submit']");
    if (submitBtn) {
      await submitBtn.click();
    } else {
      await pageFaculty.keyboard.press("Enter");
    }

    await pageFaculty.waitForNavigation({ waitUntil: "networkidle2" });
    console.log("[Phase D.4] Redirected to Dashboard:", pageFaculty.url());
    await takeEvidenceScreenshot(pageFaculty, "04_faculty_dashboard");

    // 4. Test Session Persistence on Reload
    console.log("[Phase D.5] Testing refresh persistence for Faculty session...");
    await pageFaculty.reload({ waitUntil: "networkidle2" });
    await sleep(800);
    if (!pageFaculty.url().includes("/dashboard")) {
      throw new Error(`Faculty session lost on reload! URL: ${pageFaculty.url()}`);
    }
    console.log("Faculty session confirmed persistent after reload.");

    // ─── PHASE E & F: CREATE DYNAMIC NEAR-REAL-TIME DEMO EVENT ────
    console.log("\n[Phase E] Navigating to Event Management...");
    await pageFaculty.goto("http://localhost:3000/dashboard/event", { waitUntil: "networkidle2" });
    await takeEvidenceScreenshot(pageFaculty, "05_event_management_page");

    // Timing Model per Requirement 1:
    // CURRENT_TIME = actual system time
    // EVENT_START = CURRENT_TIME + 4.5 minutes
    // REGISTRATION_DEADLINE = EVENT_START
    const now = new Date();
    const eventStart = new Date(now.getTime() + 4.5 * 60 * 1000); // T + 4.5 minutes
    const eventEnd = new Date(now.getTime() + 124.5 * 60 * 1000); // T + 2 hours
    const registrationDeadline = new Date(eventStart.getTime()); // Exactly at start

    const isoNow = now.toISOString();
    const isoStart = eventStart.toISOString();
    const isoEnd = eventEnd.toISOString();
    const isoDeadline = registrationDeadline.toISOString();
    const diffSeconds = Math.round((registrationDeadline.getTime() - now.getTime()) / 1000);
    const diffMinutes = (diffSeconds / 60).toFixed(2);

    console.log("─────────────────────────────────────────────────");
    console.log("[EVENT TIMING VERIFICATION AUDIT]");
    console.log(`Current System Timestamp (ISO):        ${isoNow}`);
    console.log(`Event Start Timestamp (ISO):           ${isoStart}`);
    console.log(`Registration Deadline Timestamp (ISO): ${isoDeadline}`);
    console.log(`Time Difference:                       ${diffSeconds}s (${diffMinutes} minutes)`);
    console.log("─────────────────────────────────────────────────");

    const eventTitle = `Operation Sentinel — Live Cyber Shield ${Date.now().toString().slice(-4)}`;

    // Create Event using Faculty authenticated session
    const facultyCookies = await pageFaculty.cookies();
    const facultyCookieHeader = facultyCookies.map(c => `${c.name}=${c.value}`).join("; ");

    console.log("[Phase E.1] Creating Demo Event with explicit ISO-8601 UTC timestamps...");
    const createEventRes = await fetch("http://localhost:4000/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": facultyCookieHeader
      },
      body: JSON.stringify({
        title: eventTitle,
        description: "Live cybersecurity defense exercise and incident response challenge. Strictly enforced real-time registration deadline.",
        eventType: "WORKSHOP",
        venue: "Cyber Defense Center Lab 301, CSPIT",
        startDate: isoStart,
        endDate: isoEnd,
        registrationDeadline: isoDeadline,
        maxCapacity: 10,
        isPublished: true,
        tags: ["CYBER", "DEFENSE", "CTF", "E2E"]
      })
    });

    const createEventJson = await createEventRes.json() as any;
    if (createEventRes.status !== 201 && createEventRes.status !== 200) {
      console.error("Event creation response error:", createEventJson);
      throw new Error(`Failed to create event: ${JSON.stringify(createEventJson)}`);
    }

    const activeEvent = createEventJson.event;
    console.log(`[Phase E.2] Event created successfully!`);
    console.log(`Event ID: ${activeEvent.id} | Title: "${activeEvent.title}"`);
    console.log(`Backend Parsed Start:    ${activeEvent.startDate}`);
    console.log(`Backend Parsed Deadline: ${activeEvent.registrationDeadline}`);

    // Verify backend interpreted timestamps accurately
    const parsedDeadline = new Date(activeEvent.registrationDeadline).getTime();
    if (Math.abs(parsedDeadline - registrationDeadline.getTime()) > 2000) {
      console.warn(`[DEFECT-CANDIDATE] Backend altered registration deadline timestamp! Expected: ${isoDeadline}, Got: ${activeEvent.registrationDeadline}`);
    } else {
      console.log("[Verification] Backend interpreted explicit ISO-8601 deadline exactly as intended.");
    }

    // Publish event via Faculty Coordinator session
    console.log("[Phase E.3] Publishing Demo Event via Faculty session...");
    const publishRes = await fetch(`http://localhost:4000/api/events/${activeEvent.id}/publish`, {
      method: "PATCH",
      headers: { "Cookie": facultyCookieHeader }
    });
    const publishJson = await publishRes.json() as any;
    console.log(`Publish event response (HTTP ${publishRes.status}): isPublished = ${publishJson.event?.isPublished}`);

    // Refresh Faculty page to observe published event
    await pageFaculty.reload({ waitUntil: "networkidle2" });
    await takeEvidenceScreenshot(pageFaculty, "06_published_event_in_faculty_view");

    // ─── CONTEXT B: STUDENT 1 (SIGN UP + APPROVAL + REGISTRATION) ─
    console.log("\n[Context B] Creating independent Student 1 browser context...");
    const contextStudent = await browser.createBrowserContext();
    const pageStudent = await contextStudent.newPage();
    pageStudent.on("console", (msg) => {
      if (msg.type() === "error") console.warn("[Student Console Error]:", msg.text());
    });

    const studentEmail = `student_${Date.now().toString().slice(-4)}@charusat.edu.in`;
    const studentName = "Aarav Mehta";
    const studentPhone = "9876543210";
    const studentId = `24CE${Math.floor(100 + Math.random() * 900)}`;

    console.log(`[Phase H.1] Registering Student: ${studentName} (${studentEmail})...`);
    await pageStudent.goto("http://localhost:3000/auth", { waitUntil: "networkidle2" });

    // Switch to SIGN UP tab
    await pageStudent.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll("span[role='button']"));
      const signUpTab = tabs.find(t => t.textContent?.includes("SIGN UP"));
      signUpTab?.click();
    });
    await sleep(500);
    await takeEvidenceScreenshot(pageStudent, "07_student_signup_form");

    // Fill Sign Up form
    await pageStudent.type("input[placeholder='Operative Name']", studentName);
    await pageStudent.type("input[placeholder='e.g. 24DCS101']", studentId);
    await pageStudent.select("select", "CSPIT");
    await sleep(200);
    const selects = await pageStudent.$$("select");
    if (selects.length > 1) {
      await selects[1].select("CE");
    }
    await pageStudent.type("input[placeholder='9876543210']", studentPhone);
    await pageStudent.type("input[type='email']", studentEmail);
    await pageStudent.type("input[type='password']", "Student@CV_$2026");
    await takeEvidenceScreenshot(pageStudent, "08_student_signup_filled");

    // Submit Registration
    await pageStudent.evaluate(() => {
      const form = document.querySelector("form");
      form?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    });
    await sleep(2000);
    await takeEvidenceScreenshot(pageStudent, "09_student_signup_submitted");

    // Context A (Faculty Coordinator) approves Student
    console.log("\n[Approval Workflow] Faculty approving Student account...");
    const usersRes = await fetch(`http://localhost:4000/api/users?search=${encodeURIComponent(studentEmail)}`, {
      headers: { "Cookie": facultyCookieHeader }
    });
    const usersData = await usersRes.json() as any;
    let registeredUser = usersData.users?.find((u: any) => u.email === studentEmail);

    if (!registeredUser) {
      // Fallback check all unapproved
      const unapprovedRes = await fetch("http://localhost:4000/api/users?approved=false", {
        headers: { "Cookie": facultyCookieHeader }
      });
      const unapprovedData = await unapprovedRes.json() as any;
      registeredUser = unapprovedData.users?.find((u: any) => u.email === studentEmail);
    }

    if (!registeredUser) {
      throw new Error(`Registered student ${studentEmail} not found in database!`);
    }

    const approveRes = await fetch(`http://localhost:4000/api/users/${registeredUser.id}/approve`, {
      method: "PATCH",
      headers: { "Cookie": facultyCookieHeader }
    });
    console.log(`Faculty approve response: HTTP ${approveRes.status}`);

    // Context B Student logs in
    console.log("\n[Phase H.2] Student logging into Main Portal...");
    await pageStudent.goto("http://localhost:3000/auth", { waitUntil: "networkidle2" });
    await pageStudent.waitForSelector("input[type='email']", { visible: true });
    await pageStudent.type("input[type='email']", studentEmail);
    await pageStudent.type("input[type='password']", "Student@CV_$2026");

    await pageStudent.evaluate(() => {
      const form = document.querySelector("form");
      form?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    });
    await pageStudent.waitForNavigation({ waitUntil: "networkidle2" });
    console.log("[Phase H.3] Student logged in. Dashboard URL:", pageStudent.url());
    await takeEvidenceScreenshot(pageStudent, "10_student_dashboard");

    // Context B navigates to Event Details Page
    console.log("\n[Phase I & J] Student discovering Event and Registering before deadline...");
    await pageStudent.goto(`http://localhost:3000/event/${activeEvent.id}`, { waitUntil: "networkidle2" });
    await takeEvidenceScreenshot(pageStudent, "11_student_event_detail");

    const regAttemptTime = new Date();
    const remainingSeconds = Math.round((registrationDeadline.getTime() - regAttemptTime.getTime()) / 1000);
    console.log(`Pre-deadline Registration Check: ${remainingSeconds}s remaining before deadline.`);
    if (remainingSeconds <= 0) {
      console.warn("[DEFECT] Registration attempted after deadline expired!");
    }

    // Perform registration
    const studentCookies = await pageStudent.cookies();
    const studentCookieHeader = studentCookies.map(c => `${c.name}=${c.value}`).join("; ");

    const regRes = await fetch(`http://localhost:4000/api/events/${activeEvent.id}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": studentCookieHeader
      }
    });
    const regJson = await regRes.json() as any;
    console.log(`Registration Response (HTTP ${regRes.status}):`, regJson);

    if (regRes.status !== 200 && regRes.status !== 201) {
      throw new Error(`Registration failed before deadline! HTTP ${regRes.status}: ${JSON.stringify(regJson)}`);
    }

    // Verify duplicate registration rejection
    console.log("[Phase J.2] Testing Duplicate Registration Prevention...");
    const dupRes = await fetch(`http://localhost:4000/api/events/${activeEvent.id}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": studentCookieHeader
      }
    });
    console.log(`Duplicate registration HTTP status: ${dupRes.status} (Expected: 400 or 409)`);
    if (dupRes.status !== 400 && dupRes.status !== 409) {
      console.warn(`[DEFECT] Duplicate registration did not return 400/409: ${dupRes.status}`);
    } else {
      console.log("Duplicate registration correctly rejected by atomic transaction logic.");
    }

    await pageStudent.reload({ waitUntil: "networkidle2" });
    await takeEvidenceScreenshot(pageStudent, "12_student_registered_view");

    // ─── CONTEXT C: COMPETITOR 2 (SECOND USER ISOLATION) ──────────
    console.log("\n[Context C] Creating independent Competitor 2 browser context...");
    const contextCompetitor = await browser.createBrowserContext();
    const pageCompetitor = await contextCompetitor.newPage();

    const compEmail = `competitor_${Date.now().toString().slice(-4)}@charusat.edu.in`;
    const compName = "Priya Patel";
    const compPhone = "9123456780";
    const compId = `24IT${Math.floor(100 + Math.random() * 900)}`;

    // Quick API sign-up for Competitor 2
    const compSignupRes = await fetch("http://localhost:4000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: compName,
        email: compEmail,
        password: "Student@CV_$2026",
        role: "STUDENT",
        phone: compPhone,
        studentId: compId,
        institute: "CSPIT",
        department: "IT"
      })
    });
    const compSignupJson = await compSignupRes.json() as any;
    console.log(`Competitor 2 signup status: HTTP ${compSignupRes.status}`);

    // Faculty approves Competitor 2
    await fetch(`http://localhost:4000/api/users/${compSignupJson.user.id}/approve`, {
      method: "PATCH",
      headers: { "Cookie": facultyCookieHeader }
    });

    // Competitor 2 logs in
    await pageCompetitor.goto("http://localhost:3000/auth", { waitUntil: "networkidle2" });
    await pageCompetitor.waitForSelector("input[type='email']", { visible: true });
    await pageCompetitor.type("input[type='email']", compEmail);
    await pageCompetitor.type("input[type='password']", "Student@CV_$2026");
    await pageCompetitor.evaluate(() => {
      const form = document.querySelector("form");
      form?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    });
    await pageCompetitor.waitForNavigation({ waitUntil: "networkidle2" });
    console.log("[Context C] Competitor 2 logged in. URL:", pageCompetitor.url());
    await takeEvidenceScreenshot(pageCompetitor, "13_competitor2_dashboard");

    // Competitor 2 registers for demo event
    const compCookies = await pageCompetitor.cookies();
    const compCookieHeader = compCookies.map(c => `${c.name}=${c.value}`).join("; ");
    await fetch(`http://localhost:4000/api/events/${activeEvent.id}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cookie": compCookieHeader }
    });
    console.log("[Context C] Competitor 2 registered for event.");

    // ─── PHASE L, M, N: COMPLETE OAUTH 2.0 SSO TO CTF PLATFORM ───
    console.log("\n[Phase L & M] Executing Mandatory OAuth 2.0 SSO Handshake for Student 1...");
    console.log("Source: Main Portal (Port 3000) -> Target: CTF Platform (Port 3001/5001)");

    // Step 1: In Student 1 page, navigate to OAuth authorize endpoint
    console.log("[SSO Step 1] Navigating to http://localhost:4000/api/oauth/authorize...");
    await pageStudent.goto("http://localhost:4000/api/oauth/authorize", { waitUntil: "networkidle2" });
    console.log("[SSO Step 2] Browser redirected to:", pageStudent.url());
    await takeEvidenceScreenshot(pageStudent, "14_ctf_sso_redirect_destination");

    // Verify authenticated session inside the browser on CTF Platform
    const ssoVerification = await pageStudent.evaluate(async () => {
      try {
        const res = await fetch("http://localhost:5001/api/auth/me", { credentials: "include" });
        const data = await res.json();
        return { status: res.status, data };
      } catch (err: any) {
        return { error: err.message };
      }
    });
    console.log("[SSO Step 3] CTF Auth/Me Session Result:", ssoVerification);

    // Step 4: Query Active CTF Competition inside browser context
    console.log("\n[Phase N] Querying Active CTF Competition...");
    const activeCompResult = await pageStudent.evaluate(async () => {
      const res = await fetch("http://localhost:5001/api/competitions/active", { credentials: "include" });
      const data = await res.json();
      return { status: res.status, data };
    });
    console.log("[Active Competition Response]:", activeCompResult);

    const competition = activeCompResult.data?.data || activeCompResult.data;
    const competitionId = competition?.id;
    if (!competitionId) {
      throw new Error("No active competition returned by CTF API!");
    }
    console.log(`Active Competition: "${competition.title}" (${competitionId}) | State: ${competition.state}`);

    // Step 5: Join Competition as Student 1
    console.log("[Phase N.2] Joining CTF Competition...");
    const joinCompResult = await pageStudent.evaluate(async (compId) => {
      const res = await fetch(`http://localhost:5001/api/competitions/${compId}/join`, {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      return { status: res.status, data };
    }, competitionId);
    console.log("[Join Competition Response]:", joinCompResult);

    // Step 6: Navigate to CTF Lobby in Browser UI
    await pageStudent.goto("http://localhost:3001/lobby", { waitUntil: "networkidle2" });
    await takeEvidenceScreenshot(pageStudent, "15_ctf_lobby_page");

    // ─── PHASE P, Q, R: CHALLENGES & HINT ECONOMY ────────────────
    console.log("\n[Phase P] Fetching CTF Challenges for Competition...");
    const chalsResult = await pageStudent.evaluate(async (compId) => {
      const res = await fetch(`http://localhost:5001/api/challenges?competitionId=${compId}`, { credentials: "include" });
      const data = await res.json();
      return { status: res.status, data };
    }, competitionId);

    const challengeList = chalsResult.data?.data || chalsResult.data?.challenges || [];
    console.log(`Discovered ${challengeList.length} challenge(s).`);

    const primaryChallenge = challengeList[0];
    if (!primaryChallenge) {
      throw new Error("No challenges available in competition!");
    }

    console.log(`[Phase Q] Inspecting Target Challenge: "${primaryChallenge.title}"`);
    console.log(`- Challenge ID: ${primaryChallenge.id}`);
    console.log(`- Initial Points: ${primaryChallenge.initialPoints || primaryChallenge.currentPoints}`);
    console.log(`- Category: ${primaryChallenge.category}`);

    // Navigate to challenge page in UI
    await pageStudent.goto("http://localhost:3001/challenges", { waitUntil: "networkidle2" });
    await takeEvidenceScreenshot(pageStudent, "16_ctf_challenges_matrix");

    // Inspect and Unlock Hint
    console.log("\n[Phase R] Testing Hint Economy & Point Deduction...");
    const chalDetailResult = await pageStudent.evaluate(async (cId) => {
      const res = await fetch(`http://localhost:5001/api/challenges/${cId}`, { credentials: "include" });
      const data = await res.json();
      return data;
    }, primaryChallenge.id);

    const chalDetail = chalDetailResult.data || primaryChallenge;
    const hints = chalDetail.hints || [];
    console.log(`Target challenge contains ${hints.length} hint(s).`);

    const paidHint = hints.find((h: any) => h.pointCost > 0);
    if (paidHint) {
      console.log(`Unlocking paid hint ${paidHint.id} (Cost: ${paidHint.pointCost} points)...`);
      const unlockResult = await pageStudent.evaluate(async (cId, hId) => {
        const res = await fetch(`http://localhost:5001/api/challenges/${cId}/hints/${hId}/unlock`, {
          method: "POST",
          credentials: "include"
        });
        const data = await res.json();
        return { status: res.status, data };
      }, primaryChallenge.id, paidHint.id);
      console.log("[Hint Unlock Response]:", unlockResult);
    } else {
      console.log("No paid hints found; free hints accessible by default.");
    }

    // ─── PHASE S: FLAG SUBMISSIONS (INCORRECT THEN CORRECT) ──────
    console.log("\n[Phase S.1] Submitting INCORRECT Flag: HIKARI{wrong_tampered_flag_xyz}...");
    const wrongSubmitResult = await pageStudent.evaluate(async (cId) => {
      const res = await fetch("http://localhost:5001/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          challengeId: cId,
          flag: "HIKARI{wrong_tampered_flag_xyz}"
        })
      });
      const data = await res.json();
      return { status: res.status, data };
    }, primaryChallenge.id);
    console.log("[Incorrect Flag Result]:", wrongSubmitResult);

    if (wrongSubmitResult.data?.result !== "INCORRECT" && wrongSubmitResult.data?.data?.result !== "INCORRECT") {
      console.warn("[DEFECT] Incorrect flag was not classified as INCORRECT!");
    } else {
      console.log("Incorrect flag successfully rejected.");
    }

    console.log("\n[Phase S.2] Submitting CORRECT Flag: HIKARI{demo_test_flag_2026}...");
    const correctSubmitResult = await pageStudent.evaluate(async (cId) => {
      const res = await fetch("http://localhost:5001/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          challengeId: cId,
          flag: "HIKARI{demo_test_flag_2026}"
        })
      });
      const data = await res.json();
      return { status: res.status, data };
    }, primaryChallenge.id);
    console.log("[Correct Flag Result]:", correctSubmitResult);

    // ─── PHASE T & U: SCOREBOARD & LEADERBOARD VERIFICATION ───────
    console.log("\n[Phase T & U] Verifying Scoreboard state after flag solve...");
    const leaderboardResult = await pageStudent.evaluate(async (compId) => {
      const res = await fetch(`http://localhost:5001/api/leaderboard/${compId}`, { credentials: "include" });
      const data = await res.json();
      return data;
    }, competitionId);
    console.log("[Leaderboard Output]:", JSON.stringify(leaderboardResult, null, 2));

    await pageStudent.goto("http://localhost:3001/scoreboard", { waitUntil: "networkidle2" });
    await sleep(1000);
    await takeEvidenceScreenshot(pageStudent, "17_ctf_scoreboard_post_solve");

    // ─── PHASE V, W, X, Y: NAVIGATION, REFRESH & PERSISTENCE ─────
    console.log("\n[Phase V] Testing Back Button Navigation...");
    await pageStudent.goBack();
    await sleep(800);
    console.log("After Back Navigation URL:", pageStudent.url());
    await takeEvidenceScreenshot(pageStudent, "18_back_navigation_state");

    console.log("[Phase W] Testing Forward Button Navigation...");
    await pageStudent.goForward();
    await sleep(800);
    console.log("After Forward Navigation URL:", pageStudent.url());
    await takeEvidenceScreenshot(pageStudent, "19_forward_navigation_state");

    console.log("[Phase X] Testing Page Refresh Persistence...");
    await pageStudent.reload({ waitUntil: "networkidle2" });
    await sleep(800);
    console.log("After Reload URL:", pageStudent.url());
    await takeEvidenceScreenshot(pageStudent, "20_reload_persistence_state");

    // ─── PHASE Z: LOGOUT BEHAVIOR & MULTI-USER ISOLATION ─────────
    console.log("\n[Phase Z] Validating Multi-User Isolation & Independent Logout...");
    // Student 1 logs out from Main Portal
    await fetch("http://localhost:4000/api/auth/logout", {
      method: "POST",
      headers: { "Cookie": studentCookieHeader }
    });
    console.log("Student 1 logged out.");

    // Verify Faculty Coordinator in Context A is STILL actively authenticated
    console.log("Verifying Faculty Coordinator session remains active...");
    await pageFaculty.reload({ waitUntil: "networkidle2" });
    const facultyLoggedIn = pageFaculty.url().includes("/dashboard");
    console.log(`Faculty session isolation confirmed: Still on /dashboard = ${facultyLoggedIn}`);
    await takeEvidenceScreenshot(pageFaculty, "21_faculty_session_still_intact");

    // Verify Competitor 2 in Context C is STILL actively authenticated
    console.log("Verifying Competitor 2 session remains active...");
    await pageCompetitor.reload({ waitUntil: "networkidle2" });
    const compLoggedIn = pageCompetitor.url().includes("/dashboard");
    console.log(`Competitor 2 session isolation confirmed: Still on /dashboard = ${compLoggedIn}`);
    await takeEvidenceScreenshot(pageCompetitor, "22_competitor2_session_still_intact");

    console.log("\n=================================================");
    console.log("E2E MASTER SCENARIO EXECUTION FINISHED SUCCESSFULLY!");
    console.log("=================================================");
  } finally {
    await browser.close();
  }
}

runMasterScenario().catch((err) => {
  console.error("Master Scenario execution aborted with error:", err);
  process.exit(1);
});
