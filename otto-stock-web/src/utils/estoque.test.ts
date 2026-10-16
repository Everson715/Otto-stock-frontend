import { getNivelEstoque, LIMIAR_ATENCAO } from './estoque';

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: esperado "${String(expected)}", obtido "${String(actual)}"`);
  }
}

export function runEstoqueTests() {
  // 1. saldo <= 0 -> critico ("Ruptura")
  const r1 = getNivelEstoque(0, 100);
  assertEqual(r1.status, 'critico', 'saldo 0 deve ser critico');
  assertEqual(r1.label, 'Ruptura', 'saldo 0 deve exibir Ruptura');
  assertEqual(r1.percentual, 0, 'saldo 0 deve ter 0%');

  const r2 = getNivelEstoque(-5, 0);
  assertEqual(r2.status, 'critico', 'saldo negativo com minimo 0 deve ser critico');
  assertEqual(r2.label, 'Ruptura', 'saldo negativo deve exibir Ruptura');

  // 2. saldo < quantidadeMinima -> critico ("Abaixo do mínimo")
  const r3 = getNivelEstoque(45, 100);
  assertEqual(r3.status, 'critico', 'saldo < minimo deve ser critico');
  assertEqual(r3.label, 'Abaixo do mínimo', 'saldo < minimo deve exibir Abaixo do mínimo');
  assertEqual(r3.percentual, 45, '45/100 deve ser 45%');

  // 3. quantidadeMinima <= saldo <= quantidadeMinima * 1.2 -> atencao ("Atenção")
  const r4 = getNivelEstoque(100, 100);
  assertEqual(r4.status, 'atencao', 'saldo == minimo deve ser atencao');
  assertEqual(r4.label, 'Atenção', 'saldo == minimo deve exibir Atenção');

  const r5 = getNivelEstoque(110, 100);
  assertEqual(r5.status, 'atencao', 'saldo 110 vs minimo 100 (<= 1.2x) deve ser atencao');
  assertEqual(r5.label, 'Atenção', 'saldo 110 vs 100 deve exibir Atenção');
  assertEqual(r5.percentual, 100, 'barra limitada a 100%');

  const r6 = getNivelEstoque(100 * LIMIAR_ATENCAO, 100);
  assertEqual(r6.status, 'atencao', 'saldo exatamente no limiar 1.2x deve ser atencao');

  // 4. demais -> conforme ("Conforme")
  const r7 = getNivelEstoque(121, 100);
  assertEqual(r7.status, 'conforme', 'saldo > 1.2x minimo deve ser conforme');
  assertEqual(r7.label, 'Conforme', 'saldo > 1.2x minimo deve exibir Conforme');

  // 5. quantidadeMinima = 0: nunca "atencao", só "critico" se saldo <= 0
  const r8 = getNivelEstoque(1, 0);
  assertEqual(r8.status, 'conforme', 'minimo 0 e saldo > 0 nunca é atencao, deve ser conforme');
  assertEqual(r8.percentual, 100, 'minimo 0 e saldo > 0 deve ter barra em 100%');

  const r9 = getNivelEstoque(0, 0);
  assertEqual(r9.status, 'critico', 'minimo 0 e saldo 0 deve ser critico');
  assertEqual(r9.label, 'Ruptura', 'minimo 0 e saldo 0 deve exibir Ruptura');
}
