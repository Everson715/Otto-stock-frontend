# Pendências do Backend (Gaps, Transições e Oportunidades Identificadas)

Este documento registra o alinhamento de interface, discrepâncias e ausências de endpoints ou campos entre as necessidades da interface de usuário (`otto-stock-web`) e a especificação formal do backend ([`docs/API_CONTRACT.md`](docs/API_CONTRACT.md)), em conformidade com a **Regra 2** de governança do projeto.

> **Convenção deste documento:**
> - **Fato verificado no repositório:** comportamento confirmado diretamente no código-fonte de `otto-stock-web` e em [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md).
> - **Sugestão a validar no repositório do backend:** trechos de schema Prisma, DTOs, índices e contratos propostos (dado que o código-fonte do backend não reside neste repositório).

---

## Quadro Geral de Alinhamento e Status de Integração

| Módulo / Funcionalidade | Status Backend (`API_CONTRACT.md`) | Status Frontend (`otto-stock-web`) | Estado Geral |
| :--- | :---: | :---: | :---: |
| **Médicos:** Campo `especialidade` | ✅ Implementado | ✅ Integrado (`Medicos.tsx`, `medico.ts`) | **Concluído e Integrado** |
| **Insumos:** Enum `UnidadeMedida` e campo `unidade` | ✅ Implementado | ✅ Integrado (`Insumos.tsx`, `insumo.ts`) | **Concluído e Integrado** |
| **Dashboard:** Série Temporal (`GET /relatorios/movimentacoes-grafico`) | ✅ Implementado | ✅ Integrado (`Home.tsx`, `dashboard.ts`) | **Concluído e Integrado** |
| **Insumos:** Filtro de Status (`GET /insumos?ativo=true\|false\|all`) | ✅ Implementado | ✅ Integrado (`Insumos.tsx`) | **Concluído e Integrado** |
| **Dashboard:** Enriquecimento de `GET /relatorios/dashboard` | ✅ Implementado | ✅ Integrado (`Home.tsx`) | **Concluído e Integrado** |
| **Pacientes/Médicos:** Paginação e Busca Server-Side | 🟡 Passo 1 Ativo (Retrocompatível) | 🟡 Parcial (Telas migram; `<Select>` em `Atendimentos.tsx` pendente) | **Em Transição (Passo 2)** |
| **Autenticação:** Sessão estendida de 12h (`manterConectado`) | ✅ Implementado no Contrato | 🟡 Campo visual existe; repasse via `AuthContext` pendente | **Pendente no Frontend** |
| **Autenticação:** Recuperação de Senha (`/auth/forgot-password`) | ❌ Não implementado | 🟡 Mitigado com toast/gestão ADMIN | **Pendente no Backend** |
| **Exames e Vínculos:** Paginação em `/exames` e `/exame-insumos` | ❌ Não implementado (Array plano) | 🟡 Array em memória | **Oportunidade Futura** |
| **Estoque:** Saldo Consolidado Individual (`/estoque/saldo/:id`) | ❌ Não implementado (Cálculo total) | 🟡 Filtro client-side em array total | **Oportunidade Futura** |

---

## 1. Itens Concluídos e Integrados (Resolvidos no Backend e Frontend)

### 1.1. Módulo Médicos (`/medicos`): Campo `especialidade`

- **Item atendido:** Inclusão do campo `especialidade` no modelo `Medico`.
- **Situação no Contrato da API (fato verificado em `docs/API_CONTRACT.md`):**
  - Seção 3.6 (linhas 427–477) e Seção 4, item 4 (linhas 904–906): `POST /medicos`, `PUT /medicos/:id`, `GET /medicos`, `GET /medicos/:id` e o objeto `medico` aninhado em `GET /atendimentos` (linha 699) e `GET /atendimentos/:id` (linha 740) incluem `"especialidade": string | null`. O backend aplica `trim`, aceita de 2 a 80 caracteres quando informado e converte string vazia (`""`) para `null`.
