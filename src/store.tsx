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
 * DECRETO DEL EMIR — Meses validados hasta 6 Shawwal 1447 (25 marzo 2026)
 * Ancla: 1 Shawwal 1447 = 2026-03-20
 * Calculado hacia atrás a razón de 29.53 días/mes lunar
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
  "1447-10": "2026-03-20", // Shawwal 1447 ← último mes validado
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
      name: 'falak-qayran-storage', // Renombrado: limpia caché anterior
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
            ...(persistedState.validatedMonths ?? {}),
          },
        };
      },
    }
  )
);

export const StoreProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

