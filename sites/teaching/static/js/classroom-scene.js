    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
    
    // =========================================================================
    // 1. GLOBAL STATE & CONFIGURATION
    // =========================================================================
    const STATE = {
      lessonIndex: 0,
      classroomLightOn: true,
      autoRotate: false,
      activeCamPreset: 'iso',
      isCustomModelActive: false,
      lessonDialTargetRot: 0,
      lightDialTargetRot: 0.45,
      teacherWaveTimer: 0,
      hoveredInteractive: null,
    };

    const CAMERA_PRESETS = {
      iso: {
        pos: new THREE.Vector3(5.6, 4.35, 7.6),
        target: new THREE.Vector3(0.0, 2.55, 0.0),
      },
      teacher: {
        pos: new THREE.Vector3(-0.35, 2.58, 3.35),
        target: new THREE.Vector3(-0.62, 2.38, -0.35),
      },
      side: {
        pos: new THREE.Vector3(7.9, 3.25, 2.85),
        target: new THREE.Vector3(-0.15, 2.52, 0.0),
      },
    };

    // Smooth camera transition state
    const camTransition = {
      active: false,
      progress: 0,
      duration: 0.95,
      startPos: new THREE.Vector3(),
      endPos: new THREE.Vector3(),
      startTarget: new THREE.Vector3(),
      endTarget: new THREE.Vector3(),
    };

    // =========================================================================
    // 2. SUBTLE SYNTHESIZED WEB AUDIO FEEDBACK (ZERO EXTERNAL URLS)
    // =========================================================================
    let audioCtx = null;
    function playClickSound(pitch = 420, type = 'dial') {
      try {
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type === 'dial' ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(pitch, now);
        osc.frequency.exponentialRampToValueAtTime(pitch * 0.45, now + 0.065);

        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.075);
      } catch (_) {
        // Ignore if browser blocks audio before user interaction
      }
    }

    // =========================================================================
    // 3. PROCEDURAL CANVAS2D TEXTURE GENERATORS
    // =========================================================================

    /**
     * Generates rich walnut/teak wood grain texture + subtle bump texture
     */
    function createWoodTextures(baseHex = '#7c4c29', grainHex = '#593318', highlightHex = '#945f37', repeatX = 1, repeatY = 1) {
      const width = 512;
      const height = 512;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = baseHex;
      ctx.fillRect(0, 0, width, height);

      // Subtle horizontal & organic wood fibers
      for (let y = 0; y < height; y += 2) {
        const wave = Math.sin(y * 0.045) * 6 + Math.cos(y * 0.015) * 10;
        ctx.strokeStyle = y % 6 === 0 ? grainHex : highlightHex;
        ctx.globalAlpha = y % 6 === 0 ? 0.22 : 0.12;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(width * 0.33, y + wave, width * 0.66, y - wave, width, y);
        ctx.stroke();
      }

      // Fine organic grain speckles
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = grainHex;
      for (let i = 0; i < 1600; i++) {
        const gx = (i * 73) % width;
        const gy = (i * 137) % height;
        ctx.fillRect(gx, gy, 14, 1.5);
      }

      const map = new THREE.CanvasTexture(canvas);
      map.colorSpace = THREE.SRGBColorSpace;
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(repeatX, repeatY);
      return map;
    }

    /**
     * Generates warm hardwood classroom floor planks texture
     */
    function createFloorPlankTexture() {
      const w = 512;
      const h = 512;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');

      const plankColors = ['#c99663', '#be8a56', '#d19f6c', '#b7824f'];
      const rows = 8;
      const rowH = h / rows;

      for (let r = 0; r < rows; r++) {
        const y = r * rowH;
        ctx.fillStyle = plankColors[r % plankColors.length];
        ctx.fillRect(0, y, w, rowH);

        // Subtle grain inside each plank
        ctx.fillStyle = 'rgba(90, 52, 22, 0.09)';
        for (let g = 0; g < 18; g++) {
          ctx.fillRect((g * 47 + r * 29) % w, y + ((g * 13) % rowH), 48, 1.5);
        }

        // Plank horizontal seam
        ctx.fillStyle = 'rgba(72, 41, 18, 0.35)';
        ctx.fillRect(0, y, w, 2);

        // Staggered vertical plank joint
        const jointX = ((r * 190) + 120) % w;
        ctx.fillRect(jointX, y, 2.5, rowH);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
      return tex;
    }

    /**
     * Generates the 4 interactive Chalkboard Lessons on a crisp 1024x600 Canvas
     */
    const LESSONS = [
      {
        title: 'Math',
        draw(ctx, w, h) {
          ctx.fillStyle = 'rgba(255,255,255,0.92)';
          ctx.font = 'bold 48px "Fredoka", sans-serif';
          ctx.fillText('Mathematics 101', 64, 84);

          // Chalk underline
          ctx.strokeStyle = 'rgba(255, 224, 130, 0.85)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(64, 100);
          ctx.lineTo(445, 104);
          ctx.stroke();

          // Equations
          ctx.fillStyle = 'rgba(255,255,255,0.94)';
          ctx.font = 'bold 58px "Fredoka", sans-serif';
          ctx.fillText('2 + 2 = 4', 76, 195);

          ctx.fillStyle = '#ffe082';
          ctx.font = 'bold 46px "Fredoka", sans-serif';
          ctx.fillText('a² + b² = c²', 76, 285);

          ctx.fillStyle = '#a5f3fc';
          ctx.font = 'bold 40px "Fredoka", sans-serif';
          ctx.fillText('π ≈ 3.14159', 76, 372);

          ctx.fillStyle = '#fbcfe8';
          ctx.font = '34px "Fredoka", sans-serif';
          ctx.fillText('E = mc²   ★ Great Job!', 76, 458);

          // Right-side Pythagorean Right Triangle Diagram
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(620, 390);
          ctx.lineTo(880, 390);
          ctx.lineTo(880, 175);
          ctx.closePath();
          ctx.stroke();

          // Right angle box
          ctx.strokeRect(855, 365, 25, 25);

          // Side labels
          ctx.fillStyle = '#ffe082';
          ctx.font = 'bold 38px "Fredoka", sans-serif';
          ctx.fillText('a', 900, 295);
          ctx.fillText('b', 740, 432);
          ctx.fillStyle = '#86efac';
          ctx.fillText('c', 715, 265);

          // Cute chalk star
          drawChalkStar(ctx, 520, 150, 24, '#fde047');
        },
      },
      {
        title: 'ABCs',
        draw(ctx, w, h) {
          ctx.fillStyle = '#fde68a';
          ctx.font = 'bold 48px "Fredoka", sans-serif';
          ctx.fillText('Alphabet & Reading', 64, 84);

          ctx.strokeStyle = 'rgba(255,255,255,0.75)';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(64, 102);
          ctx.lineTo(525, 102);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 62px "Fredoka", sans-serif';
          ctx.fillText('A  B  C  D  E  F  G', 72, 198);

          ctx.fillStyle = '#93c5fd';
          ctx.font = 'bold 42px "Fredoka", sans-serif';
          ctx.fillText('Vowels:  A • E • I • O • U', 72, 285);

          ctx.fillStyle = '#fca5a5';
          ctx.font = 'bold 42px "Fredoka", sans-serif';
          ctx.fillText('"A is for Apple"', 72, 375);

          ctx.fillStyle = 'rgba(255,255,255,0.88)';
          ctx.font = '34px "Fredoka", sans-serif';
          ctx.fillText('Read a book every day!', 72, 455);

          // Sketched Chalk Apple + Open Book on Right
          ctx.strokeStyle = '#fca5a5';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(780, 285, 68, 0, Math.PI * 2);
          ctx.stroke();
          // Leaf & stem
          ctx.strokeStyle = '#86efac';
          ctx.beginPath();
          ctx.moveTo(780, 217);
          ctx.quadraticCurveTo(800, 180, 825, 195);
          ctx.stroke();

          drawChalkStar(ctx, 885, 155, 22, '#fde047');
        },
      },
      {
        title: 'Space',
        draw(ctx, w, h) {
          ctx.fillStyle = '#a5f3fc';
          ctx.font = 'bold 48px "Fredoka", sans-serif';
          ctx.fillText('Astronomy & Space', 64, 84);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 38px "Fredoka", sans-serif';
          ctx.fillText('• Earth orbits the Sun', 68, 175);
          ctx.fillText('• 8 Planets in Solar System', 68, 245);
          ctx.fillStyle = '#fde047';
          ctx.fillText('• Gravity keeps us grounded!', 68, 315);
          ctx.fillStyle = '#fbcfe8';
          ctx.fillText('• Speed of Light: 300,000 km/s', 68, 385);

          // Chalk Sun with rays
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(785, 210, 48, 0, Math.PI * 2);
          ctx.stroke();
          for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(785 + Math.cos(a) * 60, 210 + Math.sin(a) * 60);
            ctx.lineTo(785 + Math.cos(a) * 78, 210 + Math.sin(a) * 78);
            ctx.stroke();
          }

          // Ringed Saturn below Sun
          ctx.strokeStyle = '#93c5fd';
          ctx.beginPath();
          ctx.arc(760, 395, 34, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(760, 395, 74, 18, -0.32, 0, Math.PI * 2);
          ctx.stroke();

          drawChalkStar(ctx, 645, 165, 18, '#ffffff');
          drawChalkStar(ctx, 905, 345, 20, '#fde047');
        },
      },
      {
        title: 'Music & Art',
        draw(ctx, w, h) {
          ctx.fillStyle = '#fbcfe8';
          ctx.font = 'bold 48px "Fredoka", sans-serif';
          ctx.fillText('Music & Color Theory', 64, 84);

          // Musical staff lines
          ctx.strokeStyle = 'rgba(255,255,255,0.75)';
          ctx.lineWidth = 3;
          for (let i = 0; i < 5; i++) {
            const ly = 155 + i * 22;
            ctx.beginPath();
            ctx.moveTo(70, ly);
            ctx.lineTo(540, ly);
            ctx.stroke();
          }

          // Sketched musical notes
          ctx.fillStyle = '#fde047';
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 5;
          const notes = [
            [150, 221],
            [235, 199],
            [320, 177],
            [425, 199],
          ];
          notes.forEach(([nx, ny]) => {
            ctx.beginPath();
            ctx.ellipse(nx, ny, 14, 10, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(nx + 12, ny);
            ctx.lineTo(nx + 12, ny - 55);
            ctx.stroke();
          });

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 38px "Fredoka", sans-serif';
          ctx.fillText('Red + Yellow = Orange', 70, 345);
          ctx.fillStyle = '#86efac';
          ctx.fillText('Blue + Yellow = Green', 70, 412);
          ctx.fillStyle = '#c4b5fd';
          ctx.fillText('Red + Blue = Violet', 70, 476);

          // Artist palette sketch on right
          ctx.strokeStyle = '#fde68a';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.ellipse(785, 310, 105, 80, 0.2, 0, Math.PI * 2);
          ctx.stroke();
          const dots = ['#fca5a5', '#fde047', '#93c5fd', '#86efac'];
          dots.forEach((col, idx) => {
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(735 + idx * 34, 290 + (idx % 2) * 35, 14, 0, Math.PI * 2);
            ctx.fill();
          });
        },
      },
    ];

    function drawChalkStar(ctx, cx, cy, r, color) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? r : r * 0.45;
        const ang = (i * Math.PI) / 5 - Math.PI / 2;
        const x = cx + Math.cos(ang) * rad;
        const y = cy + Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    const chalkboardCanvas = document.createElement('canvas');
    chalkboardCanvas.width = 1024;
    chalkboardCanvas.height = 580;
    const chalkboardCtx = chalkboardCanvas.getContext('2d');
    const chalkboardTexture = new THREE.CanvasTexture(chalkboardCanvas);
    chalkboardTexture.colorSpace = THREE.SRGBColorSpace;

    function renderChalkboardLesson(index) {
      const w = chalkboardCanvas.width;
      const h = chalkboardCanvas.height;
      const ctx = chalkboardCtx;

      // Deep slate-green chalkboard surface
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#274d3c');
      grad.addColorStop(0.5, '#214233');
      grad.addColorStop(1, '#1b372a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle chalk dust smudge texture
      ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
      for (let i = 0; i < 35; i++) {
        const rx = (i * 193) % w;
        const ry = (i * 97) % h;
        ctx.beginPath();
        ctx.ellipse(rx, ry, 75, 32, (i % 5) * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Inner border line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 4;
      ctx.strokeRect(22, 22, w - 44, h - 44);

      // Draw active lesson
      const lesson = LESSONS[index % LESSONS.length];
      lesson.draw(ctx, w, h);

      chalkboardTexture.needsUpdate = true;
    }

    /**
     * Generates a clean analog classroom clock face texture
     */
    function createClockFaceTexture() {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const c = size / 2;

      ctx.fillStyle = '#fffaf0';
      ctx.beginPath();
      ctx.arc(c, c, c - 4, 0, Math.PI * 2);
      ctx.fill();

      // Minute/hour ticks
      for (let i = 0; i < 60; i++) {
        const ang = (i / 60) * Math.PI * 2;
        const isHour = i % 5 === 0;
        const r1 = isHour ? c - 24 : c - 15;
        const r2 = c - 8;
        ctx.strokeStyle = isHour ? '#2b211a' : '#8c7a6b';
        ctx.lineWidth = isHour ? 4 : 1.8;
        ctx.beginPath();
        ctx.moveTo(c + Math.cos(ang) * r1, c + Math.sin(ang) * r1);
        ctx.lineTo(c + Math.cos(ang) * r2, c + Math.sin(ang) * r2);
        ctx.stroke();
      }

      // Bold 12, 3, 6, 9 numerals
      ctx.fillStyle = '#2b211a';
      ctx.font = 'bold 26px "Fredoka", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('12', c, 44);
      ctx.fillText('3', size - 44, c);
      ctx.fillText('6', c, size - 44);
      ctx.fillText('9', 44, c);

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    /**
     * Generates a cute mini educational poster for the classroom side wall
     */
    function createSidePosterTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 320;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#fff8eb';
      ctx.fillRect(0, 0, 256, 320);

      // Header band
      ctx.fillStyle = '#e07a5f';
      ctx.fillRect(18, 18, 220, 48);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px "Fredoka", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SHAPES & COLORS', 128, 49);

      // Geometric shapes
      ctx.fillStyle = '#3d405b';
      ctx.beginPath();
      ctx.arc(82, 130, 32, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#81b29a';
      ctx.fillRect(142, 98, 64, 64);

      ctx.fillStyle = '#f2cc8f';
      ctx.beginPath();
      ctx.moveTo(128, 195);
      ctx.lineTo(175, 275);
      ctx.lineTo(81, 275);
      ctx.closePath();
      ctx.fill();

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    // =========================================================================
    // 4. THREE.JS SCENE, RENDERER, CAMERA & STUDIO LIGHTING SETUP
    // =========================================================================
    const container = document.getElementById('classroom-scene');
if (!container) throw new Error('classroom scene mount missing');
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.copy(CAMERA_PRESETS.iso.pos);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth || 1, container.clientHeight || 1, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // OrbitControls with smooth damping and sensible limits
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(CAMERA_PRESETS.iso.target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.6;
    controls.maxDistance = 16.5;
    controls.maxPolarAngle = Math.PI * 0.495; // Prevent dipping beneath the studio floor
    controls.minPolarAngle = 0.18;
    controls.update();

    // Cancel auto-transition if user manually grabs OrbitControls
    controls.addEventListener('start', () => {
      camTransition.active = false;
    });

    // Studio Lighting Setup
    const hemiLight = new THREE.HemisphereLight('#fff8eb', '#c79c72', 0.85);
    hemiLight.position.set(0, 12, 0);
    scene.add(hemiLight);

    // Warm Key Directional Light casting crisp-yet-soft studio & interior shadows
    const keyLight = new THREE.DirectionalLight('#fff2dc', 1.65);
    keyLight.position.set(5.2, 7.8, 9.6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 1.5;
    keyLight.shadow.camera.far = 26;
    const d = 6.2;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.022;
    scene.add(keyLight);

    // Subtle cool-warm rim light from back-left to sculpt the rounded wooden TV edges
    const rimLight = new THREE.DirectionalLight('#ffe4bd', 0.55);
    rimLight.position.set(-7.5, 6.0, -5.5);
    scene.add(rimLight);

    // Soft Shadow-Catching Studio Floor Plane (blends invisibly into the cream radial background)
    const shadowFloorGeo = new THREE.PlaneGeometry(36, 36);
    const shadowFloorMat = new THREE.ShadowMaterial({
      color: '#5c3818',
      opacity: 0.24,
    });
    const shadowFloor = new THREE.Mesh(shadowFloorGeo, shadowFloorMat);
    shadowFloor.rotation.x = -Math.PI / 2;
    shadowFloor.position.y = 0;
    shadowFloor.receiveShadow = true;
    scene.add(shadowFloor);

    // =========================================================================
    // 5. BUILD RETRO WOODEN CRT MONITOR & 3D CLASSROOM DIORAMA
    // =========================================================================
    const dioramaRoot = new THREE.Group();
    scene.add(dioramaRoot);

    const interactiveMeshes = [];

    // Shared procedural wood & studio materials
    const walnutWoodTex = createWoodTextures('#7d4c29', '#573116', '#976138', 1.5, 1.5);
    const oakWoodTex = createWoodTextures('#b87c47', '#8f5b2e', '#cc925c', 1, 1);

    const cabinetWoodMat = new THREE.MeshStandardMaterial({
      map: walnutWoodTex,
      roughness: 0.48,
      metalness: 0.05,
    });

    const pedestalWoodMat = new THREE.MeshStandardMaterial({
      map: walnutWoodTex,
      color: '#cfa882',
      roughness: 0.52,
      metalness: 0.05,
    });

    const oakTrimMat = new THREE.MeshStandardMaterial({
      map: oakWoodTex,
      roughness: 0.45,
      metalness: 0.04,
    });

    const darkBezelMat = new THREE.MeshStandardMaterial({
      color: '#25272b',
      roughness: 0.55,
      metalness: 0.15,
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: '#e5e7eb',
      roughness: 0.18,
      metalness: 0.88,
    });

    const brushedBrassMat = new THREE.MeshStandardMaterial({
      color: '#e0b368',
      roughness: 0.32,
      metalness: 0.72,
    });

    // -------------------------------------------------------------------------
    // 5A. RETRO WOODEN TV CABINET EXTERIOR, PEDESTAL, ANTENNAS & DIALS
    // -------------------------------------------------------------------------
    const tvExteriorGroup = new THREE.Group();
    dioramaRoot.add(tvExteriorGroup);

    // 1) Wooden Pedestal Base at bottom (y = 0 to y = 0.44)
    const basePlinth = new THREE.Mesh(new RoundedBoxGeometry(4.1, 0.16, 2.35, 4, 0.06), pedestalWoodMat);
    basePlinth.position.set(0, 0.08, 0.05);
    basePlinth.castShadow = true;
    basePlinth.receiveShadow = true;
    tvExteriorGroup.add(basePlinth);

    const baseNeck = new THREE.Mesh(new RoundedBoxGeometry(3.15, 0.30, 1.75, 4, 0.06), pedestalWoodMat);
    baseNeck.position.set(0, 0.29, 0.02);
    baseNeck.castShadow = true;
    baseNeck.receiveShadow = true;
    tvExteriorGroup.add(baseNeck);

    // 2) Rounded Walnut Cabinet Slabs forming a genuine recessed screen cavity
    // Cabinet outer bounds: W=6.2, H=4.5, D=3.2, centered at y=2.67
    const cabBack = new THREE.Mesh(new RoundedBoxGeometry(6.2, 4.5, 0.56, 5, 0.18), cabinetWoodMat);
    cabBack.position.set(0, 2.67, -1.32);
    cabBack.castShadow = true;
    cabBack.receiveShadow = true;
    tvExteriorGroup.add(cabBack);

    const cabTop = new THREE.Mesh(new RoundedBoxGeometry(6.2, 0.52, 3.2, 5, 0.18), cabinetWoodMat);
    cabTop.position.set(0, 4.66, 0);
    cabTop.castShadow = true;
    cabTop.receiveShadow = true;
    tvExteriorGroup.add(cabTop);

    const cabBottom = new THREE.Mesh(new RoundedBoxGeometry(6.2, 0.52, 3.2, 5, 0.18), cabinetWoodMat);
    cabBottom.position.set(0, 0.68, 0);
    cabBottom.castShadow = true;
    cabBottom.receiveShadow = true;
    tvExteriorGroup.add(cabBottom);

    const cabLeft = new THREE.Mesh(new RoundedBoxGeometry(0.52, 4.5, 3.2, 5, 0.18), cabinetWoodMat);
    cabLeft.position.set(-2.84, 2.67, 0);
    cabLeft.castShadow = true;
    cabLeft.receiveShadow = true;
    tvExteriorGroup.add(cabLeft);

    const cabRight = new THREE.Mesh(new RoundedBoxGeometry(1.38, 4.5, 3.2, 5, 0.18), cabinetWoodMat);
    cabRight.position.set(2.41, 2.67, 0);
    cabRight.castShadow = true;
    cabRight.receiveShadow = true;
    tvExteriorGroup.add(cabRight);

    // 3) Dark Charcoal Inner Screen Bezel Frame (framing x ∈ [-2.58, 1.72], y ∈ [0.94, 4.40])
    const bezelGroup = new THREE.Group();
    const bezelTop = new THREE.Mesh(new RoundedBoxGeometry(4.36, 0.12, 0.24, 3, 0.04), darkBezelMat);
    bezelTop.position.set(-0.43, 4.36, 1.46);
    const bezelBottom = new THREE.Mesh(new RoundedBoxGeometry(4.36, 0.12, 0.24, 3, 0.04), darkBezelMat);
    bezelBottom.position.set(-0.43, 0.98, 1.46);
    const bezelLeft = new THREE.Mesh(new RoundedBoxGeometry(0.12, 3.48, 0.24, 3, 0.04), darkBezelMat);
    bezelLeft.position.set(-2.54, 2.67, 1.46);
    const bezelRight = new THREE.Mesh(new RoundedBoxGeometry(0.12, 3.48, 0.24, 3, 0.04), darkBezelMat);
    bezelRight.position.set(1.68, 2.67, 1.46);
    bezelGroup.add(bezelTop, bezelBottom, bezelLeft, bezelRight);
    tvExteriorGroup.add(bezelGroup);

    // 4) Top V-Shaped Rabbit-Ear Antennas with Chrome Spherical Tips
    const antennaGroup = new THREE.Group();
    antennaGroup.position.set(-0.35, 4.92, -0.15);

    const antennaBase = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.44, 0.16, 24), darkBezelMat);
    antennaBase.position.y = 0.06;
    antennaBase.castShadow = true;
    antennaGroup.add(antennaBase);

    const antennaDome = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), chromeMat);
    antennaDome.position.y = 0.13;
    antennaGroup.add(antennaDome);

    function createRabbitEar(angleZ, angleX, length) {
      const earPivot = new THREE.Group();
      earPivot.position.y = 0.16;
      earPivot.rotation.z = angleZ;
      earPivot.rotation.x = angleX;

      const lowerRod = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.034, length * 0.55, 12), chromeMat);
      lowerRod.position.y = (length * 0.55) / 2;
      lowerRod.castShadow = true;

      const upperRod = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.025, length * 0.5, 12), chromeMat);
      upperRod.position.y = length * 0.52 + (length * 0.5) / 2;
      upperRod.castShadow = true;

      const tipBall = new THREE.Mesh(new THREE.SphereGeometry(0.068, 16, 16), chromeMat);
      tipBall.position.y = length + 0.02;
      tipBall.castShadow = true;

      earPivot.add(lowerRod, upperRod, tipBall);
      return earPivot;
    }

    antennaGroup.add(createRabbitEar(0.56, -0.14, 1.85));
    antennaGroup.add(createRabbitEar(-0.62, 0.12, 1.95));
    tvExteriorGroup.add(antennaGroup);

    // 5) Right-Side Control Panel: Rotary Dials, Speaker Grille & LED Indicators
    const controlPanelGroup = new THREE.Group();
    controlPanelGroup.position.set(2.41, 2.67, 1.56);
    tvExteriorGroup.add(controlPanelGroup);

    // Recessed brushed dark plate
    const panelPlate = new THREE.Mesh(new RoundedBoxGeometry(1.02, 3.72, 0.08, 3, 0.03), darkBezelMat);
    panelPlate.receiveShadow = true;
    controlPanelGroup.add(panelPlate);

    // Helper to build a tactile 3D rotary dial
    function createRotaryDial(yPos, radius, interactiveType, labelHint) {
      const dialHolder = new THREE.Group();
      dialHolder.position.set(0, yPos, 0.05);

      // Metallic trim ring
      const trimRing = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.055, radius + 0.065, 0.04, 28), brushedBrassMat);
      trimRing.rotation.x = Math.PI / 2;
      dialHolder.add(trimRing);

      // Tick marks around dial
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const tick = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.045, 0.02), brushedBrassMat);
        tick.position.set(Math.cos(ang) * (radius + 0.09), Math.sin(ang) * (radius + 0.09), 0.01);
        tick.rotation.z = ang + Math.PI / 2;
        dialHolder.add(tick);
      }

      // Rotating knob assembly
      const knobGroup = new THREE.Group();
      knobGroup.position.z = 0.06;

      const knobBody = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius * 1.04, 0.12, 28),
        new THREE.MeshStandardMaterial({ color: '#3b281c', roughness: 0.38, metalness: 0.15 })
      );
      knobBody.rotation.x = Math.PI / 2;
      knobBody.castShadow = true;
      knobBody.userData = { interactiveType, hint: labelHint };
      interactiveMeshes.push(knobBody);
      knobGroup.add(knobBody);

      // Raised grip bar across the dial face
      const gripBar = new THREE.Mesh(
        new RoundedBoxGeometry(0.065, radius * 1.75, 0.08, 2, 0.02),
        brushedBrassMat
      );
      gripBar.position.z = 0.065;
      gripBar.castShadow = true;
      gripBar.userData = { interactiveType, hint: labelHint };
      interactiveMeshes.push(gripBar);
      knobGroup.add(gripBar);

      dialHolder.add(knobGroup);
      controlPanelGroup.add(dialHolder);
      return knobGroup;
    }

    const lessonDialKnob = createRotaryDial(1.12, 0.28, 'lessonDial', 'Switch Chalkboard Lesson');
    const lightDialKnob = createRotaryDial(0.32, 0.26, 'lightDial', 'Toggle Classroom Lamp');

    // Two tactile indicator buttons below the dials
    const amberBtnMat = new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      emissive: '#d97706',
      emissiveIntensity: 0.45,
      roughness: 0.28,
    });
    const redLedMat = new THREE.MeshStandardMaterial({
      color: '#ef4444',
      emissive: '#dc2626',
      emissiveIntensity: 0.85,
      roughness: 0.25,
    });

    const amberBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.09, 18), amberBtnMat);
    amberBtn.rotation.x = Math.PI / 2;
    amberBtn.position.set(-0.22, -0.26, 0.06);
    amberBtn.userData = { interactiveType: 'lessonDial', hint: 'Switch Lesson' };
    interactiveMeshes.push(amberBtn);
    controlPanelGroup.add(amberBtn);

    const redPowerBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.09, 18), redLedMat);
    redPowerBtn.rotation.x = Math.PI / 2;
    redPowerBtn.position.set(0.22, -0.26, 0.06);
    redPowerBtn.userData = { interactiveType: 'lightDial', hint: 'Toggle Classroom Light' };
    interactiveMeshes.push(redPowerBtn);
    controlPanelGroup.add(redPowerBtn);

    // Louvered Horizontal Speaker Grille Slots at Bottom of Control Panel
    const speakerGroup = new THREE.Group();
    speakerGroup.position.set(0, -1.12, 0.045);
    const grilleBacking = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 1.15, 0.02),
      new THREE.MeshStandardMaterial({ color: '#141517', roughness: 0.9 })
    );
    speakerGroup.add(grilleBacking);

    for (let s = 0; s < 9; s++) {
      const slatY = -0.46 + s * 0.115;
      const slat = new THREE.Mesh(new RoundedBoxGeometry(0.78, 0.048, 0.04, 2, 0.012), brushedBrassMat);
      slat.position.set(0, slatY, 0.015);
      slat.rotation.x = 0.22;
      speakerGroup.add(slat);
    }
    controlPanelGroup.add(speakerGroup);

    // -------------------------------------------------------------------------
    // 5B. RECESSED 3D CLASSROOM DIORAMA (INSIDE THE TV CAVITY)
    // -------------------------------------------------------------------------
    const classroomGroup = new THREE.Group();
    dioramaRoot.add(classroomGroup);

    // Warm Interior Classroom Point Light (illuminates teacher, chalkboard & desk)
    const classroomPointLight = new THREE.PointLight('#ffdfad', 3.4, 7.5, 1.4);
    classroomPointLight.position.set(-0.35, 3.85, 0.55);
    classroomGroup.add(classroomPointLight);

    // Cute ceiling light fixture bulb inside top of cavity
    const ceilingBulbMat = new THREE.MeshStandardMaterial({
      color: '#fff6d6',
      emissive: '#ffcf70',
      emissiveIntensity: 1.4,
      roughness: 0.2,
    });
    const ceilingLampShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.34, 0.12, 20),
      brushedBrassMat
    );
    ceilingLampShade.position.set(-0.35, 4.33, 0.45);
    const ceilingBulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), ceilingBulbMat);
    ceilingBulb.position.set(-0.35, 4.26, 0.45);
    classroomGroup.add(ceilingLampShade, ceilingBulb);

    // 1) Classroom Hardwood Floor, Sage-Mint Walls & Wooden Baseboards
    const sageWallMat = new THREE.MeshStandardMaterial({
      color: '#9ec5b6',
      roughness: 0.78,
      metalness: 0.02,
    });

    const floorMat = new THREE.MeshStandardMaterial({
      map: createFloorPlankTexture(),
      roughness: 0.52,
      metalness: 0.04,
    });

    // Floor top surface sits at y = 1.02
    const roomFloor = new THREE.Mesh(new THREE.BoxGeometry(4.24, 0.08, 2.46), floorMat);
    roomFloor.position.set(-0.43, 0.98, 0.20);
    roomFloor.receiveShadow = true;
    classroomGroup.add(roomFloor);

    // Back wall front face at z = -0.98
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(4.24, 3.38, 0.06), sageWallMat);
    backWall.position.set(-0.43, 2.69, -1.01);
    backWall.receiveShadow = true;
    classroomGroup.add(backWall);

    // Left wall inner face at x = -2.50
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.38, 2.46), sageWallMat);
    leftWall.position.set(-2.53, 2.69, 0.20);
    leftWall.receiveShadow = true;
    classroomGroup.add(leftWall);

    // Right wall inner face at x = 1.64
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.38, 2.46), sageWallMat);
    rightWall.position.set(1.67, 2.69, 0.20);
    rightWall.receiveShadow = true;
    classroomGroup.add(rightWall);

    // Ceiling panel inside cavity
    const ceilingPanel = new THREE.Mesh(
      new THREE.BoxGeometry(4.24, 0.06, 2.46),
      new THREE.MeshStandardMaterial({ color: '#f6ebd8', roughness: 0.85 })
    );
    ceilingPanel.position.set(-0.43, 4.38, 0.20);
    classroomGroup.add(ceilingPanel);

    // Wooden Baseboards along walls
    const backBaseboard = new THREE.Mesh(new THREE.BoxGeometry(4.20, 0.14, 0.05), oakTrimMat);
    backBaseboard.position.set(-0.43, 1.09, -0.96);
    backBaseboard.receiveShadow = true;

    const leftBaseboard = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 2.42), oakTrimMat);
    leftBaseboard.position.set(-2.48, 1.09, 0.20);
    leftBaseboard.receiveShadow = true;

    const rightBaseboard = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 2.42), oakTrimMat);
    rightBaseboard.position.set(1.62, 1.09, 0.20);
    rightBaseboard.receiveShadow = true;

    classroomGroup.add(backBaseboard, leftBaseboard, rightBaseboard);

    // 2) Chalkboard with Oak Frame, Chalk Tray, Colorful Chalk & Eraser
    renderChalkboardLesson(0);
    const boardGroup = new THREE.Group();
    boardGroup.position.set(-0.38, 2.86, -0.95);
    classroomGroup.add(boardGroup);

    const boardWidth = 2.96;
    const boardHeight = 1.68;
    const boardSurface = new THREE.Mesh(
      new THREE.PlaneGeometry(boardWidth, boardHeight),
      new THREE.MeshStandardMaterial({
        map: chalkboardTexture,
        roughness: 0.82,
        metalness: 0.02,
      })
    );
    boardSurface.position.z = 0.025;
    boardSurface.receiveShadow = true;
    boardSurface.userData = { interactiveType: 'lessonDial', hint: 'Click Chalkboard for Next Lesson' };
    interactiveMeshes.push(boardSurface);
    boardGroup.add(boardSurface);

    // Wooden frame bars around chalkboard
    const frameThick = 0.085;
    const frameDepth = 0.07;
    const fTop = new THREE.Mesh(new RoundedBoxGeometry(boardWidth + frameThick * 2, frameThick, frameDepth, 2, 0.015), oakTrimMat);
    fTop.position.set(0, boardHeight / 2 + frameThick / 2, 0.025);
    fTop.castShadow = true;

    const fLeft = new THREE.Mesh(new RoundedBoxGeometry(frameThick, boardHeight, frameDepth, 2, 0.015), oakTrimMat);
    fLeft.position.set(-boardWidth / 2 - frameThick / 2, 0, 0.025);
    fLeft.castShadow = true;

    const fRight = new THREE.Mesh(new RoundedBoxGeometry(frameThick, boardHeight, frameDepth, 2, 0.015), oakTrimMat);
    fRight.position.set(boardWidth / 2 + frameThick / 2, 0, 0.025);
    fRight.castShadow = true;

    // Protruding Chalk Ledge
    const chalkLedge = new THREE.Mesh(new RoundedBoxGeometry(boardWidth + frameThick * 2.2, 0.075, 0.18, 3, 0.02), oakTrimMat);
    chalkLedge.position.set(0, -boardHeight / 2 - 0.035, 0.07);
    chalkLedge.castShadow = true;
    chalkLedge.receiveShadow = true;

    boardGroup.add(fTop, fLeft, fRight, chalkLedge);

    // Colorful Chalk Pieces & Felt Eraser resting on the chalk ledge
    const chalkColors = ['#ffffff', '#fde047', '#f9a8d4', '#93c5fd'];
    chalkColors.forEach((col, i) => {
      const chalk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.13, 10),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.9 })
      );
      chalk.rotation.z = Math.PI / 2;
      chalk.rotation.y = (i - 1.5) * 0.18;
      chalk.position.set(-0.85 + i * 0.24, -boardHeight / 2 + 0.018, 0.11);
      chalk.castShadow = true;
      boardGroup.add(chalk);
    });

    // Chalkboard Eraser
    const eraserGroup = new THREE.Group();
    eraserGroup.position.set(0.88, -boardHeight / 2 + 0.032, 0.105);
    eraserGroup.rotation.y = -0.15;
    const eraserFelt = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.035, 0.09),
      new THREE.MeshStandardMaterial({ color: '#374151', roughness: 0.95 })
    );
    const eraserWood = new THREE.Mesh(
      new RoundedBoxGeometry(0.24, 0.03, 0.09, 2, 0.008),
      oakTrimMat
    );
    eraserWood.position.y = 0.03;
    eraserGroup.add(eraserFelt, eraserWood);
    boardGroup.add(eraserGroup);

    // 3) Side Wall Props: Live Analog Clock, Framed Chart & Mini Bookshelf
    const clockGroup = new THREE.Group();
    clockGroup.position.set(-2.48, 3.45, 0.22);
    clockGroup.rotation.y = Math.PI / 2;
    classroomGroup.add(clockGroup);

    const clockRim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.07, 28), cabinetWoodMat);
    clockRim.rotation.x = Math.PI / 2;
    clockRim.castShadow = true;
    clockGroup.add(clockRim);

    const clockFace = new THREE.Mesh(
      new THREE.CircleGeometry(0.28, 28),
      new THREE.MeshStandardMaterial({ map: createClockFaceTexture(), roughness: 0.45 })
    );
    clockFace.position.z = 0.038;
    clockGroup.add(clockFace);

    // Live animated clock hands
    const handMat = new THREE.MeshStandardMaterial({ color: '#1f2937', roughness: 0.4 });
    const hourHandPivot = new THREE.Group();
    hourHandPivot.position.z = 0.046;
    const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.14, 0.01), handMat);
    hourHand.position.y = 0.055;
    hourHandPivot.add(hourHand);

    const minuteHandPivot = new THREE.Group();
    minuteHandPivot.position.z = 0.052;
    const minuteHand = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.20, 0.01), handMat);
    minuteHand.position.y = 0.085;
    minuteHandPivot.add(minuteHand);

    const secondHandPivot = new THREE.Group();
    secondHandPivot.position.z = 0.058;
    const secondHand = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.22, 0.008),
      new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.3 })
    );
    secondHand.position.y = 0.085;
    secondHandPivot.add(secondHand);

    const centerPin = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), brushedBrassMat);
    centerPin.position.z = 0.062;
    clockGroup.add(hourHandPivot, minuteHandPivot, secondHandPivot, centerPin);

    // Framed Educational Poster on Left Wall
    const posterGroup = new THREE.Group();
    posterGroup.position.set(-2.49, 2.68, 0.85);
    posterGroup.rotation.y = Math.PI / 2;
    const posterFrame = new THREE.Mesh(new RoundedBoxGeometry(0.56, 0.68, 0.03, 2, 0.01), oakTrimMat);
    const posterArt = new THREE.Mesh(
      new THREE.PlaneGeometry(0.48, 0.60),
      new THREE.MeshStandardMaterial({ map: createSidePosterTexture(), roughness: 0.65 })
    );
    posterArt.position.z = 0.018;
    posterGroup.add(posterFrame, posterArt);
    classroomGroup.add(posterGroup);

    // Cute Wall Bookshelf on Left Wall
    const wallShelfGroup = new THREE.Group();
    wallShelfGroup.position.set(-2.38, 2.28, -0.25);
    wallShelfGroup.rotation.y = Math.PI / 2;
    const shelfPlank = new THREE.Mesh(new RoundedBoxGeometry(0.82, 0.045, 0.22, 2, 0.01), oakTrimMat);
    shelfPlank.castShadow = true;
    wallShelfGroup.add(shelfPlank);

    const miniBookColors = ['#e07a5f', '#3d405b', '#f2cc8f', '#81b29a', '#e63946'];
    miniBookColors.forEach((c, idx) => {
      const bH = 0.22 + (idx % 3) * 0.035;
      const miniBook = new THREE.Mesh(
        new RoundedBoxGeometry(0.065, bH, 0.16, 2, 0.008),
        new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 })
      );
      miniBook.position.set(-0.24 + idx * 0.072, bH / 2 + 0.02, 0);
      miniBook.castShadow = true;
      wallShelfGroup.add(miniBook);
    });
    classroomGroup.add(wallShelfGroup);

    // 4) Stylized 3D Teacher Character (with Pointer Stick & Articulated Limbs)
    const teacherRoot = new THREE.Group();
    teacherRoot.position.set(-0.92, 1.02, -0.18);
    teacherRoot.rotation.y = 0.32;
    classroomGroup.add(teacherRoot);

    const skinMat = new THREE.MeshStandardMaterial({ color: '#f6c39c', roughness: 0.58 });
    const hairMat = new THREE.MeshStandardMaterial({ color: '#3b2618', roughness: 0.72 });
    const vestMat = new THREE.MeshStandardMaterial({ color: '#28364a', roughness: 0.68 });
    const slacksMat = new THREE.MeshStandardMaterial({ color: '#242c38', roughness: 0.75 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: '#fcfaf5', roughness: 0.5 });
    const tieMat = new THREE.MeshStandardMaterial({ color: '#d93829', roughness: 0.45 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: '#59361d', roughness: 0.42 });
    const glassesFrameMat = new THREE.MeshStandardMaterial({ color: '#1b1d21', roughness: 0.35, metalness: 0.3 });

    // Shoes & Legs (y = 0 to y = 0.76 relative to floor)
    [-0.115, 0.115].forEach((legX) => {
      const shoe = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.09, 0.24, 3, 0.035), shoeMat);
      shoe.position.set(legX, 0.045, 0.035);
      shoe.castShadow = true;
      teacherRoot.add(shoe);

      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.068, 0.68, 16), slacksMat);
      leg.position.set(legX, 0.42, 0);
      leg.castShadow = true;
      teacherRoot.add(leg);
    });

    // Pelvis / Belt
    const hips = new THREE.Mesh(new RoundedBoxGeometry(0.38, 0.14, 0.24, 3, 0.05), slacksMat);
    hips.position.set(0, 0.77, 0);
    hips.castShadow = true;
    teacherRoot.add(hips);

    // Upper Body Pivot (for breathing animation)
    const teacherTorsoPivot = new THREE.Group();
    teacherTorsoPivot.position.set(0, 0.82, 0);
    teacherRoot.add(teacherTorsoPivot);

    // Sweaters-vest torso
    const torsoMesh = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.56, 0.28, 4, 0.09), vestMat);
    torsoMesh.position.set(0, 0.28, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    teacherTorsoPivot.add(torsoMesh);

    // Crisp White Shirt V-Insert on Chest
    const shirtFront = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.34, 0.04, 2, 0.015), shirtMat);
    shirtFront.position.set(0, 0.37, 0.13);
    teacherTorsoPivot.add(shirtFront);

    // Shirt Collar Flaps
    [-0.065, 0.065].forEach((cx, idx) => {
      const collar = new THREE.Mesh(new RoundedBoxGeometry(0.09, 0.06, 0.05, 2, 0.015), shirtMat);
      collar.position.set(cx, 0.55, 0.125);
      collar.rotation.z = idx === 0 ? -0.35 : 0.35;
      teacherTorsoPivot.add(collar);
    });

    // Bright Red Necktie
    const tieKnot = new THREE.Mesh(new RoundedBoxGeometry(0.065, 0.06, 0.05, 2, 0.015), tieMat);
    tieKnot.position.set(0, 0.50, 0.155);
    const tieBlade = new THREE.Mesh(new RoundedBoxGeometry(0.072, 0.32, 0.03, 2, 0.012), tieMat);
    tieBlade.position.set(0, 0.32, 0.155);
    tieBlade.castShadow = true;
    teacherTorsoPivot.add(tieKnot, tieBlade);

    // Neck & Head Group (for subtle teaching nods)
    const teacherHeadPivot = new THREE.Group();
    teacherHeadPivot.position.set(0, 0.58, 0);
    teacherTorsoPivot.add(teacherHeadPivot);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.12, 16), skinMat);
    neck.position.y = 0.05;
    teacherHeadPivot.add(neck);

    // Sculpted Stylized Head
    const headMesh = new THREE.Mesh(new RoundedBoxGeometry(0.44, 0.46, 0.42, 5, 0.18), skinMat);
    headMesh.position.set(0, 0.29, 0.01);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    teacherHeadPivot.add(headMesh);

    // Ears
    [-0.22, 0.22].forEach((ex) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 12), skinMat);
      ear.position.set(ex, 0.28, 0.0);
      teacherHeadPivot.add(ear);
    });

    // Cute Nose & Rosy Cheeks
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.042, 14, 14), skinMat);
    nose.scale.set(0.9, 1.15, 1.1);
    nose.position.set(0, 0.27, 0.235);
    teacherHeadPivot.add(nose);

    const cheekMat = new THREE.MeshStandardMaterial({ color: '#ef8a7a', roughness: 0.7 });
    [-0.125, 0.125].forEach((chX) => {
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), cheekMat);
      cheek.scale.set(1.2, 0.75, 0.4);
      cheek.position.set(chX, 0.23, 0.205);
      teacherHeadPivot.add(cheek);
    });

    // Expressive Eyes with White Specular Catchlights
    const eyes = [];
    [-0.088, 0.088].forEach((eyeX) => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(eyeX, 0.31, 0.215);

      const pupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.028, 14, 14),
        new THREE.MeshStandardMaterial({ color: '#1b1d21', roughness: 0.2 })
      );
      const catchlight = new THREE.Mesh(
        new THREE.SphereGeometry(0.01, 8, 8),
        new THREE.MeshBasicMaterial({ color: '#ffffff' })
      );
      catchlight.position.set(0.01, 0.01, 0.022);
      eyeGroup.add(pupil, catchlight);
      teacherHeadPivot.add(eyeGroup);
      eyes.push(eyeGroup);
    });

    // Friendly Curved Smile
    const smile = new THREE.Mesh(
      new THREE.TorusGeometry(0.052, 0.012, 10, 20, Math.PI * 0.82),
      new THREE.MeshStandardMaterial({ color: '#8f3d33', roughness: 0.5 })
    );
    smile.rotation.z = Math.PI * 1.09;
    smile.position.set(0, 0.215, 0.212);
    teacherHeadPivot.add(smile);

    // Round Black-Rimmed Glasses
    const glassesGroup = new THREE.Group();
    glassesGroup.position.set(0, 0.31, 0.235);
    [-0.09, 0.09].forEach((gx) => {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.011, 12, 24), glassesFrameMat);
      rim.position.x = gx;
      glassesGroup.add(rim);

      const lens = new THREE.Mesh(
        new THREE.CircleGeometry(0.064, 20),
        new THREE.MeshPhysicalMaterial({
          color: '#ffffff',
          transparent: true,
          opacity: 0.16,
          roughness: 0.1,
        })
      );
      lens.position.set(gx, 0, 0.002);
      glassesGroup.add(lens);
    });
    const noseBridge = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.014, 0.014), glassesFrameMat);
    noseBridge.position.y = 0.01;
    glassesGroup.add(noseBridge);
    teacherHeadPivot.add(glassesGroup);

    // Sculpted Neat Side-Parted Hair Cap
    const hairTop = new THREE.Mesh(new RoundedBoxGeometry(0.47, 0.18, 0.45, 4, 0.08), hairMat);
    hairTop.position.set(0, 0.49, -0.005);
    hairTop.castShadow = true;

    const hairBack = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.34, 0.16, 4, 0.07), hairMat);
    hairBack.position.set(0, 0.34, -0.16);
    hairBack.castShadow = true;

    const hairQuiff = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.11, 0.18, 3, 0.05), hairMat);
    hairQuiff.position.set(-0.07, 0.55, 0.13);
    hairQuiff.rotation.z = 0.16;
    hairQuiff.castShadow = true;

    teacherHeadPivot.add(hairTop, hairBack, hairQuiff);

    // Left Arm (relaxed gracefully near side)
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.28, 0.48, 0);
    leftArmPivot.rotation.z = 0.16;
    leftArmPivot.rotation.x = -0.12;
    teacherTorsoPivot.add(leftArmPivot);

    const leftSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.058, 0.38, 14), shirtMat);
    leftSleeve.position.y = -0.19;
    leftSleeve.castShadow = true;
    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.058, 14, 14), skinMat);
    leftHand.position.y = -0.41;
    leftHand.castShadow = true;
    leftArmPivot.add(leftSleeve, leftHand);

    // Right Arm (gesturing toward the chalkboard with wooden pointer stick!)
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.28, 0.48, 0);
    rightArmPivot.rotation.set(-0.68, -0.25, -0.58);
    teacherTorsoPivot.add(rightArmPivot);

    const rightSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.058, 0.38, 14), shirtMat);
    rightSleeve.position.y = -0.19;
    rightSleeve.castShadow = true;

    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.058, 14, 14), skinMat);
    rightHand.position.y = -0.41;
    rightHand.castShadow = true;

    // Tapered Honey-Wood Pointer Stick held in teacher's right hand
    const pointerStick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.018, 0.92, 12),
      oakTrimMat
    );
    pointerStick.position.set(0.02, -0.42, 0.36);
    pointerStick.rotation.x = Math.PI * 0.48;
    pointerStick.castShadow = true;

    rightArmPivot.add(rightSleeve, rightHand, pointerStick);

    // Invisible larger hit-box on teacher for easy click interaction
    const teacherHitBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 1.85, 0.55),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    teacherHitBox.position.set(0, 0.92, 0);
    teacherHitBox.userData = { interactiveType: 'teacher', hint: 'Say Hello to Teacher' };
    interactiveMeshes.push(teacherHitBox);
    teacherRoot.add(teacherHitBox);

    // 5) Teacher's Wooden Desk & Props (Books, Glossy Red Apple, Pencil Cup & Ruler)
    const deskGroup = new THREE.Group();
    deskGroup.position.set(0.58, 1.02, 0.42);
    classroomGroup.add(deskGroup);

    const deskW = 1.46;
    const deskH = 0.64;
    const deskD = 0.84;

    // Desk Tabletop (top surface at y = 0.68 relative to floor)
    const deskTop = new THREE.Mesh(new RoundedBoxGeometry(deskW, 0.08, deskD, 3, 0.025), oakTrimMat);
    deskTop.position.y = deskH;
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    deskGroup.add(deskTop);

    // Desk Modesty Apron & Side Drawer Box
    const deskApron = new THREE.Mesh(new THREE.BoxGeometry(deskW - 0.18, 0.16, deskD - 0.18), oakTrimMat);
    deskApron.position.y = deskH - 0.11;
    deskApron.castShadow = true;
    deskGroup.add(deskApron);

    const drawerBox = new THREE.Mesh(new RoundedBoxGeometry(0.44, 0.30, deskD - 0.16, 2, 0.02), oakTrimMat);
    drawerBox.position.set(0.40, deskH - 0.18, 0);
    drawerBox.castShadow = true;
    const drawerKnob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), brushedBrassMat);
    drawerKnob.position.set(0.40, deskH - 0.18, (deskD - 0.16) / 2 + 0.02);
    deskGroup.add(drawerBox, drawerKnob);

    // Four Tapered Mid-Century Desk Legs
    const legOffsets = [
      [-deskW / 2 + 0.12, -deskD / 2 + 0.12],
      [deskW / 2 - 0.12, -deskD / 2 + 0.12],
      [-deskW / 2 + 0.12, deskD / 2 - 0.12],
      [deskW / 2 - 0.12, deskD / 2 - 0.12],
    ];
    legOffsets.forEach(([lx, lz]) => {
      const dLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.024, deskH - 0.02, 12), oakTrimMat);
      dLeg.position.set(lx, (deskH - 0.02) / 2, lz);
      dLeg.castShadow = true;
      deskGroup.add(dLeg);
    });

    const deskSurfaceY = deskH + 0.04;

    // Prop A: Stack of 3 Colorful Hardcover Books
    const bookStackGroup = new THREE.Group();
    bookStackGroup.position.set(0.32, deskSurfaceY, -0.08);
    deskGroup.add(bookStackGroup);

    const booksSpec = [
      { color: '#2b5b84', w: 0.42, h: 0.068, d: 0.30, rotY: 0.12 },
      { color: '#d97724', w: 0.39, h: 0.064, d: 0.28, rotY: -0.18 },
      { color: '#c84b31', w: 0.36, h: 0.058, d: 0.26, rotY: 0.24 },
    ];
    let currentBookY = 0;
    booksSpec.forEach((b) => {
      const singleBook = new THREE.Group();
      singleBook.position.y = currentBookY + b.h / 2;
      singleBook.rotation.y = b.rotY;

      const coverMat = new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.55 });
      const pagesMat = new THREE.MeshStandardMaterial({ color: '#f7f1e3', roughness: 0.85 });

      const pages = new THREE.Mesh(new THREE.BoxGeometry(b.w - 0.02, b.h - 0.016, b.d - 0.02), pagesMat);
      const topCover = new THREE.Mesh(new RoundedBoxGeometry(b.w, 0.012, b.d, 2, 0.004), coverMat);
      topCover.position.y = b.h / 2 - 0.006;
      const botCover = new THREE.Mesh(new RoundedBoxGeometry(b.w, 0.012, b.d, 2, 0.004), coverMat);
      botCover.position.y = -b.h / 2 + 0.006;
      const spine = new THREE.Mesh(new RoundedBoxGeometry(0.018, b.h, b.d, 2, 0.006), coverMat);
      spine.position.x = -b.w / 2 + 0.006;

      [pages, topCover, botCover, spine].forEach((m) => {
        m.castShadow = true;
        m.receiveShadow = true;
      });
      singleBook.add(pages, topCover, botCover, spine);
      bookStackGroup.add(singleBook);
      currentBookY += b.h;
    });

    // Prop B: Glossy Red Apple with Stem & Green Leaf
    const appleGroup = new THREE.Group();
    appleGroup.position.set(-0.34, deskSurfaceY + 0.085, 0.14);
    deskGroup.add(appleGroup);

    const appleBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 22, 18),
      new THREE.MeshPhysicalMaterial({
        color: '#d92626',
        roughness: 0.18,
        clearcoat: 0.85,
        clearcoatRoughness: 0.12,
      })
    );
    appleBody.scale.set(1.06, 0.94, 1.06);
    appleBody.castShadow = true;
    appleGroup.add(appleBody);

    const appleStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.011, 0.055, 8),
      new THREE.MeshStandardMaterial({ color: '#4a2c16', roughness: 0.8 })
    );
    appleStem.position.set(0, 0.098, 0);
    appleStem.rotation.z = 0.22;
    appleGroup.add(appleStem);

    const appleLeaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.036, 12, 8),
      new THREE.MeshStandardMaterial({ color: '#49a052', roughness: 0.4 })
    );
    appleLeaf.scale.set(1.4, 0.25, 0.75);
    appleLeaf.position.set(0.032, 0.105, 0.01);
    appleLeaf.rotation.set(0.2, 0.3, 0.35);
    appleGroup.add(appleLeaf);

    // Prop C: Pencil Cup with Yellow #2 Pencils & Wooden Ruler
    const cupGroup = new THREE.Group();
    cupGroup.position.set(0.36, deskSurfaceY, 0.24);
    deskGroup.add(cupGroup);

    const pencilCup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.072, 0.062, 0.16, 20),
      new THREE.MeshStandardMaterial({ color: '#e9dcc7', roughness: 0.42 })
    );
    pencilCup.position.y = 0.08;
    pencilCup.castShadow = true;
    cupGroup.add(pencilCup);

    const pencilAngles = [
      [-0.02, 0.01, 0.14, 0.1],
      [0.022, -0.015, -0.16, -0.08],
      [0.0, 0.022, 0.05, -0.18],
    ];
    pencilAngles.forEach(([px, pz, rz, rx]) => {
      const pPivot = new THREE.Group();
      pPivot.position.set(px, 0.13, pz);
      pPivot.rotation.set(rx, 0, rz);

      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.011, 0.011, 0.22, 6),
        new THREE.MeshStandardMaterial({ color: '#f5b82e', roughness: 0.45 })
      );
      shaft.position.y = 0.06;
      shaft.castShadow = true;

      const eraser = new THREE.Mesh(
        new THREE.CylinderGeometry(0.011, 0.011, 0.026, 10),
        new THREE.MeshStandardMaterial({ color: '#f28b9c', roughness: 0.7 })
      );
      eraser.position.y = 0.18;

      pPivot.add(shaft, eraser);
      cupGroup.add(pPivot);
    });

    // Wooden Ruler sticking out of the cup
    const ruler = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.26, 0.008), oakTrimMat);
    ruler.position.set(-0.025, 0.16, -0.02);
    ruler.rotation.set(-0.14, 0.3, 0.22);
    ruler.castShadow = true;
    cupGroup.add(ruler);

    // 6) Potted Tropical Plant in Front-Left Classroom Corner
    const plantGroup = new THREE.Group();
    plantGroup.position.set(-2.08, 1.02, 0.94);
    classroomGroup.add(plantGroup);

    const potMat = new THREE.MeshStandardMaterial({ color: '#c86848', roughness: 0.68 });
    const potBody = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.15, 0.28, 20), potMat);
    potBody.position.y = 0.14;
    potBody.castShadow = true;
    potBody.receiveShadow = true;
    plantGroup.add(potBody);

    const potRim = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.22, 0.055, 20), potMat);
    potRim.position.y = 0.27;
    potRim.castShadow = true;
    plantGroup.add(potRim);

    const soil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.19, 0.02, 16),
      new THREE.MeshStandardMaterial({ color: '#3b281c', roughness: 0.95 })
    );
    soil.position.y = 0.265;
    plantGroup.add(soil);

    const leafMat = new THREE.MeshStandardMaterial({ color: '#479458', roughness: 0.48 });
    for (let l = 0; l < 7; l++) {
      const leafPivot = new THREE.Group();
      leafPivot.position.y = 0.27;
      leafPivot.rotation.y = (l / 7) * Math.PI * 2 + 0.3;
      leafPivot.rotation.x = 0.42 + (l % 2) * 0.22;

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.24, 8), leafMat);
      stem.position.y = 0.12;
      const blade = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), leafMat);
      blade.scale.set(0.85, 1.55, 0.22);
      blade.position.set(0, 0.27, 0.02);
      blade.rotation.x = 0.35;
      blade.castShadow = true;

      leafPivot.add(stem, blade);
      plantGroup.add(leafPivot);
    }

