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


// ─── Private / LAN IP Discovery (WebRTC SDP Candidate Parsing) ─────────────

let cachedPrivateIp: string | null = null;

/**
 * Actively discovers the client device's real private LAN IP (e.g. 192.168.x.x, 10.x.x.x, 172.x.x.x)
 * via WebRTC candidate gathering and local SDP inspection.
 */
export function detectPrivateIpAddress(): Promise<string> {
  if (typeof window === "undefined") return Promise.resolve("127.0.0.1");

  const STORAGE_KEY = "ck_local_ip";
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && saved !== "192.168.1.100") {
    cachedPrivateIp = saved;
  }

  return new Promise((resolve) => {
    try {
      const PeerConnection =
        window.RTCPeerConnection ||
        (window as any).webkitRTCPeerConnection ||
        (window as any).mozRTCPeerConnection;

      if (!PeerConnection) {
        resolve(cachedPrivateIp || "192.168.1.100");
        return;
      }

      const pc = new PeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      let resolved = false;

      pc.createDataChannel("ip_probe");
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => {});

      const timeout = setTimeout(() => {
        if (!resolved) {
          try { pc.close(); } catch {}
          resolve(cachedPrivateIp || "192.168.1.100");
        }
      }, 1200);

      pc.onicecandidate = (event) => {
        if (!event || !event.candidate || !event.candidate.candidate) {
          return;
        }

        const candidateStr = event.candidate.candidate;
        // Extract IPv4 candidates
        const match = candidateStr.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
        if (match && match[1]) {
          const ip = match[1];
          // Check for private subnet patterns
          const isPrivate =
            ip.startsWith("192.168.") ||
            ip.startsWith("10.") ||
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip) ||
            ip.startsWith("169.254.") ||
            ip === "127.0.0.1";

          if (isPrivate && !resolved) {
            resolved = true;
            clearTimeout(timeout);
            cachedPrivateIp = ip;
            localStorage.setItem(STORAGE_KEY, ip);
            try { pc.close(); } catch {}
            resolve(ip);
          }
        }
      };
    } catch {
      resolve(cachedPrivateIp || "192.168.1.100");
    }
  });
}

/**
 * Returns synchronous current best known private IP, triggering async background resolution.
 */
export function getPrivateIpAddress(): string {
  if (typeof window === "undefined") return "127.0.0.1";
  if (cachedPrivateIp) return cachedPrivateIp;
  const saved = localStorage.getItem("ck_local_ip");
  if (saved) return saved;
  detectPrivateIpAddress().catch(() => {});
  return "192.168.1.100";
}

// Automatically trigger resolution on module load
if (typeof window !== "undefined") {
  setTimeout(() => {
    detectPrivateIpAddress().catch(() => {});
  }, 100);
}
