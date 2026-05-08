# Deploy

Live site: https://baditaflorin.github.io/paste-scraper-builder/

Repository: https://github.com/baditaflorin/paste-scraper-builder

## Publish

GitHub Pages serves `main` branch `/docs`.

```sh
npm run build
git add docs public/data/build-meta.json
git commit -m "chore: publish pages build"
git push
```

## Rollback

Revert the publishing commit and push `main`.

```sh
git revert <commit_sha>
git push
```

## Custom Domain

No custom domain is configured. To add one, create `docs/CNAME`, set the Pages custom domain in repository settings, and point DNS to GitHub Pages according to https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site.

## Pages Notes

GitHub Pages does not support `_headers` or `_redirects`. The app includes `404.html` as a simple SPA fallback. Service worker scope is `/paste-scraper-builder/`.
