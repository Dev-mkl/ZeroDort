/* =========================================================
   LÓGICA DA APLICAÇÃO (telas, questionário, pontuação e integração API)
   ========================================================= */
(function () {
  'use strict';

  /* >>> Troque pelo link do repositório do grupo <<< */
  const CONFIG = {
    repositorio: 'https://github.com/Dev-mkl/ZeroDort',
    apiUrl: 'https://zerodort.onrender.com/api'
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
    respostas: {},        // Respostas indexadas pelos códigos estáveis P1-P13
    cena: null,
    tela: 'inicio',
    resultadoBackend: null // NOVO: Guarda a resposta da API (chave, score, posicao)
  };

  /* ================= INÍCIO ================= */
  $$('.js-repo').forEach(a => { a.href = CONFIG.repositorio; });

  $('#form-nome').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const nome = $('#campo-nome').value.trim();
    if (!nome) { $('#erro-nome').hidden = false; $('#campo-nome').focus(); return; }
    const form = ev.currentTarget;
    const botao = form.querySelector('button[type="submit"]');
    const textoOriginal = botao.innerHTML;
    const erro = $('#erro-nome');
    erro.hidden = true;
    botao.disabled = true;
    botao.textContent = 'Verificando nome...';

    try {
      const response = await fetch(
        `${CONFIG.apiUrl}/usuarios/disponibilidade?${new URLSearchParams({ nome })}`
      );
      if (!response.ok) {
        const detalhe = await response.text();
        throw new Error(detalhe || 'Não foi possível verificar o nome.');
      }

      const { disponivel } = await response.json();
      if (!disponivel) {
        erro.textContent = 'Este nome já está em uso. Escolha outro nome para continuar.';
        erro.hidden = false;
        $('#campo-nome').focus();
        return;
      }

      erro.textContent = 'Digite seu nome para continuar.';
      app.nome = nome;
      app.idx = 0;
      app.respostas = {};
      app.resultadoBackend = null;
      $('.lat-btn[data-ir="resultado"]').disabled = true;
      $('#nome-usuario').textContent = nome;
      $('#ini-usuario').textContent = nome.charAt(0).toUpperCase();
      mostrarApp();
      irPara('quiz');
    } catch (error) {
      console.error('Erro ao verificar disponibilidade do nome:', error);
      erro.textContent = 'Não foi possível verificar o nome. Confira a conexão e tente novamente.';
      erro.hidden = false;
    } finally {
      botao.disabled = false;
      botao.innerHTML = textoOriginal;
    }
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
    $('#tela-app').dataset.tela = destino; // usado no CSS do celular (boneco fixo só no questionário)
    $('#painel-pergunta').hidden = destino !== 'quiz';
    $('#painel-resultado').hidden = destino !== 'resultado';
    $$('.lat-btn[data-ir]').forEach(b => b.classList.toggle('ativo', b.dataset.ir === destino));
    $('#card-pausa').classList.toggle('destaque-pausa', destino === 'resultado');
    if (destino === 'quiz') renderPergunta();
    if (destino === 'resultado') renderResultado();
  }

  $$('.lat-btn[data-ir]').forEach(b => b.addEventListener('click', () => irPara(b.dataset.ir)));

  function questoesDoFluxo() { return perguntasAtivas(app.respostas); }
  function perguntaAtual() { return questoesDoFluxo()[app.idx]; }
  function completo() { return questoesDoFluxo().every(respondida); }
  function respondida(q) {
    const r = app.respostas[q.id];
    return q.multipla ? Array.isArray(r) && r.length > 0 : r !== undefined;
  }

  /* ================= PERGUNTA ================= */
  function renderPergunta() {
    const fluxo = questoesDoFluxo();
    app.idx = Math.max(0, Math.min(app.idx, fluxo.length - 1));
    const q = fluxo[app.idx];
    if (!q) return;
    $('#p-num').textContent = q.id;
    $('#p-bloco').textContent = 'Bloco ' + q.bloco + ' · ' + BLOCOS[q.bloco];
    $('#p-contador').textContent = (app.idx + 1) + ' de ' + fluxo.length;
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
    const q = perguntaAtual();
    if (!q) return;
    const r = app.respostas[q.id];
    $$('#opcoes .opcao').forEach((b, i) => {
      const sel = q.multipla ? (r || []).includes(i) : r === i;
      b.classList.toggle('sel', sel);
      b.setAttribute('aria-checked', sel);
    });
  }

  function atualizarBotaoProxima() {
    const fluxo = questoesDoFluxo();
    const q = fluxo[app.idx];
    if (!q) return;
    const ultima = app.idx === fluxo.length - 1;
    const btn = $('#btn-proxima');
    btn.disabled = !respondida(q);
    btn.innerHTML = (ultima ? 'Ver resultado' : 'Próxima') + ' <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  }

  function selecionar(i) {
    const q = perguntaAtual();
    if (!q) return;
    if (q.multipla) {
      let r = (app.respostas[q.id] || []).slice();
      const o = q.opcoes[i];
      if (o.exclusiva) r = r.includes(i) ? [] : [i];
      else {
        r = r.filter(k => !q.opcoes[k].exclusiva);
        r = r.includes(i) ? r.filter(k => k !== i) : r.concat(i);
      }
      app.respostas[q.id] = r;
    } else app.respostas[q.id] = i;
    const idsAtivos = new Set(questoesDoFluxo().map(pergunta => pergunta.id));
    Object.keys(app.respostas).forEach(id => {
      if (!idsAtivos.has(id)) delete app.respostas[id];
    });
    const novoIndice = questoesDoFluxo().findIndex(pergunta => pergunta.id === q.id);
    app.idx = Math.max(0, novoIndice);
    marcarSelecionadas();
    atualizarBotaoProxima();
    atualizarTudo();
    mostrarEfeito(i);
    renderProgresso();
  }

  function mostrarEfeito(iClicado) {
    const q = perguntaAtual();
    if (!q) return;
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
    const fluxo = questoesDoFluxo();
    fluxo.forEach((q, i) => {
      if (i > 0 && fluxo[i - 1].bloco !== q.bloco) {
        const s = document.createElement('span'); s.className = 'sep'; box.appendChild(s);
      }
      const b = document.createElement('button');
      b.type = 'button';
      b.title = q.id;
      b.setAttribute('aria-label', 'Ir para ' + q.id);
      if (respondida(q)) b.classList.add('feito');
      if (i === app.idx) b.classList.add('atual');
      // só permite pular para perguntas já liberadas
      b.disabled = i > app.idx;
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
    const fluxo = questoesDoFluxo();
    const q = fluxo[app.idx];
    if (!q) return;
    if (!respondida(q)) return;
    
    if (app.idx < fluxo.length - 1) {
      app.idx++; 
      renderPergunta(); 
    } else {
      // Chegou na última pergunta. Prepara o envio para o Spring Boot.
      const btn = $('#btn-proxima');
      const htmlOriginal = btn.innerHTML;
      btn.innerHTML = 'Salvando...';
      btn.disabled = true;

      const perguntasPayload = [];
      fluxo.forEach(pergunta => {
        const resposta = app.respostas[pergunta.id];
        const indices = pergunta.multipla ? resposta : [resposta];
        indices.forEach(indice => {
          const opcao = pergunta.opcoes[indice];
          perguntasPayload.push({
            CodigoPergunta: pergunta.id,
            RespostaId: opcao.texto,
            regiao: Object.keys(opcao.regioes)
          });
        });
      });

      const payload = {
        nome: app.nome,
        perguntas: perguntasPayload
      };

      try {
          const response = await fetch(`${CONFIG.apiUrl}/avaliacao`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const erro = await response.text();
            throw new Error(erro || 'Falha ao salvar no servidor');
          }

          const data = await response.json(); 
          app.resultadoBackend = data;

          $('.lat-btn[data-ir="resultado"]').disabled = false;
          irPara('resultado');

      } catch (error) {
          console.error("Erro na integração:", error);
          alert('Erro ao salvar a avaliação: ' + error.message);
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
    const q = perguntaAtual();
    if (!q) return;
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

  function calcular(ateIndice) {
    const fluxo = questoesDoFluxo();
    const perguntasConsideradas = fluxo.slice(0, (ateIndice ?? fluxo.length - 1) + 1);
    let pontosBase = 0;
    const sev = {};
    const dor = [];
    const pose = {};
    const codigos = {};
    const pontosPorPergunta = {};
    let alerta = false;

    perguntasConsideradas.forEach(q => {
      const opcoes = opcoesEscolhidas(q);
      if (opcoes.length) {
        codigos[q.id] = opcoes.map(opcao => opcao.codigo);
        pontosPorPergunta[q.id] = opcoes.reduce((total, opcao) => total + opcao.pts, 0);
      }
      opcoes.forEach(o => {
        pontosBase += o.pts;
        Object.entries(o.regioes).forEach(([reg, v]) => { sev[reg] = Math.max(sev[reg] ?? -1, v); });
        Object.assign(pose, o.pose);
        if (o.dor) dor.push(o.dor);
        if (o.alerta) alerta = true;
      });
    });

    const tem = (pergunta, codigo) => (codigos[pergunta] || []).includes(codigo);
    const sinergias = [];
    if (tem('P6', 'NOTEBOOK_DIRETO') && tem('P7', 'TELA_MUITO_ABAIXO')) {
      sinergias.push('SYN-01');
      sev.cervical = 3;
      sev.ombros = 3;
      pose.flexaoForcada = true;
      pose.tela = 'baixa';
    }
    if ((tem('P2', 'CADEIRA_FIXA') || tem('P2', 'SEM_AJUSTE_LOMBAR')) && tem('P3', 'PES_SUSPENSOS')) {
      sinergias.push('SYN-02');
      sev.lombar = 3;
      sev.pes = 2;
      pose.cadeira = 'semLombar';
      pose.pes = 'suspensos';
    }
    if (tem('P8', 'TELEFONE_NO_OMBRO') && tem('P9', 'PUNHOS_FORCADOS')) {
      sinergias.push('SYN-03');
      sev.ombros = 3;
      sev.punhos = 3;
      pose.fone = 'ombro';
      pose.bracos = 'esticados';
    }
    const postura = codigos.P1 || [];
    const sentado = postura.includes('SENTADO');
    const emPeOuAlternando = postura.includes('EM_PE_FIXO') || postura.includes('ALTERNANDO');
    if (sentado && tem('P12', 'SEM_PAUSAS')) {
      sinergias.push('SYN-04');
      pose.auraGlobal = true;
      pose.pausas = 'nunca';
      Object.keys(REGIOES).forEach(regiao => { sev[regiao] = Math.max(sev[regiao] ?? -1, 2); });
    }
    const sintomasCriticos = (codigos.P13 || []).some(codigo =>
      codigo === 'SINTOMA_CERVICAL' || codigo === 'SINTOMA_PUNHOS'
    );
    const pontosEquipamento = Object.entries(pontosPorPergunta)
      .filter(([pergunta]) => /^P([2-9]|10|11)$/.test(pergunta))
      .reduce((total, [, pontos]) => total + pontos, 0);
    const alertaCritico = sintomasCriticos && pontosEquipamento > 25;
    if (alertaCritico) sinergias.push('SYN-05');

    if (emPeOuAlternando && tem('P11', 'ALCANCE_EM_PE_CRITICO')) {
      sinergias.push('SYN-06');
      sev.ombros = 3;
      sev.lombar = 3;
      pose.postura = 'emPe';
      pose.alcance = 'critico';
    }

    const bonusSinergia = sinergias.reduce((total, codigo) => total + ({
      'SYN-01': 10, 'SYN-02': 8, 'SYN-03': 12, 'SYN-06': 10
    }[codigo] || 0), 0);
    const multiplicadorGlobal = sinergias.includes('SYN-04') ? 1.15 : 1;
    let nota = Math.floor(Math.min(100, (pontosBase + bonusSinergia) * multiplicadorGlobal));
    if (alertaCritico) nota = Math.max(81, nota);

    const faixa = RISCO_FAIXAS.find(item => nota <= item.ate) || RISCO_FAIXAS[4];
    return {
      pts: pontosBase,
      pontosBase,
      bonusSinergia,
      nota,
      faixa,
      sev,
      dor,
      alerta,
      alertaCritico,
      pose,
      sinergias,
      algumaResposta: Object.keys(app.respostas).length > 0,
    };
  }

  /* ================= ATUALIZAÇÃO VISUAL ================= */
  function atualizarTudo() {
    const r = calcular();
    const algumaResposta = r.algumaResposta;

    // termômetro
    $('#nota-valor').textContent = algumaResposta ? r.nota.toFixed(1) : '—';
    $('#nota-valor').style.color = algumaResposta ? r.faixa.cor : '';
    $('#nota-faixa').textContent = algumaResposta ? r.faixa.nome : 'sem respostas';
    $('#nota-faixa').style.color = algumaResposta ? r.faixa.cor : '';
    $('#nota-marcador').style.left = r.nota + '%';
    $('#nota-pontos').textContent = r.nota + ' de 100 pts' +
      (r.bonusSinergia ? ` (inclui +${r.bonusSinergia} de sinergia)` : '');

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
      app.cena.definirSeveridade(r.sev, r.dor, r.pose.auraGlobal);
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
    const fluxo = questoesDoFluxo();
    const X = (i) => pad.l + (iw * i) / Math.max(1, fluxo.length - 1);
    const Y = (v) => pad.t + ih - (ih * v) / 100;

    // faixas de risco
    const faixas = [[0, 20, '34,197,94'], [20, 40, '234,179,8'], [40, 60, '249,115,22'],
      [60, 80, '239,68,68'], [80, 100, '127,29,29']];
    faixas.forEach(([a, b, c]) => { g.fillStyle = `rgba(${c},0.07)`; g.fillRect(pad.l, Y(b), iw, Y(a) - Y(b)); });
    g.font = '10px Inter, sans-serif'; g.fillStyle = '#64748b'; g.textAlign = 'right';
    [0, 20, 40, 60, 80, 100].forEach(v => g.fillText(v, pad.l - 6, Y(v) + 3));
    g.textAlign = 'center';
    fluxo.forEach((q, i) => g.fillText(q.id, X(i), h - 5));

    // série: nota acumulada após cada pergunta respondida
    const pts = [];
    for (let i = 0; i < fluxo.length; i++) {
      if (!respondida(fluxo[i])) break;
      pts.push({ x: X(i), y: Y(calcular(i).nota), v: calcular(i).nota });
    }
    if (!pts.length) {
      g.fillStyle = '#64748b'; g.font = '12px Inter, sans-serif';
      g.fillText('Responda para ver a evolução', pad.l + iw / 2, pad.t + ih / 2);
      return;
    }
    const grad = g.createLinearGradient(0, Y(100), 0, Y(0));
    grad.addColorStop(0, '#ef4444'); grad.addColorStop(0.45, '#f97316'); grad.addColorStop(0.7, '#eab308'); grad.addColorStop(1, '#22c55e');
    // área
    g.beginPath(); g.moveTo(pts[0].x, Y(0));
    pts.forEach(p => g.lineTo(p.x, p.y));
    g.lineTo(pts[pts.length - 1].x, Y(0)); g.closePath();
    g.fillStyle = 'rgba(14,143,154,0.08)'; g.fill();
    // linha
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
    g.strokeStyle = grad; g.lineWidth = 2.5; g.lineJoin = 'round'; g.stroke();
    pts.forEach(p => {
      g.beginPath(); g.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      g.fillStyle = '#ffffff'; g.fill(); g.strokeStyle = '#0e8f9a'; g.lineWidth = 2; g.stroke();
    });
  }
  window.addEventListener('resize', desenharGrafico);

  /* ================= RESULTADO ================= */
  function renderResultado() {
    const r = calcular();
    const scoreFinal = Number.isFinite(Number(app.resultadoBackend?.scoreGlobal))
      ? Number(app.resultadoBackend.scoreGlobal)
      : r.nota;
    const faixaFinal = RISCO_FAIXAS.find(item => scoreFinal <= item.ate) || RISCO_FAIXAS[4];
    $('#res-titulo').textContent = `${app.nome}, seu risco ergonômico é ${faixaFinal.nome}`;
    $('#res-texto').textContent = faixaFinal.texto;
    const nota = $('#res-nota');
    nota.querySelector('b').textContent = scoreFinal.toFixed(0);
    nota.querySelector('span').textContent = 'de 100';
    nota.style.borderColor = faixaFinal.cor;
    nota.querySelector('b').style.color = faixaFinal.cor;
    const alerta = $('#res-alerta');
    alerta.hidden = !r.alerta && !r.alertaCritico;
    alerta.querySelector('div').textContent = r.alertaCritico
      ? 'ALERTA CRÍTICO DE SAÚDE OCUPACIONAL. Sintomas em punhos ou cervical combinados com risco de equipamento acima de 25 pontos. Procure avaliação ocupacional.'
      : 'Você relatou sintomas persistentes. Se continuarem, procure avaliação de um profissional de saúde.';

    // NOVO: Exibe os dados vindos do backend (Chave e Posição)
    if (app.resultadoBackend) {
        const alertaChave = $('#res-alerta-chave');
        if(alertaChave) {
            alertaChave.hidden = false;
            $('#res-chave').textContent = app.resultadoBackend.chaveDeAcesso;
            $('#res-posicao').textContent = app.resultadoBackend.posicao + 'º';
        }
    }

    // resumo por bloco
    const blocos = $('#res-blocos');
    blocos.innerHTML = '';
    Object.entries(BLOCOS).forEach(([n, nome]) => {
      const qs = questoesDoFluxo().filter(q => q.bloco === +n);
      if (!qs.length) return;
      const max = qs.reduce((s, q) => s + (q.multipla
        ? q.opcoes.filter(o => !o.exclusiva).reduce((a, o) => a + o.pts, 0)
        : Math.max(...q.opcoes.map(o => o.pts))), 0);
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
    questoesDoFluxo().forEach(q => opcoesEscolhidas(q).forEach(o => {
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
  $('#btn-imprimir').addEventListener('click', async (ev) => {
    const chave = app.resultadoBackend?.chaveDeAcesso;
    if (!chave) {
      alert('A chave da avaliação não está disponível para gerar o relatório.');
      return;
    }

    const botao = ev.currentTarget;
    const textoOriginal = botao.textContent;
    botao.disabled = true;
    botao.textContent = 'Gerando PDF...';
    try {
      const response = await fetch(
        `${CONFIG.apiUrl}/relatorios/${encodeURIComponent(chave)}/pdf`
      );
      if (!response.ok) {
        const erro = await response.text();
        throw new Error(erro || 'Não foi possível gerar o relatório.');
      }

      const pdf = await response.blob();
      const url = URL.createObjectURL(pdf);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'relatorio-ergonomico.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o relatório: ' + error.message);
    } finally {
      botao.disabled = false;
      botao.textContent = textoOriginal;
    }
  });
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
    if (app.cena) app.cena.focar(app.tela === 'quiz' ? perguntaAtual()?.foco || 'geral' : 'geral');
  }
  $('#btn-pausa').addEventListener('click', iniciarPausa);
  $('#btn-parar-pausa').addEventListener('click', pararPausa);
})();