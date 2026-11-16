# SaunaMate Web — starter website

A standalone static website using the sauna directory and images from the supplied `saunamate-app` ZIP. The existing iOS/Android repository is unchanged.

## Preview locally

Run `python3 -m http.server 8000` in this folder, then open `http://localhost:8000`.

## Publish

Upload the files **inside** this folder to the `saunamate-web` repository (GitHub → Add file → Upload files). Then connect that repo to Netlify (publish directory `.`) or another static hosting provider. Connect `saunamate.ie` only after Blacknight confirms registration.

## Before launch

- Review sauna listings and links for accuracy, permission, and freshness.
- Replace placeholder Events copy with a verified live events feed when ready.
- Confirm Shopify URL and ensure the store is publicly accessible.
- Add appropriate privacy, contact, and business information before public launch.
- This starter is a static web implementation, not a complete port of the native app. Passport, login, notifications and live database are not included.
