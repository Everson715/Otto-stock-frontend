export interface ExameMaisRealizado {
  exameId: number;
  _count: {
    id: number;
  };
  nome?: string;
}

export interface DashboardData {
  totalAtendimentos: number;
  estoqueCritico: number;
  examesMaisRealizados: ExameMaisRealizado[];
}
