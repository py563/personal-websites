# Repository audit

Audit date: 2026-11-13. Phase 1 only. No files were copied into `sites/`, and the three source repositories were not modified.

Sources inspected:

| Site | Local checkout | GitHub | HEAD |
|---|---|---|---|
| Professional portfolio | `/home/vce-wsl/gitDebRepos/cv-hugo` | [py563/cv-hugo](https://github.com/py563/cv-hugo) | `d0aeb1bb84738edd055f168b95f599de8a63b713` on `master` |
| Teaching portfolio | `/home/vce-wsl/gitDebRepos/taught-courses` | [py563/taught-courses](https://github.com/py563/taught-courses) | `abcdfc3d247244909d840607e6b1932f8c1b1bd9` on `main` |
| Personal blog | `/home/vce-wsl/gitDebRepos/my-personal-blog` | [py563/memoirs](https://github.com/py563/memoirs) | `bf7069fb7d7c7f07524b4f297d9729b0bc9c55f1` on `main` |

The blog's local directory is `my-personal-blog`. Its Git remote is `py563/memoirs`. The monorepo directory should be `sites/memoirs`, matching the public site, not the local folder name.

Destination repository [py563/personal-websites](https://github.com/py563/personal-websites) exists and is empty (GitHub `size: 0`, commits API returns 409). The local clone has no commits yet. `origin` is `git@github.com:py563/personal-websites.git`.

Local checkouts are clean and match their remotes. This machine's default Hugo is `v0.169.0+extended`. That binary matches teaching only.

## Comparison

| | Portfolio | Teaching | Memoirs |
|---|---|---|---|
| Purpose | Resume, experience, projects, talks, a small notes section | Courses, workshops, teaching notes, contact form | Personal essays, English with a Telugu about page |
| Production URL | `https://prajwalyashasvi.in/` | `https://teaching.prajwalyashasvi.in/` | `https://memoirs.prajwalyashasvi.in/` |
| GitHub Pages `cname` | `prajwalyashasvi.in` | `teaching.prajwalyashasvi.in` | `memoirs.prajwalyashasvi.in` |
| HTTPS enforced in Pages API | yes | **no** | yes |
| Default branch | `master` | `main` | `main` |
| Commits | 88 | 44 | 9 |
| Last push | 2026-10-16 | 2026-11-12 | 2023-12-18 |
| Latest retained Actions run | success, 2026-10-16 | success, 2026-11-12 | no retained runs returned by the API |
| Hugo in CI | **0.108.0 extended** | **0.169.0 extended** | **0.114.0 extended** |
| Config | root `config.toml` | `config/` directory plus a small root `config.toml` | root `config.toml` (~435 lines) |
| `baseURL` in config | `https://prajwalyashasvi.in/` | production file: `https://teaching.prajwalyashasvi.in/` | `https://memoirs.prajwalyashasvi.in` (no trailing slash) |
| Effective CI `baseURL` | `${{ steps.pages.outputs.base_url }}/` | hardcoded `https://teaching.prajwalyashasvi.in/` | `${{ steps.pages.outputs.base_url }}/` |
| Theme | `hugo-resume` (Eddie Webb), submodule | `dot-org-hugo-theme` (CNCF) v0.1.8-3-gcb1ecb0 | LoveIt fork `TeamYayin/LoveIt`, `v0.2.10-236-ge9e89a4` |
| Theme `min_version` | 0.62 | 0.121.0 | 0.62.0 |
| Hugo modules | none | none | none (`[module]` block exists only inside the theme) |
| Sass | none in the site or theme | Dart Sass via `sass-embedded`, transpiler `dartsass` | LoveIt `toCSS` (LibSass inside Hugo extended 0.114) |
| Node | workflow no-ops `npm ci` (no lockfile) | required. `.nvmrc` is `22`. `package-lock.json` lockfileVersion 3 | workflow no-ops `npm ci` |
| Content files | 20 Markdown | 25 Markdown | 10 Markdown |
| Static files | 18, including `CV.pdf` and `PYM_HIP_Resume.pdf` | 36, including PDFs, `.py`, `.ino`, a certificate | 2 (`favicon.ico`, `img/fbavat.jpg`) |
| Site layouts | one shortcode, `layouts/shortcodes/floatimg.html` | 19 files, several overriding the theme | empty `layouts/` directory |
| Languages | `en-us` | `en`, content under `content/en/` | `en` default, `te` configured; only `about.te.md` is Telugu |
| RSS | home outputs are HTML and JSON, not RSS | home outputs HTML, RSS, and `llms.txt` | home, section, and taxonomy RSS |
| Sitemap | theme/Hugo default, home priority 1.0 | `sitemap.xml`, weekly, priority 0.5; home priority 1.0 | `sitemap.xml`, weekly, priority 0.5 |
| Robots | not enabled in config | `enableRobotsTXT` in production config, plus `layouts/robots.txt` | `enableRobotsTXT = true` |
| Git info | `enableGitInfo = true`, footer links to `py563/cv-hugo` commits | edit links to `py563/taught-courses` `blob/main` | `enableGitInfo = true` |
| Search | theme JSON index, home output includes JSON | theme Pagefind UI is enabled; **CI does not run Pagefind** | Lunr, home output includes JSON |
| Contact | mailto / social handles in config | form posts to `https://contact-api.prajwalyashasvi.in` | theme comment config disabled |

The three sites are independent Hugo projects. They do not share a theme, a design system, a Hugo version, or a content tree. Portfolio's `content/blog`, teaching's `content/en/blog`, and memoirs' `content/posts` are different collections and must stay separate.

## Portfolio (`cv-hugo`)

### What it is

Single-page resume plus section pages. Homepage sections, in config order: skills, experience, education, publications (labeled "Presentations"), creations, contributions, blog. Structured data lives in `data/experience.json` (8 entries), `data/skills.json` (6), `data/education.json` (4), and `data/certifications.json` (6). Narrative content is Markdown under `content/`.

`config.toml` sets:

- `theme = "hugo-resume"`
- `enableGitInfo = true`
- `gitCommitPrefix = "https://github.com/py563/cv-hugo/commit/"`
- permalink `publications = "/presentations/:title/"`
- home outputs `["HTML", "JSON"]`
- social handles: LinkedIn, GitHub, Keybase, cal.com
- email `hello@prajwalyashasvi.in`

There is no `[module]` table and no `go.mod`.

### Theme

`.gitmodules` lists two submodules. Only one is a gitlink:

| Path | URL | Gitlink |
|---|---|---|
| `themes/hugo-resume` | `https://github.com/eddiewebb/hugo-resume` | `a5d72a68b569e16fce2d5cb66f26f336036d2bf7` ("sections now dynamic order") |
| `themes/ananke` | `https://github.com/budparr/gohugo-theme-ananke.git` | **absent** |

Ananke is a stale `.gitmodules` entry. `theme` is `hugo-resume`, and `themes/ananke` is not checked out. The theme CSS is prebuilt (`static/css/resume.css`, `tweaks.css`). The site adds `static/css/resume-override.css`. No SCSS.

The only site layout is `layouts/shortcodes/floatimg.html`.

### URLs and files that must survive

- Apex canonical `https://prajwalyashasvi.in/`.
- Publication URLs under `/presentations/:title/`, not `/publications/`.
- Blog bundles under `/blog/<directory>/` (`index.md` leaf bundles, including image assets inside the bundle).
- Static downloads: `/CV.pdf`, `/PYM_HIP_Resume.pdf`.
- `/favicon.ico`, profile images, project images.
- `/.well-known/keybase.txt` and `/.well-known/google-verify.etc`.
- `/admin/*` Netlify CMS assets. `static/admin/config.yml` points at repo `py563/cv-hugo`, branch `wip`. Treat this as legacy and preserve it. Do not rewire it during the copy.
- `static/CNAME` contains `prajwalyashasvi.in`.

### Deploy

`.github/workflows/hugo.yml` deploys to GitHub Pages on push to `master`.

- Hugo **0.108.0 extended**, installed from the official `.deb`.
- Also installs `dart-sass-embedded` via snap. The site and theme have no SCSS, so that step is unused by the current templates. The last successful run is 2026-10-16, so the install is currently harmless.
- `actions/checkout@v3` with `submodules: recursive`.
- `hugo --minify --baseURL "${{ steps.pages.outputs.base_url }}/"`.
- Pages project `build_type` is `workflow`, custom domain `prajwalyashasvi.in`, HTTPS enforced.

`README.md` still describes a `hugo-change` branch and a `gh-pages` branch. That does not match the workflow. The workflow is the source of truth.

`public/` is gitignored. Nothing under `public/` is tracked.

## Teaching (`taught-courses`)

### What it is

Course and workshop catalogue using the CNCF Dot Org theme, with substantial site-level overrides for brand, header, footer, and a contact form. Content is English only, in `content/en/`, because `defaultContentLanguageInSubdir: false` and `contentDir: content/en/`.

Root `config.toml` is three lines (`baseURL`, `languageCode`, `title`). Production builds pass `--configDir=config`, so Hugo reads:

| File | Role |
|---|---|
| `config/_default/hugo.yaml` | theme, timezone `Asia/Kolkata`, sitemap, home outputs, Goldmark `unsafe: true`, privacy flags |
| `config/_default/params.yaml` | CSS list, social links, contact worker, search flag, GitHub edit URL |
| `config/_default/languages.yaml` | English menu, copyright, description |
| `config/production/hugo.yaml` | `baseURL`, `enableRobotsTXT: true`, `build.writeStats: true` |
| `config/development/hugo.yaml` | `baseURL: http://localhost:1313/` |

When `--configDir=config` is set, the root `config.toml` is outside that directory. The production base URL that actually ships is the one in `config/production/hugo.yaml` plus the workflow's `--baseURL` flag. Keep both files. The root file is easy to mistake for the live configuration.

Menus: Home `/`, Blog `/blog/`, FAQs `/faq/`, About as an external link to `https://prajwalyashasvi.in/`.

Social links in params: GitHub `https://github.com/py563`, LinkedIn, X `https://x.com/py563`. Other network keys are empty strings.

Contact:

```yaml
contact:
  worker_url: "https://contact-api.prajwalyashasvi.in"
  source: "teaching.prajwalyashasvi.in"
```

The form is `layouts/shortcodes/contact-form.html` and `static/js/contact-form.js`, with a honeypot. The Worker is a separate deployment. This migration must not change that hostname.

### Theme and overrides

Submodule `themes/dot-org-hugo-theme` at `cb1ecb0d3e2909b059774601868f4394f823d769`.

Site layouts that replace theme files:

- `_default/baseof.html`, `_default/list.html`
- `partials/head.html`, `partials/head/css.html`, `partials/head/custom-head.html`, `partials/head/favicons.html`
- `partials/header.html`, `partials/footer.html`, `partials/footer/github.html`
- `blog/list.html`

Site-only layouts: `index.html`, `index.llmstxt.txt`, `robots.txt`, `partials/site-brand.html`, `shortcodes/contact-form.html`, `vce/list.html`, `vce/fcs-2021/list.html`, `vce/basics-iot-robotics/list.html`, `workshops/list.html`.

The theme's `partials/head/css.html` runs `toCSS` (Dart Sass) and then `postCSS`. The site override of that partial runs `toCSS` with `transpiler: "dartsass"` and does not call `postCSS`. The override is what production renders. `postcss`, `autoprefixer`, and `postcss-cli` stay in `package.json` because the theme partial still references PostCSS. `netlify-cli` is also a dependency; the site has no root `netlify.toml`.

`package.json` scripts `dev:build` and `dev:start:with-pagefind` pass `--themesDir=../..`. That path belongs to the CNCF example-site layout, where the theme sits two directories above the site. In this repository the theme is `themes/dot-org-hugo-theme`. Those two scripts are already wrong. The working local command is `npm run dev:start` / `npm start`, which calls `hugo serve --configDir=config` and uses the default `themes/` directory.

`show_search: true`, but the GitHub Actions build does not run Pagefind. Search indexing is a pre-existing gap. The migration should reproduce the current build, not add Pagefind as a drive-by change.

### URLs and files that must survive

- Canonical `https://teaching.prajwalyashasvi.in/`.
- Section URLs such as `/vce/fcs-2021/`, `/blog/`, `/workshops/`, `/faq/`, `/contact/`, `/accessibility/`.
- Alias on `content/en/vce/wsl-vac/_index.md`: `/vce-wsl-vac/`. This is the only `aliases` front matter found in any of the three content trees.
- Course files under `static/courses/**` (PDFs, Python, Arduino `.ino`).
- `static/certificates/isaect-2025-reviewer-certificate.pdf`.
- `static/blog/files/aicte-49-free-e-learning-courses-students.pdf`.
- Brand CSS: `static/css/brand.css`, `theme-colors.css`, `layout.css`, `contact-form.css`.
- `static/CNAME` contains `teaching.prajwalyashasvi.in`.
- Home output `llms.txt` via the custom `LLMSTXT` output format.

### Deploy

`.github/workflows/hugo.yml` on push to `main`.

- Hugo **0.169.0 extended** from the official `.deb`.
- `npm ci`, then `PATH` is prefixed with `node_modules/.bin` so the `sass` binary from `sass-embedded` is visible. The previous snap-based Sass install was removed after failed runs on 2026-11-12. The successful run is `abcdfc3`.
- The workflow does not set `actions/setup-node`. Node comes from the GitHub runner image. `.nvmrc` says 22. The lockfile resolves `sass-embedded` to **1.108.0** even though `package.json` says `^1.89.2`.
- Build: `hugo --minify --configDir=config --baseURL "https://teaching.prajwalyashasvi.in/"`.
- `HUGO_CACHEDIR` is set. `HUGO_ENVIRONMENT=production`.
- Pages `build_type` is `workflow`. Custom domain is set. `https_enforced` is false in the Pages API. Public DNS is proxied by Cloudflare, so browsers still get Cloudflare TLS. Keep that in mind at cutover; do not assume GitHub is the TLS terminator.

`node_modules/`, `public/`, `resources/`, and `hugo_stats.json` are gitignored. `package-lock.json` is tracked.

GitHub repo `homepageUrl` is still `https://py563.github.io/taught-courses/`. That field is metadata. The Pages API custom domain is `teaching.prajwalyashasvi.in`.

## Memoirs (`memoirs`)

### What it is

LoveIt blog. Eight posts in `content/posts/*.md` and two about pages: `content/page/about.md`, `content/page/about.te.md`. No leaf bundles and almost no static media. Images referenced inside posts need to be checked against production during Phase 5; they are not in `static/` today.

`config.toml` is the LoveIt sample, heavily filled in. Relevant production settings:

- `baseurl = "https://memoirs.prajwalyashasvi.in"` (lowercase key, no trailing slash)
- `theme = "loveit"`
- `defaultContentLanguage = "en"`
- languages `te` and `en`, both `weight = 1`
- `enableRobotsTXT = true`, `enableGitInfo = true`
- English menu: `/posts/`, `/tags/`, `/categories/`, `/page/about/`
- Telugu menu uses the same paths with Telugu labels
- English search: Lunr. Telugu search: disabled
- RSS counts and full-text flag are theme params (`rssFullText = false`)
- outputs: home `HTML, RSS, JSON`; section `HTML, RSS`; taxonomy `HTML, RSS`; taxonomy term `HTML`
- sitemap weekly, `sitemap.xml`, priority 0.5
- highlight `noClasses = false` (required by this LoveIt version)
- comments, analytics, and cookie consent disabled
- author name `Prajwal`
- social: GitHub `py563`, Facebook `prajwalyashasvi`, email `spinets02.plural@icloud.com`, RSS on

No permalink table. URLs follow Hugo's default section paths (`/posts/<slug>/`, `/tags/...`, `/categories/...`, `/page/about/`). Filenames are the slug source. Do not rename files.

`layouts/` exists and is empty. There is no `CNAME` file. The custom domain is stored in the GitHub Pages API and in `baseurl`.

### Theme

Submodule `themes/loveit` → `https://github.com/TeamYayin/LoveIt.git` at `e9e89a4613baee823596822b7d246f5931263491` (`v0.2.10-236-ge9e89a4`). Theme config asks for Hugo extended `>= 0.62.0`. Styles go through `resources` and `.ToCSS` without an explicit `transpiler` key, which on Hugo 0.114 extended means the embedded LibSass. Hugo removed LibSass in 0.128 and requires an external Dart Sass binary, and LoveIt 0.2.x is known to break on current Hugo. **Stay on 0.114.0 extended.**

The workflow also `snap install dart-sass`. Extended 0.114 does not require that for `.ToCSS`. The snap step can be dropped on Cloudflare if the extended 0.114 binary builds the site. Phase 5 should confirm that before deleting the idea of a Sass install.

### Deploy

`.github/workflows/hugo.yml` on push to `main`.

- Hugo **0.114.0 extended**.
- Checkout v3, submodules recursive.
- `hugo --minify --baseURL "${{ steps.pages.outputs.base_url }}/"`.

The config value has no trailing slash. The workflow appends one. With the Pages custom domain set, the URL that production has been building is `https://memoirs.prajwalyashasvi.in/`, not the slash-less config value. The Cloudflare build should use the workflow form.

The Actions API returned no retained workflow runs. Pages is configured (`build_type: workflow`, `cname: memoirs.prajwalyashasvi.in`, HTTPS enforced), and the last commit is 2023-12-18. Logs have aged out or were never retained. Phase 5 has to compare a fresh build with the live site rather than with an Actions artifact.

## Hosting and DNS

All four names resolve to Cloudflare anycast addresses (`104.21.35.225`, `172.67.180.85`, and the matching IPv6). Queried against 1.1.1.1 on 2026-11-13:

| Name | Public CNAME | Nameservers |
|---|---|---|
| `prajwalyashasvi.in` | none visible (proxied) | `anahi.ns.cloudflare.com`, `elias.ns.cloudflare.com` |
| `www.prajwalyashasvi.in` | none visible (proxied) | same zone |
| `memoirs.prajwalyashasvi.in` | none visible (proxied) | same zone |
| `teaching.prajwalyashasvi.in` | none visible (proxied) | same zone |
| `contact-api.prajwalyashasvi.in` | none visible (proxied) | same zone |

The zone is already on Cloudflare. Orange-cloud proxying hides the origin, so this audit cannot see whether the record target is `*.github.io` or something else. The GitHub Pages API is the evidence that GitHub Pages is the current origin for the three sites.

`www` answers DNS and is not mentioned in any Hugo config. `contact-api` is the teaching form Worker and is out of scope.

No site contains a Cloudflare Pages config, a Wrangler file, or a root `netlify.toml`.

## Shared-component assessment

A shared theme or shared CSS would be a redesign. The visual systems are unrelated:

| Concern | Portfolio | Teaching | Memoirs |
|---|---|---|---|
| Theme | hugo-resume (Start Bootstrap Resume port) | CNCF Dot Org | LoveIt |
| CSS | static CSS plus one override file | SCSS variables plus four brand stylesheets | theme SCSS compiled at build |
| Header / footer / nav | theme partials | site partials overriding the theme | theme partials, configured from `config.toml` |
| Social data shape | `params.handles` list of name/link | `params.social_links` map | `languages.*.params.social` map of usernames |
| SEO | theme defaults, JSON home output | sitemap config, robots layout, `llms.txt`, OG image `/img/social-share.png` | LoveIt SEO, Open Graph, sitemap, RSS |
| JS | theme `resume.js` / `search.js` | `contact-form.js` plus theme | theme (TypeIt, Lunr, Font Awesome) |

Social profiles overlap (GitHub `py563`, LinkedIn, the name Prajwal) but the values are not identical. Memoirs uses a Facebook profile and an iCloud address. Portfolio adds Keybase and cal.com. Teaching adds X and the contact Worker. There is no single menu.

Hugo Modules are not in use. Adopting a shared module would mean new `module` mounts in all three configs, a Go proxy or vendored module during build, and override rules for three unrelated template trees. That work does not preserve appearance.

**Phase 3 should not fill `shared/hugo-theme`, `shared/css`, `shared/js`, or `shared/components`.** Leave `shared/` as a documented placeholder. Revisit only after a concrete partial is identical in behavior across at least two sites and each site can still override it.

## Compatibility issues

1. **Three Hugo versions.** 0.108.0, 0.114.0, and 0.169.0. The system Hugo on this machine is 0.169.0 and will not be a faithful builder for portfolio or memoirs.
2. **LoveIt cannot move to current Hugo** without a theme upgrade. Pin memoirs to extended 0.114.0.
3. **Teaching requires Dart Sass on `PATH`** (`sass` from `sass-embedded` 1.108.0) and `npm ci`. Hugo 0.169 does not embed LibSass.
4. **Node version is inconsistent for teaching.** `.nvmrc` is 22. GitHub Actions does not pin Node. Local Node is v20.19.3. Cloudflare should pin a version and Phase 5 should build with that same version.
5. **Themes are gitlinks, not vendored files.** A clone without `submodule update` builds with a missing theme. Cloudflare's checkout must init the public submodule, or the build command must.
6. **Stale Ananke submodule entry** in portfolio `.gitmodules`. `git submodule update --init` only acts on gitlinks, so it will not clone Ananke. The entry should be removed so the monorepo does not advertise a theme the site does not use.
7. **Memoirs trailing slash.** Config omits it; the GitHub workflow adds it. Match the workflow.
8. **`www.prajwalyashasvi.in` exists in DNS** and is absent from Hugo. Cutting the apex over to Pages must not drop whatever `www` does today until that record is inspected in the Cloudflare dashboard.
9. **Portfolio and teaching embed old repository URLs** (`gitCommitPrefix`, `params.github.repo_url`, Netlify CMS backend). Those links keep working while the original repos remain. They should be retargeted only at cutover, in a separate change from the file move.
10. **Teaching `themesDir=../..` scripts** are already broken. Moving the site to `sites/teaching` makes them more wrong if someone "fixes" them toward the monorepo root. The supported command is `hugo` with the default themes directory and `--configDir=config`.
11. **Pagefind is not part of the teaching production build.** Adding it would change `static/` and possibly HTML. Leave it out of the first migration.
12. **Portfolio snap Sass install is unused.** Do not add a Sass toolchain to the portfolio Cloudflare build unless a pinned 0.108 build fails without it.
13. **Shallow clones and `enableGitInfo`.** Portfolio and memoirs enable it. Depth 1 is enough for the current commit footer. Document that Cloudflare's default clone depth is acceptable for the current footer behavior.
14. **No Hugo Modules and no `go.mod`.** Do not introduce either in the migration.
15. **Content name collisions if trees were merged.** They will not be merged. `blog` means something different in each site.

## Assumptions and gaps

- DNS record targets were not read from the Cloudflare dashboard. Public DNS only shows the proxy. The dashboard still needs a human pass before any record edit: apex, `www`, both subdomains, and `contact-api`.
- No Cloudflare Pages project inventory was available from this environment. The plan assumes the three Pages projects do not exist yet.
- Memoirs has no retained Actions logs. Live HTML is the comparison baseline for Phase 5.
- Whether `www` redirects to the apex, serves the portfolio, or serves something else is unknown.
- Portfolio Netlify CMS (`/admin`, backend branch `wip`) looks unused. It is preserved, not deleted, until you say otherwise.
- `google-verify.etc` is preserved as a static file. This audit did not check whether Google still uses it.
- Submodule URLs are public HTTPS. No private-submodule credentials are required.
- Original repositories stay in place and keep their GitHub Pages workflows until DNS is deliberately changed.
