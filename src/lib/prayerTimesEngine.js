/**
 * ============================================================
 *  MOTOR DE HORARIOS DE ORACIÓN — Vanilla JS, sin dependencias
 *  Rigor astronómico completo. Soberanía local total.
 *  Compatible: Node.js / Browser / cualquier entorno JS
 * ============================================================
 *
 *  ENTRADAS: lat (°), lng (°), alt (m), date (Date)
 *  SALIDA:   { fajr, shuruq, dhuhr, asr, maghrib, isha } → "HH:MM"
 *
 *  Fiqh:     Maliki (Asr factor 1: sombra = altura del objeto)
 *  Ángulos:  Fajr 18°, Isha 17° bajo el horizonte
 *  Maghrib:  Ocaso + 2 minutos de margen de seguridad
 * ============================================================
 */

// ─────────────────────────────────────────────
//  UTILIDADES MATEMÁTICAS BÁSICAS
// ─────────────────────────────────────────────

/** Grados → Radianes */
const toRad = (deg) => (deg * Math.PI) / 180;

/** Radianes → Grados */
const toDeg = (rad) => (rad * 180) / Math.PI;

/** Normaliza un ángulo al rango [0, 360) */
const normalize360 = (angle) => ((angle % 360) + 360) % 360;

/** Normaliza un ángulo al rango [-180, 180] */
const normalize180 = (angle) => {
  angle = normalize360(angle);
  return angle > 180 ? angle - 360 : angle;
};

/**
 * arccot(x) = atan(1/x) — No existe de forma nativa en JS
 * Necesaria para el cálculo de Asr (Fiqh Maliki)
 */
const arccot = (x) => Math.atan(1 / x);

/**
 * Convierte horas decimales (ej. 14.5) a "HH:MM"
 * Aplica módulo 24 para manejar medianoche sin errores
 */
