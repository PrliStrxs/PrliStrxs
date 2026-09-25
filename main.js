/**
 * PRLISTRXS // CYBER CORE 3D ENGINE
 * Interactive Three.js WebGL particles, holographic core & cyberdeck interface.
 */

const THEME_COLORS = {
  cyan: { primary: 0x00f0ff, secondary: 0xff007f, hex: '#00f0ff' },
  magenta: { primary: 0xff007f, secondary: 0x00f0ff, hex: '#ff007f' },
  emerald: { primary: 0x00ff66, secondary: 0x00f0ff, hex: '#00ff66' },
  gold: { primary: 0xffaa00, secondary: 0xff007f, hex: '#ffaa00' }
};

let currentTheme = 'cyan';
let currentMode = 'quantum';
let audioEnabled = true;

// Web Audio API Synthesizer (No external assets required)
class CyberAudio {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClick() {
    if (!audioEnabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playWarp() {
    if (!audioEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.35);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.8);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.8);
  }
}

const sfx = new CyberAudio();

// Main Three.js Application
async function init3DExperience() {
  const canvas = document.getElementById('webgl-canvas');
  let THREE;

  try {
    // Dynamic import Three.js ESM from CDN
    THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
  } catch (err) {
    console.warn('CDN load failed, falling back to unpkg:', err);
    try {
      THREE = await import('https://unpkg.com/three@0.160.0/build/three.module.js');
    } catch (e) {
      console.error('Three.js could not be loaded from CDN. Initializing canvas 2D fallback.', e);
      initCanvas2DFallback(canvas);
      return;
    }
  }

  // Scene setup
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070c, 0.002);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 0, 480);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Resize Observer
  const resizeHandler = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', resizeHandler);

  // Central Holographic Wireframe Core
  const coreGroup = new THREE.Group();
  scene.add(coreGroup);

  // Outer Icosahedron Wireframe
  const outerGeom = new THREE.IcosahedronGeometry(90, 1);
  const outerMat = new THREE.MeshBasicMaterial({
    color: THEME_COLORS[currentTheme].primary,
    wireframe: true,
    transparent: true,
    opacity: 0.35
  });
  const outerMesh = new THREE.Mesh(outerGeom, outerMat);
  coreGroup.add(outerMesh);

  // Inner Torus Knot Core
  const innerGeom = new THREE.TorusKnotGeometry(45, 12, 100, 16);
  const innerMat = new THREE.MeshBasicMaterial({
    color: THEME_COLORS[currentTheme].secondary,
    wireframe: true,
    transparent: true,
    opacity: 0.45
  });
  const innerMesh = new THREE.Mesh(innerGeom, innerMat);
  coreGroup.add(innerMesh);

  // Particle System
  const PARTICLE_COUNT = 2400;
  const particleGeom = new THREE.BufferGeometry();
  const currentPositions = new Float32Array(PARTICLE_COUNT * 3);
  const targetPositions = new Float32Array(PARTICLE_COUNT * 3);
  const velocities = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);

  // Mode position generators
  function generateModePositions(mode) {
    const targets = new Float32Array(PARTICLE_COUNT * 3);

    if (mode === 'quantum') {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const radius = 120 + Math.random() * 220;

        targets[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        targets[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        targets[i * 3 + 2] = radius * Math.cos(phi);
      }
    } else if (mode === 'galaxy') {
      const arms = 3;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const armIndex = i % arms;
        const dist = Math.pow(Math.random(), 1.5) * 380 + 30;
        const angle = (armIndex * (2 * Math.PI / arms)) + (dist * 0.012) + (Math.random() - 0.5) * 0.4;

        targets[i * 3] = Math.cos(angle) * dist;
        targets[i * 3 + 1] = (Math.random() - 0.5) * 45;
        targets[i * 3 + 2] = Math.sin(angle) * dist;
      }
    } else if (mode === 'matrix') {
      const side = Math.floor(Math.sqrt(PARTICLE_COUNT));
      const spacing = 18;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const row = Math.floor(i / side);
        const col = i % side;

        targets[i * 3] = (col - side / 2) * spacing;
        targets[i * 3 + 1] = Math.sin(row * 0.4) * Math.cos(col * 0.4) * 50 - 50;
        targets[i * 3 + 2] = (row - side / 2) * spacing;
      }
    }
    return targets;
  }

  // Initial positions
  const initTargets = generateModePositions('quantum');
  for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
    currentPositions[i] = initTargets[i];
    targetPositions[i] = initTargets[i];
  }

  // Palette color init
  function updateParticleColors() {
    const c1 = new THREE.Color(THEME_COLORS[currentTheme].primary);
    const c2 = new THREE.Color(THEME_COLORS[currentTheme].secondary);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const mix = Math.random();
      const c = c1.clone().lerp(c2, mix);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    particleGeom.attributes.color.needsUpdate = true;
    outerMat.color.setHex(THEME_COLORS[currentTheme].primary);
    innerMat.color.setHex(THEME_COLORS[currentTheme].secondary);
  }

  particleGeom.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
  particleGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Particle Material (Additive blending for glow)
  const particleMat = new THREE.PointsMaterial({
    size: 3.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending
  });

  const particleSystem = new THREE.Points(particleGeom, particleMat);
  scene.add(particleSystem);
  updateParticleColors();

  // Mouse & Camera interaction
  let mouseX = 0;
  let mouseY = 0;
  let targetCamX = 0;
  let targetCamY = 0;
  let isDragging = false;
  let prevMouseX = 0;
  let prevMouseY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - window.innerWidth / 2) * 0.4;
    mouseY = (e.clientY - window.innerHeight / 2) * 0.4;

    if (isDragging) {
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      coreGroup.rotation.y += deltaX * 0.008;
      coreGroup.rotation.x += deltaY * 0.008;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    }
  });

  window.addEventListener('mousedown', (e) => {
    // Only drag when clicking background
    if (e.target.id === 'webgl-canvas') {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    }
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Wheel zoom
  window.addEventListener('wheel', (e) => {
    camera.position.z += e.deltaY * 0.2;
    camera.position.z = Math.max(200, Math.min(800, camera.position.z));
  }, { passive: true });

  // Mode switch function
  window.switchSceneMode = (mode) => {
    currentMode = mode;
    const newTargets = generateModePositions(mode);
    for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
      targetPositions[i] = newTargets[i];
    }
    sfx.playClick();
  };

  // Warp explosion trigger
  window.triggerWarpEffect = () => {
    sfx.playWarp();
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      velocities[idx] = (Math.random() - 0.5) * 40;
      velocities[idx + 1] = (Math.random() - 0.5) * 40;
      velocities[idx + 2] = (Math.random() - 0.5) * 40;
    }
  };

  // Theme switch trigger
  window.switchTheme = (themeName) => {
    if (!THEME_COLORS[themeName]) return;
    currentTheme = themeName;
    document.body.setAttribute('data-theme', themeName);
    updateParticleColors();
    sfx.playClick();
  };

  // Animation Loop
  let clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    // Smooth camera inertia
    targetCamX += (mouseX - targetCamX) * 0.05;
    targetCamY += (-mouseY - targetCamY) * 0.05;
    camera.position.x = targetCamX;
    camera.position.y = targetCamY;
    camera.lookAt(0, 0, 0);

    // Continuous core rotation
    if (!isDragging) {
      coreGroup.rotation.y += 0.005;
      coreGroup.rotation.x += 0.003;
      innerMesh.rotation.z += 0.008;
    }

    // Dynamic wave pulsation on geometry
    const scale = 1 + Math.sin(elapsedTime * 2) * 0.06;
    outerMesh.scale.set(scale, scale, scale);

    // Particle dynamics: lerp toward target + velocity dampening
    const pos = particleGeom.attributes.position.array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;

      // Apply warp velocity decay
      pos[idx] += velocities[idx];
      pos[idx + 1] += velocities[idx + 1];
      pos[idx + 2] += velocities[idx + 2];

      velocities[idx] *= 0.92;
      velocities[idx + 1] *= 0.92;
      velocities[idx + 2] *= 0.92;

      // Smooth interpolation toward target positions
      pos[idx] += (targetPositions[idx] - pos[idx]) * 0.04;
      pos[idx + 1] += (targetPositions[idx + 1] - pos[idx + 1]) * 0.04;
      pos[idx + 2] += (targetPositions[idx + 2] - pos[idx + 2]) * 0.04;

      // Add gentle floating motion
      if (currentMode === 'matrix') {
        pos[idx + 1] += Math.sin(elapsedTime * 2 + pos[idx] * 0.05) * 0.4;
      }
    }
    particleGeom.attributes.position.needsUpdate = true;

    // Rotate entire particle cloud slowly
    particleSystem.rotation.y = elapsedTime * 0.04;

    renderer.render(scene, camera);
  }

  animate();
}

