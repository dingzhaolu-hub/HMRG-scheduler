import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");
const preview = resolve(root, "preview");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(resolve(preview, "index.html"), resolve(dist, "index.html"));
await cp(resolve(preview, "preview.css"), resolve(dist, "preview.css"));
await cp(resolve(preview, "preview.js"), resolve(dist, "preview.js"));
await cp(resolve(preview, "brand-logo-mark.png"), resolve(dist, "brand-logo-mark.png"));

console.log("Built preview app to dist");
