// Hero 3D: a slowly turning pipeline network behind the headline. Service nodes are joined by
// thin wires, and small accent-coloured packets flow through them in one direction, like
// requests through a backend. It is decoration only: the hero reads the same without it.
//
// How it loads: script.js imports this file only on computers with a mouse and a screen at
// least 900 px wide (not with data saver, a slow connection or under 4 GB of memory), after the
// page has loaded and the browser is idle, and only once the hero is on screen. This file then
// checks for WebGL 2 and downloads three.js. If anything is missing or fails, it stops quietly
// and the hero looks exactly as it does without it.

// EDIT: the off switch. Set it to false to turn the 3D network off everywhere; three.js is then
// never downloaded and the hero shows only its glow and grain, as before.
const HERO_3D = true;

// three.js from jsDelivr, pinned to one exact version (0.185.1, published 1 July 2026). Later
// releases stopped shipping minified builds, so their three.module.min.js pulls in the
// full-size core, about twice the download.
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.min.js';

let stopCurrent = null;   // stops the running scene; null while none is running
let restartHooked = false;

export async function start(box) {
  if (!HERO_3D || stopCurrent || !box || !box.isConnected) return;

  // A page restored from the back/forward cache gets its network back (pagehide removed it).
  if (!restartHooked) {
    restartHooked = true;
    addEventListener('pageshow', e => { if (e.persisted) start(box); });
  }

  // Two tiers. Smaller machines (4 GB of memory or at most 4 cores) get a lighter version:
  // 30 fps, fewer packets, no antialiasing and a 1x canvas. The rest draw at up to 1.5x.
  const memory = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  const lite = memory <= 4 || cores <= 4;
  const tier = lite
    ? { fps: 30, dpr: 1, msaa: false, packets: 7 }
    : { fps: 0, dpr: 1.5, msaa: true, packets: 12 };

  // WebGL 2 (three.js needs it), checked before anything is downloaded. Software rendering is
  // turned away as well (failIfMajorPerformanceCaveat), because it would be slow.
  const canvas = document.createElement('canvas');
  let gl = null;
  try {
    gl = canvas.getContext('webgl2', {
      alpha: true, premultipliedAlpha: true, antialias: tier.msaa, depth: false, stencil: false,
      powerPreference: 'low-power', failIfMajorPerformanceCaveat: true,
    });
  } catch (e) { /* no WebGL: the hero stays as it is */ }
  if (!gl) { box.dataset.state = 'off'; return; }

  let THREE;
  try { THREE = await import(THREE_URL); } catch (e) { box.dataset.state = 'off'; return; }
  if (stopCurrent || !box.isConnected) return;

  try {
    stopCurrent = build(THREE, box, canvas, gl, tier);
  } catch (e) {
    canvas.remove();
    box.classList.remove('is-on');
    box.dataset.state = 'off';
    stopCurrent = null;
  }
}


