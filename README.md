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

- `src/game.js`: readable, formatting-only recovery of the bundled JavaScript,
  including the original Three.js and Rapier versions.
- `src/index.html`: single-file build template.
- `public/index.html`: committed playable build; rebuild after source edits.
- `reference/`: untouched original build, car reference images and historical
  feedback from the attachment.

The original minified symbols are preserved to avoid altering unrelated game
systems during source recovery.
