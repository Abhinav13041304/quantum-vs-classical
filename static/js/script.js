/* =====================================================
   script.js — Quantum vs Classical Benchmark
   ===================================================== */

const API = 'http://127.0.0.1:5000';

/* ── State ─────────────────────────────────────────── */
let benchmarkChart = null;
let classicalVizTimer = null;
let quantumVizTimer  = null;
let isRunning = false;

/* ── DOM refs ───────────────────────────────────────── */
const sizeSlider      = document.getElementById('size-slider');
const sizeDisplay     = document.getElementById('size-display');
const sliderFill      = document.getElementById('slider-fill');
const multiToggle     = document.getElementById('multi-toggle');
const runBtn          = document.getElementById('run-btn');
const runLabel        = document.getElementById('run-label');
const loaderSection   = document.getElementById('loader-section');
const resultsSection  = document.getElementById('results-section');
const classicalTime   = document.getElementById('classical-time');
const quantumTime     = document.getElementById('quantum-time');
const classicalBadge  = document.getElementById('classical-badge');
const quantumBadge    = document.getElementById('quantum-badge');
const speedupSection  = document.getElementById('speedup-section');
const speedupValue    = document.getElementById('speedup-value');
const speedupFill     = document.getElementById('speedup-fill');
const speedupNote     = document.getElementById('speedup-note');
const resultMeta      = document.getElementById('result-meta');
const chartNote       = document.getElementById('chart-note');
const loaderText      = document.getElementById('loader-text');

