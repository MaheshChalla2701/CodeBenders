import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifactName = process.argv[2] ?? "cashpilot-complete-demo";
if (!/^[a-z0-9-]+$/i.test(artifactName)) {
  throw new Error("Artifact name may contain only letters, numbers, and hyphens");
}
const videoPath = path.join(root, "artifacts", `${artifactName}.webm`);
const posterPath = path.join(root, "artifacts", `${artifactName}-poster.png`);

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(pathToFileURL(videoPath).href);
  const video = page.locator("video");
  await video.waitFor({ state: "visible" });
  await video.evaluate((element) => {
    const media = element;
    return media.readyState >= 1
      ? undefined
      : new Promise((resolve) => media.addEventListener("loadedmetadata", resolve, { once: true }));
  });
  const metadata = await video.evaluate((element) => ({
    durationSeconds: Number(element.duration.toFixed(2)),
    width: element.videoWidth,
    height: element.videoHeight,
  }));
  await video.evaluate((element) => {
    const media = element;
    media.currentTime = Math.min(8, Math.max(0, media.duration - 0.5));
    return new Promise((resolve) => media.addEventListener("seeked", resolve, { once: true }));
  });
  await page.screenshot({ path: posterPath });
  console.log(JSON.stringify({ ...metadata, posterPath }, null, 2));
} finally {
  await browser.close();
}
