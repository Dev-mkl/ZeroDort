/* =========================================================
   BANCO DE QUESTÕES — Avaliador de Risco Ergonômico LER/DORT
   ---------------------------------------------------------
   Para editar perguntas, pontos ou cores, mexa só aqui.

   Severidade das regiões do corpo:
     0 = Verde | 1 = Amarelo | 2 = Laranja | 3 = Vermelho
     (região ausente = Neutro / não se aplica)

   "pose" diz como o boneco 3D deve ficar quando a opção é escolhida.
   "efeito" é a frase que explica o que o boneco está mostrando.
   "dica" vira recomendação na tela de resultado.
   ========================================================= */

const REGIOES = {
  cervical:  { nome: 'Cervical / Pescoço', curto: 'Cervical' },
  ombros:    { nome: 'Ombros',             curto: 'Ombros' },
  lombar:    { nome: 'Região lombar',      curto: 'Lombar' },
  coluna:    { nome: 'Coluna / Corpo todo', curto: 'Coluna' },
  cotovelos: { nome: 'Cotovelos / Antebraços', curto: 'Cotovelos' },
  punhos:    { nome: 'Punhos / Mãos',      curto: 'Punhos' },
  pes:       { nome: 'Pés / Pernas',       curto: 'Pés' },
};

const BLOCOS = {
  1: 'Mobiliário (Cadeira e Mesa)',
  2: 'Equipamentos e Informática',
  3: 'Hábitos, Pausas e Sintomas',
};

