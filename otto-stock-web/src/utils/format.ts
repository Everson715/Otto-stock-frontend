/**
 * Mascara o CPF conforme LGPD para exibição fora de /pacientes: •••.456.789-••
 */
export function mascararCpf(valor: string | null | undefined): string {
  if (!valor) return '•••.•••.•••-••';
  const digitos = valor.replace(/\D/g, '');
  if (digitos.length !== 11) {
    return '•••.•••.•••-••';
  }
  return `•••.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-••`;
}

/**
 * Formata o CPF completo (000.000.000-00) — uso exclusivo em /pacientes.
 */
export function formatarCpfCompleto(valor: string | null | undefined): string {
  if (!valor) return '';
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  if (digitos.length <= 3) return digitos;
  if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
  if (digitos.length <= 9) {
    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
  }
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9, 11)}`;
}

/**
 * Formata o CRM do médico (opcional no schema).
 */
export function formatarCrm(crm: string | null | undefined): string {
  const limpo = crm?.trim();
  return limpo ? limpo : 'CRM não informado';
}

/**
 * Calcula a idade em anos completos a partir de Paciente.dataNascimento (opcional).
 * Se ausente ou inválida, retorna null para que a UI omita o campo.
 */
export function calcularIdade(
  dataNascimento: string | Date | null | undefined
): number | null {
  if (!dataNascimento) return null;
  const nascimento =
    typeof dataNascimento === 'string'
      ? new Date(dataNascimento)
      : dataNascimento;
  if (Number.isNaN(nascimento.getTime())) return null;

  const hoje = new Date();
  let idade = hoje.getUTCFullYear() - nascimento.getUTCFullYear();
  const mesDiff = hoje.getUTCMonth() - nascimento.getUTCMonth();
  if (
    mesDiff < 0 ||
    (mesDiff === 0 && hoje.getUTCDate() < nascimento.getUTCDate())
  ) {
    idade--;
  }
  return idade >= 0 ? idade : null;
}

/**
 * Retorna string de tempo relativo em português calculado no cliente (ex.: "Há 28 minutos").
 */
export function tempoRelativo(
  data: string | Date | number | null | undefined
): string {
  if (!data) return '—';
  const alvo =
    typeof data === 'number'
      ? new Date(data)
      : typeof data === 'string'
      ? new Date(data)
      : data;
  if (Number.isNaN(alvo.getTime())) return '—';

  const diffSegundos = Math.max(
    0,
    Math.floor((Date.now() - alvo.getTime()) / 1000)
  );

  if (diffSegundos < 5) return 'Agora';
  if (diffSegundos < 60) return `Há ${diffSegundos}s`;

  const diffMinutos = Math.floor(diffSegundos / 60);
  if (diffMinutos === 1) return 'Há 1 minuto';
  if (diffMinutos < 60) return `Há ${diffMinutos} minutos`;

  const diffHoras = Math.floor(diffMinutos / 60);
  if (diffHoras === 1) return 'Há 1 hora';
  if (diffHoras < 24) return `Há ${diffHoras} horas`;

  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias === 1) return 'Há 1 dia';
  if (diffDias < 30) return `Há ${diffDias} dias`;

  return alvo.toLocaleDateString('pt-BR');
}

/**
 * Formata números com separador de milhar em pt-BR.
 */
export function formatarNumero(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '0';
  return new Intl.NumberFormat('pt-BR').format(valor);
}
