const { PrismaClient } = require("@prisma/client");
const { Redis } = require("@upstash/redis");
const https = require("https");

const prisma = new PrismaClient();
const redis = new Redis({
  url: "https://big-minnow-137825.upstash.io",
  token: "gQAAAAAAAhphAAIgcDExMGJkZjA0Y2U0MzM0YzI1OTdiZTlhY2QxMjVmMTM4Ng",
});

function get(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    }).on("error", (err) => resolve({ error: err.message }));
  });
}

async function main() {
  console.log("Checking events in Neon DB...");
  const existingEvents = await prisma.event.findMany({
    where: { isPublished: true, isApproved: true, endDate: { gte: new Date() } },
    include: { creator: { select: { id: true, name: true } }, _count: { select: { registrations: true } } },
    orderBy: { startDate: "desc" }
  });

  let activeEvents = existingEvents;

  if (existingEvents.length === 0) {
    console.log("No active events found. Creating official event...");
    const kush = await prisma.user.findFirst({
      where: { role: { in: ["FACULTY_COORDINATOR", "FACULTY", "DEVELOPMENT_TEAM", "ADMIN"] } }
    });

    const newEvent = await prisma.event.create({
      data: {
        title: "SENTINAL Cybersecurity Summit & CTF 2026",
        description: "Official Sentinel / Chakravyuh Defense, Cyber Warfare & CTF Competition.",
        venue: "CSPIT Lab 618",
        startDate: new Date("2026-09-15T10:00:00.000Z"),
        endDate: new Date("2026-09-25T18:00:00.000Z"),
        registrationDeadline: new Date("2026-09-14T23:59:00.000Z"),
        slug: "sentinal-cybersecurity-summit-2026-" + Date.now().toString(36),
        isPublished: true,
        isDraft: false,
        isApproved: true,
        eventType: "hackathon",
        minTeamSize: 2,
        maxTeamSize: 4,
        maxCapacity: 60,
        tags: ["cybersecurity", "ctf", "defensive", "sentinal"],
        creatorId: kush.id,
        organizers: JSON.stringify([
          { name: "Dr. Pritesh Prajapati", role: "Faculty Coordinator", email: "priteshprajapati@charusat.ac.in", phone: "9876543210" },
          { name: "Kush Shah", role: "Faculty Coordinator", email: "d25ce145@charusat.edu.in", phone: "9999999999" }
        ]),
      },
      include: { creator: { select: { id: true, name: true } }, _count: { select: { registrations: true } } }
    });
    console.log("Created event:", newEvent.title, newEvent.id);
    activeEvents = [newEvent];
  } else {
    console.log(`Found ${existingEvents.length} active event(s):`, existingEvents.map(e => e.title));
  }

  // Prime Upstash Redis cache so that both Render and local servers have 0ms latency hits
  console.log("Priming Upstash Redis cache keys...");
  await redis.set("PUBLIC_EVENTS_LIMIT_all", JSON.stringify(activeEvents), { ex: 3600 });
  await redis.set("PUBLIC_EVENTS_LIMIT_undefined", JSON.stringify(activeEvents), { ex: 3600 });
  await redis.set("PUBLIC_EVENTS_LIMIT_3", JSON.stringify(activeEvents.slice(0, 3)), { ex: 3600 });
  console.log("Upstash Redis cache successfully primed.");

  // Test Render
  console.log("Pinging Render backend https://cyberkavach2-0-1.onrender.com/api/events ...");
  const renderRes = await get("https://cyberkavach2-0-1.onrender.com/api/events");
  console.log("Render response status:", renderRes.status);
  console.log("Render response body:", (renderRes.body || "").slice(0, 300));
}

main().catch(console.error).finally(() => prisma.$disconnect());
