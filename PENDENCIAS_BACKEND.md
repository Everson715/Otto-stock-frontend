# Pendências do Backend (Gaps e Oportunidades Identificadas)

Este documento registra as discrepâncias e ausências de endpoints ou campos entre as necessidades da interface de usuário (`otto-stock-web`) e a especificação formal do backend ([`docs/API_CONTRACT.md`](docs/API_CONTRACT.md)), conforme estipulado na **Regra 2** de governança do projeto.

> **Convenção deste documento:**
> - **Fato verificado no repositório:** comportamento confirmado diretamente no código-fonte de `otto-stock-web` e em [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md).
> - **Sugestão a validar no repositório do backend:** trechos de schema Prisma, DTOs, índices e contratos propostos (dado que o código-fonte do backend não reside neste repositório).

---

## 1. Módulo Médicos (`/medicos`)

- **Item faltante:** Campo `especialidade` no modelo `Medico`.
- **Tela dependente:** [Médicos](/medicos) (`otto-stock-web/src/pages/Medicos.tsx`) e listagens onde o médico é exibido em [Atendimentos](/atendimentos) (`otto-stock-web/src/pages/Atendimentos.tsx`) e [Dashboard](/) (`otto-stock-web/src/pages/Home.tsx`).
- **Prioridade:** **Baixa** — *Justificativa:* Funcionalidade complementar de catálogo clínico; a ausência não bloqueia a abertura ou finalização de atendimentos nem a baixa de estoque.
- **Dependências:** Nenhuma pendência bloqueante (pode ser implementada de forma independente, mantendo o campo opcional).
- **Situação no Contrato da API (fato verificado em `docs/API_CONTRACT.md`):**
  - Na Seção 3.6 (linhas 338–379), `POST /medicos` (linhas 341–360), `GET /medicos` (linhas 362–365), `GET /medicos/:id` (linhas 367–369) e `PUT /medicos/:id` (linhas 371–374) aceitam e retornam apenas `id`, `nome`, `crm` e `ativo`.
  - Na Seção 3.8, `GET /atendimentos` (linhas 535–585) retorna o objeto `medico` aninhado contendo apenas `id`, `nome`, `crm` e `ativo` (linhas 565–570), e `GET /atendimentos/:id` (linhas 587–589) retorna o atendimento com detalhes de médico e exame.
- **Proposta mínima para o Backend (sugestão a validar no repositório do backend):**
  - **Modelagem Prisma:** Adicionar `especialidade String? @db.VarChar(80)` no modelo `Medico`. Opta-se por `String?` livre (e não `enum`) porque existem mais de 55 especialidades médicas reconhecidas e variações operacionais; um `enum` no banco exigiria *migration* (`ALTER TYPE`) a cada nova especialidade incluída pela clínica.
  - **Migration e retrocompatibilidade:** A migration deve adicionar a coluna como `NULLABLE` sem valor default forçado, preservando os registros existentes com `especialidade = null` sem perda de dados.
  - **Validação (DTO):** Aplicar `.trim()`, aceitar entre 2 e 80 caracteres quando informado, e converter string vazia (`""`) para `null`.
  - **Rotas afetadas:** Incluir `especialidade` nos payloads de entrada/saída de `POST /medicos`, `PUT /medicos/:id`, `GET /medicos`, `GET /medicos/:id` e no objeto `medico` aninhado retornado por `GET /atendimentos` e `GET /atendimentos/:id`.
  - **Trecho de referência (sugestão a validar no repositório do backend — trecho parcial, omite relações e campos como createdAt; não copiar e colar):**
    ```prisma
    model Medico {
      id            Int           @id @default(autoincrement())
      nome          String        @db.VarChar(120)
      crm           String?       @unique @db.VarChar(20)
      especialidade String?       @db.VarChar(80)
      ativo         Boolean       @default(true)
      atendimentos  Atendimento[]

      @@index([ativo, nome])
      @@index([especialidade])
    }
    ```
- **Tratamento no Frontend (fato verificado no repositório):**
  - **Ainda não implementado.**
  - No tipo `Medico` e no schema Zod `medicoSchema` (`otto-stock-web/src/types/medico.ts`, linhas 3–15), existem apenas os campos `id`, `nome`, `crm` e `ativo`.
  - Na tela `otto-stock-web/src/pages/Medicos.tsx`, as colunas da tabela (linhas 149–211), o modal de cadastro/edição (linhas 314–352) e o modal de detalhes (linhas 355–395) operam exclusivamente com `id`, `nome`, `crm` e `ativo`. Não há campo ou aviso de `especialidade` na interface atual.
