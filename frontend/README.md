# ErgoRisk 3D — Avaliador de Risco Ergonômico LER/DORT

Front-end (sem back-end) de um questionário de saúde ocupacional com um **avatar 3D** que
reproduz a postura da pessoa conforme as respostas.

## Como abrir

- **Mais simples:** dê dois cliques em `index.html` (precisa de internet, porque o Three.js vem de CDN).
- **Com servidor local (opcional):** `node servidor.js` e acesse http://localhost:5500

## Fluxo

1. **Tela inicial:** explicação sobre LER/DORT, campo de nome, botão para começar e link para o repositório.
2. **Questionário:** boneco 3D em cima e pergunta embaixo. Cada resposta muda a postura e o cenário
   (cadeira, apoio de pés, mesa, notebook/monitor, telefone, braços, pausas, pontos de dor).
   À direita ficam o termômetro de risco (0–10), o gráfico de evolução e o mapa de regiões.
3. **Resultado:** nota final, classificação, resumo por bloco, recomendações e pausa ativa animada.

## Estrutura

| Arquivo | O que tem |
|---|---|
| `index.html` | Telas (início, questionário, resultado) |
| `css/style.css` | Visual (tema escuro, responsivo) |
| `js/questoes.js` | **Banco de questões**: textos, pontos, cores por região e pose do boneco |
| `js/avatar.js` | Cena 3D (Three.js): boneco "raio-X", móveis, animações, câmera |
| `js/app.js` | Lógica: navegação, pontuação, gráfico, relatório, pausa ativa |
| `servidor.js` | Servidor local opcional (Node, sem dependências) |

## Personalizar

- **Link do repositório:** `CONFIG.repositorio` no topo de `js/app.js`.
- **Perguntas/pontos:** edite `js/questoes.js`. A pontuação máxima é calculada sozinha (hoje 205 pts),
  e a nota vai de 0 a 10. As faixas são: Baixo < 2, Moderado < 4, Alto < 6, Crítico ≥ 6.
  Formigamento nos punhos força no mínimo "Alto" e mostra um alerta.

## Referências usadas nos rótulos

- Carga na cervical por flexão do pescoço: Hansraj, K. (2014), *Surgical Technology International*.
- Pressão nos discos lombares sentado: estudos de Nachemson (valores aproximados, uso didático).
- NR-17 (Ergonomia), Ministério do Trabalho.

> Ferramenta educativa. Não substitui avaliação profissional.
