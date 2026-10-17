import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import './Login.css';

const loginSchema = z.object({
  email: z.string().min(1, 'O e-mail é obrigatório').email('Formato de e-mail inválido'),
  senha: z.string().min(1, 'A senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      senha: '',
    },
  });

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(data: LoginFormData) {
    setErrorMessage(null);
    try {
      await login(data.email, data.senha);
      toast.success('Login realizado com sucesso!');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      let message = 'Credenciais inválidas ou usuário inativo';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { message?: string; error?: string | boolean } } };
        if (axiosErr.response?.status === 429) {
          message = 'Muitas tentativas de login. Tente novamente mais tarde.';
        } else if (axiosErr.response?.data?.message) {
          message = axiosErr.response.data.message;
        } else if (typeof axiosErr.response?.data?.error === 'string') {
          message = axiosErr.response.data.error;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      setErrorMessage(message);
      toast.error(message);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="navbar-logo" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            <strong>Otto</strong>Stock
          </div>
          <h1>Acesso ao Sistema</h1>
          <p>Informe suas credenciais para continuar</p>
        </div>

        {errorMessage && (
          <div className="login-error-banner" role="alert" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <Input
            label="E-mail"
            type="email"
            placeholder="usuario@clinica.com"
            autoComplete="email"
            disabled={isSubmitting}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={isSubmitting}
            error={errors.senha?.message}
            {...register('senha')}
          />

          <Button
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<LogIn className="size-4" />}
            className="w-full"
            style={{ marginTop: '0.5rem' }}
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
