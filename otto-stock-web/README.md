# Otto Stock Web

Interface web moderna para gestão clínica, controle de atendimentos e gerenciamento inteligente de estoque de insumos hospitalares e laboratoriais.

O **Otto Stock Web** integra os fluxos de recepção, corpo clínico e almoxarifado, permitindo acompanhar métricas operacionais, associar fichas técnicas de insumos a exames e automatizar a baixa de estoque na finalização de atendimentos com alertas de estoque mínimo.

---

## Principais Funcionalidades

- **Landing Page Institucional (`/landing`)**: Página pública de apresentação da plataforma (carregada sob demanda via `React.lazy`), detalhando fluxo operacional, matriz RBAC e governança de estoque.
- **Autenticação & Controle de Acesso (RBAC)**: Login com JWT (`/login`), persistência de sessão, interceptors de expiração (`401`), cabeçalho global (`Navbar`) com alerta de itens críticos em tempo real e proteção de rotas compartilhada via `ROUTE_ROLES` (`ADMIN`, `GESTOR`, `ATENDENTE`, `ESTOQUISTA`).
- **Dashboard Geral (`/`)**: KPIs de atendimentos (em aberto, finalizados, cancelados e realizados hoje), tabela de alertas de estoque crítico com entrada rápida, ranking de exames mais realizados com ficha técnica associada, atendimentos em aberto com finalização direta e extrato das últimas movimentações.
- **Gestão de Pacientes (`/pacientes`)**: Cadastro, edição, desativação (soft delete), visualização de detalhes, busca textual e paginação.
- **Gestão de Médicos (`/medicos`)**: Cadastro e manutenção do corpo clínico credenciado com registro de CRM e indicadores de preenchimento.
- **Gestão de Atendimentos (`/atendimentos`)**: Abertura de atendimentos vinculados a paciente, médico e exame com **previsão de consumo em tempo real** (verificação prévia de saldo por insumo), filtros avançados e baixa automática de estoque em transação atômica ao finalizar (`PATCH /atendimentos/:id/finalizar`).
- **Catálogo de Insumos (`/insumos`)**: Gerenciamento do catálogo de materiais e reagentes em `Drawer`, parâmetros de quantidade mínima de segurança, visualização de exames vinculados e modal de entrada rápida.
- **Catálogo de Exames (`/exames`)**: Cadastro e manutenção dos procedimentos laboratoriais/clínicos e acesso integrado à ficha técnica via `FichaTecnicaDrawer`.
- **Ficha Técnica (`/exame-insumos`)**: Vínculo entre exames e os insumos consumidos por procedimento, definindo a quantidade padrão baixada automaticamente a cada atendimento finalizado.
- **Movimentação de Estoque (`/estoque`)**: Registro de entradas, saídas manuais (com trava de saldo insuficiente) e ajustes de inventário auditáveis.
- **Saldo Consolidado (`/estoque/saldo`)**: Posição física consolidada por insumo, classificação automática de nível de cobertura (`Crítico`, `Atenção`, `Conforme`), ordenação por criticidade e ações rápidas de entrada/saída.
- **Extrato de Movimentações (`/estoque/movimentacoes`)**: Histórico paginado e filtrável por insumo, tipo de operação (`ENTRADA`, `SAIDA`, `AJUSTE`) e período.

---

## Tecnologias Utilizadas

