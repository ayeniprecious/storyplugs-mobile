import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useContinueReading } from '@/hooks/use-continue-reading';
import { useFavoritesList } from '@/hooks/use-favorites-list';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';

export default function Library() {
  const { user } = useAuth();
  const { items: continueItems, loading: continueLoading, refresh: refreshContinue } =
    useContinueReading();
  const { stories: savedStories, loading: savedLoading, refresh: refreshSaved } = useFavoritesList();

  async function removeFromContinueReading(storyId: string) {
    if (!user?.id) return;
    await supabase.from('story_views').delete().eq('user_id', user.id).eq('story_id', storyId);
    refreshContinue();
  }

  async function removeFromSaved(storyId: string) {
    if (!user?.id) return;
    await supabase.from('favorites').delete().eq('user_id', user.id).eq('story_id', storyId);
    refreshSaved();
  }

  const loading = continueLoading || savedLoading;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="title" style={styles.title}>
            My Library
          </ThemedText>

          {loading ? (
            <ActivityIndicator style={styles.loader} />
          ) : (
            <>
              <ThemedText type="smallBold" style={styles.sectionHeading}>
                Continue Reading
              </ThemedText>
              {continueItems.length === 0 ? (
                <ThemedText type="small" style={styles.emptyHint}>
                  Stories you open but haven&apos;t finished will show up here.
                </ThemedText>
              ) : (
                continueItems.map(({ story, progressPercent }) => (
                  <ThemedView key={story.id} type="backgroundElement" style={styles.row}>
                    <Link href={{ pathname: '/story/[id]', params: { id: story.id } }} asChild>
                      <Pressable style={styles.rowPressable}>
                        {story.image_url && (
                          <Image source={{ uri: story.image_url }} style={styles.thumb} contentFit="cover" />
                        )}
                        <ThemedView style={styles.rowBody}>
                          <ThemedText type="smallBold" numberOfLines={1}>
                            {story.title}
                          </ThemedText>
                          <ThemedView style={styles.progressTrack}>
                            <ThemedView
                              style={[styles.progressFill, { width: `${progressPercent}%` }]}
                            />
                          </ThemedView>
                          <ThemedText type="small" style={styles.progressLabel}>
                            {progressPercent}% read
                          </ThemedText>
                        </ThemedView>
                      </Pressable>
                    </Link>
                    <Pressable
                      style={styles.removeButton}
                      onPress={() => removeFromContinueReading(story.id)}
                      accessibilityLabel="Remove from Continue Reading"
                    >
                      <ThemedText style={styles.removeButtonText}>✕</ThemedText>
                    </Pressable>
                  </ThemedView>
                ))
              )}

              <ThemedText type="smallBold" style={styles.sectionHeading}>
                Saved
              </ThemedText>
              {savedStories.length === 0 ? (
                <ThemedText type="small" style={styles.emptyHint}>
                  Stories you save will show up here.
                </ThemedText>
              ) : (
                savedStories.map((story) => (
                  <ThemedView key={story.id} type="backgroundElement" style={styles.row}>
                    <Link href={{ pathname: '/story/[id]', params: { id: story.id } }} asChild>
                      <Pressable style={styles.rowPressable}>
                        {story.image_url && (
                          <Image source={{ uri: story.image_url }} style={styles.thumb} contentFit="cover" />
                        )}
                        <ThemedView style={styles.rowBody}>
                          <ThemedText type="smallBold" numberOfLines={1}>
                            {story.title}
                          </ThemedText>
                        </ThemedView>
                      </Pressable>
                    </Link>
                    <Pressable
                      style={styles.removeButton}
                      onPress={() => removeFromSaved(story.id)}
                      accessibilityLabel="Remove from Saved"
                    >
                      <ThemedText style={styles.removeButtonText}>✕</ThemedText>
                    </Pressable>
                  </ThemedView>
                ))
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: Spacing.four, gap: Spacing.two, paddingBottom: Spacing.six },
  title: { fontSize: 26, lineHeight: 32, marginBottom: Spacing.two },
  loader: { marginTop: Spacing.five },
  sectionHeading: { marginTop: Spacing.three, marginBottom: Spacing.two, opacity: 0.85 },
  emptyHint: { opacity: 0.6, marginBottom: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: Spacing.two,
    overflow: 'hidden',
  },
  rowPressable: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two },
  thumb: { width: 64, height: 64, borderRadius: 8 },
  rowBody: { flex: 1, gap: 4, backgroundColor: 'transparent' },
  progressTrack: { height: 4, backgroundColor: 'rgba(128,128,128,0.3)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: '#e50914' },
  progressLabel: { opacity: 0.6 },
  removeButton: { paddingHorizontal: Spacing.three, alignSelf: 'stretch', justifyContent: 'center' },
  removeButtonText: { opacity: 0.6, fontSize: 16 },
});