const decimalHoursToHHMM = (hours) => {
  // Normalizar al rango [0, 24)
  hours = ((hours % 24) + 24) % 24;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  // Caso borde: si los minutos se redondean a 60
  if (m === 60) {
    return `${String((h + 1) % 24).padStart(2, "0")}:00`;
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

// ─────────────────────────────────────────────
//  ASTRONOMÍA SOLAR — El núcleo del motor
// ─────────────────────────────────────────────

/**
 * Calcula los parámetros solares para una fecha y posición dadas.
 *
 * Basado en el algoritmo de Jean Meeus ("Astronomical Algorithms")
 * con correcciones de VSOP87 simplificadas.
 *
 * @param {number} lat  - Latitud en grados (+ Norte, - Sur)
 * @param {number} lng  - Longitud en grados (+ Este, - Oeste)
 * @param {number} alt  - Altitud en metros sobre el nivel del mar
 * @param {Date}   date - Objeto Date de JavaScript (hora local)
 * @returns {Object}    - Parámetros solares completos
 */
function calcularParametrosSolares(lat, lng, alt, date) {
  // ── Número de días Julianos desde J2000.0 ──
  // Calculado a partir de UTC para independencia de zona horaria local
  const JD = date.getTime() / 86400000 + 2440587.5;
  const T = (JD - 2451545.0) / 36525; // Siglos Julianos desde J2000.0

  // ── Longitud media del Sol (grados) ──
  const L0 = normalize360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);

  // ── Anomalía media del Sol (grados) ──
  const M = normalize360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const Mrad = toRad(M);

  // ── Centro de la ecuación del Sol (corrección de la elipse orbital) ──
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
    0.000289 * Math.sin(3 * Mrad);

  // ── Longitud verdadera del Sol ──
  const sunLon = L0 + C; // Longitud eclíptica verdadera

  // ── Longitud del nodo ascendente de la Luna (para nutación) ──
  const omega = normalize360(125.04 - 1934.136 * T);

  // ── Longitud aparente (corrección de aberración y nutación) ──
  const lambdaApp = sunLon - 0.00569 - 0.00478 * Math.sin(toRad(omega));

  // ── Oblicuidad de la eclíptica ──
  const epsilon0 = 23.439291111 - 0.013004167 * T - 0.0000001639 * T * T + 0.0000005036 * T * T * T;
  const epsilon = epsilon0 + 0.00256 * Math.cos(toRad(omega)); // Oblicuidad aparente

  // ── Ascensión recta y Declinación ──
  const lambdaRad = toRad(lambdaApp);
  const epsilonRad = toRad(epsilon);

  const sinDelta = Math.sin(epsilonRad) * Math.sin(lambdaRad);
  const delta = toDeg(Math.asin(sinDelta)); // Declinación solar (grados)

  // ── Ecuación del Tiempo (minutos) ──
  // Diferencia entre tiempo solar verdadero y tiempo solar medio
  const y = Math.tan(epsilonRad / 2) ** 2;
  const L0rad = toRad(L0);
  const eqTime =
    toDeg(
      y * Math.sin(2 * L0rad) -
      2 * 0.016708634 * Math.sin(Mrad) +
      4 * 0.016708634 * y * Math.sin(Mrad) * Math.cos(2 * L0rad) -
      0.5 * y * y * Math.sin(4 * L0rad) -
      1.25 * 0.016708634 * 0.016708634 * Math.sin(2 * Mrad)
    ) * 4; // Conversión de grados a minutos de tiempo

  // ── Corrección por altitud ──
  // El horizonte efectivo se deprime según la altura del observador
  // Fórmula: -0.0347 * sqrt(alt) grados (aproximación estándar)
  const altitudCorr = -0.0347 * Math.sqrt(alt);

  return {
    delta,      // Declinación solar (grados)
    eqTime,     // Ecuación del tiempo (minutos)
    altitudCorr // Corrección por altitud (grados)
  };
}

// ─────────────────────────────────────────────
//  CÁLCULO DE ÁNGULOS HORARIOS
// ─────────────────────────────────────────────

/**
 * Calcula el ángulo horario para una elevación solar dada.
 *
 * La fórmula astronómica fundamental:
 *   cos(H) = (sin(elev) - sin(lat)·sin(delta)) / (cos(lat)·cos(delta))
 *
 * Si el valor de cos(H) está fuera de [-1, 1], el sol nunca
 * alcanza esa elevación (fenómeno circumpolar). Devuelve null.
 *
 * @param {number} lat   - Latitud del observador (grados)
 * @param {number} delta - Declinación solar (grados)
 * @param {number} elev  - Elevación solar objetivo (grados, negativo = bajo horizonte)
 * @returns {number|null} - Ángulo horario en horas, o null si es circumpolar
 */
function calcularAnguloHorario(lat, delta, elev) {
  const latRad = toRad(lat);
  const deltaRad = toRad(delta);
  const elevRad = toRad(elev);

  const cosH =
    (Math.sin(elevRad) - Math.sin(latRad) * Math.sin(deltaRad)) /
    (Math.cos(latRad) * Math.cos(deltaRad));

  // Fenómeno circumpolar: sol siempre por encima o siempre por debajo
  if (cosH < -1 || cosH > 1) return null;

  return toDeg(Math.acos(cosH)) / 15; // Convertir grados a horas (÷15)
}

/**
 * Convierte un ángulo horario en hora UTC decimal
 *
 * Mediodía solar (tránsito) = 12h - eqTime/60 + (lngStd - lng)/15
 * donde lngStd = 0 para UTC
 *
 * @param {number} angoloHorario - Ángulo horario en horas
 * @param {number} transitoUTC   - Hora de tránsito solar en UTC decimal
 * @param {boolean} esPuesta     - true para puesta (+ H), false para salida (- H)
 * @returns {number} - Hora UTC decimal
 */
function anguloAHoraUTC(angoloHorario, transitoUTC, esPuesta) {
  return esPuesta ? transitoUTC + angoloHorario : transitoUTC - angoloHorario;
}

// ─────────────────────────────────────────────
//  FUNCIÓN PRINCIPAL EXPORTABLE
// ─────────────────────────────────────────────

/**
 * Calcula los horarios de los 5 rezos + Shuruq
 *
 * @param {number} lat  - Latitud en grados (Norte positivo)
 * @param {number} lng  - Longitud en grados (Este positivo)
 * @param {number} alt  - Altitud en metros
 * @param {Date}   date - Fecha para el cálculo
 * @returns {Object} Horarios en formato "HH:MM" (hora UTC) y también en hora local
 *
 * NOTA IMPORTANTE SOBRE ZONA HORARIA:
 * Este motor devuelve horas en UTC. Para mostrar en hora local,
 * debes añadir el offset UTC de tu zona horaria.
 * Ejemplo Madrid (UTC+1 en invierno, UTC+2 en verano):
 *   const offsetHoras = date.getTimezoneOffset() / -60;
 */
function calcularHorariosOracion(lat, lng, alt, date) {
  // ── 1. Obtener parámetros astronómicos del día ──
  const { delta, eqTime, altitudCorr } = calcularParametrosSolares(lat, lng, alt, date);

  // ── 2. Calcular el tránsito solar (mediodía solar) ──
  // Dhuhr = hora en que el sol cruza el meridiano
  // Fórmula: 12 - eqTime(min)/60 - lng/15
  // El "- lng/15" convierte longitud geográfica a horas de diferencia desde meridiano UTC
  const transitoUTC = 12 - eqTime / 60 - lng / 15;

  // ── 3. Definir las elevaciones solares para cada oración ──
  //
  // Elevación = 0° → horizonte astronómico (Shuruq/Maghrib base)
  // Elevación negativa → sol bajo el horizonte (Fajr/Isha)
  //
  // Refracción atmosférica estándar en el horizonte: +0.5667°
  // Esta hace que el sol sea visible aunque geométricamente esté bajo el horizonte
  const refraccion = 0.5667; // Grados de refracción en el horizonte
  const elevHorizonte = -(refraccion + altitudCorr); // Horizonte corregido

  const elevFajr = -18.0;  // Crepúsculo astronómico (ángulo Fajr)
  const elevIsha = -17.0;  // Crepúsculo astronómico (ángulo Isha)

  // ── 4. Calcular ángulos horarios ──
  const HHorizonte = calcularAnguloHorario(lat, delta, elevHorizonte);
  const HFajr = calcularAnguloHorario(lat, delta, elevFajr);
  const HIsha = calcularAnguloHorario(lat, delta, elevIsha);

  // ── 5. Calcular Asr (Fiqh Maliki — Factor 1) ──
  //
  // Tiempo de Asr: la sombra de un objeto vertical iguala su propia altura.
  // Fórmula trigonométrica exacta:
  //
  //   elevAsr = arccot(1 + tan(|lat - delta|))
  //
  // Esta fórmula viene de la geometría del triángulo formado por
  // el objeto, su sombra y el rayo solar en el momento del Asr.
  const latRad = toRad(lat);
  const deltaRad = toRad(delta);
  const diffAbs = Math.abs(lat - delta);
  const elevAsr = toDeg(arccot(1 + Math.tan(toRad(diffAbs))));
  const HAsr = calcularAnguloHorario(lat, delta, elevAsr);

  // ── 6. Ensamblar los horarios UTC ──
  let horarios = {};

  // Función auxiliar para manejar casos polares (null)
  const horaONull = (H, esPuesta) => {
    if (H === null) return null;
    return anguloAHoraUTC(H, transitoUTC, esPuesta);
  };

  const fajrUTC = horaONull(HFajr, false);          // Antes del mediodía
  const shuruqUTC = horaONull(HHorizonte, false);    // Salida del sol
  const dhuhrUTC = transitoUTC;                      // Mediodía solar exacto
  const asrUTC = horaONull(HAsr, true);              // Después del mediodía
  const maghribUTC = horaONull(HHorizonte, true);    // Puesta del sol + 2 min
  const ishaUTC = horaONull(HIsha, true);            // Tras puesta del sol

  // ── 7. Aplicar margen de seguridad de Maghrib (+2 minutos) ──
  const maghribConMargenUTC = maghribUTC !== null ? maghribUTC + 2 / 60 : null;

  // ── 8. Convertir a hora local usando el offset del sistema ──
  // getTimezoneOffset() devuelve minutos con signo invertido (UTC-hora_local)
  const offsetHoras = date.getTimezoneOffset() / -60;

  const aHoraLocal = (horaUTC) => {
    if (horaUTC === null) return null;
    return horaUTC + offsetHoras;
  };

  // ── 9. Construir el objeto de resultado ──
  return {
    // ─ Horas en UTC (para servidores, APIs, cálculos internos) ─
    utc: {
      fajr:    fajrUTC    !== null ? decimalHoursToHHMM(fajrUTC)    : "No calculable (polar)",
      shuruq:  shuruqUTC  !== null ? decimalHoursToHHMM(shuruqUTC)  : "No calculable (polar)",
      dhuhr:   decimalHoursToHHMM(dhuhrUTC),
      asr:     asrUTC     !== null ? decimalHoursToHHMM(asrUTC)     : "No calculable (polar)",
      maghrib: maghribConMargenUTC !== null ? decimalHoursToHHMM(maghribConMargenUTC) : "No calculable (polar)",
      isha:    ishaUTC    !== null ? decimalHoursToHHMM(ishaUTC)    : "No calculable (polar)",
    },
    // ─ Horas en hora local del sistema que ejecuta el código ─
    local: {
      fajr:    fajrUTC    !== null ? decimalHoursToHHMM(aHoraLocal(fajrUTC))    : "No calculable (polar)",
      shuruq:  shuruqUTC  !== null ? decimalHoursToHHMM(aHoraLocal(shuruqUTC))  : "No calculable (polar)",
      dhuhr:   decimalHoursToHHMM(aHoraLocal(dhuhrUTC)),
      asr:     asrUTC     !== null ? decimalHoursToHHMM(aHoraLocal(asrUTC))     : "No calculable (polar)",
      maghrib: maghribConMargenUTC !== null ? decimalHoursToHHMM(aHoraLocal(maghribConMargenUTC)) : "No calculable (polar)",
      isha:    ishaUTC    !== null ? decimalHoursToHHMM(aHoraLocal(ishaUTC))    : "No calculable (polar)",
    },
    // ─ Metadatos del cálculo (útil para depuración y auditoría) ─
    meta: {
      lat, lng, alt,
      fecha: date.toISOString().split("T")[0],
      declinacionSolar: delta.toFixed(4) + "°",
      ecuacionDelTiempo: eqTime.toFixed(4) + " min",
      transitoUTC: decimalHoursToHHMM(transitoUTC) + " UTC",
      offsetLocalHoras: offsetHoras,
      angulos: {
        fajr: "18.0° (crepúsculo astronómico)",
        isha: "17.0° (crepúsculo astronómico)",
        asr: "Maliki factor 1 (sombra = altura)",
        maghrib: "Horizonte 0° + 2 min seguridad",
      }
    }
  };
}

// ─────────────────────────────────────────────
//  EXPORTACIÓN — Compatible con Node.js y ESM
// ─────────────────────────────────────────────

// Para usar en Node.js (CommonJS):
if (typeof module !== "undefined" && module.exports) {
  module.exports = { calcularHorariosOracion };
}

// Para usar como módulo ES (import/export):
export { calcularHorariosOracion };

// ─────────────────────────────────────────────
//  EJEMPLO DE USO (descomenta para probar)
// ─────────────────────────────────────────────

/*
const resultado = calcularHorariosOracion(
  40.4168,   // Madrid, latitud
  -3.7038,   // Madrid, longitud (Oeste = negativo)
  655,        // Altitud metros (Madrid ~655m)
  new Date() // Hoy
);

console.log("=== HORARIOS DE ORACIÓN (hora local) ===");
console.log(JSON.stringify(resultado.local, null, 2));

console.log("\n=== METADATOS DEL CÁLCULO ===");
console.log(JSON.stringify(resultado.meta, null, 2));
*/
