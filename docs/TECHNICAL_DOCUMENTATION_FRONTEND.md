# Documentação Técnica: Otto Stock Frontend

## 1. Stack e Estrutura
O projeto é uma aplicação web moderna construída com foco em performance e tipagem estática.

*   **Core**: React 19
*   **Build Tool**: Vite
*   **Linguagem**: TypeScript
*   **Roteamento**: React Router Dom v7
*   **Consumo de API**: Axios

### Estrutura de Pastas
```text
src/
├── api/            # Configuração e instância do Axios
├── assets/         # Recursos estáticos (imagens, svgs)
├── components/     # Componentes reutilizáveis globais
├── pages/          # Componentes de página (Views)
├── services/       # Definições de constantes e lógica de serviço
├── App.tsx         # Componente raiz com definição de rotas
└── main.tsx        # Ponto de entrada da aplicação
```

---

## 2. Mapeamento de Telas e Componentes

### Páginas Existentes
| Página | Rota | Descrição |
| :--- | :--- | :--- |
| **Home** | `/` | Tela inicial de boas-vindas. |
| **Insumos** | `/insumos` | Cadastro e listagem de insumos. |
| **Exames** | `/exames` | Cadastro e listagem de tipos de exames. |
| **Estoque** | `/estoque` | Registro de entradas e saídas de insumos. |
| **Atendimentos** | `/atendimentos` | Listagem de atendimentos e finalização de ciclos. |

### Componentes Globais
Atualmente, o sistema possui uma arquitetura de componentes bem enxuta:
*   **Navbar**: Gerencia a navegação principal entre as rotas da aplicação.
*   *Observação*: Tabelas, formulários e modais ainda não foram abstraídos em componentes reutilizáveis, sendo renderizados diretamente nas páginas com tags HTML puras.

---

## 3. Gerenciamento de Estado e Contexto
O projeto utiliza **Estado Local** (`useState`) e **Efeitos Side-care** (`useEffect`) para gerenciar os dados.

*   **Data Sharing**: Não há uma implementação de Context API ou Redux no momento. Os dados são buscados individualmente em cada página ao carregar.
*   **Hooks**: Utiliza hooks nativos do React para controle de formulários e sincronização com a API.

---

## 4. Consumo de API
A comunicação com o backend é centralizada através de uma instância do Axios configurada em `src/api/api.ts`.

*   **Base URL**: `http://localhost:3000/api`
*   **Serviços Mapeados**:
    *   `GET /insumos`: Lista todos os insumos.
    *   `POST /insumos`: Cria um novo insumo.
    *   `GET /exames`: Lista todos os exames.
    *   `POST /exames`: Cria um novo tipo de exame.
    *   `POST /estoque/entrada`: Registra entrada de itens.
    *   `POST /estoque/saida`: Registra saída de itens.
    *   `GET /atendimentos`: Lista atendimentos pendentes.
    *   `PATCH /atendimentos/:id/finalizar`: Finaliza um atendimento.

---

## 5. Experiência do Usuário (UX)

### Fluxo de Navegação
O usuário utiliza a `Navbar` para alternar entre as funcionalidades. O fluxo é linear e direto.

### Status de Integração
| Tela | Status | Observação |
| :--- | :--- | :--- |
| Insumos | **Integrada** | Funcionalidades de criar e listar operacionais. |
| Exames | **Integrada** | Funcionalidades de criar e listar operacionais. |
| Estoque | **Integrada** | Entrada e Saída enviando dados para o backend. |
| Atendimentos| **Integrada** | Listagem e finalização funcionais. |
| Home | **Mockada** | Apenas texto estático. |

---

## 6. Checklist de Pendências (Próximos Passos)

### Funcionalidades e UI
- [ ] **Design System**: Implementar TailwindCSS ou uma biblioteca de componentes (ex: Shadcn/ui) para sair do HTML básico.
- [ ] **Componentização**: Criar componentes genéricos de `DataTable`, `Button`, `Input` e `Modal`.
- [ ] **Feedback de Erro**: Adicionar `try-catch` nas chamadas de API com notificações (Toast) para o usuário.
- [ ] **Loading States**: Adicionar esqueletos (Skeletons) ou Spinners durante as requisições.
- [ ] **Validação de Formulários**: Implementar React Hook Form + Zod para evitar envios de dados inválidos.
- [ ] **Paginação/Filtros**: As listas de insumos e atendimentos precisam de filtros por nome/status e paginação.
- [ ] **Confirmações**: Adicionar modais de confirmação antes de ações críticas como "Finalizar Atendimento" ou "Saída de Estoque".
- [ ] **Variáveis de Ambiente**: Mover a URL da API para um arquivo `.env`.
