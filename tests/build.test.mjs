import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Script } from "node:vm";

const source = await readFile(new URL("../src/game.js", import.meta.url), "utf8");
const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");

test("the committed standalone game matches the current source", () => {
  const scripts = [...html.matchAll(/<script>\n([\s\S]*?)\n<\/script>/g)];
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0][1], source.replace(/<\/script/gi, "<\\/script"));
  assert.doesNotThrow(() => new Script(scripts[0][1]));
});

test("the standalone game does not need external scripts or stylesheets", () => {
  assert.doesNotMatch(html, /<script\b[^>]*\bsrc\s*=/i);
  assert.doesNotMatch(html, /<link\b[^>]*\brel\s*=\s*["']stylesheet["']/i);
  assert.doesNotMatch(html, /<!-- GAME_SCRIPT -->/);
});
