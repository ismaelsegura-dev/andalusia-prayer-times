import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  validatedMonths: Record<string, string>;
  setValidatedMonth: (key: string, gregorianStart: string) => void;
  
  selectedCityId: string;
  setSelectedCityId: (id: string) => void;
  selectedHijriMonth: number;
  setSelectedHijriMonth: (m: number) => void;
  selectedHijriYear: number;
  setSelectedHijriYear: (y: number) => void;
}

/**
 * DECRETO DEL EMIR: meses validados hasta Rabi al-Thani 1448
 * Ancla: 1 Shawwal 1447 = 2026-03-20
 * Calculado hacia atrás a razón de 29.53 días/mes lunar
 *
 * Dhu al-Hijjah 1447 tuvo 29 días (18 mayo + 29 = 16 junio),
 * por lo que 1 Muharram 1448 = 16 junio 2026.
 * Decreto 15 julio 2026: Muharram tuvo 30 días y 1 Safar 1448 = 16 julio 2026.
 * Decreto 14 agosto 2026: Safar tuvo 29 días y 1 Rabi al-Awwal 1448 = 14 agosto 2026,
 * de modo que el Mawlid an-Nabī ﷺ (12 Rabi al-Awwal) cae el 25 de agosto de 2026.
 * ÚLTIMO DECRETO: Rabi al-Awwal tuvo 30 días y 1 Rabi al-Thani 1448 = 13 septiembre 2026.
 */
const MESES_VALIDADOS_POR_EMIR: Record<string, string> = {
  "1445-09": "2024-03-11", // Ramadán 1445
  "1445-10": "2024-04-10", // Shawwal 1445
  "1445-11": "2024-05-09", // Dhu al-Qi'dah 1445
  "1445-12": "2024-06-08", // Dhu al-Hijjah 1445
  "1446-01": "2024-07-07", // Muharram 1446
  "1446-02": "2024-08-06", // Safar 1446
  "1446-03": "2024-09-04", // Rabi al-Awwal 1446
  "1446-04": "2024-10-04", // Rabi al-Thani 1446
  "1446-05": "2024-11-02", // Jumada al-Awwal 1446
  "1446-06": "2024-12-02", // Jumada al-Thani 1446
  "1446-07": "2024-12-31", // Rajab 1446
  "1446-08": "2025-01-30", // Sha'ban 1446
  "1446-09": "2025-03-01", // Ramadán 1446
  "1446-10": "2025-03-30", // Shawwal 1446
  "1446-11": "2025-04-29", // Dhu al-Qi'dah 1446
  "1446-12": "2025-05-28", // Dhu al-Hijjah 1446
  "1447-01": "2025-06-27", // Muharram 1447
  "1447-02": "2025-07-26", // Safar 1447
  "1447-03": "2025-08-25", // Rabi al-Awwal 1447
  "1447-04": "2025-09-24", // Rabi al-Thani 1447
  "1447-05": "2025-10-23", // Jumada al-Awwal 1447
  "1447-06": "2025-11-22", // Jumada al-Thani 1447
  "1447-07": "2025-12-22", // Rajab 1447
  "1447-08": "2026-01-20", // Sha'ban 1447
  "1447-09": "2026-02-19", // Ramadán 1447
  "1447-10": "2026-03-20", // Shawwal 1447
  "1447-11": "2026-04-18", // Dhu al-Qi'dah 1447 (30 días)
  "1447-12": "2026-05-18", // Dhu al-Hijjah 1447 (29 días)
  "1448-01": "2026-06-16", // Muharram 1448 (30 días)
  "1448-02": "2026-07-16", // Safar 1448, luna vista 15/07/2026 (29 días)
  "1448-03": "2026-08-14", // Rabi al-Awwal 1448, luna vista 13/08/2026 — 12 Rabi al-Awwal (Mawlid) = 25/08/2026
  "1448-04": "2026-09-13", // Rabi al-Thani 1448, Rabi al-Awwal tuvo 30 días
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      isAdmin: false,
      setIsAdmin: (isAdmin: boolean) => set({ isAdmin }),
      validatedMonths: MESES_VALIDADOS_POR_EMIR,
      setValidatedMonth: (key: string, gregorianStart: string) =>
        set((state: AppState) => ({
          validatedMonths: { ...state.validatedMonths, [key]: gregorianStart }
        })),

      selectedCityId: 'granada', 
      setSelectedCityId: (id: string) => set({ selectedCityId: id }),
      selectedHijriMonth: 10, // Shawwal — se sobreescribe al montar
      setSelectedHijriMonth: (m: number) => set({ selectedHijriMonth: m }),
      selectedHijriYear: 1447, // — se sobreescribe al montar
      setSelectedHijriYear: (y: number) => set({ selectedHijriYear: y }),
    }),
    {
      name: 'falak-qayran-storage-v4', // Cache bust: v3 podía tener 1448-03/1448-04 validados con datos incorrectos; el decreto corregido debe imponerse a todos
      partialize: (state: AppState) => ({
        validatedMonths: state.validatedMonths,
        selectedCityId: state.selectedCityId
      }),
      merge: (persisted: unknown, current: AppState) => {
        // Siempre asegura que los meses del Emir están presentes,
        // pero respeta cualquier mes adicional que el Admin haya añadido después
        const persistedState = persisted as Partial<AppState>;
        return {
          ...current,
          ...persistedState,
          validatedMonths: {
            ...MESES_VALIDADOS_POR_EMIR,
            ...(persistedState.validatedMonths ?? {})
          },
        };
      },
    }
  )
);

export const StoreProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