function build(THREE, box, canvas, gl, tier) {
  const root = document.documentElement;
  const hero = box.parentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const rng = seeded(11);   // fixed seed: the network has the same shape on every visit

  // ---- The network: six stages from left to right, the path of a request ----
  // clients → gateway → services → queue → workers → stores (one of them is the model).
  const DOT = 0, BOX = 1, RING = 2;
  const STAGES = [
    { n: 4, r: 1.35, shape: DOT, size: 7 },    // clients
    { n: 1, r: 0, shape: BOX, size: 20 },      // gateway
    { n: 3, r: 1.2, shape: BOX, size: 15 },    // services
    { n: 1, r: 0, shape: BOX, size: 20 },      // queue
    { n: 4, r: 1.3, shape: BOX, size: 14 },    // workers
    { n: 2, r: 0.8, shape: RING, size: 17 },   // stores; the second is the model, ringed in the accent
  ];
  const SPAN = 4.2;   // world units from the first stage to the last
  const nodes = [];
  const stages = STAGES.map((stage, i) => {
    const x = -SPAN / 2 + (i * SPAN) / (STAGES.length - 1);
    const turn = rng() * Math.PI * 2;
    return Array.from({ length: stage.n }, (_, k) => {
      const a = turn + (k / stage.n) * Math.PI * 2 + (rng() - 0.5) * 0.3;
      const r = stage.r * (0.88 + rng() * 0.12);
      nodes.push({ x: x + (rng() - 0.5) * 0.14, y: Math.cos(a) * r, z: Math.sin(a) * r, shape: stage.shape, size: stage.size, accent: 0 });
      return nodes.length - 1;
    });
  });
  nodes[stages[5][1]].accent = 1;

  // Wires are S-curves (cubic Béziers whose handles point along the flow), like a node editor.
  const SEG = 24;
  const edges = [];
  const outgoing = nodes.map(() => []);
  const link = (from, to) => {
    const a = nodes[from], b = nodes[to];
    const h = (b.x - a.x) * 0.55;
    const pts = new Float32Array((SEG + 1) * 3);
    const cum = new Float32Array(SEG + 1);
    for (let i = 0; i <= SEG; i++) {
      const t = i / SEG, u = 1 - t;
      const w0 = u * u * u, w1 = 3 * u * u * t, w2 = 3 * u * t * t, w3 = t * t * t;
      pts[i * 3] = w0 * a.x + w1 * (a.x + h) + w2 * (b.x - h) + w3 * b.x;
      pts[i * 3 + 1] = (w0 + w1) * a.y + (w2 + w3) * b.y;
      pts[i * 3 + 2] = (w0 + w1) * a.z + (w2 + w3) * b.z;
      if (i) cum[i] = cum[i - 1] + Math.hypot(pts[i * 3] - pts[i * 3 - 3], pts[i * 3 + 1] - pts[i * 3 - 2], pts[i * 3 + 2] - pts[i * 3 - 1]);
    }
    outgoing[from].push(edges.length);
    edges.push({ to, pts, cum, len: cum[SEG] });
  };
  for (let i = 0; i < stages.length - 1; i++) {
    const A = stages[i], B = stages[i + 1];
    if (A.length === 1 || B.length === 1) A.forEach(a => B.forEach(b => link(a, b)));
    else A.forEach((a, k) => { link(a, B[k % B.length]); if (k === 1 || k === 2) link(a, B[(k + 1) % B.length]); });
  }

  // ---- Shared uniforms: colours, sizes and where the canvas must stay faint ----
  const KEEP = 8;   // rectangles around the hero's text (see measureText)
  const u = {
    uView: { value: new THREE.Vector2(1, 1) },
    uKeep: { value: Array.from({ length: KEEP }, () => new THREE.Vector4()) },
    uKeepK: { value: new Array(KEEP).fill(0) },
    uFeather: { value: 40 },
    uInk: { value: new THREE.Vector3() },
    uBg: { value: new THREE.Vector3() },
    uAccent: { value: new THREE.Vector3() },
    uLine: { value: 0.16 },
    uMark: { value: 0.6 },
    uFill: { value: 0.9 },
    uPR: { value: 1 },
    uScale: { value: 1 },
    uNear: { value: 8 },
    uFar: { value: 10 },
  };

  // Fades the canvas out at its left, top and bottom edges, and under the hero's text, so
  // nothing hard-edged shows and the small text keeps its contrast.
  const FADE = /* glsl */`
    uniform vec2 uView;
    uniform vec4 uKeep[${KEEP}];
    uniform float uKeepK[${KEEP}];
    uniform float uFeather;
    float screenFade() {
      vec2 p = gl_FragCoord.xy;
      vec2 uv = p / uView;
      float f = smoothstep(0.0, 0.32, uv.x) * smoothstep(0.0, 0.16, uv.y) * (1.0 - smoothstep(0.86, 1.0, uv.y));
      for (int i = 0; i < ${KEEP}; i++) {
        vec2 d = max(uKeep[i].xy - p, p - uKeep[i].zw);
        f *= 1.0 - uKeepK[i] * (1.0 - smoothstep(0.0, uFeather, max(d.x, d.y)));
      }
      return f;
    }`;
  const DEPTH = /* glsl */`
    uniform float uNear;
    uniform float uFar;
    float depthFade(vec4 mv) { return mix(1.0, 0.3, smoothstep(uNear, uFar, -mv.z)); }`;

  const material = (vertexShader, fragmentShader) => new THREE.ShaderMaterial({
    uniforms: u, vertexShader, fragmentShader,
    transparent: true, depthTest: false, depthWrite: false,
  });

  // Wires
  const linePos = new Float32Array(edges.length * SEG * 6);
  edges.forEach((e, i) => {
    for (let s = 0; s < SEG; s++) {
      linePos.set(e.pts.subarray(s * 3, s * 3 + 6), (i * SEG + s) * 6);
    }
  });
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  const lineMat = material(/* glsl */`
    ${DEPTH}
    varying float vFade;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vFade = depthFade(mv);
      gl_Position = projectionMatrix * mv;
    }`, /* glsl */`
    ${FADE}
    uniform vec3 uInk;
    uniform float uLine;
    varying float vFade;
    void main() { gl_FragColor = vec4(uInk, uLine * vFade * screenFade()); }`);
  const wires = new THREE.LineSegments(lineGeo, lineMat);

  // Nodes: one point sprite each, drawn as a dot, a rounded box or a ring
  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nodes.flatMap(n => [n.x, n.y, n.z])), 3));
  nodeGeo.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(nodes.map(n => n.size)), 1));
  nodeGeo.setAttribute('aShape', new THREE.BufferAttribute(new Float32Array(nodes.map(n => n.shape)), 1));
  nodeGeo.setAttribute('aAccent', new THREE.BufferAttribute(new Float32Array(nodes.map(n => n.accent)), 1));
  const SPRITE_VS = /* glsl */`
    ${DEPTH}
    uniform float uScale;
    uniform float uPR;
    attribute float aSize;
    varying float vFade;
    varying float vSize;
    void sprite() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vFade = depthFade(mv);
      vSize = aSize * uScale * uPR / -mv.z + 2.0 * uPR;
      gl_PointSize = vSize;
      gl_Position = projectionMatrix * mv;
    }`;
  const nodeMat = material(/* glsl */`
    ${SPRITE_VS}
    attribute float aShape;
    attribute float aAccent;
    varying float vShape;
    varying float vAccent;
    void main() { sprite(); vShape = aShape; vAccent = aAccent; }`, /* glsl */`
    ${FADE}
    uniform vec3 uInk;
    uniform vec3 uBg;
    uniform vec3 uAccent;
    uniform float uMark;
    uniform float uFill;
    uniform float uPR;
    varying float vFade;
    varying float vSize;
    varying float vShape;
    varying float vAccent;
    float roundBox(vec2 p, float b, float r) {
      vec2 q = abs(p) - vec2(b - r);
      return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
    }
    void main() {
      vec2 p = (gl_PointCoord - 0.5) * vSize;   // device pixels from the centre
      float r = 0.5 * vSize - uPR;
      float aa = 0.75 * uPR;
      vec3 col;
      float a;
      if (vShape < 0.5) {
        col = uInk;
        a = (1.0 - smoothstep(-aa, aa, length(p) - r)) * uMark * 0.9;
      } else {
        float d = vShape < 1.5 ? roundBox(p, r, r * 0.36) : length(p) - r;
        float sw = 1.15 * uPR;
        float fill = (1.0 - smoothstep(-aa, aa, d)) * uFill;
        float stroke = 1.0 - smoothstep(0.5 * sw - aa, 0.5 * sw + aa, abs(d + 0.5 * sw));
        float core = 1.0 - smoothstep(-aa, aa, length(p) - max(r * 0.26, 1.2 * uPR));
        float m = max(stroke, core * 0.7) * uMark;
        vec3 ink = mix(uInk, uAccent, vAccent);
        a = m + fill * (1.0 - m);
        col = a > 0.0 ? (ink * m + uBg * fill * (1.0 - m)) / a : uBg;
      }
      gl_FragColor = vec4(col, a * vFade * screenFade());
    }`);
  const nodePoints = new THREE.Points(nodeGeo, nodeMat);

  // Packets: each one rides a whole path from a client to a store, with a short fading trail
  const TRAIL = 8, GAP = 0.028, SPEED = 0.5;
  const count = tier.packets * TRAIL;
  const pktPos = new Float32Array(count * 3);
  const pktAlpha = new Float32Array(count);
  const pktSize = new Float32Array(count);
  for (let i = 0; i < count; i++) pktSize[i] = 12 * (1 - (i % TRAIL) / TRAIL * 0.55);
  const pktGeo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(pktPos, 3).setUsage(THREE.DynamicDrawUsage);
  const alphaAttr = new THREE.BufferAttribute(pktAlpha, 1).setUsage(THREE.DynamicDrawUsage);
  pktGeo.setAttribute('position', posAttr);
  pktGeo.setAttribute('aAlpha', alphaAttr);
  pktGeo.setAttribute('aSize', new THREE.BufferAttribute(pktSize, 1));
  const pktMat = material(/* glsl */`
    ${SPRITE_VS}
    attribute float aAlpha;
    varying float vAlpha;
    void main() { sprite(); vAlpha = aAlpha; }`, /* glsl */`
    ${FADE}
    uniform vec3 uAccent;
    uniform float uPR;
    varying float vFade;
    varying float vSize;
    varying float vAlpha;
    void main() {
      vec2 p = (gl_PointCoord - 0.5) * vSize;
      float r = 0.5 * vSize - uPR;
      float core = 1.0 - smoothstep(-0.75 * uPR, 0.75 * uPR, length(p) - r * 0.42);
      float glow = exp(-dot(p, p) / (r * r * 0.32)) * 0.4;
      float a = max(core, glow) * vAlpha * vFade * screenFade();
      if (a < 0.003) discard;
      gl_FragColor = vec4(uAccent, a);
    }`);
  const packetPoints = new THREE.Points(pktGeo, pktMat);
  packetPoints.frustumCulled = false;   // its bounds change every frame

  const newPath = () => {
    let n = stages[0][Math.floor(rng() * stages[0].length)];
    const list = [];
    let total = 0;
    while (outgoing[n].length) {
      const e = edges[outgoing[n][Math.floor(rng() * outgoing[n].length)]];
      list.push(e);
      total += e.len;
      n = e.to;
    }
    return { list, total };
  };
  const pointOnPath = (path, s, out, o) => {
    let i = 0;
    while (i < path.list.length - 1 && s > path.list[i].len) { s -= path.list[i].len; i++; }
    const e = path.list[i];
    let j = 1;
    while (j < SEG && e.cum[j] < s) j++;
    const t = Math.min(1, Math.max(0, (s - e.cum[j - 1]) / (e.cum[j] - e.cum[j - 1] || 1)));
    for (let c = 0; c < 3; c++) out[o + c] = e.pts[(j - 1) * 3 + c] + (e.pts[j * 3 + c] - e.pts[(j - 1) * 3 + c]) * t;
  };
  // Spread out along their paths from the start, so even the first (or only) frame shows traffic.
  const packets = Array.from({ length: tier.packets }, (_, i) => {
    const path = newPath();
    return { path, s: path.total * ((i + 0.5) / tier.packets) * 0.9 + 0.2, speed: SPEED * (0.85 + rng() * 0.3) };
  });
  const movePackets = dt => {
    packets.forEach((pk, i) => {
      pk.s += pk.speed * dt;
      if (pk.s - GAP * TRAIL > pk.path.total) {
        pk.path = newPath();
        pk.s = -rng() * 1.2;   // a short, random pause before the next request
      }
      for (let k = 0; k < TRAIL; k++) {
        const s = pk.s - k * GAP;
        const idx = i * TRAIL + k;
        if (s < 0 || s > pk.path.total) { pktAlpha[idx] = 0; continue; }
        pointOnPath(pk.path, s, pktPos, idx * 3);
        const ends = Math.min(1, s / 0.3, (pk.path.total - s) / 0.3);
        pktAlpha[idx] = ends * Math.pow(1 - k / TRAIL, 1.7);
      }
    });
    posAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
  };

  // ---- Scene ----
  const renderer = new THREE.WebGLRenderer({ canvas, context: gl, alpha: true, premultipliedAlpha: true, antialias: tier.msaa });
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const FOV = 38, DIST = 7;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 40);
  camera.position.set(0, 0, DIST);
  const lean = new THREE.Group();   // the fixed viewing angle plus the lean towards the cursor
  const spin = new THREE.Group();   // the slow turn around the flow axis
  wires.renderOrder = 0;
  packetPoints.renderOrder = 1;     // packets pass under the boxes, as if a service handles them
  nodePoints.renderOrder = 2;
  spin.add(wires, packetPoints, nodePoints);
  lean.add(spin);
  scene.add(lean);
  const YAW = 0.5, PITCH = 0.2;
  lean.rotation.set(PITCH, YAW, 0);
  spin.rotation.x = 0.6;

  canvas.setAttribute('aria-hidden', 'true');
  box.append(canvas);

  // ---- Size and placement ----
  // The network sits right of centre, about 40% of the hero wide, between the facts at the top
  // and the intro at the bottom.
  let pixelRatio = 1;
  const resize = () => {
    const w = box.clientWidth, h = box.clientHeight;
    if (!w || !h) return;
    pixelRatio = Math.min(devicePixelRatio || 1, tier.dpr);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const unit = h / 2 / (DIST * Math.tan((FOV / 2) * Math.PI / 180));   // px per world unit at z = 0
    const heroW = hero.clientWidth, heroH = hero.clientHeight;
    const wide = Math.min(heroW * 0.43, heroH * 0.86);                      // network width in px
    const scale = wide / ((SPAN + 1) * unit);
    lean.scale.setScalar(scale);
    const cx = heroW * 0.77 - box.offsetLeft, cy = heroH * 0.5 - box.offsetTop;
    lean.position.set((cx - w / 2) / unit, -(cy - h / 2) / unit, 0);
    u.uView.value.set(w * pixelRatio, h * pixelRatio);
    u.uPR.value = pixelRatio;
    u.uScale.value = DIST * (wide / 560);    // sprite sizes above are in px for a 560 px network
    u.uNear.value = DIST - scale * 1.2;
    u.uFar.value = DIST + scale * 1.2;
    u.uFeather.value = 44 * pixelRatio;
    measureText();
  };

  // Rectangles around the hero's text, in canvas pixels. The canvas fades out fully under the
  // small text and the grey third line, and to 40% under the two big black lines (the text
  // stays far above contrast minimums there). Layout offsets are used, so the words' entrance
  // animation does not throw them off; each box grows a little, and the headline's boxes by a
  // quarter of their height at the bottom, for descenders (g, p, y).
  const measureText = () => {
    const at = el => {
      let x = 0, y = 0;
      for (let e = el; e && e !== hero; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; }
      return [x, y, x + el.offsetWidth, y + el.offsetHeight];
    };
    const groups = [
      ...[...hero.querySelectorAll('.hero-meta p')].map(p => [[p], 1]),
      [[hero.querySelector('.hero-intro')], 1],
      [[hero.querySelector('.hero-foot .actions')], 1],
      ...[...hero.querySelectorAll('.hero-title .line')].map(line => [[...line.querySelectorAll('.w')], line.classList.contains('soft') ? 1 : 0.6]),
    ].slice(0, KEEP);
    const bx = box.offsetLeft, by = box.offsetTop, bh = box.clientHeight;
    u.uKeepK.value.fill(0);
    groups.forEach(([els, k], i) => {
      const r = els.filter(Boolean).map(at).reduce((a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])], [Infinity, Infinity, -Infinity, -Infinity]);
      if (!isFinite(r[0])) return;
      const pad = 6, descent = els[0].classList.contains('w') ? (r[3] - r[1]) * 0.25 : 0;
      r[0] -= pad; r[1] -= pad; r[2] += pad; r[3] += pad + descent;
      u.uKeep.value[i].set((r[0] - bx) * pixelRatio, (bh - (r[3] - by)) * pixelRatio, (r[2] - bx) * pixelRatio, (bh - (r[1] - by)) * pixelRatio);
      u.uKeepK.value[i] = k;
    });
  };

  // ---- Colours: the theme's ink, background and accent, read from the CSS variables ----
  const probe = document.createElement('canvas').getContext('2d');
  const rgb = (css, fallback) => {
    probe.fillStyle = fallback;
    probe.fillStyle = css.trim() || fallback;
    const v = probe.fillStyle;   // "#rrggbb", or "rgba(r, g, b, a)" for see-through colours
    const n = v[0] === '#' ? [1, 3, 5].map(i => parseInt(v.slice(i, i + 2), 16)) : v.match(/[\d.]+/g).slice(0, 3).map(Number);
    return n.map(c => c / 255);
  };
  const LOOK = { light: { line: 0.3, mark: 0.75, fill: 0.88 }, dark: { line: 0.24, mark: 0.66, fill: 0.9 } };
  const want = { ink: [0, 0, 0], bg: [1, 1, 1], accent: [1, 0.35, 0.12], ...LOOK.light };
  const have = { ink: [0, 0, 0], bg: [1, 1, 1], accent: [1, 0.35, 0.12], ...LOOK.light };
  const readTheme = () => {
    const css = getComputedStyle(root);
    want.ink = rgb(css.getPropertyValue('--fg'), '#111110');
    want.bg = rgb(css.getPropertyValue('--bg'), '#f4f3ef');
    want.accent = rgb(css.getPropertyValue('--accent'), '#ff5a1f');
    Object.assign(want, root.dataset.theme === 'dark' ? LOOK.dark : LOOK.light);
  };
  // Eases towards the theme's colours (k = 1 jumps straight there).
  const applyTheme = k => {
    for (const key of ['ink', 'bg', 'accent']) for (let c = 0; c < 3; c++) have[key][c] += (want[key][c] - have[key][c]) * k;
    for (const key of ['line', 'mark', 'fill']) have[key] += (want[key] - have[key]) * k;
    u.uInk.value.fromArray(have.ink);
    u.uBg.value.fromArray(have.bg);
    u.uAccent.value.fromArray(have.accent);
    u.uLine.value = have.line;
    u.uMark.value = have.mark;
    u.uFill.value = have.fill;
  };

  // ---- Motion ----
  let aimX = 0, aimY = 0, leanX = 0, leanY = 0;
  const onPointer = e => {
    if (e.pointerType !== 'mouse') return;
    aimX = (e.clientX / innerWidth) * 2 - 1;
    aimY = (e.clientY / innerHeight) * 2 - 1;
  };
  const onLeave = e => { if (!e.relatedTarget) aimX = aimY = 0; };

  const step = dt => {
    const ease = k => 1 - Math.exp(-dt * k);
    spin.rotation.x += dt * 0.07;              // one turn every 90 seconds
    leanX += (aimX - leanX) * ease(2.2);
    leanY += (aimY - leanY) * ease(2.2);
    lean.rotation.y = YAW + leanX * 0.2;       // leans gently towards the cursor
    lean.rotation.x = PITCH + leanY * 0.12;
    movePackets(dt);
    applyTheme(ease(9));
  };
  const draw = () => renderer.render(scene, camera);

  // One loop, running only while the canvas is on screen, the tab is visible and motion is allowed.
  let visible = false, running = false, rafId = 0, last = 0;
  let slowFrames = 0, sampled = 0;
  const frame = now => {
    rafId = requestAnimationFrame(frame);
    if (!last) last = now - 1000 / 60;
    const gap = now - last;
    if (tier.fps && gap < 1000 / tier.fps - 2) return;   // the light tier draws 30 times a second at most
    last = now;
    // If this machine cannot keep up (most of the first 90 frames late), drop to the light tier.
    if (!tier.fps && sampled < 90) {
      sampled++;
      if (gap > 25) slowFrames++;
      if (sampled === 90 && slowFrames > 45) { tier.fps = 30; tier.dpr = 1; resize(); }
    }
    step(Math.min(gap / 1000, 0.05));
    draw();
  };
  let ready = false;   // true once the shaders are compiled
  const update = () => {
    const run = ready && visible && !document.hidden && !reduce.matches;
    if (run && !running) { running = true; last = 0; rafId = requestAnimationFrame(frame); }
    if (!run && running) { running = false; cancelAnimationFrame(rafId); }
    box.dataset.state = running ? 'running' : reduce.matches ? 'still' : 'paused';
  };
  // With reduced motion there is one still frame, redrawn only when the size or theme changes.
  const still = () => { if (ready && !running) { applyTheme(1); draw(); } };

  const onMotion = () => { if (reduce.matches) { aimX = aimY = leanX = leanY = 0; step(0); } update(); still(); };
  const onVisibility = () => update();
  const sizeObserver = new ResizeObserver(() => { resize(); still(); });
  const viewObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
  const themeObserver = new MutationObserver(() => { readTheme(); if (!running) still(); });

  const stop = () => {
    running = false;
    cancelAnimationFrame(rafId);
    sizeObserver.disconnect();
    viewObserver.disconnect();
    themeObserver.disconnect();
    reduce.removeEventListener('change', onMotion);
    document.removeEventListener('visibilitychange', onVisibility);
    removeEventListener('pointermove', onPointer);
    document.removeEventListener('mouseout', onLeave);
    removeEventListener('pagehide', stop);
    canvas.removeEventListener('webglcontextlost', stop);
    [lineGeo, nodeGeo, pktGeo].forEach(g => g.dispose());
    [lineMat, nodeMat, pktMat].forEach(m => m.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    box.classList.remove('is-on');
    box.dataset.state = 'off';
    stopCurrent = null;
  };

  // The shaders compile in the background (no long task on the main thread); then the first
  // frame is drawn and fades in (the CSS transition does the fade).
  readTheme();
  applyTheme(1);
  resize();
  step(0);
  renderer.compileAsync(scene, camera).then(() => {
    if (stopCurrent !== stop) return;
    ready = true;
    draw();
    requestAnimationFrame(() => box.classList.add('is-on'));
    update();
  }, stop);

  reduce.addEventListener('change', onMotion);
  document.addEventListener('visibilitychange', onVisibility);
  addEventListener('pointermove', onPointer, { passive: true });
  document.addEventListener('mouseout', onLeave);
  addEventListener('pagehide', stop);
  canvas.addEventListener('webglcontextlost', stop);   // the GPU reset: leave the hero as it was
  sizeObserver.observe(box);
  viewObserver.observe(box);
  themeObserver.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  if (document.fonts) document.fonts.ready.then(() => { if (stopCurrent === stop) { measureText(); still(); } });
  update();

  return stop;
}

// A small seeded random number generator (mulberry32).
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