- **Critérios de Aceite:**
  - [ ] Migration adiciona a coluna `especialidade VARCHAR(80) NULL` na tabela de médicos sem afetar registros existentes (`null`).
  - [ ] `POST /medicos` e `PUT /medicos/:id` aplicam `trim`, validam tamanho (2 a 80 caracteres) e convertem `""` em `null`.
  - [ ] `GET /medicos`, `GET /medicos/:id`, `GET /atendimentos` e `GET /atendimentos/:id` passam a incluir `"especialidade": string | null` no objeto do médico.
  - [ ] Frontend exibe `"—"` quando `especialidade` for `null` ou ausente, sem quebrar formulários ou tabelas.

---

## 2. Módulo Insumos e Saldo de Estoque (`/insumos`, `/estoque/saldo`)

- **Item faltante:** Unidade de medida do insumo (`unidade`).
- **Tela dependente:** [Insumos](/insumos) (`otto-stock-web/src/pages/Insumos.tsx`), [Saldo Consolidado](/estoque/saldo) (`otto-stock-web/src/pages/EstoqueSaldo.tsx`), [Dashboard / Início](/) (`otto-stock-web/src/pages/Home.tsx`) e [Atendimentos](/atendimentos) (`otto-stock-web/src/pages/Atendimentos.tsx`).
- **Prioridade:** **Alta** — *Justificativa:* Impacto direto na segurança operacional e clínica do controle de estoque; quantidades numéricas sem unidade induzem erros de contagem física, entrada e baixa de reagentes/materiais.
- **Dependências:** Nenhuma pendência bloqueante de código, mas exige revisão manual posterior dos insumos legados migrados como `NAO_INFORMADA`.
- **Situação no Contrato da API (fato verificado em `docs/API_CONTRACT.md`):**
  - Na Seção 3.3, `POST /insumos` (linhas 177–197), `GET /insumos` (linhas 199–222), `GET /insumos/:id` (linhas 224–226) e `PUT /insumos/:id` (linhas 228–237) possuem apenas `id`, `nome`, `quantidadeMinima`, `ativo` e `createdAt`.
  - Na Seção 3.5, `GET /exame-insumos` (linhas 314–316) e `GET /exame-insumos/exame/:exameId` (linhas 318–320) retornam o objeto `insumo` aninhado sem unidade.
  - Na Seção 3.7, `GET /estoque/saldo` (linhas 443–464) retorna `id`, `nome`, `saldo`, `quantidadeMinima` e `alerta`, e `GET /estoque/movimentacoes` (linhas 466–505) retorna o objeto `insumo` aninhado (linhas 487–493) sem unidade.
  - A Seção 4, item 3 (linha 662), confirma explicitamente: *"O modelo `Insumo` não possui o campo `unidade`"*.
- **Proposta mínima para o Backend (sugestão a validar no repositório do backend):**
  - **Modelagem Prisma:** Criar o enum `UnidadeMedida` com os valores logísticos padronizados (`UN`, `CX`, `AMPOLA`, `FRASCO`, `ML`, `PAR`, `PACOTE`, `ROLO`, `KIT`) mais o valor explícito `NAO_INFORMADA` exclusivo para transição de dados legados.
  - **Proibição de default silencioso (`UN`) e edição manual da Migration:** **Não** utilizar `@default(UN)` no Prisma nem `.default('UN')` no DTO, pois isso classificaria insumos legados (como reagentes em `ML` ou caixas `CX`) como unidades avulsas sem conferência. Como o schema Prisma final declara `unidade UnidadeMedida` obrigatório (`NOT NULL`) e sem default, a migration gerada automaticamente pelo Prisma falhará em uma tabela que já contenha linhas existentes e **deve ser editada à mão** (`prisma migrate dev --create-only`): adicionar a coluna com `DEFAULT 'NAO_INFORMADA'`, preencher os registros legados e remover o default em seguida (`ALTER TABLE ... ALTER COLUMN "unidade" DROP DEFAULT`), mantendo a coluna `NOT NULL` e sem default no schema final.
  - **Validação (DTO):** Em novos cadastros (`POST /insumos`), `unidade` deve ser **obrigatória** e restrita aos valores válidos de negócio (rejeitando `NAO_INFORMADA` na criação de novos itens com `400 Bad Request`). Em `PUT /insumos/:id`, permitir atualizar a unidade para qualquer valor válido de negócio.
  - **Rotas afetadas:** Expor a propriedade `unidade` em `GET /insumos`, `GET /insumos/:id`, `POST /insumos`, `PUT /insumos/:id`, `GET /estoque/saldo`, no objeto `insumo` aninhado de `GET /estoque/movimentacoes` e no objeto `insumo` aninhado de `GET /exame-insumos` e `GET /exame-insumos/exame/:exameId`.
  - **Trecho de referência (sugestão a validar no repositório do backend — trecho parcial, omite relações e campos como createdAt; não copiar e colar):**
    ```prisma
    enum UnidadeMedida {
      UN
      CX
      AMPOLA
      FRASCO
      ML
      PAR
      PACOTE
      ROLO
      KIT
      NAO_INFORMADA
    }

    model Insumo {
      id               Int           @id @default(autoincrement())
      nome             String        @unique @db.VarChar(120)
      unidade          UnidadeMedida
      quantidadeMinima Int           @default(0)
      ativo            Boolean       @default(true)
      createdAt        DateTime      @default(now())
    }
    ```
