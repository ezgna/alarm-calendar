import { useCallback, useEffect, useRef, useState } from 'react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { SOUND_PREVIEW_ASSETS, type SoundId } from './sounds';

type PreviewError = 'unsupported' | 'audio-mode' | 'playback';

type PreviewState = {
  status: 'idle' | 'loading' | 'playing' | 'error';
  soundId: SoundId | null;
  error?: PreviewError;
};

type PlayResult = { ok: true } | { ok: false; reason: PreviewError };

// 設定画面での簡易プレビュー用フック（expo-audio を利用）
export function useSoundPreview() {
  const player = useAudioPlayer(null, { keepAudioSessionActive: false });
  const status = useAudioPlayerStatus(player);
  const [state, setState] = useState<PreviewState>({ status: 'idle', soundId: null });
  const tokenRef = useRef(0);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioModeInit = useRef<Promise<void> | null>(null);

  const ensureAudioMode = useCallback(async () => {
    if (!audioModeInit.current) {
      // iOS のサイレントスイッチ無視 + バックグラウンドで維持しない
      audioModeInit.current = setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'mixWithOthers',
        interruptionModeAndroid: 'duckOthers',
        allowsRecording: false,
      }).catch((err) => {
        audioModeInit.current = null;
        throw err;
      });
    }
    await audioModeInit.current;
  }, []);

  const resetState = useCallback(() => {
    setState({ status: 'idle', soundId: null });
  }, []);

  const clearFadeTimers = useCallback(() => {
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  }, []);

  const stopPreview = useCallback(() => {
    tokenRef.current += 1;
    clearFadeTimers();
    player.pause();
    player.seekTo(0).catch(() => {});
    resetState();
  }, [clearFadeTimers, player, resetState]);

  const playPreview = useCallback(
    async (soundId: SoundId): Promise<PlayResult> => {
      const asset = SOUND_PREVIEW_ASSETS[soundId];
      if (!asset) {
        const result: PlayResult = { ok: false, reason: 'unsupported' };
        setState({ status: 'error', soundId, error: result.reason });
        return result;
      }

      const ticket = tokenRef.current + 1;
      tokenRef.current = ticket;
      setState({ status: 'loading', soundId });

      try {
        await ensureAudioMode();
      } catch (error) {
        if (tokenRef.current === ticket) {
          setState({ status: 'error', soundId, error: 'audio-mode' });
        }
        return { ok: false, reason: 'audio-mode' };
      }

      try {
        clearFadeTimers();
        player.pause();
        player.replace(asset);
        await player.seekTo(0).catch(() => {});
        player.volume = 1;
        player.play();
        if (tokenRef.current === ticket) {
          setState({ status: 'playing', soundId });
          const timeout = setTimeout(() => {
            const steps = 10;
            let currentStep = 0;
            fadeIntervalRef.current = setInterval(() => {
              currentStep += 1;
              const remaining = Math.max(0, 1 - currentStep / steps);
              player.volume = remaining;
              if (currentStep >= steps) {
                clearFadeTimers();
                player.pause();
                resetState();
              }
            }, 100);
          }, 4000);
          fadeTimeoutRef.current = timeout;
        }
        return { ok: true };
      } catch (error) {
        if (tokenRef.current === ticket) {
          setState({ status: 'error', soundId, error: 'playback' });
        }
        return { ok: false, reason: 'playback' };
      }
    },
    [clearFadeTimers, ensureAudioMode, player, resetState]
  );

  useEffect(() => {
    if (state.status !== 'playing') return;
    if (!status.playing && status.didJustFinish) {
      clearFadeTimers();
      resetState();
    }
  }, [clearFadeTimers, resetState, state.status, status.didJustFinish, status.playing]);

  useEffect(() => {
    return () => {
      clearFadeTimers();
    };
  }, [clearFadeTimers]);

  return {
    state,
    playPreview,
    stopPreview,
    isLoading: state.status === 'loading',
    isPlaying: state.status === 'playing',
  };
}
