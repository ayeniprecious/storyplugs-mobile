import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useIsFocused } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Animated,
  Pressable,
  RefreshControl,
  StyleSheet,
} from "react-native";

import { CategoryRow } from "@/components/category-row";
import { ContinueReadingRow } from "@/components/continue-reading-row";
import { CuratedSection } from "@/components/curated-section";
import { FeaturedCarousel } from "@/components/featured-carousel";
import { HeroBanner } from "@/components/hero-banner";
import { MoodCheckinModal } from "@/components/mood-checkin-modal";
import { PremiumLockModal } from "@/components/premium-lock-modal";
import { RankedStoryList } from "@/components/ranked-story-list";
import { Skeleton } from "@/components/skeleton";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TopNav } from "@/components/top-nav";
import { MOOD_OPTIONS } from "@/constants/mood-options";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/context/auth-context";
import { useCategories } from "@/context/categories-context";
import { useProfile } from "@/context/profile-context";
import { useAllStories } from "@/hooks/use-all-stories";
import { useContinueReading } from "@/hooks/use-continue-reading";
import { useCuratedSections } from "@/hooks/use-curated-sections";
import { useDailyContent } from "@/hooks/use-daily-content";
import { useMoodCheckin } from "@/hooks/use-mood-checkin";
import { useReadingStreak } from "@/hooks/use-reading-streak";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { useShake } from "@/hooks/use-shake";
import { buildMoodPicks } from "@/lib/mood-recommendations";
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
  const { registerContainer, registerRow, handleScroll } = useScrollReveal();
  const { byAnchor: curatedByAnchor } = useCuratedSections("home");
  const {
    todaysMood,
    todaysCategories,
    hasAnsweredToday,
    loading: moodLoading,
    saveMoodCheckin,
    clearMoodCheckin,
  } = useMoodCheckin();
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showMoodLock, setShowMoodLock] = useState(false);

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
    () => buildRecommendations(byCategory, interests, lengthPref, story?.id, 5),
    [byCategory, interests, lengthPref, story?.id],
  );

  const allStories = useMemo(() => Object.values(byCategory).flat(), [byCategory]);

  // Same is_featured -> is_pinned -> most-recent fallback as Search's
  // FeaturedCarousel, so the carousel is never empty before an admin curates
  // anything and both screens agree on what "Featured" means.
  const featuredStories = useMemo(() => {
    const featured = allStories.filter((s) => s.is_featured);
    if (featured.length > 0) return featured;
    const pinned = allStories.filter((s) => s.is_pinned);
    if (pinned.length > 0) return pinned;
    return [...allStories]
      .sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime())
      .slice(0, 5);
  }, [allStories]);

  const isFocused = useIsFocused();

  const moodOption = useMemo(
    () => MOOD_OPTIONS.find((option) => option.value === todaysMood) ?? null,
    [todaysMood],
  );

  // State (not useMemo) because buildMoodPicks is randomized internally --
  // reshuffleCount is a dependency with no other purpose than forcing this
  // effect to recompute (and thus re-roll) when the user asks for different
  // picks via RankedStoryList's onReshuffle.
  const [moodPicks, setMoodPicks] = useState<typeof allStories>([]);
  const [reshuffleCount, setReshuffleCount] = useState(0);
  useEffect(() => {
    if (!moodOption) {
      setMoodPicks([]);
      return;
    }
    setMoodPicks(
      buildMoodPicks(allStories, moodOption, todaysCategories, story?.id ? [story.id] : [], 5),
    );
  }, [moodOption, todaysCategories, allStories, story?.id, reshuffleCount]);

  function handleMoodSubmit(mood: string, categories: string[]) {
    saveMoodCheckin(mood, categories);
    setShowMoodModal(false);
  }

  function handleMoodReshuffle() {
    setReshuffleCount((count) => count + 1);
  }

  function handleMoodRowPress() {
    if (profile?.is_premium) setShowMoodModal(true);
    else setShowMoodLock(true);
  }

  function handleMoodDismiss() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearMoodCheckin();
  }

  // Shake replaces the old timed auto-popup entirely -- the mood check-in
  // only ever appears because the user asked for it, either by shaking or by
  // tapping the "Feeling X / Change" row or the free-tier banner (both still
  // go through this same handler). Enabled whenever Home is focused so
  // shaking mid-story-read (a different, pushed screen) does nothing, same
  // guarantee the old timer had. Not gated on hasAnsweredToday, so shaking
  // again later in the day reopens it to change today's answer.
  useShake(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleMoodRowPress();
  }, isFocused && !moodLoading);

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
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
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
            <TopNav title="Home" />
            <Skeleton style={styles.heroSkeletonImage} />
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
            <TopNav title="Home" />
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

        <ThemedView style={styles.bodyPadding} {...registerContainer("body")}>
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
            <Animated.View {...registerRow("quote", "body")}>
              <ThemedView type="backgroundElement" style={styles.quoteCard}>
                <ThemedText type="small" style={styles.sectionLabel}>
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
            </Animated.View>
          )}

          {reflection && (
            <Animated.View {...registerRow("reflection", "body")}>
              <ThemedView type="backgroundElement" style={styles.quoteCard}>
                <ThemedText type="small" style={styles.sectionLabel}>
                  Reflection of the Day
                </ThemedText>
                <ThemedText style={styles.quoteText}>
                  {reflection.text}
                </ThemedText>
              </ThemedView>
            </Animated.View>
          )}

          {continueLoading ? (
            <CategoryRowSkeleton />
          ) : (
            <Animated.View {...registerRow("continue-reading", "body")}>
              <ContinueReadingRow items={continueItems} />
            </Animated.View>
          )}

          {curatedByAnchor.home_after_continue_reading?.map((section) => (
            <CuratedSection key={section.id} section={section} />
          ))}

          {recommended.length > 0 && (
            <Animated.View {...registerRow("recommended", "body")}>
              <CategoryRow label="Recommended for You" stories={recommended} />
            </Animated.View>
          )}

          {profile?.is_premium ? (
            hasAnsweredToday && moodOption ? (
              <ThemedView style={styles.moodRowWrap}>
                <Pressable onPress={handleMoodRowPress} style={styles.moodRow}>
                  <Ionicons name={moodOption.icon} size={16} color="#C01918" />
                  <ThemedText type="small" style={styles.moodRowText}>
                    Feeling {moodOption.label.toLowerCase()}
                  </ThemedText>
                  <ThemedText type="small" style={styles.moodChangeText}>
                    Change
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={handleMoodDismiss}
                  hitSlop={8}
                  style={styles.moodDismiss}
                  accessibilityLabel="Dismiss mood picks"
                >
                  <Ionicons name="close" size={16} color="#8a8a8e" />
                </Pressable>
              </ThemedView>
            ) : (
              // Shake is the fun way in, but it only works on a native build
              // (expo-sensors has no working Accelerometer on web at all, not
              // even mobile Safari) -- this stays as the one way in on web,
              // and doubles as a discoverable hint that shaking does
              // something once there's a native app to shake.
              <Pressable onPress={handleMoodRowPress} style={styles.moodBanner}>
                <Ionicons name="happy-outline" size={16} color="#C01918" />
                <ThemedText type="small" style={styles.moodBannerText}>
                  How are you feeling today? Tap to check in
                </ThemedText>
              </Pressable>
            )
          ) : (
            <Pressable onPress={handleMoodRowPress} style={styles.moodBanner}>
              <Ionicons name="sparkles-outline" size={16} color="#C01918" />
              <ThemedText type="small" style={styles.moodBannerText}>
                Get picks matched to your mood — Premium
              </ThemedText>
            </Pressable>
          )}

          {moodOption && moodPicks.length > 0 && (
            <Animated.View {...registerRow("mood-picks", "body")}>
              <RankedStoryList
                label={`Picked for feeling ${moodOption.label.toLowerCase()}`}
                stories={moodPicks}
                onReshuffle={handleMoodReshuffle}
              />
            </Animated.View>
          )}

          {featuredStories.length > 0 && (
            <Animated.View {...registerRow("featured", "body")}>
              <FeaturedCarousel stories={featuredStories} />
            </Animated.View>
          )}

          {curatedByAnchor.home_after_recommended?.map((section) => (
            <CuratedSection key={section.id} section={section} />
          ))}

          {curatedByAnchor.home_before_browse_by_category?.map((section) => (
            <CuratedSection key={section.id} section={section} />
          ))}

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
              <Animated.View key={category} {...registerRow(`category-${category}`, "body")}>
                <CategoryRow
                  label={categoryLabels[category] ?? category}
                  stories={byCategory[category] ?? []}
                />
              </Animated.View>
            ))
          )}

          {curatedByAnchor.home_end?.map((section) => (
            <CuratedSection key={section.id} section={section} />
          ))}
        </ThemedView>
      </Animated.ScrollView>

      <MoodCheckinModal
        visible={showMoodModal}
        onClose={() => setShowMoodModal(false)}
        onSubmit={handleMoodSubmit}
      />
      <PremiumLockModal
        visible={showMoodLock}
        onClose={() => setShowMoodLock(false)}
        title="Mood picks are a premium feature"
        body="Tell us how you're feeling and we'll match stories to it, with room for a few surprises too. Upgrade to unlock it."
      />
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
  loadingHero: { marginBottom: Spacing.three },
  heroSkeletonImage: {
    height: 190,
    borderRadius: 20,
    marginHorizontal: Spacing.two + 4,
  },
  heroSkeletonContent: {
    paddingHorizontal: Spacing.two + 4,
    paddingTop: Spacing.two,
    gap: 8,
    backgroundColor: "transparent",
  },
  heroSkeletonTag: { width: 140, height: 16, borderRadius: 4 },
  heroSkeletonTitle: { width: "80%", height: 24, borderRadius: 6 },
  heroSkeletonExcerpt: { width: "95%", height: 15, borderRadius: 4 },
  heroSkeletonButtonRow: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.two,
    backgroundColor: "transparent",
  },
  heroSkeletonButton: { flex: 1, height: 40, borderRadius: 12 },
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
  moodRowWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  moodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  moodRowText: { opacity: 0.85 },
  moodChangeText: { color: "#C01918", fontWeight: "600" },
  moodDismiss: { padding: 4 },
  moodBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 2,
    borderRadius: 20,
    backgroundColor: "rgba(192,25,24,0.12)",
  },
  moodBannerText: { color: "#C01918", fontWeight: "500" },
  centerBlock: { marginTop: Spacing.five },
  quoteCard: { borderRadius: 14, padding: Spacing.two + 4, gap: 6 },
  sectionLabel: { opacity: 0.6, fontSize: 11, textTransform: "uppercase" },
  quoteText: { fontSize: 15, lineHeight: 21, fontStyle: "italic" },
  quoteAuthor: { opacity: 0.6, textAlign: "right", fontSize: 12 },
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
