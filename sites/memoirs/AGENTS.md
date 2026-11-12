# Memoirs

Personal blog for `https://memoirs.prajwalyashasvi.in/`. This directory is its own Hugo project. Do not edit `sites/portfolio` or `sites/teaching` to satisfy a memoirs change.

- Hugo **0.114.0 extended** for normal work. LoveIt at the pinned submodule commit uses LibSass, which newer Hugo removed. Do not build this site with the teaching Hugo.
- To test a newer Hugo after updating `themes/loveit`, run `HUGO_MEMOIRS=<version> ./scripts/build-one.sh memoirs` from the repository root. Change the default in `scripts/versions.sh` only after that build succeeds. Leave the other two pins alone.
- Config file is `config.toml`. `baseurl` has no trailing slash. Production builds pass `--baseURL https://memoirs.prajwalyashasvi.in/` because the old GitHub workflow did. Keep that slash in `scripts/versions.sh`.
- Theme submodule: `themes/loveit` (`TeamYayin/LoveIt`). `layouts/` in this site is empty. Put overrides there instead of editing the theme.
- Default language is English. Telugu is configured. The only Telugu page is `content/page/about.te.md`. Do not flatten languages or rename post files. Filenames are the slugs.
- `content/posts` is this blog. It is not the portfolio notes and not the teaching blog.
- Home outputs include HTML, RSS, and JSON. Keep them.
- There is no `CNAME` file. The domain is the Pages/Cloudflare setting plus `baseurl`.

Dev server: `./scripts/dev.sh memoirs` at http://localhost:1315/
