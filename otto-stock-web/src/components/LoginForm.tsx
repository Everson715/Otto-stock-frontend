import { useState, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertCircle,
  AtSign,
  Lock,
  LogIn,
  Package,
  ShieldCheck,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import {
  getDefaultRouteForPerfil,
  hasRouteAccess,
  ROUTE_ROLES,
  type AppRoutePath,
} from '../types/auth';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { PasswordInput } from './PasswordInput';

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'O e-mail é obrigatório')
    .email('Formato de e-mail inválido'),
  senha: z.string().min(1, 'A senha é obrigatória'),
  manterConectado: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  fromPath?: string;
}

const SUPPORT_HREF =
  import.meta.env.VITE_SUPPORT_URL ||
  (import.meta.env.VITE_SUPPORT_EMAIL
    ? `mailto:${import.meta.env.VITE_SUPPORT_EMAIL}`
    : '#suporte-ti');

export function LoginForm({ fromPath }: LoginFormProps) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const rememberCheckboxId = useId();
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
      manterConectado: false,
    },
  });

  function handleForgotPassword() {
    toast.info(
      'Para redefinir sua senha, contate o Suporte de TI ou o Administrador da Clínica.'
    );
  }

  function handleSupportClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (SUPPORT_HREF === '#suporte-ti') {
      e.preventDefault();
      toast.info(
        'Contate o Suporte de TI ou o Administrador da Clínica para assistência de acesso.'
      );
    }
  }

  async function onSubmit(data: LoginFormData) {
    if (isSubmitting) return;
    setErrorMessage(null);

    try {
      const authenticatedUser = await login(data.email.trim(), data.senha);
      toast.success('Login realizado com sucesso!');

      const userPerfil = authenticatedUser.perfil;
      let targetRoute: string = getDefaultRouteForPerfil(userPerfil);

      if (fromPath && fromPath !== '/login' && fromPath !== '/landing') {
        const matchedRouteKey = (Object.keys(ROUTE_ROLES) as AppRoutePath[]).find(
          (routeKey) =>
            routeKey === fromPath ||
            (routeKey !== '/' && fromPath.startsWith(routeKey))
        );

        if (
          !matchedRouteKey ||
          hasRouteAccess(userPerfil, matchedRouteKey)
        ) {
          targetRoute = fromPath;
        }
      }

      navigate(targetRoute, { replace: true });
    } catch (err: unknown) {
      let message =
        'Credenciais inválidas ou conta inativa. Verifique seus dados e tente novamente.';

      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as {
          response?: {
            status?: number;
            data?: { message?: string; error?: string | boolean };
          };
          request?: unknown;
        };

        if (!axiosErr.response) {
          message =
            'Não foi possível conectar ao servidor. Verifique sua conexão de rede e tente novamente.';
        } else if (axiosErr.response.status === 429) {
          message =
            'Limite de tentativas excedido. Por favor, aguarde um minuto antes de tentar novamente.';
        } else if (
          axiosErr.response.status === 401 ||
          axiosErr.response.status === 400
        ) {
          message =
            'Credenciais inválidas ou conta inativa. Verifique seus dados e tente novamente.';
        } else if (axiosErr.response.data?.message) {
          message = axiosErr.response.data.message;
        } else if (typeof axiosErr.response.data?.error === 'string') {
          message = axiosErr.response.data.error;
        }
      } else {
        message =
          'Não foi possível conectar ao servidor. Verifique sua conexão de rede e tente novamente.';
      }

      setErrorMessage(message);
      toast.error(message);
    }
  }

  return (
    <div className="w-full max-w-[540px] rounded-2xl bg-surface-container-lowest border border-outline-variant/40 p-6 sm:p-10 shadow-[0_12px_32px_-8px_rgb(15_23_42/0.08),0_4px_12px_-4px_rgb(15_23_42/0.04)] text-left">
      {/* 1. Ícone Package centralizado + 2. Wordmark e títulos */}
      <div className="flex flex-col items-center text-center mb-7">
        <div className="w-12 h-12 rounded-xl bg-primary-fixed text-primary flex items-center justify-center mb-3.5 shadow-2xs">
          <Package className="size-6 shrink-0" aria-hidden="true" />
        </div>

        <div className="font-sans text-2xl font-extrabold tracking-tight leading-none mb-2">
          <span className="text-on-surface">Otto</span>
          <span className="text-primary">Stock</span>
        </div>

        <h1 className="font-headline-lg text-headline-lg font-semibold text-on-surface m-0">
          Acesso ao Sistema
        </h1>
        <p className="text-body-md text-on-surface-variant m-0 mt-1">
          Informe suas credenciais para continuar
        </p>
      </div>

      {/* Alerta de erro acessível */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-5 flex items-start gap-2.5 rounded-lg bg-error-container/70 border border-error/30 px-3.5 py-3 text-body-md text-on-error-container"
        >
          <AlertCircle
            className="size-4 shrink-0 mt-0.5 text-error"
            aria-hidden="true"
          />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Formulário */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-5"
      >
        {/* 3. Campo E-mail */}
        <Input
          label="E-mail"
          type="email"
          placeholder="usuario@clinica.com"
          autoComplete="username"
          disabled={isSubmitting}
          leftIcon={<AtSign className="size-4" aria-hidden="true" />}
          error={errors.email?.message}
          className="min-h-11 pl-10"
          {...register('email')}
        />

        {/* 4. Campo Senha */}
        <PasswordInput
          label="Senha"
          placeholder="••••••••"
          autoComplete="current-password"
          disabled={isSubmitting}
          leftIcon={<Lock className="size-4" aria-hidden="true" />}
          error={errors.senha?.message}
          labelRight={
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-body-sm font-semibold text-primary hover:text-primary-container transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              Esqueceu a senha?
            </button>
          }
          {...register('senha')}
        />

        {/* 5. Linha com checkbox "Manter conectado por 12 horas" + tag verde "Sessão Segura" */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container/70 text-on-secondary-container font-label-sm text-label-sm font-bold leading-none">
            Sessão Segura
          </span>
        </div>

        {/* 6. Botão Entrar */}
        <Button
          type="submit"
          size="lg"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          leftIcon={<LogIn className="size-4" aria-hidden="true" />}
          className="w-full min-h-11 mt-1 rounded-xl shadow-sm"
        >
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      {/* 7. Rodapé do card */}
      <div className="mt-7 pt-5 border-t border-outline-variant/30 flex flex-col items-center text-center gap-2">
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-body-sm text-outline font-medium">
          <ShieldCheck
            className="size-4 text-secondary shrink-0"
            aria-hidden="true"
          />
          <span>SSL 256-bit</span>
          <span aria-hidden="true">•</span>
          <span>Autenticação JWT</span>
          <span aria-hidden="true">•</span>
          <span>LGPD Compliance</span>
        </div>

        <p className="text-body-sm text-on-surface-variant m-0">
          Dúvidas ou perda de acesso?{' '}
          <a
            href={SUPPORT_HREF}
            onClick={handleSupportClick}
            className="font-semibold text-primary hover:text-primary-container underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            Contate o Suporte de TI da Clínica
          </a>
        </p>
      </div>
    </div>
  );
}
