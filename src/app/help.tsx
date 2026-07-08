import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: 'How do streaks work?',
    answer:
      'Opening a story counts toward your streak for the day. Keep opening at least one story a day to keep it going — miss a day and it resets.',
  },
  {
    question: 'How do I change what notifications I get?',
    answer:
      'Go to Profile → Notifications to pick which kinds of nudges you receive and what time of day they arrive.',
  },
  {
    question: 'Can I read stories offline?',
    answer: 'Not yet — you\'ll need an internet connection to open and read stories.',
  },
  {
    question: 'How do I remove a story from My Library?',
    answer: 'Open My Library and tap the X on any row in Continue Reading, Saved, or Completed to remove it.',
  },
  {
    question: 'Can I hide my name on comments?',
    answer:
      'Yes — go to Profile → Privacy and turn on "Hide my identity in comments." New comments you post will show as Anonymous.',
  },
  {
    question: 'How do I delete my account?',
    answer:
      'Go to Profile and scroll to the bottom for Delete Account. This permanently removes your account and data and can\'t be undone.',
  },
];

export default function Help() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <BackButton href="/profile" />
          <ThemedText type="title" style={styles.title}>
            Help
          </ThemedText>
        </ThemedView>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {FAQ_ITEMS.map((item) => (
            <ThemedView key={item.question} type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">{item.question}</ThemedText>
              <ThemedText type="small" style={styles.answer}>
                {item.answer}
              </ThemedText>
            </ThemedView>
          ))}

          <ThemedText type="small" style={styles.footerHint}>
            Still stuck? Use Profile → Feedback to send us a message.
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.two + 4, paddingTop: Spacing.three },
  header: { gap: Spacing.two, marginBottom: Spacing.two },
  title: { fontSize: 24, lineHeight: 30 },
  scrollContent: { gap: Spacing.two, paddingBottom: Spacing.six },
  card: { borderRadius: 12, padding: Spacing.three, gap: 4 },
  answer: { opacity: 0.75, lineHeight: 20 },
  footerHint: { opacity: 0.6, textAlign: 'center', marginTop: Spacing.two },
});
