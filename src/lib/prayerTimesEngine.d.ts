export function calcularHorariosOracion(
  lat: number, 
  lng: number, 
  alt: number, 
  date: Date
): {
  utc: { fajr: string, shuruq: string, dhuhr: string, asr: string, maghrib: string, isha: string },
  local: { fajr: string, shuruq: string, dhuhr: string, asr: string, maghrib: string, isha: string },
  meta: any
};
