# Presslane marketing site

A single static page: `index.html`, `styles.css`, `app.js`, `agencies.js`, `assets/`. No build step. GSAP is
self-hosted in `assets/vendor/`, the Manrope font in `assets/fonts/`.

The page is built as a split stage: the reading column on the left, and on the right one job (48 hoodies,
with whichever logo the visitor picks or uploads) that changes as the visitor scrolls: quote, proof, stitched
on film, boxed and scanned on film, delivered. On a phone the stage is a band at the top of the first screen
and the three steps that carry pictures show them inline.

## Run it locally

Any static server with range requests works. Python's `http.server` drops connections under load and cannot
seek video, so use Node:

```bash
npx http-server -p 3471 .
```

Then open http://127.0.0.1:3471/. Add `?agency=leonardopower` to see an agency's version (booking buttons
and the contact form); that choice lasts for the browser tab only.

## Files

| Where | What |
| --- | --- |
| `assets/photos/` | Generated stills (Higgsfield, 21 and 24 Oct 2026): the three gaps, four kinds of shop, the workshop, the delivered parcel, and four with people in them (the owner on the phone, the roofer at his van, the embroiderer, the handover at the counter). The people are invented and are never presented as named customers. WebP, 1000 to 1600 px wide. |
| `assets/video/` | Two generated 4.5 s silent loops (`make.mp4`, `send.mp4`) with posters. 960 × 960, H.264. |
| `assets/system/` | The six real screen recordings with posters and `.vtt` captions. |
| `assets/hoodie.webp`, `polo.webp`, `cap.webp`, `mug.webp`, `pen.webp`, `bottle.webp` | Garment and product cut-outs used by the stage and the quote demo. |
| `assets/vendor/` | GSAP 3.13.0 core and ScrollTrigger. |
| `assets/fonts/` | Manrope variable, latin subset. |
| `api/contact.js` | The Vercel function behind the contact form. |
| `tools/readability.py` | Scores the page's visible text by section (Flesch-Kincaid). Run `python -I tools/readability.py index.html` before a change goes live; the target is grade 5 or under in every section. |
| `etrader/index.html` | The comparison page for shops on eTrader, served at `/etrader` on every agency address. Same styles and script as the main page; its form adds "Which suppliers do you sell?", which `api/contact.js` puts at the top of the CRM note. The eTrader figures in its table were read from etraderwebsites.co.uk on 23 October 2026: keep a dated screenshot of those pages as evidence, and re-check them before any campaign. |
| `presentation/index.html` | The source of the 14-page A4 portrait presentation the footer links to, in the site's own styles, with JPEG copies of the pictures in `presentation/img/`. Edit it, then print it to `assets/presslane-presentation.pdf`: open it in Chrome and print (A4, portrait, no margins, background graphics on), or `npm install --no-save playwright-core` once and run `node tools/render-presentation.mjs`. |

Files from the previous page that nothing uses now and can be deleted when you are sure: `assets/hero-network.*`,
`assets/stage-*.webp`, `assets/enquiry-*`, `assets/*-grey.webp`.

## Agencies and their calendar links

Each agency has its own address (for example `presslane.northside.com`) pointing at this same site. The site
recognises the address and uses that agency's booking link on every "Book a call" button, and shows the
contact form. On any other address those are hidden and the page says to come through an agency.

To add an agency:

1. Add a line to `agencies.js`:
   ```js
   "northside": { name: "Northside Print", domain: "presslane.northside.com", book: "https://calendly.com/northside/presslane-demo" },
   ```
2. In Vercel, add the domain to this project (Settings, Domains).
3. The agency adds the DNS record Vercel shows them (usually a CNAME for `presslane` pointing to `cname.vercel-dns.com`).

Before the address is live, `?agency=northside` on any address tests the same setup for that tab.

## Contact form

Enquiries go to `api/contact.js`, which adds the person to the agency's LeadConnector (HighLevel) location as a
contact tagged `presslane-website`, with their message as a note. Each agency's location id and token live in one
Vercel environment variable, `PRESSLANE_CRM`, as JSON keyed like `agencies.js`:

```json
{"leonardopower": {"locationId": "abc123", "token": "pit-..."}, "octopusup": {"locationId": "def456", "token": "pit-..."}}
```

The token is a Private Integration token with the `contacts.write` scope. Paste the JSON as the variable's value;
the function also copes with the whole `PRESSLANE_CRM='…'` line or quotes around the JSON. Redeploy after changing the variable.
Never put a token in any file in this folder: everything here is public.

## Deploy

Vercel: import this folder as the project root (framework preset "Other", no build command, output directory
`.`). Keep the meeting-notes `.docx` and anything else private out of this folder: a CLI deploy publishes
whatever is here.

## Sample content to confirm before launch

- The quote demo prices (hoodie £26.40, polo £14.20, t-shirt £9.60, cap £11.90, mug £8.40, bottle £7.90,
  pen £0.85 before volume breaks of 5, 10, 15, 20 and 25 per cent) are illustrative.
- "Northside Print", "Sam Okafor" and "Okafor Roofing" are fictional.
- The delivery dates and the tracking number in the job steps are illustrative.
