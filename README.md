# Portfolio

My one-page portfolio: plain HTML, CSS and JavaScript. There is no build step and no framework; the only outside dependency is Google Fonts.

```
portfolio/
├── index.html    all the content
├── style.css     colours, fonts, layout, animation
├── script.js     theme toggle, clock, scroll reveal, marquee, cursor preview, screenshot viewer
├── resume.pdf    résumé (no phone number)
└── images/       résumé preview, and project screenshots in images/projects/
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
| Projects | `.projects`, one `<li>` per project |
| About text, numbers, skills | `#about` |
| Internships and education | `#experience` |
| Email and social links | the `mailto:` links and `.socials` |
| Time zone for the clock | `TIME_ZONE` at the top of `script.js` |

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
3. **Case studies beat thumbnails.** Backend work has no visuals, so the write-up is where it shines. Give your two best projects (ArchLens and DeepBell) their own pages, such as `archlens.html`, with an architecture diagram, a screenshot, the hardest problem you solved and what you would do next.
4. **One signature detail, not ten.** Here it's the cursor preview, the live clock and the big type. Gallery sites win on restraint and polish.
5. **Fast and works on phones.** Run Lighthouse (Chrome DevTools → Lighthouse) and aim for 90 or more. Check it on your own phone.
6. **Keep it true and current.** Update the numbers and status whenever they change.

## 6. Ideas for later

- Smooth scrolling with [Lenis](https://github.com/darkroomengineering/lenis), or scroll-driven animation with GSAP ScrollTrigger.
- A custom cursor.
- A blog or case-study pages written in Markdown, by moving to [Astro](https://astro.build), which still outputs static HTML.
- Privacy-friendly analytics, such as GoatCounter or Cloudflare Web Analytics.
- Submitting to galleries such as Awwwards once it's polished. Check each site's rules first, because some charge a submission fee.
