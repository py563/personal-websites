# Migration plan

Status: import started. DNS and the three source repositories stay as they are. Nothing has been pushed. Cloudflare projects have not been created.

Decisions added when implementation started:

- Hugo stays pinned per site until a site is verified on a newer binary. Memoirs can be rebuilt alone with `HUGO_MEMOIRS=<version> ./scripts/build-one.sh memoirs` after the LoveIt submodule is updated. The other two pins do not move with that experiment.
- Shared theme, `go.mod`, and a rename to `hugo.toml` wait. The first milestone is three independent projects, one repository, one agent guide. Existing `config.toml` / `config/` files stay.
- Pagefind and the teaching alias were handled in `taught-courses` before the import. Local commit `597f98b` adds Pagefind to the production build and removes the `/vce-wsl-vac/` alias. That commit was not on `origin` at import time. The monorepo imports that local HEAD. Do not put the alias back unless asked.

This is a hosting and repository consolidation. It is not a redesign, a theme merge, or a Hugo upgrade.

## Decisions

| Topic | Decision |
|---|---|
| Repository | Continue `py563/personal-websites` (already created, empty). Do not push until implementation is approved. |
| Site boundaries | Three Hugo projects under `sites/portfolio`, `sites/teaching`, `sites/memoirs`. No shared `content/`, no single `config.toml`. |
| History | Import each repository with `git subtree add` so original commit hashes stay reachable in the monorepo. Original repos remain untouched. |
| Themes | Keep each theme as a git submodule at the same path and commit it has today. |
| Hugo versions | Pin per site: portfolio **0.108.0 extended**, memoirs **0.114.0 extended**, teaching **0.169.0 extended**. Do not unify. |
| Shared design system | Do not extract one. `shared/` is a placeholder with a README that says it is intentionally empty. |
| Deploy | Three Cloudflare Pages projects, one Git repository, native Git integration. GitHub Actions validates builds and does not deploy. |
| DNS | Zone is already on Cloudflare. Change records only after each Pages project has been checked on its `*.pages.dev` hostname. |
| Original GitHub Pages | Leave the existing workflows and custom domains in place so rollback is a DNS revert. |

## Directory mapping

```text
personal-websites/
├── docs/
│   ├── repository-audit.md
│   └── migration-plan.md
├── sites/
│   ├── portfolio/          # git subtree of py563/cv-hugo @ d0aeb1b
│   ├── teaching/           # git subtree of taught-courses @ 597f98b
│   └── memoirs/            # git subtree of py563/memoirs @ bf7069f
│                           # source checkout folder: my-personal-blog
├── shared/
│   └── README.md           # placeholder; no theme, CSS, JS, or partials yet
├── scripts/
│   ├── hugo-versions.env   # pinned versions and baseURLs
│   ├── build-all.sh
│   ├── validate-all.sh
│   └── dev.sh
├── .github/workflows/
│   └── ci.yml              # build only
├── AGENTS.md
├── sites/portfolio/AGENTS.md
├── sites/teaching/AGENTS.md
├── sites/memoirs/AGENTS.md
├── README.md
├── .gitignore
└── .editorconfig
```

`shared/hugo-theme`, `shared/css`, `shared/js`, and `shared/components` are omitted on purpose. Creating empty trees for them implies a design system that does not exist. The placeholder README records the criteria for adding them later.

### What is copied as-is

For each site, the whole tracked tree moves under `sites/<name>/` with paths unchanged relative to that site root:

- `config.toml` and, for teaching, the entire `config/` directory
- `content/`, `data/`, `layouts/`, `static/`, `archetypes/`, `assets/`
- `themes/<theme>` gitlink and `.gitmodules`
- `package.json`, `package-lock.json`, `postcss.config.js`, `.nvmrc` (teaching only)
- `.github/workflows/hugo.yml` kept inside the site as a historical reference, then disabled or deleted from the path that would run in the monorepo. See "Workflows" below.
- `README.md`, `LICENSE`, `.gitignore`, `.prettierignore`
- `static/CNAME` where it exists

