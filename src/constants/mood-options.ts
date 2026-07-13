import type { Ionicons } from "@expo/vector-icons";

type IoniconName = keyof typeof Ionicons.glyphMap;

// Mood check-in (premium): "categoryBoost" slugs are a soft signal, not
// authoritative -- categories are admin-editable (a real table, not a fixed
// enum), so if one of these slugs is renamed or removed the affected mood's
// boost just silently contributes zero to buildMoodPicks() rather than
// breaking anything. Matched against the seed set in
// storyplugs-supabase/supabase/migrations/20260713000000_admin_features.sql.
export interface MoodOption {
  value: string;
  label: string;
  icon: IoniconName;
  categoryBoost: string[];
  keywords: string[];
}

export const MOOD_OPTIONS: MoodOption[] = [
  {
    value: "hopeful",
    label: "Hopeful",
    icon: "sunny-outline",
    categoryBoost: ["hope", "everyday_heroes"],
    keywords: ["hope", "possible", "future"],
  },
  {
    value: "down",
    label: "Down",
    icon: "rainy-outline",
    categoryBoost: ["hope", "forgiveness", "faith"],
    keywords: ["comfort", "heal", "grief", "okay"],
  },
  {
    value: "anxious",
    label: "Anxious",
    icon: "pulse-outline",
    categoryBoost: ["faith", "hope", "community"],
    keywords: ["peace", "calm", "worry", "fear"],
  },
  {
    value: "grateful",
    label: "Grateful",
    icon: "heart-outline",
    categoryBoost: ["kindness", "family"],
    keywords: ["thank", "grateful", "blessing"],
  },
  {
    value: "lonely",
    label: "Lonely",
    icon: "people-outline",
    categoryBoost: ["community", "family", "everyday_heroes"],
    keywords: ["together", "friend", "belong"],
  },
  {
    value: "peaceful",
    label: "Peaceful",
    icon: "leaf-outline",
    categoryBoost: ["faith", "kindness"],
    keywords: ["peace", "quiet", "still"],
  },
  {
    value: "overwhelmed",
    label: "Overwhelmed",
    icon: "cloud-outline",
    categoryBoost: ["hope", "faith"],
    keywords: ["rest", "breathe", "ease"],
  },
  {
    value: "curious",
    label: "Just Browsing",
    icon: "compass-outline",
    categoryBoost: [],
    keywords: [],
  },
];
