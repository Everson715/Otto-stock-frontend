import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';
import {
  LayoutDashboard,
  UserCheck,
  Stethoscope,
  Users,
  Beaker,
  ClipboardList,
  Layers,
  Box,
  BarChart3,
  History,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, perfil, isAuthenticated, logout } = useAuth();

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
    { to: '/', label: 'Início', icon: <LayoutDashboard size={16} />, roles: ['ADMIN', 'ESTOQUISTA', 'ATENDENTE', 'GESTOR'] },
    { to: '/pacientes', label: 'Pacientes', icon: <UserCheck size={16} />, roles: ['ADMIN', 'ATENDENTE', 'GESTOR'] },
    { to: '/medicos', label: 'Médicos', icon: <Stethoscope size={16} />, roles: ['ADMIN', 'GESTOR'] },
    { to: '/atendimentos', label: 'Atendimentos', icon: <Users size={16} />, roles: ['ADMIN', 'ATENDENTE', 'GESTOR'] },
    { to: '/insumos', label: 'Insumos', icon: <Beaker size={16} />, roles: ['ADMIN', 'ESTOQUISTA'] },
    { to: '/exames', label: 'Exames', icon: <ClipboardList size={16} />, roles: ['ADMIN'] },
    { to: '/exame-insumos', label: 'Ficha Técnica', icon: <Layers size={16} />, roles: ['ADMIN', 'ESTOQUISTA'] },
    { to: '/estoque', label: 'Movimentar', icon: <Box size={16} />, roles: ['ADMIN', 'ESTOQUISTA'] },
    { to: '/estoque/saldo', label: 'Saldo', icon: <BarChart3 size={16} />, roles: ['ADMIN', 'ESTOQUISTA', 'GESTOR'] },
    { to: '/estoque/movimentacoes', label: 'Extrato', icon: <History size={16} />, roles: ['ADMIN', 'ESTOQUISTA', 'GESTOR'] },
  ];

  // ADMIN visualiza todos os links do sistema
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
            <span>{link.label}</span>
          </Link>
        ))}
      </div>

      <div className="navbar-user">
        <div className="navbar-user-info" title={usuario?.email}>
          <UserIcon size={15} className="text-gray-500" />
          <span className="navbar-user-name">{usuario?.nome || 'Usuário'}</span>
          <span className="navbar-user-role">{perfil || 'PERFIL'}</span>
        </div>

        <button
          onClick={handleLogout}
          className="navbar-logout-btn"
          title="Sair do sistema"
          type="button"
        >
          <LogOut size={15} />
          <span>Sair</span>
        </button>
      </div>
    </nav>
  );
}