/* ── Particle Background ────────────────────────────── */
(function initParticles() {
  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');
  let   W, H, particles;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() { this.reset(true); }
    reset(init) {
      this.x  = Math.random() * W;
      this.y  = init ? Math.random() * H : H + 10;
      this.r  = Math.random() * 1.2 + 0.3;
      this.vy = -(Math.random() * 0.3 + 0.1);
      this.vx = (Math.random() - 0.5) * 0.15;
      this.a  = Math.random() * 0.5 + 0.2;
      this.hue = Math.random() < 0.6 ? 240 : (Math.random() < 0.5 ? 190 : 270);
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.y < -10) this.reset(false);
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 80%, 70%, ${this.a})`;
      ctx.fill();
    }
  }

  function init() {
    resize();
    particles = Array.from({ length: 120 }, () => new Particle());
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    // subtle gradient overlay
    const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)*0.7);
    grad.addColorStop(0, 'rgba(30, 10, 60, 0.04)');
    grad.addColorStop(1, 'rgba(5,  8, 16, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize);
  init();
  loop();
})();

/* ── Slider ──────────────────────────────────────────── */
sizeSlider.addEventListener('input', () => {
  const val = parseInt(sizeSlider.value);
  sizeDisplay.textContent = val.toLocaleString();
  const pct = ((val - 100) / (50000 - 100)) * 100;
  sliderFill.style.width = pct + '%';
});
// init fill
sizeSlider.dispatchEvent(new Event('input'));

/* ── Loader steps sequencer ─────────────────────────── */
const loaderSteps = ['ls1','ls2','ls3','ls4'];
const loaderMessages = [
  'Initialising quantum circuit…',
  'Applying Hadamard superposition…',
  'Running Grover oracle iterations…',
  'Measuring qubits & computing results…',
];
let loaderStepTimer = null;

function startLoaderSteps() {
  loaderSteps.forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('active','done');
  });
  let i = 0;
  const tick = () => {
    if (i > 0) {
      document.getElementById(loaderSteps[i-1]).classList.remove('active');
      document.getElementById(loaderSteps[i-1]).classList.add('done');
    }
    if (i < loaderSteps.length) {
      document.getElementById(loaderSteps[i]).classList.add('active');
      loaderText.textContent = loaderMessages[i];
      i++;
      loaderStepTimer = setTimeout(tick, 1400);
    }
  };
  tick();
}

function stopLoaderSteps() {
  clearTimeout(loaderStepTimer);
  loaderSteps.forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('active');
    el.classList.add('done');
  });
}

/* ── Main benchmark runner ──────────────────────────── */
async function runBenchmark() {
  if (isRunning) return;
  isRunning = true;

  const isMulti = multiToggle.checked;
  const size    = parseInt(sizeSlider.value);

  // UI: loading
  runBtn.disabled = true;
  runLabel.textContent = 'Running…';
  resultsSection.classList.add('hidden');
  loaderSection.classList.remove('hidden');
  startLoaderSteps();

  // Scroll to loader
  loaderSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

  try {
    if (isMulti) {
      await runMultiBenchmark();
    } else {
      await runSingleBenchmark(size);
    }
  } catch (err) {
    stopLoaderSteps();
    loaderSection.classList.add('hidden');
    alert('Error connecting to backend: ' + err.message + '\n\nMake sure Flask is running on port 5000.');
  } finally {
    isRunning = false;
    runBtn.disabled = false;
    runLabel.textContent = isMulti ? 'Run Multi-Benchmark' : 'Run Benchmark';
  }
}

/* ── Single run ─────────────────────────────────────── */
async function runSingleBenchmark(size) {
  const res  = await fetch(`${API}/run?size=${size}`);
  const data = await res.json();

  stopLoaderSteps();
  loaderSection.classList.add('hidden');

  if (!data.success) throw new Error(data.error);

  displayResults(data);
  updateSingleChart(data);

  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── Multi run ──────────────────────────────────────── */
async function runMultiBenchmark() {
  const res  = await fetch(`${API}/multi-run`);
  const data = await res.json();

  stopLoaderSteps();
  loaderSection.classList.add('hidden');

  if (!data.success) throw new Error(data.error);

  // Show last result as card data
  const last = data.results[data.results.length - 1];
  displayResults({ ...last, speedup: last.classical_time / last.quantum_time });

  updateMultiChart(data.results);

  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── Display result cards ───────────────────────────── */
function displayResults(data) {
  const ct  = parseFloat(data.classical_time);
  const qt  = parseFloat(data.quantum_time);
  const tqt = parseFloat(data.theoretical_quantum_time ?? (ct / Math.sqrt(data.size ?? 10000)));
  const tsp = parseFloat(data.theoretical_speedup ?? Math.sqrt(data.size ?? 10000));

  // Classical & simulator cards
  animateNumber(classicalTime, ct, 'ms');
  animateNumber(quantumTime,   qt, 'ms');

  // Theory card
  const theoryTimeEl  = document.getElementById('theory-time');
  const theoryBadgeEl = document.getElementById('theory-badge');
  if (theoryTimeEl)  animateNumber(theoryTimeEl, tqt, 'ms');
  if (theoryBadgeEl) {
    theoryBadgeEl.textContent = `⚡ ${tsp.toFixed(0)}× faster than classical`;
  }

  // Simulator card — always mark as overhead, not a "winner/loser"
  classicalBadge.className = 'card-badge badge-slower';
  classicalBadge.textContent = `O(n) — ${parseInt(data.size).toLocaleString()} ops`;

  quantumBadge.style.cssText =
    'background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.3);' +
    'color:#818cf8;padding:4px 14px;border-radius:100px;font-size:0.7rem;' +
    'font-weight:700;letter-spacing:0.05em;text-transform:uppercase';
  quantumBadge.textContent = '🖥 Simulator overhead';

  // Speedup bar — theoretical (√n)
  speedupValue.textContent = tsp.toFixed(1) + '×';
  const fillPct = Math.min((tsp / 225) * 100, 100); // √50000 ≈ 224
  setTimeout(() => { speedupFill.style.width = fillPct + '%'; }, 100);

  speedupNote.textContent =
    `On real quantum hardware, Grover's would need only ~${tsp.toFixed(0)} operations ` +
    `vs ${parseInt(data.size).toLocaleString()} for classical — a ${tsp.toFixed(0)}× speedup. ` +
    `The Aer simulator shows higher time due to classical CPU simulation overhead (expected).`;

  resultMeta.textContent = data.size
    ? `Array size: ${parseInt(data.size).toLocaleString()} · Qubits: ${data.n_qubits ?? '—'} · Classical O(n) vs Quantum O(√n)`
    : '';

  chartNote.textContent = '';
}


