# Pré-lista de Avaliação do Frontend

**Projeto:** Sistema de gestão de clínica (exames, insumos, estoque, atendimentos e dashboard)
**Objetivo:** Servir de roteiro para a auditoria do frontend, combinando IHC, UX, UI e qualidade de software.
**Perfis de usuário previstos:** Administrador, Estoquista, Atendente e Gestor.

## 1. Como usar esta lista
1. Defina o escopo da auditoria (telas e fluxos) e os perfis que serão avaliados.
2. Percorra cada seção marcando os itens como Atende, Atende parcialmente, Não atende ou Não se aplica.
3. Para cada item que não atende, registre: tela, evidência (print ou passo a passo), heurística ou critério violado e severidade.
4. Consolide os resultados no quadro da seção 12.

### Escala de severidade (Nielsen)

| Nível | Descrição | Ação |
| :---: | :--- | :--- |
| **0** | Não é um problema de usabilidade | Ignorar |
| **1** | Problema cosmético | Corrigir se houver tempo |
| **2** | Problema menor | Prioridade baixa |
| **3** | Problema grave | Prioridade alta |
| **4** | Catástrofe de usabilidade | Corrigir antes de qualquer entrega |

## 2. Referências e conceitos adotados

| Referência | Para que serve na auditoria |
| :--- | :--- |
| **10 heurísticas de Nielsen** | Avaliação heurística de usabilidade |
| **ISO 9241-11** | Usabilidade como eficácia, eficiência e satisfação |
| **ISO/IEC 25010** | Modelo de qualidade de produto de software |
| **WCAG 2.2 (nível AA)** | Acessibilidade |
| **Leis de UX** (Fitts, Hick, Jakob, Miller) | Decisões de layout e fluxo |
| **Princípios de Gestalt** e hierarquia visual | Qualidade da interface visual |
| **Core Web Vitals** | Desempenho percebido |
| **Normas de Gulf of Execution/Evaluation** (Norman) | Clareza entre intenção, ação e feedback |

## 3. Contexto de uso e usuários (IHC)
- [ ] Os perfis de usuário (administrador, estoquista, atendente, gestor) estão documentados, com objetivos e nível de experiência técnica?
- [ ] Existem personas ou, no mínimo, uma descrição dos usuários reais?
- [ ] As tarefas principais de cada perfil estão mapeadas (por exemplo: registrar entrada de insumo, iniciar e finalizar atendimento, consultar estoque crítico)?
- [ ] O contexto físico de uso foi considerado (balcão, sala de exames, uso com luvas, pressa, interrupções, monitor pequeno)?
- [ ] Os dispositivos e navegadores-alvo estão definidos (desktop, tablet, celular)?
- [ ] As metas de usabilidade estão definidas e mensuráveis (por exemplo: finalizar um atendimento em menos de 30 segundos, taxa de erro abaixo de 5%)?
- [ ] O vocabulário da interface corresponde ao vocabulário da clínica ("insumo", "atendimento", "saldo"), e não ao vocabulário técnico do sistema ("registro", "entidade", "payload")?

## 4. Heurísticas de Nielsen aplicadas ao sistema

### H1. Visibilidade do status do sistema
- [ ] O usuário sempre sabe onde está (título da página, menu ativo, breadcrumb)?
- [ ] Todo carregamento mostra indicador (spinner, skeleton) e todo envio de formulário desabilita o botão enquanto processa?
- [ ] O status do atendimento (Em atendimento, Finalizado, Cancelado) é visível, com texto e não só cor?
- [ ] Após ações (salvar, finalizar, dar baixa) há confirmação de sucesso clara (toast, mensagem)?
- [ ] O estoque crítico é sinalizado de forma visível nas listagens e no dashboard?