- **Tratamento no Frontend (fato verificado no repositório):**
  - **Implementado:** Em `otto-stock-web/src/types/medico.ts`, a interface `Medico` contém `especialidade?: string | null` e o schema `medicoSchema` valida tamanho máximo de 80 caracteres.
  - Na tela `otto-stock-web/src/pages/Medicos.tsx`, a especialidade é exibida na tabela principal (com fallback `"—"` para valores nulos/vazios), no modal de criação/edição e no modal de detalhes do médico.
- **Critérios de Aceite:**
  - [x] Migration adiciona a coluna `especialidade VARCHAR(80) NULL` na tabela de médicos sem afetar registros existentes (`null`).
  - [x] `POST /medicos` e `PUT /medicos/:id` aplicam `trim`, validam tamanho (2 a 80 caracteres) e convertem `""` em `null`.
  - [x] `GET /medicos`, `GET /medicos/:id`, `GET /atendimentos` e `GET /atendimentos/:id` passam a incluir `"especialidade": string | null` no objeto do médico.
  - [x] Frontend exibe `"—"` quando `especialidade` for `null` ou ausente, sem quebrar formulários ou tabelas.

---

### 1.2. Módulo Insumos e Saldo de Estoque (`/insumos`, `/estoque/saldo`): Unidade de Medida (`unidade`)

- **Item atendido:** Campo `unidade` tipado pelo enum `UnidadeMedida` no modelo `Insumo` e em endpoints derivados.
- **Situação no Contrato da API (fato verificado em `docs/API_CONTRACT.md`):**
  - Seção 3.3 (linhas 215–300), Seção 3.7 (linhas 541–570, 604–639) e Seção 4, item 2 (linhas 896–900): Enum `UnidadeMedida` (`UN`, `CX`, `AMPOLA`, `FRASCO`, `ML`, `PAR`, `PACOTE`, `ROLO`, `KIT`, `NAO_INFORMADA`).
  - `POST /insumos` exige o envio de unidade de negócio válida (rejeitando ausência ou `NAO_INFORMADA` com `400 Bad Request`).
  - `PUT /insumos/:id` permite atualizar a unidade.
  - `GET /insumos`, `GET /insumos/:id`, `GET /estoque/saldo`, `GET /estoque/movimentacoes` e `GET /exame-insumos` expõem o campo `unidade`.
- **Tratamento no Frontend (fato verificado no repositório):**
  - **Implementado:** Em `otto-stock-web/src/types/insumo.ts`, constantes `UNIDADES_MEDIDA`, tipo `UnidadeMedida` e mapa de rótulos `UNIDADE_MEDIDA_LABELS` declarados; schema `insumoSchema` exige seleção válida.
  - Em `otto-stock-web/src/types/estoqueSaldo.ts`, a interface `EstoqueSaldoItem` inclui `unidade?: string`.
  - Na tela `otto-stock-web/src/pages/Insumos.tsx`, o Drawer de cadastro/edição inclui `<Select>` com as opções do enum; a tabela principal renderiza a badge com a sigla da unidade e exibe `"—"` com tooltip `"Unidade não cadastrada"` caso o item legado possua `NAO_INFORMADA` ou nulo (proibida a inferência cega de `"un"`).
- **Critérios de Aceite:**
  - [x] Migration adiciona a coluna `unidade` com `DEFAULT 'NAO_INFORMADA'`, preenche registros legados e remove o default em seguida (`NOT NULL` sem default no schema final).
  - [x] `POST /insumos` exige o envio explícito de `unidade` válida (rejeitando ausência ou `NAO_INFORMADA` com `400 Bad Request`).
  - [x] `GET /insumos`, `GET /insumos/:id`, `GET /estoque/saldo`, `GET /estoque/movimentacoes`, `GET /exame-insumos` e `GET /exame-insumos/exame/:exameId` retornam o campo `unidade`.
  - [x] Frontend exibe `"—"` com tooltip `"Unidade não cadastrada"` para itens com `unidade` ausente, nula ou `NAO_INFORMADA`, nunca exibindo `"un"` por inferência.

---

### 1.3. Módulo Dashboard (`/relatorios`): Gráfico de Movimentações (`GET /relatorios/movimentacoes-grafico`)

