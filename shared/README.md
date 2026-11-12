# Shared

This directory is intentionally empty.

The three sites use different themes, different Hugo versions, and different layouts. A shared theme or a shared CSS file would be a redesign, not a consolidation.

Add a file here only when all of these are true:

- The markup or tokens already match in at least two sites.
- Each site can override that file from its own `layouts/` or `assets/` without a Hugo upgrade.
- The Cloudflare build-watch paths for every site that mounts the file include `shared/**`.

Until then, site-specific layouts stay inside `sites/<name>/layouts/`, and theme code stays in the theme submodule.
