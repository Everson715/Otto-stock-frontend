import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Package } from 'lucide-react';
import { Button } from '../ui/Button';
import { StatusBadge, type StatusBadgeVariant } from '../ui/StatusBadge';

interface LandingHeroProps {
  isAuthenticated: boolean;
  onAnchorClick: (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => void;
}

interface ExampleStockRow {
  nome: string;
  saldo: number;
  minimo: number;
  statusLabel: string;
  variant: StatusBadgeVariant;
}

const EXAMPLE_STOCK_ROWS: ExampleStockRow[] = [
  {
    nome: 'Seringa 10 ml',
    saldo: 47,
    minimo: 20,
    statusLabel: 'Conforme',
    variant: 'conforme',
  },
  {
    nome: 'Luva de procedimento',
    saldo: 22,
    minimo: 20,
    statusLabel: 'Atenção',
    variant: 'atencao',
  },
  {
    nome: 'Gaze esterilizada',
    saldo: 0,
    minimo: 30,
    statusLabel: 'Ruptura',
    variant: 'critico',
  },
];

export function LandingHero({
  isAuthenticated,
  onAnchorClick,
}: LandingHeroProps) {
  const navigate = useNavigate();

  function handleAccessSystem() {
    navigate(isAuthenticated ? '/' : '/login');
  }

  return (
    <section
      aria-labelledby="hero-heading"
      className="pt-28 pb-12 md:pt-32 md:pb-16"
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Coluna Esquerda: Texto e CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <StatusBadge
              variant="info"
              label="Gestão clínica e controle de insumos"
              icon={<Activity size={14} className="shrink-0" aria-hidden="true" />}
              className="mb-4"
            />

            <h1
              id="hero-heading"
              className="font-sans text-3xl sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15] font-extrabold tracking-tight text-on-surface m-0"
            >
              Cada atendimento concluído.{' '}
              <span className="text-primary">Cada insumo no lugar.</span>
            </h1>

            <p className="mt-4 text-body-lg text-on-surface-variant max-w-2xl m-0 leading-relaxed">
              O Otto Stock conecta recepção, corpo clínico e almoxarifado: o
              estoque é baixado conforme a ficha técnica de cada exame, e você
              acompanha saldo, alertas e histórico em um só lugar.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleAccessSystem}
                rightIcon={<ArrowRight size={18} aria-hidden="true" />}
                className="w-full sm:w-auto"
              >
                Acessar o sistema
              </Button>

              <a
                href="#recursos"
                onClick={(event) => onAnchorClick(event, 'recursos')}
                className="inline-flex items-center justify-center h-12 px-space-lg py-2.5 rounded-lg font-semibold text-body-md bg-surface-container-lowest hover:bg-surface-container-low text-on-surface border border-outline-variant/60 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] transition-colors no-underline w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Ver funcionalidades
              </a>
            </div>
          </div>

          {/* Coluna Direita: Card Ilustrativo "Saldo de insumos" */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2 pb-4 border-b border-outline-variant/30">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                    <Package size={18} aria-hidden="true" />
                  </div>
                  <span className="font-sans font-bold text-headline-sm text-on-surface">
                    Saldo de insumos
                  </span>
                </div>

                <StatusBadge variant="neutro" label="Exemplo" />
              </div>

              <ul className="divide-y divide-outline-variant/25 m-0 p-0 list-none mt-2">
                {EXAMPLE_STOCK_ROWS.map((row) => (
                  <li
                    key={row.nome}
                    className="py-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-sans font-semibold text-body-md text-on-surface m-0 truncate">
                        {row.nome}
                      </p>
                      <p className="font-data-mono text-data-mono tabular-nums text-on-surface-variant m-0 mt-0.5">
                        saldo {row.saldo} · mín. {row.minimo}
                      </p>
                    </div>

                    <StatusBadge
                      variant={row.variant}
                      label={row.statusLabel}
                      className="shrink-0"
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
