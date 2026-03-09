import { create } from 'zustand';
import type { ProductResult, SearchStatus } from '@/types';

export interface FinderProduct {
  query: string;
  status: SearchStatus;
  result: ProductResult | null;
}

interface FinderState {
  products: FinderProduct[];
  isSearching: boolean;
  setProducts: (products: FinderProduct[]) => void;
  updateProduct: (index: number, update: Partial<FinderProduct>) => void;
  setIsSearching: (v: boolean) => void;
  reset: () => void;
}

export const useFinderStore = create<FinderState>((set) => ({
  products: [],
  isSearching: false,
  setProducts: (products) => set({ products }),
  updateProduct: (index, update) =>
    set((state) => ({
      products: state.products.map((p, i) =>
        i === index ? { ...p, ...update } : p
      ),
    })),
  setIsSearching: (isSearching) => set({ isSearching }),
  reset: () => set({ products: [], isSearching: false }),
}));
