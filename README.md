# ZeroDort

## Sobre o projeto

O ZeroDort é um sistema web adaptativo e interativo de conscientização ergonômica, desenvolvido para apresentação em feira de tecnologia inovatech organizado pelo Centro Universitário de Goiás. Com base nas diretrizes da NR-17 e em materiais oficiais de saúde e segurança do trabalho, a aplicação atende diferentes contextos ocupacionais — como trabalho em escritório, clínicas e atividades em pé ou sentado — sem exigir o cadastro da profissão.

Questionários ergonômicos convencionais podem ser estáticos e pouco engajadores, dificultando que o trabalhador perceba os riscos associados à sua postura e ao seu posto de trabalho. O ZeroDort apresenta perguntas adaptativas e feedback visual para ajudar a reconhecer fatores relacionados a hábitos como o uso inadequado de notebooks e a falta de ajustes no mobiliário.

> O ZeroDort é uma ferramenta educativa de triagem e conscientização. Não substitui avaliação ergonômica profissional, diagnóstico ou orientação médica.

## Objetivo

Promover a conscientização ergonômica em uma experiência digital breve e acessível, que pode ser divulgada por QR Code. Por meio de um questionário adaptativo e de um avatar 3D atualizado conforme as respostas, o sistema apresenta um escore de risco de 0 a 100, um mapa corporal por regiões e recomendações preventivas.

## Integrantes

