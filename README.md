# personal-websites

Three Hugo sites in one repository. Each site keeps its own configuration, content, theme, and Hugo version. Cloudflare Pages builds them separately. GitHub Actions only checks that they build.

| Site | Path | URL | Hugo |
|---|---|---|---|
| Portfolio | `sites/portfolio` | https://prajwalyashasvi.in/ | 0.108.0 extended |
| Teaching | `sites/teaching` | https://teaching.prajwalyashasvi.in/ | 0.169.0 extended |
| Memoirs | `sites/memoirs` | https://memoirs.prajwalyashasvi.in/ | 0.114.0 extended |

`shared/` is reserved and empty. Agent conventions are in `AGENTS.md` and in each `sites/<name>/AGENTS.md`.

## Requirements

- Git, with submodules
- `curl` and `tar` (the scripts download the pinned extended Hugo binary)
- Node.js 22 and npm, for the teaching site only

The scripts do not use whatever `hugo` happens to be installed. On a machine whose default Hugo is newer than 0.114, memoirs and the portfolio would build incorrectly if that binary were used.

## Commands

```bash
git submodule update --init --recursive

./scripts/build-all.sh
./scripts/validate-all.sh

./scripts/dev.sh portfolio   # http://localhost:1313/
./scripts/dev.sh teaching    # http://localhost:1314/
./scripts/dev.sh memoirs     # http://localhost:1315/
```

Build one site:

```bash
./scripts/build-one.sh portfolio
./scripts/build-one.sh teaching
./scripts/build-one.sh memoirs
```

Try a newer Hugo against memoirs only, after updating `sites/memoirs/themes/loveit`:

```bash
HUGO_MEMOIRS=0.139.4 ./scripts/build-one.sh memoirs
```

Direct Hugo commands, from the site directory, with that site's extended binary on `PATH`:

```bash
# portfolio
hugo --minify --baseURL https://prajwalyashasvi.in/

# teaching (npm ci first, and node_modules/.bin on PATH)
hugo --minify --configDir=config --baseURL https://teaching.prajwalyashasvi.in/
npx -y pagefind --site public

# memoirs
hugo --minify --baseURL https://memoirs.prajwalyashasvi.in/
```

Version pins and base URLs are in `scripts/versions.sh`.

## Layout

```text
sites/portfolio   former py563/cv-hugo
sites/teaching    former py563/taught-courses
sites/memoirs     former py563/memoirs
shared            placeholder, no shared theme yet
scripts           pinned builds and dev servers
.github/workflows/ci.yml
```

Themes are submodules:

- `sites/portfolio/themes/hugo-resume`
- `sites/teaching/themes/dot-org-hugo-theme`
- `sites/memoirs/themes/loveit`

## Deployment

GitHub remains the remote. Production publishing is three Cloudflare Pages projects on this repository, branch `main`. Do not add a second deploy from GitHub Actions.

| | Portfolio | Teaching | Memoirs |
|---|---|---|---|
| Worker name | `personal-websites-portfolio` | `personal-websites-teaching` | `personal-websites-memoirs` |
| Root directory | `sites/portfolio` | `sites/teaching` | `sites/memoirs` |
| Build command | `bash ../../scripts/build-one.sh portfolio` | `bash ../../scripts/build-one.sh teaching` | `bash ../../scripts/build-one.sh memoirs` |
| Deploy command | `npx wrangler deploy` | `npx wrangler deploy` | `npx wrangler deploy` |
| Include paths | `sites/portfolio/**`, `scripts/**`, `shared/**` | `sites/teaching/**`, `scripts/**`, `shared/**` | `sites/memoirs/**`, `scripts/**`, `shared/**` |
| Environment | | `NODE_VERSION=22` | |

Each site has a `wrangler.jsonc` that publishes `./public`. The Worker name in that file must match the project name in Cloudflare. Without that file, `wrangler deploy` sees `config.toml` and stops because the same file looks like both Hugo and Zola.

Attach `prajwalyashasvi.in`, `teaching.prajwalyashasvi.in`, and `memoirs.prajwalyashasvi.in` only after the `*.pages.dev` builds match the live sites. The DNS zone is already on Cloudflare. Leave `contact-api.prajwalyashasvi.in` on the Worker. Details and rollback are in `docs/migration-plan.md`.

## Troubleshooting

**Theme directory is empty.** Run `git submodule update --init --recursive` from the repository root.

**Memoirs or the portfolio looks wrong, or CSS fails.** The shell `hugo` is probably too new. Use `./scripts/build-one.sh`.

**Teaching CSS fails with a Sass error.** Hugo needs the native `sass` binary from `sass-embedded`, not the JavaScript `sass` package that npm sometimes links as `node_modules/.bin/sass`. `./scripts/build-one.sh teaching` puts the native binary first on `PATH`. Node 22 matches `.nvmrc`.

**Teaching search has no index.** Pagefind runs after Hugo. `validate-all.sh` checks `sites/teaching/public/pagefind/pagefind.js`.

**A content edit rebuilt the wrong site.** Cloudflare include paths are the control. A memoir edit should match only `sites/memoirs/**`. Changes under `scripts/` or `shared/` rebuild every project.

**`npm run dev:build` inside teaching.** That script passes `--themesDir=../..` and does not match this repository. Use `./scripts/dev.sh teaching`.
