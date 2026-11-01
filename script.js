// Portfolio interactions, shared by the home page, the case studies and the 404 page.
// All of it is polish: the content reads fine without it. Each part checks that its
// elements are on the page, so one file serves every page.

// EDIT: your time zone, shown next to "Based in"
const TIME_ZONE = 'Asia/Kolkata';

// EDIT: live-demo URLs, the one place they are set. Each project's "Live demo" link on the
// home page and on its case study reads its URL from here. Set a URL to '' to hide that
// project's links (for example while its service is down).
const LIVE_DEMOS = {
  archlens: 'https://archlens-xhxr.onrender.com',
  deepbell: 'https://deepbell.onrender.com',
  supplytrace: 'https://supplytrace-fkpq.onrender.com',
};

const root = document.documentElement;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
window.portfolioReady = true;   // tells the safety net in <head> that this file ran
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Reduced motion is checked live: if the visitor turns it on mid-visit, the JS-driven motion stops too.
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = motionQuery.matches;
const motionListeners = [];
motionQuery.addEventListener('change', () => {
  reducedMotion = motionQuery.matches;
  motionListeners.forEach(fn => fn());
});


// ---- Live-demo links: shown only once a URL is set above ----
// Each link has data-demo="<project>"; the "may take a minute to wake" note next to it has
// data-demo-note="<project>".
document.querySelectorAll('[data-demo]').forEach(link => {
  const url = LIVE_DEMOS[link.dataset.demo];
  if (!url) return;
  link.href = url;
  link.hidden = false;
  document.querySelectorAll(`[data-demo-note="${link.dataset.demo}"]`).forEach(note => { note.hidden = false; });
});


// ---- Light / dark toggle (remembers your choice) ----
// Where the browser supports View Transitions, the new theme grows as a circle from the button.
const toggle = document.querySelector('.theme-toggle');
const themeMetas = document.querySelectorAll('meta[name="theme-color"]');
const syncThemeColor = () => {
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
  themeMetas.forEach(meta => { meta.content = bg; });
};
const setTheme = theme => {
  root.dataset.theme = theme;
  try { localStorage.setItem('theme', theme); } catch (e) {}
  syncThemeColor();
};
syncThemeColor();

if (toggle) toggle.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  if (!document.startViewTransition || reducedMotion) { setTheme(next); return; }

  const r = toggle.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  root.classList.add('theme-switching');
  const transition = document.startViewTransition(() => setTheme(next));
  transition.ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 700, easing: 'cubic-bezier(.2, .7, .1, 1)', pseudoElement: '::view-transition-new(root)' },
    );
  }).catch(() => {});
  transition.finished.finally(() => root.classList.remove('theme-switching'));
});


// ---- Live local time and footer year ----
const clock = document.getElementById('local-time');
if (clock) {
  const timeFormat = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TIME_ZONE, timeZoneName: 'short',
  });
  const updateClock = () => { clock.textContent = timeFormat.format(new Date()); };
  updateClock();
  setInterval(updateClock, 15000);
}

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();


// ---- Nav: background after scrolling, a pill that glides to the current section ----
const nav = document.querySelector('.nav');
const pill = nav.querySelector('.nav-pill');
const glider = pill.querySelector('.nav-glider');
const navLinks = [...pill.querySelectorAll('a')];
let activeLink = null;
let hoverLink = null;

const placeGlider = () => {
  const target = hoverLink || activeLink;
  navLinks.forEach(a => a.classList.toggle('lit', a === target));
  if (!target) { glider.style.opacity = '0'; return; }
  const appearing = glider.style.opacity !== '1';
  if (appearing) glider.style.transition = 'opacity .25s';   // jump into place, then fade in
  glider.style.width = `${target.offsetWidth}px`;
  glider.style.transform = `translateX(${target.offsetLeft}px)`;
  glider.style.opacity = '1';
  if (appearing) { void glider.offsetWidth; glider.style.transition = ''; }
};
const setActive = link => {
  if (link === activeLink) return;
  activeLink = link;
  placeGlider();
};

