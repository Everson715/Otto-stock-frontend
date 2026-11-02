export interface ExameMaisRealizado {
  exameId: number;
  _count: {
    id: number;
  };
  nome?: string;
}

export interface AtendimentosPorStatus {
  emAtendimento: number;
  finalizados: number;
  cancelados: number;
  finalizadosHoje: number;
  protocolosDistintosHoje: number;
}

export interface DashboardData {
  totalAtendimentos: number;
  estoqueCritico: number;
  examesMaisRealizados: ExameMaisRealizado[];
  atendimentosPorStatus?: AtendimentosPorStatus;
}

export interface MovimentacaoGraficoItem {
  data: string;
  entradasQtd: number;
  saidasQtd: number;
  ajustesLiquidoQtd: number;
  totalOperacoes: number;
}
