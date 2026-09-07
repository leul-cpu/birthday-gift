/**
 * CINEMATIC CANVAS PARTICLE & ATMOSPHERE ENGINE
 * High-performance, 60fps canvas renderer for:
 * 1. Film projector dust & atmospheric air motes
 * 2. Tactile finger disturbance & fluid return physics
 * 3. Interactive glowing celestial orb
 * 4. Restrained emotional climax particle bloom
 */

class ParticleEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = 0;
    this.height = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for mobile battery efficiency

    // State
    this.particles = [];
    this.climaxParticles = [];
    this.pointer = { x: -1000, y: -1000, vx: 0, vy: 0, active: false, radius: 95 };
    this.orb = {
      x: 0,
      y: 0,
      baseRadius: 28,
      radius: 28,
      targetRadius: 28,
      intensity: 0.8,
      pulsePhase: 0,
      deformationX: 1,
      deformationY: 1,
      visible: false,
      ripples: []
    };

    this.ambientDensity = 55;
    this.mode = 'ambient'; // 'ambient', 'orb', 'reveal'
    this.animationFrameId = null;
    this.themeColors = {
      accent: '#c5a059',
      particles: ['#c5a059', '#ede8df', '#d4af37']
    };

    this.resize();
    this.initAmbientParticles();
    this.bindEvents();
    this.startLoop();
  }

  setThemeColors(colors) {
    if (!colors) return;
    this.themeColors = colors;
    this.initAmbientParticles();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.scale(this.dpr, this.dpr);

    this.orb.x = this.width / 2;
    this.orb.y = this.height * 0.46;
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    // Tactile Pointer Handling on Container
    const container = this.canvas.parentElement;

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.x;
      const y = e.clientY - rect.y;

      if (this.pointer.active) {
        this.pointer.vx = (x - this.pointer.x) * 0.3;
        this.pointer.vy = (y - this.pointer.y) * 0.3;
      }
      this.pointer.x = x;
      this.pointer.y = y;
      this.pointer.active = true;

      // If in orb mode and interacting near orb
      if (this.orb.visible) {
        const dx = x - this.orb.x;
        const dy = y - this.orb.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 80) {
          this.orb.deformationX = 1 + (dx / 80) * 0.25;
          this.orb.deformationY = 1 - (dy / 80) * 0.25;
          this.orb.targetRadius = this.orb.baseRadius * 1.35;
        }
      }
    };

    const handlePointerDown = (e) => {
      this.pointer.active = true;
      handlePointerMove(e);
      if (this.orb.visible) {
        const dx = this.pointer.x - this.orb.x;
        const dy = this.pointer.y - this.orb.y;
        if (Math.hypot(dx, dy) < 65) {
          this.addOrbRipple();
        }
      }
    };

    const handlePointerUp = () => {
      this.pointer.active = false;
      this.pointer.x = -1000;
      this.pointer.y = -1000;
      this.orb.targetRadius = this.orb.baseRadius;
      this.orb.deformationX = 1;
      this.orb.deformationY = 1;
    };

    container.addEventListener('pointerdown', handlePointerDown, { passive: true });
    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', handlePointerUp, { passive: true });
  }

  initAmbientParticles() {
    this.particles = [];
    const count = Math.min(65, Math.floor(this.width * 0.12));
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        originX: 0,
        originY: 0,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -0.15 - Math.random() * 0.2,
        size: 0.8 + Math.random() * 1.6,
        alpha: 0.15 + Math.random() * 0.45,
        targetAlpha: 0.15 + Math.random() * 0.45,
        flickerSpeed: 0.01 + Math.random() * 0.02,
        phase: Math.random() * Math.PI * 2,
        warmth: Math.random() > 0.65 ? 'gold' : 'dust'
      });
    }
  }

  addOrbRipple() {
    this.orb.ripples.push({
      radius: this.orb.radius,
      alpha: 0.7,
      growth: 1.8 + Math.random() * 1.0
    });

    // Spawn tiny golden sparks
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.4;
      this.climaxParticles.push({
        x: this.orb.x,
        y: this.orb.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.0 + Math.random() * 1.2,
        alpha: 0.85,
        decay: 0.025 + Math.random() * 0.02,
        color: '#d4af37'
      });
    }
  }

  /**
   * Trigger emotional particle explosion for final reveal
   */
  triggerClimaxBloom() {
    const cx = this.width / 2;
    const cy = this.height * 0.38;
    const count = 120;
    const colors = (this.themeColors && this.themeColors.particles) || ['#c5a059', '#ede8df', '#d4af37'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      // Varied velocities for depth: some fast, some slow
      const speed = (0.6 + Math.pow(Math.random(), 1.8) * 6.5);
      const isPaperFragment = Math.random() > 0.82;
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.climaxParticles.push({
        x: cx + (Math.random() - 0.5) * 12,
        y: cy + (Math.random() - 0.5) * 12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.4, // subtle initial lift
        friction: 0.97,
        size: isPaperFragment ? 2.5 + Math.random() * 3.5 : 0.8 + Math.random() * 2.0,
        alpha: 0.85 + Math.random() * 0.15,
        decay: 0.003 + Math.random() * 0.008, // Long graceful float
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.08,
        color: color,
        isFragment: isPaperFragment
      });
    }
  }

  update() {
    // 1. Ambient atmospheric projector particles
    const time = performance.now() * 0.001;

    for (let p of this.particles) {
      // Natural organic drift
      p.x += p.vx + Math.sin(time + p.phase) * 0.18;
      p.y += p.vy;

      // Tactile deflection from pointer
      if (this.pointer.active) {
        const dx = p.x - this.pointer.x;
        const dy = p.y - this.pointer.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.pointer.radius) {
          const force = (1 - dist / this.pointer.radius) * 2.2;
          p.x += (dx / dist) * force * 3.5;
          p.y += (dy / dist) * force * 3.5;
        }
      }

      // Wrap around bounds
      if (p.y < -10) { p.y = this.height + 10; p.x = Math.random() * this.width; }
      if (p.y > this.height + 10) { p.y = -10; }
      if (p.x < -10) { p.x = this.width + 10; }
      if (p.x > this.width + 10) { p.x = -10; }

      // Subtle atmospheric luminance breathing
      p.alpha += Math.sin(time * 2 + p.phase) * 0.005;
      p.alpha = Math.max(0.08, Math.min(0.65, p.alpha));
    }

    // 2. Orb physics & breathing
    if (this.orb.visible) {
      this.orb.pulsePhase += 0.024;
      this.orb.radius += (this.orb.targetRadius - this.orb.radius) * 0.1;
      
      // Update ripples
      for (let i = this.orb.ripples.length - 1; i >= 0; i--) {
        const r = this.orb.ripples[i];
        r.radius += r.growth;
        r.alpha -= 0.016;
        if (r.alpha <= 0) {
          this.orb.ripples.splice(i, 1);
        }
      }
    }

    // 3. Climax / Spark particles
    for (let i = this.climaxParticles.length - 1; i >= 0; i--) {
      const cp = this.climaxParticles[i];
      if (cp.friction) {
        cp.vx *= cp.friction;
        cp.vy *= cp.friction;
      }
      cp.vy += 0.015; // gentle gravity
      cp.x += cp.vx;
      cp.y += cp.vy;
      cp.alpha -= cp.decay;
      if (cp.isFragment) {
        cp.rotation += cp.rotSpeed;
      }

      if (cp.alpha <= 0) {
        this.climaxParticles.splice(i, 1);
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Ambient Dust / Projector Motes
    const accentColor = (this.themeColors && this.themeColors.accent) || '#e5a742';
    for (let p of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.warmth === 'gold' ? accentColor : '#f0ece1';
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // 2. Draw Interactive Orb
    if (this.orb.visible) {
      this.ctx.save();
      const ox = this.orb.x;
      const oy = this.orb.y;
      const r = this.orb.radius * (1 + Math.sin(this.orb.pulsePhase) * 0.04);

      // Draw active ripples
      for (let rip of this.orb.ripples) {
        this.ctx.save();
        this.ctx.strokeStyle = `rgba(229, 167, 66, ${rip.alpha * 0.6})`;
        this.ctx.lineWidth = 1.2;
        this.ctx.beginPath();
        this.ctx.arc(ox, oy, rip.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
      }

      // Outer ethereal corona aura
      const outerGlow = this.ctx.createRadialGradient(ox, oy, r * 0.2, ox, oy, r * 3.4);
      outerGlow.addColorStop(0, 'rgba(218, 185, 110, 0.28)');
      outerGlow.addColorStop(0.5, 'rgba(197, 160, 89, 0.08)');
      outerGlow.addColorStop(1, 'rgba(8, 8, 9, 0)');

      this.ctx.fillStyle = outerGlow;
      this.ctx.beginPath();
      this.ctx.arc(ox, oy, r * 3.4, 0, Math.PI * 2);
      this.ctx.fill();

      // Deformed Core Body
      this.ctx.save();
      this.ctx.translate(ox, oy);
      this.ctx.scale(this.orb.deformationX, this.orb.deformationY);

      // Core gradient with realistic soft filmic glow
      const coreGrad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.35, '#fff6e0');
      coreGrad.addColorStop(0.75, '#c5a059');
      coreGrad.addColorStop(1, 'rgba(197, 160, 89, 0.2)');

      this.ctx.fillStyle = coreGrad;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, r, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      this.ctx.restore();
    }

    // 3. Draw Climax Bloom / Spark Particles
    for (let cp of this.climaxParticles) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, cp.alpha);
      this.ctx.fillStyle = cp.color;

      if (cp.isFragment) {
        this.ctx.translate(cp.x, cp.y);
        this.ctx.rotate(cp.rotation);
        this.ctx.fillRect(-cp.size / 2, -cp.size / 3, cp.size, cp.size * 0.6);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(cp.x, cp.y, cp.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }
  }

  startLoop() {
    const loop = () => {
      this.update();
      this.draw();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  setOrbVisible(visible) {
    this.orb.visible = visible;
    if (visible) {
      this.orb.radius = 8;
      this.orb.targetRadius = this.orb.baseRadius;
    }
  }

  reset() {
    this.climaxParticles = [];
    this.setOrbVisible(false);
    this.initAmbientParticles();
  }
}

window.ParticleEngine = ParticleEngine;
