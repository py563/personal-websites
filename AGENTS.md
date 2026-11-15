# Personal websites

One Git repository, three independent Hugo sites, three deployments. Do not merge them into one Hugo project.

| Site | Directory | Public URL | Hugo | Theme |
|---|---|---|---|---|
| Professional portfolio | `sites/portfolio` | `https://prajwalyashasvi.in/` | 0.108.0 extended | `themes/hugo-resume` |
| Teaching | `sites/teaching` | `https://teaching.prajwalyashasvi.in/` | 0.169.0 extended, Node 22, Dart Sass, Pagefind | `themes/dot-org-hugo-theme` |
| Personal blog | `sites/memoirs` | `https://memoirs.prajwalyashasvi.in/` | 0.114.0 extended | `themes/loveit` |

Pins live in `scripts/versions.sh`. Scripts download the extended binary into `.hugo/bin/` and refuse to call a random `hugo` on `PATH`.

## Which site you are in

Edit only the site the task names.

- Portfolio content, resume data, and the floatimg shortcode: `sites/portfolio`.
- Courses, workshops, contact form, teaching CSS: `sites/teaching`.
- Personal essays: `sites/memoirs`.

`content/blog` in the portfolio, `content/en/blog` in teaching, and `content/posts` in memoirs are different collections. Never copy a post from one into another as part of a refactor. Never retarget `baseURL`, permalinks, or menus to "share" a path across hosts.

Read `sites/<name>/AGENTS.md` before changing that site.

## Commands

From the repository root:

```bash
./scripts/build-all.sh
./scripts/validate-all.sh
./scripts/dev.sh portfolio    # http://localhost:1313/
./scripts/dev.sh teaching     # http://localhost:1314/
./scripts/dev.sh memoirs      # http://localhost:1315/
./scripts/build-one.sh memoirs
```

Direct Hugo, after the matching extended binary is active and submodules are initialized:

```bash
# sites/portfolio — Hugo 0.108.0 extended
hugo --minify --baseURL https://prajwalyashasvi.in/

# sites/teaching — Hugo 0.169.0 extended
# Put the native sass-embedded binary on PATH before node_modules/.bin.
hugo --minify --configDir=config --baseURL https://teaching.prajwalyashasvi.in/
npx -y pagefind --site public

# sites/memoirs — Hugo 0.114.0 extended
hugo --minify --baseURL https://memoirs.prajwalyashasvi.in/
```

Teaching's `package.json` script `dev:build` still passes `--themesDir=../..`. That path is wrong. Use `./scripts/dev.sh teaching`.

## Hugo versions stay separate

Do not build portfolio or memoirs with teaching's Hugo. LoveIt at the pinned submodule commit compiles its CSS with the LibSass embedded in Hugo 0.114 extended. Hugo 0.128 and later removed that library.

To try a newer Hugo against memoirs after the LoveIt submodule has been updated:

```bash
HUGO_MEMOIRS=0.139.4 ./scripts/build-one.sh memoirs
```

Leave `HUGO_PORTFOLIO` and `HUGO_TEACHING` alone. If the experiment works, change the default in `scripts/versions.sh` and the memoirs Cloudflare build command in the same commit. If it fails, the other two sites are unchanged.

## Shared code

`shared/` is a placeholder. Do not add a theme, CSS, or partial there unless the same behavior already exists in two sites and each site can override it. Do not add `go.mod` or rename `config.toml` to `hugo.toml` as a cleanup. Those files are the production configuration.

Theme checkouts under `sites/*/themes/` are git submodules. Change them by moving the submodule pointer, not by editing theme files in place.

Site overrides belong in that site's `layouts/`, `assets/`, or `static/`.

## Deployment

GitHub Actions (`.github/workflows/ci.yml`) builds all three sites. It does not deploy.

Cloudflare Pages is the publisher: three projects, one repository, production branch `main`.

| Project | Root directory | Build command | Deploy command | Include paths |
|---|---|---|---|---|
| `personal-websites-portfolio` | `sites/portfolio` | `bash ../../scripts/build-one.sh portfolio` | `npx wrangler deploy` | `sites/portfolio/**`, `scripts/**`, `shared/**` |
| `personal-websites-teaching` | `sites/teaching` | `bash ../../scripts/build-one.sh teaching` | `npx wrangler deploy` | `sites/teaching/**`, `scripts/**`, `shared/**` |
| `personal-websites-memoirs` | `sites/memoirs` | `bash ../../scripts/build-one.sh memoirs` | `npx wrangler deploy` | `sites/memoirs/**`, `scripts/**`, `shared/**` |

`sites/<name>/wrangler.jsonc` tells Wrangler to upload `./public`. The `name` must match the Cloudflare project. Do not remove it: `config.toml` matches both the Hugo and Zola detectors, and `wrangler deploy` then refuses to configure the project.

Set `NODE_VERSION=22` on the teaching project. The build script installs the pinned extended Hugo itself. Pass the production `--baseURL` values already baked into `scripts/build-one.sh`, including the trailing slash on memoirs.

Do not change DNS, Cloudflare custom domains, or the contact Worker at `contact-api.prajwalyashasvi.in` unless the task says to cut over.

## Testing

A change inside one site still needs `./scripts/build-one.sh <that-site>` at minimum. CI builds all three.

Teaching production HTML is incomplete until Pagefind has run. `validate-all.sh` expects `public/pagefind/pagefind.js`.

Do not require the old teaching alias `/vce-wsl-vac/`. It was removed in the teaching history imported here.

Before any DNS change, compare each site's `public/` with the live host: canonical URL, sitemap, RSS or JSON outputs, navigation, and downloadable files.

## Restrictions

- Do not combine the three configs, content trees, or menus.
- Do not upgrade all three Hugo versions in one change.
- Do not delete source repositories or edit them from this repo.
- Do not commit `public/`, `node_modules/`, or `.hugo/`.
- Do not force the sites to look the same.
