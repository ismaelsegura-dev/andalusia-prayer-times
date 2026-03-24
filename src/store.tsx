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
      selectedHijriMonth: 9, // Initial fallback
      setSelectedHijriMonth: (m: number) => set({ selectedHijriMonth: m }),
      selectedHijriYear: 1445, // Initial fallback
      setSelectedHijriYear: (y: number) => set({ selectedHijriYear: y }),
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
