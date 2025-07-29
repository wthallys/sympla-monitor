import axios from "axios";

export async function enviarTelegram(mensagem: string): Promise<void> {
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
