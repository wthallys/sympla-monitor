import Database from "better-sqlite3";

console.log("🛠️ Inicializando conexão com o banco de dados...");
const db = new Database("./data.db");

export interface EventoVerificado {
id: number;
nome: string;
url: string;
data_verificado: string;
}

console.log("📦 Criando tabela 'eventos_verificados' (se não existir)...");

db.prepare(`
CREATE TABLE IF NOT EXISTS eventos_verificados (
    id INTEGER PRIMARY KEY,
    nome TEXT,
    url TEXT,
    data_verificado DATETIME DEFAULT CURRENT_TIMESTAMP
)
`).run();

console.log("✅ Tabela 'eventos_verificados' pronta.\n");

export function eventoJaVerificado(id: number): boolean {
  const row = db.prepare(`SELECT 1 FROM eventos_verificados WHERE id = ?`).get(id);
  return !!row;
}

export function salvarEventoVerificado(id: number, nome: string, url: string): void {
  try {
    db.prepare(`INSERT OR IGNORE INTO eventos_verificados (id, nome, url) VALUES (?, ?, ?)`).run(id, nome, url);
  } catch (err) {
    console.error('Erro ao salvar evento:', (err as Error).message);
  }
}

export function listarEventosVerificados(): EventoVerificado[] {
  const stmt = db.prepare('SELECT id, nome, url, data_verificado FROM eventos_verificados ORDER BY data_verificado DESC');
  return stmt.all() as EventoVerificado[];
}