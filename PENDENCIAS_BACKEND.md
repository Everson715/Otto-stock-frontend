# Pendências do Backend (Gaps e Oportunidades Identificadas)

Este documento registra as discrepâncias e ausências de endpoints ou campos entre as necessidades da interface de usuário e a especificação formal do backend (**API_CONTRACT.md**), conforme estipulado na **Regra 2** de governança do projeto.

---

## 1. Módulo Médicos (`/medicos`)

- **Item faltante:** Campo `especialidade` no modelo de médico.
- **Tela dependente:** [Médicos](/medicos).
- **Situação no Contrato da API:** A rota `POST /medicos` e `GET /medicos` aceita e retorna apenas `id`, `nome`, `crm` e `ativo`. Não há campo de especialidade médica.
- **Proposta mínima para o Backend:**
  - Adicionar a coluna `especialidade String?` no modelo `Medico` (Prisma/DB).
  - Incluir `especialidade` nos DTOs de validação e nos retornos de `POST /medicos`, `PUT /medicos/:id` e `GET /medicos`.
- **Tratamento no Frontend:**
  - O campo é sinalizado na interface como indisponível/não persistido no backend no momento, não quebrando a requisição de cadastro/edição.

---

## 2. Módulo Insumos e Saldo de Estoque (`/insumos`, `/estoque/saldo`)

- **Item faltante:** Unidade de medida do insumo (ex.: `un`, `cx`, `ampola`, `ml`, `frasco`).
- **Tela dependente:** [Saldo Consolidado](/estoque/saldo) e [Insumos](/insumos).
- **Situação no Contrato da API:** O modelo `Insumo` possui apenas `id`, `nome`, `quantidadeMinima`, `ativo` e `createdAt`. A rota `GET /estoque/saldo` retorna `id`, `nome`, `saldo`, `quantidadeMinima` e `alerta`.
- **Proposta mínima para o Backend:**
  - Adicionar a coluna `unidade String?` (ou enum de unidades) no modelo `Insumo`.
  - Expor a propriedade `unidade` no payload de `GET /estoque/saldo` e nas rotas de insumos.
- **Tratamento no Frontend:**
  - Exibição de valor indicativo padrão (`un`) ou traço (`-`) na coluna de unidade, com tooltip informativo.

---

## 3. Módulo Dashboard (`/relatorios`)

- **Item faltante:** Endpoint de agregação temporal de movimentações para geração de gráfico histórico.
- **Tela dependente:** [Dashboard / Início](/) (`Home.tsx`).
- **Situação no Contrato da API:** A rota `GET /relatorios/dashboard` consolida apenas `totalAtendimentos`, `estoqueCritico` e `examesMaisRealizados`. Não há endpoint retornando série histórica temporal (ex.: movimentações por dia nos últimos 7 ou 30 dias).
- **Proposta mínima para o Backend:**
  - Criar o endpoint `GET /relatorios/movimentacoes-grafico?dias=7` retornando:
    ```json
    [
      { "data": "2026-10-10", "entradas": 120, "saidas": 45 },
      { "data": "2026-10-11", "entradas": 50, "saidas": 80 }
    ]
    ```
- **Tratamento no Frontend:**
  - O Dashboard exibe os cartões consolidados reais (`totalAtendimentos`, `estoqueCritico`), gráfico/ranking de exames mais realizados (cruzado com `GET /exames`) e a lista das movimentações mais recentes (`GET /estoque/movimentacoes?limit=5`), indicando o gráfico histórico agregado como pendente do backend.

---

## 4. Paginação e Busca nos Módulos Pacientes e Médicos

- **Item faltante:** Parâmetros de consulta `page`, `limit` e `search`/`nome` nas rotas `GET /pacientes` e `GET /medicos`.
- **Telas dependentes:** [Pacientes](/pacientes) e [Médicos](/medicos).
- **Situação no Contrato da API:** Ambas as rotas retornam arrays simples com todos os registros ativos, sem paginação no servidor.
- **Proposta mínima para o Backend:**
  - Implementar o mesmo padrão paginado adotado em `/insumos` e `/atendimentos`: `{ items, total, page, limit, totalPages }`.
- **Tratamento no Frontend:**
  - Listagem com busca e paginação executadas client-side de forma reativa para não degradar a experiência do usuário.
