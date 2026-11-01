# Portfolio

My portfolio: a home page, one case study per project and a 404 page, in plain HTML, CSS and JavaScript. There is no build step and no framework; the only outside dependencies are Google Fonts and, on computers with a mouse, three.js from jsDelivr for the 3D network in the hero.

```
portfolio/
├── index.html        the home page
├── projects/         one case study per project: archlens.html, deepbell.html, supplytrace.html
├── 404.html          shown by GitHub Pages for any address that does not exist
├── style.css         colours, fonts, layout, animation (every page)
├── projects.css      extra styles for the case studies and the 404 page
├── script.js         theme toggle, clock, scroll reveal, marquee, cursor preview, screenshot viewer,
│                     live-demo links (every page; each part runs only where its elements exist)
├── js/hero3d.js      the 3D pipeline network behind the headline (home page, computers with a mouse)
├── resume.pdf        résumé (no phone number)
└── images/
    ├── og.png        the link preview (1200 × 630)
    ├── resume-preview.jpg
    └── projects/     one cover per project (<name>.jpg) and the case-study screenshots (<name>/*.jpg)
```

## 1. Preview it

Pick one of these:

- Double-click `index.html`.
- In VS Code, install the **Live Server** extension, right-click `index.html` and choose **Open with Live Server**. The page reloads every time you save.
- Run `python -m http.server 8000` in this folder, then open <http://localhost:8000>.

## 2. Edit the content

Every place you might change is marked with an `EDIT` comment. Search for `EDIT` across the folder with Ctrl+Shift+F.

| What | Where |
|---|---|
| Page title and link-preview text | `<head>` in `index.html` |
| Headline (three lines) and intro | `.hero` |
| Projects on the home page | `.projects`, one `<li>` per project |
| Test counts ("258 tests · CI passing") | `.p-proof` on the home page and the Proof section of each case study; keep them equal |
| **Live-demo URLs** | `LIVE_DEMOS` at the top of `script.js`, the only place they are set (see below) |
| Case studies | `projects/<name>.html` |
| About text, numbers, skills | `#about` |
| Internships and education | `#experience` |
| Email and social links | the `mailto:` links and `.socials` |
| Time zone for the clock | `TIME_ZONE` at the top of `script.js` |

### Live demos

The live-demo URLs are set in one place, `LIVE_DEMOS` at the top of `script.js`:

```js
const LIVE_DEMOS = {
  archlens: 'https://archlens-xhxr.onrender.com',
  deepbell: 'https://deepbell.onrender.com',
  supplytrace: 'https://supplytrace-fkpq.onrender.com',
};
```

Each project's "Live demo ↗" link on the home page and on its case study reads its URL from there and shows the note "may take a minute to wake (free hosting)", because the free Render services sleep after 15 quiet minutes. Set a URL to `''` to hide that project's links, for example while its service is down. For a new project, add a key with the same name as the `data-demo` attribute on its links.

### Case studies

Each page in `projects/` has the same sections: the one-line summary, The problem, How it works (an inline SVG diagram plus the steps), Key decisions, Proof (tests, CI, stack), Screenshots and Limitations, then a link to the next case study. Every fact comes from the project's own README; when a README changes (a new test count, a new limitation), change the page to match.

- **The diagram** has two versions in the page: `.diagram-wide` (shown from 1240 px) and `.diagram-tall` (phones and tablets). Its colours come from the `.dg-*` classes in `projects.css`, which use the theme variables, so it follows light and dark mode. Edit the box text in both versions.
- **Screenshots** live in `images/projects/<name>/`: 1200 × 750 JPGs under about 250 KB, with `width` and `height` set on the `<img>`.

### Link preview

`images/og.png` (1200 × 630) is the picture shown when the site is shared on LinkedIn, WhatsApp, Slack or X. It was rendered from a small HTML card with headless Chrome. The tags are `og:image` and `twitter:image` in the `<head>` of every page, with absolute URLs (`https://vishnuatgit.github.io/images/og.png`). After changing it, check it with LinkedIn's Post Inspector, which also clears LinkedIn's cache.

### The 404 page

GitHub Pages serves `404.html` for any address that does not exist, at any depth, so its links and files start with `/` (the site root). Open <http://localhost:8000/404.html> to preview it; a local server shows its own error page for missing addresses instead.

### Update project screenshots

