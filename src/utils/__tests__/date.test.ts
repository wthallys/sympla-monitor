import { parseDataInicio } from "../date";

describe("parseDataInicio", () => {
  it("deve converter data válida corretamente", () => {
    const input = "Fri, 05 Sep - 2025 · 18:00";
    const output = parseDataInicio(input);
    expect(output).toBe("2025-09-05T18:00:00");
  });

  it("deve retornar null para formato inválido", () => {
    expect(parseDataInicio("invalid date string")).toBeNull();
  });

  it("deve retornar null para mês inválido", () => {
    expect(parseDataInicio("05 Xxx - 2025 · 18:00")).toBeNull();
  });
});
