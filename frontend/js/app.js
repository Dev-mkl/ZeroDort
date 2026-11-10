/* =========================================================
   LÓGICA DA APLICAÇÃO (telas, questionário, pontuação e integração API)
   ========================================================= */
(function () {
  'use strict';

  /* >>> Troque pelo link do repositório do grupo <<< */
  const CONFIG = {
    repositorio: 'https://github.com/Dev-mkl/ZeroDort',
    apiUrl: 'http://localhost:8080' // URL do seu backend Spring Boot
  };

  const NOMES_SEV = ['OK', 'Atenção', 'Alto', 'Crítico'];
  const CORES_SEV = ['#22c55e', '#eab308', '#f97316', '#ef4444'];

  const PASSOS_PAUSA = [
    { tipo: 'pescoco', dur: 8, titulo: 'Inclinação lateral do pescoço', desc: 'Leve a orelha em direção ao ombro, devagar, alternando os lados. Sem forçar.' },
    { tipo: 'ombros',  dur: 7, titulo: 'Rotação dos ombros', desc: 'Braços soltos. Suba os ombros em direção às orelhas e gire para trás.' },
    { tipo: 'punhos',  dur: 8, titulo: 'Alongamento de punhos', desc: 'Braços estendidos à frente. Dobre os punhos para cima e para baixo, lentamente.' },
    { tipo: 'bracos',  dur: 8, titulo: 'Braços acima da cabeça', desc: 'Entrelace os dedos, estique os braços para cima e incline o tronco para os lados.' },
  ];

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const app = {
    nome: '',
    idx: 0,
    respostas: {},        // P1: índice | P9: [índices]
    cena: null,
    tela: 'inicio',
    resultadoBackend: null // NOVO: Guarda a resposta da API (chave, score, posicao)
  };

  /* ================= INÍCIO ================= */
  $$('.js-repo').forEach(a => { a.href = CONFIG.repositorio; });

  $('#form-nome').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const nome = $('#campo-nome').value.trim();
    if (!nome) { $('#erro-nome').hidden = false; $('#campo-nome').focus(); return; }
    $('#erro-nome').hidden = true;
    app.nome = nome;
    app.idx = 0;
    app.respostas = {};
    app.resultadoBackend = null;
    $('.lat-btn[data-ir="resultado"]').disabled = true;
    $('#nome-usuario').textContent = nome;
    $('#ini-usuario').textContent = nome.charAt(0).toUpperCase();
    mostrarApp();
    irPara('quiz');
  });

  function mostrarTela(id) {
    $$('.tela').forEach(t => t.classList.toggle('ativa', t.id === id));
    window.scrollTo(0, 0);
  }

  function mostrarApp() {
    mostrarTela('tela-app');
    if (!app.cena) {
      if (!window.THREE || !window.ErgoCena) {
        $('#sem-3d').hidden = false;
      } else {
        try {
          app.cena = new ErgoCena($('#viewport'), $('#rotulos'));
        } catch (e) {
          console.error(e);
          $('#sem-3d').hidden = false;
        }
      }
    }
    atualizarTudo();
  }

  /* ================= NAVEGAÇÃO ================= */
  function irPara(destino) {
    if (destino === 'inicio') { pararPausa(); mostrarTela('tela-inicial'); app.tela = 'inicio'; return; }
    if (destino === 'pausa') { iniciarPausa(); return; }
    if (destino === 'resultado' && !completo()) return;
    app.tela = destino;
    $('#painel-pergunta').hidden = destino !== 'quiz';
    $('#painel-resultado').hidden = destino !== 'resultado';
    $$('.lat-btn[data-ir]').forEach(b => b.classList.toggle('ativo', b.dataset.ir === destino));
    $('#card-pausa').classList.toggle('destaque-pausa', destino === 'resultado');
    if (destino === 'quiz') renderPergunta();
    if (destino === 'resultado') renderResultado();
  }

  $$('.lat-btn[data-ir]').forEach(b => b.addEventListener('click', () => irPara(b.dataset.ir)));

  function completo() { return QUESTOES.every(q => respondida(q)); }
  function respondida(q) {
    const r = app.respostas[q.id];
    return q.multipla ? Array.isArray(r) && r.length > 0 : r !== undefined;
  }

  /* ================= PERGUNTA ================= */
  function renderPergunta() {
    const q = QUESTOES[app.idx];
    $('#p-num').textContent = q.id;
    $('#p-bloco').textContent = 'Bloco ' + q.bloco + ' · ' + BLOCOS[q.bloco];
    $('#p-contador').textContent = (app.idx + 1) + ' de ' + QUESTOES.length;
    $('#p-texto').textContent = q.texto;
    $('#p-multi').hidden = !q.multipla;
    $('#hud-bloco').textContent = 'Bloco ' + q.bloco + ' · ' + BLOCOS[q.bloco];

    const box = $('#opcoes');
    box.innerHTML = '';
    box.setAttribute('role', q.multipla ? 'group' : 'radiogroup');
    q.opcoes.forEach((o, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'opcao' + (q.multipla ? ' multi' : '');
      b.setAttribute('role', q.multipla ? 'checkbox' : 'radio');
      b.innerHTML = `<span class="marcador"></span><span>${o.texto}</span><span class="tecla">${i + 1}</span>`;
      b.addEventListener('click', () => selecionar(i));
      box.appendChild(b);
    });
    marcarSelecionadas();
    renderProgresso();
    $('#btn-voltar').disabled = app.idx === 0;
    atualizarBotaoProxima();
    mostrarEfeito();
    if (app.cena) app.cena.focar(q.foco);
  }

  function marcarSelecionadas() {
    const q = QUESTOES[app.idx];
    const r = app.respostas[q.id];
    $$('#opcoes .opcao').forEach((b, i) => {
      const sel = q.multipla ? (r || []).includes(i) : r === i;
      b.classList.toggle('sel', sel);
      b.setAttribute('aria-checked', sel);
    });
  }

  function atualizarBotaoProxima() {
    const q = QUESTOES[app.idx];
    const ultima = app.idx === QUESTOES.length - 1;
    const btn = $('#btn-proxima');
    btn.disabled = !respondida(q);
    btn.innerHTML = (ultima ? 'Ver resultado' : 'Próxima') + ' <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  }

  function selecionar(i) {
    const q = QUESTOES[app.idx];
    if (q.multipla) {
      let r = (app.respostas[q.id] || []).slice();
      const o = q.opcoes[i];
      if (o.exclusiva) r = r.includes(i) ? [] : [i];
      else {
        r = r.filter(k => !q.opcoes[k].exclusiva);
        r = r.includes(i) ? r.filter(k => k !== i) : r.concat(i);
      }
      app.respostas[q.id] = r;
    } else {
      app.respostas[q.id] = i;
      // P8 "pausas frequentes": o avatar faz um alongamento rápido
      if (q.opcoes[i].pose.pausas === 'frequente' && app.cena) app.cena.gestoRapido('alongar', 2.8);
    }
    marcarSelecionadas();
    atualizarBotaoProxima();
    atualizarTudo();
    mostrarEfeito(i);
    renderProgresso();
  }

  function mostrarEfeito(iClicado) {
    const q = QUESTOES[app.idx];
    const r = app.respostas[q.id];
    const el = $('#vp-efeito');
    let o = null;
    if (q.multipla) {
      if (iClicado !== undefined && (r || []).includes(iClicado)) o = q.opcoes[iClicado];
      else if (r && r.length) o = q.opcoes[r[r.length - 1]];
    } else if (r !== undefined) o = q.opcoes[r];
    if (!o) { el.hidden = true; return; }
    const sev = Math.max(0, ...Object.values(o.regioes));
    el.className = 'vp-efeito sev-' + sev;
    el.textContent = o.efeito;
    el.hidden = false;
    // reinicia a animação de entrada
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  }

  function renderProgresso() {
    const box = $('#progresso');
    box.innerHTML = '';
    QUESTOES.forEach((q, i) => {
      if (i > 0 && QUESTOES[i - 1].bloco !== q.bloco) {
        const s = document.createElement('span'); s.className = 'sep'; box.appendChild(s);
      }
      const b = document.createElement('button');
      b.type = 'button';
      b.title = q.id;
      b.setAttribute('aria-label', 'Ir para ' + q.id);
      if (respondida(q)) b.classList.add('feito');
      if (i === app.idx) b.classList.add('atual');
      // só permite pular para perguntas já liberadas
      const liberada = i <= app.idx || QUESTOES.slice(0, i).every(respondida);
      b.disabled = !liberada;
      b.addEventListener('click', () => { app.idx = i; renderPergunta(); });
      box.appendChild(b);
    });
  }

  $('#btn-voltar').addEventListener('click', () => {
    if (app.idx > 0) { app.idx--; renderPergunta(); }
  });
  
  $('#btn-proxima').addEventListener('click', avancar);

  // ==========================================
  // INTEGRAÇÃO COM O BACKEND (MODIFICADO AQUI)
  // ==========================================
  async function avancar() {
    const q = QUESTOES[app.idx];
    if (!respondida(q)) return;
    
    if (app.idx < QUESTOES.length - 1) { 
      app.idx++; 
      renderPergunta(); 
    } else {
      // Chegou na última pergunta. Prepara o envio para o Spring Boot.
      const btn = $('#btn-proxima');
      const htmlOriginal = btn.innerHTML;
      btn.innerHTML = 'Salvando...';
      btn.disabled = true;

      // 1. Monta a lista de perguntas no formato que o DTO Java espera
      const perguntasPayload = [];
      
      QUESTOES.forEach(perguntaObj => {
          const resposta = app.respostas[perguntaObj.id];
          if (resposta !== undefined) {
              if (perguntaObj.multipla) {
                  resposta.forEach(idxOpcao => {
                      const opc = perguntaObj.opcoes[idxOpcao];
                      perguntasPayload.push({
                          pergunta: perguntaObj.id,
                          regiao: Object.keys(opc.regioes)[0] || "geral", // Pega a primeira região (ex: "lombar")
                          pontuacao: opc.pts
                      });
                  });
              } else {
                  const opc = perguntaObj.opcoes[resposta];
                  perguntasPayload.push({
                      pergunta: perguntaObj.id,
                      regiao: Object.keys(opc.regioes)[0] || "geral",
                      pontuacao: opc.pts
                  });
              }
          }
      });

      // 2. Monta o objeto igual ao seu AvaliacaoRequest.java
      const payload = {
          estudiosoId: 1, // ID fixo criado no DataInitializer.java
          perguntas: perguntasPayload
      };

      try {
          // 3. Faz a requisição HTTP para o backend
          const response = await fetch(`${CONFIG.apiUrl}/avaliacao`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          if (!response.ok) throw new Error('Falha ao salvar no servidor');

          // Recebe { chave, score, posicao }
          const data = await response.json(); 
          app.resultadoBackend = data;

          $('.lat-btn[data-ir="resultado"]').disabled = false;
          irPara('resultado');

      } catch (error) {
          console.error("Erro na integração:", error);
          alert('Erro: Não foi possível salvar a avaliação. Verifique se o backend Spring Boot está rodando na porta 8080.');
      } finally {
          // Restaura o botão
          btn.innerHTML = htmlOriginal;
          btn.disabled = false;
      }
    }
  }

  document.addEventListener('keydown', (ev) => {
    if (app.tela !== 'quiz' || !$('#tela-app').classList.contains('ativa')) return;
    if (ev.target.tagName === 'INPUT') return;
    const q = QUESTOES[app.idx];
    const n = parseInt(ev.key, 10);
    if (n >= 1 && n <= q.opcoes.length) selecionar(n - 1);
    else if (ev.key === 'Enter' && !$('#btn-proxima').disabled && ev.target.tagName !== 'BUTTON') avancar();
    else if (ev.key === 'ArrowRight' && !$('#btn-proxima').disabled) avancar();
    else if (ev.key === 'ArrowLeft' && app.idx > 0) { app.idx--; renderPergunta(); }
  });

  /* ================= CÁLCULO ================= */
  function opcoesEscolhidas(q) {
    const r = app.respostas[q.id];
    if (r === undefined) return [];
    return q.multipla ? r.map(i => q.opcoes[i]) : [q.opcoes[r]];
  }

  function calcular(ateIndice = QUESTOES.length - 1) {
    let pts = 0;
    const sev = {};
    const dor = [];
    let alerta = false;
    const pose = {};
    QUESTOES.forEach((q, i) => {
      if (i > ateIndice) return;
      opcoesEscolhidas(q).forEach(o => {
        pts += o.pts;
        Object.entries(o.regioes).forEach(([reg, v]) => { sev[reg] = Math.max(sev[reg] ?? -1, v); });
        Object.assign(pose, o.pose);
        if (o.dor) dor.push(o.dor);
        if (o.alerta) alerta = true;
      });
    });
    const nota = Math.min(10, pts / PONTOS_MAXIMOS * 10);
    let faixa = FAIXAS.find(f => nota < f.ate) || FAIXAS[FAIXAS.length - 1];
    if (alerta && FAIXAS.indexOf(faixa) < 2) faixa = FAIXAS[2]; // formigamento => no mínimo "ALTO"
    return { pts, nota, faixa, sev, dor, alerta, pose };
  }

  /* ================= ATUALIZAÇÃO VISUAL ================= */
  function atualizarTudo() {
    const r = calcular();
    const algumaResposta = Object.keys(app.respostas).length > 0;

    // termômetro
    $('#nota-valor').textContent = algumaResposta ? r.nota.toFixed(1) : '—';
    $('#nota-valor').style.color = algumaResposta ? r.faixa.cor : '';
    $('#nota-faixa').textContent = algumaResposta ? r.faixa.nome : 'sem respostas';
    $('#nota-faixa').style.color = algumaResposta ? r.faixa.cor : '';
    $('#nota-marcador').style.left = (r.nota * 10) + '%';
    $('#nota-pontos').textContent = r.pts + ' de ' + PONTOS_MAXIMOS + ' pts';

    // regiões
    const ul = $('#lista-regioes');
    ul.innerHTML = '';
    Object.entries(REGIOES).forEach(([k, info]) => {
      const v = r.sev[k];
      const li = document.createElement('li');
      const temValor = v !== undefined;
      li.innerHTML = `<span class="ponto"></span><span>${info.nome}</span>` +
        (r.dor.includes(k) ? '<span class="dor">DOR</span>' : '') +
        `<span class="estado">${temValor ? NOMES_SEV[v] : '—'}</span>`;
      if (temValor) {
        li.querySelector('.ponto').style.background = CORES_SEV[v];
        li.querySelector('.ponto').style.boxShadow = `0 0 8px ${CORES_SEV[v]}`;
        li.querySelector('.estado').style.color = CORES_SEV[v];
      }
      ul.appendChild(li);
    });

    desenharGrafico();

    // cena 3D
    if (app.cena) {
      app.cena.aplicarEstado(r.pose);
      app.cena.definirSeveridade(r.sev, r.dor);
      app.cena.definirRotulos(montarRotulos(r));
    }
  }

  /* Carga na cervical por ângulo de flexão (Hansraj, 2014) */
  function cargaCervical(graus) {
    const tab = [[0, 5], [15, 12], [30, 18], [45, 22], [60, 27]];
    for (let i = 1; i < tab.length; i++) {
      if (graus <= tab[i][0]) {
        const [a0, k0] = tab[i - 1], [a1, k1] = tab[i];
        return k0 + (k1 - k0) * (graus - a0) / (a1 - a0);
      }
    }
    return 27;
  }

  function montarRotulos(r) {
    const p = { ...r.pose };
    const lista = [];
    const add = (regiao, titulo, linha) => {
      const sev = r.sev[regiao];
      if (sev === undefined || sev < 2) return;
      lista.push({ regiao, titulo, linha, sev });
    };
    const temDor = (k) => r.dor.includes(k);

    // cervical
    const graus = app.cena ? Math.round(app.cena.flexaoPescocoGraus()) : 0;
    if (p.fone === 'ombro') add('cervical', 'Cervical (C1–C7)', 'Inclinação lateral · ~' + Math.round(cargaCervical(graus)) + ' kg');
    else if (graus > 12) add('cervical', 'Cervical (C1–C7)', `Flexão ~${graus}° · carga ~${Math.round(cargaCervical(graus))} kg`);
    else if (temDor('cervical')) add('cervical', 'Cervical (C1–C7)', 'Dor relatada no pescoço');

    // lombar
    if (p.cadeira === 'fixa') add('lombar', 'Lombar (L4–L5 / L5–S1)', 'Pressão no disco ~185%' + (temDor('lombar') ? ' · dor' : ''));
    else if (temDor('lombar')) add('lombar', 'Lombar (L4–L5 / L5–S1)', 'Dor relatada na lombar');

    // ombros
    if (p.fone === 'ombro') add('ombros', 'Ombros / Trapézio', 'Ombro elevado para prender o telefone');
    else if (p.bracos === 'esticados') add('ombros', 'Ombros', 'Braços projetados à frente');
    else if (temDor('ombros')) add('ombros', 'Ombros', 'Dor relatada nos ombros');

    // punhos
    if (temDor('punhos')) add('punhos', 'Punhos / Mãos', 'ALERTA: formigamento / dormência');
    else if (p.bracos === 'esticados') add('punhos', 'Punhos', 'Dorsiflexão ~30° ao digitar');

    add('pes', 'Pés / Coxas', 'Pés suspensos: coxa comprimida no assento');
    add('coluna', 'Coluna', 'Fadiga por horas sem pausa');
    add('cotovelos', 'Antebraços', 'Apoio em quina viva');

    // mostra os 3 piores
    return lista.sort((a, b) => b.sev - a.sev).slice(0, 3);
  }

  function desenharGrafico() {
    const cv = $('#grafico');
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth || 300, h = 140;
    cv.width = w * dpr; cv.height = h * dpr;
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const pad = { l: 26, r: 8, t: 8, b: 20 };
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    const X = (i) => pad.l + (iw * i) / (QUESTOES.length - 1);
    const Y = (v) => pad.t + ih - (ih * v) / 10;

    // faixas de risco
    const faixas = [[0, 2, '34,197,94'], [2, 4, '234,179,8'], [4, 6, '249,115,22'], [6, 10, '239,68,68']];
    faixas.forEach(([a, b, c]) => { g.fillStyle = `rgba(${c},0.07)`; g.fillRect(pad.l, Y(b), iw, Y(a) - Y(b)); });
    g.font = '10px Inter, sans-serif'; g.fillStyle = '#64748b'; g.textAlign = 'right';
    [0, 2, 4, 6, 10].forEach(v => g.fillText(v, pad.l - 6, Y(v) + 3));
    g.textAlign = 'center';
    QUESTOES.forEach((q, i) => g.fillText(q.id, X(i), h - 5));

    // série: nota acumulada após cada pergunta respondida
    const pts = [];
    for (let i = 0; i < QUESTOES.length; i++) {
      if (!respondida(QUESTOES[i])) break;
      pts.push({ x: X(i), y: Y(calcular(i).nota), v: calcular(i).nota });
    }
    if (!pts.length) {
      g.fillStyle = '#64748b'; g.font = '12px Inter, sans-serif';
      g.fillText('Responda para ver a evolução', pad.l + iw / 2, pad.t + ih / 2);
      return;
    }
    const grad = g.createLinearGradient(0, Y(10), 0, Y(0));
    grad.addColorStop(0, '#ef4444'); grad.addColorStop(0.45, '#f97316'); grad.addColorStop(0.7, '#eab308'); grad.addColorStop(1, '#22c55e');
    // área
    g.beginPath(); g.moveTo(pts[0].x, Y(0));
    pts.forEach(p => g.lineTo(p.x, p.y));
    g.lineTo(pts[pts.length - 1].x, Y(0)); g.closePath();
    g.fillStyle = 'rgba(56,189,248,0.08)'; g.fill();
    // linha
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
    g.strokeStyle = grad; g.lineWidth = 2.5; g.lineJoin = 'round'; g.stroke();
    pts.forEach(p => {
      g.beginPath(); g.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      g.fillStyle = '#0f172a'; g.fill(); g.strokeStyle = '#38bdf8'; g.lineWidth = 2; g.stroke();
    });
  }
  window.addEventListener('resize', desenharGrafico);

  /* ================= RESULTADO ================= */
  function renderResultado() {
    const r = calcular();
    $('#res-titulo').textContent = `${app.nome}, seu risco ergonômico é ${r.faixa.nome}`;
    $('#res-texto').textContent = r.faixa.texto;
    const nota = $('#res-nota');
    nota.querySelector('b').textContent = r.nota.toFixed(1);
    nota.style.borderColor = r.faixa.cor;
    nota.querySelector('b').style.color = r.faixa.cor;
    $('#res-alerta').hidden = !r.alerta;

    // NOVO: Exibe os dados vindos do backend (Chave e Posição)
    if (app.resultadoBackend) {
        const alertaChave = $('#res-alerta-chave');
        if(alertaChave) {
            alertaChave.hidden = false;
            $('#res-chave').textContent = app.resultadoBackend.chave;
            $('#res-posicao').textContent = app.resultadoBackend.posicao + 'º';
        }
    }

    // resumo por bloco
    const blocos = $('#res-blocos');
    blocos.innerHTML = '';
    Object.entries(BLOCOS).forEach(([n, nome]) => {
      const qs = QUESTOES.filter(q => q.bloco === +n);
      const max = qs.reduce((s, q) => s + (q.multipla ? q.opcoes.reduce((a, o) => a + o.pts, 0) : Math.max(...q.opcoes.map(o => o.pts))), 0);
      const pts = qs.reduce((s, q) => s + opcoesEscolhidas(q).reduce((a, o) => a + o.pts, 0), 0);
      const pct = max ? pts / max : 0;
      const cor = pct < 0.2 ? CORES_SEV[0] : pct < 0.4 ? CORES_SEV[1] : pct < 0.65 ? CORES_SEV[2] : CORES_SEV[3];
      const div = document.createElement('div');
      div.className = 'res-bloco';
      div.innerHTML = `<small>Bloco ${n}</small><b>${nome}</b>
        <div class="mini"><i style="width:${Math.max(4, pct * 100)}%;background:${cor}"></i></div>
        <span>${pts} de ${max} pts</span>`;
      blocos.appendChild(div);
    });

    // recomendações ordenadas pelo peso
    const recs = [];
    QUESTOES.forEach(q => opcoesEscolhidas(q).forEach(o => {
      if (o.dica) recs.push({ q, o, sev: Math.max(0, ...Object.values(o.regioes)) });
    }));
    recs.sort((a, b) => b.o.pts - a.o.pts);
    const ol = $('#res-recomendacoes');
    ol.innerHTML = '';
    if (!recs.length) {
      const li = document.createElement('li');
      li.style.setProperty('--cor', CORES_SEV[0]);
      li.innerHTML = '<div>Nenhum fator de risco relevante encontrado. Mantenha as pausas e os ajustes do seu posto!</div>';
      ol.appendChild(li);
    }
    recs.forEach(({ q, o, sev }) => {
      const li = document.createElement('li');
      li.style.setProperty('--cor', CORES_SEV[sev]);
      li.innerHTML = `<div>${o.dica}<small>${q.id} · ${o.texto} · +${o.pts} pts</small></div>`;
      ol.appendChild(li);
    });

    if (app.cena) app.cena.focar('geral');
  }

  $('#btn-refazer').addEventListener('click', () => {
    app.respostas = {}; 
    app.idx = 0;
    app.resultadoBackend = null; // Limpa os dados do backend
    $('.lat-btn[data-ir="resultado"]').disabled = true;
    atualizarTudo();
    irPara('quiz');
  });
  $('#btn-imprimir').addEventListener('click', () => window.print());
  $('#btn-inicio').addEventListener('click', () => irPara('inicio'));

  /* ================= CÂMERA ================= */
  $('#btn-camera').addEventListener('click', () => app.cena && app.cena.focar('geral'));
  $('#btn-girar').addEventListener('click', (ev) => {
    if (!app.cena) return;
    app.cena.rotacaoAuto = !app.cena.rotacaoAuto;
    ev.currentTarget.classList.toggle('ativo', app.cena.rotacaoAuto);
  });

  /* ================= PAUSA ATIVA ================= */
  let pausaTimer = null;
  function iniciarPausa() {
    if (!app.cena) return;
    if (app.cena.pausa) { pararPausa(); return; }
    $('#pausa-hud').hidden = false;
    $('#vp-efeito').hidden = true;
    $('#rotulos').style.display = 'none';
    $('#btn-pausa').innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg> Parar pausa';
    $('.lat-btn[data-ir="pausa"]').classList.add('ativo');
    let inicioPasso = performance.now();
    app.cena.iniciarPausa(PASSOS_PAUSA, (i) => {
      const p = PASSOS_PAUSA[i];
      inicioPasso = performance.now();
      $('#pausa-passo').textContent = (i + 1) + '/' + PASSOS_PAUSA.length;
      $('#pausa-titulo').textContent = p.titulo;
      $('#pausa-desc').textContent = p.desc;
    }, () => fimPausa());
    clearInterval(pausaTimer);
    pausaTimer = setInterval(() => {
      const pz = app.cena.pausa;
      if (!pz) return;
      const dur = PASSOS_PAUSA[pz.i].dur * 1000;
      $('#pausa-progresso').style.width = Math.min(100, (performance.now() - inicioPasso) / dur * 100) + '%';
    }, 100);
  }
  function pararPausa() { if (app.cena && app.cena.pausa) app.cena.pararPausa(); }
  function fimPausa() {
    clearInterval(pausaTimer);
    $('#pausa-hud').hidden = true;
    $('#rotulos').style.display = '';
    $('#btn-pausa').innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg> Iniciar pausa';
    $('.lat-btn[data-ir="pausa"]').classList.remove('ativo');
    if (app.cena) app.cena.focar(app.tela === 'quiz' ? QUESTOES[app.idx].foco : 'geral');
  }
  $('#btn-pausa').addEventListener('click', iniciarPausa);
  $('#btn-parar-pausa').addEventListener('click', pararPausa);
})();