import { StoryListScreen } from '@/components/story-list-screen';
import { StoryRowCard } from '@/components/story-row-card';
import { useFavoritesList } from '@/hooks/use-favorites-list';

export default function SavedList() {
  const { stories, loading, removeStory } = useFavoritesList();

  return (
    <StoryListScreen
      title="Saved"
      backHref="/library"
      loading={loading}
      isEmpty={stories.length === 0}
      emptyHint="Stories you save will show up here."
    >
      {stories.map((story) => (
        <StoryRowCard
          key={story.id}
          story={story}
          onRemove={() => removeStory(story.id)}
          removeLabel="Remove from Saved"
        />
      ))}
    </StoryListScreen>
  );
}
