import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config";
import { uploadToCloudinary, isCloudinaryConfigured } from "../lib/cloudinaryService";
import { Request, Response, NextFunction } from "express";

// ─── Allowed MIME types ────────────────────────────────────────────────────
const allowedMimes = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]);

// ─── Magic-byte signatures ─────────────────────────────────────────────────
// Verify actual file header bytes, not just the declared Content-Type.
// This prevents polyglot attacks where a malicious file disguises itself
// as an allowed MIME type (e.g. a PHP script with a fake PNG header).
type MagicEntry = { bytes: number[]; mask?: number[]; mime: string };

const MAGIC_SIGNATURES: MagicEntry[] = [
  // PNG: \x89PNG\r\n\x1a\n
  { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], mime: "image/png" },
  // JPEG: \xff\xd8\xff
  { bytes: [0xff, 0xd8, 0xff], mime: "image/jpeg" },
  // WEBP: RIFF????WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
  { bytes: [0x52, 0x49, 0x46, 0x46], mime: "image/webp" }, // RIFF prefix checked + ext
  // PDF: %PDF
  { bytes: [0x25, 0x50, 0x44, 0x46], mime: "application/pdf" },
  // ZIP (XLSX/XLSM are ZIP containers): PK\x03\x04
  { bytes: [0x50, 0x4b, 0x03, 0x04], mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  // XLS: D0 CF 11 E0 (Compound File Binary)
  { bytes: [0xd0, 0xcf, 0x11, 0xe0], mime: "application/vnd.ms-excel" },
];

/**
 * Verify that the file buffer's magic bytes match the declared MIME type.
 * CSV files have no magic bytes — allow them through (they are plain text).
 */
function verifyMagicBytes(buffer: Buffer, declaredMime: string): boolean {
  // CSV is plain text — no reliable magic bytes, skip deep check
  if (declaredMime === "text/csv") return true;

  for (const sig of MAGIC_SIGNATURES) {
    const matches = sig.bytes.every((byte, i) => buffer[i] === byte);
    if (matches) {
      // WEBP needs additional check at offset 8
      if (sig.mime === "image/webp") {
        const webpMark = buffer.slice(8, 12).toString("ascii");
        return webpMark === "WEBP" && declaredMime === "image/webp";
      }
      // ZIP container covers both XLSX and XLS Compound File — allow either
      if (sig.mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
        return declaredMime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          || declaredMime === "application/vnd.ms-excel";
      }
      return sig.mime === declaredMime || declaredMime.includes("jpeg");
    }
  }

  return false;
}

// ─── Cloudinary Mode (Production / Vercel) ─────────────────────────────────
const memoryStorage = multer.memoryStorage();

const memoryUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    fieldSize: 20 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimes.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"));
    }
  },
});

// ─── Local Disk Mode (Development) ─────────────────────────────────────────
const uploadDir = path.resolve(config.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Use UUID v4 — prevents timing-based filename enumeration
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const diskUpload = multer({
  storage: diskStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    fieldSize: 20 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimes.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"));
    }
  },
});

// ─── Smart Upload Middleware ─────────────────────────────────────────────────
// Automatically uses Cloudinary when configured, falls back to disk otherwise.

function createCloudinaryMiddleware(fieldName: string, folder?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    memoryUpload.single(fieldName)(req, res, async (err) => {
      if (err) {
        // Strip internal multer error details — only surface generic message
        return res.status(400).json({ error: "File upload rejected" });
      }
      if (!req.file) return next();

      // ── Magic-byte verification ──────────────────────────────────────────
      // Verify actual file content matches declared MIME — prevents polyglot attacks
      if (req.file.buffer && req.file.buffer.length >= 4) {
        if (!verifyMagicBytes(req.file.buffer, req.file.mimetype)) {
          return res.status(400).json({ error: "File content does not match declared type" });
        }
      }

      try {
        const result = await uploadToCloudinary(req.file.buffer, {
          folder: folder || "sentinal",
          resourceType: req.file.mimetype.startsWith("image/") ? "image" : "raw",
        });

        (req.file as any).cloudinaryUrl = result.url;
        (req.file as any).cloudinaryPublicId = result.publicId;
        req.file.filename = result.url;

        next();
      } catch {
        // Cloudinary failed — fall back to disk, suppress internal error details
        try {
          const localUploadDir = path.resolve(config.uploadDir);
          if (!fs.existsSync(localUploadDir)) {
            fs.mkdirSync(localUploadDir, { recursive: true });
          }
          // UUID filename — prevents timing-based enumeration
          const ext = path.extname(req.file.originalname).toLowerCase();
          const filename = `${uuidv4()}${ext}`;
          const filePath = path.join(localUploadDir, filename);
          fs.writeFileSync(filePath, req.file.buffer);
          req.file.filename = filename;
          next();
        } catch {
          res.status(500).json({ error: "File upload failed" });
        }
      }
    });
  };
}

// Export a unified upload object that works like multer
// but transparently uploads to Cloudinary when configured
export const upload = {
  single: (fieldName: string, folder?: string) => {
    if (isCloudinaryConfigured()) {
      return createCloudinaryMiddleware(fieldName, folder);
    }
    return diskUpload.single(fieldName);
  },
};

/**
 * Helper to get the file URL from a request, whether using Cloudinary or disk.
 * Use this in routes instead of manually constructing `/uploads/...` paths.
 */
export function getUploadedFileUrl(file: Express.Multer.File): string {
  if ((file as any).cloudinaryUrl) {
    return (file as any).cloudinaryUrl;
  }
  return `/uploads/${file.filename}`;
}

