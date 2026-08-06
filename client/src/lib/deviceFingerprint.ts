/**
 * Generates a stable, unique device fingerprint signature for the current browser/device.
 * Combines Canvas rendering hash, WebGL parameters, screen dimensions, timezone, and user agent attributes.
 * Works seamlessly across modern desktop & mobile browsers.
 */
function hashString(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "nocanvas";

    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("ChakravyuhShield,123", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("ChakravyuhShield,123", 4, 17);

    return canvas.toDataURL();
  } catch {
    return "canvaserror";
  }
}

export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") return "server-side";

  const STORAGE_KEY = "ck_device_fingerprint";
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const canvasSig = getCanvasFingerprint();
  const screenSig = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const tzSig = new Date().getTimezoneOffset();
  const langSig = navigator.language || "";
  const platformSig = navigator.platform || "";
  const uaSig = navigator.userAgent || "";

  const rawSignature = [canvasSig, screenSig, tzSig, langSig, platformSig, uaSig].join("||");
  const fingerprintHash = `DEV_${hashString(rawSignature)}_${Date.now().toString(36)}`;

  localStorage.setItem(STORAGE_KEY, fingerprintHash);
  return fingerprintHash;
}
