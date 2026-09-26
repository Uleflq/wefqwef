import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

const source = await readFile(new URL("../src/game.js", import.meta.url), "utf8");
const bootstrap = source.indexOf("  var Fu = new URLSearchParams(location.search),");
assert.ok(bootstrap > 0, "The original browser bootstrap boundary must exist.");

// Exercise the actual bundled geometry without starting WebGL or the game loop.
const { body, surfaces, Vector3, interpolateProfile, profiles } = runInNewContext(
  `${source.slice(0, bootstrap)}return {
    body: Bl(), surfaces: { body: Rg, cabin: rg }, Vector3: y,
    interpolateProfile: zc, profiles: { belt: _d, floor: jd }
  };})();`,
  { console, TextDecoder, TextEncoder, URL, URLSearchParams, performance },
  { timeout: 15_000 },
);

for (const [name, surface] of Object.entries(surfaces)) {
  test(`${name} loft stays inside each pair of control sections`, () => {
    for (let column = 0; column <= 100; column++) {
      const u = column / 100;
      for (let section = 0; section < surface.vk.length - 1; section++) {
        const v0 = surface.vk[section];
        const v1 = surface.vk[section + 1];
        const a = surface.point(u, v0, 1, new Vector3());
        const b = surface.point(u, v1, 1, new Vector3());
        for (let sample = 1; sample < 20; sample++) {
          const p = surface.point(u, v0 + (v1 - v0) * sample / 20, 1, new Vector3());
          for (const axis of ["x", "y", "z"]) {
            const low = Math.min(a[axis], b[axis]) - 1e-9;
            const high = Math.max(a[axis], b[axis]) + 1e-9;
            assert.ok(
              p[axis] >= low && p[axis] <= high,
              `${name}: ${axis} overshoot at u=${u}, section=${section}`,
            );
          }
        }
      }
    }
  });
}

for (const [name, points] of Object.entries(profiles)) {
  test(`${name} profile does not bulge between its control points`, () => {
    const sample = interpolateProfile(points);
    for (let i = 0; i < points.length - 1; i++) {
      const [x0, y0] = points[i];
      const [x1, y1] = points[i + 1];
      assert.equal(sample(x0), y0);
      for (let step = 1; step < 20; step++) {
        const value = sample(x0 + (x1 - x0) * step / 20);
        assert.ok(value >= Math.min(y0, y1) - 1e-9, name);
        assert.ok(value <= Math.max(y0, y1) + 1e-9, name);
      }
    }
  });

  test(`${name} profile meets its clamped ends without a crease`, () => {
    const sample = interpolateProfile(points);
    const epsilon = 1e-6;
    const [firstX, firstY] = points[0];
    const [lastX, lastY] = points.at(-1);
    assert.equal(sample(firstX - epsilon), firstY);
    assert.equal(sample(lastX + epsilon), lastY);
    assert.ok(Math.abs((sample(firstX + epsilon) - firstY) / epsilon) < 1e-4);
    assert.ok(Math.abs((sample(lastX - epsilon) - lastY) / epsilon) < 1e-4);
  });
}

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