- **Tratamento no Frontend (fato verificado no repositório):**
  - **Ainda não implementado.**
  - Em `otto-stock-web/src/types/insumo.ts` (linhas 13–20) e `otto-stock-web/src/types/estoqueSaldo.ts` (linhas 1–7), as interfaces `Insumo` e `EstoqueSaldoItem` não possuem o campo `unidade`.
  - Nem `otto-stock-web/src/pages/Insumos.tsx` (colunas da tabela nas linhas 339–475; formulário do Drawer nas linhas 659–754) nem `otto-stock-web/src/pages/EstoqueSaldo.tsx` (colunas da tabela nas linhas 252–347) exibem coluna, badge ou tooltip de unidade de medida.
  - **Diretriz obrigatória para implementação futura no Frontend:** É **proibido** exibir `"un"` como fallback padrão. Quando `unidade` for nula, ausente ou `NAO_INFORMADA`, a interface deve exibir exclusivamente `"—"` com tooltip `"Unidade não cadastrada"`.
- **Critérios de Aceite:**
  - [ ] Migration editada manualmente adiciona a coluna `unidade` com `DEFAULT 'NAO_INFORMADA'`, preenche os registros legados e remove o default em seguida, mantendo a coluna `NOT NULL` e sem default no schema final (sem usar `UN` como default automático).
  - [ ] `POST /insumos` exige o envio explícito de `unidade` válida (rejeitando ausência ou `NAO_INFORMADA` com `400 Bad Request`).
  - [ ] `GET /insumos`, `GET /insumos/:id`, `GET /estoque/saldo`, `GET /estoque/movimentacoes`, `GET /exame-insumos` e `GET /exame-insumos/exame/:exameId` retornam o campo `unidade`.
  - [ ] Frontend exibe `"—"` com tooltip `"Unidade não cadastrada"` para itens com `unidade` ausente, nula ou `NAO_INFORMADA`, nunca exibindo `"un"` por inferência.

---

## 3. Módulo Dashboard (`/relatorios`)

- **Item faltante:** Endpoint de agregação temporal de movimentações (`GET /relatorios/movimentacoes-grafico`).
- **Tela dependente:** [Dashboard / Início](/) (`otto-stock-web/src/pages/Home.tsx`).
- **Prioridade:** **Média** — *Justificativa:* Agrega visibilidade analítica e histórica ao gestor/estoquista, mas o painel operacional já funciona com alertas de estoque crítico, atendimentos em aberto e extrato das 5 últimas movimentações.
- **Dependências:** Relacionada conceitualmente à Seção 2 (`unidade`), motivo pelo qual o payload deve separar quantidade de itens e total de operações.
- **Situação no Contrato da API (fato verificado em `docs/API_CONTRACT.md`):**
  - Na Seção 3.9 (linhas 621–646), existe apenas a rota `GET /relatorios/dashboard`, que retorna `{ totalAtendimentos, estoqueCritico, examesMaisRealizados }`. Não há rota de série histórica temporal de movimentações.
  - Na Seção 3.7 (linhas 385–441), as movimentações de estoque possuem três tipos: `ENTRADA` (`POST /estoque/entrada`, linha 402), `SAIDA` (`POST /estoque/saida`, linha 421) e `AJUSTE` (`POST /estoque/ajuste`, linhas 430–441, onde `quantidade` pode ser positiva ou negativa).
