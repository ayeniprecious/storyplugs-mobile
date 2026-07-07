import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { Category } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

// Matches the seed rows in storyplugs-supabase migration 20260713000000_admin_features.sql —
// used only until the real fetch resolves (or if it fails), so the UI never has a blank category list.
const FALLBACK_CATEGORIES: Category[] = [
  { slug: "kindness", name: "Kindness", icon: null, sort_order: 0, created_at: "" },
  { slug: "family", name: "Family", icon: null, sort_order: 1, created_at: "" },
  { slug: "faith", name: "Faith", icon: null, sort_order: 2, created_at: "" },
  { slug: "forgiveness", name: "Forgiveness", icon: null, sort_order: 3, created_at: "" },
  { slug: "hope", name: "Hope", icon: null, sort_order: 4, created_at: "" },
  { slug: "community", name: "Community", icon: null, sort_order: 5, created_at: "" },
  { slug: "children", name: "Children", icon: null, sort_order: 6, created_at: "" },
  { slug: "everyday_heroes", name: "Everyday Heroes", icon: null, sort_order: 7, created_at: "" },
];

interface CategoriesContextValue {
  order: string[];
  labels: Record<string, string>;
  loading: boolean;
}

const CategoriesContext = createContext<CategoriesContextValue>({
  order: FALLBACK_CATEGORIES.map((c) => c.slug),
  labels: Object.fromEntries(FALLBACK_CATEGORIES.map((c) => [c.slug, c.name])),
  loading: false,
});

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("categories")
      .select("slug, name, icon, sort_order, created_at")
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setCategories(data as Category[]);
        }
        setLoading(false);
      });
  }, []);

  const value = useMemo<CategoriesContextValue>(
    () => ({
      order: categories.map((c) => c.slug),
      labels: Object.fromEntries(categories.map((c) => [c.slug, c.name])),
      loading,
    }),
    [categories, loading]
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories() {
  return useContext(CategoriesContext);
}
