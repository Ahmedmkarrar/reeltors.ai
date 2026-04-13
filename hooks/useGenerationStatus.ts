'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import type { Video } from '@/types';

const SELECTED_COLUMNS = [
  'id', 'user_id', 'title', 'status', 'render_id', 'template_id',
  'listing_address', 'listing_price', 'agent_name', 'source_images',
  'output_url', 'thumbnail_url', 'duration_seconds', 'format',
  'created_at', 'updated_at',
].join(', ');

const POLL_INTERVAL_MS = 4000;

interface UseGenerationStatusResult {
  videos: Video[];
  isLoaded: boolean;
  isUsingFallback: boolean;
  removeVideo: (id: string) => void;
}

export function useGenerationStatus(userId: string | null): UseGenerationStatusResult {
  const supabase = useRef(createClient()).current;
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallbackActiveRef = useRef(false);

  const fetchVideos = useCallback(async (): Promise<Video[]> => {
    if (!userId) return [];
    const { data } = await supabase
      .from('videos')
      .select(SELECTED_COLUMNS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    const rows = (data as unknown as Video[]) ?? [];
    setVideos(rows);
    return rows;
  }, [userId, supabase]);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const activateFallback = useCallback(() => {
    if (fallbackActiveRef.current) return;
    fallbackActiveRef.current = true;
    setIsUsingFallback(true);
    toast('Live connection lost — syncing every 4s', {
      icon: '📡',
      duration: 5000,
      id: 'ws-fallback',
    });
    pollRef.current = setInterval(async () => {
      const rows = await fetchVideos();
      const stillProcessing = rows.some(
        (v) => v.status === 'pending' || v.status === 'processing',
      );
      if (!stillProcessing) stopPoll();
    }, POLL_INTERVAL_MS);
  }, [fetchVideos, stopPoll]);

  useEffect(() => {
    if (!userId) return;

    fetchVideos().then((rows) => {
      setIsLoaded(true);
      // Start a bounded poll while processing in case WS is slow to connect.
      // It cancels itself once WS subscribes (see SUBSCRIBED handler below).
      const hasProcessing = rows.some(
        (v) => v.status === 'pending' || v.status === 'processing',
      );
      if (hasProcessing && !fallbackActiveRef.current) {
        const warmupTimer = setTimeout(activateFallback, 5000);
        // WebSocket subscribe clears this timer via the ref check
        return () => clearTimeout(warmupTimer);
      }
    });

    const channel = supabase
      .channel(`videos-status-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'videos',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setVideos((prev) => [payload.new as Video, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setVideos((prev) =>
              prev.map((v) =>
                v.id === (payload.new as Video).id ? (payload.new as Video) : v,
              ),
            );
          } else if (payload.eventType === 'DELETE') {
            setVideos((prev) =>
              prev.filter((v) => v.id !== (payload.old as Video).id),
            );
          }
        },
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('Supabase Realtime failed, activating polling fallback:', err);
          activateFallback();
        }
        if (status === 'SUBSCRIBED' && fallbackActiveRef.current) {
          // WebSocket recovered — stop polling and restore live mode
          stopPoll();
          fallbackActiveRef.current = false;
          setIsUsingFallback(false);
          toast.dismiss('ws-fallback');
        }
      });

    return () => {
      supabase.removeChannel(channel);
      stopPoll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const removeVideo = useCallback((id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  }, []);

  return { videos, isLoaded, isUsingFallback, removeVideo };
}
