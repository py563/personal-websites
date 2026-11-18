# Teaching

Course site for `https://teaching.prajwalyashasvi.in/`. This directory is its own Hugo project. Do not edit `sites/portfolio` or `sites/memoirs` to satisfy a teaching change.

- Hugo **0.169.0 extended**, Node 22, `npm ci`, and the native `sass` binary from `sass-embedded` on `PATH`. `./scripts/build-one.sh teaching` also copies `three` from `node_modules` into `static/js/vendor/three/` for the home-page classroom scene (not committed; listed in root `.gitignore`). `node_modules/.bin/sass` may point at the JavaScript `sass` package, which Hugo cannot use. `./scripts/build-one.sh teaching` selects the native binary.
- After Hugo, production runs `npx -y pagefind --site public`. A teaching build without Pagefind is not a production build.
- Configuration that ships is `config/` via `--configDir=config`. The root `config.toml` is not what CI reads.
- Theme submodule: `themes/dot-org-hugo-theme`. Overrides live in this directory's `layouts/`, `assets/scss/`, and `static/css/`. Do not edit files inside the theme submodule.
- `npm run dev:build` passes `--themesDir=../..` and is wrong in this repository. Use `./scripts/dev.sh teaching` (http://localhost:1314/).
- The contact form lives in `shared/contact/` and is mounted here. `contact.source` is `teaching.prajwalyashasvi.in`. It posts to `https://contact-api.prajwalyashasvi.in`. Do not change that host unless the task is about the Worker.
- The alias `/vce-wsl-vac/` was removed on purpose. Do not add it back unless asked.
- `content/en/blog` is the teaching blog, not memoirs and not the portfolio notes.
- Keep `static/CNAME`, course files under `static/courses/`, and certificate PDFs.
- GitHub edit links use `github.repo_url` and open `sites/teaching/content/...` in `py563/personal-websites`.

Dev server from this directory, when you need drafts: `npm run dev:start` after `npm ci`.
