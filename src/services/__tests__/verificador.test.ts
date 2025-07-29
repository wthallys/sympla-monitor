import axios from "axios";
import * as db from "../../db";
import * as telegram from "../telegram";
import { verificarEventos } from "../verificador";

jest.mock("axios");
jest.mock("../../db");
jest.mock("../telegram");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedDb = db as jest.Mocked<typeof db>;
const mockedTelegram = telegram as jest.Mocked<typeof telegram>;

describe("verificarEventos", () => {
  beforeAll(() => {
    process.env.EVENTO_CHAVE = "evento";
  });

  afterAll(() => {
    delete process.env.EVENTO_CHAVE;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve processar e salvar novos eventos, enviando notificações", async () => {
    // Mock resposta da API Sympla
    mockedAxios.post.mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            name: "Evento Teste",
            location: {},
            start_date_formats: { pt: "05/09/2025", en: "Fri, 05 Sep - 2025 · 18:00", es: "" },
            url: "http://evento.com",
          },
        ],
      },
    });

    // Mock eventoJaVerificado - diz que evento ainda não foi verificado
    mockedDb.eventoJaVerificado.mockResolvedValue(false);

    // Mocks das outras funções só para garantir que não lançam erros
    mockedDb.salvarEventoVerificado.mockResolvedValue();
    mockedTelegram.enviarTelegram.mockResolvedValue();
    mockedDb.listarEventosVerificados.mockResolvedValue([]);

    await verificarEventos();

    // Verifica se fez a checagem no DB
    expect(mockedDb.eventoJaVerificado).toHaveBeenCalledWith(1);

    // Verifica que notificou o Telegram
    expect(mockedTelegram.enviarTelegram).toHaveBeenCalledWith(
      expect.stringContaining("Evento Teste")
    );

    // Verifica que salvou no DB
    expect(mockedDb.salvarEventoVerificado).toHaveBeenCalledWith(
      1,
      "Evento Teste",
      "http://evento.com",
      "2025-09-05T18:00:00"
    );

    // Verifica que listou os eventos verificados no final
    expect(mockedDb.listarEventosVerificados).toHaveBeenCalled();
  });

  it("não deve enviar notificação se evento já foi verificado", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        data: [
          {
            id: 2,
            name: "Outro Evento",
            location: {},
            start_date_formats: { pt: "06/09/2025", en: "Fri, 06 Sep - 2025 · 18:00", es: "" },
            url: "http://outroevento.com",
          },
        ],
      },
    });

    // Evento já verificado
    mockedDb.eventoJaVerificado.mockResolvedValue(true);

    mockedDb.salvarEventoVerificado.mockResolvedValue();
    mockedTelegram.enviarTelegram.mockResolvedValue();
    mockedDb.listarEventosVerificados.mockResolvedValue([]);

    await verificarEventos();

    expect(mockedTelegram.enviarTelegram).not.toHaveBeenCalled();
    expect(mockedDb.salvarEventoVerificado).not.toHaveBeenCalled();
  });
});
