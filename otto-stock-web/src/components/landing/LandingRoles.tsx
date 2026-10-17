import React from 'react';
import { BarChart3, Boxes, Shield, UserCheck } from 'lucide-react';

interface RoleCardItem {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ROLES: RoleCardItem[] = [
  {
    title: 'Administrador',
    description: 'Acesso a todos os módulos, inclusive o catálogo de exames.',
    icon: <Shield size={20} aria-hidden="true" />,
  },
  {
    title: 'Gestor',
    description: 'Pacientes, médicos, atendimentos, saldo e movimentações.',
    icon: <BarChart3 size={20} aria-hidden="true" />,
  },
  {
    title: 'Atendente',
    description: 'Pacientes e atendimentos, do cadastro à finalização.',
    icon: <UserCheck size={20} aria-hidden="true" />,
  },
  {
    title: 'Estoquista',
    description: 'Insumos, ficha técnica e movimentação de estoque.',
    icon: <Boxes size={20} aria-hidden="true" />,
  },
];

export function LandingRoles() {
  return (
    <section
      id="perfis"
      aria-labelledby="perfis-heading"
      className="py-12 md:py-16 scroll-mt-20"
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-2xl">
          <h2
            id="perfis-heading"
            className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-on-surface m-0"
          >
            Cada pessoa vê o que precisa
          </h2>
          <p className="mt-2 text-body-lg text-on-surface-variant m-0">
            Quatro perfis de acesso, do balcão ao almoxarifado.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ROLES.map((role) => (
            <article
              key={role.title}
              className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] flex flex-col items-start text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-surface-container text-primary flex items-center justify-center shrink-0">
                {role.icon}
              </div>

              <h3 className="mt-4 font-sans text-headline-sm font-bold tracking-tight text-on-surface m-0">
                {role.title}
              </h3>

              <p className="mt-2 text-body-md text-on-surface-variant m-0 leading-relaxed">
                {role.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