- **Proposta mínima para o Backend (sugestão a validar no repositório do backend):**
  - **Rota e Parâmetros:** Criar `GET /relatorios/movimentacoes-grafico?dias=7`.
    - `dias`: inteiro opcional entre `1` e `90` (default `7`). Valores fora do intervalo `[1, 90]` ou não inteiros devem retornar `400 Bad Request`.
  - **Fuso horário fixo no servidor:** Agrupar as datas utilizando fuso horário fixo configurado no servidor (`America/Sao_Paulo`), sem aceitar parâmetro `tz` do cliente, evitando discrepâncias de corte diário entre 21h00 e 23h59 BRT.
  - **Zero-filling:** Retornar sempre exatamente `N` dias contínuos ordenados cronologicamente (`YYYY-MM-DD`), preenchendo com `0` os dias que não tiveram movimentação.
  - **Tratamento de `AJUSTE` e grandezas heterogêneas:** Contemplar o tipo `AJUSTE` (líquido de ajustes positivos e negativos) e retornar tanto a soma de quantidades quanto o número de operações (`totalOperacoes`), evitando que a soma bruta de unidades heterogêneas (`ml`, `cx`, `un`) seja interpretada como uma única grandeza física.
  - **Exemplo de resposta (`200 OK` — sugestão a validar no repositório do backend):**
    ```json
    [
      {
        "data": "2026-10-11",
        "entradasQtd": 120,
        "saidasQtd": 45,
        "ajustesLiquidoQtd": 0,
        "totalOperacoes": 6
      },
      {
        "data": "2026-10-12",
        "entradasQtd": 0,
        "saidasQtd": 0,
        "ajustesLiquidoQtd": -2,
        "totalOperacoes": 1
      }
    ]
    ```
  - **Controle de Acesso (RBAC):** Permitir apenas `ADMIN`, `ESTOQUISTA` e `GESTOR`, bloqueando o perfil `ATENDENTE` com `403 Forbidden` — alinhado à matriz de permissões do frontend (fato verificado em `auth.ts`, `otto-stock-web/src/types/auth.ts`, linhas 29–30, onde `/estoque/saldo` e `/estoque/movimentacoes` permitem apenas `['ADMIN', 'ESTOQUISTA', 'GESTOR']`); a regra real do backend deve ser confirmada no middleware de autorização do backend.
  - **Índice de banco de dados (sugestão a validar no repositório do backend):** Criar índice composto `@@index([createdAt, tipo])` no modelo `MovimentacaoEstoque` para evitar *Full Table Scan* nas agregações por janela temporal.
- **Tratamento no Frontend (fato verificado no repositório):**
  - Em `otto-stock-web/src/pages/Home.tsx`, o Dashboard exibe os 4 cartões de KPI (linhas 554–664), a tabela de Alertas de Estoque Crítico (linhas 668–702), o ranking de Exames & Consumo cruzado com `/exames`, `/exame-insumos` e `/insumos` (linhas 704–794), a tabela de Atendimentos em Aberto (linhas 799–840) e a lista das Últimas Movimentações via `GET /estoque/movimentacoes?limit=5` (linhas 244–245 e 843–927).
  - **Ainda não implementado:** Não existe atualmente em `Home.tsx` qualquer card, placeholder ou aviso visual indicando que o gráfico histórico agregado de movimentações está pendente do backend. Deve ser registrado e adicionado na UI um estado informativo/aviso até que o endpoint seja disponibilizado.
- **Critérios de Aceite:**
  - [ ] `GET /relatorios/movimentacoes-grafico?dias=7` retorna array com exatamente `dias` posições contínuas (*zero-filling*) no fuso `America/Sao_Paulo`.
  - [ ] Parâmetro `dias` fora do intervalo `1..90` retorna `400 Bad Request`.
  - [ ] O payload inclui `data`, `entradasQtd`, `saidasQtd`, `ajustesLiquidoQtd` e `totalOperacoes`.
  - [ ] Requisições com token de perfil `ATENDENTE` recebem `403 Forbidden` (confirmado no middleware de autorização do backend).
  - [ ] Índice composto `(createdAt, tipo)` adicionado em `MovimentacaoEstoque`.

---

## 4. Paginação e Busca nos Módulos Pacientes e Médicos (`/pacientes`, `/medicos`)

