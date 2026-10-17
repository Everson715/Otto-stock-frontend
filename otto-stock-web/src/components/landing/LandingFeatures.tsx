import React from 'react';
import {
  ClipboardCheck,
  ClipboardList,
  History,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';

interface FeatureItem {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const FEATURES: FeatureItem[] = [
  {
    title: 'Saldo e alertas',
    description:
      'Veja o que está abaixo do mínimo, em atenção ou em ruptura, com status visual claro em cada insumo.',
    icon: <TrendingUp size={20} aria-hidden="true" />,
  },
  {
    title: 'Baixa automática por exame',
    description:
      'A ficha técnica define o que cada exame consome. Ao finalizar o atendimento, a saída é registrada.',
    icon: <ClipboardCheck size={20} aria-hidden="true" />,
  },
  {
    title: 'Movimentações auditáveis',
    description:
      'Entradas, saídas e ajustes ficam no extrato, com motivo e responsável pelo registro.',
    icon: <History size={20} aria-hidden="true" />,
  },
  {
    title: 'Atendimentos',
    description:
      'Abertura e finalização vinculadas a paciente, médico e exame, com filtros por período e status.',
    icon: <ClipboardList size={20} aria-hidden="true" />,
  },
  {
    title: 'Acesso por perfil',
    description:
      'Login seguro e telas liberadas conforme a função de cada pessoa da equipe.',
    icon: <ShieldCheck size={20} aria-hidden="true" />,
  },
  {
    title: 'Cadastros completos',
    description:
      'Pacientes, médicos, exames e insumos com busca e listagem paginada.',
    icon: <Users size={20} aria-hidden="true" />,
  },
];

export function LandingFeatures() {
  return (
    <section
      id="recursos"
      aria-labelledby="recursos-heading"
      className="py-12 md:py-16 scroll-mt-20"
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-2xl">
          <h2
            id="recursos-heading"
            className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-on-surface m-0"
          >
            Tudo o que a rotina da clínica precisa
          </h2>
          <p className="mt-2 text-body-lg text-on-surface-variant m-0">
            Do cadastro ao extrato de movimentações, sem planilhas paralelas.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] flex flex-col items-start text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-surface-container text-primary flex items-center justify-center shrink-0">
                {feature.icon}
              </div>

              <h3 className="mt-4 font-sans text-headline-sm font-bold tracking-tight text-on-surface m-0">
                {feature.title}
              </h3>

              <p className="mt-2 text-body-md text-on-surface-variant m-0 leading-relaxed">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
