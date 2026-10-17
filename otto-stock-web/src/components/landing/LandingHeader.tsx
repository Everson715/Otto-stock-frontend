import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Logo } from '../Logo';
import { Button } from '../ui/Button';

interface LandingHeaderProps {
  isAuthenticated: boolean;
  onAnchorClick: (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => void;
}

const NAV_LINKS = [
  { label: 'Recursos', targetId: 'recursos' },
  { label: 'Como funciona', targetId: 'como' },
  { label: 'Perfis de acesso', targetId: 'perfis' },
] as const;

export function LandingHeader({
  isAuthenticated,
  onAnchorClick,
}: LandingHeaderProps) {
  const navigate = useNavigate();

  function handlePrimaryAction() {
    navigate(isAuthenticated ? '/' : '/login');
  }

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-16 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/40">
      <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between gap-4">
        <Logo to="/landing" />

        <nav
          aria-label="Seções da página inicial"
          className="hidden md:flex items-center gap-6"
        >
          {NAV_LINKS.map((item) => (
            <a
              key={item.targetId}
              href={`#${item.targetId}`}
              onClick={(event) => onAnchorClick(event, item.targetId)}
              className="text-body-md font-medium text-on-surface-variant hover:text-on-surface transition-colors rounded-md px-2 py-1 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center shrink-0">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handlePrimaryAction}
            rightIcon={<ArrowRight size={16} aria-hidden="true" />}
          >
            {isAuthenticated ? 'Ir para o sistema' : 'Entrar'}
          </Button>
        </div>
      </div>
    </header>
  );
}
