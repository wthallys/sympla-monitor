import axios from "axios";
import { eventoJaVerificado, salvarEventoVerificado, listarEventosVerificados } from './db';

interface EventoSympla {
  id: number;
  name: string;
  location: object;
  start_date_formats: object;
  url: string;
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
        evento.name
          .toLowerCase()
          .includes(process.env.EVENTO_CHAVE!.toLocaleLowerCase()) &&
        !eventoJaVerificado(evento.id)
      ) {
        const mensagem = `🎉 Novo evento encontrado: ${evento.name}\n🔗 ${evento.url}`;
        // console.log(mensagem);

        await enviarTelegram(mensagem);
        salvarEventoVerificado(evento.id, evento.name, evento.url);
        console.log("✅ Evento salvo!");
      }
    }

  } catch (error) {
    console.error("❌ Erro na consulta Sympla:", (error as Error).message);
  }

  console.log(listarEventosVerificados());
}

verificarEventos();