### H2. Correspondência entre o sistema e o mundo real
- [ ] Datas, números e moeda seguem o padrão pt-BR (dd/mm/aaaa, vírgula decimal)?
- [ ] Unidades de medida dos insumos aparecem junto às quantidades?
- [ ] A ordem dos campos segue o fluxo mental do trabalho (por exemplo: paciente, exame, médico)?
- [ ] Mensagens não expõem termos técnicos (códigos HTTP, nomes de tabela, erros do Prisma)?

### H3. Controle e liberdade do usuário
- [ ] Existe opção clara de cancelar ou voltar em formulários e diálogos?
- [ ] Ações irreversíveis (cancelar atendimento, excluir, dar baixa de estoque) pedem confirmação específica, dizendo o que será afetado?
- [ ] Há como desfazer ou corrigir um lançamento errado (estorno, edição)?
- [ ] O botão "voltar" do navegador funciona de forma previsível?

### H4. Consistência e padrões
- [ ] Botões, cores, ícones, espaçamentos e tipografia são consistentes em todas as telas?
- [ ] Ações equivalentes têm o mesmo nome e a mesma posição (Salvar, Cancelar, Excluir)?
- [ ] Listagens, formulários e telas de detalhe seguem o mesmo padrão entre os módulos (Médicos, Exames, Insumos, Atendimentos)?
- [ ] A interface segue convenções da web (lei de Jakob): logo leva ao início, links parecem links, ícones comuns têm o significado esperado?
- [ ] Existe um design system ou biblioteca de componentes compartilhada?

### H5. Prevenção de erros
- [ ] Campos têm máscaras e restrições adequadas (CPF, CRM, telefone, quantidades numéricas positivas)?
- [ ] O sistema impede ações inválidas antes de enviar (desabilitar "Finalizar" se o atendimento já foi finalizado, avisar falta de estoque antes de iniciar)?
- [ ] Seleções usam listas, autocomplete ou busca em vez de digitação livre sempre que possível?
- [ ] Há proteção contra duplo clique e reenvio de formulário?
- [ ] Avisa sobre alterações não salvas ao sair de um formulário?

### H6. Reconhecimento em vez de memorização
- [ ] Opções, valores e comandos relevantes estão visíveis ou fáceis de recuperar?
- [ ] Campos mostram exemplos ou placeholders úteis (sem substituir o rótulo)?
- [ ] Em formulários longos, o contexto já informado permanece visível?
- [ ] A listagem mostra nome e não apenas IDs (médico, exame, insumo)?

### H7. Flexibilidade e eficiência de uso
- [ ] Usuários frequentes têm atalhos (busca rápida, filtros salvos, navegação por teclado, ações em lote)?
- [ ] Há busca e filtros em todas as listagens longas?
- [ ] Tarefas repetitivas (entrada de vários insumos) podem ser feitas com poucos cliques?
- [ ] Os fluxos principais têm o menor número possível de etapas?

### H8. Estética e design minimalista
- [ ] Cada tela tem um objetivo principal claro e uma ação primária em destaque?
- [ ] Há informação irrelevante ou decoração que compete com o conteúdo?
- [ ] O dashboard prioriza o que importa para a decisão (estoque crítico, atendimentos), sem excesso de widgets?
- [ ] Tabelas mostram apenas colunas essenciais, com detalhes sob demanda?

### H9. Ajudar a reconhecer, diagnosticar e corrigir erros
- [ ] Mensagens de erro estão em linguagem simples, dizem o que houve e como resolver?
- [ ] O erro aparece junto ao campo problemático e o campo é destacado?
- [ ] Erros do servidor (409 estoque insuficiente, 400 validação) são traduzidos em mensagens úteis, e não exibidos em bruto?
- [ ] O que o usuário digitou é preservado após um erro?
- [ ] Sessão expirada (401) leva ao login com aviso claro, sem perder o contexto?

### H10. Ajuda e documentação
- [ ] Há ajuda contextual (tooltips, textos de apoio) nos campos e fluxos menos óbvios?
- [ ] Existe um guia rápido ou onboarding para novos usuários?
- [ ] A ajuda é fácil de encontrar, curta e orientada à tarefa?

