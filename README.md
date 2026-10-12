# Alexis Papadimitriou — Private Chef & Catering

A single-page website for Alexis Papadimitriou's private chef and catering business. Michelin-trained, serving Athens and London.

Visitors scan the QR code on his business card, land on this site, and can send an enquiry through the contact form.

## Features

- **Bilingual:** English and Greek (EN / ΕΛ toggle).
  - The language is chosen from the visitor's phone settings.
  - A visitor can override it with the toggle, and the choice is remembered.
  - `?lang=el` or `?lang=en` in the URL forces a language. Useful for the QR code.
- **Scroll-driven animations:**
  - Monogram zoom and card reveal.
  - Word-by-word statement.
  - Pinned horizontal "Occasions" section.
  - Self-drawing process timeline.
  - Reveal-on-scroll headings.
- **Accessibility:** respects the *Reduce Motion* setting. Animations are switched off and all content is shown statically.
- **Contact form:** works without a backend, through [FormSubmit](https://formsubmit.co).
  - Includes a spam honeypot.
  - Shows success and error messages in both languages.
- **Direct contact:** call, WhatsApp and email links.
- **Self-contained:** one HTML file, no build step, no dependencies. Only Google Fonts are loaded from outside.

## Project structure

```
index.html   ← the whole site (HTML, CSS, JS)
README.md
CNAME        ← created automatically by GitHub when you set a custom domain
```

## Editing

| What | Where in `index.html` |
|---|---|
| Phone, email | `CONFIG` object at the top of the `<script>` |
| All text (EN + GR) | `I18N` object in the `<script>`: edit both `en` and `el` |
| Colours | CSS variables in `:root` at the top of `<style>` |
| Event types in the form | `<select id="f-occ">`, plus matching `oc.*` text keys |

Text is translated through `data-i18n="key"` attributes. If you add new text, add the key to **both** languages.

## Running locally

Open `index.html` in a browser, or serve it locally so the form behaves exactly as it will online:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

---

## Going live

You can use either option below. Both are free and both work with a domain bought on Cloudflare.

**Option B is the simpler of the two.** Your domain and Cloudflare account are already connected to GitHub, so Cloudflare sets up the DNS for you.

### Step 1: Put the code on GitHub (both options)

1. On GitHub, create a new repository, e.g. `alexis-chef`. Making it **Public** is required for GitHub Pages on a free account.
2. Upload `index.html` and `README.md`:
   - Click **Add file → Upload files**.
   - Commit the files to the `main` branch.

### Option A: GitHub Pages + Cloudflare DNS

**1. Turn on Pages**
- In the repo, go to **Settings → Pages**.
- Set **Source** to *Deploy from a branch*.
- Set **Branch** to `main`, folder `/ (root)`, then click **Save**.
- After about a minute the site is live at `https://<your-username>.github.io/alexis-chef/`.

**2. Add the custom domain in GitHub**
- Still in **Settings → Pages → Custom domain**, enter your domain, e.g. `yourdomain.com`.
- Click **Save**. GitHub commits a `CNAME` file for you.

**3. Add the DNS records in Cloudflare**
- Go to **your domain → DNS → Records** and add these records:

   | Type | Name | Content |
   |---|---|---|
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |
   | AAAA | `@` | `2606:50c0:8000::153` |
   | AAAA | `@` | `2606:50c0:8001::153` |
   | AAAA | `@` | `2606:50c0:8002::153` |
   | AAAA | `@` | `2606:50c0:8003::153` |
   | CNAME | `www` | `<your-username>.github.io` |

- Set **Proxy status to "DNS only"** (grey cloud) on all of them. GitHub can't issue the HTTPS certificate while Cloudflare's proxy is on.
- Delete any old A/AAAA/CNAME records for `@` or `www` that Cloudflare created by default (parking records).

**4. Turn on HTTPS**
- Wait until GitHub's **Settings → Pages** shows the DNS check passing. This usually takes minutes, but can take up to 24 hours.
- Then tick **Enforce HTTPS**.

**5. Verify the domain (recommended)**
- This stops anyone else from claiming your domain on GitHub.
- On GitHub, go to **profile picture → Settings → Pages → Add a domain**.
- Add the TXT record GitHub gives you in Cloudflare DNS.
- Click **Verify**.

> If you later want Cloudflare's proxy (orange cloud), first set Cloudflare **SSL/TLS mode to "Full (strict)"**. Leaving it on *Flexible* causes an endless redirect loop.

### Option B: Cloudflare Pages (connected to the GitHub repo)

1. In Cloudflare, go to **Workers & Pages → Create → Pages → Connect to Git**.
2. Choose the `alexis-chef` repo.
3. Set the build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`
4. Click **Save and Deploy**. The site goes live at `alexis-chef.pages.dev`.
5. Go to **Custom domains → Set up a custom domain** and enter your domain. Cloudflare adds the DNS records and the HTTPS certificate automatically, because the domain is in the same account.
6. Add `www.yourdomain.com` as a second custom domain if you want both to work.

From now on, every commit to `main` redeploys automatically.

*(Cloudflare's dashboard layout changes from time to time. If the menu names differ, look for "Pages" and "Connect to Git".)*

---

## After it's live

### 1. Activate the contact form (required)

FormSubmit needs a one-time confirmation before it will deliver enquiries.

1. Open the live site and submit a test enquiry.
2. FormSubmit emails **alexispapadimitriou2@gmail.com** an activation link. Alexis must click it. Check his spam folder too.
3. Submit another test. It should now arrive in his inbox.

*Optional:* the activation email also gives a random alias string. You can use it to keep his email address out of the page source:
- In `index.html`, change `ENDPOINT` to `'https://formsubmit.co/ajax/<alias>'`.

### 2. Make the QR code

- Point it to `https://yourdomain.com/#contact` to land straight on the form.
- Or point it to `https://yourdomain.com` to show the full scroll experience first.
- Add `?lang=el` before the `#` if the cards are for a Greek audience.
- Before printing, test-scan it with both an iPhone and an Android phone.

### 3. Final checks

- [ ] Both languages read correctly.
- [ ] The call and WhatsApp links open the right number (`+30 694 500 9919`).
- [ ] The form test arrives in the inbox.
- [ ] The site loads over `https://`.