- **Item atendido:** Endpoint de agregação temporal diária de movimentações de estoque.
- **Situação no Contrato da API (fato verificado em `docs/API_CONTRACT.md`):**
  - Seção 3.9 (linhas 800–827) e Seção 4, item 5 (linhas 907–910): Endpoint `GET /relatorios/movimentacoes-grafico?dias=7`.
  - Aceita `dias` inteiro entre `1` e `90` (default `7`). Fuso fixo no servidor `America/Sao_Paulo`.
  - Retorna série temporal contínua com *zero-filling* contendo `data` (`YYYY-MM-DD`), `entradasQtd`, `saidasQtd`, `ajustesLiquidoQtd` e `totalOperacoes`.
  - RBAC: Restrito a `ADMIN`, `ESTOQUISTA` e `GESTOR` (`ATENDENTE` recebe `403 Forbidden`).
- **Tratamento no Frontend (fato verificado no repositório):**
  - **Implementado:** Em `otto-stock-web/src/types/dashboard.ts`, interface `MovimentacaoGraficoItem`.
  - Em `otto-stock-web/src/pages/Home.tsx`, componente consome a rota, disponibiliza seletor de período (7, 15, 30 e 90 dias), exibe resumo de volume consolidado e renderiza gráfico de barras verticais proporcionais lado a lado (entradas vs saídas) com tooltips interativos contendo o detalhamento por dia (entradas, saídas, ajuste líquido e total de operações).
- **Critérios de Aceite:**
  - [x] `GET /relatorios/movimentacoes-grafico?dias=7` retorna array com exatamente `dias` posições contínuas (*zero-filling*) no fuso `America/Sao_Paulo`.
  - [x] Parâmetro `dias` fora do intervalo `1..90` retorna `400 Bad Request`.
  - [x] O payload inclui `data`, `entradasQtd`, `saidasQtd`, `ajustesLiquidoQtd` e `totalOperacoes`.
  - [x] Requisições com token de perfil `ATENDENTE` recebem `403 Forbidden`.
  - [x] Frontend renderiza gráfico proporcional e interativo com seletor de período.

---

### 1.4. Módulo Insumos (`/insumos`): Filtro de Status (`GET /insumos?ativo=`)

- **Item atendido:** Parâmetro `ativo` na listagem de insumos.
- **Situação no Contrato da API (fato verificado em `docs/API_CONTRACT.md`):**
  - Seção 3.3 (linhas 253–259) e Seção 4, item 3 (linhas 901–903): `GET /insumos` aceita `?ativo=true|false|all` (default `"true"`, mantendo retrocompatibilidade). Qualquer valor fora desses três retorna `400 Bad Request`.
- **Tratamento no Frontend (fato verificado no repositório):**
  - **Implementado:** Em `otto-stock-web/src/pages/Insumos.tsx`, a função `carregarCatalogo` traduz o estado `statusFilter` (`'ativos' | 'inativos' | 'todos'`) para `ativo: 'true' | 'false' | 'all'` nos query parameters da requisição, viabilizando a consulta e reativação de insumos inativados.
- **Critérios de Aceite:**
  - [x] `GET /insumos` aceita `?ativo=true|false|all` (com default `"true"` quando omitido).
  - [x] Ao selecionar `"Inativos"` ou `"Todos"` em `Insumos.tsx`, o frontend envia o parâmetro correspondente e exibe corretamente os insumos desativados.

---

### 1.5. Módulo Dashboard (`/relatorios`): Enriquecimento de `GET /relatorios/dashboard`

- **Item atendido:** Redução de *over-fetching*, inclusão do nome do exame em `examesMaisRealizados` e consolidação de contadores diários e por status.
- **Situação no Contrato da API (fato verificado em `docs/API_CONTRACT.md`):**
  - Seção 3.9 (linhas 766–798) e Seção 4, item 5 (linhas 907–910): `GET /relatorios/dashboard` retorna `nome` em cada item de `examesMaisRealizados` e o objeto `atendimentosPorStatus` contendo `emAtendimento`, `finalizados`, `cancelados`, `finalizadosHoje` e `protocolosDistintosHoje` no fuso `America/Sao_Paulo`.