## 5. UX – experiência, fluxos e arquitetura da informação

### 5.1 Fluxos críticos
*Avaliar cada fluxo contando número de cliques, tempo, pontos de dúvida e erros possíveis.*
- [ ] Login e recuperação de acesso
- [ ] Cadastro de médico, exame e insumo
- [ ] Associar insumos a um exame (quantidade consumida)
- [ ] Registrar entrada de estoque
- [ ] Registrar saída manual de estoque
- [ ] Criar atendimento
- [ ] Finalizar atendimento (e entender que haverá baixa automática de estoque)
- [ ] Cancelar atendimento
- [ ] Consultar saldo e histórico de movimentações
- [ ] Consultar o dashboard e agir sobre um alerta de estoque crítico

### 5.2 Arquitetura da informação e navegação
- [ ] O menu agrupa funcionalidades de forma lógica e usa rótulos compreensíveis?
- [ ] O número de itens por nível respeita a lei de Miller (cerca de 7 itens) e a lei de Hick (menos opções, decisão mais rápida)?
- [ ] O menu mostra apenas o que cada perfil pode acessar (RBAC refletido na interface)?
- [ ] Rotas inexistentes, sem permissão ou com erro mostram páginas explicativas (404, 403)?
- [ ] Links diretos (URLs) funcionam ao recarregar a página ou compartilhar?

### 5.3 Estados da interface
*Para cada tela com dados, verificar todos os estados:*
- [ ] Carregando (skeleton ou indicador)
- [ ] Vazio (mensagem útil com chamada para a primeira ação)
- [ ] Erro (com opção de tentar novamente)
- [ ] Sucesso
- [ ] Parcial ou sem resultados de busca
- [ ] Offline ou falha de conexão

### 5.4 Carga cognitiva e confiança
- [ ] A interface evita sobrecarga de informação e agrupa campos relacionados (chunking)?
- [ ] Formulários longos são divididos em seções ou etapas?
- [ ] Ações de alto risco têm feedback e contexto suficientes para o usuário confiar no resultado?
- [ ] O sistema comunica claramente o que acontece com os dados de pacientes (privacidade)?

## 6. UI – interface visual

### 6.1 Hierarquia e layout
- [ ] Hierarquia visual clara (tamanho, peso, contraste e posição guiam o olhar)?
- [ ] Alinhamento, proximidade e espaçamento consistentes (Gestalt)?
- [ ] Grid e margens uniformes entre telas?
- [ ] A ação primária é única e destacada; ações secundárias têm menos ênfase?
- [ ] Alvos de clique adequados (lei de Fitts): mínimo recomendado de 24x24 px (WCAG 2.2) e idealmente 44x44 px em toque?

### 6.2 Tipografia, cores e ícones
- [ ] Escala tipográfica definida, fonte legível e tamanho mínimo de corpo de 14–16 px?
- [ ] Paleta definida, com cores semânticas coerentes (sucesso, alerta, erro, informação)?
- [ ] Contraste de texto de pelo menos 4.5:1 (3:1 para texto grande e componentes de interface)?
- [ ] Ícones acompanhados de texto ou rótulo acessível quando o significado não é universal?
- [ ] Modo escuro (se existir) mantém contraste e legibilidade?

### 6.3 Componentes
- [ ] **Formulários:** rótulos visíveis, campos obrigatórios indicados, ordem lógica, tipos de input corretos, mensagens de validação em tempo adequado.
- [ ] **Tabelas:** ordenação, filtros, paginação, cabeçalho fixo, alinhamento correto de números (à direita), ações por linha claras, rolagem horizontal controlada no mobile.
- [ ] **Modais e diálogos:** título claro, foco preso no modal, fecha com Esc, botões com rótulos específicos ("Cancelar atendimento" em vez de "OK").
- [ ] **Notificações (toasts):** tempo suficiente de leitura, não bloqueiam a tela, erros não desaparecem sozinhos.
- [ ] **Dashboard e gráficos:** títulos e unidades, legendas, cores distinguíveis por daltonismo, alternativa textual ou tabular.
- [ ] **Badges e status:** combinam cor, texto e, se possível, ícone.

