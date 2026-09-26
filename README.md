# The Long Road

Survival road-trip game built with Three.js and Rapier. Recovered from the
single-file build in the supplied `Suiwe-main.zip` archive.

## Play

Open **`public/index.html`** in a modern browser with WebGL 2 support. The file
contains the entire game, including its dependencies and procedural assets;
no CDN or network connection is required.

## Development

Requires Node.js 20+ and Python 3 for the local development server.

```sh
npm run build   # Rebuild the standalone public/index.html
npm run dev     # Build and serve at http://localhost:3000
npm test       # Run regression checks
```

`PORT` can override the server port. No npm dependencies are needed.

- `src/game.js`: editable recovery of the bundled JavaScript, with corrected car
  surface interpolation and the original Three.js and Rapier versions.
- `src/index.html`: single-file build template.
- `public/index.html`: committed playable build; rebuild after source edits.
- `reference/`: untouched original build, car reference images and historical
  feedback from the attachment.

The original minified symbols are preserved to avoid altering unrelated game
systems during source recovery.

## Car model regression checks

The body and cabin use shape-preserving Hermite tangents rather than unrestricted
averaged tangents. This prevents the generated panels from bulging or folding
beyond their control sections. The longitudinal profiles also meet their clamped
ends with zero slope, avoiding a sharp lighting seam at the nose and tail.

Tests evaluate the same geometry code used by the game, checking panel bounds,
profile continuity, finite mesh data, left/right symmetry and standalone build
consistency. GitHub Actions runs these checks and uploads the playable HTML as
the `the-long-road` artifact on every push.
