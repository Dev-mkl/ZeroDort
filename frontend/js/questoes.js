/* =========================================================
   Questionário ErgoRisk. Os IDs P1-P13 são o contrato com o backend.
   Severidade: 0 verde, 1 amarelo, 2 laranja, 3 vermelho.
   ========================================================= */

const REGIOES = {
  cervical: { nome: 'Cervical / Pescoço', curto: 'Cervical' },
  ombros: { nome: 'Ombros', curto: 'Ombros' },
  lombar: { nome: 'Região lombar', curto: 'Lombar' },
  coluna: { nome: 'Coluna / Corpo todo', curto: 'Coluna' },
  cotovelos: { nome: 'Cotovelos / Antebraços', curto: 'Cotovelos' },
  punhos: { nome: 'Punhos / Mãos', curto: 'Punhos' },
  pes: { nome: 'Pés / Pernas', curto: 'Pés' },
};

const BLOCOS = {
  1: 'Postura e mobiliário',
  2: 'Ferramentas e equipamentos',
  3: 'Dispositivos móveis e trabalho em pé',
  4: 'Hábitos, pausas e sintomas',
};

const QUESTOES = [
  {
    id: 'P1', bloco: 1, foco: 'geral',
    texto: 'Qual é a sua principal postura predominante de trabalho ao longo do dia?',
    opcoes: [
      { codigo: 'SENTADO', texto: 'Sentado na maior parte do tempo', pts: 0, regioes: {}, pose: { postura: 'sentado' } },
      { codigo: 'EM_PE_FIXO', texto: 'Em pé fixo na maior parte do tempo', pts: 0, regioes: {}, pose: { postura: 'emPe' } },
      { codigo: 'ALTERNANDO', texto: 'Alternando entre sentado e em pé', pts: 0, regioes: {}, pose: { postura: 'emPe' } },
    ],
  },
  {
    id: 'P2', bloco: 1, foco: 'lombar',
    quando: respostas => ['SENTADO', 'ALTERNANDO'].includes(codigoEscolhido('P1', respostas)),
    texto: 'A sua cadeira ou banco possui ajuste de altura e apoio adequado para a região lombar / costas?',
    opcoes: [
      { codigo: 'CADEIRA_AJUSTAVEL', texto: 'Sim, ambos reguláveis e funcionais', pts: 0,
        regioes: { lombar: 0 }, pose: { cadeira: 'ergonomica' },
        efeito: 'Cadeira ajustável e apoio lombar: a coluna mantém sua curvatura natural.' },
      { codigo: 'SEM_AJUSTE_LOMBAR', texto: 'Apenas altura, sem ajuste lombar adequado', pts: 5,
        regioes: { lombar: 1 }, pose: { cadeira: 'semLombar' },
        efeito: 'Sem apoio lombar adequado, a coluna começa a perder sua curvatura natural.',
        dica: 'Ajuste ou complemente o encosto para apoiar a região lombar.' },
      { codigo: 'CADEIRA_FIXA', texto: 'Não sei / Fixa e sem regulagens', pts: 10,
        regioes: { lombar: 3 }, pose: { cadeira: 'fixa' },
        efeito: 'Uma cadeira sem regulagens pode favorecer o escorregamento da pelve e a flexão lombar.',
        dica: 'Prefira assento ajustável em altura e com apoio lombar.' },
    ],
  },
  {
    id: 'P3', bloco: 1, foco: 'pes',
    quando: respostas => ['SENTADO', 'ALTERNANDO'].includes(codigoEscolhido('P1', respostas)),
    texto: 'Você utiliza apoio para os pés para garantir que eles fiquem totalmente apoiados?',
    opcoes: [
      { codigo: 'PES_APOIADOS', texto: 'Sim, meus pés alcançam o piso perfeitamente / Uso apoio regulável', pts: 0,
        regioes: { pes: 0 }, pose: { pes: 'apoio' },
        efeito: 'Pés apoiados: a posição das pernas fica estável.' },
      { codigo: 'PES_SUSPENSOS', texto: 'Não, meus pés ficam suspensos ou balançando / pernas cruzadas', pts: 5,
        regioes: { pes: 2 }, pose: { pes: 'suspensos' },
        efeito: 'Pés sem apoio: as pernas ficam suspensas e a borda do assento pode comprimir as coxas.',
        dica: 'Apoie os pés no chão ou use um apoio regulável.' },
      { codigo: 'PES_NAO_SE_APLICA', texto: 'Não utilizo / Não se aplica', pts: 0,
        regioes: {}, pose: { pes: 'neutro' },
        efeito: 'Esta resposta não adiciona risco para os pés.' },
    ],
  },
  {
    id: 'P4', bloco: 1, foco: 'mesa',
    texto: 'O formato da sua superfície de trabalho (mesa/bancada) e o espaço livre permitem aproximação sem compressão de pernas e braços?',
    opcoes: [
      { codigo: 'MESA_ADEQUADA', texto: 'Sim, espaço livre adequado e bordas arredondadas', pts: 0,
        regioes: {}, pose: { mesa: 'arredondada' },
        efeito: 'Espaço livre e bordas adequadas permitem aproximar-se da superfície de trabalho.' },
      { codigo: 'MESA_COM_QUINAS', texto: 'Não, a mesa/bancada tem quinas vivas, rebarbas ou falta espaço para os joelhos', pts: 10,
        regioes: { cotovelos: 1, punhos: 1 }, pose: { mesa: 'quina' },
        efeito: 'Quinas ou falta de espaço podem pressionar braços e limitar a aproximação.',
        dica: 'Libere o espaço sob a mesa e proteja as quinas da superfície.' },
    ],
  },
  {
    id: 'P5', bloco: 2, foco: 'geral',
    texto: 'Você utiliza computador (desktop ou notebook) na sua rotina de trabalho?',
    opcoes: [
      { codigo: 'USA_COMPUTADOR', texto: 'Sim', pts: 0, regioes: {}, pose: { equip: 'monitor' } },
      { codigo: 'NAO_USA_COMPUTADOR', texto: 'Não', pts: 0, regioes: {}, pose: { equip: 'nenhum', tela: 'na' } },
    ],
  },
  {
    id: 'P6', bloco: 2, foco: 'cabeca',
    quando: respostas => codigoEscolhido('P5', respostas) === 'USA_COMPUTADOR',
    texto: 'Qual equipamento de informática principal você utiliza?',
    opcoes: [
      { codigo: 'MONITOR_ELEVADO', texto: 'Monitor externo ou Notebook com suporte elevado + Teclado e Mouse separados', pts: 0,
        regioes: { cervical: 0 }, pose: { equip: 'monitor' },
        efeito: 'A tela elevada ajuda a manter a cabeça alinhada sobre os ombros.' },
      { codigo: 'NOTEBOOK_DIRETO', texto: 'Notebook direto na mesa (sem suporte, tela baixa)', pts: 20,
        regioes: { cervical: 3 }, pose: { equip: 'notebook', tela: 'baixa' },
        efeito: 'A tela baixa faz o boneco inclinar a cabeça para a frente.',
        dica: 'Eleve o notebook e use teclado e mouse externos.' },
    ],
  },
  {
    id: 'P7', bloco: 2, foco: 'cabeca',
    quando: respostas => codigoEscolhido('P5', respostas) === 'USA_COMPUTADOR',
    texto: 'Onde o topo da sua tela (ou monitor) está posicionado em relação aos seus olhos?',
    opcoes: [
      { codigo: 'TELA_NA_ALTURA_DOS_OLHOS', texto: 'Na altura dos olhos ou ligeiramente abaixo (olhar reto/levemente para baixo)', pts: 0,
        regioes: {}, pose: { tela: 'olhos' },
        efeito: 'Tela na altura dos olhos: postura cervical neutra.' },
      { codigo: 'TELA_MUITO_ABAIXO', texto: 'Muito abaixo, exigindo flexão constante do pescoço', pts: 15,
        regioes: { cervical: 3 }, pose: { tela: 'baixa' },
        efeito: 'O boneco inclina o pescoço para olhar uma tela muito baixa.',
        dica: 'Posicione o topo da tela próximo à altura dos olhos.' },
    ],
  },
  {
    id: 'P8', bloco: 2, foco: 'ombros',
    quando: respostas => codigoEscolhido('P5', respostas) === 'USA_COMPUTADOR',
    texto: 'Durante ligações, reuniões ou atendimento, como você gerencia suas chamadas de áudio?',
    opcoes: [
      { codigo: 'USA_HEADSET', texto: 'Utilizo fone com microfone (headset) com as mãos livres', pts: 0,
        regioes: { cervical: 0, ombros: 0 }, pose: { fone: 'headset' },
        efeito: 'O headset mantém as mãos livres e a cabeça alinhada.' },
      { codigo: 'TELEFONE_NO_OMBRO', texto: 'Seguro o telefone ou celular entre a orelha e o ombro', pts: 10,
        regioes: { cervical: 3, ombros: 3 }, pose: { fone: 'ombro' },
        efeito: 'O boneco inclina a cabeça e eleva o ombro para segurar o telefone.',
        dica: 'Use headset ou viva-voz em vez de prender o telefone entre a orelha e o ombro.' },
      { codigo: 'SEM_ATENDIMENTO_TELEFONICO', texto: 'Não realizo atendimento telefônico / Não se aplica', pts: 0,
        regioes: {}, pose: { fone: 'nenhum' } },
    ],
  },
  {
    id: 'P9', bloco: 2, foco: 'bracos',
    quando: respostas => codigoEscolhido('P5', respostas) === 'USA_COMPUTADOR',
    texto: 'O teclado e o mouse estão posicionados na mesma superfície, permitindo punhos neutros e cotovelos a 90°?',
    opcoes: [
      { codigo: 'PUNHOS_NEUTROS', texto: 'Sim, braços flexionados e punhos retos', pts: 0,
        regioes: { punhos: 0 }, pose: { bracos: 'neutro' },
        efeito: 'Braços próximos ao corpo, cotovelos flexionados e punhos alinhados.' },
      { codigo: 'PUNHOS_FORCADOS', texto: 'Não, braços esticados ou punhos forçados (dorsiflexão)', pts: 10,
        regioes: { punhos: 2, ombros: 2 }, pose: { bracos: 'esticados' },
        efeito: 'O boneco projeta os braços e dobra os punhos.',
        dica: 'Aproxime o teclado e o mouse para manter punhos alinhados e cotovelos próximos ao corpo.' },
    ],
  },
  {
    id: 'P10', bloco: 3, foco: 'bracos',
    texto: 'Você utiliza dispositivos móveis (celular, tablet, coletores de dados ou leitores de código de barras) de forma frequente?',
    opcoes: [
      { codigo: 'USA_DISPOSITIVO_MOVEL', texto: 'Sim, com o pescoço inclinado para baixo por longos períodos', pts: 10,
        regioes: { cervical: 2, punhos: 2 }, pose: { movel: 'usoFrequente' },
        efeito: 'O boneco inclina a cabeça e mantém as mãos em posição de uso do dispositivo.',
        dica: 'Eleve o dispositivo e alterne a postura para reduzir a flexão prolongada do pescoço.' },
      { codigo: 'NAO_USA_DISPOSITIVO_MOVEL', texto: 'Não / Pouco uso', pts: 0,
        regioes: {}, pose: { movel: 'nenhum' } },
    ],
  },
  {
    id: 'P11', bloco: 3, foco: 'geral',
    quando: respostas => ['EM_PE_FIXO', 'ALTERNANDO'].includes(codigoEscolhido('P1', respostas)),
    texto: 'Se você trabalha em pé ou em bancadas, os elementos de trabalho exigem flexão excessiva do tronco ou alcance manual forçado acima dos ombros?',
    opcoes: [
      { codigo: 'ALCANCE_EM_PE_ADEQUADO', texto: 'Não, tudo está dentro do alcance fácil e sem curvar o tronco', pts: 0,
        regioes: {}, pose: { alcance: 'adequado' } },
      { codigo: 'ALCANCE_EM_PE_CRITICO', texto: 'Sim, preciso me curvar frequentemente ou esticar os braços acima dos ombros', pts: 10,
        regioes: { lombar: 3, ombros: 3 }, pose: { alcance: 'critico' },
        efeito: 'O boneco em pé inclina o tronco e eleva os braços para alcançar a bancada.',
        dica: 'Aproxime os materiais e ajuste a altura da superfície para evitar curvar o tronco e elevar os braços.' },
    ],
  },
  {
    id: 'P12', bloco: 4, foco: 'pausa',
    texto: 'Com que frequência você faz pequenas pausas para esticar o corpo, caminhar e mudar de postura?',
    opcoes: [
      { codigo: 'PAUSAS_REGULARES', texto: 'A cada 50-60 minutos ou menos', pts: 0,
        regioes: {}, pose: { pausas: 'frequente' },
        efeito: 'Pausas regulares ajudam a alternar a postura e movimentar o corpo.' },
      { codigo: 'PAUSAS_2_3_HORAS', texto: 'A cada 2 ou 3 horas', pts: 5,
        regioes: { coluna: 1 }, pose: { pausas: 'medio' },
        efeito: 'Pausas espaçadas podem favorecer fadiga muscular.',
        dica: 'Programe pausas curtas para mudar de postura a cada 50–60 minutos.' },
      { codigo: 'SEM_PAUSAS', texto: 'Trabalho horas seguidas sem levantar', pts: 10,
        regioes: { coluna: 2 }, pose: { pausas: 'nunca' },
        efeito: 'Sem pausas, o boneco inclina o tronco e demonstra fadiga postural.',
        dica: 'Levante-se, caminhe e mude de postura ao longo do expediente.' },
    ],
  },
  {
    id: 'P13', bloco: 4, foco: 'geral', multipla: true,
    texto: 'Você sente dores persistentes, formigamento ou sensação de peso ao final do dia em alguma destas regiões?',
    opcoes: [
      { codigo: 'SEM_SINTOMAS', texto: 'Nenhuma dor significativa', pts: 0, exclusiva: true,
        regioes: {}, pose: {}, efeito: 'Nenhum sintoma foi selecionado.' },
      { codigo: 'SINTOMA_CERVICAL', texto: 'Pescoço', pts: 5, dor: 'cervical',
        regioes: { cervical: 3 }, pose: {},
        efeito: 'Sintoma relatado na região cervical.',
        dica: 'Se a dor no pescoço persistir, procure avaliação profissional.' },
      { codigo: 'SINTOMA_OMBROS', texto: 'Ombros', pts: 5, dor: 'ombros',
        regioes: { ombros: 3 }, pose: {},
        efeito: 'Sintoma relatado nos ombros.',
        dica: 'Revise a altura e o alcance dos materiais usados durante o trabalho.' },
      { codigo: 'SINTOMA_LOMBAR', texto: 'Região Lombar', pts: 5, dor: 'lombar',
        regioes: { lombar: 3 }, pose: {},
        efeito: 'Sintoma relatado na região lombar.',
        dica: 'Se a dor lombar persistir, procure avaliação profissional.' },
      { codigo: 'SINTOMA_PUNHOS', texto: 'Punhos / Mãos (formigamento ou dormência)', pts: 10,
        dor: 'punhos', alerta: true, regioes: { punhos: 3 }, pose: {},
        efeito: 'ALERTA: formigamento ou dormência em punhos e mãos requer atenção.',
        dica: 'Formigamento ou dormência persistente deve ser avaliado por um profissional de saúde.' },
    ],
  },
];

function codigoEscolhido(id, respostas) {
  const pergunta = QUESTOES.find(item => item.id === id);
  const selecionada = respostas[id];
  if (!pergunta || selecionada === undefined || Array.isArray(selecionada)) return null;
  return pergunta.opcoes[selecionada]?.codigo || null;
}

function perguntasAtivas(respostas) {
  return QUESTOES.filter(pergunta => !pergunta.quando || pergunta.quando(respostas));
}

const RISCO_FAIXAS = [
  { ate: 20, nome: 'BAIXO', cor: '#22c55e', texto: 'Mantenha boas práticas e pausas regulares.' },
  { ate: 40, nome: 'MODERADO', cor: '#eab308', texto: 'Faça ajustes no mobiliário e na organização do trabalho.' },
  { ate: 60, nome: 'ALTO', cor: '#f97316', texto: 'É recomendada intervenção ergonômica no posto de trabalho.' },
  { ate: 80, nome: 'MUITO ALTO', cor: '#ef4444', texto: 'Reestruture o posto de trabalho e a rotina o quanto antes.' },
  { ate: 100, nome: 'CRÍTICO / EMERGÊNCIA', cor: '#7f1d1d', texto: 'Interrompa a exposição nociva e procure avaliação ocupacional.' },
];