Not copied:

- `public/`, `resources/`, `node_modules/`, `.hugo_build.lock`, `hugo_stats.json`
- the portfolio Ananke submodule (there is no gitlink; drop that stanza from `.gitmodules` when the portfolio tree is imported)
- any rewrite of Markdown, front matter, menus, or permalinks

### Per-site map

| Source | Monorepo path | Theme gitlink to preserve |
|---|---|---|
| `cv-hugo` | `sites/portfolio` | `themes/hugo-resume` @ `a5d72a68b569e16fce2d5cb66f26f336036d2bf7` |
| `taught-courses` local `597f98b` (Pagefind in CI, `/vce-wsl-vac/` alias removed; one commit ahead of `origin/main` at import) | `sites/teaching` | `themes/dot-org-hugo-theme` @ `cb1ecb0d3e2909b059774601868f4394f823d769` |
| `memoirs` (`my-personal-blog` locally) | `sites/memoirs` | `themes/loveit` @ `e9e89a4613baee823596822b7d246f5931263491` |

Subtree prefixes mean a file that is `content/posts/Rains-in-Hyderabad.md` in memoirs becomes `sites/memoirs/content/posts/Rains-in-Hyderabad.md`. Hugo's working directory is the site root, so URLs do not gain a `/sites/memoirs` prefix.

## Configuration changes

Intended result: a site built from the monorepo emits the same canonical URLs as today's GitHub Actions build.

| Site | Change during the initial import |
|---|---|
| Portfolio | None to `baseURL`, permalinks, outputs, or params. Remove the unused `themes/ananke` stanza from `.gitmodules` so the file matches the gitlink. |
| Teaching | None. Keep root `config.toml` and `config/`. Keep `--configDir=config`. Keep `baseURL` `https://teaching.prajwalyashasvi.in/`. |
| Memoirs | None to the config file. Build with `--baseURL https://memoirs.prajwalyashasvi.in/` (trailing slash), which is what the current workflow passes, not the slash-less value in `config.toml`. |

Deferred until DNS cutover, as a separate commit:

- `sites/portfolio/config.toml` `gitCommitPrefix` currently points at `py563/cv-hugo`.
- `sites/teaching/config/_default/params.yaml` `github.repo_url` currently points at `py563/taught-courses`.
- Portfolio `static/admin/config.yml` backend repo `py563/cv-hugo`, branch `wip`.

Those strings are not public page URLs. Leaving them alone keeps the first build comparable with production. After the monorepo is the source of truth, point the footer and "edit this page" links at `py563/personal-websites`.

Do not change:

- permalink `publications = "/presentations/:title/"`
- the alias `/vce-wsl-vac/`
- menu URLs
- `static/CNAME` files (harmless on Cloudflare, required if a rollback republishes the same `public/` directory to GitHub Pages)
- front matter, including memoirs filenames that act as slugs
- Goldmark `unsafe: true` on teaching
- LoveIt `noClasses = false`

## Themes and dependencies

Keep submodules. Do not vendor theme files and do not convert them to Hugo Modules.

After `git subtree add`, the gitlinks still point at the theme commits, but the submodule working trees are not populated until:

```bash
git submodule update --init --recursive
```

Cloudflare and GitHub Actions must run that (or an equivalent) before `hugo`. Theme repositories are public, so no deploy key is required.

Dependency policy:

- Portfolio: Hugo 0.108.0 extended only. No Node, no Sass, unless a Phase 5 build proves the `.deb` needs a library the image lacks.
- Memoirs: Hugo 0.114.0 extended only. Do not upgrade LoveIt. Do not add Dart Sass unless the extended binary fails to compile theme CSS.
- Teaching: Hugo 0.169.0 extended, Node 22 (from `.nvmrc`), `npm ci` (not `npm install`), and `node_modules/.bin` on `PATH` so `sass` resolves. Keep PostCSS packages even though the site's `head/css.html` override does not call `postCSS`.

