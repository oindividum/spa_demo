import { useState, useEffect, useRef } from 'react';

interface PlaylistPlayerProps {
  m3uUrl: string;
  basePath: string;
}

export const PlaylistPlayer = ({ m3uUrl, basePath }: PlaylistPlayerProps) => {
  const [tracks, setTracks] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const mediaRef = useRef<HTMLMediaElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const imageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imageElapsedRef = useRef<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showOverlayMenu, setShowOverlayMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [imageCountdown, setImageCountdown] = useState<number | null>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch((err: Error) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      await document.exitFullscreen();
    }
  };

  useEffect(() => {
    if (!isFullscreen) {
      setShowOverlayMenu(false);
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;

    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientX > window.innerWidth - 120) {
        setShowOverlayMenu(true);
      }

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setShowOverlayMenu(false);
      }, 3000);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isFullscreen]);

  useEffect(() => {
    fetch(m3uUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.text();
      })
      .then((text) => {
        const lines = text
          .split(/\r\n|\r|\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0 && !l.startsWith('#'));

        const resolvedTracks = lines.map((line) => {
          if (line.startsWith('http://') || line.startsWith('https://')) {
            return line;
          }

          const cleanBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
          const cleanLine = line.startsWith('/') ? line.slice(1) : line;
          return `${cleanBase}/${encodeURIComponent(cleanLine)}`;
        });

        setTracks(resolvedTracks);
        setError(null);
      })
      .catch((err: Error) => {
        console.error('Failed to load playlist', err);
        setError('Ошибка загрузки плейлиста');
      });
  }, [m3uUrl, basePath]);

  const getTrackName = (url: string) => {
    try {
      const parts = url.split('/');
      const last = parts[parts.length - 1] ?? url;
      const cleanLast = last.split('?')[0] ?? last;
      return decodeURIComponent(cleanLast);
    } catch {
      return url;
    }
  };

  const autoAdvanceRef = useRef(false);

  const handleEnded = () => {
    if (currentIndex < tracks.length - 1) {
      autoAdvanceRef.current = true;
      setCurrentIndex(currentIndex + 1);
    }
  };

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < tracks.length - 1;

  const handlePrevious = () => {
    if (!hasPrevious) return;
    playTrackAtIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (!hasNext) return;
    playTrackAtIndex(currentIndex + 1);
  };

  const playTrackAtIndex = (index: number) => {
    if (isPlaying) {
      autoAdvanceRef.current = true;
    }
    setCurrentIndex(index);
  };

  const currentTrack = tracks[currentIndex];
  const isVideo = !!currentTrack?.match(/\.(mp4|webm|mov|ogg)($|\?)/i);
  const isImage = !!currentTrack?.match(/\.(jpg|jpeg|png|gif|webp|bmp)($|\?)/i);
  const currentType = isVideo ? 'video' : isImage ? 'image' : 'audio';
  const isPlayableMedia = currentType === 'video' || currentType === 'audio' || currentType === 'image';

  const formatTime = (timeInSec: number) => {
    if (!Number.isFinite(timeInSec) || timeInSec < 0) return '0:00';
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    if (currentType === 'image') {
      if (isPlaying) {
        // пауза: останавливаем таймеры, сохраняем прогресс
        if (imageIntervalRef.current) clearInterval(imageIntervalRef.current);
        if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
        imageIntervalRef.current = null;
        imageTimerRef.current = null;
        setIsPlaying(false);
      } else {
        // возобновление: запускаем таймер с текущей позиции
        setIsPlaying(true);
        startImageTimer(imageElapsedRef.current, currentIndex);
      }
      return;
    }
    const mediaEl = mediaRef.current;
    if (!mediaEl) return;

    if (mediaEl.paused) {
      mediaEl.play().catch((e) => console.error('Playback failed', e));
    } else {
      mediaEl.pause();
    }
  };

  const handleStop = () => {
    if (currentType === 'image') {
      if (imageIntervalRef.current) clearInterval(imageIntervalRef.current);
      if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
      imageIntervalRef.current = null;
      imageTimerRef.current = null;
      imageElapsedRef.current = 0;
      setCurrentTime(0);
      setImageCountdown(IMAGE_DISPLAY_SECONDS);
      setIsPlaying(false);
      return;
    }
    const mediaEl = mediaRef.current;
    if (!mediaEl) return;
    mediaEl.pause();
    mediaEl.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleSeek = (value: number) => {
    if (currentType === 'image') {
      startImageTimer(Math.floor(value), currentIndex);
      return;
    }
    const mediaEl = mediaRef.current;
    if (!mediaEl || !Number.isFinite(duration) || duration <= 0) return;
    mediaEl.currentTime = value;
    setCurrentTime(value);
  };

  const handleVolumeChange = (value: number) => {
    const mediaEl = mediaRef.current;
    setVolume(value);
    if (!mediaEl) return;
    mediaEl.volume = value;
    const shouldMute = value === 0;
    mediaEl.muted = shouldMute;
    setIsMuted(shouldMute);
  };

  const toggleMute = () => {
    const mediaEl = mediaRef.current;
    if (!mediaEl) return;
    const nextMuted = !mediaEl.muted;
    mediaEl.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const IMAGE_DISPLAY_SECONDS = 10;

  const TICK_MS = 100;

  const startImageTimer = (fromSeconds: number, forIndex: number) => {
    console.log('[ImageTimer] startImageTimer called, fromSeconds:', fromSeconds, 'forIndex:', forIndex, 'time:', Date.now());
    if (imageIntervalRef.current) clearInterval(imageIntervalRef.current);
    if (imageTimerRef.current) clearTimeout(imageTimerRef.current);

    imageElapsedRef.current = fromSeconds;
    setCurrentTime(fromSeconds);
    setImageCountdown(Math.ceil(IMAGE_DISPLAY_SECONDS - fromSeconds));

    const remaining = (IMAGE_DISPLAY_SECONDS - fromSeconds) * 1000;
    console.log('[ImageTimer] remaining ms:', remaining);

    imageIntervalRef.current = setInterval(() => {
      imageElapsedRef.current = Math.min(
        imageElapsedRef.current + TICK_MS / 1000,
        IMAGE_DISPLAY_SECONDS
      );
      setCurrentTime(imageElapsedRef.current);
      setImageCountdown(Math.ceil(IMAGE_DISPLAY_SECONDS - imageElapsedRef.current));
      if (imageElapsedRef.current >= IMAGE_DISPLAY_SECONDS) {
        clearInterval(imageIntervalRef.current!);
      }
    }, TICK_MS);

    imageTimerRef.current = setTimeout(() => {
      console.log('[ImageTimer] setTimeout FIRED, forIndex:', forIndex, 'time:', Date.now());
      setCurrentIndex(prev => {
        console.log('[ImageTimer] setCurrentIndex updater, prev:', prev, 'forIndex:', forIndex);
        if (prev !== forIndex) {
          console.log('[ImageTimer] BLOCKED — prev !== forIndex');
          return prev;
        }
        autoAdvanceRef.current = true;
        return prev + 1;
      });
    }, remaining);
  };

  useEffect(() => {
    if (isImage) {
      setImageCountdown(IMAGE_DISPLAY_SECONDS);
      setDuration(IMAGE_DISPLAY_SECONDS);
      setIsPlaying(true);
      startImageTimer(0, currentIndex);

      return () => {
        if (imageIntervalRef.current) clearInterval(imageIntervalRef.current);
        if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
        setImageCountdown(null);
        setIsPlaying(false);
      };
    } else {
      if (imageIntervalRef.current) clearInterval(imageIntervalRef.current);
      if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
      setImageCountdown(null);
      if (currentType !== 'image') {
        setDuration(0);
        setCurrentTime(0);
      }
    }
  }, [currentIndex, isImage, tracks.length]);

  useEffect(() => {
    const mediaEl = mediaRef.current;
    if (!mediaEl || currentType === 'image') {
      setIsPlaying(false);
      if (currentType !== 'image') {
        setCurrentTime(0);
        setDuration(0);
      }
      return;
    }

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(mediaEl.currentTime || 0);
    const onLoadedMetadata = () => {
      setDuration(Number.isFinite(mediaEl.duration) ? mediaEl.duration : 0);
      setCurrentTime(mediaEl.currentTime || 0);
      setVolume(mediaEl.volume);
      setIsMuted(mediaEl.muted);
    };
    const onCanPlay = () => {
      setError(null);
      if (autoAdvanceRef.current) {
        autoAdvanceRef.current = false;
        setIsPlaying(true);
        mediaEl.play().catch((e) => {
          setIsPlaying(false);
          console.error('Autoplay failed', e);
        });
      }
    };
    const onMediaError = () => {
      const code = mediaEl.error?.code;
      if (code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
        showToast('Формат не поддерживается браузером');
      } else if (code === MediaError.MEDIA_ERR_NETWORK) {
        showToast('Ошибка сети: не удалось загрузить файл');
      } else if (code) {
        showToast('Ошибка воспроизведения');
      }
      setIsPlaying(false);
    };
    const onEnded = () => {
      if (currentIndex >= tracks.length - 1) return;
      autoAdvanceRef.current = true;
      setCurrentIndex(currentIndex + 1);
    };

    mediaEl.addEventListener('play', onPlay);
    mediaEl.addEventListener('pause', onPause);
    mediaEl.addEventListener('timeupdate', onTimeUpdate);
    mediaEl.addEventListener('loadedmetadata', onLoadedMetadata);
    mediaEl.addEventListener('durationchange', onLoadedMetadata);
    mediaEl.addEventListener('canplay', onCanPlay);
    mediaEl.addEventListener('ended', onEnded);
    mediaEl.addEventListener('error', onMediaError);

    onLoadedMetadata();
    setError(null);
    setToast(null);
    // если флаг уже выставлен (переход автоматический), сразу пробуем играть
    if (autoAdvanceRef.current) {
      autoAdvanceRef.current = false;
      setIsPlaying(true);
      mediaEl.play().catch((e) => {
        setIsPlaying(false);
        console.error('Autoplay failed', e);
      });
    }

    return () => {
      mediaEl.removeEventListener('play', onPlay);
      mediaEl.removeEventListener('pause', onPause);
      mediaEl.removeEventListener('timeupdate', onTimeUpdate);
      mediaEl.removeEventListener('loadedmetadata', onLoadedMetadata);
      mediaEl.removeEventListener('durationchange', onLoadedMetadata);
      mediaEl.removeEventListener('canplay', onCanPlay);
      mediaEl.removeEventListener('ended', onEnded);
      mediaEl.removeEventListener('error', onMediaError);
    };
  }, [currentTrack, currentType]);

  useEffect(() => {
    const videoEl =
      currentType === 'video'
        ? (mediaRef.current as HTMLVideoElement | null)
        : null;
    const imageEl = imageRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId = 0;

    const draw = (source: HTMLVideoElement | HTMLImageElement) => {
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    };

    const animate = () => {
      if (videoEl && !videoEl.paused && !videoEl.ended) {
        draw(videoEl);
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    const handleLoadedData = () => {
      if (!videoEl) return;
      canvas.width = Math.max(1, Math.floor(videoEl.videoWidth / 10));
      canvas.height = Math.max(1, Math.floor(videoEl.videoHeight / 10));
      animate();
    };

    const handlePause = () => {
      cancelAnimationFrame(animationFrameId);
    };

    if (currentType === 'video' && videoEl) {
      videoEl.addEventListener('loadeddata', handleLoadedData);
      videoEl.addEventListener('play', animate);
      videoEl.addEventListener('pause', handlePause);
    } else if (currentType === 'image' && imageEl) {
      const drawImage = () => {
        canvas.width = Math.max(1, Math.floor(imageEl.naturalWidth / 10));
        canvas.height = Math.max(1, Math.floor(imageEl.naturalHeight / 10));
        draw(imageEl);
      };

      imageEl.addEventListener('load', drawImage);
      if (imageEl.complete) {
        drawImage();
      }

      return () => {
        imageEl.removeEventListener('load', drawImage);
      };
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (videoEl) {
        videoEl.removeEventListener('loadeddata', handleLoadedData);
        videoEl.removeEventListener('play', animate);
        videoEl.removeEventListener('pause', handlePause);
      }
    };
  }, [currentTrack, currentType]);

  if (error) {
    return <div className="text-red-500 text-sm p-4 bg-red-50 rounded-lg">{error}</div>;
  }

  if (tracks.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={`bg-white font-sans ${
        isFullscreen
          ? 'fixed inset-0 z-50 flex flex-col bg-black'
          : 'border border-gray-100 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] p-5 rounded-2xl my-4 w-full'
      }`}
    >
      {!isFullscreen && (
        <div className="flex items-center gap-2 mb-4">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-black"
          >
            <polygon points="14 2 18 6 7 16.5 3 17 3.5 13 14 2" />
            <line x1="3" y1="22" x2="21" y2="22" />
          </svg>
          <div className="text-[18px] font-medium text-black tracking-tight m-0 p-0 line-clamp-1">
            Медиа Плейлист
          </div>
          <span className="text-[13px] text-[#8C8C8C] ml-auto font-medium">
            {currentIndex + 1} / {tracks.length}
          </span>
        </div>
      )}

      <div
        className={`relative ${
          isFullscreen
            ? 'w-full flex-1 min-h-0'
            : 'w-full bg-black rounded-t-lg aspect-video overflow-hidden flex items-center justify-center'
        }`}
      >
        {currentType !== 'audio' && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover filter blur-2xl brightness-50 scale-110 pointer-events-none"
          />
        )}

        {isImage ? (
          <img
            ref={imageRef}
            src={currentTrack}
            className="w-full h-full object-contain relative z-10"
            alt={getTrackName(currentTrack)}
            crossOrigin="anonymous"
          />
        ) : isVideo ? (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={currentTrack}
            onEnded={handleEnded}
            className="w-full h-full object-contain relative z-10"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#0F172A] relative">
            <svg
              width="120"
              height="120"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>

            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={currentTrack}
              onEnded={handleEnded}
              className="hidden"
            />
          </div>
        )}

        {isFullscreen && (
          <div
            onMouseLeave={() => setShowOverlayMenu(false)}
            className={`absolute top-4 right-4 bottom-4 w-80 bg-black/55 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-4 transition-transform duration-300 ease-in-out z-40 overflow-y-auto custom-scrollbar ${
              showOverlayMenu ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between text-white/90 font-medium mb-4 pb-2 border-b border-white/10">
              <span>Плейлист ({currentIndex + 1} / {tracks.length})</span>
              <button
                onClick={() => setShowOverlayMenu(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                title="Скрыть панель"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            {tracks.map((track, i) => {
              const isActive = i === currentIndex;
              return (
                <div
                  key={i}
                  className={`p-3 cursor-pointer rounded-xl mb-2 flex items-center gap-3 transition-colors ${
                    isActive ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
                  onClick={() => playTrackAtIndex(i)}
                >
                  <div className="flex-shrink-0">
                    {isActive ? (
                      <div className="w-4 h-4 rounded-full bg-blue-500" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/50" />
                    )}
                  </div>
                  <span className={`text-sm truncate ${isActive ? 'text-white font-semibold' : 'text-white/70'}`}>
                    {getTrackName(track)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && (
        <div className={`flex items-center gap-2 px-3 py-2 text-sm ${
          isFullscreen
            ? 'bg-red-900/60 text-red-300 border-t border-red-500/20'
            : 'bg-red-50 text-red-500 border border-red-100 rounded-none'
        }`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {toast}
        </div>
      )}

      <div
        className={`flex items-center gap-2 ${
          isFullscreen
            ? 'w-full px-4 py-3 border-t border-white/10 bg-black/85 text-white'
            : 'px-3 py-2 bg-gray-100 border border-gray-200 rounded-b-xl text-gray-900'
        }`}
      >
        {tracks.length > 1 && (
          <button
            onClick={handlePrevious}
            disabled={!hasPrevious}
            title="Предыдущий файл"
            className={`p-2 rounded border transition-colors ${
              hasPrevious
                ? isFullscreen
                  ? 'bg-white/10 hover:bg-white/20 border-white/20'
                  : 'bg-white hover:bg-gray-200 border-gray-300'
                : isFullscreen
                ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}

        <button
          onClick={togglePlayPause}
          disabled={!isPlayableMedia}
          title={isPlaying ? 'Пауза' : 'Воспроизвести'}
          className={`p-2 rounded border transition-colors ${
            isPlayableMedia
              ? isFullscreen
                ? 'bg-white/10 hover:bg-white/20 border-white/20'
                : 'bg-white hover:bg-gray-200 border-gray-300'
              : isFullscreen
              ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
              : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>

        <button
          onClick={handleStop}
          disabled={!isPlayableMedia}
          title="Стоп"
          className={`p-2 rounded border transition-colors ${
            isPlayableMedia
              ? isFullscreen
                ? 'bg-white/10 hover:bg-white/20 border-white/20'
                : 'bg-white hover:bg-gray-200 border-gray-300'
              : isFullscreen
              ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
              : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="1" /></svg>
        </button>

        {tracks.length > 1 && (
          <button
            onClick={handleNext}
            disabled={!hasNext}
            title="Следующий файл"
            className={`p-2 rounded border transition-colors ${
              hasNext
                ? isFullscreen
                  ? 'bg-white/10 hover:bg-white/20 border-white/20'
                  : 'bg-white hover:bg-gray-200 border-gray-300'
                : isFullscreen
                ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}

        <div className={`text-xs tabular-nums w-24 text-center ${isFullscreen ? 'text-white/80' : 'text-gray-700'}`}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <input
          type="range"
          min={0}
          max={duration > 0 ? duration : 0}
          step={0.1}
          value={duration > 0 ? Math.min(currentTime, duration) : 0}
          onChange={(e) => handleSeek(Number(e.target.value))}
          disabled={!isPlayableMedia || duration <= 0}
          className="flex-1 accent-blue-500 disabled:opacity-40"
          title="Прогресс"
        />

        <button
          onClick={toggleMute}
          disabled={!isPlayableMedia}
          title={isMuted ? 'Включить звук' : 'Выключить звук'}
          className={`p-2 rounded border transition-colors ${
            isPlayableMedia
              ? isFullscreen
                ? 'bg-white/10 hover:bg-white/20 border-white/20'
                : 'bg-white hover:bg-gray-200 border-gray-300'
              : isFullscreen
              ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
              : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isMuted || volume === 0 ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            </svg>
          )}
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
          disabled={!isPlayableMedia}
          className="w-24 accent-green-500 disabled:opacity-40"
          title="Громкость"
        />

        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'}
          className={`p-2 rounded border transition-colors ${
            isFullscreen
              ? 'bg-white/10 hover:bg-white/20 border-white/20'
              : 'bg-white hover:bg-gray-200 border-gray-300'
          }`}
        >
          {isFullscreen ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          )}
        </button>
      </div>

      {!isFullscreen && (
        <div className="mt-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar -mx-2 px-2">
          {tracks.map((track, i) => {
            const isActive = i === currentIndex;
            return (
              <div
                key={i}
                className={`p-2.5 cursor-pointer rounded-lg mb-1 flex items-center gap-3 transition-colors ${
                  isActive ? 'bg-blue-50/50' : 'hover:bg-gray-50 text-gray-700'
                }`}
                onClick={() => playTrackAtIndex(i)}
              >
                <div className="flex-shrink-0">
                  {isActive ? (
                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors" />
                  )}
                </div>
                <span className={`text-[14px] leading-snug truncate font-medium`}>
                  {getTrackName(track)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