- **Item faltante:** Paginação server-side (`page`, `limit`) e busca textual (`search`) nas rotas `GET /pacientes` e `GET /medicos`, além de adequação de privacidade (LGPD) na exposição de CPF.
- **Telas dependentes:** [Pacientes](/pacientes) (`otto-stock-web/src/pages/Pacientes.tsx`), [Médicos](/medicos) (`otto-stock-web/src/pages/Medicos.tsx`) e [Atendimentos](/atendimentos) (`otto-stock-web/src/pages/Atendimentos.tsx`).
- **Prioridade:** **Alta** — *Justificativa:* Envolve mitigação de risco de quebra (*breaking change*) nos seletores de atendimento e adequação à LGPD (exposição integral da base de CPFs sem paginação e sem máscara na listagem de pacientes).
- **Dependências:** **A ativação da paginação como padrão no backend depende obrigatoriamente da migração prévia do frontend** (`Pacientes.tsx`, `Medicos.tsx` e os `<Select>` do modal de Novo Atendimento em `Atendimentos.tsx`).
- **Situação no Contrato da API (fato verificado em `docs/API_CONTRACT.md`):**
  - `GET /pacientes` (linhas 140–156) e `GET /medicos` (linhas 362–365) não aceitam query parameters e retornam um array JSON simples com todos os registros ativos.
  - A Seção 4, itens 1 e 4 (linhas 652–655 e 664–665), confirma que `/insumos`, `/estoque/movimentacoes` e `/atendimentos` usam `{ items, total, page, limit, totalPages }`, enquanto `/pacientes` e `/medicos` retornam arrays completos sem filtro server-side.
- **Proposta mínima para o Backend (sugestão a validar no repositório do backend):**
  - **Formato paginado e regra de ativação do envelope:** Adotar o envelope `{ items, total, page, limit, totalPages }`, com `page >= 1` (default `1`) e `limit` entre `1` e `100` (default `10`). A presença de **qualquer um** entre `page`, `limit` ou `search` na query string ativa o envelope `{ items, total, page, limit, totalPages }`; sem nenhum dos três, o endpoint mantém o array legado durante a transição.
  - **Busca (`search` case-insensitive):**
    - Em `GET /pacientes`: buscar por `nome` parcial (`ILIKE` / `mode: 'insensitive'`) ou por `cpf` (removendo máscara/pontuação do termo pesquisado).
    - Em `GET /medicos`: buscar por `nome` parcial, `crm` ou `especialidade`.
  - **Ordenação (`sortBy`/`sortOrder`):** Tratada como melhoria opcional, fora da proposta mínima (manter ordenação padrão alfabética por `nome ASC`, conforme linha 141 do `API_CONTRACT.md`).
  - **Alerta de Breaking Change e Estratégia de Transição Obrigatória:**
    - **Fato verificado no código:** Hoje, `Pacientes.tsx` (linhas 55–56), `Medicos.tsx` (linhas 57–58) e `Atendimentos.tsx` (linhas 159–160 e 180–185) chamam `api.get('/pacientes')` e `api.get('/medicos')` **sem enviar `page`, `limit` ou `search`** e extraem `Array.isArray(res.data) ? res.data : res.data?.items || []`. Caso o backend passe a retornar `{ items }` paginado com `limit=10` por padrão imediatamente, essas telas e os componentes `<Select>` do modal de Novo Atendimento (`Atendimentos.tsx`, linhas 802–826) serão silenciosamente truncados nos 10 primeiros registros.
    - **Ordem obrigatória de execução:**
      1. **Passo 1 (Backend retrocompatível):** A presença de **qualquer um** entre `page`, `limit` ou `search` na query string ativa o envelope paginado `{ items, total, page, limit, totalPages }`; sem nenhum dos três, o backend mantém temporariamente o retorno no array legado durante a transição.
      2. **Passo 2 (Frontend):** Migrar `Pacientes.tsx` e `Medicos.tsx` para paginação e busca server-side, e converter os `<Select>` de paciente e médico em `Atendimentos.tsx` (linhas 722–731 e 802–826) para busca assíncrona (`?search=&limit=20`).
      3. **Passo 3 (Backend definitivo):** Somente após a entrega do Passo 2 o backend pode tornar o envelope paginado (`limit=10`) o comportamento padrão mesmo quando `page`, `limit` e `search` forem omitidos.
  - **LGPD e Privacidade de Dados:**
    - **Fato verificado no código e contrato:** `GET /pacientes` (`docs/API_CONTRACT.md`, linhas 140–156) retorna toda a base ativa de pacientes com `cpf`, `dataNascimento` e `contato`. No frontend, enquanto `Home.tsx` (linha 451) e `Atendimentos.tsx` (linhas 443 e 807) utilizam o utilitário `mascararCpf`, a listagem principal de `Pacientes.tsx` (linhas 175–180) exibe `{p.cpf}` em texto aberto sem máscara (assim como o modal de detalhes na linha 377).
    - **Recomendação:** Paginar obrigatoriamente `GET /pacientes` no servidor para evitar a transferência integral da base de CPFs em cada abertura de tela, e aplicar `mascararCpf(p.cpf)` na coluna de CPF da tabela de `Pacientes.tsx` (linhas 175–180), mantendo a visualização do CPF completo restrita aos modais de detalhes e edição.
