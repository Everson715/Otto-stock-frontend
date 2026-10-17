interface StepItem {
  number: string;
  title: string;
  description: string;
  barClassName: string;
  badgeClassName: string;
}

const STEPS: StepItem[] = [
  {
    number: '01',
    title: 'Cadastre exames e insumos',
    description:
      'Defina o estoque mínimo de cada insumo e monte a ficha técnica de cada exame.',
    barClassName: 'bg-primary',
    badgeClassName: 'bg-primary-fixed text-on-primary-fixed',
  },
  {
    number: '02',
    title: 'Abra o atendimento',
    description:
      'Selecione paciente, médico e exame. O atendimento entra na fila em andamento.',
    barClassName: 'bg-secondary',
    badgeClassName: 'bg-secondary-container/70 text-on-secondary-container',
  },
  {
    number: '03',
    title: 'Finalize e acompanhe',
    description:
      'Os insumos são baixados e o saldo, os alertas e o histórico se atualizam.',
    barClassName: 'bg-tertiary',
    badgeClassName: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  },
];

export function LandingHowItWorks() {
  return (
    <section
      id="como"
      aria-labelledby="como-heading"
      className="py-12 md:py-16 scroll-mt-20"
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-2xl">
          <h2
            id="como-heading"
            className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-on-surface m-0"
          >
            Como funciona
          </h2>
        </div>

        <ol className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0 m-0">
          {STEPS.map((step) => (
            <li
              key={step.number}
              className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl overflow-hidden shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] flex flex-col"
            >
              <div className={`h-1.5 w-full ${step.barClassName}`} aria-hidden="true" />
              <div className="p-6 flex flex-col items-start text-left flex-1">
                <span
                  className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md font-data-mono text-data-mono font-bold tabular-nums ${step.badgeClassName}`}
                >
                  {step.number}
                </span>

                <h3 className="mt-4 font-sans text-headline-sm font-bold tracking-tight text-on-surface m-0">
                  {step.title}
                </h3>

                <p className="mt-2 text-body-md text-on-surface-variant m-0 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
