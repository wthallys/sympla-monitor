import axios from "axios";
import { eventoJaVerificado, salvarEventoVerificado, listarEventosVerificados, inicializarTabela } from './db';

interface EventoSympla {
  id: number;
  name: string;
  location: object;
  start_date_formats: {
    pt: string;
    en: string; // Exemplo: 'Fri, 05 Sep - 2025 · 18:00'
    es: string;
  };
  url: string;
}

function parseDataInicio(rawDate: string): string | null {
  const regex = /(\d{2}) (\w{3}) - (\d{4}) · (\d{2}):(\d{2})/;
  const match = rawDate.match(regex);

  if (!match) return null;

  const [, day, monthStr, year, hour, minute] = match;

  const months: { [key: string]: string } = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04",
    May: "05", Jun: "06", Jul: "07", Aug: "08",
    Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };

  const month = months[monthStr];
  if (!month) return null;

  return `${year}-${month}-${day}T${hour}:${minute}:00`;
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

  try {
    const res = await axios.post(process.env.SYMPLA_URL!, {
      service: process.env.SYMPLA_SERVICE,
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
        evento.name
          .toLowerCase()
          .includes(process.env.EVENTO_CHAVE!.toLocaleLowerCase()) &&
        !(await eventoJaVerificado(evento.id))
      ) {
        const rawStartDate = evento.start_date_formats?.en;
        const dataInicio = rawStartDate ? parseDataInicio(rawStartDate) : null;

        const rawStartDatePt = evento.start_date_formats?.pt;
        const mensagem = `🎉 Novo evento encontrado: ${evento.name}\n📅 Início: ${rawStartDatePt}\n🔗 ${evento.url}`;

        await enviarTelegram(mensagem);
        await salvarEventoVerificado(evento.id, evento.name, evento.url, dataInicio);
        console.log("✅ Evento salvo!");
      }
    }

  } catch (error) {
    console.error("❌ Erro na consulta Sympla:", (error as Error).message);
  }

  console.log(await listarEventosVerificados());
}

async function main() {
  await inicializarTabela();
  await verificarEventos();
}

main();