- **Tratamento no Frontend (fato verificado no repositório):**
  - `Pacientes.tsx` (linhas 55–81) e `Medicos.tsx` (linhas 57–83) carregam todos os registros em memória via `GET /pacientes` e `GET /medicos` sem parâmetros, filtram localmente via `useMemo` e paginam client-side com `pageSize = 8` (linha 33 de `Pacientes.tsx` e linha 35 de `Medicos.tsx`).
  - `Atendimentos.tsx` (linhas 159–160, 317–325 e 795–826) carrega todos os pacientes e médicos em memória para popular os `<Select>` de filtro e de abertura de atendimento, com filtro textual local (`buscaPacienteModal`) apenas para pacientes.
- **Critérios de Aceite:**
  - [ ] Fase 1: `GET /pacientes` e `GET /medicos` retornam o envelope `{ items, total, page, limit, totalPages }` quando **qualquer um** entre `page`, `limit` (`1..100`, default `10`) ou `search` é informado, mantendo o array legado quando nenhum dos três é enviado durante a transição.
  - [ ] Parâmetro `search` filtra *case-insensitive* por nome ou CPF (ignorando pontuação) em `/pacientes` e por nome, CRM ou especialidade em `/medicos`.
  - [ ] Fase 2: `Pacientes.tsx`, `Medicos.tsx` e os seletores de `Atendimentos.tsx` consomem os parâmetros paginados (`page`, `limit`, `search`) sem truncar registros além dos 10 primeiros.
  - [ ] Coluna de CPF na listagem de `Pacientes.tsx` exibe o CPF mascarado (`mascararCpf`), revelando o valor integral apenas nos modais de detalhes e edição.

---

## 5. Lacunas Adicionais Listadas no `API_CONTRACT.md` (Insumos Inativos e Over-fetching no Dashboard)

### 5.1. Filtro de Status (`?ativo=`) em `GET /insumos`

- **Item faltante:** Parâmetro de consulta `ativo` (`true` | `false` | `all`) na rota `GET /insumos`.
- **Tela dependente:** [Insumos](/insumos) (`otto-stock-web/src/pages/Insumos.tsx`).
- **Prioridade:** **Média** — *Justificativa:* Existe um filtro visual implementado na interface (`"Inativos"` / `"Todos"`) que hoje não retorna registros inativos devido à restrição da API.
- **Dependências:** Nenhuma.
- **Situação no Contrato da API (fato verificado em `docs/API_CONTRACT.md`):**
  - Na Seção 3.3 (linhas 199–205), `GET /insumos` documenta: *"Lista insumos ativos com paginação e filtro por nome"*, aceitando apenas os query parameters `page`, `limit` e `nome`. Insumos desativados via `DELETE /insumos/:id` (`ativo = false`, linha 240) nunca são retornados por `GET /insumos`.
- **Proposta mínima para o Backend (sugestão a validar no repositório do backend):**
  - Adicionar o query parameter opcional `ativo` (`"true"` | `"false"` | `"all"`, default `"true"` para manter retrocompatibilidade) em `GET /insumos`.
- **Tratamento no Frontend (fato verificado no repositório):**
  - Em `otto-stock-web/src/pages/Insumos.tsx`, o estado `statusFilter` (`'ativos' | 'inativos' | 'todos'`, linha 70) e os botões de filtro (`"Todos os Ativos"`, `"Inativos"`, `"Todos"`, linhas 565–590) filtram o array em memória verificando `i.ativo !== false` (linhas 209–212). Contudo, como `carregarCatalogo` chama `api.get('/insumos', { params: { page: 1, limit: 200 } })` (linha 122) e o backend retorna apenas insumos ativos, a aba `"Inativos"` permanece sempre vazia.
- **Critérios de Aceite:**
  - [ ] `GET /insumos` aceita `?ativo=true|false|all` (com default `true` quando omitido).
  - [ ] Ao selecionar `"Inativos"` ou `"Todos"` em `Insumos.tsx`, o frontend envia o parâmetro correspondente (ou carrega os itens conforme o filtro) e exibe corretamente os insumos desativados.

