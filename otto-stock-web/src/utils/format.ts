/**
 * Aplica máscara de CPF no padrão 000.000.000-00.
 */
export function mascararCpf(valor: string | null | undefined): string {
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
 * Calcula a idade em anos completos a partir de uma data de nascimento (ISO ou Date).
 */
export function calcularIdade(dataNascimento: string | Date | null | undefined): number | null {
  if (!dataNascimento) return null;
  const nascimento = typeof dataNascimento === 'string' ? new Date(dataNascimento) : dataNascimento;
  if (Number.isNaN(nascimento.getTime())) return null;

  const hoje = new Date();
  let idade = hoje.getUTCFullYear() - nascimento.getUTCFullYear();
  const mesDiff = hoje.getUTCMonth() - nascimento.getUTCMonth();
  if (mesDiff < 0 || (mesDiff === 0 && hoje.getUTCDate() < nascimento.getUTCDate())) {
    idade--;
  }
  return idade >= 0 ? idade : null;
}

/**
 * Retorna string de tempo relativo em português (ex.: "Agora", "Há 42s", "Há 15 min", "Há 2h", "Há 3d").
 */
export function tempoRelativo(data: string | Date | number | null | undefined): string {
  if (!data) return '—';
  const alvo = typeof data === 'number' ? new Date(data) : typeof data === 'string' ? new Date(data) : data;
  if (Number.isNaN(alvo.getTime())) return '—';

  const diffSegundos = Math.max(0, Math.floor((Date.now() - alvo.getTime()) / 1000));

  if (diffSegundos < 5) return 'Agora';
  if (diffSegundos < 60) return `Há ${diffSegundos}s`;

  const diffMinutos = Math.floor(diffSegundos / 60);
  if (diffMinutos < 60) return `Há ${diffMinutos} min`;

  const diffHoras = Math.floor(diffMinutos / 60);
  if (diffHoras < 24) return `Há ${diffHoras}h`;

  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias < 30) return `Há ${diffDias}d`;

  return alvo.toLocaleDateString('pt-BR');
}

/**
 * Formata números com separador de milhar em pt-BR.
 */
export function formatarNumero(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '0';
  return new Intl.NumberFormat('pt-BR').format(valor);
}