| Integrante                     | GitHub                                                         |
| ------------------------------ | -------------------------------------------------------------- |
| Mikhael Costa (`dev-mkl`)      | [github.com/Dev-mkl](https://github.com/Dev-mkl)               |
| João Guilherme (`JotaGui-alt`) | [github.com/JotaGui-alt](https://github.com/JotaGui-alt)       |
| Victor Hugo (`AuroraMaximoff`) | [github.com/AuroraMaximoff](https://github.com/AuroraMaximoff) |
| Matheus Leão (`Theusp2p`)      | [github.com/Theusp2p](https://github.com/Theusp2p)             |

## Tecnologias utilizadas

**Frontend**

- HTML5, CSS3 e JavaScript.
- Three.js para a visualização e animação do avatar 3D.
- Google Fonts e bibliotecas do Three.js carregadas por CDN.
- Servidor HTTP simples em Node.js, opcional, para execução local.

**Backend**

- Java 21 e Spring Boot 3.5.
- Spring Web para a API REST, Spring Data JPA e Hibernate para persistência.
- PostgreSQL como banco de dados.
- Apache PDFBox para geração do relatório em PDF.
- Maven para dependências, build e testes.

## Arquitetura do sistema

O frontend é uma aplicação web estática que conduz o questionário e apresenta o avatar e os resultados. Ele envia as respostas à API REST do backend, que valida os dados, consulta e persiste as informações no PostgreSQL, calcula o resultado e disponibiliza o relatório PDF pela chave de acesso da avaliação.

```text
Navegador
   └── Frontend (HTML, CSS, JavaScript e Three.js)
          └── API REST (Java / Spring Boot)
                 └── PostgreSQL
          └── Download do relatório PDF
```

O frontend está publicado em [zerodort-frontend.onrender.com](https://zerodort-frontend.onrender.com) e a API em [zerodort.onrender.com](https://zerodort.onrender.com). O prefixo das rotas da API é `/api`.

Principais rotas:

| Método | Rota                                     | Finalidade                                                                    |
| ------ | ---------------------------------------- | ----------------------------------------------------------------------------- |
| `GET`  | `/api/usuarios/disponibilidade?nome=...` | Verifica se o nome está disponível, sem diferenciar maiúsculas de minúsculas. |
| `POST` | `/api/avaliacao`                         | Envia as respostas e registra uma avaliação.                                  |
| `GET`  | `/api/relatorios/{chaveDeAcesso}/pdf`    | Gera e baixa o relatório em PDF da avaliação.                                 |
| `GET`  | `/api/ranking`                           | Consulta o ranking de avaliações.                                             |
| `GET`  | `/api/chave`                             | Consulta chaves de acesso disponíveis.                                        |
| `GET`  | `/api/health`                            | Verifica se a API está respondendo.                                           |

## Estrutura de diretórios

```text
ZeroDort/
├── backend/
│   ├── src/
│   │   ├── main/java/com/zeroDort/
│   │   │   ├── config/       # Configurações da aplicação e CORS
│   │   │   ├── controller/   # Rotas da API
│   │   │   ├── dto/          # Objetos de entrada e saída da API
│   │   │   ├── model/        # Entidades persistidas
│   │   │   ├── repository/   # Acesso a dados
│   │   │   └── service/      # Regras de negócio e geração de PDF
│   │   ├── main/resources/   # Configuração do Spring
│   │   └── test/             # Testes automatizados
│   ├── Dockerfile
│   ├── mvnw.cmd
│   └── pom.xml
└── frontend/
    ├── css/style.css         # Estilos da aplicação
    ├── js/
    │   ├── app.js            # Fluxo, integração com a API e resultados
    │   ├── avatar.js         # Cena e animações 3D
    │   └── questoes.js        # Perguntas e regras de apresentação
    ├── index.html
    └── servidor.js           # Servidor local opcional
```

## Como executar

### Requisitos

- Java 21.
- PostgreSQL em execução.
- Node.js, somente se quiser usar o servidor local do frontend.

### Instalação e configuração

1. Clone o repositório:

   ```bash
   git clone https://github.com/Dev-mkl/ZeroDort.git
   cd ZeroDort
   ```

2. Crie um banco PostgreSQL local, por exemplo `zerodort`.

3. Crie o arquivo `backend/.env` com as credenciais do banco. Esse arquivo é ignorado pelo Git; não publique credenciais:

   ```dotenv
   DB_URL=jdbc:postgresql://localhost:5432/zerodort
   DB_USER=seu_usuario
   DB_PASSWORD=sua_senha
   ```

4. Inicie o backend a partir da pasta `backend`:

   **Windows PowerShell**

   ```powershell
   .\mvnw.cmd spring-boot:run
   ```

   **Linux/macOS**

   ```bash
   ./mvnw spring-boot:run
   ```

   A API local ficará disponível em `http://localhost:8080/api`.

5. Para iniciar o frontend, abra outro terminal na pasta `frontend` e execute:

   ```bash
   node servidor.js
   ```

   Acesse `http://localhost:5500`. O servidor é opcional; também é possível servir os arquivos do frontend com outro servidor HTTP estático.

6. Para testar o frontend com o backend local, ajuste temporariamente `CONFIG.apiUrl` em `frontend/js/app.js` para `http://localhost:8080/api`. O valor configurado no repositório aponta para a API publicada.

### Testes do backend

Com o PostgreSQL configurado e disponível, execute na pasta `backend`:

```powershell
.\mvnw.cmd test
```

## Publicação

O repositório inclui um `Dockerfile` em `backend/` para publicar a API como Web Service no Render. O frontend pode ser publicado como Static Site usando a pasta `frontend` como diretório publicado. Configure as variáveis `DB_URL`, `DB_USER` e `DB_PASSWORD` no serviço do backend; não use credenciais no código nem no Git. A origem do frontend publicado também precisa estar permitida na configuração de CORS do backend.

## Referências

Documentos oficiais disponibilizados pelo Ministério do Trabalho e Emprego na página da NR-17:

1. [NR-17 — Ergonomia (atualizada em 2023)](https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-17-atualizada-2023.pdf).
2. [NR-17 — Anexo I: Trabalho dos Operadores de Checkout (atualizado em 2023)](https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-17-anexo-i-checkout-atualizado-2023.pdf).
3. [NR-17 — Anexo II: Trabalho em Teleatendimento/Telemarketing (atualizado em 2023)](https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-17-anexo-ii-teleatendimento-atualizado-2023.pdf).

Os três documentos foram publicados na [página oficial da NR-17](https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-17-nr-17). A versão indicada na página teve última modificação pela Portaria MTP nº 4.219, de 20 de dezembro de 2022.
