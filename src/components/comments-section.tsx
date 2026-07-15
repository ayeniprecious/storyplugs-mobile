import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';

import { Avatar } from '@/components/avatar';
import { PremiumLockModal } from '@/components/premium-lock-modal';
import { ReportModal } from '@/components/report-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { OFFICIAL_ACCOUNT_EMAIL } from '@/constants/official-account';
import { CardAsh, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useProfile } from '@/context/profile-context';
import { useComments, type CommentWithAuthor } from '@/hooks/use-comments';
import { useAppSettings } from '@/hooks/use-app-settings';
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
  const { profile } = useProfile();
  const theme = useTheme();
  const { settings } = useAppSettings();
  const appName = settings.app_name || 'StoryPlugs';
  const { comments, loading, posting, error, addComment, removeComment } = useComments(storyId);
  const [draft, setDraft] = useState('');
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [showReplyLock, setShowReplyLock] = useState(false);

  // Posting a top-level comment is free for everyone; replying is the
  // premium part (the official/support account keeps its existing free
  // access on top of that, unrelated to premium status).
  const canReply = profile?.is_premium || user?.email === OFFICIAL_ACCOUNT_EMAIL;

  async function handlePost() {
    const { error: postError } = await addComment(draft);
    if (!postError) setDraft('');
  }

  function handleReplyPress(commentId: string) {
    if (!canReply) {
      setShowReplyLock(true);
      return;
    }
    setReplyingTo(commentId);
  }

  async function handleReplySubmit(parentId: string) {
    const { error: postError } = await addComment(replyDraft, parentId);
    if (!postError) {
      setReplyDraft('');
      setReplyingTo(null);
    }
  }

  function renderReply(reply: CommentWithAuthor) {
    return (
      <ThemedView key={reply.id} style={[styles.replyRow, { borderColor: theme.border }]}>
        <Avatar
          url={reply.authorAvatarUrl}
          fallbackLetter={reply.authorName[0] ?? 'U'}
          size={22}
          premium={reply.authorIsPremium}
        />
        <ThemedView style={styles.commentBody}>
          <ThemedView style={styles.commentHeaderRow}>
            <ThemedText type="smallBold">{reply.authorName}</ThemedText>
            <ThemedView style={styles.officialBadge}>
              <Ionicons name="checkmark-circle" size={9} color="#fff" />
              <ThemedText style={styles.officialBadgeText}>Official Reply</ThemedText>
            </ThemedView>
            <ThemedText type="small" style={styles.commentTime}>
              {timeAgo(reply.created_at)}
            </ThemedText>
          </ThemedView>
          <ThemedText style={styles.commentText}>{reply.body}</ThemedText>
        </ThemedView>
        {reply.user_id === user?.id && (
          <Pressable onPress={() => removeComment(reply.id)} hitSlop={8}>
            <Ionicons name="trash-outline" size={16} color="#8a8a8e" />
          </Pressable>
        )}
      </ThemedView>
    );
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
          {posting ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={14} color="#fff" />}
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
          <ThemedView key={comment.id} style={styles.commentThread}>
            <ThemedView style={styles.commentRow}>
              <Avatar
                url={comment.authorAvatarUrl}
                fallbackLetter={comment.authorName[0] ?? 'U'}
                size={30}
                streakCount={comment.authorStreak}
                premium={comment.authorIsPremium}
              />
              <ThemedView style={styles.commentBody}>
                <ThemedView style={styles.commentHeaderRow}>
                  <ThemedText type="smallBold">{comment.authorName}</ThemedText>
                  <ThemedText type="small" style={styles.commentTime}>
                    {timeAgo(comment.created_at)}
                  </ThemedText>
                </ThemedView>
                <ThemedText style={styles.commentText}>{comment.body}</ThemedText>
                <Pressable onPress={() => handleReplyPress(comment.id)} hitSlop={8} style={styles.replyLinkRow}>
                  <ThemedText type="small" style={styles.replyLink}>
                    Reply
                  </ThemedText>
                  {!canReply && <Ionicons name="lock-closed" size={10} color={theme.placeholder} />}
                </Pressable>
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

            {comment.replies.map(renderReply)}

            {replyingTo === comment.id && (
              <ThemedView style={[styles.inputRow, styles.replyInputRow]}>
                <TextInput
                  value={replyDraft}
                  onChangeText={setReplyDraft}
                  placeholder={`Reply as ${appName}…`}
                  placeholderTextColor={theme.placeholder}
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  multiline
                />
                <Pressable
                  style={styles.postButton}
                  onPress={() => handleReplySubmit(comment.id)}
                  disabled={posting || !replyDraft.trim()}
                >
                  {posting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Ionicons name="send" size={14} color="#fff" />
                  )}
                </Pressable>
              </ThemedView>
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
      <PremiumLockModal
        visible={showReplyLock}
        onClose={() => setShowReplyLock(false)}
        title="Replying is a premium feature"
        body="Commenting is free for everyone — upgrade to reply and join the conversation with other readers."
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two, marginTop: Spacing.three },
  heading: { fontSize: 17 },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-end',
    backgroundColor: CardAsh,
    borderRadius: 14,
    padding: Spacing.two,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 2,
    fontSize: 16,
    maxHeight: 70,
  },
  postButton: {
    backgroundColor: '#C01918',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { color: '#ff453a', fontSize: 13 },
  emptyHint: { opacity: 0.6, marginTop: Spacing.two },
  // Each top-level comment (plus its replies) sits in its own ash-toned
  // card, matching the rest of the app's card language rather than a bare
  // borderless list.
  commentThread: {
    marginTop: Spacing.two,
    gap: Spacing.two,
    backgroundColor: CardAsh,
    borderRadius: 14,
    padding: Spacing.three,
  },
  commentRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  replyRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
    marginLeft: Spacing.five,
    paddingLeft: Spacing.two,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(128,128,128,0.25)',
  },
  replyInputRow: { marginLeft: Spacing.five },
  commentBody: { flex: 1, gap: 2, backgroundColor: 'transparent' },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  commentTime: { opacity: 0.5 },
  commentText: { fontSize: 14, lineHeight: 20, opacity: 0.9 },
  replyLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, backgroundColor: 'transparent' },
  replyLink: { color: '#C01918', fontWeight: '600' },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#C01918',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  officialBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});