`package.json` scripts that pass `--themesDir=../..` stay as they are. `scripts/dev.sh teaching` will call Hugo the way CI does, not those scripts.

## URL and permalink risks

| Risk | Why it matters | Mitigation |
|---|---|---|
| Building memoirs from `config.toml` alone drops the trailing slash the workflow adds | Canonical, sitemap, and RSS absolute URLs can change | Always pass `--baseURL https://memoirs.prajwalyashasvi.in/` |
| Cloudflare preview URLs (`*.pages.dev`) leaking into canonical tags | Preview HTML would advertise the wrong host | Production and preview builds both pass the live `baseURL`. Previews are for visual checks. Absolute links inside them point at production. |
| Renaming content files | Memoirs and portfolio slugs come from filenames and bundle directories | Copy paths byte for byte |
| Flattening `content/en` or enabling language subdirs | Teaching URLs would gain `/en/` | Keep `contentDir` and `defaultContentLanguageInSubdir: false` |
| Building memoirs with Hugo 0.169 | Template and LibSass failures, or different HTML | Install 0.114.0 extended in the memoirs job and script |
| Building portfolio with Hugo 0.169 | Same class of risk against hugo-resume from 2023 | Install 0.108.0 extended |
| Losing `/presentations/:title/` | Config permalink is the only thing that creates those paths | Do not touch `[permalinks]` |
| Losing `/vce-wsl-vac/` | Removed on purpose in `taught-courses` `597f98b` before import | Do not reintroduce it in the monorepo |
| Merging the three `blog` sections | Different posts, different URLs, different hosts | Forbidden by `AGENTS.md` |
| Relative image paths inside memoirs posts | `static/` only contains a favicon and one avatar | Phase 5 diffs live HTML against the new build and fetches any URL the live site serves that the build does not |

Phase 5 comparison, per site, against the live origin (before DNS changes):

- `hugo` exits 0 with the pinned binary
- home page, one inner page, one section page
- `/sitemap.xml` URL set
- RSS URLs where the site emits RSS (memoirs and teaching; portfolio home is HTML+JSON, not RSS)
- canonical `href` and `baseURL`
- every file under `static/` returns the same path
- portfolio `/CV.pdf` and `/PYM_HIP_Resume.pdf`
- teaching course PDFs and the alias `/vce-wsl-vac/`
- nav labels and hrefs
- no new or missing internal links in the build output

## Workflows inside the imported trees

Each source repo has `.github/workflows/hugo.yml` that deploys to GitHub Pages. After subtree import those files land at `sites/*/.github/workflows/hugo.yml`. GitHub Actions only runs workflows under the repository-root `.github/workflows/` directory, so the nested copies will not deploy. Keep them for one release as documentation of the old command, or delete them in the import commit if a nested workflow is too easy to misread. Recommended: delete the nested deploy workflows in the import commit and record the commands in the root README, so nobody copies them back to the root and double-publishes.

The root workflow is validation only. It must not call `actions/deploy-pages` and must not upload a Pages artifact.

## Local commands

`scripts/hugo-versions.env` holds the pins. `scripts/dev.sh` and `scripts/build-all.sh` download the three extended `.deb` binaries into an ignored `.hugo/bin/` directory (or reuse a cache) and invoke that binary. They must not call whatever `hugo` is on `PATH`. On this machine that is 0.169.0.

```bash
# Build all three with pinned binaries and production baseURLs
./scripts/build-all.sh

# Build, then check sitemap, RSS, CNAME, and required static files exist
./scripts/validate-all.sh

# Dev server for one site
./scripts/dev.sh portfolio
./scripts/dev.sh teaching
./scripts/dev.sh memoirs
```

Direct equivalents, from the site directory, after the matching extended binary is on `PATH` and submodules are initialized:

