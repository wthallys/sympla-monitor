import axios from "axios";
import { eventoJaVerificado, listarEventosVerificados, salvarEventoVerificado } from "../db";
import { parseDataInicio } from "../utils/date";
import { enviarTelegram } from "./telegram";

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

export async function verificarEventos(): Promise<void> {

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