### 5.2. Enriquecimento de `GET /relatorios/dashboard` (Redução de Over-fetching)

- **Item faltante:** Nome do exame em `examesMaisRealizados` e contadores agregados de atendimentos (`emAtendimento`, `finalizados`, `cancelados`, `finalizadosHoje` e `protocolosDistintosHoje`) em `GET /relatorios/dashboard`.
- **Tela dependente:** [Dashboard / Início](/) (`otto-stock-web/src/pages/Home.tsx`).
- **Prioridade:** **Média** — *Justificativa:* Além de eliminar chamadas redundantes de contagem no carregamento do painel, corrige um risco real de truncamento silencioso nos indicadores diários caso a clínica ultrapasse 100 atendimentos finalizados no mesmo dia.
- **Dependências:** Nenhuma.
- **Situação no Contrato da API (fato verificado em `docs/API_CONTRACT.md`):**
  - Na Seção 3.9 (linhas 624–646), `GET /relatorios/dashboard` retorna apenas `totalAtendimentos` (inteiro único sem separação por status), `estoqueCritico` e `examesMaisRealizados` contendo somente `{ exameId, _count: { id } }`.
  - A Seção 4, item 5 (linhas 667–668), registra explicitamente: *"O endpoint `GET /relatorios/dashboard` retorna na lista `examesMaisRealizados` apenas `{ exameId: number, _count: { id: number } }`. Para exibir o nome do exame no gráfico/ranking, o frontend deve cruzar o `exameId` com a lista obtida em `GET /exames`"*.
- **Proposta mínima para o Backend (sugestão a validar no repositório do backend):**
  - Incluir o `nome` do exame em cada item de `examesMaisRealizados` (`{ exameId, nome, _count: { id } }`) e retornar um objeto `atendimentosPorStatus: { emAtendimento, finalizados, cancelados, finalizadosHoje, protocolosDistintosHoje }` no payload de `GET /relatorios/dashboard`.
- **Tratamento no Frontend (fato verificado no repositório):**
  - Em `otto-stock-web/src/pages/Home.tsx` (`carregarDashboard`, linhas 140–266), o componente dispara até **9 requisições HTTP** a cada atualização do painel (para perfis como `ADMIN` e `GESTOR`, que possuem `canReadAtendimentos` e `canReadSaldo` verdadeiros conforme `otto-stock-web/src/types/auth.ts`, linhas 24 e 29):
    1. `GET /relatorios/dashboard` (linha 143);
    2. `GET /exames` (linha 161) — para mapear `exameId -> nome` (linhas 188–195, usado no ranking na linha 737 e como fallback na tabela e no modal nas linhas 461 e 1017);
    3. `GET /exame-insumos` (linha 162) — para exibir a ficha técnica no ranking e no modal de finalização (linhas 206–216, 497–500, 743–787 e 1027–1053);
    4. `GET /insumos?limit=200` (linhas 163–164) — para mapear `insumoId -> nome` na ficha técnica e no modal de finalização (linhas 197–204, 780 e 1036);
    5. `GET /atendimentos?status=EM_ATENDIMENTO&limit=6` (linhas 166–169) — para a tabela de abertos e o contador `totalEmAtendimentoCount` (linhas 218–224);
    6. `GET /atendimentos?status=FINALIZADO&limit=1` (linhas 171–174) — exclusivamente para ler `resFinalizadosTotal.data?.total` e deduzir o total de finalizados e cancelados (linhas 226–230 e 581–601);
    7. `GET /atendimentos?status=FINALIZADO&startDate=...&endDate=...&limit=100` (linhas 176–185) — para calcular os exames finalizados hoje e protocolos distintos no dia (linhas 232–237 e 296–304);
    8. `GET /estoque/saldo` (linha 243) — para calcular itens críticos e em conformidade (linhas 249–252 e 273–293);
    9. `GET /estoque/movimentacoes?limit=5` (linhas 244–245) — para o card de últimas movimentações (linhas 254–257).
  - **Risco de truncamento verificado no código (fato verificado em `Home.tsx`):** A chamada nº 7 (`GET /atendimentos?status=FINALIZADO&startDate=...&endDate=...&limit=100`, linhas 176–185) busca apenas a primeira página com limite fixo de 100 registros e não possui paginação complementar nem utiliza `resFinalizadosHoje.data?.total`. O estado `finalizadosHojeList` armazena apenas `resFinalizadosHoje.data?.items` (linhas 232–237) e o hook `metricasExamesHoje` (linhas 296–304) calcula `totalHoje: finalizadosHojeList.length` e `protocolosDistintos: new Set(finalizadosHojeList.map((a) => a.exameId)).size` (exibidos no card "Exames Realizados Hoje", linhas 638–652). Portanto, se houver mais de 100 atendimentos finalizados no mesmo dia, o contador de finalizados do dia ficará travado em 100 e o número de protocolos distintos será subestimado por considerar apenas os 100 primeiros registros.
  - **Escopo exato de eliminação de chamadas:** O enriquecimento de `GET /relatorios/dashboard` elimina **apenas as chamadas 6 e 7**. As chamadas a `/exames` (2), `/exame-insumos` (3) e `/insumos` (4) continuam necessárias em `Home.tsx` para compor a ficha técnica exibida no card "Exames & Consumo" (linhas 743–787) e a lista de insumos a baixar no modal de confirmação de finalização (linhas 497–500 e 1027–1053).