```bash
# portfolio — Hugo 0.108.0 extended
hugo --minify --baseURL https://prajwalyashasvi.in/
hugo server --baseURL http://localhost:1313/

# teaching — Hugo 0.169.0 extended, sass on PATH
npm ci
export PATH="$PWD/node_modules/.bin:$PATH"
hugo --minify --configDir=config --baseURL https://teaching.prajwalyashasvi.in/
hugo server --configDir=config --baseURL http://localhost:1313/

# memoirs — Hugo 0.114.0 extended
hugo --minify --baseURL https://memoirs.prajwalyashasvi.in/
hugo server --baseURL http://localhost:1313/
```

Teaching dev server should follow `npm run dev:start` flags only if we need drafts and future posts. The default `dev.sh` uses a plain `hugo server` so it matches what production renders. Document the draft-enabled command as optional.

`validate-all.sh` is a build plus file-level assertions (exit code, `sitemap.xml`, expected RSS or JSON outputs, `CNAME`, known PDFs). It is not a full link crawl of production. The crawl belongs to Phase 5 and can be repeated by hand before DNS cutover.

## Deployment architecture

Three Cloudflare Pages projects, all connected to `py563/personal-websites`, production branch `main`. GitHub remains the only git host. GitHub Actions does not deploy.

Install Hugo inside the build command from the official extended `.deb` for that site's pin. Do not rely on Cloudflare's default Hugo, which is a single moving version and will break LoveIt and hugo-resume.

The Pages "root directory" is the site folder, so `hugo` and `npm ci` run there. `git submodule update` paths are from the repository root and work from that subdirectory.

### Portfolio

| Setting | Value |
|---|---|
| Project | `personal-websites-portfolio` (name is a proposal) |
| Root directory | `sites/portfolio` |
| Output directory | `public` |
| Production branch | `main` |
| Custom domain | `prajwalyashasvi.in` |
| Environment | `HUGO_VERSION=0.108.0` (documentation; the build command installs this exact deb), `HUGO_ENVIRONMENT=production`, `HUGO_ENV=production` |

Build command:

```bash
wget -q -O /tmp/hugo.deb "https://github.com/gohugoio/hugo/releases/download/v0.108.0/hugo_extended_0.108.0_linux-amd64.deb" \
  && sudo dpkg -i /tmp/hugo.deb \
  && git submodule update --init -- sites/portfolio/themes/hugo-resume \
  && hugo --minify --baseURL "https://prajwalyashasvi.in/"
```

Build watch paths (include), relative to the repository root:

- `sites/portfolio/**`

### Memoirs

| Setting | Value |
|---|---|
| Project | `personal-websites-memoirs` |
| Root directory | `sites/memoirs` |
| Output directory | `public` |
| Production branch | `main` |
| Custom domain | `memoirs.prajwalyashasvi.in` |
| Environment | `HUGO_VERSION=0.114.0`, `HUGO_ENVIRONMENT=production`, `HUGO_ENV=production` |

Build command:

```bash
wget -q -O /tmp/hugo.deb "https://github.com/gohugoio/hugo/releases/download/v0.114.0/hugo_extended_0.114.0_linux-amd64.deb" \
  && sudo dpkg -i /tmp/hugo.deb \
  && git submodule update --init -- sites/memoirs/themes/loveit \
  && hugo --minify --baseURL "https://memoirs.prajwalyashasvi.in/"
```

Build watch paths:

- `sites/memoirs/**`

### Teaching

| Setting | Value |
|---|---|
| Project | `personal-websites-teaching` |
| Root directory | `sites/teaching` |
| Output directory | `public` |
| Production branch | `main` |
| Custom domain | `teaching.prajwalyashasvi.in` |
| Environment | `HUGO_VERSION=0.169.0`, `NODE_VERSION=22`, `HUGO_ENVIRONMENT=production`, `HUGO_ENV=production` |

Build command:

```bash
wget -q -O /tmp/hugo.deb "https://github.com/gohugoio/hugo/releases/download/v0.169.0/hugo_extended_0.169.0_linux-amd64.deb" \
  && sudo dpkg -i /tmp/hugo.deb \
  && git submodule update --init -- sites/teaching/themes/dot-org-hugo-theme \
  && npm ci \
  && export PATH="$PWD/node_modules/.bin:$PATH" \
  && hugo --minify --configDir=config --baseURL "https://teaching.prajwalyashasvi.in/"
```

