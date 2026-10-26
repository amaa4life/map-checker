# Amaa's Rotating Maps

Browser checker for custom map `.txt` files. It tells you whether a map is compatible with Amaa's Rotating Maps. The rules are the same five as the `mapcheck` console app: visual FX, Rigidbody and Floater, cloth wagons, physical cuboids over 2000, and other physical meshes over 80.

Drop one or more map files. Each file opens in an accordion as a pass or a fail. A failure lists the objects and the fix. The rules stay on the page so you can read them before exporting.

Files are read in the browser. Nothing is uploaded.

## Requirements

Angular CLI 22 needs Node.js `^22.22.3`, `^24.15.0`, or `>=26`.

## Run locally

```bash
npm ci
npm start
```

Open `http://localhost:4200/`.

## Test and build

```bash
npm test
npm run build
```

The static site is written to `dist/mapcheck-web/browser`.

## GitHub Pages

The live site is https://amaa4life.github.io/map-checker/.

A push to `main` runs `.github/workflows/pages.yml`, which builds with `--base-href /map-checker/` and publishes `dist/mapcheck-web/browser`.
