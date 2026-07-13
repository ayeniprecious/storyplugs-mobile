import { useCallback, useEffect, useState } from "react";

import type { CuratedSectionPage, CuratedSectionStyle, Story } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

export interface ResolvedCuratedSection {
  id: string;
  title: string;
  anchor: string;
  display_style: CuratedSectionStyle;
  stories: Story[];
}

interface CuratedSectionStoryRow {
  section_id: string;
  sort_order: number;
  stories: Story | null;
}

// Fetches admin-created sections for one page, grouped by their named anchor
// (see the ANCHOR_* constants in index.tsx/search.tsx for the exact points
// each screen renders these at). A section a free-text search or an
// unpublished-story edit has emptied out is dropped entirely rather than
// rendering an empty heading.
export function useCuratedSections(page: CuratedSectionPage) {
  const [byAnchor, setByAnchor] = useState<Record<string, ResolvedCuratedSection[]>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: sections } = await supabase
      .from("curated_sections")
      .select("*")
      .eq("target_page", page)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    const sectionRows = sections ?? [];
    if (sectionRows.length === 0) {
      setByAnchor({});
      setLoading(false);
      return;
    }

    const { data: links } = await supabase
      .from("curated_section_stories")
      .select("section_id, sort_order, stories(*)")
      .in(
        "section_id",
        sectionRows.map((s) => s.id)
      )
      .order("sort_order", { ascending: true });

    const storiesBySection = new Map<string, Story[]>();
    for (const link of ((links as CuratedSectionStoryRow[] | null) ?? [])) {
      if (!link.stories) continue;
      const list = storiesBySection.get(link.section_id) ?? [];
      list.push(link.stories);
      storiesBySection.set(link.section_id, list);
    }

    const grouped: Record<string, ResolvedCuratedSection[]> = {};
    for (const section of sectionRows) {
      const stories = storiesBySection.get(section.id) ?? [];
      if (stories.length === 0) continue;
      (grouped[section.anchor] ??= []).push({
        id: section.id,
        title: section.title,
        anchor: section.anchor,
        display_style: section.display_style,
        stories,
      });
    }
    setByAnchor(grouped);
    setLoading(false);
  }, [page]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { byAnchor, loading, refresh };
}