pill.addEventListener('pointerover', e => {
  const a = e.target.closest('a');
  if (a && e.pointerType === 'mouse') { hoverLink = a; placeGlider(); }
});
pill.addEventListener('pointerleave', () => { hoverLink = null; placeGlider(); });
addEventListener('resize', placeGlider);
if (document.fonts) document.fonts.ready.then(placeGlider);

// On phones the bottom pill tucks away while you scroll down and comes back when you scroll up.
let lastY = scrollY;
const onScroll = () => {
  const y = scrollY;
  nav.classList.toggle('scrolled', y > 24);
  if (y < innerHeight * 0.5) setActive(null);
  const dy = y - lastY;
  if (Math.abs(dy) > 8) {
    const atBottom = innerHeight + y >= root.scrollHeight - 40;
    nav.classList.toggle('tucked', dy > 0 && y > innerHeight * 0.6 && !atBottom);
    lastY = y;
  }
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Only links to sections of this page light up (on a case study, "Work" points back home).
const samePage = a => a.hash && a.pathname === location.pathname;
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    setActive(navLinks.find(a => samePage(a) && a.hash === '#' + entry.target.id) || null);
  });
}, { rootMargin: '-45% 0px -50% 0px' });

navLinks.forEach(a => {
  const section = samePage(a) && document.getElementById(a.hash.slice(1));
  if (section) sectionObserver.observe(section);
});
// The Résumé section has no link of its own; watching it lets the glider fade out there
// instead of leaving "Experience" lit.
const resumeSection = document.querySelector('#resume');
if (resumeSection) sectionObserver.observe(resumeSection);

// The hero's drifting glow and status ping pause while the hero is off-screen (saves GPU and battery).
const hero = document.querySelector('.hero');
if (hero) new IntersectionObserver(([entry]) => root.classList.toggle('hero-off', !entry.isIntersecting)).observe(hero);

// The 3D pipeline network behind the headline (js/hero3d.js, which also holds its off switch).
// Only computers with a mouse and a screen at least 900 px wide download it, and not with data
// saver, a slow connection or under 4 GB of memory. It loads after the page has loaded and the
// browser is idle, once the hero is on screen. Phones get nothing extra.
const hero3d = document.querySelector('.hero-3d');
if (hero3d) {
  const connection = navigator.connection || {};
  const capable = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)').matches
    && !connection.saveData
    && !/2g|3g/.test(connection.effectiveType || '')
    && !(navigator.deviceMemory < 4);
  const whenIdle = fn => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 300));
  const load = () => whenIdle(() => {
    const onScreen = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      onScreen.disconnect();
      import('./js/hero3d.js').then(m => m.start(hero3d)).catch(() => {});
    });
    onScreen.observe(hero3d);
  });
  if (capable) {
    if (document.readyState === 'complete') load();
    else addEventListener('load', load, { once: true });
  }
}


// ---- Reveal blocks as they scroll into view ----
const countUp = dd => {
  const text = dd.textContent.trim();
  const match = text.match(/^([\d,]+)(.*)$/);
  if (!match || reducedMotion) return;
  const end = parseInt(match[1].replace(/,/g, ''), 10);
  const suffix = match[2];
  // Screen readers get the real number; the ticking copy is hidden from them.
  dd.innerHTML = '';
  const real = Object.assign(document.createElement('span'), { className: 'sr-only', textContent: text });
  const shown = document.createElement('span');
  shown.setAttribute('aria-hidden', 'true');
  dd.append(real, shown);
  const duration = 1600;
  const start = performance.now();
  const tick = now => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(2, -10 * t);   // fast, then settles
    shown.textContent = Math.round(end * (t === 1 ? 1 : eased)).toLocaleString('en-US') + suffix;
    if (t < 1) requestAnimationFrame(tick);
    else dd.textContent = text;
  };
  requestAnimationFrame(tick);
};

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('in');
    entry.target.querySelectorAll('[data-count]').forEach(countUp);
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


