import { mkdir, readFile, writeFile } from "node:fs/promises";
import { Script } from "node:vm";

const root = new URL("../", import.meta.url);
const source = await readFile(new URL("src/game.js", root), "utf8");
const template = await readFile(new URL("src/index.html", root), "utf8");
const marker = "<!-- GAME_SCRIPT -->";

if (template.split(marker).length !== 2) {
  throw new Error("The HTML template must contain exactly one game script marker.");
}
new Script(source, { filename: "src/game.js" });
const html = template.replace(
  marker,
  () => `<script>\n${source.replace(/<\/script/gi, "<\\/script")}\n</script>`,
);
await mkdir(new URL("public/", root), { recursive: true });
await writeFile(new URL("public/index.html", root), html);
console.log("Built public/index.html (standalone, no external assets).");
