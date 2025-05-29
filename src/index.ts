import axios from "axios";
import { CronJob } from "cron";
import fs from "fs";

interface EventoSympla {
  id: number;
  name: string;
  location: object;
  start_date_formats: object;
  url: string;
}

const eventosCachePath = "./eventos_verificados.json";

function lerEventosVerificados(): number[] {
  if (fs.existsSync(eventosCachePath)) {
    return JSON.parse(fs.readFileSync(eventosCachePath, "utf-8"));
  }
  return [];
}

function salvarEventosVerificados(lista: number[]): void {
  fs.writeFileSync(eventosCachePath, JSON.stringify(lista, null, 2));
}

async function enviarTelegram(mensagem: string): Promise<void> {
  try {
    await axios.get(
      `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`,
      {
        params: {
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: mensagem,
        },
      }
    );
    console.log("🔔 Notificação enviada!");
  } catch (error) {
    console.error("❌ Erro ao enviar mensagem:", (error as Error).message);
  }
}

async function verificarEventos(): Promise<void> {
  const verificados = lerEventosVerificados();

  try {
    const res = await axios.post("https://www.sympla.com.br/api/v1/search", {
      service: "/v4/search",
      params: {
        only: "name,location,id,start_date_formats,url",
        organizer_id: process.env.ORGANIZER_ID,
        sort: "date",
        limit: "24",
        page: 1,
      },
      ignoreLocation: true,
    });

    const eventos: EventoSympla[] = res.data?.data || [];

    for (const evento of eventos) {
      if (
        evento.name.toLowerCase().includes(process.env.EVENTO_CHAVE!.toLocaleLowerCase()) &&
        !verificados.includes(evento.id)
      ) {
        const mensagem = `🎉 Novo evento encontrado: ${evento.name}\n🔗 ${evento.url}`;
        // console.log(mensagem);

        await enviarTelegram(mensagem);
        verificados.push(evento.id);
      }
    }

    salvarEventosVerificados(verificados);
  } catch (error) {
    console.error("❌ Erro na consulta Sympla:", (error as Error).message);
  }
}

verificarEventos();

// Cron: 3x ao dia (0h, 8h, 16h)
// const job = new CronJob("0 0,8,16 * * *", verificarEventos);
// job.start();
