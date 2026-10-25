# Alexis Papadimitriou — Private Chef & Catering

The website for Alexis's private chef and catering business: **papadimitriou.uk**.
The QR code on his business card brings people here to send an enquiry.

## Files

| File | What it is |
|---|---|
| `index.html` | The home page layout |
| `about.html` | The About page: his story, career timeline and training (served at `/about`, Greek at `/el/about/`) |
| `site.css` | Styles shared by both pages |
| `app.js` | Home page animations, the legal pages, and the form |
| `about.js` | The About page's language switch and scroll effects |
| `i18n.js` | All the site text in English and Greek |
| `gallery.js` | The list of food photos for the gallery |
| `food-1.jpg` … `food-4.jpg` | The gallery photos |
| `sm/` | Light, phone-sized copies of the gallery photos (made by `tools/small-photos.py`) |
| `fonts/` | The site's fonts, served from the site itself (SIL Open Font License, see `fonts/OFL.txt`) |
| `alexis.jpg` | His portrait (used for Google and as a fallback) |
| `alexis-cut.webp` | His portrait cut out of the background (for the chef scene) |
| `alexis-bg.jpg` | The studio backdrop behind him in the chef scene |
| `alexis-turbot.webp`, `alexis-prime-cut.webp` | Kitchen photos of him in the About and Journey sections |
| `art-*.webp` | The produce drawings in "A menu for every season": one for each card and one behind each menu (`art-*-grow.png` is the order each menu drawing draws itself in). The artichoke (`art-spring.webp`) is hand-drawn; the rest are gold-on-olive illustrations made in Astra, brought in with `python3 tools/art/import_art.py drawing.png NAME --dark` (`--card` for card art, `--menu` to keep a menu layout's corners). The originals are in the project files under `season-art/astra/` |
| `robots.txt`, `sitemap.xml` | Tell search engines what to index |
| `og.JPG`, `apple-touch-icon.PNG` | The image shown when the link is shared, and the phone home-screen icon |
| `worker.js` | The enquiry backend (`/api/enquiry`), plus the pre-rendered Greek page at `/el/` |
| `wrangler.jsonc` | Cloudflare settings: project name, domains and email addresses |
| `_headers` | Security headers and browser caching for the website |
| `.assetsignore` | Keeps `worker.js`, `wrangler.jsonc` and this README from being published |

## What the site does

- **Bilingual:** English and Greek. The language follows the visitor's phone, and they can switch with the toggle. `?lang=el` forces Greek.
- **Scroll animations:**
  - The card reveal.
  - Words that light up as you scroll; tapping them makes them glow briefly, then they fade back.
  - Swipeable occasion cards.
  - The Enquire button scrolls quickly down to the form.
- **Legal pages** (EN + GR), in the footer and at their own links:
  - `#privacy` — Privacy Policy (GDPR)
  - `#cookies` — Cookies
  - `#terms` — Terms
  - `#legal` — Legal notice (business details, per Π.Δ. 131/2003)
- **No tracking cookies, so no cookie banner.** Fonts are served from the site itself (`/fonts`), so no third party sees visitors.
- **Enquiry form:**
  - Alexis gets a designed enquiry email: a summary of the date, guests, location and occasion, their message, and one-tap Reply, WhatsApp and Call buttons.
  - The visitor gets a confirmation email from `alexis@papadimitriou.uk` in their language.

### Security (tested)

- **Server-side checks:** every field is checked and cleaned on the server. Lengths are capped, fields must have the right type, location and occasion must come from the allowed list, and control and hidden characters are removed.
- **Spam protection:** Cloudflare Turnstile blocks bots. If the check can't be verified, the form refuses the enquiry.
- **Silent bot traps:** a hidden honeypot field and a "filled too fast" check quietly drop bot submissions.
- **Own site only:** the backend only accepts requests coming from the site itself.
- **Rate limits:**
  - One enquiry per visitor every 30 seconds.
  - Only one confirmation email per address every 10 minutes, so nobody can use the form to flood someone else's inbox.
- **Safe emails:** all content in the emails is HTML-escaped, and the confirmation never repeats the visitor's message.
- **Strict browser security policy:**
  - No inline scripts are allowed.
  - The site can't be embedded in another site (stops clickjacking).
  - HTTPS is forced (HSTS).
- **Nothing private in the code:** no email addresses or keys are in the page. Secrets live only in Cloudflare.

---

## One-time setup

### 1. Email forwarding (done)

Cloudflare Email Routing forwards `alexis@papadimitriou.uk` to Alexis's Gmail.

### 2. Resend: sends the emails (free: 3,000/month, 100/day)

1. Sign up at **resend.com**.
2. Go to **Domains → Add domain** and enter `papadimitriou.uk`.
   - Resend lists DNS records (on a `send` subdomain, so they don't interfere with Email Routing).
   - Add them in **Cloudflare → DNS**, or use Resend's automatic Cloudflare setup if it's offered.
   - Wait for the domain to show **Verified**.
3. Go to **API Keys → Create API key** with **Sending access**, and copy the key.

### 3. Cloudflare Turnstile: spam protection (free)

1. In Cloudflare, go to **Turnstile → Add widget**.
   - **Name:** Website
   - **Hostnames:** `papadimitriou.uk` and `www.papadimitriou.uk`
   - **Mode:** Managed
2. Copy the **Site key** and the **Secret key**.
3. In `app.js`, find `turnstileSiteKey` at the top and paste the **Site key** there. The site key is public, so it's safe in the code.

### 4. Add the secrets to the Worker

Go to **Workers & Pages → website → Settings → Variables and Secrets → Add**. Choose type **Secret** for both:

| Name | Value |
|---|---|
| `RESEND_API_KEY` | the Resend API key |
| `TURNSTILE_SECRET` | the Turnstile **Secret** key |

### 5. Change the deploy command

Go to **Settings → Build → Deploy command** and set it to:

```
npx wrangler deploy
```

The settings now come from `wrangler.jsonc`.

### 6. Upload the files and test

1. Upload all the files to the GitHub repo (**Add file → Upload files**), then commit.
   - Files with the same name replace the old ones.
   - `.assetsignore` starts with a dot, so check that it uploaded.
2. When Cloudflare shows **Ready**, send a test enquiry.
   - Alexis should get the enquiry in Gmail.
   - The test email address should get the confirmation.
3. If anything fails, check **Workers & Pages → website → Observability / Logs**.

## Loading on slow connections

- Fonts come from the site itself and the two used first are preloaded, so text appears without waiting on another server.
- If the scripts take a while (slow mobile data), the home page shows the AP monogram with a travelling gold light until it is ready, and the About page keeps its opening veil closed until then.
- Gallery photos load only as you scroll near them, as light phone-sized copies, with a soft band of light across each frame until the photo arrives. In the full-screen viewer each photo sharpens from the light copy to the full one.
- The menu drawings load only when the menus come near. On a slow or data-saving connection (as reported by Chrome and Android), the frame-by-frame growth animations, several MB, are skipped and the lighter drawing animation is used.
- Browsers keep fonts for a year and everything else for a day, refreshing it in the background. Bump `?v=N` after changing scripts or styles, as before.

## Adding food photos (the "From the kitchen" gallery)

1. **Upload the photo to GitHub**, e.g. `food-1.jpg`.
   - Photos straight from a phone are fine. Under about 400 KB each loads fastest.
   - Upper- or lower-case extensions both work.
2. **List it in `gallery.js`.** Open the file on GitHub, tap the pencil to edit, and add a line with the file name and a caption in English and Greek:
   ```js
   { file: 'food-1.jpg', en: 'Charred octopus, fava', el: 'Χταπόδι, φάβα' },
   ```
3. **Commit.** The gallery section appears automatically once there's at least one photo.
   - It shows as a two-column grid on phones and three columns on desktop.
   - Tapping a photo opens it full screen; swipe or use the arrows to browse.
4. **Optional, for speed:** run `python3 tools/small-photos.py` (or ask Claude to) to make the phone-sized copy in `sm/`. The grid loads those copies, which are about three times lighter. Without one, the photo still shows; it just loads the full file.

His portrait is shown in the chef scene using `alexis-cut.webp` (him, cut out) and `alexis-bg.jpg` (the backdrop). To change the portrait, send a new photo to be cut out again.

---

## SEO: getting found on Google

### Already built into the site

- **Two indexable pages:**
  - English: `papadimitriou.uk/`
  - Greek: `papadimitriou.uk/el/`, pre-rendered in Greek so Google indexes the Greek text directly.
  - Each page tells Google about the other language version (hreflang).
- **Search-friendly titles and descriptions**, aimed at searches like "private chef Athens" and "ιδιωτικός σεφ Αθήνα".
- **Structured data:** business details in Google's format (`LocalBusiness`), including the areas served, phone, email and services.
- **Link previews:** a branded image appears when the link is shared on WhatsApp, Instagram or iMessage.
- **`sitemap.xml` and `robots.txt`.**

### Do these once (they matter more than anything in the code)

1. **Google Business Profile (biggest impact for local searches)**
   - Go to business.google.com and create a profile.
   - Choose **"I deliver goods and services to my customers"**. This makes it a service-area business, so the home address stays hidden.
   - Add the service areas (Athens, and London if wanted), the category "Personal chef" (or the closest match), the website, the phone number and photos of his food.
   - Ask happy clients for Google reviews.
2. **Google Search Console**
   - Go to search.google.com/search-console and add a **Domain** property for `papadimitriou.uk`.
   - It can verify through Cloudflare automatically.
   - Then go to **Sitemaps** and submit `https://papadimitriou.uk/sitemap.xml`.
3. **Bing Webmaster Tools:** import the site from Search Console in one click.
4. **Send www to the main address**
   - In Cloudflare, go to **Rules → Redirect Rules → Create rule** and choose the template *Redirect from WWW to root*.
   - This makes `www.papadimitriou.uk` forward to `papadimitriou.uk`, so Google doesn't see two copies of the site.
5. **Social profiles**
   - When Instagram or Facebook profiles exist, add their links.
   - In `index.html`, add them to the structured data as `"sameAs": ["https://instagram.com/…"]`.
   - Also link the website from those profiles.
6. **Photos:** real photos of his food will help both ranking and bookings. Add them with descriptive file names and alt text, e.g. `private-chef-athens-tasting-menu.jpg`.

New sites usually take a few weeks to start appearing in search results.

---

## Before launch: legal details to fill in

In `app.js`, fill in `LEGAL_INFO` at the top. Greek law (Π.Δ. 131/2003) requires businesses to show these details. Empty lines are hidden.

- `legalName`: the registered business name
- `address`: the business address
- `vat`: ΑΦΜ
- `taxOffice`: ΔΟΥ
- `gemi`: Αριθμός ΓΕΜΗ, if registered

Have the policies checked by Alexis's accountant or a lawyer. They are a solid starting template, not legal advice.

## Editing

| What | Where |
|---|---|
| Phone (Greek), WhatsApp (UK), email, Turnstile site key | `CONFIG` at the top of `app.js` |
| Business details for the Legal notice | `LEGAL_INFO` in `app.js` |
| All text (EN + GR) | `i18n.js`: edit **both** `en` and `el` |
| Legal page wording | `legalPages()` in `app.js` |
| Where enquiries go, sender address | `vars` in `wrangler.jsonc` |
| Colours | CSS variables in `:root` in `index.html` |

## QR code

- Point it to `https://papadimitriou.uk/#contact` to land on the form.
- Add `?lang=el` before the `#` for Greek.

## Checks

- [ ] Both `/` and `/el/` read correctly, and the statement words light up on scroll in both.
- [ ] Sharing the link on WhatsApp shows the preview image.
- [ ] The sitemap is submitted in Search Console.
- [ ] The call link opens `+30 694 500 9919` and WhatsApp opens `+44 7856 779459`.
- [ ] A test enquiry reaches Gmail, and the confirmation reaches the test address.
- [ ] `LEGAL_INFO` is filled in.
- [ ] The business card matches the site's phone number and email.
