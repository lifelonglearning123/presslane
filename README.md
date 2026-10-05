# Presslane marketing site

Single-page static site: `index.html`, `styles.css`, `app.js`, `assets/`. No build step, no dependencies.

Run locally: `python -m http.server 3470` in this folder, then open http://localhost:3470/

Python's server cannot seek video, so the chapter buttons in "The real system" only work on a server with range requests, such as `npx http-server -p 3471` (Vercel supports them).

The system films in `assets/system/` are web encodes of the masters in `explainer_video/` (H.264 CRF 28, AAC 96k mono), with posters and subtitles (`.vtt`) beside each one.

Deploy on Vercel: import this folder as the project root (framework preset "Other", no build command, output directory `.`).

Brand rules come from `../Presslane brand book.pdf`. Garment photos come from `../images` (background removed, plus a greyscale base for recolouring). Product screenshots in `assets/` are taken from the
customer tracking page in `C:\python\oliver embrodery website solution\tracking-app`.

## Agencies and their calendar links

Each agency has its own address (for example `presslane.northside.com`) pointing at this same site. The site recognises the address and uses that agency's calendar link on every "Book a demo" button. On any other address the buttons are hidden, and the phone price bar links to the pricing section instead.

To add an agency:

1. Add a line to `agencies.js`:
   ```js
   "northside": { name: "Northside Print", domain: "presslane.northside.com", book: "https://calendly.com/northside/presslane-demo" },
   ```
   The key is lowercase letters, numbers and hyphens; `domain` has no `https://` or trailing slash; `book` must start with `https://`.
2. In Vercel, add the domain to this project (Settings, Domains).
3. The agency adds the DNS record Vercel shows them at their domain host (usually a CNAME for `presslane` pointing to `cname.vercel-dns.com`).

Before the address is live, `?agency=northside` on any address tests the same setup.
