/**
 * scripts/fetch-icon.mjs
 *
 * Runs before "vite build" as the "prebuild" npm hook.
 * Downloads the app icon from VITE_APP_ICON_URL (in .env) and
 * writes it to public/pwa-icon.png so vite-plugin-pwa can include it
 * in the PWA manifest.
 *
 * If VITE_APP_ICON_URL is not set, or the download fails, the script
 * exits cleanly without failing the build — the existing icon (if any) is kept.
 */

import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { get as httpsGet } from "node:https";
import { get as httpGet } from "node:http";
import { readFile } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const outputPath = resolve(rootDir, "public", "pwa-icon.png");
const publicDir = resolve(rootDir, "public");

// ── Load .env manually (dotenv is a prod dep, avoid requiring it here) ────────
async function loadEnv() {
  const envPath = resolve(rootDir, ".env");
  if (!existsSync(envPath)) return {};

  const raw = await readFile(envPath, "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = value;
  }
  return env;
}

// ── Download helper (follows one redirect) ─────────────────────────────────────
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const getter = url.startsWith("https") ? httpsGet : httpGet;

    getter(url, (res) => {
      // Follow one level of redirect
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        res.resume();
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        res.resume();
        return;
      }

      const file = createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
      file.on("error", (err) => {
        file.close();
        reject(err);
      });
    }).on("error", reject);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  const env = await loadEnv();
  const iconUrl = env.VITE_APP_ICON_URL;

  if (!iconUrl) {
    console.log("[fetch-icon] VITE_APP_ICON_URL not set — skipping icon download.");
    return;
  }

  // Ensure public/ exists
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }

  console.log(`[fetch-icon] Downloading icon from ${iconUrl} …`);

  try {
    await downloadFile(iconUrl, outputPath);
    console.log(`[fetch-icon] ✓ Saved to public/pwa-icon.png`);
  } catch (err) {
    // Non-fatal: warn and continue. If the file already exists from a previous
    // build, Vite will use it; if not, the PWA will simply omit that icon.
    console.warn(`[fetch-icon] ⚠ Could not download icon: ${err.message}`);
    console.warn("[fetch-icon]   Build will continue without refreshing pwa-icon.png.");
  }
})();
