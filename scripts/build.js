import { cp, mkdir, rm } from "node:fs/promises";

const sources = ["index.html", "style.css", "app.js", "sound.js"];

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await Promise.all(sources.map((source) => cp(source, `dist/${source}`)));

console.log("Site statique construit dans dist/");