### 6.4 Responsividade
- [ ] Layout funciona em desktop, tablet e celular sem rolagem horizontal da página?
- [ ] Menu se adapta a telas pequenas?
- [ ] Tabelas e formulários permanecem utilizáveis em largura reduzida?
- [ ] Zoom de 200% não quebra o layout?
- [ ] Orientação retrato e paisagem funcionam?

## 7. Acessibilidade (WCAG 2.2 AA)

### Perceptível
- [ ] Imagens e ícones informativos têm texto alternativo; decorativos são ignorados por leitores de tela.
- [ ] A informação não depende só de cor (status, estoque crítico, erros).
- [ ] Contraste mínimo atendido em textos, bordas de campos, ícones e estados de foco.
- [ ] Texto pode ser ampliado até 200% sem perda de conteúdo.

### Operável
- [ ] Todo o sistema pode ser usado apenas pelo teclado, com ordem de tabulação lógica.
- [ ] Foco visível em todos os elementos interativos e nunca escondido por barras fixas.
- [ ] Não há armadilhas de teclado (modais, menus, seletores).
- [ ] Há link para pular direto ao conteúdo principal.
- [ ] Títulos de página (`<title>`) descritivos e únicos.
- [ ] Alvos de toque e clique com tamanho mínimo adequado.

### Compreensível
- [ ] Idioma da página declarado (`lang="pt-BR"`).
- [ ] Rótulos e instruções associados aos campos (`label` com `for`, `aria-describedby` para erros).
- [ ] Erros identificados em texto e com sugestão de correção.
- [ ] Comportamento previsível (nada muda de contexto sem aviso).
- [ ] Autenticação não exige tarefa cognitiva difícil (permite colar senha e usar gerenciadores).

### Robusto
- [ ] HTML semântico (`header`, `nav`, `main`, `button`, `table` com `th` e `scope`).
- [ ] ARIA usado apenas quando necessário e corretamente (`role`, `aria-live` para mensagens dinâmicas, `aria-expanded`).
- [ ] Testado com leitor de tela (NVDA, VoiceOver ou TalkBack) nos fluxos críticos.
- [ ] Ferramentas automatizadas executadas (axe DevTools, Lighthouse, WAVE) e complementadas por revisão manual.

## 8. Qualidade de software (ISO/IEC 25010)

| Característica | Perguntas-chave para o frontend |
| :--- | :--- |
| **Adequação funcional** | Todas as funcionalidades da API estão disponíveis na interface e cumprem as regras de negócio? |
| **Eficiência de desempenho** | Carregamento rápido, tamanho de bundle controlado, listagens paginadas? |
| **Compatibilidade** | Funciona nos navegadores e dispositivos-alvo? |
| **Usabilidade** | Aprendizado, operabilidade, proteção contra erro, estética e acessibilidade atendidos? |
| **Confiabilidade** | Trata falhas de rede e da API sem quebrar? Recupera-se de erros? |
| **Segurança** | Autenticação, autorização e proteção de dados sensíveis no cliente? |
| **Manutenibilidade** | Código modular, tipado, testado e fácil de evoluir? |
| **Portabilidade** | Build reproduzível, configuração por ambiente, fácil de implantar? |

### 8.1 Adequação funcional
- [ ] Cada endpoint relevante tem tela ou ação correspondente (CRUDs, estoque, atendimentos, relatórios)?
- [ ] A interface respeita as regras da API (status do atendimento, saldo de estoque, perfis)?
- [ ] Os cálculos e totais exibidos conferem com os dados do backend?
- [ ] Não há funcionalidades "mortas" (botões sem ação, rotas inacessíveis)?

