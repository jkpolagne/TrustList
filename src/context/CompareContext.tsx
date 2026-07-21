import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

const COMPARE_STORAGE_KEY = "trustlist.compare";
const MAX_COMPARE = 2;

interface CompareContextValue {
  compareIds: string[];
  isComparing: (id: string) => boolean;
  isFull: boolean;
  /** Returns true if adding this id filled the compare list (caller should navigate to /compare). */
  addToCompare: (id: string) => boolean;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
}

const CompareContext = createContext<CompareContextValue | undefined>(undefined);

function readStored(): string[] {
  try {
    const raw = sessionStorage.getItem(COMPARE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function persist(ids: string[]) {
  sessionStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(ids));
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareIds, setCompareIds] = useState<string[]>(readStored);

  const value = useMemo<CompareContextValue>(
    () => ({
      compareIds,
      isComparing: (id) => compareIds.includes(id),
      isFull: compareIds.length >= MAX_COMPARE,
      addToCompare: (id) => {
        if (compareIds.includes(id)) return compareIds.length >= MAX_COMPARE;
        if (compareIds.length >= MAX_COMPARE) return true;
        const next = [...compareIds, id];
        persist(next);
        setCompareIds(next);
        return next.length >= MAX_COMPARE;
      },
      removeFromCompare: (id) => {
        const next = compareIds.filter((existing) => existing !== id);
        persist(next);
        setCompareIds(next);
      },
      clearCompare: () => {
        persist([]);
        setCompareIds([]);
      },
    }),
    [compareIds],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within a CompareProvider");
  return ctx;
}
