import { Pool } from "pg";

console.log("🛠️ Inicializando conexão com PostgreSQL...");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export interface EventoVerificado {
  id: number;
  nome: string;
  url: string;
  data_verificado: string;
  data_inicio: string | null;
}

export async function inicializarTabela() {
  console.log("📦 Criando tabela 'eventos_verificados' (se não existir)...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS eventos_verificados (
      id INTEGER PRIMARY KEY,
      nome TEXT,
      url TEXT,
      data_inicio TIMESTAMP,
      data_verificado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    ALTER TABLE eventos_verificados 
    ADD COLUMN IF NOT EXISTS data_inicio TIMESTAMP
    `);

  console.log("✅ Tabela 'eventos_verificados' pronta.\n");
}

export async function eventoJaVerificado(id: number): Promise<boolean> {
  const res = await pool.query(`SELECT 1 FROM eventos_verificados WHERE id = $1`, [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function salvarEventoVerificado(id: number, nome: string, url: string, data_inicio: string | null): Promise<void> {
  try {
    await pool.query(`
      INSERT INTO eventos_verificados (id, nome, url, data_inicio)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO NOTHING
    `, [id, nome, url, data_inicio]);
  } catch (err) {
    console.error("Erro ao salvar evento:", (err as Error).message);
  }
}

export async function listarEventosVerificados(): Promise<EventoVerificado[]> {
  const res = await pool.query(`
    SELECT id, nome, url, data_verificado, data_inicio
    FROM eventos_verificados
    ORDER BY data_verificado DESC
  `);
  return res.rows;
}