### 8.2 Desempenho
- [ ] LCP até 2,5 s, INP até 200 ms e CLS até 0,1 nas telas principais (Lighthouse e Web Vitals)?
- [ ] Code splitting e carregamento sob demanda por rota?
- [ ] Imagens otimizadas e bibliotecas pesadas avaliadas (tamanho do bundle)?
- [ ] Listagens com paginação ou virtualização e busca com debounce?
- [ ] Cache e revalidação de dados adequados (por exemplo React Query ou SWR), sem requisições duplicadas?
- [ ] Renderizações desnecessárias identificadas e tratadas?

### 8.3 Confiabilidade e tratamento de falhas
- [ ] Existe tratamento global de erros (error boundary) e página de falha amigável?
- [ ] Timeouts, falhas de rede e respostas inesperadas da API são tratados?
- [ ] Operações de escrita evitam duplicidade (bloqueio de reenvio, idempotência)?
- [ ] Dados exibidos não ficam desatualizados após ações (invalidação de cache após finalizar atendimento ou dar baixa)?

### 8.4 Segurança no cliente
- [ ] Token armazenado de forma segura (preferir cookie HttpOnly com Secure e SameSite; avaliar riscos de localStorage)?
- [ ] Rotas protegidas redirecionam para o login e tratam expiração de token?
- [ ] Controle por perfil na interface, sabendo que a decisão final de segurança continua no backend?
- [ ] Dados sensíveis (senhas, tokens, dados de pacientes) não aparecem em logs, console, URL ou mensagens de erro?
- [ ] Entradas exibidas são escapadas (sem `dangerouslySetInnerHTML` ou equivalente sem sanitização)?
- [ ] Dependências auditadas (`npm audit`) e atualizadas?
- [ ] Variáveis de ambiente do frontend não contêm segredos (tudo que vai no bundle é público)?
- [ ] Política de segurança de conteúdo (CSP) e HTTPS configurados no deploy?

### 8.5 Manutenibilidade e qualidade do código
- [ ] Estrutura de pastas clara (por funcionalidade ou domínio) e coerente com os módulos da API?
- [ ] Componentes pequenos, reutilizáveis e com responsabilidade única; lógica separada da apresentação (hooks, services)?
- [ ] Camada única de acesso à API (cliente HTTP com interceptors para token e erros)?
- [ ] Tipagem forte (TypeScript sem `any` indiscriminado) e tipos alinhados aos DTOs do backend?
- [ ] Validação de formulários consistente (por exemplo Zod com React Hook Form), reaproveitando as regras do backend?
- [ ] Gerenciamento de estado adequado (estado local, global e de servidor bem separados)?
- [ ] Sem código duplicado, código morto, `console.log` esquecido ou comentários obsoletos?
- [ ] Lint, formatação e checagem de tipos automatizados e sem avisos relevantes?
- [ ] Textos da interface centralizados (facilita revisão e eventual internacionalização)?
- [ ] README com instalação, scripts, variáveis de ambiente e arquitetura?

### 8.6 Testabilidade e testes
- [ ] Testes unitários de componentes e funções utilitárias?
- [ ] Testes de integração dos fluxos principais com API simulada (por exemplo MSW)?
- [ ] Testes ponta a ponta dos fluxos críticos (Playwright ou Cypress): login, criar e finalizar atendimento, entrada de estoque?
- [ ] Testes de acessibilidade automatizados no pipeline?
- [ ] Cobertura medida e metas definidas?
- [ ] Seletores de teste estáveis (`data-testid` ou papéis acessíveis)?

### 8.7 Compatibilidade e portabilidade
- [ ] Testado nos navegadores-alvo (Chrome, Edge, Firefox, Safari) e em celular?
- [ ] Build de produção reproduzível, com configuração por ambiente?
- [ ] Pipeline de CI com lint, testes e build?
- [ ] Tratamento de versões de dependências (lockfile versionado)?

