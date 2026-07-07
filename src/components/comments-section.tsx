import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';

import { Avatar } from '@/components/avatar';
import { ReportModal } from '@/components/report-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useComments } from '@/hooks/use-comments';
import { useTheme } from '@/hooks/use-theme';

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function CommentsSection({ storyId }: { storyId: string }) {
  const { user } = useAuth();
  const theme = useTheme();
  const { comments, loading, posting, error, addComment, removeComment } = useComments(storyId);
  const [draft, setDraft] = useState('');
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);

  async function handlePost() {
    const { error: postError } = await addComment(draft);
    if (!postError) setDraft('');
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="smallBold" style={styles.heading}>
        Comments{comments.length > 0 ? ` (${comments.length})` : ''}
      </ThemedText>

      <ThemedView style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Share your thoughts…"
          placeholderTextColor={theme.placeholder}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          multiline
        />
        <Pressable style={styles.postButton} onPress={handlePost} disabled={posting || !draft.trim()}>
          {posting ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={16} color="#fff" />}
        </Pressable>
      </ThemedView>
      {error && <ThemedText style={styles.error}>{error}</ThemedText>}

      {loading ? (
        <ActivityIndicator color="#C01918" style={{ marginTop: Spacing.two }} />
      ) : comments.length === 0 ? (
        <ThemedText type="small" style={styles.emptyHint}>
          Be the first to comment.
        </ThemedText>
      ) : (
        comments.map((comment) => (
          <ThemedView key={comment.id} style={styles.commentRow}>
            <Avatar url={comment.authorAvatarUrl} fallbackLetter={comment.authorName[0] ?? 'U'} size={30} />
            <ThemedView style={styles.commentBody}>
              <ThemedView style={styles.commentHeaderRow}>
                <ThemedText type="smallBold">{comment.authorName}</ThemedText>
                <ThemedText type="small" style={styles.commentTime}>
                  {timeAgo(comment.created_at)}
                </ThemedText>
              </ThemedView>
              <ThemedText style={styles.commentText}>{comment.body}</ThemedText>
            </ThemedView>
            {comment.user_id === user?.id ? (
              <Pressable onPress={() => removeComment(comment.id)} hitSlop={8}>
                <Ionicons name="trash-outline" size={16} color="#8a8a8e" />
              </Pressable>
            ) : (
              <Pressable onPress={() => setReportCommentId(comment.id)} hitSlop={8}>
                <Ionicons name="flag-outline" size={16} color="#8a8a8e" />
              </Pressable>
            )}
          </ThemedView>
        ))
      )}

      <ReportModal
        visible={!!reportCommentId}
        onClose={() => setReportCommentId(null)}
        targetType="comment"
        targetId={reportCommentId ?? ''}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two, marginTop: Spacing.three },
  heading: { fontSize: 17 },
  inputRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-end', backgroundColor: 'transparent' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 14,
    maxHeight: 90,
  },
  postButton: {
    backgroundColor: '#C01918',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { color: '#ff453a', fontSize: 13 },
  emptyHint: { opacity: 0.6, marginTop: Spacing.two },
  commentRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  commentBody: { flex: 1, gap: 2, backgroundColor: 'transparent' },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  commentTime: { opacity: 0.5 },
  commentText: { fontSize: 14, lineHeight: 20, opacity: 0.9 },
});