Build watch paths:

- `sites/teaching/**`

No secrets are required for these static builds. The teaching contact form calls the existing Worker at `contact-api.prajwalyashasvi.in`. That hostname is not a Pages project in this plan.

### Watch paths and shared code

With `shared/` empty, a commit that only touches one site rebuilds that site. When a later change adds a file under `shared/` that a site actually mounts, add `shared/**` to that site's include paths. Do not add it before anything is mounted, or every placeholder edit would redeploy all three.

Root `docs/`, `scripts/`, and `AGENTS.md` are outside the include paths, so they do not trigger production builds. CI on pull requests still runs the sites touched by the diff, and runs all three when `scripts/` or the workflow changes.

### GitHub Actions

`.github/workflows/ci.yml` on pull requests and on pushes to `main`:

- three jobs, path-filtered
- checkout with submodules, or the same `git submodule update --init` used in Pages
- install that job's extended Hugo `.deb`
- teaching job: `actions/setup-node` with `node-version-file: sites/teaching/.nvmrc`, then `npm ci`, then PATH
- `hugo --minify` with the production `--baseURL`
- fail the job if Hugo fails
- no deploy step

`main` builds in Actions and in Cloudflare will both compile. That is intentional: Actions is the gate, Cloudflare is the publisher. They are not two publishing paths.

## DNS

Do this only after each `*.pages.dev` deployment has been compared with the live site.

The zone is already on Cloudflare (`anahi.ns.cloudflare.com`, `elias.ns.cloudflare.com`). Records are proxied, so the GitHub origin is hidden from public DNS. Cutover is an edit in the existing zone, not a registrar nameserver move.

Before editing anything, read these records in the dashboard and write down the current target:

| Record | What to preserve until cutover |
|---|---|
| `prajwalyashasvi.in` | apex, currently proxied |
| `www.prajwalyashasvi.in` | in DNS, not in Hugo. Record its target and any redirect rule before touching the apex |
| `memoirs.prajwalyashasvi.in` | proxied |
| `teaching.prajwalyashasvi.in` | proxied |
| `contact-api.prajwalyashasvi.in` | Worker. Do not attach this name to a Pages project |

Cloudflare Pages can attach a custom domain on a zone that is already in the same account. Attaching the domain updates the proxied record to the Pages origin. Apex is supported because Cloudflare flattens CNAMEs. Leave the records alone until the Pages preview is accepted.

Suggested order, one hostname at a time:

1. Portfolio on `*.pages.dev` matches `https://prajwalyashasvi.in/`.
2. Attach `prajwalyashasvi.in`. Re-check canonical, sitemap, PDFs, Keybase well-known URL.
3. Memoirs preview matches `https://memoirs.prajwalyashasvi.in/`. Attach that hostname.
4. Teaching preview matches `https://teaching.prajwalyashasvi.in/`, including `/vce-wsl-vac/` and the contact form's POST target. Attach that hostname.
5. Confirm `contact-api` and `www` still behave as they did in the dashboard notes.

GitHub Pages custom domains can stay configured until the new origin has been stable. Serving both is safe while DNS still points at GitHub. After cutover, remove the custom domain from the old Pages projects so GitHub stops trying to claim the hostname. Do that as a manual follow-up, not as part of the import.

## Rollback

While DNS still points at GitHub Pages, rollback of a bad monorepo commit is "do not attach the domain". The live sites keep deploying from `cv-hugo`, `memoirs`, and `taught-courses`.

After a domain is attached to Pages:

1. In Cloudflare DNS, restore the previous record target written down before cutover.
2. Confirm the hostname serves the GitHub Pages build again.
3. Leave the Pages project in place, without that custom domain, for the next attempt.

