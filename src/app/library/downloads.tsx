import { StoryListScreen } from '@/components/story-list-screen';
import { StoryRowCard } from '@/components/story-row-card';
import { useDownloads } from '@/hooks/use-downloads';

export default function DownloadsList() {
  const { downloads, loading, removeDownload } = useDownloads();

  return (
    <StoryListScreen
      title="Downloads"
      backHref="/library"
      loading={loading}
      isEmpty={downloads.length === 0}
      emptyHint="Stories you download for offline reading (Premium) will show up here."
    >
      {downloads.map((story) => (
        <StoryRowCard
          key={story.id}
          story={story}
          subtitle="Downloaded"
          onRemove={() => removeDownload(story.id)}
          removeLabel="Remove download"
        />
      ))}
    </StoryListScreen>
  );
}
