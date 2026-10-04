# Presslane marketing site

Single-page static site: `index.html`, `styles.css`, `app.js`, `assets/`. No build step, no dependencies.

Run locally: `python -m http.server 3470` in this folder, then open http://localhost:3470/

Python's server cannot seek video, so the chapter buttons in "The real system" only work on a server with range requests, such as `npx http-server -p 3471` (Vercel supports them).

The system films in `assets/system/` are web encodes of the masters in `explainer_video/` (H.264 CRF 28, AAC 96k mono), with posters and subtitles (`.vtt`) beside each one.

Deploy on Vercel: import this folder as the project root (framework preset "Other", no build command, output directory `.`).

Brand rules come from `../Presslane brand book.pdf`. Garment photos come from `../images` (background removed, plus a greyscale base for recolouring). Product screenshots in `assets/` are taken from the
customer tracking page in `C:\python\oliver embrodery website solution\tracking-app`.
