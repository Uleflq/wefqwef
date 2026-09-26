import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

const source = await readFile(new URL("../src/game.js", import.meta.url), "utf8");
const bootstrap = source.indexOf("  var Fu = new URLSearchParams(location.search),");
assert.ok(bootstrap > 0, "The original browser bootstrap boundary must exist.");

// Exercise the actual bundled geometry without starting WebGL or the game loop.
const { body } = runInNewContext(
  `${source.slice(0, bootstrap)}return { body: Bl() };})();`,
  { console, TextDecoder, TextEncoder, URL, URLSearchParams, performance },
  { timeout: 15_000 },
);

test("every body panel has finite vertex data and valid triangle indices", () => {
  for (const [part, materials] of Object.entries({
    shell: body.shell,
    ...body.parts,
  })) {
    for (const [material, geometries] of Object.entries(materials)) {
      for (const geometry of geometries) {
        const label = `${part}/${material}`;
        assert.ok(geometry.attributes.position.count > 0, label);
        for (const [name, attribute] of Object.entries(geometry.attributes)) {
          assert.ok([...attribute.array].every(Number.isFinite), `${label}/${name}`);
        }
        const indices = geometry.index?.array;
        if (!indices) continue;
        assert.equal(indices.length % 3, 0, label);
        for (const index of indices) {
          assert.ok(index < geometry.attributes.position.count, label);
        }
      }
    }
  }
});

for (const [left, right] of [
  ["door_fl", "door_fr"],
  ["door_rl", "door_rr"],
  ["fender_fl", "fender_fr"],
]) {
  test(`${left} and ${right} remain mirror-symmetric`, () => {
    const lhs = body.parts[left];
    const rhs = body.parts[right];
    assert.deepEqual(Object.keys(lhs), Object.keys(rhs));
    for (const material of Object.keys(lhs)) {
      assert.equal(lhs[material].length, rhs[material].length);
      lhs[material].forEach((geometry, index) => {
        const a = geometry.attributes.position;
        const b = rhs[material][index].attributes.position;
        assert.equal(a.count, b.count);
        for (let vertex = 0; vertex < a.count; vertex++) {
          const label = `${left}/${material}/${index}/${vertex}`;
          assert.ok(Math.abs(a.getX(vertex) + b.getX(vertex)) < 1e-6, label);
          assert.ok(Math.abs(a.getY(vertex) - b.getY(vertex)) < 1e-6, label);
          assert.ok(Math.abs(a.getZ(vertex) - b.getZ(vertex)) < 1e-6, label);
        }
      });
    }
  });
}