Each project has one screenshot in `images/projects/` (`archlens.jpg`, `deepbell.jpg`, `supplytrace.jpg`).

1. Run the project locally and take a browser screenshot at **1440×900** (16:10).
2. Resize it to **1200×750** and save it as a JPG over the old file, keeping the same name. Keep each image under about 250 KB; <https://squoosh.app> compresses them in the browser.
3. For a new project, copy a `<li class="project">` and point its `.p-shot` `<img>` at the new file.

The image appears on the card on phones and tablets (tap it to enlarge), and in the floating preview that follows the cursor on desktop.

### Update your résumé

`resume.pdf` is your July 2026 résumé with the phone number removed, because the site is public and people can email you instead. `images/resume-preview.jpg` is a picture of its first page, shown in the Résumé section.

To update it, export the new résumé without your phone number, save it over `resume.pdf`, and replace `images/resume-preview.jpg` with an image of the first page at about 1100 × 1430.

## 3. Change the look

- **Text sizes:** every size comes from the type scale at the top of `style.css` (`--text-xs` to `--text-giant`). Change a step there and it changes everywhere it's used.
- **Colours:** the top of `style.css`. `:root` holds the light theme and `[data-theme="dark"]` the dark one. `--accent` is the orange highlight.
- **Fonts:** change the Google Fonts `<link>` in `index.html` and the three `--font-*` variables. Inter Tight with Instrument Serif is the current pairing; Space Grotesk with Fraunces, or Manrope with Playfair Display, also work.
- **Project colours:** the `--accent` on each project's `<li>`.
- **The 3D network in the hero:** `js/hero3d.js` draws a slowly turning network of services with orange packets flowing through it, in the theme's colours. **To turn it off, set `HERO_3D = false` at the top of that file**; the hero then looks exactly as it did before, with nothing extra downloaded. Only computers with a mouse and a screen at least 900 px wide load it (after the page has loaded and the browser is idle); phones, data saver, slow connections and devices with under 4 GB of memory skip it, and with reduced motion it is a still picture. three.js is pinned to one version in `THREE_URL` in the same file. It needs a local server (section 1); opened by double-click, the page shows without it.

## 4. Put it online for free with GitHub Pages

1. On GitHub, create a new public repository named exactly **`vishnuatgit.github.io`**.
2. Push this folder to it:

   ```bash
   git init
   git add .
   git commit -m "Portfolio"
   git branch -M main
   git remote add origin https://github.com/vishnuatgit/vishnuatgit.github.io.git
   git push -u origin main
   ```

3. In the repository, go to **Settings → Pages**, set the source to **Deploy from a branch**, then **main** and **/ (root)**.
4. After a minute or two the site is live at **https://vishnuatgit.github.io**. Project sites you already host on GitHub Pages keep their addresses.

Netlify, Vercel and Cloudflare Pages work too. With Netlify, you can drag this folder onto <https://app.netlify.com/drop>. If you buy a domain later, each host's docs explain how to connect it.

Then put the link in your GitHub profile README, your LinkedIn and the top of your résumé.

## 5. What makes portfolios in those galleries stand out

1. **One clear sentence.** A visitor should know who you are and what you do within five seconds.
2. **Show the work, not a list of skills.** For each project: the problem, what you built and the result, with a link.
3. **Case studies beat thumbnails.** Backend work has no visuals, so the write-up is where it shines. Each project now has its own page in `projects/` with a pipeline diagram, the key decisions, proof and honest limitations. Keep them current.
4. **One signature detail, not ten.** Here it's the cursor preview, the live clock and the big type. Gallery sites win on restraint and polish.
5. **Fast and works on phones.** Run Lighthouse (Chrome DevTools → Lighthouse) and aim for 90 or more. Check it on your own phone.
6. **Keep it true and current.** Update the numbers and status whenever they change.

## 6. Ideas for later

- Smooth scrolling with [Lenis](https://github.com/darkroomengineering/lenis), or scroll-driven animation with GSAP ScrollTrigger.
- A custom cursor.
- A blog, or the case studies written in Markdown, by moving to [Astro](https://astro.build), which still outputs static HTML.
- Privacy-friendly analytics, such as GoatCounter or Cloudflare Web Analytics.
- Submitting to galleries such as Awwwards once it's polished. Check each site's rules first, because some charge a submission fee.
