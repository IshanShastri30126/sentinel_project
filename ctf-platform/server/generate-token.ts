import jwt from "jsonwebtoken";
import db from "./src/lib/db";
import { randomUUID } from "crypto";

// Ensure you have a .env file with JWT_SECRET and DATABASE_URL
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_local_testing";

async function generateTestToken() {
  try {
    // 1. Create a fake user in the database (or grab the first one)
    let user = await db.user.findFirst();
    
    if (!user) {
      console.log("No users found. Creating a test admin user...");
      user = await db.user.create({
        data: {
          email: "admin@ctfwars.test",
          name: "Test Admin",
          role: "ADMIN",
        }
      });
    }

    console.log(`\n✅ Using User: ${user.email} (Role: ${user.role})`);

    // 2. Generate the JWT Payload
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      jti: randomUUID(), // Unique token ID
    };

    // 3. Sign the token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });

    console.log("\n🔑 YOUR TEST TOKEN IS:");
    console.log("--------------------------------------------------");
    console.log(token);
    console.log("--------------------------------------------------");
    console.log("\n📋 HOW TO USE IN POSTMAN:");
    console.log("1. Open Postman");
    console.log("2. Click the 'Cookies' link under the Send button");
    console.log("3. Type 'localhost' and add a domain");
    console.log("4. Click 'Add Cookie' and paste exactly this:");
    console.log(`token=${token}; Path=/; HttpOnly`);
    
  } catch (error) {
    console.error("Error generating token:", error);
  } finally {
    await db.$disconnect();
  }
}

generateTestToken();