- **Tratamento no Frontend (fato verificado no repositório):**
  - **Implementado:** Em `otto-stock-web/src/types/dashboard.ts`, interfaces `DashboardData` e `AtendimentosPorStatus` atualizadas.
  - Em `otto-stock-web/src/pages/Home.tsx`, os contadores de atendimentos em aberto, finalizados, cancelados e o card de "Exames Realizados Hoje" agora consomem diretamente `dadosDashboard.atendimentosPorStatus`.
  - Foram eliminadas com segurança as requisições redundantes de contagem: chamada com `limit=1` e chamada com `limit=100` que apresentava risco de truncamento silencioso no contador diário caso houvesse mais de 100 atendimentos no mesmo dia.
- **Critérios de Aceite:**
  - [x] `GET /relatorios/dashboard` inclui `nome` em cada item de `examesMaisRealizados` e o objeto `atendimentosPorStatus`.
  - [x] `Home.tsx` consome os contadores diretamente de `GET /relatorios/dashboard`, eliminando as chamadas redundantes a `/atendimentos` para totalizadores.

---

## 2. Itens em Transição e Faseamento Ativo

### 2.1. Paginação e Busca Server-Side nos Módulos Pacientes e Médicos (`/pacientes`, `/medicos`)

- **Objetivo:** Adotar o envelope paginado padrão `{ items, total, page, limit, totalPages }` e busca server-side (`search`) sem quebrar seletores em telas dependentes.
- **Telas dependentes:** [Pacientes](/pacientes) (`Pacientes.tsx`), [Médicos](/medicos) (`Medicos.tsx`) e [Atendimentos](/atendimentos) (`Atendimentos.tsx`).
- **Prioridade:** **Alta** (Segurança operacional e conformidade com LGPD).
- **Situação Atual do Rollout por Passos:**
  - **Passo 1 (Backend Retrocompatível — CONCLUÍDO NO BACKEND):**
    - Fato verificado em `docs/API_CONTRACT.md` (Seção 3.2, linhas 168–198; Seção 3.6, linhas 454–464; Seção 4, item 1, linhas 891–895):
    - `GET /pacientes` e `GET /medicos` aceitam `page` (`>= 1`), `limit` (`1..100`) e `search` (busca *case-insensitive* por nome/CPF em pacientes e por nome/CRM/especialidade em médicos).
    - A presença de **qualquer um** entre `page`, `limit` ou `search` retorna o envelope `{ items, total, page, limit, totalPages }`.
    - A ausência dos três parâmetros mantém o retorno legado em array plano `Paciente[]` ou `Medico[]`.
  - **Passo 2 (Frontend — PARCIALMENTE CONCLUÍDO):**
    - `otto-stock-web/src/pages/Pacientes.tsx`: **Concluído**. Consome paginação server-side com `page`, `limit` e `debouncedSearch`, exibindo o CPF com máscara (`mascararCpf`) na tabela e revelando o valor íntegro apenas no modal de detalhes/edição (LGPD).
    - `otto-stock-web/src/pages/Medicos.tsx`: **Concluído**. Consome paginação server-side com `page`, `limit` e `debouncedSearch`.
    - `otto-stock-web/src/pages/Atendimentos.tsx`: **PENDENTE**. As chamadas em `carregarCatalogosAuxiliares` (linhas 159–160) ainda realizam `api.get('/pacientes')` e `api.get('/medicos')` sem parâmetros, utilizando a retrocompatibilidade temporária do array legado.
  - **Passo 3 (Backend Definitivo — PENDENTE DE LIBERAÇÃO):**
    - O backend só poderá tornar o envelope `{ items, total, page, limit, totalPages }` (com `limit=10` padrão) obrigatório mesmo sem query parameters **após** a migração dos seletores de `Atendimentos.tsx` no Passo 2. Caso contrário, os seletores de paciente e médico do modal de Novo Atendimento exibiriam apenas os 10 primeiros registros cadastrados.
