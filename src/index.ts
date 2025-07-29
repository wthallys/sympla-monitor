import { inicializarTabela } from './db';
import { verificarEventos } from './services/verificador';

async function main() {
  await inicializarTabela();
  await verificarEventos();
}

main();