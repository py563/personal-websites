# Shared

Shared pieces are mounted by each site. They are not a theme.

`contact/` is the contact form. A message records:

- who: name, phone, and email
- why: the reason selected on that site
- where: the site name in `source`, plus the page URL

A link to the teaching contact page is not used. That page would label every message as teaching.

Each site mounts this directory from its own Hugo config. The shortcode is `contact-form`. Site params under `contact` set the worker URL, the source label, the intro line, and the reason list. Field labels follow the page language (English and Telugu). The reason choices stay in each site's config.

`brand/static/` is the teaching favicon set. Portfolio uses the icon files only. Memoirs uses `favicon-32x32.png` in the header in place of the pen icon.

`seo/layouts/` is `robots.txt`, `llms.txt`, and the `seo-head` partial (JSON-LD for the site and person, and `noindex` while Hugo is in development). Each site sets `seo.summary`. Teaching keeps its own `site.webmanifest` name.