// ---- Marquee: repeat the words until they fill the screen, then loop ----
// Its speed follows your scrolling (and its direction flips when you scroll up).
const marquee = document.querySelector('.marquee');
if (marquee) {
  const track = marquee.querySelector('.marquee-track');
  const group = track.querySelector('.marquee-group');
  const words = [...group.children];
  for (let i = 0; i < 10 && group.scrollWidth < innerWidth * 1.2; i++) {
    words.forEach(word => group.append(word.cloneNode(true)));
  }
  if (group.children.length % 2) words.forEach(word => group.append(word.cloneNode(true)));   // keeps the sans/serif rhythm across the seam
  track.append(group.cloneNode(true));

  let width = group.offsetWidth;
  let x = 0, speed = 0, direction = -1, boost = 0, last = 0;
  let hovering = false, visible = false, live = false, frameId = 0;
  let lastScroll = scrollY;

  const frame = now => {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    const target = hovering ? 0 : direction * (width / 40 + boost);
    speed += (target - speed) * Math.min(1, dt * 5);
    boost *= Math.pow(0.06, dt);
    x += speed * dt;
    if (x <= -width) x += width;
    else if (x > 0) x -= width;
    track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    frameId = visible && live ? requestAnimationFrame(frame) : 0;
  };
  const start = () => {
    if (live && visible && !frameId) { last = 0; frameId = requestAnimationFrame(frame); }
  };
  // Runs only while it is on screen and motion is allowed; otherwise the strip stands still.
  const setLive = on => {
    live = on;
    marquee.classList.toggle('is-live', on);
    if (on) { start(); return; }
    cancelAnimationFrame(frameId);
    frameId = 0;
    x = speed = boost = 0;
    track.style.transform = '';
  };

  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; start(); }).observe(marquee);

  addEventListener('scroll', () => {
    const dy = scrollY - lastScroll;
    lastScroll = scrollY;
    if (!dy || !live) return;
    direction = dy > 0 ? -1 : 1;
    boost = Math.min(boost + Math.abs(dy) * 3, 600);
  }, { passive: true });
  marquee.addEventListener('mouseenter', () => { hovering = true; });
  marquee.addEventListener('mouseleave', () => { hovering = false; });
  addEventListener('resize', () => { width = group.offsetWidth; });
  if (document.fonts) document.fonts.ready.then(() => { width = group.offsetWidth; });

  setLive(!reducedMotion);
  motionListeners.push(() => setLive(!reducedMotion));
}


// ---- Projects (home page) ----
const projects = [...document.querySelectorAll('.project')];


// Tap a screenshot to see it large (phones and tablets). On phones it keeps a readable size and pans sideways.
const lightbox = document.querySelector('.lightbox');
if (lightbox) {
  const lightboxImg = lightbox.querySelector('.lightbox-img');
  const lightboxTitle = lightbox.querySelector('.lightbox-title');
  const lightboxLink = lightbox.querySelector('.lightbox-link');
  const lightboxMedia = lightbox.querySelector('.lightbox-media');
  const lightboxScroller = lightbox.querySelector('.lightbox-scroller');
  const lightboxHint = lightbox.querySelector('.lightbox-hint');
  let lightboxOpener = null;

  const closeLightbox = () => {
    if (!lightbox.open || lightbox.classList.contains('closing')) return;
    if (reducedMotion) { lightbox.close(); return; }
    lightbox.classList.add('closing');
    setTimeout(() => { lightbox.classList.remove('closing'); lightbox.close(); }, 240);
  };

  projects.forEach(project => {
    const button = project.querySelector('.p-shot');
    button.addEventListener('click', () => {
      const img = button.querySelector('img');
      lightboxImg.src = img.src;   // the full-size original (the card may show a smaller srcset copy)
      lightboxImg.alt = img.alt;
      lightboxTitle.textContent = project.querySelector('.p-title').textContent;
      lightboxLink.href = project.querySelector('.p-link').href;   // the case study
      lightboxOpener = button;
      lightboxMedia.classList.remove('panned');
      lightbox.showModal();
      lightboxScroller.scrollLeft = 0;
      const showHint = () => { lightboxHint.hidden = lightboxScroller.scrollWidth <= lightboxScroller.clientWidth + 4; };
      showHint();
      lightboxImg.decode().then(showHint, () => {});
    });
  });
  lightbox.addEventListener('cancel', e => { e.preventDefault(); closeLightbox(); });
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });   // click on the backdrop
  lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  lightbox.addEventListener('close', () => { if (lightboxOpener) lightboxOpener.focus(); });
  lightboxScroller.addEventListener('scroll', () => lightboxMedia.classList.add('panned'), { passive: true });
}


