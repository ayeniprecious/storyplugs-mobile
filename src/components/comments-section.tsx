import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { ReportModal } from '@/components/report-modal';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useComments } from '@/hooks/use-comments';

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
  const { comments, loading, posting, error, addComment, removeComment } = useComments(storyId);
  const [draft, setDraft] = useState('');
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);

  async function handlePost() {
    const { error: postError } = await addComment(draft);
    if (!postError) setDraft('');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Comments{comments.length > 0 ? ` (${comments.length})` : ''}</Text>

      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Share your thoughts…"
          placeholderTextColor="#8a8a8a"
          style={styles.input}
          multiline
        />
        <Pressable style={styles.postButton} onPress={handlePost} disabled={posting || !draft.trim()}>
          {posting ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={16} color="#fff" />}
        </Pressable>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator color="#C01918" style={{ marginTop: Spacing.two }} />
      ) : comments.length === 0 ? (
        <Text style={styles.emptyHint}>Be the first to comment.</Text>
      ) : (
        comments.map((comment) => (
          <View key={comment.id} style={styles.commentRow}>
            <Avatar url={comment.authorAvatarUrl} fallbackLetter={comment.authorName[0] ?? 'U'} size={30} />
            <View style={styles.commentBody}>
              <View style={styles.commentHeaderRow}>
                <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                <Text style={styles.commentTime}>{timeAgo(comment.created_at)}</Text>
              </View>
              <Text style={styles.commentText}>{comment.body}</Text>
            </View>
            {comment.user_id === user?.id ? (
              <Pressable onPress={() => removeComment(comment.id)} hitSlop={8}>
                <Ionicons name="trash-outline" size={16} color="#8a8a8e" />
              </Pressable>
            ) : (
              <Pressable onPress={() => setReportCommentId(comment.id)} hitSlop={8}>
                <Ionicons name="flag-outline" size={16} color="#8a8a8e" />
              </Pressable>
            )}
          </View>
        ))
      )}

      <ReportModal
        visible={!!reportCommentId}
        onClose={() => setReportCommentId(null)}
        targetType="comment"
        targetId={reportCommentId ?? ''}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two, marginTop: Spacing.three },
  heading: { color: '#fff', fontSize: 17, fontWeight: '700' },
  inputRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-end' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#3a3a3c',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    color: '#fff',
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
  emptyHint: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: Spacing.two },
  commentRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three, alignItems: 'flex-start' },
  commentBody: { flex: 1, gap: 2 },
  commentHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentAuthor: { color: '#fff', fontSize: 13, fontWeight: '700' },
  commentTime: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  commentText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 20 },
});
