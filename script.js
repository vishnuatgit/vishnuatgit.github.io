// Portfolio interactions. All of it is polish: the content reads fine without it.

// EDIT: your time zone, shown next to "Based in"
const TIME_ZONE = 'Asia/Kolkata';

const root = document.documentElement;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;


// ---- Light / dark toggle (remembers your choice) ----
document.querySelector('.theme-toggle').addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (e) {}
});


// ---- Live local time and footer year ----
const clock = document.getElementById('local-time');
const timeFormat = new Intl.DateTimeFormat('en-IN', {
  hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TIME_ZONE, timeZoneName: 'short',
});
const updateClock = () => { clock.textContent = timeFormat.format(new Date()); };
updateClock();
setInterval(updateClock, 15000);

document.getElementById('year').textContent = new Date().getFullYear();


// ---- Nav: background after scrolling, highlight the current section ----
const nav = document.querySelector('.nav');
const navLinks = [...document.querySelectorAll('.nav-pill a')];

const onScroll = () => {
  nav.classList.toggle('scrolled', scrollY > 24);
  if (scrollY < innerHeight * 0.5) navLinks.forEach(a => a.classList.remove('active'));
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(a => a.classList.toggle('active', a.hash === '#' + entry.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });

navLinks.forEach(a => {
  const section = document.querySelector(a.hash);
  if (section) sectionObserver.observe(section);
});


// ---- Reveal sections as they scroll into view ----
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('in');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


// ---- Marquee: repeat the words until they fill the screen, then loop ----
const track = document.querySelector('.marquee-track');
const group = track.querySelector('.marquee-group');
const words = [...group.children];
for (let i = 0; i < 10 && group.scrollWidth < innerWidth; i++) {
  words.forEach(word => group.append(word.cloneNode(true)));
}
track.append(group.cloneNode(true));


// ---- Project screenshots (from each project's data-image) ----
const projects = document.querySelectorAll('.project');
projects.forEach(project => {
  const src = project.dataset.image;
  if (src) project.querySelector('.p-thumb').style.backgroundImage = `url("${src}")`;
});


// ---- Floating preview that follows the cursor over the project list ----
if (finePointer) {
  const preview = document.querySelector('.preview');
  const card = preview.querySelector('.preview-card');
  const ease = reducedMotion ? 1 : 0.14;
  let mouseX = innerWidth / 2, mouseY = innerHeight / 2;
  let x = mouseX, y = mouseY;

  addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true });

  projects.forEach(project => {
    project.addEventListener('mouseenter', () => {
      preview.style.setProperty('--accent', getComputedStyle(project).getPropertyValue('--accent'));
      card.style.backgroundImage = project.dataset.image ? `url("${project.dataset.image}")` : '';
      preview.classList.add('show');
    });
    project.addEventListener('mouseleave', () => preview.classList.remove('show'));
  });

  const follow = () => {
    x += (mouseX - x) * ease;
    y += (mouseY - y) * ease;
    preview.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(follow);
  };
  follow();
}
