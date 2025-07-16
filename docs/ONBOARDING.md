# Guia de Onboarding de Desenvolvedores - Projeto RPE (Rocket Performance & Engagement)

Bem-vindo(a) à equipe Arraiware e ao projeto RPE! Este guia tem como objetivo fornecer todas as instruções necessárias para que você consiga configurar, instalar e executar o projeto RPE (Frontend e Backend) em sua máquina local.

**Objetivo:** Reduzir o tempo de setup, alinhar padrões de desenvolvimento e facilitar a colaboração da equipe.

---

## 🚀 Visão Geral do Projeto

O RPE (Rocket Performance & Engagement) é uma plataforma desenvolvida para automatizar e otimizar as avaliações de desempenho, feedback 360 e gestão de talentos na Rocket Corp. Ele é composto por dois principais componentes:

* **Frontend:** A interface de usuário, desenvolvida com React, Vite e Tailwind CSS.
* **Backend:** A API que provê os dados e a lógica de negócio, desenvolvida com NestJS e Prisma.

Ambos os componentes são mantidos em repositórios Git separados.

---

## 🛠️ Pré-requisitos Comuns

Certifique-se de ter as seguintes ferramentas instaladas em seu sistema operacional:

* **Git:** Para clonar os repositórios.
    * [Download Git](https://git-scm.com/downloads)
* **Node.js:** (versão 18 ou superior recomendada). Inclui o npm.
    * [Download Node.js](https://nodejs.org/en/download/)
* **pnpm:** O gerenciador de pacotes padrão para este projeto.
    * Instalação global: `npm install -g pnpm`
* **IDE (Ambiente de Desenvolvimento Integrado):** Visual Studio Code é o recomendado.
    * [Download VS Code](https://code.visualstudio.com/download)

---

## 📦 Configurando o Backend (API)

Este é o primeiro componente que você deve configurar, pois o Frontend depende dele.

* **Repositório:** [https://github.com/belli5/Arraiaware-backend](https://github.com/belli5/Arraiaware-backend)

### Passos de Configuração

1.  **Clonar o Repositório:**
    ```bash
    git clone [https://github.com/belli5/Arraiaware-backend.git](https://github.com/belli5/Arraiaware-backend.git)
    cd Arraiaware-backend
    ```

2.  **Instalar Dependências:**
    ```bash
    pnpm install
    ```

3.  **Configurar Variáveis de Ambiente (`.env`):**
    O projeto utiliza variáveis de ambiente para configurações sensíveis (como credenciais de banco de dados, chaves secretas, etc.).
    * Crie uma cópia do arquivo de exemplo:
        ```bash
        cp .env.example .env
        ```
    * Abra o arquivo `.env` e configure as variáveis. Para desenvolvimento local, as configurações padrão geralmente funcionam, mas você pode precisar ajustar `DATABASE_URL` ou outras se tiver um setup específico.

4.  **Executar Migrações do Banco de Dados:**
    O backend usa Prisma para gerenciar o banco de dados. Este comando criará o banco de dados SQLite (padrão para dev) e aplicará todas as tabelas:
    ```bash
    pnpm prisma migrate dev --name init
    ```
    * **Nota:** Se você precisar resetar o banco de dados em algum momento (cuidado, isso apaga todos os dados!), use `pnpm prisma migrate reset`.

### Comandos Básicos do Backend

* **Iniciar o Servidor em Modo de Desenvolvimento (com hot-reload):**
    ```bash
    pnpm start:dev
    ```
    * A API estará disponível em: `https://arraiaware-backend.onrender.com/`
    * A documentação interativa da API (Swagger/OpenAPI) estará em: `https://arraiaware-backend.onrender.com/api-docs`

* **Construir o Projeto para Produção (Build):**
    ```bash
    pnpm build
    ```

* **Rodar Testes:**
    ```bash
    pnpm test
    ```
    * Para testes e2e: `pnpm test:e2e`

---

## 🖥️ Configurando o Frontend (Interface)

Após configurar e iniciar o backend, você pode configurar o frontend.

* **Repositório:** [https://github.com/belli5/Arraiaware-frontend](https://github.com/belli5/Arraiaware-frontend)

### Passos de Configuração

1.  **Clonar o Repositório:**
    ```bash
    git clone [https://github.com/belli5/Arraiaware-frontend.git](https://github.com/belli5/Arraiaware-frontend.git)
    cd Arraiaware-frontend
    ```
    * **Importante:** Se você clonou o repositório em um diretório irmão do backend, certifique-se de estar na pasta `Arraiaware-frontend`.

2.  **Instalar Dependências:**
    ```bash
    pnpm install
    ```

3.  **Configurar Variáveis de Ambiente (`.env`):**
    O frontend precisa saber onde encontrar a API do backend.
    * Crie uma cópia do arquivo de exemplo:
        ```bash
        cp .env.example .env
        ```
    * Abra o arquivo `.env` e ajuste a URL da API (geralmente `VITE_API_BASE_URL=https://arraiaware-backend.onrender.com`).

### Comandos Básicos do Frontend

* **Iniciar o Servidor de Desenvolvimento (com hot-reload):**
    ```bash
    pnpm dev
    ```
    * O aplicativo estará disponível em: `http://localhost:5173/` (ou outra porta indicada pelo Vite).

* **Construir o Projeto para Produção (Build):**
    ```bash
    pnpm build
    ```

* **Rodar Testes (se aplicável):**
    ```bash
    pnpm test
    ```

---

## 🌐 Primeiro Acesso e Teste

1.  Certifique-se de que o **backend** está rodando (`pnpm start:dev`).
2.  Certifique-se de que o **frontend** está rodando (`pnpm dev`).
3.  Abra seu navegador em `http://localhost:5173/`. Você será redirecionado para a tela de login.
4.  Para testar a funcionalidade de avaliação, você pode precisar criar um usuário através da API (usando a documentação Swagger do backend em `https://arraiaware-backend.onrender.com/api-docs`) ou aguardar a implementação de uma tela de cadastro no frontend.

---

## 📚 Recursos Adicionais

* **Guia de Contribuição:** Para informações sobre como contribuir com código, seguir padrões e fazer Pull Requests, consulte a seção "Contribuição" no README de cada repositório.
* **Documentação do Projeto (Alto Nível):** [Drive Arraiware](https://drive.google.com/drive/folders/1NpfxwSl4vwud8LO4TXIqp8rI0YK1-Ksr)
* **Canais de Comunicação da Equipe:** WhatsApp, Discord
* **Ferramentas de Gestão de Tarefas:** [Trello](https://trello.com/b/sLvkVgGm/kanban)

---

**Equipe de Desenvolvimento:** Arraiware