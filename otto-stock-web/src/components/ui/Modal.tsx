import React, { useEffect } from 'react';
import './ui.css';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-inverse-surface/50 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto bg-surface-container-lowest rounded-xl border border-outline-variant/40 p-space-lg shadow-[0_20px_25px_-5px_rgb(15_23_42/0.08),0_8px_10px_-6px_rgb(15_23_42/0.04)] text-left`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-space-md pb-space-md mb-space-md border-b border-outline-variant/30">
          <div className="flex flex-col gap-0.5">
            <h3
              id="modal-title"
              className="text-headline-sm font-semibold text-on-surface m-0"
            >
              {title}
            </h3>
            {subtitle && (
              <p className="text-body-sm text-outline m-0">{subtitle}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-1.5 h-8 w-8"
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
