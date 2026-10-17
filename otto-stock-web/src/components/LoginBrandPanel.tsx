import { Lock, Package, ShieldCheck } from 'lucide-react';

export function LoginBrandPanel() {
  return (
    <aside
      aria-label="Informações institucionais OttoStock"
      className="hidden lg:flex lg:w-[58%] relative flex-col justify-between p-10 xl:p-14 bg-linear-to-br from-on-primary-fixed via-on-primary-fixed-variant to-primary text-on-primary overflow-hidden select-none"
    >
      {/* Grade sutil de fundo (linhas finas e baixa opacidade) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:36px_36px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-container/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-secondary/20 blur-3xl"
      />

      {/* 1. Logo no topo */}
      <div className="relative z-10 flex items-center gap-3.5 text-left">
        <div className="w-11 h-11 rounded-xl bg-on-primary/10 border border-on-primary/20 backdrop-blur-sm flex items-center justify-center shadow-sm shrink-0">
          <Package className="size-6 text-inverse-primary" aria-hidden="true" />
        </div>
        <div className="flex flex-col">
          <span className="font-sans text-2xl font-extrabold tracking-tight leading-none">
            <span className="text-on-primary">Otto</span>
            <span className="text-inverse-primary">Stock</span>
          </span>
          <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-fixed/80 mt-1 leading-none">
            GESTÃO CLÍNICA &amp; CONTROLE DE ESTOQUE
          </span>
        </div>
      </div>

      {/* Centro vertical: Badge, Título, Parágrafo e Cards em vidro fosco */}
      <div className="relative z-10 my-auto py-8 flex flex-col items-start text-left max-w-2xl">

        {/* 3. Título grande em negrito */}
        <h2 className="font-headline-xl text-3xl xl:text-4xl font-extrabold tracking-tight text-on-primary leading-[1.15] m-0">
          Precisão clínica absoluta no controle de dispensação e insumos.
        </h2>

        {/* 4. Parágrafo de apoio */}
        <p className="mt-4 text-body-lg text-primary-fixed/85 leading-relaxed m-0 max-w-xl">
          Infraestrutura hospitalar de alta disponibilidade com rastreamento de
          lote, validade crítica, auditoria transacional contínua e controle
          rigoroso de saldo negativo.
        </p>

        {/* 5. Dois cards em vidro fosco */}
        <div className="mt-8 grid grid-cols-1 gap-4 w-full">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-on-primary/8 border border-on-primary/15 backdrop-blur-md">
            <div className="w-10 h-10 rounded-lg bg-primary-container/80 border border-inverse-primary/30 text-on-primary flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="size-5 text-inverse-primary" aria-hidden="true" />
            </div>
            <div className="flex flex-col text-left">
              <h3 className="font-headline-sm text-body-lg font-bold text-on-primary m-0 leading-snug">
                Controle Atômico de Estoque &amp; Baixa Preventiva
              </h3>
              <p className="text-body-md text-primary-fixed/80 m-0 mt-1 leading-relaxed">
                Rastreamento unitário e por lote com trava sistêmica que impede
                saldos inconsistentes em consultas e procedimentos.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-on-primary/8 border border-on-primary/15 backdrop-blur-md">
            <div className="w-10 h-10 rounded-lg bg-secondary/80 border border-secondary-fixed-dim/30 text-on-secondary flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="size-5 text-secondary-fixed" aria-hidden="true" />
            </div>
            <div className="flex flex-col text-left">
              <h3 className="font-headline-sm text-body-lg font-bold text-on-primary m-0 leading-snug">
                Governança RBAC &amp; Auditoria Clínica
              </h3>
              <p className="text-body-md text-primary-fixed/80 m-0 mt-1 leading-relaxed">
                Matriz de permissões estritas para Administradores, Estoquistas,
                Atendentes e Gestores em conformidade LGPD.
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
