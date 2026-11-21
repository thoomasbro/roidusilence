import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const files = new Map([
  ["/", ["index.html", "text/html"]],
  ["/style.css", ["style.css", "text/css"]],
  ["/app.js", ["app.js", "text/javascript"]],
  ["/sound.js", ["sound.js", "text/javascript"]],
]);
const port = Number(process.env.PORT || 3000);
const server = createServer(async (request, response) => {
  const resource = files.get(new URL(request.url, "http://localhost").pathname);
  if (!resource) {
    response.writeHead(404);
    response.end("Page introuvable");
    return;
  }
  try {
    const content = await readFile(new URL(resource[0], import.meta.url));
    response.writeHead(200, { "Content-Type": `${resource[1]}; charset=utf-8` });
    response.end(content);
  } catch (error) {
    console.error("Impossible de servir la page :", error);
    response.writeHead(500);
    response.end("Impossible de charger la page");
  }
});
server.listen(port, "127.0.0.1", () => {
  console.log(`Le Roi du silence est accessible sur http://localhost:${port}`);
});
server.on("error", (error) => {
  console.error("Impossible de démarrer le serveur :", error);
  process.exitCode = 1;
});
