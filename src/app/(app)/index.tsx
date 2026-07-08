import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from "react-native";

import { CategoryRow } from "@/components/category-row";
import { ContinueReadingRow } from "@/components/continue-reading-row";
import { HeroBanner } from "@/components/hero-banner";
import { Skeleton } from "@/components/skeleton";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TopNav } from "@/components/top-nav";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/context/auth-context";
import { useCategories } from "@/context/categories-context";
import { useProfile } from "@/context/profile-context";
import { useAllStories } from "@/hooks/use-all-stories";
import { useContinueReading } from "@/hooks/use-continue-reading";
import { useDailyContent } from "@/hooks/use-daily-content";
import { useReadingStreak } from "@/hooks/use-reading-streak";
import { buildRecommendations } from "@/lib/recommendations";

function getTimeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function CategoryRowSkeleton() {
  return (
    <ThemedView style={styles.categorySkeletonSection}>
      <Skeleton style={styles.categorySkeletonHeading} />
      <ThemedView style={styles.categorySkeletonRow}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} style={styles.categorySkeletonCard} />
        ))}
      </ThemedView>
    </ThemedView>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const {
    story,
    quote,
    reflection,
    loading,
    error,
    refresh: refreshDaily,
  } = useDailyContent();
  const {
    byCategory,
    loading: categoriesLoading,
    refresh: refreshCategories,
  } = useAllStories();
  const { order: categoryOrder, labels: categoryLabels } = useCategories();
  const {
    items: continueItems,
    loading: continueLoading,
    refresh: refreshContinue,
  } = useContinueReading();
  const {
    currentStreak,
    longestStreak,
    loading: streakLoading,
    refresh: refreshStreak,
  } = useReadingStreak();
  const [refreshing, setRefreshing] = useState(false);

  const displayName = (
    profile?.display_name?.trim() ||
    user?.email?.split("@")[0] ||
    ""
  ).split(" ")[0];

  // Surface the categories the user picked during onboarding first (stable sort,
  // so admin-defined order is kept within each group).
  const interests = profile?.interests;
  const orderedCategories = useMemo(() => {
    if (!interests || interests.length === 0) return categoryOrder;
    return [...categoryOrder].sort(
      (a, b) => Number(interests.includes(b)) - Number(interests.includes(a)),
    );
  }, [categoryOrder, interests]);

  const lengthPref = profile?.story_length_pref;
  const recommended = useMemo(
    () => buildRecommendations(byCategory, interests, lengthPref, story?.id),
    [byCategory, interests, lengthPref, story?.id],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refreshDaily(),
      refreshCategories(),
      refreshContinue(),
      refreshStreak(),
    ]);
    setRefreshing(false);
  }, [refreshDaily, refreshCategories, refreshContinue, refreshStreak]);

  // Reading progress/streak can change on a pushed story screen while Home
  // stays mounted behind it — refetch on focus so coming back always shows
  // current state instead of whatever it was when Home first mounted.
  useFocusEffect(
    useCallback(() => {
      refreshContinue();
      refreshStreak();
    }, [refreshContinue, refreshStreak])
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#C01918"
          />
        }
      >
        {loading ? (
          <ThemedView style={styles.loadingHero}>
            <TopNav />
            <ThemedView style={styles.heroSkeletonContent}>
              <Skeleton style={styles.heroSkeletonTag} />
              <Skeleton style={styles.heroSkeletonTitle} />
              <Skeleton style={styles.heroSkeletonExcerpt} />
              <ThemedView style={styles.heroSkeletonButtonRow}>
                <Skeleton style={styles.heroSkeletonButton} />
                <Skeleton style={styles.heroSkeletonButton} />
              </ThemedView>
            </ThemedView>
          </ThemedView>
        ) : story ? (
          <HeroBanner story={story} />
        ) : (
          <ThemedView>
            <TopNav />
            <ThemedView
              type="backgroundElement"
              style={[styles.emptyCard, styles.bodyPadding]}
            >
              <ThemedText type="smallBold">No story scheduled today</ThemedText>
              <ThemedText type="small" style={styles.emptyBlurb}>
                Check back soon — new stories are added regularly.
              </ThemedText>
            </ThemedView>
          </ThemedView>
        )}

        <ThemedView style={styles.bodyPadding}>
          {!loading && error && (
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <ThemedText type="smallBold">
                Couldn&apos;t load today&apos;s content
              </ThemedText>
              <ThemedText type="small" style={styles.emptyBlurb}>
                {error}
              </ThemedText>
              <Pressable style={styles.retryButton} onPress={refreshDaily}>
                <ThemedText style={styles.retryButtonText}>
                  Try Again
                </ThemedText>
              </Pressable>
            </ThemedView>
          )}

          <ThemedView style={styles.greetingRow}>
            <ThemedText style={styles.greetingTitle}>
              {getTimeOfDayGreeting()}
              {displayName ? `, ${displayName}` : ""}
            </ThemedText>
            {streakLoading ? (
              <Skeleton style={styles.streakSkeleton} />
            ) : (
              <ThemedView style={styles.streakBadge}>
                <Ionicons
                  name={currentStreak > 0 ? "flame" : "flame-outline"}
                  size={15}
                  color={currentStreak > 0 ? "#C01918" : "#8a8a8e"}
                />
                <ThemedText type="small" style={styles.streakText}>
                  {currentStreak > 0
                    ? `${currentStreak}-day streak`
                    : "Start a streak today"}
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
          {!streakLoading && longestStreak > 0 && (
            <ThemedText type="small" style={styles.longestStreakText}>
              Longest streak: {longestStreak} day
              {longestStreak === 1 ? "" : "s"}
            </ThemedText>
          )}

          {quote && (
            <ThemedView type="backgroundElement" style={styles.quoteCard}>
              <ThemedText type="smallBold" style={styles.sectionLabel}>
                Quote of the Day
              </ThemedText>
              <ThemedText style={styles.quoteText}>
                &ldquo;{quote.text}&rdquo;
              </ThemedText>
              {quote.author && (
                <ThemedText type="small" style={styles.quoteAuthor}>
                  — {quote.author}
                </ThemedText>
              )}
            </ThemedView>
          )}

          {reflection && (
            <ThemedView type="backgroundElement" style={styles.quoteCard}>
              <ThemedText type="smallBold" style={styles.sectionLabel}>
                Reflection of the Day
              </ThemedText>
              <ThemedText style={styles.quoteText}>
                {reflection.text}
              </ThemedText>
            </ThemedView>
          )}

          {continueLoading ? (
            <CategoryRowSkeleton />
          ) : (
            <ContinueReadingRow items={continueItems} />
          )}

          {recommended.length > 0 && (
            <CategoryRow label="Recommended for You" stories={recommended} />
          )}

          <ThemedText type="subtitle" style={styles.browseHeading}>
            Browse by Category
          </ThemedText>

          {categoriesLoading ? (
            <>
              <CategoryRowSkeleton />
              <CategoryRowSkeleton />
              <CategoryRowSkeleton />
            </>
          ) : (
            orderedCategories.map((category) => (
              <CategoryRow
                key={category}
                label={categoryLabels[category] ?? category}
                stories={byCategory[category] ?? []}
              />
            ))
          )}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.six },
  bodyPadding: {
    paddingHorizontal: Spacing.two + 4,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  loadingHero: { height: 480 },
  heroSkeletonContent: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.two + 4,
    paddingBottom: Spacing.three,
    gap: 8,
    backgroundColor: "transparent",
  },
  heroSkeletonTag: { width: 140, height: 20, borderRadius: 4 },
  heroSkeletonTitle: { width: "80%", height: 28, borderRadius: 6 },
  heroSkeletonExcerpt: { width: "95%", height: 16, borderRadius: 4 },
  heroSkeletonButtonRow: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.two,
    backgroundColor: "transparent",
  },
  heroSkeletonButton: { width: 140, height: 40, borderRadius: 10 },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  greetingTitle: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "600",
    flexShrink: 1,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "transparent",
  },
  streakText: { opacity: 0.85 },
  streakSkeleton: { width: 110, height: 20, borderRadius: 6 },
  longestStreakText: { opacity: 0.5, marginTop: -Spacing.two },
  centerBlock: { marginTop: Spacing.five },
  quoteCard: { borderRadius: 16, padding: Spacing.three, gap: Spacing.two },
  sectionLabel: { opacity: 0.6, textTransform: "uppercase" },
  quoteText: { fontSize: 18, lineHeight: 26, fontStyle: "italic" },
  quoteAuthor: { opacity: 0.6, textAlign: "right" },
  emptyCard: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
    alignItems: "center",
  },
  emptyBlurb: { opacity: 0.6, textAlign: "center" },
  retryButton: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 10,
    backgroundColor: "#14131b",
  },
  retryButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  browseHeading: { fontSize: 20, lineHeight: 26 },
  categorySkeletonSection: { gap: Spacing.two, marginBottom: Spacing.two },
  categorySkeletonHeading: { width: 120, height: 20, borderRadius: 4 },
  categorySkeletonRow: {
    flexDirection: "row",
    gap: Spacing.two,
    backgroundColor: "transparent",
  },
  categorySkeletonCard: { width: 112, aspectRatio: 2 / 3, borderRadius: 8 },
});
