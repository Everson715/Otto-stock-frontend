import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou uma falha não tratada:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            padding: '2rem',
            textAlign: 'center',
            gap: '1.25rem',
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
            }}
          >
            <AlertOctagon size={48} />
          </div>

          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0, color: '#111827' }}>
            Ops! Algo deu errado.
          </h1>

          <p style={{ maxWidth: 480, color: '#6b7280', fontSize: '0.95rem', margin: 0 }}>
            Ocorreu um erro inesperado durante a renderização deste módulo. Você pode tentar recarregar a página
            ou voltar para a página inicial.
          </p>

          {this.state.error && (
            <div
              style={{
                maxWidth: 550,
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                color: '#6b7280',
                textAlign: 'left',
                overflowX: 'auto',
                fontFamily: 'monospace',
              }}
            >
              <strong>Detalhes do erro:</strong> {this.state.error.message}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button
              variant="secondary"
              onClick={() => (window.location.href = '/')}
              leftIcon={<Home className="size-4" />}
            >
              Voltar ao Início
            </Button>
            <Button
              variant="primary"
              onClick={this.handleReset}
              leftIcon={<RefreshCw className="size-4" />}
            >
              Recarregar Página
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