- **Critérios de Aceite:**
  - [ ] `GET /relatorios/dashboard` inclui `nome` em cada item de `examesMaisRealizados` e o objeto `atendimentosPorStatus` com `emAtendimento`, `finalizados`, `cancelados`, `finalizadosHoje` e `protocolosDistintosHoje`.
  - [ ] `Home.tsx` passa a consumir os contadores diretamente de `GET /relatorios/dashboard`, eliminando as chamadas 6 (`GET /atendimentos?status=FINALIZADO&limit=1`) e 7 (`GET /atendimentos?status=FINALIZADO&startDate=...&limit=100`) e mantendo as chamadas a `/exames`, `/exame-insumos` e `/insumos` para a ficha técnica e o modal de finalização.

---

## 6. Módulo Autenticação (`/auth`)

### 6.1. Duração Estendida da Sessão ("Manter conectado por 12 horas") em `POST /auth/login`

- **Item faltante:** Suporte ao parâmetro booleano opcional `manterConectado` (ou `rememberMe`) em `POST /auth/login` para emissão de token JWT com expiração de `12h` (ou estratégia de *refresh token*), visto que atualmente o token possui validade fixa de `8h`.
- **Tela dependente:** [Login](/login) (`otto-stock-web/src/pages/Login.tsx` e `otto-stock-web/src/components/LoginForm.tsx`).
- **Prioridade:** **Baixa** — *Justificativa:* O fluxo de autenticação e os interceptors de sessão funcionam normalmente com a validade atual de 8 horas definida no backend.
- **Dependências:** Nenhuma.
- **Situação no Contrato da API (fato verificado em `docs/API_CONTRACT.md`):**
  - Na Seção 2.3, `POST /auth/login` recebe exclusivamente `{ email, senha }`.
  - Na Seção 2.4, a validade do token JWT é documentada como fixa em `8 horas` (`expiresIn: "8h"`).
- **Proposta mínima para o Backend (sugestão a validar no repositório do backend):**
  - Aceitar o campo opcional `manterConectado?: boolean` no payload de `POST /auth/login` e ajustar `expiresIn` para `"12h"` quando `manterConectado === true` (mantendo `"8h"` como padrão).
- **Tratamento no Frontend (fato verificado no repositório):**
  - Em `otto-stock-web/src/components/LoginForm.tsx`, o checkbox `"Manter conectado por 12 horas"` faz parte do formulário de login, mas `AuthContext.login(email, senha)` envia apenas `{ email, senha }` conforme o contrato atual de `POST /auth/login`, sem simular expiração falsa no cliente.

### 6.2. Fluxo de Recuperação de Senha ("Esqueceu a senha?")

- **Item faltante:** Endpoints de solicitação e redefinição de senha (ex.: `POST /auth/forgot-password` e `POST /auth/reset-password`) ou abertura de chamado de redefinição para o administrador.
- **Tela dependente:** [Login](/login) (`otto-stock-web/src/components/LoginForm.tsx`).
- **Prioridade:** **Baixa** — *Justificativa:* Em ambiente clínico controlado, a gestão de credenciais e redefinição de senhas pode ser realizada diretamente pelo perfil `ADMIN` via `PUT /usuarios/:id` na tela de [Usuários](/usuarios) (`otto-stock-web/src/pages/Usuarios.tsx`).
- **Tratamento no Frontend (fato verificado no repositório):**
  - Ao acionar `"Esqueceu a senha?"` em `LoginForm.tsx`, a interface exibe um *toast* informativo (`Sonner`) orientando o colaborador a contatar o Suporte de TI ou o Administrador da Clínica, sem expor telas ou rotas inexistentes.

