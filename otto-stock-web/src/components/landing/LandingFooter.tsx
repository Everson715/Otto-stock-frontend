import { Package } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="border-t border-outline-variant/40 bg-surface-container-lowest py-8 mt-auto">
      <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 text-on-surface font-sans font-semibold text-body-md">
          <span className="w-6 h-6 rounded-md bg-primary text-on-primary inline-flex items-center justify-center shrink-0">
            <Package size={14} aria-hidden="true" />
          </span>
          <span>Otto Stock · Gestão Clínica</span>
        </div>

        <p className="text-body-sm text-on-surface-variant m-0">
          © 2026 Otto Stock. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
