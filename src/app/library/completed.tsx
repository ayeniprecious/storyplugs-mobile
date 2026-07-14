import { StoryListScreen } from '@/components/story-list-screen';
import { StoryRowCard } from '@/components/story-row-card';
import { useCompletedStories } from '@/hooks/use-completed-stories';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function CompletedList() {
  const { items, loading, removeItem } = useCompletedStories();

  return (
    <StoryListScreen
      title="Completed"
      backHref="/library"
      loading={loading}
      isEmpty={items.length === 0}
      emptyHint="Stories you finish will show up here."
    >
      {items.map(({ story, completedAt }) => (
        <StoryRowCard
          key={story.id}
          story={story}
          subtitle={`Completed ${formatDate(completedAt)}`}
          onRemove={() => removeItem(story.id)}
          removeLabel="Remove from Completed"
        />
      ))}
    </StoryListScreen>
  );
}
