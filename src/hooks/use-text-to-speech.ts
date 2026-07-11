import { useCallback, useEffect, useState } from 'react';
import * as Speech from 'expo-speech';

// Fallback for stories with no recorded audio_url. Speech.pause()/resume() aren't available
// on Android, so this only offers a start/stop toggle rather than pretending to pause.
export function useTextToSpeech(text: string) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const toggle = useCallback(() => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(text, {
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [text, speaking]);

  return { speaking, toggle };
}
