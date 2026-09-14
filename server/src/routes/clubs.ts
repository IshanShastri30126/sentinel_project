import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, requireMinRole } from "../middlewares/auth";
import { redisGet, redisSet, redisDel } from "../lib/redis";
import { l1Cache } from "../lib/cache";

const router = Router();

// GET /api/clubs — List all clubs (static single sentinel)
router.get("/", async (req: Request, res: Response) => {
  res.json({
    clubs: [
      { id: "sentinel", name: "Sentinel", slug: "sentinel" }
    ]
  });
});

// GET /api/clubs/:slug — Get branding settings for a sentinel
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const l1Key = `l1:clubs:branding:${slug}`;

    // 1. Check L1 Memory Cache (< 0.01ms)
    const l1Cached = l1Cache.get<any>(l1Key);
    if (l1Cached) {
      res.json({ sentinel: l1Cached });
      return;
    }
    
    // 2. Check L2 Redis cache
    const cachedBranding = await redisGet(`BRANDING_${slug}`);
    if (cachedBranding) {
      try {
        const branding = JSON.parse(cachedBranding);
        l1Cache.set(l1Key, branding, 300); // 5 min in L1
        res.json({ sentinel: branding });
        return;
      } catch (e) {
        console.warn("[Clubs] Parse cached branding failed:", e);
      }
    }

    const setting = await prisma.clubSettings.findUnique({
      where: { key: `BRANDING_${slug}` }
    });

    const defaultBranding = {
      id: slug,
      name: "Sentinel",
      slug: slug,
      logoUrl: null,
      primaryColor: "#CCFF00",
      secondaryColor: "#FF4D00",
      themeMode: "dark",
      fontFamily: "Outfit"
    };

    const finalBranding = setting ? { ...defaultBranding, ...setting.value as any } : defaultBranding;

    // Cache in L1 for 5 mins and Redis for 1 hour
    l1Cache.set(l1Key, finalBranding, 300);
    await redisSet(`BRANDING_${slug}`, JSON.stringify(finalBranding), 3600);

    res.json({ sentinel: finalBranding });
  } catch (err) {
    console.error("[Clubs] Get branding error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/clubs/:clubId/branding — Update branding (SC/Faculty only)
router.patch("/:clubId/branding", authenticate, requireMinRole("STUDENT_COORDINATOR"), async (req: Request, res: Response) => {
  try {
    const clubId = req.params.clubId;
    const { primaryColor, secondaryColor, themeMode, fontFamily, logoUrl } = req.body;

    const currentSetting = await prisma.clubSettings.findUnique({
      where: { key: `BRANDING_${clubId}` }
    });

    const currentVal = currentSetting ? (currentSetting.value as any) : {};
    const updatedVal = {
      ...currentVal,
      primaryColor: primaryColor ?? currentVal.primaryColor ?? "#CCFF00",
      secondaryColor: secondaryColor ?? currentVal.secondaryColor ?? "#FF4D00",
      themeMode: themeMode ?? currentVal.themeMode ?? "dark",
      fontFamily: fontFamily ?? currentVal.fontFamily ?? "Outfit",
      logoUrl: logoUrl !== undefined ? logoUrl : (currentVal.logoUrl ?? null)
    };

    const setting = await prisma.clubSettings.upsert({
      where: { key: `BRANDING_${clubId}` },
      update: { value: updatedVal },
      create: { key: `BRANDING_${clubId}`, value: updatedVal }
    });

    // Invalidate both L1 and L2 Caches
    l1Cache.del(`l1:clubs:branding:${clubId}`);
    await redisDel(`BRANDING_${clubId}`);

    res.json({
      sentinel: {
        id: clubId,
        name: "Sentinel",
        slug: clubId,
        ...setting.value as any
      },
      message: "Branding updated successfully"
    });
  } catch (err) {
    console.error("[Clubs] Update branding error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