function fit() {
  const w = Math.max(container.clientWidth, 1);
  const h = Math.max(container.clientHeight, 1);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

fit();

function pointerNDC(event) {
  const rect = container.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function cycleChalkboardLesson() {
  STATE.lessonIndex = (STATE.lessonIndex + 1) % LESSONS.length;
  STATE.lessonDialTargetRot -= Math.PI / 3;
  renderChalkboardLesson(STATE.lessonIndex);
}

function toggleClassroomLight() {
  STATE.classroomLightOn = !STATE.classroomLightOn;
  STATE.lightDialTargetRot += STATE.classroomLightOn ? -0.9 : 0.9;
  classroomPointLight.intensity = STATE.classroomLightOn ? 3.4 : 0.15;
  ceilingBulbMat.emissiveIntensity = STATE.classroomLightOn ? 1.4 : 0.05;
  redLedMat.emissiveIntensity = STATE.classroomLightOn ? 0.85 : 0.1;
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDown = { x: 0, y: 0 };

renderer.domElement.addEventListener('pointerdown', (event) => {
  pointerDown = { x: event.clientX, y: event.clientY };
});

renderer.domElement.addEventListener('pointerup', (event) => {
  if (Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 6) return;
  pointerNDC(event);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(interactiveMeshes, false);
  if (!hits.length) return;
  const type = hits[0].object.userData.interactiveType;
  if (type === 'lessonDial') cycleChalkboardLesson();
  else if (type === 'lightDial') toggleClassroomLight();
  else if (type === 'teacher') STATE.teacherWaveTimer = 1.4;
});

let running = document.visibilityState === 'visible';
function syncRunning() {
  running = document.visibilityState === 'visible';
}
document.addEventListener('visibilitychange', syncRunning);
new ResizeObserver(() => fit()).observe(container);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  if (!running) return;
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.getElapsedTime();

  lessonDialKnob.rotation.z += (STATE.lessonDialTargetRot - lessonDialKnob.rotation.z) * Math.min(1, dt * 12);
  lightDialKnob.rotation.z += (STATE.lightDialTargetRot - lightDialKnob.rotation.z) * Math.min(1, dt * 12);

  const now = new Date();
  const sec = now.getSeconds() + now.getMilliseconds() / 1000;
  const min = now.getMinutes() + sec / 60;
  const hr = (now.getHours() % 12) + min / 60;
  secondHandPivot.rotation.z = -(sec / 60) * Math.PI * 2;
  minuteHandPivot.rotation.z = -(min / 60) * Math.PI * 2;
  hourHandPivot.rotation.z = -(hr / 12) * Math.PI * 2;

  const breath = Math.sin(elapsed * 2.1);
  teacherTorsoPivot.position.y = 0.82 + breath * 0.008;
  teacherTorsoPivot.scale.y = 1 + breath * 0.012;
  teacherHeadPivot.rotation.x = Math.sin(elapsed * 1.4) * 0.055 + 0.03;
  teacherHeadPivot.rotation.y = Math.sin(elapsed * 0.85) * 0.14;
  teacherHeadPivot.rotation.z = Math.cos(elapsed * 1.1) * 0.035;
  const blinkCycle = elapsed % 4.2;
  const eyeScaleY = blinkCycle > 4.02 ? 0.12 : 1.0;
  eyes.forEach((eye) => {
    eye.scale.y = eyeScaleY;
  });
  if (STATE.teacherWaveTimer > 0) {
    STATE.teacherWaveTimer -= dt;
    rightArmPivot.rotation.z = -0.58 + Math.sin(elapsed * 14) * 0.18;
    rightArmPivot.rotation.x = -0.68 + Math.cos(elapsed * 10) * 0.12;
  } else {
    rightArmPivot.rotation.x = -0.68 + Math.sin(elapsed * 1.8) * 0.075;
    rightArmPivot.rotation.z = -0.58 + Math.cos(elapsed * 1.3) * 0.055;
  }
  leftArmPivot.rotation.z = 0.16 + breath * 0.025;
  if (STATE.classroomLightOn) {
    classroomPointLight.intensity = 3.35 + Math.sin(elapsed * 5.5) * 0.08;
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