// Fallback 2D Canvas 3D Projector if WebGL/CDN is unavailable
function initCanvas2DFallback(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  for (let i = 0; i < 600; i++) {
    particles.push({
      x: (Math.random() - 0.5) * 1200,
      y: (Math.random() - 0.5) * 1200,
      z: Math.random() * 1000 + 100,
      baseZ: Math.random() * 1000 + 100
    });
  }

  function render2D() {
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const fov = 400;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.fillStyle = THEME_COLORS[currentTheme].hex;

    for (let p of particles) {
      p.z -= 1.5;
      if (p.z <= 10) p.z = 1000;

      const scale = fov / p.z;
      const sx = cx + p.x * scale;
      const sy = cy + p.y * scale;
      const size = Math.max(1, 2.5 * scale);

      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(render2D);
  }
  render2D();
}

// UI Interaction Bindings
document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabs = document.querySelectorAll('.content-tab');

  navBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      navBtns.forEach((b) => b.classList.remove('active'));
      tabs.forEach((t) => t.classList.remove('active'));

      btn.classList.add('active');
      const activeTabEl = document.getElementById(`tab-${targetTab}`);
      if (activeTabEl) activeTabEl.classList.add('active');
      sfx.playClick();
    });
  });

  // Mode Buttons
  const modeBtns = document.querySelectorAll('.mode-btn');
  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      if (window.switchSceneMode) {
        window.switchSceneMode(btn.dataset.mode);
      }
    });
  });

  // Palette Theme Dots
  const paletteDots = document.querySelectorAll('.palette-dot');
  paletteDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      paletteDots.forEach((d) => d.classList.remove('active'));
      dot.classList.add('active');
      if (window.switchTheme) {
        window.switchTheme(dot.dataset.theme);
      }
    });
  });

  // Warp Button
  const btnWarp = document.getElementById('btn-warp');
  if (btnWarp) {
    btnWarp.addEventListener('click', () => {
      if (window.triggerWarpEffect) {
        window.triggerWarpEffect();
      }
    });
  }

  // Audio Toggle
  const audioToggle = document.getElementById('audio-toggle');
  if (audioToggle) {
    audioToggle.addEventListener('click', () => {
      audioEnabled = !audioEnabled;
      const label = audioToggle.querySelector('.btn-label');
      const icon = audioToggle.querySelector('.icon');
      if (audioEnabled) {
        label.textContent = 'SFX: ON';
        icon.textContent = '🔊';
        sfx.playClick();
      } else {
        label.textContent = 'SFX: OFF';
        icon.textContent = '🔇';
      }
    });
  }

  // Open Terminal Shortcut
  const btnOpenTerminal = document.getElementById('btn-open-terminal');
  if (btnOpenTerminal) {
    btnOpenTerminal.addEventListener('click', () => {
      const termNav = document.querySelector('.nav-btn[data-tab="terminal"]');
      if (termNav) termNav.click();
    });
  }

  // Interactive CLI Terminal
  const termInput = document.getElementById('term-input');
  const termOutput = document.getElementById('term-output');

  function printLine(text, isHighlight = false) {
    const line = document.createElement('div');
    line.className = 'term-line';
    if (isHighlight) line.classList.add('highlight');
    line.innerHTML = text;
    termOutput.appendChild(line);
    termOutput.scrollTop = termOutput.scrollHeight;
  }

  if (termInput) {
    termInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = termInput.value.trim().toLowerCase();
        termInput.value = '';
        if (!cmd) return;

        printLine(`user@prlistrxs:~$ ${cmd}`);
        sfx.playClick();

        const parts = cmd.split(' ');
        const root = parts[0];

        switch (root) {
          case 'help':
            printLine("Available commands: <span class='highlight'>bio, skills, projects, warp, theme [cyan|magenta|emerald|gold], mode [quantum|galaxy|matrix], clear</span>");
            break;
          case 'bio':
            printLine("PRLISTRXS: Creative Developer, System Architect, Autonomous Agent Explorer.");
            break;
          case 'skills':
            printLine("Visual: Three.js, WebGL, Shaders, Canvas<br>Core: TypeScript, Rust, Go, Python, Java<br>Architecture: Next.js, Cloudflare, WebSockets");
            break;
          case 'projects':
            printLine("1. Cyber Core 3D (Interactive WebGL Experience)<br>2. Castorice-SR Protocol Simulation<br>3. Agentic Workflow Matrix");
            break;
          case 'warp':
            printLine("<span class='highlight'>Initiating Quantum Warp...</span>");
            if (window.triggerWarpEffect) window.triggerWarpEffect();
            break;
          case 'theme':
            const t = parts[1];
            if (['cyan', 'magenta', 'emerald', 'gold'].includes(t)) {
              const dot = document.querySelector(`.palette-dot[data-theme="${t}"]`);
              if (dot) dot.click();
              printLine(`Theme switched to <span class='highlight'>${t}</span>.`);
            } else {
              printLine("Usage: theme [cyan|magenta|emerald|gold]");
            }
            break;
          case 'mode':
            const m = parts[1];
            if (['quantum', 'galaxy', 'matrix'].includes(m)) {
              const btn = document.querySelector(`.mode-btn[data-mode="${m}"]`);
              if (btn) btn.click();
              printLine(`Scene mode shifted to <span class='highlight'>${m}</span>.`);
            } else {
              printLine("Usage: mode [quantum|galaxy|matrix]");
            }
            break;
          case 'clear':
            termOutput.innerHTML = '';
            break;
          default:
            printLine(`Command not found: '${cmd}'. Type 'help' for options.`, false);
        }
      }
    });
  }

  // Initialize 3D Engine
  init3DExperience();
});