- **Critérios de Aceite para Conclusão:**
  - [x] (Passo 1) Backend aceita `page`, `limit` e `search` retornando envelope paginado quando informados, mantendo array legado quando omitidos.
  - [x] (Passo 2a) `Pacientes.tsx` e `Medicos.tsx` consomem parâmetros paginados e busca server-side com debounce.
  - [x] (Passo 2b) Coluna de CPF na tabela de `Pacientes.tsx` exibe CPF mascarado via `mascararCpf`.
  - [ ] (Passo 2c) Seletores de Paciente e Médico em `Atendimentos.tsx` migrados para busca assíncrona ou envio de `limit=50`/`search`.
  - [ ] (Passo 3) Backend torna o envelope paginado padrão em `GET /pacientes` e `GET /medicos` mesmo sem envio de parâmetros na query string.

---

## 3. Lacunas Residuais e Oportunidades Futuras no Backend

### 3.1. Duração Estendida da Sessão ("Manter conectado por 12 horas") em `POST /auth/login`

- **Situação no Contrato da API (fato verificado em `docs/API_CONTRACT.md`):**
  - Seção 2.3 (linhas 62–75): `POST /auth/login` já aceita `manterConectado?: boolean` (ou alias `rememberMe`). Quando `true`, emite token com validade de 12 horas; se `false` ou omitido, utiliza o padrão de 8 horas.
- **Tratamento no Frontend (fato verificado no repositório):**
  - O checkbox `"Manter conectado por 12 horas"` existe no formulário de `otto-stock-web/src/components/LoginForm.tsx`, mas a função `login(email, senha)` em `otto-stock-web/src/contexts/AuthContext.tsx` ainda não recebe nem envia a propriedade `manterConectado` para a rota `/auth/login`.
- **Status:** **Disponível no Backend / Pendente de ajuste no Frontend.**

---

### 3.2. Fluxo de Recuperação de Senha ("Esqueceu a senha?")

- **Item faltante:** Rotas dedicadas para solicitação de reset de senha (ex.: `POST /auth/forgot-password` e `POST /auth/reset-password`).
- **Tela dependente:** [Login](/login) (`otto-stock-web/src/components/LoginForm.tsx`).
- **Prioridade:** **Baixa** — *Justificativa:* Em ambiente clínico controlado de rede interna, a redefinição de credenciais de operadores, estoquistas e médicos pode ser efetuada diretamente pelo administrador via módulo restrito de [Usuários](/usuarios) (`PUT /usuarios/:id`).
- **Tratamento no Frontend (fato verificado no repositório):**
  - Ao clicar no link `"Esqueceu a senha?"`, a interface emite um toast informativo orientando o colaborador a contatar o Suporte de TI ou o Administrador da Clínica.

---

### 3.3. Paginação Server-Side no Catálogo de Exames e Vínculos (`/exames`, `/exame-insumos`)

- **Item faltante:** Paginação padronizada (`page`, `limit`) e busca por texto em `GET /exames` e `GET /exame-insumos`.
- **Telas dependentes:** [Exames](/exames) (`Exames.tsx`) e telas auxiliares.
- **Prioridade:** **Baixa** — *Justificativa:* O catálogo de procedimentos e protocolos de exames em clínicas de pequeno e médio porte possui crescimento lento e volume raramente superior a centenas de registros.
- **Situação no Contrato da API (fato verificado em `docs/API_CONTRACT.md`):**
  - Seção 3.4 (linha 339) e Seção 3.5: retornam arrays simples com todos os registros ativos sem envelope paginado.

---

### 3.4. Consulta de Saldo de Insumo Individual (`GET /estoque/saldo/:insumoId`)

- **Item faltante:** Endpoint de leitura rápida de saldo para um insumo individual.
- **Prioridade:** **Baixa** — *Justificativa:* A rota consolidada `GET /estoque/saldo` atende todas as listagens e o frontend faz a indexação em memória via chave-valor `saldosMap[insumoId]`.
- **Situação no Contrato da API (fato verificado em `docs/API_CONTRACT.md`):**
  - Seção 3.7 (linhas 541–570) e Seção 4, item 6 (linhas 911–912): `GET /estoque/saldo` calcula e retorna a lista de todos os insumos ativos. Não há rota singular `/estoque/saldo/:insumoId`.