## 9. Aspectos específicos do domínio (clínica)
- [ ] Dados de pacientes e profissionais são exibidos apenas a quem precisa (mínimo necessário, LGPD)?
- [ ] A tela de atendimento reduz o risco de erro de seleção de paciente, médico ou exame (confirmação com dados de identificação)?
- [ ] Alertas de estoque crítico levam diretamente à ação (por exemplo, registrar entrada)?
- [ ] Histórico e rastreabilidade são visíveis (quem fez, quando, por quê) em movimentações e atendimentos?
- [ ] Sessão expira por inatividade em computadores compartilhados e há logout visível?
- [ ] Impressão ou exportação de relatórios funcionam e mantêm o layout?

## 10. Métodos de coleta de evidências

| Método | O que revela | Quando usar |
| :--- | :--- | :--- |
| **Avaliação heurística** (2 a 3 avaliadores) | Problemas de usabilidade com baixo custo | Início da auditoria |
| **Percurso cognitivo** | Dificuldades de aprendizado em tarefas novas | Fluxos principais |
| **Teste de usabilidade** com usuários (5 por perfil) | Erros reais, tempo e satisfação | Após a avaliação heurística |
| **Pensar em voz alta** | Modelo mental do usuário | Durante os testes |
| **Questionário SUS** | Percepção de usabilidade (nota 0 a 100; > 68 é acima da média) | Ao final dos testes |
| **NASA-TLX** ou escala de esforço | Carga de trabalho percebida | Tarefas complexas |
| **Auditoria de acessibilidade** (automática e manual) | Conformidade WCAG | Todas as telas-chave |
| **Lighthouse e Web Vitals** | Desempenho, boas práticas, SEO e acessibilidade | Cada tela principal |
| **Análise estática de código** (ESLint, SonarQube) | Manutenibilidade e riscos | Código-fonte |
| **Revisão de código e arquitetura** | Estrutura, acoplamento e padrões | Código-fonte |
| **Observação em campo / entrevistas** | Contexto real de uso | Antes e depois dos testes |

**Métricas sugeridas (ISO 9241-11)**
- **Eficácia:** taxa de conclusão de tarefas e número de erros por tarefa.
- **Eficiência:** tempo por tarefa e número de cliques.
- **Satisfação:** pontuação SUS e comentários qualitativos.

## 11. Itens para preparar antes da auditoria
- [ ] Acesso a ambiente de homologação com dados de teste realistas (sem dados reais de pacientes).
- [ ] Contas de teste para cada perfil.
- [ ] Lista de telas, rotas e fluxos no escopo.
- [ ] Dispositivos e navegadores definidos para teste.
- [ ] Protótipos, wireframes ou design system (se existirem) para comparar com o implementado.
- [ ] Termo de consentimento para os testes com usuários.
- [ ] Modelo de registro de achados (planilha ou quadro).

## 12. Quadro de registro de achados

| ID | Tela / fluxo | Descrição do problema | Critério violado (heurística, WCAG, ISO) | Evidência | Severidade (0–4) | Recomendação | Responsável | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| F-01 | | | | | | | | |
| F-02 | | | | | | | | |
| F-03 | | | | | | | | |

## 13. Resultado consolidado

| Área | Itens avaliados | Atende | Parcial | Não atende | Observação |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Contexto de uso e usuários** | | | | | |
| **Heurísticas de Nielsen** | | | | | |
| **UX (fluxos e informação)** | | | | | |
| **UI (visual e componentes)** | | | | | |
| **Acessibilidade** | | | | | |
| **Qualidade de software** | | | | | |
| **Domínio (clínica)** | | | | | |

*Os resultados devem gerar um plano de ação priorizado por severidade (itens 4 e 3 primeiro), impacto no usuário e esforço de correção.*
