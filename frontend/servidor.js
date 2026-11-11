// Servidor local opcional:  node servidor.js  →  http://localhost:5500
// (o site também abre com duplo clique no index.html)
const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
const PORTA = process.env.PORT || 5500;
const TIPOS = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' };

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const arq = path.join(RAIZ, url === '/' ? 'index.html' : url);
  if (!arq.startsWith(RAIZ)) { res.writeHead(403); return res.end(); }
  fs.readFile(arq, (err, dados) => {
    if (err) { res.writeHead(404); return res.end('Não encontrado'); }
    res.writeHead(200, { 'Content-Type': (TIPOS[path.extname(arq)] || 'application/octet-stream') + '; charset=utf-8' });
    res.end(dados);
  });
}).listen(PORTA, () => console.log('ErgoRisk 3D em http://localhost:' + PORTA));
