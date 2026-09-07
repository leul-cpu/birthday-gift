/**
 * A LITTLE WORLD MADE FOR YOU
 * Master Interactive Short Film Controller
 * Orchestrates touch physics, typography pacing, and scene state machine.
 */

(function() {
  'use strict';

  // State Machine definitions
  const SCENES = {
    WAKE: 'scene-wake',
    WISH: 'scene-wish',
    ORB: 'scene-orb',
    MEMORIES: 'scene-memories',
    MONTAGE: 'scene-montage',
    CHOICE: 'scene-choice',
    BUILDUP: 'scene-buildup',
    REVEAL: 'scene-reveal'
  };

  class ExperienceDirector {
    constructor() {
      this.isCreator = this.checkCreatorAccess();
      this.config = this.loadPersonalization();
      this.currentScene = null;
      this.particleEngine = null;
      this.sound = window.sound;

      // Interaction tracking
      this.activePhotoIndex = 0;
      this.orbTouchCount = 0;
      this.selectedChoice = null;
      this.signoffTapCount = 0;
      this.touchState = {
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        startTime: 0,
        isDragging: false,
        activeCard: null
      };

      this.initDOM();
      this.applyTheme(this.config.activeTheme || 'golden-celebration');
      this.initParticles();
      this.bindGlobalEvents();
      this.goToScene(SCENES.WAKE);
    }

    checkCreatorAccess() {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const hasParam = urlParams.has('admin') || urlParams.has('edit') || hash === '#admin';
      const isSaved = sessionStorage.getItem('birthday_gift_is_creator') === 'true';

      const isCreator = hasParam || isSaved;
      if (isCreator) {
        document.body.classList.add('is-creator');
      }
      return isCreator;
    }

    loadPersonalization() {
      const base = window.EXPERIENCE_CONFIG || {};

      // 1. Check if recipient opened via a customized shared link (URL hash /#g=...)
      try {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#g=')) {
          const encoded = hash.substring(3);
          const decoded = decodeURIComponent(escape(atob(encoded)));
          const sharedData = JSON.parse(decoded);
          return Object.assign({}, base, sharedData);
        }
      } catch (e) {
        console.warn('Could not parse shared gift payload from URL', e);
      }

      // 2. Check local creator overrides
      try {
        const saved = localStorage.getItem('birthday_gift_custom_config');
        if (saved) {
          return Object.assign({}, base, JSON.parse(saved));
        }
      } catch (e) {
        console.warn('Could not load local personalization', e);
      }
      return base;
    }

    savePersonalization(newConfig) {
      // 1. Immediately update in-memory state and re-render
      this.config = Object.assign({}, this.config, newConfig);
      this.applyTheme(this.config.activeTheme);
      this.renderDynamicContent();

      // 2. Safely persist to localStorage
      try {
        localStorage.setItem('birthday_gift_custom_config', JSON.stringify(newConfig));
      } catch (e) {
        console.warn('LocalStorage quota limit reached, state preserved in memory', e);
      }
    }

    applyTheme(themeKey) {
      const stage = document.getElementById('mobileStage');
      if (!stage) return;

      const theme = (this.config.themes && this.config.themes[themeKey]) ? themeKey : 'noir-gold';
      stage.setAttribute('data-theme', theme);
      this.config.activeTheme = theme;

      // Update Particle Engine Palette
      if (this.particleEngine && this.config.themes && this.config.themes[theme]) {
        const t = this.config.themes[theme];
        this.particleEngine.setThemeColors({
          accent: t.accent,
          particles: t.particleColors
        });
      }

      // Update active chip in Creator Studio
      document.querySelectorAll('.theme-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.theme === theme);
      });
    }

    initDOM() {
      // Containers
      this.stage = document.getElementById('mobileStage');
      this.canvas = document.getElementById('particlesCanvas');
      
      // Control buttons
      this.audioBtn = document.getElementById('audioToggleBtn');
      this.customBtn = document.getElementById('customizeBtn');
      this.customDrawer = document.getElementById('customDrawer');
      this.drawerClose = document.getElementById('drawerCloseBtn');
      this.drawerForm = document.getElementById('drawerForm');

      // Populate text from config
      this.renderDynamicContent();
    }

    renderDynamicContent() {
      // Intro
      const introGreeting = document.getElementById('introGreetingText');
      if (introGreeting) introGreeting.textContent = this.config.introGreeting;
      const introPrompt = document.getElementById('introPromptText');
      if (introPrompt) introPrompt.textContent = this.config.introPrompt;

      // Climax
      const nameEl = document.getElementById('revealRecipientName');
      if (nameEl) nameEl.textContent = this.config.recipientName;
      const titleEl = document.getElementById('revealTitle');
      if (titleEl) titleEl.textContent = this.config.birthdayTitle;
      const msgEl = document.getElementById('revealMessage');
      if (msgEl) msgEl.textContent = this.config.birthdayMessage;
      const signoffEl = document.getElementById('revealSignoff');
      if (signoffEl) signoffEl.textContent = this.config.birthdaySignoff;

      // Update Featured #1 Hero Photo on Birthday Reveal
      this.updateRevealHeroPhoto();

      // Build Photo Stack
      this.buildPhotoDeck();

      // Build Choice Arena
      this.buildChoiceArena();
    }

    updateRevealHeroPhoto() {
      const wrapper = document.getElementById('revealPortraitWrapper');
      const frame = document.getElementById('revealPortraitFrame');
      const img = document.getElementById('revealPortraitImg');
      if (!wrapper || !img) return;

      const firstPhoto = this.config.memories && this.config.memories[0];
      if (firstPhoto && firstPhoto.image) {
        img.src = firstPhoto.image;
        img.alt = this.config.recipientName || 'Birthday Honoree';
        img.onerror = () => {
          img.src = "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80";
        };
        wrapper.style.display = 'flex';

        if (frame && !frame.dataset.bound) {
          frame.dataset.bound = 'true';
          frame.addEventListener('click', () => {
            if (this.sound) this.sound.playOrbTouch(1.1);
            this.triggerHaptic([20, 25]);
          });
        }
      } else {
        wrapper.style.display = 'none';
      }
    }

    initParticles() {
      if (window.ParticleEngine) {
        this.particleEngine = new window.ParticleEngine('particlesCanvas');
      }
    }

    triggerHaptic(pattern = [20]) {
      if (navigator.vibrate) {
        try {
          navigator.vibrate(pattern);
        } catch (e) {}
      }
    }

    goToScene(sceneId) {
      const prevSceneEl = this.currentScene ? document.getElementById(this.currentScene) : null;
      const nextSceneEl = document.getElementById(sceneId);

      if (prevSceneEl) {
        prevSceneEl.classList.remove('active');
        prevSceneEl.classList.add('fade-out');
        setTimeout(() => {
          prevSceneEl.classList.remove('fade-out');
        }, 800);
      }

      this.currentScene = sceneId;

      if (nextSceneEl) {
        setTimeout(() => {
          nextSceneEl.classList.add('active');
          this.onSceneEnter(sceneId);
        }, 150);
      }
    }

    onSceneEnter(sceneId) {
      switch (sceneId) {
        case SCENES.WAKE:
          this.setupWakeScene();
          break;
        case SCENES.WISH:
          this.playWishTypographySequence();
          break;
        case SCENES.ORB:
          this.setupOrbScene();
          break;
        case SCENES.MEMORIES:
          this.setupMemoriesScene();
          break;
        case SCENES.MONTAGE:
          this.playMontageSequence();
          break;
        case SCENES.CHOICE:
          this.setupChoiceScene();
          break;
        case SCENES.BUILDUP:
          this.playBuildupSequence();
          break;
        case SCENES.REVEAL:
          this.playRevealClimax();
          break;
      }
    }

    /* ==========================================================================
       SCENE 1: WAKE
       ========================================================================== */
    setupWakeScene() {
      const wakeZone = document.getElementById('wakeBeacon');
      const wakeScene = document.getElementById(SCENES.WAKE);

      const handleAwaken = () => {
        wakeZone.removeEventListener('click', handleAwaken);
        wakeZone.removeEventListener('pointerdown', handleAwaken);
        wakeScene.removeEventListener('click', handleAwaken);

        // Resume / Initialize Web Audio on user gesture
        if (this.sound) {
          this.sound.ensureContext();
          this.sound.startAmbientDrone();
          this.sound.playOrbTouch(1.3);
        }
        this.triggerHaptic([30, 40, 20]);

        // Expanding light ring feedback
        const core = wakeZone.querySelector('.beacon-core');
        if (core) {
          core.style.transform = 'scale(24)';
          core.style.opacity = '0.98';
          core.style.transition = 'all 0.8s var(--ease-cinematic)';
        }

        setTimeout(() => {
          this.goToScene(SCENES.WISH);
        }, 650);
      };

      wakeZone.addEventListener('pointerdown', handleAwaken);
      wakeScene.addEventListener('click', handleAwaken);
    }

    /* ==========================================================================
       SCENE 2: WISH TYPOGRAPHY
       ========================================================================== */
    playWishTypographySequence() {
      const container = document.getElementById('wishContainer');
      const wishScene = document.getElementById(SCENES.WISH);
      container.innerHTML = '';

      const lines = this.config.wishLines;
      const elements = [];
      let wishStep = 0;
      let timerIds = [];

      lines.forEach((text, i) => {
        const p = document.createElement('p');
        p.className = 'wish-line' + (i === lines.length - 1 ? ' accent' : '');
        p.textContent = text;
        container.appendChild(p);
        elements.push(p);
      });

      const showStep = (idx) => {
        if (idx >= elements.length) {
          cleanup();
          this.goToScene(SCENES.ORB);
          return;
        }
        if (idx > 0 && elements[idx - 1]) {
          elements[idx - 1].classList.add('fade');
        }
        if (elements[idx]) {
          elements[idx].classList.add('visible');
          this.triggerHaptic([15]);
        }
        wishStep = idx + 1;
      };

      // Cinematic timed pacing
      const delays = [300, 2100, 4200, 6000];
      delays.forEach((d, i) => {
        timerIds.push(setTimeout(() => showStep(i), d));
      });

      // Auto advance to orb
      timerIds.push(setTimeout(() => {
        cleanup();
        this.goToScene(SCENES.ORB);
      }, 8200));

      const handleSkipWish = () => {
        if (wishStep < elements.length) {
          // Clear remaining timers and show next line immediately
          timerIds.forEach(id => clearTimeout(id));
          timerIds = [];
          showStep(wishStep);
          // Set timer for the next after this quick tap
          timerIds.push(setTimeout(() => {
            if (wishStep < elements.length) {
              showStep(wishStep);
            } else {
              cleanup();
              this.goToScene(SCENES.ORB);
            }
          }, 1800));
        } else {
          cleanup();
          this.goToScene(SCENES.ORB);
        }
      };

      const cleanup = () => {
        timerIds.forEach(id => clearTimeout(id));
        wishScene.removeEventListener('click', handleSkipWish);
      };

      wishScene.addEventListener('click', handleSkipWish);
    }

    /* ==========================================================================
       SCENE 3: INTERACTIVE ORB
       ========================================================================== */
    setupOrbScene() {
      if (this.particleEngine) {
        this.particleEngine.setOrbVisible(true);
      }

      this.orbTouchCount = 0;
      const interactZone = document.getElementById('orbInteractZone');
      const cueText = document.getElementById('orbCueText');

      setTimeout(() => {
        cueText.classList.add('visible');
      }, 1000);

      const handleOrbInteraction = (e) => {
        this.orbTouchCount++;
        this.triggerHaptic([25]);

        if (this.sound) {
          this.sound.playOrbTouch(0.8 + this.orbTouchCount * 0.3);
        }

        if (this.orbTouchCount === 1) {
          cueText.textContent = "It responds to you.";
        } else if (this.orbTouchCount === 2) {
          cueText.textContent = "Hold on to this moment.";
        } else if (this.orbTouchCount >= 3) {
          cueText.textContent = "Awakening memories…";
          cueText.style.color = "var(--accent-gold)";

          if (this.sound) {
            this.sound.playOrbPulse();
          }
          this.triggerHaptic([40, 60, 40]);

          interactZone.removeEventListener('pointerdown', handleOrbInteraction);

          setTimeout(() => {
            if (this.particleEngine) {
              this.particleEngine.setOrbVisible(false);
            }
            this.goToScene(SCENES.MEMORIES);
          }, 1200);
        }
      };

      interactZone.addEventListener('pointerdown', handleOrbInteraction);
    }

    /* ==========================================================================
       SCENE 4: FLOATING PHYSICAL PHOTOGRAPHS
       ========================================================================== */
    buildPhotoDeck() {
      const deck = document.getElementById('photoDeck');
      const tracker = document.getElementById('deckTracker');
      if (!deck || !tracker) return;

      deck.innerHTML = '';
      tracker.innerHTML = '';

      const memories = this.config.memories || [];
      if (!memories.length) {
        // Fallback if all photos were removed
        memories.push({
          id: 1,
          image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=85",
          caption: "A moment to remember.",
          subcaption: "Captured in time",
          rotation: -2
        });
      }

      memories.forEach((mem, index) => {
        // Tracker dot
        const dot = document.createElement('div');
        dot.className = 'deck-dot' + (index === 0 ? ' active' : '');
        dot.id = `deckDot-${index}`;
        tracker.appendChild(dot);

        // Photo Card
        const card = document.createElement('div');
        card.className = 'physical-photo';
        card.dataset.index = index;
        card.style.zIndex = memories.length - index;

        // Subtle organic tilt
        const baseRotations = [-3.5, 2.8, -2.2, 3.2, -1.8, 2.4, -3.0, 1.9];
        const initRot = mem.rotation !== undefined ? mem.rotation : baseRotations[index % baseRotations.length];
        const initY = Math.min(index * 3, 18);
        card.style.transform = `translate3d(0, ${initY}px, ${-index * 15}px) rotate(${initRot}deg)`;
        card.dataset.rot = initRot;

        const img = document.createElement('img');
        img.className = 'photo-inner-img';
        img.src = mem.image;
        img.alt = mem.caption || 'Memory';
        img.loading = index < 3 ? 'eager' : 'lazy';

        // Error fallback for broken image links
        img.onerror = () => {
          img.src = "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=85";
        };

        card.appendChild(img);
        deck.appendChild(card);
      });

      this.activePhotoIndex = 0;
      this.updatePhotoCaption(0);
      this.renderPhotosManager();
      this.updateRevealHeroPhoto();

      if (this.currentScene === SCENES.MEMORIES) {
        this.setupMemoriesScene();
      }
    }

    renderPhotosManager() {
      const list = document.getElementById('photosManagerList');
      const badge = document.getElementById('photoCountBadge');
      if (!list) return;

      list.innerHTML = '';
      const memories = this.config.memories || [];
      if (badge) badge.textContent = memories.length;

      memories.forEach((mem, idx) => {
        const card = document.createElement('div');
        card.className = 'photo-manager-card';

        // Order badge
        const orderEl = document.createElement('div');
        orderEl.className = 'photo-manager-order';
        orderEl.textContent = idx === 0 ? '★ #1 Hero' : `#${idx + 1}`;
        if (idx === 0) {
          orderEl.style.fontSize = '7.5px';
          orderEl.style.color = 'var(--accent-gold)';
          orderEl.style.borderColor = 'var(--accent-gold)';
          orderEl.title = 'Featured hero photograph on Birthday Reveal screen';
        }

        // Thumbnail with replace overlay
        const thumbWrap = document.createElement('div');
        thumbWrap.className = 'photo-manager-thumb-wrap';
        thumbWrap.title = 'Click to change image';

        const thumb = document.createElement('img');
        thumb.className = 'photo-manager-thumb';
        thumb.src = mem.image;
        thumb.alt = `Photo ${idx + 1}`;
        thumb.onerror = () => { thumb.src = "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=200&q=80"; };

        const replaceOverlay = document.createElement('div');
        replaceOverlay.className = 'photo-manager-thumb-replace';
        replaceOverlay.textContent = 'Change';

        const singleFileInput = document.createElement('input');
        singleFileInput.type = 'file';
        singleFileInput.accept = 'image/*';
        singleFileInput.style.display = 'none';

        singleFileInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (file) {
            try {
              const dataUrl = await this.compressImage(file, 720, 0.78);
              mem.image = dataUrl;
              thumb.src = dataUrl;
              this.buildPhotoDeck();
              this.showToast(`Photo #${idx + 1} updated!`);
            } catch (err) {
              console.warn('Could not compress photo', err);
            }
          }
        });

        thumbWrap.addEventListener('click', () => singleFileInput.click());
        thumbWrap.appendChild(thumb);
        thumbWrap.appendChild(replaceOverlay);
        thumbWrap.appendChild(singleFileInput);

        // Inputs
        const fields = document.createElement('div');
        fields.className = 'photo-manager-fields';

        const captionInput = document.createElement('input');
        captionInput.type = 'text';
        captionInput.className = 'photo-manager-input';
        captionInput.placeholder = 'Photo caption...';
        captionInput.value = mem.caption || '';
        captionInput.addEventListener('input', (e) => {
          mem.caption = e.target.value;
        });

        const subInput = document.createElement('input');
        subInput.type = 'text';
        subInput.className = 'photo-manager-input';
        subInput.placeholder = 'Subtext (optional)...';
        subInput.value = mem.subcaption || '';
        subInput.style.opacity = '0.7';
        subInput.addEventListener('input', (e) => {
          mem.subcaption = e.target.value;
        });

        fields.appendChild(captionInput);
        fields.appendChild(subInput);

        // Actions (Move Up, Move Down, Delete)
        const actions = document.createElement('div');
        actions.className = 'photo-manager-actions';

        if (idx > 0) {
          const upBtn = document.createElement('button');
          upBtn.type = 'button';
          upBtn.className = 'photo-manager-move-btn';
          upBtn.innerHTML = '▲';
          upBtn.title = 'Move toward top';
          upBtn.addEventListener('click', () => {
            const temp = this.config.memories[idx];
            this.config.memories[idx] = this.config.memories[idx - 1];
            this.config.memories[idx - 1] = temp;
            this.renderPhotosManager();
            this.buildPhotoDeck();
          });
          actions.appendChild(upBtn);
        }

        if (idx < memories.length - 1) {
          const downBtn = document.createElement('button');
          downBtn.type = 'button';
          downBtn.className = 'photo-manager-move-btn';
          downBtn.innerHTML = '▼';
          downBtn.title = 'Move down';
          downBtn.addEventListener('click', () => {
            const temp = this.config.memories[idx];
            this.config.memories[idx] = this.config.memories[idx + 1];
            this.config.memories[idx + 1] = temp;
            this.renderPhotosManager();
            this.buildPhotoDeck();
          });
          actions.appendChild(downBtn);
        }

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'photo-manager-del';
        delBtn.innerHTML = '×';
        delBtn.title = 'Remove photo';
        delBtn.addEventListener('click', () => {
          if (this.config.memories.length <= 1) {
            this.showToast('Must keep at least 1 photo');
            return;
          }
          this.config.memories.splice(idx, 1);
          this.renderPhotosManager();
          this.buildPhotoDeck();
        });
        actions.appendChild(delBtn);

        card.appendChild(orderEl);
        card.appendChild(thumbWrap);
        card.appendChild(fields);
        card.appendChild(actions);
        list.appendChild(card);
      });
    }

    /**
     * Efficiently downsample uploaded images so mobile memory is protected
     */
    compressImage(file, maxDimension = 720, quality = 0.78) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxDimension) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              }
            } else {
              if (height > maxDimension) {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
          };
          img.onerror = reject;
          img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    updatePhotoCaption(index) {
      const captionBox = document.getElementById('photoCaptionReveal');
      const titleEl = document.getElementById('photoCaptionText');
      const subEl = document.getElementById('photoSubcaptionText');
      const memory = this.config.memories[index];

      if (!memory || !captionBox) return;

      captionBox.classList.remove('visible');
      setTimeout(() => {
        titleEl.textContent = memory.caption;
        subEl.textContent = memory.subcaption || '';
        captionBox.classList.add('visible');
      }, 250);

      // Update tracker dots
      document.querySelectorAll('.deck-dot').forEach((dot, idx) => {
        dot.classList.toggle('active', idx === index);
      });
    }

    setupMemoriesScene() {
      const deck = document.getElementById('photoDeck');
      if (!deck) return;
      const cards = deck.querySelectorAll('.physical-photo');
      if (!cards.length) return;

      if (this.activePhotoIndex >= cards.length) {
        this.activePhotoIndex = 0;
      }

      cards.forEach((c, idx) => {
        c.classList.toggle('is-active', idx === this.activePhotoIndex);
      });

      const topCard = cards[this.activePhotoIndex];
      if (topCard) {
        topCard.classList.add('is-active');
        this.bindPhotoPhysics(topCard);
        this.updatePhotoCaption(this.activePhotoIndex);
      }

      // Allow clicking the caption swipe hint as an intuitive fallback
      const hint = document.querySelector('.photo-swipe-hint');
      if (hint && !hint.dataset.bound) {
        hint.dataset.bound = 'true';
        hint.style.cursor = 'pointer';
        hint.addEventListener('click', () => {
          const activeCards = document.querySelectorAll('.physical-photo');
          if (activeCards[this.activePhotoIndex]) {
            this.dismissActivePhoto(activeCards[this.activePhotoIndex], 1);
          }
        });
      }
    }

    bindPhotoPhysics(card) {
      if (!card || card.dataset.boundPhysics) return;
      card.dataset.boundPhysics = 'true';

      const onPointerDown = (e) => {
        this.touchState.isDragging = true;
        this.touchState.startX = e.clientX;
        this.touchState.startY = e.clientY;
        this.touchState.currentX = e.clientX;
        this.touchState.currentY = e.clientY;
        this.touchState.startTime = performance.now();
        this.touchState.activeCard = card;

        card.classList.add('is-dragging');
        if (this.sound) this.sound.playPaperSlide();
        this.triggerHaptic([15]);

        try { card.setPointerCapture(e.pointerId); } catch(err) {}
      };

      const onPointerMove = (e) => {
        if (!this.touchState.isDragging || this.touchState.activeCard !== card) return;

        this.touchState.currentX = e.clientX;
        this.touchState.currentY = e.clientY;

        const deltaX = this.touchState.currentX - this.touchState.startX;
        const deltaY = this.touchState.currentY - this.touchState.startY;

        const rot = (parseFloat(card.dataset.rot) || 0) + deltaX * 0.08;
        const scale = 1.02;

        card.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 40px) rotate(${rot}deg) scale(${scale})`;
      };

      const onPointerUp = (e) => {
        if (!this.touchState.isDragging || this.touchState.activeCard !== card) return;
        this.touchState.isDragging = false;
        card.classList.remove('is-dragging');

        try { card.releasePointerCapture(e.pointerId); } catch(err) {}

        const deltaX = this.touchState.currentX - this.touchState.startX;
        const deltaY = this.touchState.currentY - this.touchState.startY;
        const duration = performance.now() - this.touchState.startTime;
        const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const velocityX = Math.abs(deltaX) / Math.max(duration, 1);

        const dismissThreshold = 85;
        const velocityThreshold = 0.40;
        // Intuitive tap detection: quick tap with minimal movement (<16px in <320ms)
        const isQuickTap = dist < 16 && duration < 320;

        if (Math.abs(deltaX) > dismissThreshold || velocityX > velocityThreshold || isQuickTap) {
          // Dismiss photograph
          const dir = isQuickTap ? 1 : (deltaX > 0 ? 1 : -1);
          this.dismissActivePhoto(card, dir);
        } else {
          // Spring back smoothly to position
          const rot = card.dataset.rot || 0;
          card.style.transform = `translate3d(0, 0, 0) rotate(${rot}deg) scale(1)`;
          this.triggerHaptic([10]);
        }
      };

      card.addEventListener('pointerdown', onPointerDown);
      card.addEventListener('pointermove', onPointerMove);
      card.addEventListener('pointerup', onPointerUp);
      card.addEventListener('pointercancel', onPointerUp);
    }

    dismissActivePhoto(card, direction) {
      if (this.sound) this.sound.playPaperSlide();
      this.triggerHaptic([20, 30]);

      const flyOutX = direction * (window.innerWidth + 200);
      const flyOutRot = direction * 35;
      card.style.transition = 'transform 0.65s var(--ease-cinematic), opacity 0.5s';
      card.style.transform = `translate3d(${flyOutX}px, 40px, 0) rotate(${flyOutRot}deg)`;
      card.style.opacity = '0';
      card.style.pointerEvents = 'none';

      this.activePhotoIndex++;

      const cards = document.querySelectorAll('.physical-photo');
      if (this.activePhotoIndex < cards.length) {
        const nextCard = cards[this.activePhotoIndex];
        nextCard.classList.add('is-active');
        nextCard.style.transform = `translate3d(0, 0, 0) rotate(${nextCard.dataset.rot}deg) scale(1)`;
        this.bindPhotoPhysics(nextCard);
        this.updatePhotoCaption(this.activePhotoIndex);
      } else {
        // All photos viewed -> Transition to montage
        const captionBox = document.getElementById('photoCaptionReveal');
        if (captionBox) captionBox.classList.remove('visible');

        setTimeout(() => {
          this.goToScene(SCENES.MONTAGE);
        }, 750);
      }
    }

    /* ==========================================================================
       SCENE 5: FLASHBACK MONTAGE (Dynamic Flashback & Collage)
       ========================================================================== */
    playMontageSequence() {
      const statement = document.getElementById('montageStatement');
      const stage = document.getElementById('montageStage');
      const flash = document.getElementById('opticalFlash');
      if (!stage) return;

      const memories = this.config.memories || [];
      if (!memories.length) {
        this.goToScene(SCENES.CHOICE);
        return;
      }

      // Pre-render ALL cards into the stage so bitmaps are already decoded and cached
      stage.innerHTML = '';
      stage.classList.remove('collage-mode');
      stage.style.opacity = '1';
      stage.style.visibility = 'visible';

      const cardElements = memories.map((mem, idx) => {
        const card = document.createElement('div');
        card.className = 'montage-card';
        card.dataset.index = idx;
        const rot = (Math.sin(idx * 2.3) * 6.5).toFixed(1);
        card.style.setProperty('--card-rot', `${rot}deg`);

        const img = document.createElement('img');
        img.className = 'montage-card-img';
        img.src = mem.image;
        img.alt = mem.caption || `Memory ${idx + 1}`;
        img.onerror = () => {
          img.src = "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80";
        };

        const cap = document.createElement('div');
        cap.className = 'montage-card-caption';
        cap.textContent = mem.caption || '';

        card.appendChild(img);
        if (mem.caption) card.appendChild(cap);
        stage.appendChild(card);
        return card;
      });

      // 1. Show statement
      if (statement) {
        statement.textContent = this.config.montageText || "Look at everything you've already lived.";
        statement.classList.add('visible');
      }

      // 2. Run the photographic shutter sequence
      setTimeout(() => {
        if (statement) statement.classList.remove('visible');

        let currentIndex = 0;
        const totalSteps = memories.length;

        const showNextCard = () => {
          if (this.currentScene !== SCENES.MONTAGE) return;

          if (currentIndex >= totalSteps) {
            // Finale: Brief layered memory collage
            this.showMontageFinale(cardElements, () => {
              if (stage) stage.style.opacity = '0';
              setTimeout(() => {
                this.goToScene(SCENES.CHOICE);
              }, 700);
            });
            return;
          }

          // Toggle active card
          cardElements.forEach((c, i) => {
            if (i !== currentIndex) c.classList.remove('active');
          });

          const currentCard = cardElements[currentIndex];
          if (currentCard) {
            currentCard.classList.add('active');
          }

          // Shutter Sound + Haptic feedback
          if (this.sound) this.sound.playShutterFlash();
          this.triggerHaptic([35]);

          // Warm optical lens flare burst
          if (flash) {
            flash.style.opacity = '0.75';
            setTimeout(() => { flash.style.opacity = '0'; }, 100);
          }

          currentIndex++;
          setTimeout(showNextCard, 440);
        };

        setTimeout(showNextCard, 420);
      }, 1900);
    }

    showMontageFinale(cardElements, onComplete) {
      const stage = document.getElementById('montageStage');
      if (!stage || !cardElements.length) {
        if (onComplete) onComplete();
        return;
      }

      stage.classList.add('collage-mode');

      // Layer up to 4 cards in an artistic fan-out collage
      const count = Math.min(cardElements.length, 4);
      const offsets = [
        { x: -28, y: -18, rot: -7, z: 20 },
        { x: 28, y: -10, rot: 6, z: 21 },
        { x: -16, y: 22, rot: -3, z: 22 },
        { x: 20, y: 16, rot: 5, z: 23 }
      ];

      for (let i = 0; i < count; i++) {
        const c = cardElements[cardElements.length - 1 - i];
        if (c) {
          const pos = offsets[i % offsets.length];
          c.classList.add('active');
          c.style.zIndex = pos.z;
          c.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) rotate(${pos.rot}deg) scale(0.86)`;
        }
      }

      // Hold the collage for 1.4s then advance
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 1400);
    }

    /* ==========================================================================
       SCENE 6: THE CHOICE
       ========================================================================== */
    buildChoiceArena() {
      const arena = document.getElementById('floatingWordsArena');
      if (!arena) return;

      arena.innerHTML = '';
      const choices = this.config.choices || [];

      choices.forEach((c, idx) => {
        const item = document.createElement('div');
        item.className = 'floating-word-item';
        item.id = `choice-${c.id}`;
        item.dataset.id = c.id;
        item.dataset.index = idx;
        
        // Offset positions
        item.style.transform = `translate(${c.xOffset * 4.2}px, ${c.yOffset * 3.8}px)`;

        const span = document.createElement('span');
        span.textContent = c.label;
        item.appendChild(span);

        item.addEventListener('click', () => this.handleChoiceSelection(c, idx));
        arena.appendChild(item);
      });
    }

    setupChoiceScene() {
      this.selectedChoice = null;
      const respEl = document.getElementById('choiceResponse');
      const continueBtn = document.getElementById('choiceContinueBtn');

      if (respEl) {
        respEl.classList.remove('visible');
        respEl.textContent = '';
      }
      if (continueBtn) {
        continueBtn.classList.remove('visible');
      }

      // Re-position choice items with gentle floating
      document.querySelectorAll('.floating-word-item').forEach(item => {
        item.classList.remove('selected', 'dismissed');
      });
    }

    handleChoiceSelection(choice, index) {
      if (this.selectedChoice) return;
      this.selectedChoice = choice;

      if (this.sound) this.sound.playChoiceResonance(index);
      this.triggerHaptic([25, 40]);

      const items = document.querySelectorAll('.floating-word-item');
      items.forEach(item => {
        if (item.dataset.id === choice.id) {
          item.classList.add('selected');
        } else {
          item.classList.add('dismissed');
        }
      });

      const respEl = document.getElementById('choiceResponse');
      const continueBtn = document.getElementById('choiceContinueBtn');

      setTimeout(() => {
        if (respEl) {
          respEl.textContent = `“${choice.response}”`;
          respEl.classList.add('visible');
        }
        if (continueBtn) {
          setTimeout(() => {
            continueBtn.classList.add('visible');
          }, 1200);
        }
      }, 500);
    }

    /* ==========================================================================
       SCENE 7: FINAL BUILDUP
       ========================================================================== */
    playBuildupSequence() {
      const container = document.getElementById('buildupContainer');
      container.innerHTML = '';

      const lines = this.config.buildupLines || [
        "Whatever happens…",
        "…make it yours."
      ];

      const elements = lines.map((txt, idx) => {
        const p = document.createElement('p');
        p.className = 'buildup-line' + (idx === lines.length - 1 ? ' accent' : '');
        p.textContent = txt;
        container.appendChild(p);
        return p;
      });

      setTimeout(() => {
        if (elements[0]) elements[0].classList.add('visible');
      }, 400);

      setTimeout(() => {
        if (elements[1]) elements[1].classList.add('visible');
        this.triggerHaptic([25]);
      }, 2400);

      setTimeout(() => {
        this.goToScene(SCENES.REVEAL);
      }, 4800);
    }

    /* ==========================================================================
       SCENE 8: THE REVEAL (CLIMAX)
       ========================================================================== */
    playRevealClimax() {
      // Climax Sound Swell
      if (this.sound) {
        this.sound.playClimaxSwell();

        // Start emotional music-box Birthday Song Theme as the reveal blooms
        setTimeout(() => {
          if (this.currentScene === SCENES.REVEAL && this.sound) {
            this.sound.playBirthdayMelody({ loop: true });
          }
        }, 1100);
      }

      // Deep Haptic Swell
      this.triggerHaptic([40, 80, 50, 90, 60]);

      // Particle Bloom
      if (this.particleEngine) {
        this.particleEngine.triggerClimaxBloom();
        setTimeout(() => {
          this.particleEngine.triggerClimaxBloom();
        }, 1200);
      }
    }

    /* ==========================================================================
       RESET / REPLAY
       ========================================================================== */
    replayExperience() {
      this.triggerHaptic([20]);
      if (this.sound) {
        this.sound.stopBirthdayMelody();
      }
      if (this.particleEngine) {
        this.particleEngine.reset();
      }
      this.activePhotoIndex = 0;
      this.selectedChoice = null;

      // Rebuild components
      this.buildPhotoDeck();
      this.buildChoiceArena();

      // Return to Scene Wake
      this.goToScene(SCENES.WAKE);
    }

    /* ==========================================================================
       GLOBAL EVENT BINDINGS
       ========================================================================== */
    bindGlobalEvents() {
      // Audio Mute Toggle
      if (this.audioBtn) {
        this.audioBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.sound) {
            const isMuted = this.sound.toggleMute();
            this.audioBtn.classList.toggle('muted', isMuted);
            this.audioBtn.querySelector('svg').style.opacity = isMuted ? '0.4' : '1';
          }
        });
      }

      // Choice Continue button
      const choiceBtn = document.getElementById('choiceContinueBtn');
      if (choiceBtn) {
        choiceBtn.addEventListener('click', () => {
          this.goToScene(SCENES.BUILDUP);
        });
      }

      // Replay Button
      const replayBtn = document.getElementById('replayBtn');
      if (replayBtn) {
        replayBtn.addEventListener('click', () => {
          this.replayExperience();
        });
      }

      // Customization Drawer Triggers
      if (this.customBtn) {
        this.customBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openCustomizer();
        });
      }

      // Theme Selector Chips in Creator Studio
      document.querySelectorAll('.theme-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const theme = chip.dataset.theme;
          this.applyTheme(theme);
          this.config.activeTheme = theme;
          this.triggerHaptic([15]);
          this.showToast(`Theme switched: ${theme}`);
        });
      });

      // Generate Customer Link Button
      const copyBtn = document.getElementById('copyCustomerLinkBtn');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          this.generateAndCopyCustomerLink();
        });
      }

      // Discreet Creator Unlock on Signoff (Tap 3 times)
      const signoff = document.getElementById('revealSignoff');
      if (signoff) {
        signoff.addEventListener('click', () => {
          this.signoffTapCount++;
          if (this.signoffTapCount >= 3) {
            this.signoffTapCount = 0;
            this.openPasscodeModal();
          }
        });
      }

      // Passcode Modal Controls
      const passcodeSubmit = document.getElementById('passcodeSubmitBtn');
      const passcodeCancel = document.getElementById('passcodeCancelBtn');
      const passcodeInput = document.getElementById('creatorPasscodeInput');

      if (passcodeSubmit) {
        passcodeSubmit.addEventListener('click', () => {
          const pin = passcodeInput.value.trim();
          const expected = this.config.creatorPasscode || '1234';
          if (pin === expected) {
            this.unlockCreatorMode();
          } else {
            this.showToast('Incorrect PIN');
            passcodeInput.value = '';
          }
        });
      }

      if (passcodeCancel) {
        passcodeCancel.addEventListener('click', () => {
          this.closePasscodeModal();
        });
      }

      // Clear Demo Stock Photos Button
      const btnClear = document.getElementById('btnClearStock');
      if (btnClear) {
        btnClear.addEventListener('click', () => {
          if (confirm('Clear demo photos and start with a blank deck?')) {
            this.config.memories = [];
            this.renderPhotosManager();
            this.buildPhotoDeck();
            this.showToast('Demo photos cleared. Add yours!');
          }
        });
      }

      // Multi-Photo Upload Trigger
      const btnAddFiles = document.getElementById('btnAddPhotoFiles');
      const fileInput = document.getElementById('multiPhotoFileInput');
      if (btnAddFiles && fileInput) {
        btnAddFiles.addEventListener('click', () => {
          fileInput.click();
        });

        fileInput.addEventListener('change', async (e) => {
          const files = Array.from(e.target.files || []);
          if (!files.length) return;

          this.showToast(`Optimizing ${files.length} photo(s)...`);
          let added = 0;

          // If user currently only has the 4 default stock photos, offer to replace or add
          for (let i = files.length - 1; i >= 0; i--) {
            const file = files[i];
            try {
              const dataUrl = await this.compressImage(file, 720, 0.78);
              // Prepend so newly uploaded photo appears immediately on top of the deck!
              this.config.memories.unshift({
                id: Date.now() + Math.floor(Math.random() * 10000) + i,
                image: dataUrl,
                caption: "Another moment to remember.",
                subcaption: "Captured in time",
                rotation: (Math.random() - 0.5) * 5
              });
              added++;
            } catch (err) {
              console.warn('Failed to compress image:', err);
            }
          }

          fileInput.value = '';
          this.renderPhotosManager();
          this.buildPhotoDeck();
          this.showToast(`✓ Added ${added} photo(s) to top of deck!`);
        });
      }

      // Add Photo via URL
      const btnAddUrl = document.getElementById('btnAddPhotoUrl');
      if (btnAddUrl) {
        btnAddUrl.addEventListener('click', () => {
          const url = prompt('Enter direct image URL (https://...):');
          if (url && url.startsWith('http')) {
            this.config.memories.unshift({
              id: Date.now(),
              image: url.trim(),
              caption: "A moment worth keeping.",
              subcaption: "Special memory",
              rotation: (Math.random() - 0.5) * 5
            });
            this.renderPhotosManager();
            this.buildPhotoDeck();
            this.showToast('✓ Photo added to top of deck!');
          }
        });
      }

      // Export Standalone HTML Gift
      const exportBtn = document.getElementById('exportStandaloneBtn');
      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          this.exportStandaloneHtmlGift();
        });
      }

      // Drawer Close & Save Form
      if (this.drawerClose) {
        this.drawerClose.addEventListener('click', () => {
          this.closeCustomizer();
        });
      }

      if (this.drawerForm) {
        this.drawerForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleSaveCustomizer();
        });
      }

      // Keyboard Shortcut 'E' on Desktop to edit (if creator)
      window.addEventListener('keydown', (e) => {
        if (e.key === 'e' || e.key === 'E') {
          if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            if (this.isCreator) {
              this.openCustomizer();
            } else {
              this.openPasscodeModal();
            }
          }
        }
      });
    }

    async exportStandaloneHtmlGift() {
      try {
        const name = (document.getElementById('editRecipientName').value.trim() || this.config.recipientName).toUpperCase();
        const exportConfig = {
          recipientName: name,
          birthdayTitle: document.getElementById('editBirthdayTitle').value.trim() || this.config.birthdayTitle,
          birthdayMessage: document.getElementById('editBirthdayMessage').value.trim() || this.config.birthdayMessage,
          birthdaySignoff: this.config.birthdaySignoff,
          activeTheme: this.config.activeTheme || 'golden-celebration',
          themes: this.config.themes,
          introGreeting: this.config.introGreeting,
          introPrompt: this.config.introPrompt,
          wishLines: this.config.wishLines,
          montageText: this.config.montageText,
          choices: this.config.choices,
          buildupLines: this.config.buildupLines,
          memories: this.config.memories,
          audio: this.config.audio
        };

        // Attempt to fetch local files to inline them for 100% true single-file offline delivery
        let styleTag = '<link rel="stylesheet" href="style.css">';
        let scriptsTag = `
  <script src="audio.js"></script>
  <script src="particles.js"></script>
  <script src="script.js"></script>`;

        try {
          const [css, audioCode, partCode, scriptCode] = await Promise.all([
            fetch('style.css').then(r => r.ok ? r.text() : '').catch(() => ''),
            fetch('audio.js').then(r => r.ok ? r.text() : '').catch(() => ''),
            fetch('particles.js').then(r => r.ok ? r.text() : '').catch(() => ''),
            fetch('script.js').then(r => r.ok ? r.text() : '').catch(() => '')
          ]);

          if (css && audioCode && partCode && scriptCode) {
            styleTag = `<style>\n${css}\n</style>`;
            scriptsTag = `
  <script>\n${audioCode}\n</script>
  <script>\n${partCode}\n</script>
  <script>\n${scriptCode}\n</script>`;
          }
        } catch (bundleErr) {
          // If running under strict file:// security, keep standard script references
        }

        // Clean body without creator panel / admin state
        const cleanBody = document.body.outerHTML
          .replace(/class="[^"]*is-creator[^"]*"/g, '')
          .replace(/<div class="custom-drawer"[^>]*>[\s\S]*?<\/div>\s*<!-- Passcode/m, '<!-- Passcode');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Someone made something for you.</title>
  <meta name="description" content="Open this when you have a minute.">
  <meta name="theme-color" content="#090706">
  ${styleTag}
  <script>
    window.EXPERIENCE_CONFIG = ${JSON.stringify(exportConfig)};
  </script>
</head>
${cleanBody}
${scriptsTag}
</html>`;

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `birthday-gift-${name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'special'}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);

        this.showToast('✓ Standalone HTML Gift downloaded!');
      } catch (e) {
        console.error('Export error:', e);
        this.showToast('Could not export standalone file');
      }
    }

    openPasscodeModal() {
      const modal = document.getElementById('passcodeOverlay');
      const input = document.getElementById('creatorPasscodeInput');
      if (modal) {
        modal.classList.add('open');
        if (input) {
          input.value = '';
          setTimeout(() => input.focus(), 150);
        }
      }
    }

    closePasscodeModal() {
      const modal = document.getElementById('passcodeOverlay');
      if (modal) modal.classList.remove('open');
    }

    unlockCreatorMode() {
      this.isCreator = true;
      sessionStorage.setItem('birthday_gift_is_creator', 'true');
      document.body.classList.add('is-creator');
      this.closePasscodeModal();
      this.showToast('Creator Studio Unlocked');
      this.openCustomizer();
    }

    showToast(msg) {
      const toast = document.getElementById('toastNotice');
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }

    generateAndCopyCustomerLink() {
      // Save current input values first
      const name = document.getElementById('editRecipientName').value.trim() || this.config.recipientName;
      const title = document.getElementById('editBirthdayTitle').value.trim() || this.config.birthdayTitle;
      const msg = document.getElementById('editBirthdayMessage').value.trim() || this.config.birthdayMessage;

      const payload = {
        recipientName: name,
        birthdayTitle: title,
        birthdayMessage: msg,
        activeTheme: this.config.activeTheme || 'golden-celebration',
        memories: this.config.memories.map(m => ({
          id: m.id,
          image: m.image,
          caption: m.caption,
          subcaption: m.subcaption,
          rotation: m.rotation
        }))
      };

      try {
        const jsonStr = JSON.stringify(payload);
        const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
        const baseUrl = window.location.href.split('#')[0].split('?')[0];
        const customerUrl = `${baseUrl}#g=${encoded}`;

        if (encoded.length > 8192) {
          this.showToast('Note: Large photos embedded. "Export HTML File" recommended for instant delivery!');
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(customerUrl).then(() => {
            this.showToast('✓ Protected customer link copied!');
          }).catch(() => {
            prompt('Copy this link for your customer:', customerUrl);
          });
        } else {
          prompt('Copy this link for your customer:', customerUrl);
        }
      } catch (err) {
        console.error('Error creating customer link:', err);
        this.showToast('Could not generate customer link');
      }
    }

    openCustomizer() {
      if (!this.customDrawer) return;
      document.getElementById('editRecipientName').value = this.config.recipientName;
      document.getElementById('editBirthdayTitle').value = this.config.birthdayTitle;
      document.getElementById('editBirthdayMessage').value = this.config.birthdayMessage;
      
      // Update theme chips
      document.querySelectorAll('.theme-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.theme === (this.config.activeTheme || 'golden-celebration'));
      });

      this.customDrawer.classList.add('open');
    }

    closeCustomizer() {
      if (!this.customDrawer) return;
      this.customDrawer.classList.remove('open');
    }

    handleSaveCustomizer() {
      const name = document.getElementById('editRecipientName').value.trim();
      const title = document.getElementById('editBirthdayTitle').value.trim();
      const msg = document.getElementById('editBirthdayMessage').value.trim();

      const newSettings = {
        recipientName: name || this.config.recipientName,
        birthdayTitle: title || this.config.birthdayTitle,
        birthdayMessage: msg || this.config.birthdayMessage,
        activeTheme: this.config.activeTheme || 'golden-celebration',
        memories: this.config.memories
      };

      this.savePersonalization(newSettings);
      this.closeCustomizer();
      this.showToast('Changes saved! Replaying live preview...');
      this.replayExperience();
    }
  }

  // Initialize on load
  window.addEventListener('DOMContentLoaded', () => {
    window.director = new ExperienceDirector();
  });
})();
