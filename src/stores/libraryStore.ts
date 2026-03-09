import { create } from 'zustand';

interface LibraryState {
  selectedIds: Set<string>;
  currentProjectId: string | null;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  setCurrentProject: (id: string | null) => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  selectedIds: new Set(),
  currentProjectId: null,
  toggleSelect: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),
  selectAll: (ids) => set({ selectedIds: new Set(ids) }),
  clearSelection: () => set({ selectedIds: new Set() }),
  setCurrentProject: (id) => set({ currentProjectId: id }),
}));
