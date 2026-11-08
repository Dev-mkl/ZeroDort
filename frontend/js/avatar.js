/* =========================================================
   CENA 3D — boneco "raio-X" + posto de trabalho (Three.js)
   ---------------------------------------------------------
   Sistema de coordenadas do boneco (local):
     +Z = para onde o boneco olha (mesa), +Y = cima, +X = lado esquerdo do boneco.
   O "palco" é girado -90° para a câmera ver o boneco de lado (mesa à esquerda).
   ========================================================= */
(function () {
  'use strict';

  const COR_SEV = [0x22c55e, 0xeab308, 0xf97316, 0xef4444];
  const MESA_Y = 0.77;           // altura do tampo
  const MESA_FRENTE = 0.32;      // borda frontal da mesa (z)
  const COXA = 0.42, CANELA = 0.40;

  /* Pose padrão (ângulos em radianos) — tudo aqui é animado suavemente */
  const POSE_BASE = {
    chairH: 0.46, pelvisZ: 0, spineLow: 0.03, chest: 0.03, chestZ: 0,
    neck: 0.06, head: 0.0, headTilt: 0,
    shLY: 0, shRY: 0, shZ: 0,
    uArmLX: -0.3, uArmRX: -0.3, uArmLZ: 0.1, uArmRZ: -0.1,
    fArmLX: -1.15, fArmRX: -1.15, handLX: -0.05, handRX: -0.05,
    thighX: -1.5, shinX: 1.5, footX: 0, swing: 0,
    kbZ: 0.39, monY: 1.17, nbY: 0,
  };

  const ESTADO_INICIAL = { cadeira: 'padrao', pes: 'neutro', mesa: 'arredondada', equip: 'monitor', tela: 'olhos',
    fone: 'nenhum', bracos: 'neutro', pausas: 'padrao' };

  /* Câmera: alvo e posição (coordenadas do mundo) para cada foco */
  const FOCOS = {
    geral:  { alvo: [-0.3, 0.78, 0],  pos: [0.55, 1.45, 3.3] },
    lombar: { alvo: [0.0, 0.78, 0],   pos: [1.55, 1.15, 2.0] },
    pes:    { alvo: [-0.25, 0.3, 0],  pos: [0.55, 0.48, 2.2] },
    mesa:   { alvo: [-0.35, 0.68, 0], pos: [0.35, 1.25, 1.95] },
    cabeca: { alvo: [-0.3, 1.08, 0],  pos: [0.35, 1.35, 1.9] },
    ombros: { alvo: [-0.05, 1.08, 0], pos: [-1.5, 1.45, 1.7] },
    bracos: { alvo: [-0.3, 0.88, 0],  pos: [-0.1, 1.55, 1.95] },
    pausa:  { alvo: [-0.05, 0.98, 0], pos: [1.0, 1.45, 2.5] },
  };

  /* Gestos temporários (alongamentos). Recebem t (segundos) e devolvem ângulos. */
  const GESTOS = {
    alongar: () => ({ uArmLX: -2.95, uArmRX: -2.95, uArmLZ: 0.25, uArmRZ: -0.25,
      fArmLX: -0.15, fArmRX: -0.15, handLX: 0, handRX: 0, spineLow: -0.08, chest: -0.08, neck: -0.1, head: -0.05, headTilt: 0 }),
    pescoco: (t) => ({ headTilt: 0.42 * Math.sin(t * 1.1), neck: 0.02, head: 0,
      uArmLX: -0.35, uArmRX: -0.35, fArmLX: -0.9, fArmRX: -0.9, spineLow: 0.02, chest: 0.02 }),
    ombros: (t) => ({ shLY: 0.045 + 0.045 * Math.sin(t * 2.4), shRY: 0.045 + 0.045 * Math.sin(t * 2.4),
      shZ: 0.035 * Math.cos(t * 2.4), uArmLX: -0.05, uArmRX: -0.05, uArmLZ: 0.24, uArmRZ: -0.24,
      fArmLX: -0.25, fArmRX: -0.25, handLX: 0, handRX: 0, spineLow: 0.02, chest: 0.02, headTilt: 0 }),
    punhos: (t) => ({ uArmLX: -1.5, uArmRX: -1.5, uArmLZ: -0.05, uArmRZ: 0.05, fArmLX: 0, fArmRX: 0,
      handLX: -0.9 * Math.sin(t * 0.8), handRX: -0.9 * Math.sin(t * 0.8), headTilt: 0, spineLow: 0.02, chest: 0.02 }),
    bracos: (t) => ({ uArmLX: -2.95, uArmRX: -2.95, uArmLZ: 0.15, uArmRZ: -0.15, fArmLX: -0.2, fArmRX: -0.2,
      handLX: 0, handRX: 0, chestZ: 0.2 * Math.sin(t * 0.9), spineLow: -0.04, chest: -0.04, headTilt: 0 }),
  };

  const lerp = (a, b, t) => a + (b - a) * t;
  const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  /* ---------- materiais ---------- */
  function materialCasca(cor) {
    return new THREE.ShaderMaterial({
      uniforms: { cor: { value: new THREE.Color(cor) }, opac: { value: 0.55 } },
      vertexShader: `
        varying vec3 vN; varying vec3 vV;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position,1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 cor; uniform float opac;
        varying vec3 vN; varying vec3 vV;
        void main(){
          float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
          gl_FragColor = vec4(cor * (0.6 + f * 0.9), opac * (0.10 + f * 0.75));
        }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    });
  }

  function texturaBrilho() {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.25, 'rgba(255,255,255,0.75)');
    gr.addColorStop(0.6, 'rgba(255,255,255,0.18)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  function texturaTela() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 160;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 256, 160);
    gr.addColorStop(0, '#0e3a6b'); gr.addColorStop(1, '#0b1f3d');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 160);
    g.fillStyle = 'rgba(56,189,248,0.85)'; g.fillRect(14, 14, 120, 10);
    g.fillStyle = 'rgba(148,163,184,0.6)';
    for (let i = 0; i < 6; i++) g.fillRect(14, 36 + i * 16, 90 + ((i * 37) % 70), 6);
    g.fillStyle = 'rgba(34,197,94,0.7)'; g.fillRect(170, 40, 70, 46);
    g.fillStyle = 'rgba(249,115,22,0.7)'; g.fillRect(170, 96, 70, 40);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }

  class ErgoCena {
    constructor(container, overlay) {
      this.container = container;
      this.overlay = overlay;
      // estado inicial = postura neutra (nada respondido ainda)
      this.estado = { ...ESTADO_INICIAL };
      this.severidade = {};          // regiao -> 0..3
      this.rotulos = [];
      this.p = { ...POSE_BASE };     // pose exibida (suavizada)
      this.alvo = { ...POSE_BASE };  // pose desejada
      this.gesto = null;
      this.rotacaoAuto = false;

      const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      r.outputEncoding = THREE.sRGBEncoding;
      container.appendChild(r.domElement);

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(32, 1, 0.05, 60);
      this.camera.position.set(...FOCOS.geral.pos);

      const c = this.controls = new THREE.OrbitControls(this.camera, r.domElement);
      c.target.set(...FOCOS.geral.alvo);
      c.enableDamping = true; c.dampingFactor = 0.08; c.enablePan = false;
      c.minDistance = 1.0; c.maxDistance = 6; c.maxPolarAngle = Math.PI * 0.49;
      c.addEventListener('start', () => { this.animCam = null; });

      this._luzes();
      this.palco = new THREE.Group();
      this.palco.rotation.y = -Math.PI / 2;
      this.scene.add(this.palco);

      this._piso();
      this._cadeiras();
      this._mesa();
      this._equipamentos();
      this._corpo();
      this._hotspots();
      this.aplicarEstado(this.estado);

      this.relogio = new THREE.Clock();
      this._tmp = new THREE.Vector3();
      new ResizeObserver(() => this._redimensionar()).observe(container);
      this._redimensionar();
      const loop = () => { requestAnimationFrame(loop); this._quadro(); };
      loop();
    }

    /* ================= CONSTRUÇÃO ================= */
    _luzes() {
      this.scene.add(new THREE.HemisphereLight(0xbfd9ff, 0x0b1020, 0.9));
      const d = new THREE.DirectionalLight(0xffffff, 1.1); d.position.set(2, 4, 3); this.scene.add(d);
      const rim = new THREE.DirectionalLight(0x38bdf8, 0.9); rim.position.set(-3, 2, -3); this.scene.add(rim);
    }

    _piso() {
      const piso = new THREE.Mesh(new THREE.CircleGeometry(2.6, 64),
        new THREE.MeshStandardMaterial({ color: 0x0f1a30, roughness: 0.95 }));
      piso.rotation.x = -Math.PI / 2; this.palco.add(piso);
      const grade = new THREE.GridHelper(5, 25, 0x1e3a5f, 0x15243f);
      grade.position.y = 0.002; grade.material.transparent = true; grade.material.opacity = 0.5;
      this.palco.add(grade);
      const anel = new THREE.Mesh(new THREE.RingGeometry(2.55, 2.6, 96),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 }));
      anel.rotation.x = -Math.PI / 2; anel.position.y = 0.004; this.palco.add(anel);
    }

    _cadeiras() {
      const azul = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.55, metalness: 0.1 });
      const escuro = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.4, metalness: 0.6 });
      const lombarMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4, emissive: 0x0c4a6e, emissiveIntensity: 0.6 });

      /* --- cadeira de escritório (ajustável) --- */
      const of = this.cadeiraEscritorio = new THREE.Group();
      this.assento = new THREE.Group(); of.add(this.assento);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.07, 0.48), azul);
      seat.position.set(0, -0.035, 0.0); this.assento.add(seat);
      const encosto = new THREE.Group(); encosto.position.set(0, 0.02, -0.22); encosto.rotation.x = -0.1;
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.55, 0.05), azul); back.position.y = 0.33; encosto.add(back);
      const haste = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.03), escuro); haste.position.set(0, 0.03, 0.01); encosto.add(haste);
      this.apoioLombar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.11, 0.05), lombarMat);
      this.apoioLombar.position.set(0, 0.17, 0.045); encosto.add(this.apoioLombar);
      this.assento.add(encosto);
      this.alavanca = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.015, 0.02), escuro);
      this.alavanca.position.set(-0.25, -0.08, 0.1); this.assento.add(this.alavanca);
      this.pistao = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1, 16), escuro);
      of.add(this.pistao);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const perna = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.3), escuro);
        perna.position.set(Math.sin(a) * 0.15, 0.07, Math.cos(a) * 0.15); perna.rotation.y = a; of.add(perna);
        const roda = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), escuro);
        roda.position.set(Math.sin(a) * 0.29, 0.03, Math.cos(a) * 0.29); of.add(roda);
      }
      this.palco.add(of);

      /* --- cadeira fixa (4 pés, sem regulagem) --- */
      const fx = this.cadeiraFixa = new THREE.Group();
      const cinza = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });
      const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.42), cinza); s2.position.y = -0.02; fx.add(s2);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.36, 0.03), cinza); b2.position.set(0, 0.26, -0.22); fx.add(b2);
      this.pernasFixa = [];
      [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]].forEach(([x, z]) => {
        const l = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1, 8), escuro);
        l.position.set(x, -0.25, z); fx.add(l); this.pernasFixa.push(l);
        if (z < 0) { const l2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 8), escuro); l2.position.set(x, 0.2, -0.22); fx.add(l2); }
      });
      this.palco.add(fx);

      /* --- apoio para os pés --- */
      const ap = this.apoioPes = new THREE.Group();
      const plat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.03, 0.32), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 }));
      plat.rotation.x = -0.18; plat.position.y = 0.09; ap.add(plat);
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.06), escuro); base.position.set(0, 0.03, 0.08); ap.add(base);
      ap.position.set(0, 0, 0.47); this.palco.add(ap);
    }

    _mesa() {
      const g = this.mesa = new THREE.Group();
      const madeira = new THREE.MeshStandardMaterial({ color: 0x8b6b4a, roughness: 0.7 });
      const metal = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.5 });
      const tampo = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.035, 0.7), madeira);
      tampo.position.set(0, MESA_Y - 0.0175, MESA_FRENTE + 0.35); g.add(tampo);
      [[-0.66, 0.36], [0.66, 0.36], [-0.66, 0.98], [0.66, 0.98]].forEach(([x, z]) => {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.04, MESA_Y - 0.035, 0.04), metal);
        p.position.set(x, (MESA_Y - 0.035) / 2, z); g.add(p);
      });
      // borda arredondada
      this.bordaRedonda = new THREE.Mesh(new THREE.CylinderGeometry(0.0175, 0.0175, 1.4, 16), madeira);
      this.bordaRedonda.rotation.z = Math.PI / 2; this.bordaRedonda.position.set(0, MESA_Y - 0.0175, MESA_FRENTE);
      g.add(this.bordaRedonda);
      // quina viva + gaveteiro que bloqueia os joelhos
      this.quina = new THREE.Group();
      const faixa = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.008, 0.012),
        new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      faixa.position.set(0, MESA_Y + 0.002, MESA_FRENTE + 0.004); this.quina.add(faixa);
      const gav = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.24, 0.3), new THREE.MeshStandardMaterial({ color: 0x6b5138, roughness: 0.7 }));
      gav.position.set(0, MESA_Y - 0.035 - 0.12, MESA_FRENTE + 0.18); this.quina.add(gav);
      const puxador = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.015, 0.015), metal);
      puxador.position.set(0, MESA_Y - 0.15, MESA_FRENTE + 0.025); this.quina.add(puxador);
      g.add(this.quina);
      this.palco.add(g);
    }

    _equipamentos() {
      const preto = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4, metalness: 0.3 });
      const prata = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.35, metalness: 0.7 });
      const telaTex = texturaTela();
      const telaMat = new THREE.MeshBasicMaterial({ map: telaTex });

      /* monitor */
      const m = this.monitor = new THREE.Group(); m.position.set(0, 0, 0.85);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.015, 24), preto); base.position.y = MESA_Y + 0.008; m.add(base);
      this.monPoste = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1, 0.03), preto); m.add(this.monPoste);
      this.monTela = new THREE.Group(); m.add(this.monTela);
      const caixa = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.34, 0.03), [preto, preto, preto, preto, preto, telaMat]);
      this.monTela.add(caixa);
      this.palco.add(m);

      /* notebook */
      const n = this.notebook = new THREE.Group(); n.position.set(0.02, MESA_Y, 0.56);
      this.nbSuporte = new THREE.Mesh(new THREE.BoxGeometry(0.26, 1, 0.2), prata); n.add(this.nbSuporte);
      this.nbCorpo = new THREE.Group(); n.add(this.nbCorpo);
      const nbBase = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.018, 0.24), prata); nbBase.position.y = 0.009; this.nbCorpo.add(nbBase);
      const teclas = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.12), new THREE.MeshStandardMaterial({ color: 0x1f2937 }));
      teclas.rotation.x = -Math.PI / 2; teclas.position.set(0, 0.0185, -0.03); this.nbCorpo.add(teclas);
      const dob = new THREE.Group(); dob.position.set(0, 0.018, 0.12); dob.rotation.x = 0.3; this.nbCorpo.add(dob);
      const nbTela = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.23, 0.01), [prata, prata, prata, prata, prata, telaMat]);
      nbTela.position.y = 0.115; dob.add(nbTela);
      this.palco.add(n);

      /* teclado + mouse */
      const tk = this.teclado = new THREE.Group();
      const corpoT = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.022, 0.14), preto); corpoT.position.y = MESA_Y + 0.011; tk.add(corpoT);
      const topo = new THREE.Mesh(new THREE.PlaneGeometry(0.41, 0.11), new THREE.MeshStandardMaterial({ color: 0x374151 }));
      topo.rotation.x = -Math.PI / 2; topo.position.y = MESA_Y + 0.0225; tk.add(topo);
      const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 10), preto);
      mouse.scale.set(0.8, 0.45, 1.2); mouse.position.set(-0.33, MESA_Y + 0.012, 0); tk.add(mouse);
      this.palco.add(tk);

      /* papéis (quando não usa computador) */
      const pp = this.papeis = new THREE.Group();
      const branco = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9 });
      const f1 = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.004, 0.3), branco); f1.position.set(0.05, MESA_Y + 0.002, 0.5); f1.rotation.y = 0.12; pp.add(f1);
      const livro = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.27), new THREE.MeshStandardMaterial({ color: 0x0ea5e9 }));
      livro.position.set(-0.3, MESA_Y + 0.02, 0.62); livro.rotation.y = -0.2; pp.add(livro);
      this.palco.add(pp);
    }

    _corpo() {
      const casca = this.matCasca = materialCasca(0x60a5fa);
      const ossoMat = new THREE.MeshStandardMaterial({ color: 0xece6d6, roughness: 0.55, emissive: 0x2a2620, emissiveIntensity: 0.4 });
      const olhoMat = new THREE.MeshBasicMaterial({ color: 0x0b1020 });

      const add = (pai, geo, mat, pos, esc, rot) => {
        const m = new THREE.Mesh(geo, mat);
        if (pos) m.position.set(...pos);
        if (esc) m.scale.set(...esc);
        if (rot) m.rotation.set(...rot);
        if (mat === casca) m.renderOrder = 2;
        pai.add(m); return m;
      };
      const cil = (r, h) => new THREE.CylinderGeometry(r, r, h, 10);
      const cap = (r, h) => new THREE.CapsuleGeometry(r, h, 6, 16);
      const esf = (r) => new THREE.SphereGeometry(r, 20, 14);
      const vertebras = (pai, y0, y1, z, r) => {
        for (let y = y0; y <= y1 + 1e-6; y += 0.034) add(pai, cil(r, 0.022), ossoMat, [0, y, z]);
      };

      const R = this.rig = {};
      const quadril = R.quadril = new THREE.Group(); this.palco.add(quadril);
      add(quadril, esf(0.15), casca, [0, 0.0, -0.01], [1.15, 0.7, 0.9]);
      add(quadril, new THREE.TorusGeometry(0.085, 0.024, 10, 24), ossoMat, [0, 0.0, -0.01], [1.2, 1, 0.75], [Math.PI / 2 - 0.3, 0, 0]);
      add(quadril, new THREE.ConeGeometry(0.035, 0.09, 8), ossoMat, [0, -0.01, -0.08], null, [Math.PI + 0.3, 0, 0]);

      const lombar = R.lombar = new THREE.Group(); lombar.position.set(0, 0.06, -0.02); quadril.add(lombar);
      add(lombar, cap(0.13, 0.1), casca, [0, 0.11, 0.0], [1.12, 1, 0.78]);
      vertebras(lombar, 0.0, 0.2, -0.05, 0.022);

      const torax = R.torax = new THREE.Group(); torax.position.set(0, 0.22, 0); lombar.add(torax);
      add(torax, cap(0.15, 0.16), casca, [0, 0.17, 0.0], [1.18, 1, 0.76]);
      vertebras(torax, 0.0, 0.3, -0.07, 0.017);
      for (let i = 0; i < 7; i++) {
        const y = 0.06 + i * 0.036;
        const rr = 0.095 + 0.03 * Math.sin((i + 1) / 8 * Math.PI);
        add(torax, new THREE.TorusGeometry(rr, 0.007, 6, 28), ossoMat, [0, y, -0.005], [1.15, 0.75, 1], [Math.PI / 2 + 0.25, 0, 0]);
      }
      add(torax, new THREE.BoxGeometry(0.025, 0.17, 0.012), ossoMat, [0, 0.17, 0.085]);
      [1, -1].forEach(s => add(torax, cil(0.009, 0.17), ossoMat, [s * 0.085, 0.27, 0.035], null, [0, 0, s * (Math.PI / 2 - 0.15)]));

      const pescoco = R.pescoco = new THREE.Group(); pescoco.position.set(0, 0.32, -0.02); torax.add(pescoco);
      add(pescoco, cil(0.05, 0.1), casca, [0, 0.04, 0.0]);
      vertebras(pescoco, 0.0, 0.07, -0.01, 0.015);

      const cabeca = R.cabeca = new THREE.Group(); cabeca.position.set(0, 0.09, 0); pescoco.add(cabeca);
      add(cabeca, esf(0.112), casca, [0, 0.1, 0.015], [0.88, 1.08, 1.02]);
      add(cabeca, esf(0.08), ossoMat, [0, 0.11, 0.0], [0.86, 0.98, 1.08]);
      add(cabeca, new THREE.BoxGeometry(0.075, 0.035, 0.07), ossoMat, [0, 0.035, 0.04]);
      [1, -1].forEach(s => add(cabeca, esf(0.016), olhoMat, [s * 0.028, 0.1, 0.075]));
      add(cabeca, new THREE.ConeGeometry(0.01, 0.02, 3), olhoMat, [0, 0.07, 0.084], null, [Math.PI / 2, 0, 0]);

      // headset
      const hs = this.headset = new THREE.Group(); cabeca.add(hs);
      const hsMat = new THREE.MeshStandardMaterial({ color: 0x22d3ee, roughness: 0.35, emissive: 0x0e7490, emissiveIntensity: 0.5 });
      add(hs, new THREE.TorusGeometry(0.105, 0.009, 8, 32, Math.PI), hsMat, [0, 0.11, 0]);
      [1, -1].forEach(s => add(hs, cil(0.035, 0.025), hsMat, [s * 0.1, 0.1, 0], null, [0, 0, Math.PI / 2]));
      const mic = add(hs, cil(0.005, 0.11), hsMat, [0.095, 0.06, 0.05], null, [Math.PI / 2 - 0.5, 0, 0.15]);
      mic.userData.mic = true;

      // telefone entre orelha e ombro
      const tel = this.telefone = new THREE.Group(); cabeca.add(tel);
      const telMesh = add(tel, new THREE.BoxGeometry(0.015, 0.15, 0.07), new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4, emissive: 0x7c2d12, emissiveIntensity: 0.5 }),
        [0.105, 0.04, 0.02], null, [0.25, 0, 0.35]);
      telMesh.renderOrder = 3;

      // ombros e braços
      R.braco = {};
      [['L', 1], ['R', -1]].forEach(([lado, s]) => {
        const ombro = new THREE.Group(); ombro.position.set(s * 0.19, 0.27, -0.01); torax.add(ombro);
        add(ombro, esf(0.055), casca, [0, 0, 0]);
        add(ombro, esf(0.022), ossoMat, [0, 0, 0]);
        const braco = new THREE.Group(); ombro.add(braco);
        add(braco, cap(0.048, 0.2), casca, [0, -0.14, 0]);
        add(braco, cil(0.013, 0.25), ossoMat, [0, -0.14, 0]);
        add(braco, esf(0.02), ossoMat, [0, -0.28, 0]);
        const ante = new THREE.Group(); ante.position.set(0, -0.28, 0); braco.add(ante);
        add(ante, cap(0.04, 0.18), casca, [0, -0.125, 0]);
        add(ante, cil(0.007, 0.23), ossoMat, [0.012, -0.125, 0]);
        add(ante, cil(0.007, 0.23), ossoMat, [-0.012, -0.125, 0]);
        const mao = new THREE.Group(); mao.position.set(0, -0.25, 0); ante.add(mao);
        add(mao, cap(0.035, 0.05), casca, [0, -0.06, 0], [1.1, 1, 0.5]);
        add(mao, new THREE.BoxGeometry(0.05, 0.075, 0.012), ossoMat, [0, -0.055, 0]);
        R.braco[lado] = { ombro, braco, ante, mao };
      });

      // pernas
      R.perna = {};
      [['L', 1], ['R', -1]].forEach(([lado, s]) => {
        const coxa = new THREE.Group(); coxa.position.set(s * 0.09, -0.03, 0); quadril.add(coxa);
        add(coxa, cap(0.068, COXA - 0.12), casca, [0, -COXA / 2, 0]);
        add(coxa, cil(0.017, COXA - 0.03), ossoMat, [0, -COXA / 2, 0]);
        add(coxa, esf(0.026), ossoMat, [0, -COXA, 0.03]);
        const canela = new THREE.Group(); canela.position.set(0, -COXA, 0); coxa.add(canela);
        add(canela, cap(0.05, CANELA - 0.1), casca, [0, -CANELA / 2, 0]);
        add(canela, cil(0.014, CANELA - 0.03), ossoMat, [0, -CANELA / 2, 0.01]);
        const pe = new THREE.Group(); pe.position.set(0, -CANELA, 0); canela.add(pe);
        add(pe, new THREE.BoxGeometry(0.09, 0.06, 0.24), casca, [0, -0.04, 0.06]);
        add(pe, new THREE.BoxGeometry(0.06, 0.025, 0.19), ossoMat, [0, -0.04, 0.06]);
        R.perna[lado] = { coxa, canela, pe };
      });
    }

    _hotspots() {
      const tex = texturaBrilho();
      const R = this.rig;
      const ancoras = {
        cervical: [[R.pescoco, [0, 0.04, -0.02]]],
        ombros: [[R.braco.L.ombro, [0, 0.01, 0]], [R.braco.R.ombro, [0, 0.01, 0]]],
        lombar: [[R.lombar, [0, 0.05, -0.06]]],
        coluna: [[R.torax, [0, 0.16, -0.08]]],
        cotovelos: [[R.braco.L.ante, [0, 0, 0]], [R.braco.R.ante, [0, 0, 0]]],
        punhos: [[R.braco.L.mao, [0, -0.02, 0]], [R.braco.R.mao, [0, -0.02, 0]]],
        pes: [[R.perna.L.pe, [0, -0.03, 0.06]], [R.perna.R.pe, [0, -0.03, 0.06]]],
      };
      this.hotspots = {};
      Object.entries(ancoras).forEach(([reg, lista]) => {
        this.hotspots[reg] = lista.map(([pai, pos]) => {
          const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xffffff, transparent: true, opacity: 0.8,
            depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
          sp.position.set(...pos); sp.renderOrder = 10; sp.visible = false;
          pai.add(sp); return sp;
        });
      });
    }

    /* ================= API PÚBLICA ================= */

    /** Atualiza o cenário e a pose a partir das respostas. */
    aplicarEstado(e) {
      this.estado = { ...ESTADO_INICIAL, ...e };
      const s = this.estado;
      this.cadeiraEscritorio.visible = s.cadeira !== 'fixa';
      this.cadeiraFixa.visible = s.cadeira === 'fixa';
      this.apoioLombar.visible = s.cadeira === 'ergonomica';
      this.alavanca.visible = s.cadeira === 'ergonomica' || s.cadeira === 'semLombar';
      this.apoioPes.visible = s.pes === 'apoio';
      this.bordaRedonda.visible = s.mesa !== 'quina';
      this.quina.visible = s.mesa === 'quina';
      const temNotebook = s.equip === 'notebook';
      this.monitor.visible = s.equip === 'monitor';
      this.notebook.visible = temNotebook;
      this.papeis.visible = s.equip === 'nenhum';
      // teclado externo: monitor, ou notebook elevado (tela na altura dos olhos)
      this.teclado.visible = s.equip === 'monitor' || (temNotebook && s.tela === 'olhos');
      this.headset.visible = s.fone === 'headset';
      this.telefone.visible = s.fone === 'ombro';
      this.alvo = this._calcularPose(s);
    }

    _calcularPose(s) {
      const t = { ...POSE_BASE };
      // cadeira / coluna
      if (s.cadeira === 'ergonomica') { t.spineLow = 0.0; t.chest = 0.02; t.chairH = 0.47; }
      if (s.cadeira === 'semLombar') { t.spineLow = -0.12; t.chest = 0.2; t.pelvisZ = 0.03; t.neck += 0.05; }
      if (s.cadeira === 'fixa') { t.spineLow = -0.32; t.chest = 0.34; t.pelvisZ = 0.08; t.neck += 0.1; t.chairH = 0.46; }
      // pausas / fadiga
      if (s.pausas === 'medio') { t.chest += 0.05; }
      if (s.pausas === 'nunca') { t.chest += 0.16; t.neck += 0.1; t.shZ = 0.035; }
      // mesa com quina: corpo afastado, braços alongados
      if (s.mesa === 'quina') { t.pelvisZ = Math.min(t.pelvisZ, 0) - 0.18; t.chest += 0.08; }
      // pés
      let pernas = 'ik', piso = 0;
      if (s.pes === 'apoio') { t.chairH = Math.max(t.chairH, 0.52); piso = 0.105; }
      if (s.pes === 'suspensos') { t.chairH = 0.62; pernas = 'livre'; t.swing = 1; }
      // braços / teclado
      let punho = -0.05;
      if (s.bracos === 'esticados') { t.kbZ = 0.62; punho = 0.5; t.shZ += 0.03; t.chest += 0.06; }
      // tela e equipamento → flexão do pescoço
      let flexao = 0, maoZ = t.kbZ - 0.07, maoY = MESA_Y + 0.06;
      if (s.equip === 'notebook') {
        t.nbY = s.tela === 'olhos' ? 0.3 : 0;
        if (s.tela !== 'olhos') { flexao = 0.62; maoZ = s.bracos === 'esticados' ? 0.5 : 0.45; maoY = MESA_Y + 0.05; }
      }
      if (s.equip === 'nenhum') { maoZ = 0.42; maoY = MESA_Y + 0.05; }
      if (s.equip === 'monitor') t.monY = s.tela === 'baixa' ? 0.94 : 1.17;
      if (s.tela === 'baixa') flexao = Math.max(flexao, 0.5);
      if (s.equip === 'nenhum') flexao = Math.max(flexao, 0.25);
      t.neck += flexao * 0.55; t.head += flexao * 0.45;
      // telefone no ombro
      if (s.fone === 'ombro') { t.headTilt = -0.36; t.shLY = 0.06; t.head += 0.05; }

      // braços: IK simples (2 segmentos) para as mãos chegarem ao teclado
      const ik = this._bracoIK(t, maoZ, maoY, punho);
      t.uArmLX = t.uArmRX = ik.uX;
      t.fArmLX = t.fArmRX = ik.fX;
      t.handLX = t.handRX = ik.hX;

      // pernas: IK simples (2 segmentos) para apoiar o pé no chão/apoio
      if (pernas === 'ik') {
        const quadrilY = t.chairH + 0.07 - 0.03;
        const dy = (piso + 0.075) - quadrilY;
        const dz = (s.mesa === 'quina' ? 0.34 : 0.47) - (t.pelvisZ);
        const d = Math.min(Math.hypot(dy, dz), COXA + CANELA - 0.002);
        const phi = Math.atan2(dz, -dy);
        const a = Math.acos((COXA * COXA + d * d - CANELA * CANELA) / (2 * COXA * d));
        const b = Math.acos((COXA * COXA + CANELA * CANELA - d * d) / (2 * COXA * CANELA));
        t.thighX = -(phi + a);
        t.shinX = Math.PI - b;
        t.footX = -(t.thighX + t.shinX) + (piso > 0 ? -0.18 : 0);
      } else {
        t.thighX = -1.4; t.shinX = 1.25; t.footX = 0.35;
      }
      return t;
    }

    /* Ombro → punho no plano lateral. Retorna as rotações (x) de braço, antebraço e mão. */
    _bracoIK(t, alvoZ, alvoY, extensaoPunho) {
      const a = t.spineLow, b = t.spineLow + t.chest;
      let y = t.chairH + 0.07 + 0.06, z = t.pelvisZ - 0.02;
      y += 0.22 * Math.cos(a); z += 0.22 * Math.sin(a);
      const yo = 0.27, zo = -0.01 + t.shZ;
      y += yo * Math.cos(b) - zo * Math.sin(b);
      z += yo * Math.sin(b) + zo * Math.cos(b);
      const L1 = 0.28, L2 = 0.25;
      const dy = alvoY - y, dz = alvoZ - z;
      const d = Math.hypot(dy, dz);
      const phi = Math.atan2(dz, -dy);
      let tu, tf;
      if (d >= L1 + L2 - 0.005) { tu = tf = phi; }
      else {
        const c = Math.min(1, Math.max(-1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)));
        tu = phi - Math.acos(c);
        const ey = y - L1 * Math.cos(tu), ez = z + L1 * Math.sin(tu);
        tf = Math.atan2(alvoZ - ez, -(alvoY - ey));
      }
      const th = Math.PI / 2 + extensaoPunho;
      return { uX: -tu - b, fX: -(tf - tu), hX: tf - th };
    }

    /** sev: { regiao: 0..3 } ; dor: lista de regiões com dor relatada */
    definirSeveridade(sev, dor) {
      this.severidade = { ...sev };
      this.dor = new Set(dor || []);
      Object.entries(this.hotspots).forEach(([reg, sprites]) => {
        const v = sev[reg];
        sprites.forEach(sp => {
          sp.visible = v !== undefined && v !== null;
          if (sp.visible) sp.material.color.setHex(COR_SEV[v]);
        });
      });
      // a casca do corpo esquenta conforme o pior risco
      const pior = Math.max(-1, ...Object.values(sev).filter(v => v !== null && v !== undefined));
      const cores = [0x60a5fa, 0x60a5fa, 0x7aa8f0, 0x8ea2e6];
      this.matCasca.uniforms.cor.value.setHex(cores[Math.max(0, pior)]);
    }

    /** Rótulos com linha guia: [{regiao, titulo, linha, sev}] */
    definirRotulos(lista) {
      this.rotulos = lista;
      this.overlay.innerHTML = '';
      const svgNS = 'http://www.w3.org/2000/svg';
      this.svg = document.createElementNS(svgNS, 'svg');
      this.svg.setAttribute('class', 'linhas-rotulo');
      this.overlay.appendChild(this.svg);
      this.rotuloEls = lista.map(r => {
        const el = document.createElement('div');
        el.className = 'rotulo sev-' + r.sev;
        el.innerHTML = `<strong>${r.titulo}</strong><span>${r.linha}</span>`;
        this.overlay.appendChild(el);
        const linha = document.createElementNS(svgNS, 'polyline');
        linha.setAttribute('class', 'sev-' + r.sev);
        this.svg.appendChild(linha);
        const ponto = document.createElementNS(svgNS, 'circle');
        ponto.setAttribute('r', '3.5'); ponto.setAttribute('class', 'sev-' + r.sev);
        this.svg.appendChild(ponto);
        return { el, linha, ponto, r };
      });
    }

    focar(nome) {
      const f = FOCOS[nome] || FOCOS.geral;
      // em telas estreitas (celular) a câmera se afasta para caber o boneco
      const alvo = new THREE.Vector3(...f.alvo);
      const k = Math.max(1, 1.45 / (this.camera.aspect || 1.45));
      const pos = new THREE.Vector3(...f.pos).sub(alvo).multiplyScalar(Math.min(k, 1.9)).add(alvo);
      this.animCam = {
        de: { pos: this.camera.position.clone(), alvo: this.controls.target.clone() },
        para: { pos, alvo },
        t: 0,
      };
    }

    gestoRapido(tipo, dur = 2.6) {
      this.gesto = { tipo, t0: this.relogio.getElapsedTime(), dur };
    }

    /** Sequência de pausa ativa: passos [{tipo, dur}] ; aoPasso(i) ; aoFim() */
    iniciarPausa(passos, aoPasso, aoFim) {
      this.pausa = { passos, i: -1, aoPasso, aoFim };
      this._proximoPasso();
      this.focar('pausa');
    }
    pararPausa() {
      if (!this.pausa) return;
      const fim = this.pausa.aoFim; this.pausa = null; this.gesto = null;
      if (fim) fim(true);
    }
    _proximoPasso() {
      const pz = this.pausa; pz.i++;
      if (pz.i >= pz.passos.length) { const fim = pz.aoFim; this.pausa = null; this.gesto = null; if (fim) fim(false); return; }
      const passo = pz.passos[pz.i];
      this.gesto = { tipo: passo.tipo, t0: this.relogio.getElapsedTime(), dur: passo.dur, pausa: true };
      if (pz.aoPasso) pz.aoPasso(pz.i);
    }

    /* ================= LOOP ================= */
    _redimensionar() {
      const w = this.container.clientWidth, h = this.container.clientHeight;
      if (!w || !h) return;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }

    _quadro() {
      const dt = Math.min(this.relogio.getDelta(), 0.05);
      const t = this.relogio.getElapsedTime();

      // suaviza a pose rumo ao alvo
      const k = 1 - Math.exp(-dt * 4.5);
      for (const key in this.alvo) this.p[key] = lerp(this.p[key], this.alvo[key], k);
      const q = { ...this.p };

      // gestos (alongamentos)
      if (this.gesto) {
        const g = this.gesto, tt = t - g.t0;
        const w = suave(0, 0.7, tt) * (1 - suave(g.dur - 0.7, g.dur, tt));
        const o = GESTOS[g.tipo](tt);
        for (const key in o) q[key] = lerp(q[key], o[key], w);
        if (tt >= g.dur) {
          if (g.pausa && this.pausa) this._proximoPasso(); else this.gesto = null;
        }
      }
      this._aplicarRig(q, t);

      // câmera
      if (this.animCam) {
        const a = this.animCam; a.t = Math.min(1, a.t + dt / 1.1);
        const e = suave(0, 1, a.t);
        this.camera.position.lerpVectors(a.de.pos, a.para.pos, e);
        this.controls.target.lerpVectors(a.de.alvo, a.para.alvo, e);
        if (a.t >= 1) this.animCam = null;
      }
      this.controls.autoRotate = this.rotacaoAuto;
      this.controls.autoRotateSpeed = 1.2;
      this.controls.update();

      // pulsar dos hotspots
      Object.entries(this.hotspots).forEach(([reg, sprites]) => {
        const v = this.severidade[reg];
        if (v === undefined || v === null) return;
        const temDor = this.dor && this.dor.has(reg);
        const vel = temDor ? 6 : 2 + v;
        const base = 0.1 + v * 0.05 + (temDor ? 0.05 : 0);
        const s = base * (1 + (v >= 2 ? 0.22 : 0.08) * Math.sin(t * vel));
        sprites.forEach(sp => sp.scale.set(s, s, s));
      });

      this.renderer.render(this.scene, this.camera);
      this._atualizarRotulos();
    }

    _aplicarRig(q, t) {
      const R = this.rig;
      // cadeira
      const h = q.chairH;
      this.assento.position.y = h;
      this.pistao.scale.y = Math.max(0.05, h - 0.17);
      this.pistao.position.y = 0.09 + (h - 0.17) / 2;
      this.cadeiraFixa.position.y = h;
      this.pernasFixa.forEach(l => { l.scale.y = h - 0.04; l.position.y = -0.04 - (h - 0.04) / 2; });
      this.cadeiraEscritorio.position.z = -0.02 + Math.min(0, q.pelvisZ);
      this.cadeiraFixa.position.z = this.cadeiraEscritorio.position.z;

      R.quadril.position.set(0, h + 0.07, q.pelvisZ);
      R.lombar.rotation.x = q.spineLow;
      R.torax.rotation.x = q.chest;
      R.torax.rotation.z = q.chestZ;
      R.pescoco.rotation.set(q.neck, 0, q.headTilt * 0.45);
      R.cabeca.rotation.set(q.head, 0, q.headTilt * 0.55);

      const B = R.braco;
      B.L.ombro.position.set(0.19, 0.27 + q.shLY, -0.01 + q.shZ);
      B.R.ombro.position.set(-0.19, 0.27 + q.shRY, -0.01 + q.shZ);
      B.L.braco.rotation.set(q.uArmLX, 0, q.uArmLZ);
      B.R.braco.rotation.set(q.uArmRX, 0, q.uArmRZ);
      B.L.ante.rotation.set(q.fArmLX, 0, -0.12);
      B.R.ante.rotation.set(q.fArmRX, 0, 0.12);
      B.L.mao.rotation.x = q.handLX;
      B.R.mao.rotation.x = q.handRX;

      const sw = q.swing * 0.16;
      const P = R.perna;
      P.L.coxa.rotation.x = q.thighX; P.R.coxa.rotation.x = q.thighX;
      P.L.canela.rotation.x = q.shinX + sw * Math.sin(t * 2.3);
      P.R.canela.rotation.x = q.shinX + sw * Math.sin(t * 2.3 + 2.2);
      P.L.pe.rotation.x = q.footX; P.R.pe.rotation.x = q.footX;

      // equipamentos
      this.teclado.position.z = q.kbZ;
      const topo = q.monY + 0.17;
      this.monPoste.scale.y = Math.max(0.05, q.monY - MESA_Y);
      this.monPoste.position.y = MESA_Y + (q.monY - MESA_Y) / 2;
      this.monTela.position.y = q.monY;
      this.monTela.visible = topo > 0;
      this.nbSuporte.visible = q.nbY > 0.02;
      this.nbSuporte.scale.y = Math.max(0.01, q.nbY);
      this.nbSuporte.position.y = q.nbY / 2;
      this.nbCorpo.position.y = q.nbY;
      this.nbCorpo.rotation.x = q.nbY > 0.02 ? -0.25 * (q.nbY / 0.3) : 0;
    }

    _atualizarRotulos() {
      if (!this.rotuloEls || !this.rotuloEls.length) return;
      const w = this.container.clientWidth, h = this.container.clientHeight;
      const estreito = w < 560;
      const ancoras = this.rotuloEls.map(o => {
        const sp = this.hotspots[o.r.regiao][0];
        sp.getWorldPosition(this._tmp);
        this._tmp.project(this.camera);
        return { o, x: (this._tmp.x + 1) / 2 * w, y: (1 - this._tmp.y) / 2 * h, ok: this._tmp.z < 1 };
      }).sort((a, b) => a.y - b.y);
      const larg = estreito ? 150 : 210;
      let ultimoFim = -Infinity;
      ancoras.forEach(a => {
        a.o.el.style.width = larg + 'px';
        const altura = a.o.el.offsetHeight || 50;
        let y = Math.max(12, Math.min(h - altura - 12, a.y - altura / 2));
        if (y < ultimoFim + 8) y = ultimoFim + 8;
        ultimoFim = y + altura;
        const x = w - larg - 12;
        a.o.el.style.transform = `translate(${x}px, ${y}px)`;
        a.o.el.style.opacity = a.ok ? 1 : 0;
        const cx = x - 4, cy = y + altura / 2;
        a.o.linha.setAttribute('points', `${a.x},${a.y} ${cx - 24},${cy} ${cx},${cy}`);
        a.o.ponto.setAttribute('cx', a.x); a.o.ponto.setAttribute('cy', a.y);
      });
    }

    /** Graus de flexão do pescoço exibidos (para o rótulo de carga cervical) */
    flexaoPescocoGraus() {
      return Math.max(0, (this.alvo.neck + this.alvo.head) * 180 / Math.PI);
    }
  }

  window.ErgoCena = ErgoCena;
})();
