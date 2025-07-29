export function parseDataInicio(rawDate: string): string | null {
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