const QUESTOES = [
  /* ---------------- BLOCO 1 ---------------- */
  {
    id: 'P1', bloco: 1, foco: 'lombar',
    texto: 'A sua cadeira possui ajuste de altura e apoio para a região lombar?',
    opcoes: [
      { texto: 'Sim, ambos reguláveis e funcionais', pts: 0,
        regioes: { lombar: 0 }, pose: { cadeira: 'ergonomica' },
        efeito: 'Encosto com apoio lombar: a coluna mantém a curvatura natural.' },
      { texto: 'Apenas altura, sem ajuste lombar adequado', pts: 10,
        regioes: { lombar: 1 }, pose: { cadeira: 'semLombar' },
        efeito: 'Sem apoio lombar, a pelve gira para trás e a lombar começa a arredondar.',
        dica: 'Use uma almofada ou apoio lombar removível para manter a curvatura natural da coluna.' },
      { texto: 'Não sei / Fixa e sem regulagens', pts: 20,
        regioes: { lombar: 3 }, pose: { cadeira: 'fixa' },
        efeito: 'Cadeira fixa: o corpo escorrega e a coluna fica em "C", com pressão alta nos discos lombares.',
        dica: 'Prefira cadeira com regulagem de altura, encosto com apoio lombar e assento ajustável, como orienta a NR-17.' },
    ],
  },
  {
    id: 'P2', bloco: 1, foco: 'pes',
    texto: 'Você utiliza apoio para os pés?',
    opcoes: [
      { texto: 'Sim, meus pés alcançam o piso perfeitamente / Uso apoio regulável', pts: 0,
        regioes: { pes: 0 }, pose: { pes: 'apoio' },
        efeito: 'Pés apoiados e joelhos a cerca de 90°: circulação livre nas pernas.' },
      { texto: 'Não, meus pés ficam suspensos ou balançando', pts: 10,
        regioes: { pes: 2 }, pose: { pes: 'suspensos' },
        efeito: 'Pés no ar: a borda do assento comprime a parte de trás das coxas.',
        dica: 'Use um apoio para os pés regulável, para que os joelhos fiquem a ~90° e as coxas não sejam comprimidas pela borda do assento.' },
      { texto: 'Não utilizo / Não se aplica', pts: 0,
        regioes: {}, pose: { pes: 'neutro' },
        efeito: 'Postura neutra das pernas.' },
    ],
  },
  {
    id: 'P3', bloco: 1, foco: 'mesa',
    texto: 'O formato da mesa e o espaço para as pernas permitem aproximação sem compressão?',
    opcoes: [
      { texto: 'Sim, espaço livre adequado e bordas arredondadas', pts: 0,
        regioes: {}, pose: { mesa: 'arredondada' },
        efeito: 'A cadeira se aproxima da mesa e os antebraços não encostam em quinas.' },
      { texto: 'Não, a mesa tem quinas vivas ou falta espaço para os joelhos', pts: 10,
        regioes: { cotovelos: 1, punhos: 1 }, pose: { mesa: 'quina' },
        efeito: 'Os joelhos batem no gaveteiro: o corpo fica longe e os antebraços apoiam na quina.',
        dica: 'Proteja ou arredonde as quinas e libere o espaço sob a mesa para aproximar a cadeira sem pressionar os antebraços.' },
    ],
  },

  /* ---------------- BLOCO 2 ---------------- */
  {
    id: 'P4', bloco: 2, foco: 'cabeca',
    texto: 'Qual equipamento principal você utiliza para trabalhar/estudar?',
    opcoes: [
      { texto: 'Monitor externo ou Notebook com suporte elevado + Teclado e Mouse separados', pts: 0,
        regioes: { cervical: 0 }, pose: { equip: 'monitor' },
        efeito: 'Tela elevada e periféricos separados: a cabeça fica alinhada sobre os ombros.' },
      { texto: 'Notebook direto na mesa (sem suporte, tela baixa)', pts: 25,
        regioes: { cervical: 3 }, pose: { equip: 'notebook' },
        efeito: 'O avatar abaixa a cabeça para enxergar a tela: a carga no pescoço se multiplica.',
        dica: 'Eleve o notebook com um suporte e use teclado e mouse externos: a tela deve ficar na altura dos olhos.' },
      { texto: 'Não utilizo computador/notebook', pts: 0,
        regioes: {}, pose: { equip: 'nenhum' },
        efeito: 'Sem computador na mesa.' },
    ],
  },
  {
    id: 'P5', bloco: 2, foco: 'cabeca',
    texto: 'Onde o topo da sua tela (ou monitor) está posicionado em relação aos seus olhos?',
    opcoes: [
      { texto: 'Na altura dos olhos ou ligeiramente abaixo (olhar reto/levemente para baixo)', pts: 0,
        regioes: {}, pose: { tela: 'olhos' },
        efeito: 'Topo da tela na linha dos olhos: pescoço em posição neutra.' },
      { texto: 'Muito abaixo, exigindo flexão constante do pescoço', pts: 20,
        regioes: { cervical: 3 }, pose: { tela: 'baixa' },
        efeito: 'Tela baixa: o pescoço fica flexionado o tempo todo.',
        dica: 'Ajuste o monitor para que a borda superior fique na altura dos olhos, a cerca de um braço de distância.' },
      { texto: 'Não se aplica', pts: 0,
        regioes: {}, pose: { tela: 'na' },
        efeito: 'Sem tela para avaliar.' },
    ],
  },
  {
    id: 'P6', bloco: 2, foco: 'ombros',
    texto: 'Durante ligações ou reuniões, como você atende ao telefone / headset?',
    opcoes: [
      { texto: 'Utilizo fone com microfone (headset) com as mãos livres', pts: 0,
        regioes: { cervical: 0, ombros: 0 }, pose: { fone: 'headset' },
        efeito: 'Headset: cabeça reta e mãos livres.' },
      { texto: 'Seguro o telefone ou celular entre a orelha e o ombro', pts: 20,
        regioes: { cervical: 3, ombros: 3 }, pose: { fone: 'ombro' },
        efeito: 'O avatar encolhe o ombro e inclina a cabeça para prender o telefone.',
        dica: 'Use headset ou viva-voz: prender o telefone entre a orelha e o ombro contrai o trapézio e a cervical.' },
      { texto: 'Não realizo atendimento telefônico / Não se aplica', pts: 0,
        regioes: {}, pose: { fone: 'nenhum' },
        efeito: 'Sem uso de telefone.' },
    ],
  },
  {
    id: 'P7', bloco: 2, foco: 'bracos',
    texto: 'O teclado e o mouse estão posicionados na mesma superfície, permitindo punhos neutros?',
    opcoes: [
      { texto: 'Sim, braços flexionados a cerca de 90° e punhos retos', pts: 0,
        regioes: { punhos: 0 }, pose: { bracos: 'neutro' },
        efeito: 'Cotovelos a ~90° junto ao corpo e punhos alinhados com o antebraço.' },
      { texto: 'Não, braços esticados ou punhos forçados (dorsiflexão)', pts: 15,
        regioes: { punhos: 2, ombros: 2 }, pose: { bracos: 'esticados' },
        efeito: 'Teclado longe: braços esticados, ombros projetados e punhos dobrados para cima.',
        dica: 'Aproxime teclado e mouse: cotovelos a ~90°, junto ao corpo, e punhos retos. Evite apoiar o punho dobrado para cima.' },
      { texto: 'Não se aplica', pts: 0,
        regioes: {}, pose: { bracos: 'neutro' },
        efeito: 'Postura neutra dos braços.' },
    ],
  },

  /* ---------------- BLOCO 3 ---------------- */
  {
    id: 'P8', bloco: 3, foco: 'geral',
    texto: 'Com que frequência você faz pequenas pausas para esticar o corpo e mudar de postura?',
    opcoes: [
      { texto: 'A cada 50-60 minutos ou menos', pts: 0,
        regioes: {}, pose: { pausas: 'frequente' },
        efeito: 'O avatar se levanta e alonga: músculos e discos são aliviados com frequência.' },
      { texto: 'A cada 2 ou 3 horas', pts: 10,
        regioes: { coluna: 1 }, pose: { pausas: 'medio' },
        efeito: 'Pausas espaçadas: começa a fadiga muscular.',
        dica: 'Programe pausas curtas a cada 50–60 minutos (um alarme no celular ajuda).' },
      { texto: 'Trabalho horas seguidas sem levantar', pts: 20,
        regioes: { coluna: 2 }, pose: { pausas: 'nunca' },
        efeito: 'Sem pausas: o corpo "desaba" para frente e a fadiga se espalha pela coluna.',
        dica: 'Levante-se, alongue e mude de postura a cada hora: a imobilidade prolongada reduz a circulação e sobrecarrega músculos e discos.' },
    ],
  },
  {
    id: 'P9', bloco: 3, foco: 'geral', multipla: true,
    texto: 'Você sente dores frequentes, formigamento ou sensação de peso ao final do dia em alguma destas regiões?',
    opcoes: [
      { texto: 'Nenhuma dor significativa', pts: 0, exclusiva: true,
        regioes: {}, pose: {},
        efeito: 'Nenhum ponto de dor relatado.' },
      { texto: 'Pescoço', pts: 15, dor: 'cervical',
        regioes: { cervical: 3 }, pose: {},
        efeito: 'Ponto de dor no pescoço.',
        dica: 'Dor frequente no pescoço é sinal de alerta: revise a altura da tela e procure um fisioterapeuta se persistir.' },
      { texto: 'Ombros', pts: 15, dor: 'ombros',
        regioes: { ombros: 3 }, pose: {},
        efeito: 'Ponto de dor nos ombros.',
        dica: 'Dor nos ombros costuma vir de braços elevados ou esticados: aproxime os periféricos e relaxe os ombros.' },
      { texto: 'Região lombar', pts: 15, dor: 'lombar',
        regioes: { lombar: 3 }, pose: {},
        efeito: 'Ponto de dor na lombar.',
        dica: 'Dor lombar persistente merece avaliação de médico do trabalho ou fisioterapeuta.' },
      { texto: 'Punhos / Mãos (formigamento ou dormência)', pts: 20, dor: 'punhos', alerta: true,
        regioes: { punhos: 3 }, pose: {},
        efeito: 'ALERTA: formigamento nas mãos é um sinal clássico de LER/DORT.',
        dica: 'Formigamento ou dormência em punhos e mãos pode indicar síndrome do túnel do carpo ou tendinite: procure avaliação médica.' },
    ],
  },
];

/* Pontuação máxima possível (usada para converter em nota 0–10) */
const PONTOS_MAXIMOS = QUESTOES.reduce((soma, q) => {
  if (q.multipla) return soma + q.opcoes.reduce((s, o) => s + o.pts, 0);
  return soma + Math.max(...q.opcoes.map(o => o.pts));
}, 0);

/* Faixas de classificação da nota 0–10 */
const FAIXAS = [
  { ate: 2,  nome: 'BAIXO',    cor: '#22c55e', texto: 'Seu posto de trabalho está bem ajustado. Continue com as boas práticas!' },
  { ate: 4,  nome: 'MODERADO', cor: '#eab308', texto: 'Há pontos de atenção. Pequenos ajustes já reduzem bastante o risco.' },
  { ate: 6,  nome: 'ALTO',     cor: '#f97316', texto: 'Vários fatores de risco combinados. Recomenda-se ajustar o posto o quanto antes.' },
  { ate: 99, nome: 'CRÍTICO',  cor: '#ef4444', texto: 'Risco elevado de LER/DORT. Ajuste o posto e procure orientação profissional.' },
];
