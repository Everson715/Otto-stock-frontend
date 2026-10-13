import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';

export function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '2rem',
        textAlign: 'center',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: '#eff6ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#3b82f6',
        }}
      >
        <FileQuestion size={44} />
      </div>

      <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0 0 0', color: '#111827' }}>
        Página Não Encontrada
      </h1>

      <p style={{ maxWidth: 460, color: '#6b7280', fontSize: '0.95rem', margin: 0 }}>
        O endereço acessado não existe, foi movido ou você não possui permissão para visualizá-lo.
      </p>

      <div style={{ marginTop: '1rem' }}>
        <Link to="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          <Home className="size-4" />
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}
