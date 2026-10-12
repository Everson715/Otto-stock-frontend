import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';
import {
  LayoutDashboard,
  Beaker,
  ClipboardList,
  Box,
  History,
  Users,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, perfil, isAuthenticated, logout } = useAuth();

  // Se não estiver autenticado ou na tela de login, oculta links de navegação
  if (!isAuthenticated || location.pathname === '/login') {
    return (
      <nav className="navbar">
        <div className="navbar-logo">
          <strong>Otto</strong>Stock
        </div>
      </nav>
    );
  }

  const allLinks = [
    { to: '/', label: 'Home', icon: <LayoutDashboard size={18} />, roles: ['ADMIN', 'ESTOQUISTA', 'ATENDENTE', 'GESTOR'] },
    { to: '/insumos', label: 'Insumos', icon: <Beaker size={18} />, roles: ['ADMIN', 'ESTOQUISTA'] },
    { to: '/exames', label: 'Exames', icon: <ClipboardList size={18} />, roles: ['ADMIN'] },
    { to: '/estoque', label: 'Movimentar', icon: <Box size={18} />, roles: ['ADMIN', 'ESTOQUISTA'] },
    { to: '/estoque/movimentacoes', label: 'Extrato', icon: <History size={18} />, roles: ['ADMIN', 'ESTOQUISTA', 'GESTOR'] },
    { to: '/atendimentos', label: 'Atendimentos', icon: <Users size={18} />, roles: ['ADMIN', 'ATENDENTE', 'GESTOR'] },
  ];

  // Filtra os links visíveis com base no perfil do usuário (ADMIN sempre vê tudo)
  const visibleLinks = allLinks.filter(
    (link) => perfil === 'ADMIN' || (perfil && link.roles.includes(perfil))
  );

  function handleLogout() {
    logout();
    toast.info('Sessão encerrada com sucesso.');
    navigate('/login', { replace: true });
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <strong>Otto</strong>Stock
      </Link>

      <div className="navbar-links">
        {visibleLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`navbar-link ${location.pathname === link.to ? 'active' : ''}`}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </div>

      <div className="navbar-user">
        <div className="navbar-user-info" title={usuario?.email}>
          <UserIcon size={16} className="text-gray-500" />
          <span className="navbar-user-name">{usuario?.nome || 'Usuário'}</span>
          <span className="navbar-user-role">{perfil || 'PERFIL'}</span>
        </div>

        <button
          onClick={handleLogout}
          className="navbar-logout-btn"
          title="Sair do sistema"
          type="button"
        >
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </div>
    </nav>
  );
}