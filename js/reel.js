// Slot-machine contact headline: "ship" and "something." sit in two reels that spin through other
// words and always land on the same line, "Let's ship something.". Without JavaScript, or with
// reduced motion, the sentence simply stays as written in the HTML.
(() => {
  const link = document.querySelector('.contact-mail');
  const text = link && link.querySelector('.cm-mask > span');
  if (!text || text.textContent.trim() !== "Let's ship something.") return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const REELS = [
    { words: ['talk', 'build', 'connect', 'cook'], final: 'ship', time: 2400 },
    { words: ['together', 'cool stuff', 'it'], final: 'something.', time: 3000 },   // lands ~600 ms later
  ];
  const EASE = 'cubic-bezier(.22, 1, .36, 1)';   // long, gentle ease-out with no overshoot
  const at = r => `translate3d(0, ${-r.last * 100 / (r.last + 1)}%, 0)`;   // the final word in the window

  // Each reel is a window the size of its final word; the strip of words scrolls up inside it.
  const build = ({ words, final }) => {
    const win = document.createElement('span');
    win.className = 'reel';
    const sizer = document.createElement('span');
    sizer.className = 'reel-sizer';
    sizer.textContent = final;
    const strip = document.createElement('span');
    strip.className = 'reel-strip';
    [...words, final].forEach(w => {   // one lap of the other words, then the final one
      const item = document.createElement('span');
      item.textContent = w;
      strip.append(item);
    });
    win.append(sizer, strip);
    return { win, strip, last: words.length };
  };

  const reels = REELS.map(build);
  const spoken = document.createElement('span');
  spoken.className = 'sr-only';
  spoken.textContent = "Let's ship something.";
  const shown = document.createElement('span');
  shown.setAttribute('aria-hidden', 'true');
  shown.append("Let's ", reels[0].win, ' ', reels[1].win);
  text.replaceChildren(spoken, shown);
  reels.forEach(r => { r.strip.style.transform = at(r); });

  let spinning = false, lastSpin = 0;
  const spin = () => {
    if (spinning) return;
    spinning = true;
    lastSpin = Date.now();
    link.classList.remove('jackpot');
    reels.forEach((r, i) => {
      r.strip.style.transition = 'none';
      r.strip.style.transform = 'translate3d(0, 0, 0)';
      r.strip.getBoundingClientRect();   // apply the jump before animating back down the strip
      r.strip.style.transition = `transform ${REELS[i].time}ms ${EASE}`;
      r.strip.style.transform = at(r);
    });
    setTimeout(() => {
      spinning = false;
      link.classList.add('jackpot');
      setTimeout(() => link.classList.remove('jackpot'), 1200);
    }, REELS[REELS.length - 1].time);
  };

  // Spin once when the headline comes into view; with a mouse, hovering spins it again.
  new IntersectionObserver((entries, observer) => {
    if (!entries.some(e => e.isIntersecting)) return;
    observer.disconnect();
    setTimeout(spin, 500);
  }, { threshold: 0.6 }).observe(link);
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    link.addEventListener('mouseenter', () => { if (Date.now() - lastSpin > REELS[REELS.length - 1].time + 1500) spin(); });
  }
})();
