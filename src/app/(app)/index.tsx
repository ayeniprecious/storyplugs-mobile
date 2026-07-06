import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';

import { CategoryRow } from '@/components/category-row';
import { HeroBanner } from '@/components/hero-banner';
import { TopNav } from '@/components/top-nav';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useDailyContent } from '@/hooks/use-daily-content';
import { CATEGORY_LABELS, CATEGORY_ORDER, useAllStories } from '@/hooks/use-all-stories';

export default function Home() {
  const { signOut } = useAuth();
  const { story, quote, reflection, loading, error, refresh } = useDailyContent();
  const { byCategory, loading: categoriesLoading } = useAllStories();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ThemedView style={styles.loadingHero}>
            <TopNav />
            <ActivityIndicator style={styles.centerBlock} />
          </ThemedView>
        ) : story ? (
          <HeroBanner story={story} />
        ) : (
          <ThemedView>
            <TopNav />
            <ThemedView type="backgroundElement" style={[styles.emptyCard, styles.bodyPadding]}>
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
              <ThemedText type="smallBold">Couldn&apos;t load today&apos;s content</ThemedText>
              <ThemedText type="small" style={styles.emptyBlurb}>
                {error}
              </ThemedText>
              <Pressable style={styles.retryButton} onPress={refresh}>
                <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
              </Pressable>
            </ThemedView>
          )}

          {quote && (
            <ThemedView type="backgroundElement" style={styles.quoteCard}>
              <ThemedText type="smallBold" style={styles.sectionLabel}>
                Quote of the Day
              </ThemedText>
              <ThemedText style={styles.quoteText}>&ldquo;{quote.text}&rdquo;</ThemedText>
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
              <ThemedText style={styles.quoteText}>{reflection.text}</ThemedText>
            </ThemedView>
          )}

          <ThemedText type="subtitle" style={styles.browseHeading}>
            Browse by Category
          </ThemedText>

          {categoriesLoading ? (
            <ActivityIndicator style={styles.centerBlock} />
          ) : (
            CATEGORY_ORDER.map((category) => (
              <CategoryRow
                key={category}
                label={CATEGORY_LABELS[category]}
                stories={byCategory[category] ?? []}
              />
            ))
          )}

          <Pressable style={styles.signOutButton} onPress={signOut}>
            <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
          </Pressable>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.six },
  bodyPadding: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  loadingHero: { height: 480 },
  centerBlock: { marginTop: Spacing.five },
  quoteCard: { borderRadius: 16, padding: Spacing.three, gap: Spacing.two },
  sectionLabel: { opacity: 0.6, textTransform: 'uppercase' },
  quoteText: { fontSize: 18, lineHeight: 26, fontStyle: 'italic' },
  quoteAuthor: { opacity: 0.6, textAlign: 'right' },
  emptyCard: { borderRadius: 16, padding: Spacing.four, gap: Spacing.two, alignItems: 'center' },
  emptyBlurb: { opacity: 0.6, textAlign: 'center' },
  retryButton: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 10,
    backgroundColor: '#e50914',
  },
  retryButtonText: { color: '#fff', fontWeight: '700' },
  browseHeading: { fontSize: 20, lineHeight: 26 },
  signOutButton: {
    marginTop: Spacing.three,
    borderWidth: 1,
    borderColor: '#e50914',
    borderRadius: 10,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  signOutText: { color: '#e50914', fontWeight: '700' },
});
