import * as adhan from 'adhan';

export type CityId = 'sevilla' | 'granada' | 'guadaira';

export interface City {
  id: CityId;
  name: string;
  coordinates: adhan.Coordinates;
}

export const CITIES: Record<CityId, City> = {
  sevilla: {
    id: 'sevilla',
    name: 'Fundación Mezquita de Sevilla',
    coordinates: new adhan.Coordinates(37.3891, -5.9845),
  },
  granada: {
    id: 'granada',
    name: 'Fundación Mezquita de Granada',
    coordinates: new adhan.Coordinates(37.1773, -3.5986),
  },
  guadaira: {
    id: 'guadaira',
    name: 'Mezquita de Guadaíra',
    coordinates: new adhan.Coordinates(37.3399, -5.8484),
  },
};

export const getPrayerTimes = (cityId: CityId, date: Date): adhan.PrayerTimes => {
  const city = CITIES[cityId];
  
  // Algoritmo de Precisión de las Mezquitas de Andalucía
  // Sin presets. Ángulos astronómicos puros: Fajr 18.0, Isha 17.0
  const params = new adhan.CalculationParameters('Other', 18.0, 17.0);
  
  // Cálculo Maliki estricto (Factor de sombra 1 equivale a Shafi)
  params.madhab = adhan.Madhab.Shafi; 
  
  // Ajuste de seguridad: +2 minutos en Maghrib
  params.adjustments.maghrib = 2;
  
  return new adhan.PrayerTimes(city.coordinates, date, params);
};
