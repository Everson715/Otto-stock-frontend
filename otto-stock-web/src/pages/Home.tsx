import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  ClipboardList,
  ArrowRight,
  RefreshCw,
  Loader2,
  TrendingUp,
  History,
  Activity,
  Box,
  Stethoscope,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import { api } from '../api/api';
import type { DashboardData } from '../types/dashboard';
import type { Exame } from '../types/exame';
import { Button } from '../components/ui/Button';

interface MovimentacaoRecente {
  id: number;
  tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
  quantidade: number;
  motivo?: string;
  createdAt: string;
  insumo?: {
    nome: string;
  };
}

export function Home() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [atendimentosHoje, setAtendimentosHoje] = useState<number>(0);
  const [examesMap, setExamesMap] = useState<Record<number, string>>({});
  const [movimentacoesRecentes, setMovimentacoesRecentes] = useState<MovimentacaoRecente[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function carregarDashboard() {
    setIsLoading(true);
    try {
      // 1. Dados consolidados de relatório
      const resDash = await api.get<DashboardData>('/relatorios/dashboard');
      setDashboard(resDash.data);

      // 2. Mapeamento de exames para exibir os nomes no ranking
      const resExames = await api.get('/exames');
      const examesList: Exame[] = Array.isArray(resExames.data) ? resExames.data : resExames.data.items || [];
      const map: Record<number, string> = {};
      examesList.forEach((e) => {
        map[e.id] = e.nome;
      });
      setExamesMap(map);

      // 3. Atendimentos do dia de hoje
      const hojeInicio = new Date();
      hojeInicio.setHours(0, 0, 0, 0);
      const hojeFim = new Date();
      hojeFim.setHours(23, 59, 59, 999);

      try {
        const resHoje = await api.get('/atendimentos', {
          params: {
            startDate: hojeInicio.toISOString(),
            endDate: hojeFim.toISOString(),
            limit: 1,
          },
        });
        setAtendimentosHoje(resHoje.data?.total ?? resHoje.data?.items?.length ?? 0);
      } catch {
        setAtendimentosHoje(0);
      }

      // 4. Últimas movimentações de estoque
      try {
        const resMov = await api.get('/estoque/movimentacoes', {
          params: { limit: 5 },
        });
        const items = Array.isArray(resMov.data) ? resMov.data : resMov.data.items || [];
        setMovimentacoesRecentes(items);
      } catch {
        setMovimentacoesRecentes([]);
      }
    } catch {
      toast.error('Erro ao carregar métricas do dashboard');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  const totalExamesNoGrafico = (dashboard?.examesMaisRealizados || []).reduce(
    (acc, curr) => acc + (curr._count?.id || 0),
    0
  );

  return (
    <div className="flex flex-col gap-6 p-4 text-left">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2>Painel Geral da Clínica</h2>
          <p className="text-sm text-gray-500">
            Métricas de operação, atendimentos e posição de estoque em tempo real
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={carregarDashboard}
          disabled={isLoading}
          leftIcon={<RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Atualizar Dados
        </Button>
      </div>

      {isLoading && !dashboard ? (
        <div className="flex flex-col items-center justify-center p-16 gap-3">
          <Loader2 className="animate-spin size-8 text-blue-500" />
          <span className="text-sm text-gray-500">Consolidando relatórios clínicos...</span>
        </div>
      ) : (
        <>
          {/* Cartões de Indicadores Chave (KPIs) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* Total Atendimentos */}
            <div
              style={{
                background: 'white',
                padding: '1.25rem',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-500">Total de Atendimentos</span>
                <Users className="size-5 text-blue-600" />
              </div>
              <strong style={{ fontSize: '1.875rem', color: '#111827' }}>
                {dashboard?.totalAtendimentos ?? 0}
              </strong>
              <div className="mt-2 text-xs text-gray-500">Acumulado geral do sistema</div>
            </div>

            {/* Atendimentos do Dia */}
            <div
              style={{
                background: 'white',
                padding: '1.25rem',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-500">Atendimentos Hoje</span>
                <Activity className="size-5 text-indigo-600" />
              </div>
              <strong style={{ fontSize: '1.875rem', color: '#4f46e5' }}>
                {atendimentosHoje}
              </strong>
              <div className="mt-2 text-xs text-gray-500">Iniciados na data de hoje</div>
            </div>

            {/* Estoque Crítico */}
            <div
              style={{
                background: (dashboard?.estoqueCritico ?? 0) > 0 ? '#fef2f2' : 'white',
                padding: '1.25rem',
                borderRadius: '0.75rem',
                border:
                  (dashboard?.estoqueCritico ?? 0) > 0
                    ? '1px solid #fecaca'
                    : '1px solid #e5e7eb',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <span
                  className={`text-sm font-medium ${
                    (dashboard?.estoqueCritico ?? 0) > 0 ? 'text-red-700' : 'text-gray-500'
                  }`}
                >
                  Estoque Crítico
                </span>
                <AlertTriangle
                  className={`size-5 ${
                    (dashboard?.estoqueCritico ?? 0) > 0 ? 'text-red-600' : 'text-gray-400'
                  }`}
                />
              </div>
              <strong
                style={{
                  fontSize: '1.875rem',
                  color: (dashboard?.estoqueCritico ?? 0) > 0 ? '#b91c1c' : '#111827',
                }}
              >
                {dashboard?.estoqueCritico ?? 0}
              </strong>
              <div className="mt-2 text-xs">
                {(dashboard?.estoqueCritico ?? 0) > 0 ? (
                  <Link
                    to="/estoque/saldo"
                    className="text-red-700 font-semibold inline-flex items-center gap-1 hover:underline"
                  >
                    Ver insumos abaixo do mínimo <ArrowRight className="size-3" />
                  </Link>
                ) : (
                  <span className="text-gray-500">Todos os níveis regulares</span>
                )}
              </div>
            </div>

            {/* Acesso aos Cadastros */}
            <div
              style={{
                background: 'white',
                padding: '1.25rem',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-500">Módulos Rápidos</span>
                <TrendingUp className="size-5 text-emerald-600" />
              </div>
              <div className="flex gap-2 flex-wrap mt-1">
                <Link
                  to="/pacientes"
                  className="btn btn-secondary text-xs"
                  style={{ padding: '0.35rem 0.6rem', textDecoration: 'none' }}
                >
                  <UserCheck className="size-3" /> Pacientes
                </Link>
                <Link
                  to="/medicos"
                  className="btn btn-secondary text-xs"
                  style={{ padding: '0.35rem 0.6rem', textDecoration: 'none' }}
                >
                  <Stethoscope className="size-3" /> Médicos
                </Link>
                <Link
                  to="/exame-insumos"
                  className="btn btn-secondary text-xs"
                  style={{ padding: '0.35rem 0.6rem', textDecoration: 'none' }}
                >
                  <Box className="size-3" /> Ficha Técnica
                </Link>
              </div>
            </div>
          </div>

          {/* Seção Gráfica e Listagem Analítica */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Gráfico / Ranking: Exames Mais Realizados */}
            <div
              style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="size-5 text-blue-600" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                    Exames Mais Realizados
                  </h3>
                </div>
                <span className="text-xs text-gray-400">Cruzado com /api/exames</span>
              </div>

              {(!dashboard?.examesMaisRealizados || dashboard.examesMaisRealizados.length === 0) ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  Nenhum atendimento finalizado registrado até o momento.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {dashboard.examesMaisRealizados.map((item) => {
                    const nome = examesMap[item.exameId] || `Exame #${item.exameId}`;
                    const count = item._count.id;
                    const percent =
                      totalExamesNoGrafico > 0
                        ? Math.round((count / totalExamesNoGrafico) * 100)
                        : 0;

                    return (
                      <div key={item.exameId} className="flex flex-col gap-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">{nome}</span>
                          <span className="text-gray-500 font-semibold">
                            {count} ({percent}%)
                          </span>
                        </div>
                        <div
                          style={{
                            height: 10,
                            background: '#f3f4f6',
                            borderRadius: 999,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${percent}%`,
                              height: '100%',
                              background: '#3b82f6',
                              borderRadius: 999,
                              transition: 'width 0.5s ease',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Painel de Movimentações Recentes */}
            <div
              style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <History className="size-5 text-purple-600" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                    Últimas Movimentações de Estoque
                  </h3>
                </div>
                <Link
                  to="/estoque/movimentacoes"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Extrato Completo
                </Link>
              </div>

              {movimentacoesRecentes.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  Nenhuma movimentação registrada no histórico.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {movimentacoesRecentes.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.75rem',
                        background: '#f9fafb',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            m.tipo === 'ENTRADA'
                              ? 'badge-ok'
                              : m.tipo === 'SAIDA'
                              ? 'badge-alerta'
                              : 'status-badge status-pendente'
                          }
                          style={{ fontSize: '0.7rem' }}
                        >
                          {m.tipo}
                        </span>
                        <span className="font-medium text-gray-800">
                          {m.insumo?.nome || `Insumo #${m.id}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <strong
                          style={{
                            color:
                              m.tipo === 'ENTRADA'
                                ? '#047857'
                                : m.tipo === 'SAIDA'
                                ? '#b91c1c'
                                : '#374151',
                          }}
                        >
                          {m.tipo === 'SAIDA' ? `-${m.quantidade}` : `+${m.quantidade}`}
                        </strong>
                        <span className="text-xs text-gray-400">
                          {new Date(m.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}