# ErgoRisk 3D — Avaliador de Risco Ergonômico LER/DORT

Front-end do questionário de saúde ocupacional ErgoRisk, integrado à API Spring Boot, com um
**avatar 3D** que reproduz a postura da pessoa conforme as respostas.

## Como abrir

- **Mais simples:** dê dois cliques em `index.html` (precisa de internet, porque o Three.js vem de CDN).
- **Com servidor local (opcional):** `node servidor.js` e acesse http://localhost:5500

## Fluxo

1. **Tela inicial:** explicação sobre LER/DORT, campo de nome, botão para começar e link para o repositório.
2. **Questionário:** boneco 3D em cima e pergunta embaixo. Cada resposta muda a postura e o cenário
   (cadeira, apoio de pés, mesa, notebook/monitor, telefone, braços, pausas, pontos de dor).
   As perguntas condicionais mantêm os códigos P1–P13 no envio à API. À direita ficam o
   termômetro de risco (0–100), o gráfico de evolução e o mapa de regiões.
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
- **Perguntas/pontos:** edite `js/questoes.js`. O score final é limitado a 0–100. As faixas são:
  baixo (0–20), moderado (21–40), alto (41–60), muito alto (61–80) e crítico (81–100).
  Sintomas em punhos ou cervical combinados com mais de 25 pontos de mobiliário/equipamentos
  ativam o alerta crítico.

## Referências usadas nos rótulos

- Carga na cervical por flexão do pescoço: Hansraj, K. (2014), *Surgical Technology International*.
- Pressão nos discos lombares sentado: estudos de Nachemson (valores aproximados, uso didático).
- NR-17 (Ergonomia), Ministério do Trabalho.

> Ferramenta educativa. Não substitui avaliação profissional.
