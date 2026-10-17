import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface LandingCtaProps {
  isAuthenticated: boolean;
}

export function LandingCta({ isAuthenticated }: LandingCtaProps) {
  const navigate = useNavigate();

  function handleAccessSystem() {
    navigate(isAuthenticated ? '/' : '/login');
  }

  return (
    <section aria-labelledby="cta-heading" className="py-12 md:py-16">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="bg-primary text-on-primary rounded-2xl p-8 md:p-12 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl text-left">
            <h2
              id="cta-heading"
              className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-on-primary m-0"
            >
              Pronto para organizar o estoque da sua clínica?
            </h2>
            <p className="mt-2 text-body-lg text-on-primary/90 m-0">
              Entre com seu perfil e acompanhe atendimentos e insumos em tempo
              real.
            </p>
          </div>

          <div className="shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={handleAccessSystem}
              rightIcon={<ArrowRight size={18} aria-hidden="true" />}
              className="!bg-surface-container-lowest !text-primary hover:!bg-surface-container-low !border-transparent focus-visible:!ring-on-primary focus-visible:!ring-offset-primary w-full sm:w-auto font-bold"
            >
              Acessar o sistema
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
