import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';

import { tokenizeBody } from '@/lib/sentence-tokenizer';

// Fallback for stories with no recorded audio_url. Speaking the whole body as one utterance
// reads too fast and blows through punctuation, so this instead speaks one clause at a time --
// pausing at commas, longer at sentence/paragraph ends, longer still at an ellipsis -- with a
// slight pitch/rate lift for quoted dialogue so it doesn't sound identical to the narration.
// It also prefers the device's best-quality installed voice (e.g. iOS's "Enhanced" voices)
// over whatever the OS defaults to, which is often the lower-quality compact one.
let cachedVoiceId: string | null | undefined; // undefined = not resolved yet, null = none found

async function resolveBestVoice(): Promise<string | undefined> {
  if (cachedVoiceId !== undefined) return cachedVoiceId ?? undefined;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const english = voices.filter((v) => v.language?.toLowerCase().startsWith('en'));
    const enhanced = english.find((v) => v.quality === Speech.VoiceQuality.Enhanced);
    cachedVoiceId = (enhanced ?? english[0])?.identifier ?? null;
  } catch {
    cachedVoiceId = null;
  }
  return cachedVoiceId ?? undefined;
}

export function useTextToSpeech(text: string) {
  const [speaking, setSpeaking] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const sentencesRef = useRef(tokenizeBody(text));
  const stopRequestedRef = useRef(false);
  const voiceRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    sentencesRef.current = tokenizeBody(text);
  }, [text]);

  useEffect(() => {
    return () => {
      stopRequestedRef.current = true;
      Speech.stop();
    };
  }, []);

  const speakFrom = useCallback((index: number) => {
    const sentences = sentencesRef.current;
    if (stopRequestedRef.current || index >= sentences.length) {
      setSpeaking(false);
      setCurrentIndex(-1);
      return;
    }
    setCurrentIndex(index);
    const { text: chunkText, pauseAfterMs, pitch, rate } = sentences[index];
    Speech.speak(chunkText, {
      rate,
      pitch,
      voice: voiceRef.current,
      onDone: () => {
        if (stopRequestedRef.current) return;
        setTimeout(() => speakFrom(index + 1), pauseAfterMs);
      },
      onStopped: () => {
        setSpeaking(false);
        setCurrentIndex(-1);
      },
      onError: () => {
        setSpeaking(false);
        setCurrentIndex(-1);
      },
    });
  }, []);

  const toggle = useCallback(async () => {
    if (speaking) {
      stopRequestedRef.current = true;
      Speech.stop();
      setSpeaking(false);
      setCurrentIndex(-1);
      return;
    }
    stopRequestedRef.current = false;
    voiceRef.current = await resolveBestVoice();
    if (stopRequestedRef.current) return;
    setSpeaking(true);
    speakFrom(0);
  }, [speaking, speakFrom]);

  return { speaking, currentIndex, sentences: sentencesRef.current, toggle };
}
