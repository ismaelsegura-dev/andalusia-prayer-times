export interface CityConfig {
  id: string;
  nombre_es: string;
  fundacion: string | null;
  col_pri: string; // Hex
  col_sec: string;
  col_acc: string;
  geo: string;
  contacto: string | null;
  web: string | null;
  logo: string;
  coords: {
    lat: number;
    lng: number;
    alt: number;
  };
}

export const CITIES: Record<string, CityConfig> = {
  granada: {
    id: "granada",
    nombre_es: "Granada",
    fundacion: null,
    col_pri: "#1B4332",
    col_sec: "#2D6A4F",
    col_acc: "#C8A84B",
    geo: "Granada (37°11'N / 3°36'O)  ·  Alt: 828 m  ·  UTC+1  ·  Crepúsculo: 18°",
    contacto: null,
    web: null,
    logo: "/logos/granada_header2.png",
    coords: {
      lat: 37.1773,
      lng: -3.5986,
      alt: 828
    }
  },
  sevilla: {
    id: "sevilla",
    nombre_es: "Sevilla",
    fundacion: "Fundación Mezquita de Sevilla",
    col_pri: "#6B1A0E",
    col_sec: "#A33020",
    col_acc: "#E8A020",
    geo: "Sevilla (37°23'N / 5°59'O)  ·  Alt: 150 m  ·  UTC+1  ·  Crepúsculo: 18°",
    contacto: "Plaza Ponce de León 9, 41003 Sevilla  ·  Tel: +34 954 022 979",
    web: "info@mezquitadesevilla.com  ·  mezquitadesevilla.com",
    logo: "/logos/sevilla_header2.webp",
    coords: {
      lat: 37.3891,
      lng: -5.9845,
      alt: 150
    }
  },
  barcelona: {
    id: "barcelona",
    nombre_es: "Barcelona",
    fundacion: "Fundación Mezquita de Barcelona",
    col_pri: "#002B5C",
    col_sec: "#0055A4",
    col_acc: "#F0B800",
    geo: "Barcelona (41°23'N / 2°09'E)  ·  Alt: 25 m  ·  UTC+1  ·  Crepúsculo: 18°",
    contacto: "Carrer Benet Mercadé 26 Local 1, 08012 Barcelona  ·  Tel: +34 935 312 292",
    web: "info@bcnmosque.com  ·  bcnmosque.com",
    logo: "/logos/barcelona.png", // Plaeholder if loaded later
    coords: {
      lat: 41.3851,
      lng: 2.1734,
      alt: 25
    }
  }
};