// Desktop: a framed preview follows the cursor over the project list. The screenshots sit in a
// vertical reel that slides to the project you are on. Keyboard focus shows it beside the row.
const preview = document.querySelector('.preview');
if (preview && projects.length) {
  const desktopPreview = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)');
  // From 900 to 1100 px the tags and year sit under the description (see style.css), so the
  // card keeps clear of them as well.
  const narrowDesktop = matchMedia('(max-width: 1100px)');
  const tilt = preview.querySelector('.preview-tilt');
  const reel = preview.querySelector('.preview-reel');
  const previewName = preview.querySelector('.preview-name');
  reel.style.setProperty('--n', projects.length);

  const reelImages = projects.map(project => {
    const img = new Image(1200, 750);
    img.alt = '';
    img.decoding = 'async';
    img.dataset.src = project.querySelector('.p-shot img').getAttribute('src');
    return img;
  });
  let reelLoaded = false;
  const loadReel = () => {
    if (reelLoaded || !desktopPreview.matches) return;
    reelLoaded = true;
    reelImages.forEach(img => { img.src = img.dataset.src; reel.append(img); });
  };
  new IntersectionObserver((entries, observer) => {
    if (entries.some(entry => entry.isIntersecting)) { loadReel(); if (reelLoaded) observer.disconnect(); }
  }, { rootMargin: '600px 0px' }).observe(document.querySelector('.projects'));

  let mouseX = innerWidth / 2, mouseY = innerHeight / 2;
  let px = null, py = 0, angle = 0, fit = 1;
  let mode = null;          // 'pointer' or 'focus' while the preview is showing
  let placement = null;     // the last mode, kept while the card scales away so it does not drift
  let row = null;           // the project it belongs to
  let textRight = 0;        // right edge of that row's words
  let running = false, stopAt = 0, hideTimer = 0;
  const NAV_H = 76;         // keep clear of the fixed nav bar

  addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse') { mouseX = e.clientX; mouseY = e.clientY; }
  }, { passive: true });

  // Where the row's words end, so the card can sit beside them instead of on top of them:
  // the title (plus its hover shift), the description, the proof line and links under it,
  // and on narrow desktops the tags and year too.
  const measureRow = () => {
    const range = document.createRange();
    const right = el => {
      if (!el || el.hidden) return 0;
      range.selectNodeContents(el);
      return range.getBoundingClientRect().right;
    };
    const parts = [row.querySelector('.p-desc'), ...row.querySelectorAll('.p-more > *')];
    if (narrowDesktop.matches) parts.push(row.querySelector('.p-tags'), row.querySelector('.p-year'));
    textRight = Math.max(right(row.querySelector('.p-title')) + 16, ...parts.map(right));
  };
  addEventListener('resize', () => { if (row) measureRow(); });

  const previewTarget = () => {
    const w = preview.offsetWidth;
    const h = preview.offsetHeight;
    let x, y, scale = 1;
    if (placement === 'pointer' && !reducedMotion) {
      // Follows the cursor, but never covers the hovered project's words: it stays right of
      // them and on screen.
      x = clamp(mouseX + 36, textRight + 40, innerWidth - w - 24);
      y = mouseY - h / 2;
      preview.style.setProperty('--origin-x', `${clamp((mouseX - x) / w * 100, 0, 100).toFixed(0)}%`);
    } else {
      // Keyboard focus (or reduced motion): below the row, or above it, whichever has room.
      // If neither side fits the whole card, it shrinks so it never overlaps the focused row.
      const r = row.getBoundingClientRect();
      const below = innerHeight - r.bottom - 28;
      const above = r.top - NAV_H - 12;
      const useBelow = below >= h || (above < h && below >= above);
      scale = clamp((useBelow ? below : above) / h, 0.55, 1);
      x = innerWidth * 0.56 - w / 2;
      y = useBelow ? r.bottom + 12 : r.top - h * scale - 12;
      preview.style.setProperty('--origin-x', '50%');
    }
    if (scale !== fit) { fit = scale; preview.style.setProperty('--fit', fit.toFixed(3)); }
    return [x, clamp(y, NAV_H, innerHeight - h * fit - 16)];
  };

  const frame = () => {
    if (row) {
      const [tx, ty] = previewTarget();
      if (px === null || reducedMotion) { px = tx; py = ty; }
      const nextX = px + (tx - px) * 0.16;
      const vx = nextX - px;
      px = nextX;
      py += (ty - py) * 0.16;
      const wanted = reducedMotion ? 0 : Math.max(-7, Math.min(7, vx * 0.35));
      angle += (wanted - angle) * 0.12;
      preview.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
      tilt.style.transform = `rotate(${angle.toFixed(2)}deg)`;
    }
    if (mode || performance.now() < stopAt) requestAnimationFrame(frame);
    else running = false;
  };

  const showPreview = (index, how) => {
    if (!desktopPreview.matches) return;
    clearTimeout(hideTimer);
    loadReel();
    const project = projects[index];
    preview.style.setProperty('--accent', getComputedStyle(project).getPropertyValue('--accent'));
    previewName.textContent = project.querySelector('.p-title').textContent;
    if (!preview.classList.contains('show')) {
      // First appearance: start on the right screenshot and at the right spot, no sliding in.
      reel.style.transition = 'none';
      reel.style.setProperty('--i', index);
      void reel.offsetHeight;
      reel.style.transition = '';
      px = null;
      angle = 0;
    } else {
      reel.style.setProperty('--i', index);
    }
    mode = placement = how;
    row = project;
    measureRow();
    preview.classList.add('show');
    if (!running) { running = true; requestAnimationFrame(frame); }
  };
  const hidePreview = () => {
    preview.classList.remove('show');
    mode = null;
    stopAt = performance.now() + 700;   // keep following while it scales away
  };

  projects.forEach((project, index) => {
    const link = project.querySelector('.p-link');
    project.addEventListener('mouseenter', () => showPreview(index, 'pointer'));
    project.addEventListener('mouseleave', () => {
      if (mode === 'pointer') hideTimer = setTimeout(hidePreview, 80);   // a short grace period so moving between rows slides the reel
    });
    link.addEventListener('focus', () => { if (link.matches(':focus-visible')) showPreview(index, 'focus'); });
    link.addEventListener('blur', () => { if (mode === 'focus') hidePreview(); });
  });
  desktopPreview.addEventListener('change', () => { if (!desktopPreview.matches) hidePreview(); });
}


// ---- Magnetic buttons: the main calls to action lean a few pixels towards the cursor ----
// The pull is capped (6 px across, 5 px down) so a button never reaches its neighbour.
if (finePointer) {
  const magnets = [...document.querySelectorAll('[data-magnetic]')];
  const release = el => { el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); };
  magnets.forEach(el => {
    let rect = null;
    el.addEventListener('pointerenter', () => { rect = el.getBoundingClientRect(); });
    el.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || reducedMotion) return;
      rect = rect || el.getBoundingClientRect();
      const dx = clamp((e.clientX - rect.left - rect.width / 2) * 0.16, -6, 6);
      const dy = clamp((e.clientY - rect.top - rect.height / 2) * 0.3, -5, 5);
      el.style.setProperty('--mx', `${dx.toFixed(1)}px`);
      el.style.setProperty('--my', `${dy.toFixed(1)}px`);
    });
    el.addEventListener('pointerleave', () => { rect = null; release(el); });
  });
  motionListeners.push(() => { if (reducedMotion) magnets.forEach(release); });
}