/* ── Number animation ───────────────────────────────── */
function animateNumber(el, target, suffix) {
  const duration = 800;
  const start    = performance.now();
  const from     = parseFloat(el.textContent) || 0;

  function tick(now) {
    const t   = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    const val  = from + (target - from) * ease;
    el.textContent = val.toFixed(2);
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = target.toFixed(2);
  }

  requestAnimationFrame(tick);
}

/* ── Charts ─────────────────────────────────────────── */
Chart.defaults.color = '#94a3c8';
Chart.defaults.borderColor = 'rgba(99,130,255,0.1)';
Chart.defaults.font.family = "'Inter', system-ui, sans-serif";

function createChart(labels, classicalData, quantumData, type = 'bar') {
  if (benchmarkChart) benchmarkChart.destroy();

  const ctx = document.getElementById('benchmark-chart').getContext('2d');

  benchmarkChart = new Chart(ctx, {
    type,
    data: {
      labels,
      datasets: [
        {
          label: 'Classical O(n)',
          data: classicalData,
          backgroundColor: type === 'bar'
            ? 'rgba(251,191,36,0.2)'
            : 'transparent',
          borderColor: '#fbbf24',
          borderWidth: 2,
          pointBackgroundColor: '#fbbf24',
          pointRadius: 5,
          tension: 0.4,
        },
        {
          label: "Grover's O(√n)",
          data: quantumData,
          backgroundColor: type === 'bar'
            ? 'rgba(99,102,241,0.2)'
            : 'transparent',
          borderColor: '#6366f1',
          borderWidth: 2,
          pointBackgroundColor: '#6366f1',
          pointRadius: 5,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: { duration: 1000, easing: 'easeOutQuart' },
      plugins: {
        legend: {
          labels: {
            color: '#94a3c8',
            boxWidth: 12,
            padding: 20,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(8,13,26,0.95)',
          borderColor: 'rgba(99,130,255,0.3)',
          borderWidth: 1,
          titleColor: '#f0f4ff',
          bodyColor: '#94a3c8',
          padding: 12,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} ms`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#5567a0' },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#5567a0', callback: v => v + ' ms' },
        },
      },
    },
  });
}

function updateSingleChart(data) {
  createChart(
    [`n=${parseInt(data.size).toLocaleString()}`],
    [data.classical_time],
    [data.quantum_time],
    'bar'
  );
}

function updateMultiChart(results) {
  const labels  = results.map(r => r.size.toLocaleString());
  const cTimes  = results.map(r => r.classical_time);
  const qTimes  = results.map(r => r.quantum_time);
  createChart(labels, cTimes, qTimes, 'line');
}

/* ── Visualizer ─────────────────────────────────────── */
const VIZ_CELLS   = 60;
const VIZ_QSTATES = 16;

function selectVizTab(type, btn) {
  document.querySelectorAll('.viz-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  document.querySelectorAll('.viz-panel').forEach(p => p.classList.add('hidden'));
  document.getElementById('viz-' + type).classList.remove('hidden');
}

/* Classical viz */
function buildClassicalGrid() {
  const grid = document.getElementById('classical-grid');
  grid.innerHTML = '';
  const targetIdx = Math.floor(Math.random() * VIZ_CELLS);
  grid.dataset.target = targetIdx;

  for (let i = 0; i < VIZ_CELLS; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.textContent = i;
    cell.id = `cell-${i}`;
    grid.appendChild(cell);
  }
}

function playClassicalViz() {
  if (classicalVizTimer) { clearTimeout(classicalVizTimer); classicalVizTimer = null; }
  buildClassicalGrid();

  const targetIdx = parseInt(document.getElementById('classical-grid').dataset.target);
  let i = 0;

  function step() {
    if (i > 0) {
      const prev = document.getElementById(`cell-${i-1}`);
      if (prev) prev.classList.add('visited');
      if (prev) prev.classList.remove('scanning');
    }

    if (i >= VIZ_CELLS) return;

    const cell = document.getElementById(`cell-${i}`);
    if (!cell) return;

    if (i === targetIdx) {
      cell.classList.add('found');
      return; // stop
    }
    cell.classList.add('scanning');
    i++;
    classicalVizTimer = setTimeout(step, 90);
  }

  step();
}

/* Quantum viz */
function buildQuantumGrid() {
  const grid = document.getElementById('quantum-grid');
  grid.innerHTML = '';
  for (let i = 0; i < VIZ_QSTATES; i++) {
    const s = document.createElement('div');
    s.className = 'qstate';
    s.textContent = `|${i.toString(2).padStart(4,'0')}⟩`;
    s.id = `qs-${i}`;
    grid.appendChild(s);
  }
}

function playQuantumViz() {
  if (quantumVizTimer) { clearTimeout(quantumVizTimer); quantumVizTimer = null; }
  buildQuantumGrid();

  const targetIdx = Math.floor(Math.random() * VIZ_QSTATES);
  const phaseLabel = document.getElementById('q-phase-label');
  const steps = [];

  // Phase 1: superposition — all states glow
  steps.push(() => {
    phaseLabel.textContent = 'Phase 1/4: Superposition — all states equally probable';
    for (let i = 0; i < VIZ_QSTATES; i++) {
      const el = document.getElementById(`qs-${i}`);
      el.className = 'qstate superposition';
    }
  });

  // Phase 2: oracle marks target
  steps.push(() => {
    phaseLabel.textContent = 'Phase 2/4: Oracle marks the target state with phase kick';
    const el = document.getElementById(`qs-${targetIdx}`);
    el.className = 'qstate amplified';
  });

  // Phase 3: amplitude amplification
  steps.push(() => {
    phaseLabel.textContent = 'Phase 3/4: Diffusion — amplifying target amplitude';
    for (let i = 0; i < VIZ_QSTATES; i++) {
      const el = document.getElementById(`qs-${i}`);
      if (i === targetIdx) {
        el.className = 'qstate amplified';
        el.style.width = '52px'; el.style.height = '52px';
      } else {
        el.className = 'qstate collapsed';
      }
    }
  });

  // Phase 4: measurement
  steps.push(() => {
    phaseLabel.textContent = `Phase 4/4: Measurement — state |${targetIdx.toString(2).padStart(4,'0')}⟩ collapses ✓`;
    const el = document.getElementById(`qs-${targetIdx}`);
    el.className = 'qstate measured';
    el.style.width = ''; el.style.height = '';
  });

  let si = 0;
  function runStep() {
    if (si < steps.length) {
      steps[si++]();
      quantumVizTimer = setTimeout(runStep, 1800);
    }
  }
  runStep();
}

/* ── Init visualizer on page load ───────────────────── */
buildClassicalGrid();
buildQuantumGrid();

/* ── Reveal on scroll ───────────────────────────────── */
const revealObserver = new IntersectionObserver(
  entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
  { threshold: 0.12 }
);
document.querySelectorAll('.section').forEach(el => {
  el.classList.add('reveal');
  revealObserver.observe(el);
});

/* ── Multi-toggle label update ──────────────────────── */
multiToggle.addEventListener('change', () => {
  runLabel.textContent = multiToggle.checked ? 'Run Multi-Benchmark' : 'Run Benchmark';
});