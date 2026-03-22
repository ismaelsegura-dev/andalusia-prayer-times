import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  validatedMonths: Record<string, string>;
  setValidatedMonth: (key: string, gregorianStart: string) => void;
  
  selectedCityId: string;
  setSelectedCityId: (id: string) => void;
  selectedMonth: number;
  setSelectedMonth: (m: number) => void;
  selectedYear: number;
  setSelectedYear: (y: number) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      isAdmin: false,
      setIsAdmin: (isAdmin: boolean) => set({ isAdmin }),
      validatedMonths: {},
      setValidatedMonth: (key: string, gregorianStart: string) =>
        set((state: AppState) => ({
          validatedMonths: { ...state.validatedMonths, [key]: gregorianStart }
        })),

      selectedCityId: 'granada', 
      setSelectedCityId: (id: string) => set({ selectedCityId: id }),
      selectedMonth: new Date().getMonth() + 1,
      setSelectedMonth: (m: number) => set({ selectedMonth: m }),
      selectedYear: new Date().getFullYear(),
      setSelectedYear: (y: number) => set({ selectedYear: y }),
    }),
    {
      name: 'andalusia-prayer-storage',
      partialize: (state: AppState) => ({
        validatedMonths: state.validatedMonths,
        selectedCityId: state.selectedCityId
      })
    }
  )
);

export const StoreProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
