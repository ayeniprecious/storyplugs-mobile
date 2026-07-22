import { StoryListScreen } from '@/components/story-list-screen';
import { StoryRowCard } from '@/components/story-row-card';
import { useContinueReading } from '@/hooks/use-continue-reading';

export default function ContinueReadingList() {
  const { items, loading, removeItem } = useContinueReading();

  return (
    <StoryListScreen
      title="Continue Reading"
      backHref="/library"
      loading={loading}
      isEmpty={items.length === 0}
      emptyHint="Stories you're in the middle of will show up here."
    >
      {items.map((item) => (
        <StoryRowCard
          key={item.story.id}
          story={item.story}
          progressPercent={item.progressPercent}
          onRemove={() => removeItem(item.story.id)}
          removeLabel="Remove from Continue Reading"
        />
      ))}
    </StoryListScreen>
  );
}