| Categoria | Tecnologia |
| :--- | :--- |
| **Core** | [React 19](https://react.dev/) + [TypeScript ~5.9](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite 8](https://vite.dev/) |
| **Estilização & Design System** | [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite`) + Tokens clínicos customizados |
| **Roteamento** | [React Router DOM v7](https://reactrouter.com/) |
| **Requisições HTTP** | [Axios](https://axios-http.com/) |
| **Formulários & Validação** | [React Hook Form](https://react-hook-form.com/) + [Zod v4](https://zod.dev/) + `@hookform/resolvers` |
| **Ícones & Notificações** | [Lucide React](https://lucide.dev/) + [Sonner](https://sonner.emilkowal.ski/) |
| **Padronização de Código** | [ESLint 9](https://eslint.org/) + `typescript-eslint` |
| **Containerização** | Docker (Multi-stage build com Node 20 Alpine + Nginx Alpine) |

---

## Estrutura do Repositório

```text
Otto-stock-frontend/
├── docs/
│   ├── API_CONTRACT.md                     # Especificação formal da API REST do backend
│   ├── TECHNICAL_DOCUMENTATION_FRONTEND.md # Documentação técnica complementar
│   └── checklist_auditoria_frontend.md     # Checklist de auditoria de UX e arquitetura
├── PENDENCIAS_BACKEND.md                   # Gaps e propostas técnicas entre Frontend e Backend
└── otto-stock-web/
    ├── public/                             # Ativos públicos estáticos
    ├── src/
    │   ├── api/
    │   │   └── api.ts                      # Instância do Axios e interceptors JWT / 401
    │   ├── assets/                         # Imagens e vetores da aplicação
    │   ├── components/
    │   │   ├── landing/                    # Seções modulares da Landing Page (/landing)
    │   │   ├── ui/                         # Primitivos de UI (Button, Drawer, EmptyState, Input,
    │   │   │                               # MetricCard, Modal, PageHeader, Pagination, ProgressBar,
    │   │   │                               # Select, Skeleton, StatusBadge, Table, Tabs)
    │   │   ├── ErrorBoundary.tsx           # Tratamento global de erros de renderização
    │   │   ├── FichaTecnicaDrawer.tsx      # Drawer de associação rápida Exame <-> Insumos
    │   │   ├── Logo.tsx                    # Identidade visual Otto Stock
    │   │   ├── Navbar.tsx                  # Cabeçalho global com RBAC e alertas de estoque
    │   │   └── ProtectedRoute.tsx          # Guarda de rotas autenticadas e por perfil
    │   ├── contexts/
    │   │   └── AuthContext.tsx             # Contexto global de autenticação e sessão
    │   ├── pages/                          # Telas da aplicação (Home, Landing, Login, Pacientes,
    │   │                                   # Medicos, Atendimentos, Insumos, Exames, ExameInsumos,
    │   │                                   # Estoque, EstoqueSaldo, Movimentacoes, NotFound)
    │   ├── types/                          # Contratos TypeScript, schemas Zod e matriz ROUTE_ROLES
    │   ├── utils/                          # Cálculo de nível de estoque (estoque.ts + testes) e
    │   │                                   # formatadores (CPF, CRM, datas relativas, números)
    │   ├── App.tsx                         # Definição de rotas e provedores globais
    │   ├── main.tsx                        # Ponto de entrada da aplicação React
    │   └── index.css                       # Tokens do Design System (Tailwind v4) e estilos globais
    ├── Dockerfile                          # Build multi-stage para produção com Nginx
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

---

## Matriz de Permissões e Rotas

Definida de forma centralizada em `src/types/auth.ts` (`ROUTE_ROLES`) e compartilhada entre `App.tsx` e `Navbar.tsx`:

| Rota | Módulo | Perfis Permitidos |
| :--- | :--- | :--- |
| `/landing` | Landing Page Institucional | Público |
| `/login` | Autenticação | Público |
| `/` | Painel Geral (Dashboard) | `ADMIN`, `ESTOQUISTA`, `ATENDENTE`, `GESTOR` |
| `/pacientes` | Pacientes | `ADMIN`, `ATENDENTE`, `GESTOR` |
| `/medicos` | Médicos | `ADMIN`, `GESTOR` |
| `/atendimentos` | Atendimentos Clínicos | `ADMIN`, `ATENDENTE`, `GESTOR` |
| `/insumos` | Catálogo de Insumos | `ADMIN`, `ESTOQUISTA` |
| `/exames` | Catálogo de Exames | `ADMIN` |
| `/exame-insumos` | Ficha Técnica (Exame × Insumos) | `ADMIN`, `ESTOQUISTA` |
| `/estoque` | Movimentar Estoque (Entrada / Saída / Ajuste) | `ADMIN`, `ESTOQUISTA` |
| `/estoque/saldo` | Saldo Consolidado de Estoque | `ADMIN`, `ESTOQUISTA`, `GESTOR` |
| `/estoque/movimentacoes` | Histórico de Movimentações | `ADMIN`, `ESTOQUISTA`, `GESTOR` |

---

## Documentação e Contratos da API

- **[`docs/API_CONTRACT.md`](../docs/API_CONTRACT.md)**: Documenta todos os endpoints ativos do backend (`http://localhost:3000/api`), payloads de requisição/resposta, regras de negócio (como baixa atômica de estoque ao finalizar atendimento) e credenciais seed de teste (`admin@clinica.com` / `admin123`).
- **[`PENDENCIAS_BACKEND.md`](../PENDENCIAS_BACKEND.md)**: Registra de forma auditável (separando *fato verificado no repositório* de *sugestão a validar no backend*) as evoluções pendentes de contrato:
  1. Campo opcional `especialidade` no módulo `/medicos`;
  2. Enum `UnidadeMedida` (`unidade`) no modelo `Insumo` com `NAO_INFORMADA` para legados (sem default silencioso `UN`) e migration em 3 passos;
  3. Endpoint `GET /relatorios/movimentacoes-grafico?dias=7` com fuso fixo (`America/Sao_Paulo`), intervalo `1..90` e *zero-filling*;
  4. Paginação e busca (`page`, `limit`, `search`) em `GET /pacientes` e `GET /medicos` com transição retrocompatível e mascaramento de CPF (LGPD);
  5. Filtro `?ativo=true|false|all` em `GET /insumos` e enriquecimento de `GET /relatorios/dashboard` para eliminar chamadas extras de contagem e evitar truncamento acima de 100 atendimentos finalizados/dia.

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