Source repositories and their Actions workflows are not modified, so they can still build. Avoid content edits in both places during the transition. Pick one repo per site as the editing target until cutover is finished. Recommendation: keep editing the original repos until the monorepo build matches production, then switch edits to the monorepo and treat the originals as read-only archives.

## History import

From the monorepo root, after the initial documentation commit:

```bash
git subtree add --prefix=sites/portfolio /home/vce-wsl/gitDebRepos/cv-hugo d0aeb1bb84738edd055f168b95f599de8a63b713
git subtree add --prefix=sites/teaching /home/vce-wsl/gitDebRepos/taught-courses 597f98b30410
git subtree add --prefix=sites/memoirs /home/vce-wsl/gitDebRepos/my-personal-blog bf7069fb7d7c7f07524b4f297d9729b0bc9c55f1
git submodule update --init --recursive
```

Subtree imports the existing commits with their original hashes, then adds a merge commit per site. `gitCommitPrefix` links to `github.com/py563/cv-hugo/commit/<hash>` keep working because those commits remain in the original repo. The same hashes also exist in the monorepo.

Do not use `git filter-repo` on the source clones. Do not delete source remotes. Do not force-push.

After import, `.gitmodules` at the monorepo root must list the three theme gitlinks (Ananke removed). Nested `.gitmodules` files inside each site need to agree with those gitlinks. Phase 3 should check `git submodule status` and expect three populated themes, all clean.

## Shared components

Not in this migration. A later extraction has to meet all of these:

- The markup and behavior already match in at least two sites.
- Each site can override the partial with a file in its own `layouts/` without forking the whole theme.
- The extraction does not require a Hugo upgrade.
- Build-watch paths for every consuming site include the shared path.

Social URLs are the closest thing to shared data, and they are not the same list. Leave them in each site's config.

## Implementation phases after approval

1. Add root `.gitignore` (Hugo `public/` and `resources/_gen/`, `node_modules/`, `.hugo/`, OS junk), `.editorconfig`, `shared/README.md`, scripts, CI, `AGENTS.md`, root README.
2. `git subtree add` the three HEADs listed above.
3. Adjust portfolio `.gitmodules` to drop Ananke. Remove nested deploy workflows from the imported trees.
4. Init submodules. Build with the three pinned binaries. Run `validate-all.sh`.
5. Diff output against the live sites (Phase 5 in the original brief). Fix only build breaks caused by the move.
6. Open the pull request or push `main` to `py563/personal-websites`. Create the three Pages projects with the settings above. Do not attach custom domains.
7. Review `*.pages.dev`. Only then schedule DNS edits, one hostname at a time, using the rollback notes.

## Risks carried into implementation

- Hugo 0.108.0 and 0.114.0 `.deb` packages may fail to install on the current Cloudflare build image. If they do, the fallback is a static extended tarball from the same GitHub release, not a newer Hugo.
- Teaching `npm ci` on Node 22 must be verified. If the lockfile only installs cleanly on Node 20, pin `NODE_VERSION` to the version that matches a successful local `npm ci`, and record the exception next to `.nvmrc`.
- `git submodule update` from a Pages root directory must be tested once. If Pages checks out with a sparse or copied tree that hides `.git`, the fallback is vendoring the pinned theme commit into the site. Vendoring is a fallback, not the default.
- Memoirs live HTML has not been diffed yet. Missing images inside posts would be a pre-existing content issue, not a monorepo bug, but it has to be listed in the Phase 5 report before DNS moves.
- `www.prajwalyashasvi.in` is an unknown redirect or origin. Inspect it in Cloudflare before the apex record changes.
- Two writers during the transition will fork content. One repo per site should receive content edits until cutover.

## Still not done

The repository import and local validation are in progress. These stay manual:

1. Push `py563/personal-websites` only when asked.
2. Create the three Cloudflare Pages projects. Do not attach custom domains until `*.pages.dev` matches production.
3. Leave DNS unchanged.
4. Push `taught-courses` `597f98b` to origin if the original teaching repo should match the monorepo. That commit existed only in the local checkout at import time.
