# Portfolio

Professional site for `https://prajwalyashasvi.in/`. This directory is its own Hugo project. Do not edit `sites/teaching` or `sites/memoirs` to satisfy a portfolio change.

- Hugo **0.108.0 extended** only. Build with `./scripts/build-one.sh portfolio` from the repository root.
- Config file is `config.toml`. Do not rename it.
- Theme submodule: `themes/hugo-resume`. Override templates in `layouts/`. The only site layout today is `layouts/shortcodes/floatimg.html`.
- `baseURL` is `https://prajwalyashasvi.in/`.
- Publications are permalinked to `/presentations/:title/`. Leave `[permalinks]` alone.
- Homepage sections come from `config.toml` `params.sections` and from `data/*.json`.
- `content/blog` here is a short notes section on the portfolio. It is not the memoirs blog.
- Keep `static/CNAME`, `static/CV.pdf`, `static/PYM_HIP_Resume.pdf`, and `static/.well-known/`.
- `static/admin` is leftover Netlify CMS pointed at `py563/cv-hugo`. Leave it unless the task is to remove the CMS.
- Footer commit links use `gitCommitPrefix` aimed at `py563/cv-hugo`. Do not retarget that until DNS cutover is explicitly requested.

Dev server: `./scripts/dev.sh portfolio` at http://localhost:1313/
