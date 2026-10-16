# Otto Stock Web

Interface web moderna para gestão clínica, controle de atendimentos e gerenciamento inteligente de estoque de insumos hospitalares e laboratoriais.

O **Otto Stock Web** integra os fluxos de recepção, corpo clínico e almoxarifado, permitindo acompanhar métricas em tempo real, associar fichas técnicas de insumos a exames e automatizar o controle de entradas, saídas e alertas de estoque mínimo.

---

## Principais Funcionalidades

- **Autenticação & Controle de Acesso (RBAC)**: Login com JWT, persistência de sessão, interceptors de expiração (`401`) e proteção de rotas por perfil (`ADMIN`, `GESTOR`, `ATENDENTE`, `ESTOQUISTA`).
- **Dashboard Analítico (`/`)**: Indicadores em tempo real de total de atendimentos, atendimentos do dia, alertas de estoque crítico, ranking de exames mais realizados e histórico recente de movimentações.
- **Gestão de Pacientes (`/pacientes`)**: Cadastro, edição, busca e listagem paginada de pacientes.
- **Gestão de Médicos (`/medicos`)**: Cadastro e manutenção do corpo clínico e registro de CRM.
- **Gestão de Atendimentos (`/atendimentos`)**: Abertura de atendimentos vinculados a pacientes, médicos e exames, com fluxo de finalização/cancelamento e filtros por período e status.
- **Catálogo de Insumos (`/insumos`)**: Gerenciamento de materiais e medicamentos, unidades de medida e estoque mínimo de segurança.
- **Catálogo de Exames (`/exames`)**: Cadastro e manutenção dos procedimentos e exames realizados pela clínica.
- **Ficha Técnica (`/exame-insumos`)**: Vínculo entre exames e os insumos consumidos por procedimento, definindo a quantidade padrão utilizada.
- **Movimentação de Estoque (`/estoque`)**: Registro de entradas, saídas manuais e ajustes de inventário com validação de formulário.
- **Saldo Consolidado (`/estoque/saldo`)**: Visão consolidada dos saldos atuais por insumo com destaque visual para itens em nível crítico.
- **Extrato de Movimentações (`/estoque/movimentacoes`)**: Histórico auditável de todas as entradas, saídas e baixas de estoque.

---

## Tecnologias Utilizadas

| Categoria | Tecnologia |
| :--- | :--- |
| **Core** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite 8](https://vite.dev/) |
| **Roteamento** | [React Router DOM v7](https://reactrouter.com/) |
| **Requisições HTTP** | [Axios](https://axios-http.com/) |
| **Formulários & Validação** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) + `@hookform/resolvers` |
| **Ícones & Notificações** | [Lucide React](https://lucide.dev/) + [Sonner](https://sonner.emilkowal.ski/) |
| **Padronização de Código** | [ESLint 9](https://eslint.org/) + `typescript-eslint` |
| **Containerização** | Docker (Multi-stage build com Node 20 Alpine + Nginx Alpine) |

---

## Estrutura do Projeto

```text
otto-stock-web/
├── public/                 # Ativos públicos estáticos (favicon, ícones)
├── src/
│   ├── api/
│   │   └── api.ts          # Instância do Axios e interceptors JWT / 401
│   ├── assets/             # Imagens e vetores da aplicação
│   ├── components/
│   │   ├── ui/             # Componentes base reutilizáveis (Button, Input, Modal, Select, Table)
│   │   ├── ErrorBoundary.tsx
│   │   ├── Navbar.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx # Contexto global de autenticação e sessão do usuário
│   ├── pages/              # Telas da aplicação (Home, Login, Pacientes, Estoque, etc.)
│   ├── types/              # Interfaces e contratos TypeScript
│   ├── App.tsx             # Definição de rotas e provedores globais
│   ├── main.tsx            # Ponto de entrada da aplicação React
│   └── index.css           # Estilos globais e utilitários de UI
├── Dockerfile              # Build multi-stage para produção com Nginx
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Matriz de Permissões e Rotas

| Rota | Módulo | Perfis Permitidos |
| :--- | :--- | :--- |
| `/login` | Autenticação | Público |
| `/` | Dashboard Geral | Todos os usuários autenticados |
| `/pacientes` | Pacientes | `ADMIN`, `ATENDENTE`, `GESTOR` |
| `/medicos` | Médicos | `ADMIN`, `GESTOR` |
| `/atendimentos` | Atendimentos | `ADMIN`, `ATENDENTE`, `GESTOR` |
| `/insumos` | Insumos | `ADMIN`, `ESTOQUISTA` |
| `/exames` | Exames | `ADMIN` |
| `/exame-insumos` | Ficha Técnica (Exame x Insumos) | `ADMIN`, `ESTOQUISTA` |
| `/estoque` | Movimentar Estoque | `ADMIN`, `ESTOQUISTA` |
| `/estoque/saldo` | Saldo Consolidado | `ADMIN`, `ESTOQUISTA`, `GESTOR` |
| `/estoque/movimentacoes` | Histórico de Movimentações | `ADMIN`, `ESTOQUISTA`, `GESTOR` |

---

## Como Executar o Projeto

### Pré-requisitos
- **Node.js** 20+ e **npm**
- Backend da API Otto Stock em execução (por padrão em `http://localhost:3000/api`)

### 1. Instalação

No diretório `otto-stock-web`, instale as dependências:

```bash
npm install
```

### 2. Variáveis de Ambiente

Crie um arquivo `.env` na raiz de `otto-stock-web` (opcional caso o backend rode na porta padrão `3000`):

```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Execução em Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

---

## Executando com Docker

O projeto conta com um `Dockerfile` multi-stage que compila a aplicação e serve os arquivos estáticos via **Nginx**.

```bash
# Construir a imagem (opcionalmente passando a URL da API)
docker build --build-arg VITE_API_URL=http://localhost:3000/api -t otto-stock-web .

# Iniciar o container na porta 8080
docker run -d -p 8080:80 --name otto-stock-web otto-stock-web
```

Acesse em `http://localhost:8080`.

---

## Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento do Vite com HMR.
- `npm run build`: Executa a checagem de tipos do TypeScript (`tsc -b`) e gera o bundle de produção na pasta `dist/`.
- `npm run preview`: Inicia um servidor local para inspecionar a build de produção.
- `npm run lint`: Executa a análise estática de código com ESLint.
