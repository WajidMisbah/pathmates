# Pathmates PWA (v1)
Static, offline-capable web app for the organ-wise pathology entity lists. No build step.

## Files
index.html, style.css, app.js, sw.js (service worker), manifest.json, icons/, data.json (generated), build_data.py

## Updating data (daily run)
    python3 build_data.py --src /workspace/pathmates/organ-lists --progress /workspace/pathmates/organ-lists/progress.json
Reads every `NN Organ - Pathology entities.xlsx` ("All entities" sheet), merges with the 51-organ queue,
writes data.json and stamps a new cache VERSION into sw.js (content hash) so installed apps refresh.
data.json is fetched network-first, so new organs show on the next online open.

## Run locally
    cd app && python3 -m http.server 8765   # open http://localhost:8765

## Free hosting (needs HTTPS for install/offline)
- GitHub Pages: push the app/ folder to a repo → Settings → Pages → deploy from branch (root). URL: https://<user>.github.io/<repo>/
- Netlify: app.netlify.com → "Deploy manually" → drag the app/ folder (or connect the repo, no build command, publish dir = app).
- Cloudflare Pages: Create project → Direct upload → upload app/ folder (or connect Git, no build command).
Tip: a private repo + Netlify/Cloudflare keeps the source private; the site URL itself is public but unlisted.

## Install on devices
- Android (Chrome): open URL → ⋮ menu → "Install app"/"Add to Home screen".
- iPhone/iPad (Safari): open URL → Share → "Add to Home Screen".
- Windows/Mac (Chrome/Edge): install icon in the address bar, or ⋮ → "Install Pathmates".
Open once while online; afterwards it works offline. Bookmarks, quiz score and dark-mode are stored per device (localStorage).
