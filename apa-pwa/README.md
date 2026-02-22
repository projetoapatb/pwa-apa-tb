# APA PWA - Progressive Web App

Este é o front-end do projeto ONG Amigo de Pata, desenvolvido utilizando React, TypeScript e Vite. O sistema é um Progressive Web App (PWA) integrado ao Firebase.

## 🚀 Como Começar

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão LTS recomendada)
- NPM ou Yarn

### Instalação

1. Acesse o diretório do projeto:
   ```bash
   cd apa-pwa
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env` na raiz da pasta `apa-pwa` (utilize o `.env.example` se disponível ou siga a estrutura abaixo):
   ```env
   VITE_FB_API_KEY=seu_api_key
   VITE_FB_AUTH_DOMAIN=seu_auth_domain
   VITE_FB_PROJECT_ID=seu_project_id
   VITE_FB_STORAGE_BUCKET=seu_storage_bucket
   VITE_FB_APP_ID=seu_app_id
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## 🛠 Comandos Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento com Hot Module Replacement (HMR).
- `npm run build`: Gera a build de produção na pasta `dist`.
- `npm run preview`: Visualiza a build de produção localmente.
- `npm run lint`: Executa a verificação do ESLint.

## ✨ Funcionalidades do MVP

- **Catálogo de Cães**: Listagem e detalhes com galeria de fotos.
- **Formulários de Lead**: Interesse em adoção e voluntariado persistidos no Firestore.
- **Painel Administrativo**:
  - CRUD de cães, histórias (posts) e parceiros.
  - Gestão de visibilidade via *Feature Flags*.
  - Exportação de leads em CSV.
- **Suporte PWA**: Funcionamento offline básico, manifesto e ícones configurados.

## 📁 Estrutura do Projeto

- `src/components`: Componentes reutilizáveis da interface.
- `src/pages`: Páginas principais da aplicação.
- `src/hooks`: Custom hooks para lógica e integração com Firebase.
- `src/services`: Configuração do Firebase e funções de API (Firestore/Storage).
- `src/providers`: Provedores de contexto (Auth, Tema, Query).
- `src/types`: Definições de tipos TypeScript.

---
Para mais detalhes sobre a arquitetura e requisitos, consulte a pasta `Docs` na raiz do repositório.
