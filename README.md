# Pico Reforged website

The documentation site for [Pico Reforged](https://github.com/rusticstack/pico-reforged), served at https://pico.rusticstack.com.

Next.js 16 (App Router, static export) with Fumadocs headless (`fumadocs-core`, `fumadocs-mdx`, no `fumadocs-ui`, no Tailwind). The page chrome is styled with Pico Reforged itself through its PostCSS plugin (`postcss.config.mjs`), so the site also tests that integration.

## Relation to the library

The CSS framework lives in [rusticstack/pico-reforged](https://github.com/rusticstack/pico-reforged). This repository only holds the website. It uses the published npm package `@rusticstack/pico-reforged`, pinned to an exact version in `package.json`. The build copies the CSS, the theme sources, the compiler targets and the agent skill out of `node_modules`, so the site always shows the release it pins.

To document a new release, bump the pin and the lockfile together:

```shell
pnpm add @rusticstack/pico-reforged@<version> --save-exact
```

The site was part of the library repository until version 2.0.1. Its history was kept when it moved here.

`examples/` holds copies of pages from the library repository (`examples/*.html`, `test/fixtures/kitchen-sink.html` and `test/fixtures/extras/tabs.html`), because the npm package does not ship them. Update them by hand when the originals change.

## Develop

Node 22.18 or newer and pnpm.

```shell
pnpm install
pnpm dev
```

`dev` and `build` first run `scripts/copy-css.mjs`. It copies the built CSS (all themes, class-less, extras) from the package, the pages in `examples/` and `SKILL.md` into `public/` (ignored by git). It also writes `public/css/site-themes.css`, the runtime theme sheet the header color picker uses.

Build and preview the static output:

```shell
pnpm build
pnpm preview   # serves out/ on http://localhost:3000
```

`pnpm typecheck` runs TypeScript.

## Update the library version

The site builds from the published npm package, pinned to an exact version in `package.json`. pnpm only installs versions older than its release age limit, so `pnpm-workspace.yaml` lists the current version in `minimumReleaseAgeExclude`, which lets a new release be used the day it is published. Both places and the lockfile have to change together. The script does it:

```shell
node scripts/bump-library.mjs 2.0.2 --dry-run   # print the changes, write nothing
node scripts/bump-library.mjs 2.0.2
```

It checks with `npm view` that the version exists, sets the pin in `package.json`, replaces the `@rusticstack/pico-reforged@...` entry in `pnpm-workspace.yaml`, runs `pnpm install` to update `pnpm-lock.yaml` and prints the next steps: run `pnpm build`, compare the CSS with the previous release, update `examples/` if the originals changed, and open a pull request. Running it with the version that is already pinned changes nothing.

## Writing docs

Pages live in `content/docs/<section>/<page>.mdx`. Order comes from `meta.json` in each folder. Frontmatter takes `title` and `description`.

Live examples use `<Example>` with a fenced `html` block inside:

````mdx
<Example title="Primary button" height={140}>
```html
<button>Click</button>
```
</Example>
````

Props: `title` (required), `height` (px, leave it out to fit the content), `variant="classless"`, `css={["pico.extras"]}` (extra stylesheets from `public/css`, without `.min.css`), `bare` (no padding). Tables of variables and options use `<Tokens items={[...]} />` and `<PropsTable items={[...]} />`.

Every page is also served as Markdown at `/md/<section>/<page>.md`, and listed in `/llms.txt` and `/llms-full.txt`.

## Deploy to Vercel

The site is a static export, so the free plan is enough. The Vercel project `pico-reforged-website` is linked to this repository:

- Root Directory: the repository root.
- Framework Preset: Other (`vercel.json` sets `"framework": null`). The site is a static export in `out/`, and the Next.js preset would look for a `.next` server build there and fail with "routes-manifest.json couldn't be found".
- Install Command `pnpm install --frozen-lockfile`, Build Command `pnpm build`, Output Directory `out`, all from `vercel.json`.
- Domain `pico.rusticstack.com`, with a CNAME record `pico` to `cname.vercel-dns.com` in the DNS of `rusticstack.com`.

Pushes to `main` deploy to production, other branches get preview URLs.

## Notes

- Next.js prefetches route segment files (`__next.*.txt`) for client navigation. On a host that does not map them, those requests 404 and the router falls back to a normal page load. Nothing breaks.
- Search is static: the index is exported to `/api/search` and downloaded on first use. That is fine for this size of site.
- Examples run in `sandbox="allow-scripts allow-same-origin"` iframes. Same-origin access lets their CSS requests carry cookies on protected preview deployments. The theme and color scheme reach them through `postMessage`, and a theme file that fails to load falls back to the base stylesheet.
- The footer and the migration page credit Pico CSS by Lucas Larroche (MIT). Pico Reforged is not the official Pico CSS and does not use its logo.

## Disclaimer

Pico Reforged is an independent fork of Pico CSS v2.1.1 (MIT). It is not affiliated with or endorsed by the Pico CSS project. The Pico CSS name and logo belong to their authors.

## License

MIT, see [LICENSE](LICENSE). Pico Reforged is based on Pico CSS, Copyright (c) 2019-2024 Pico, and keeps that notice next to the Pico Reforged copyright.