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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showOverlayMenu, setShowOverlayMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (e.clientX < 80) {
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
          .split('\n')
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

  const handleEnded = () => {
    if (currentIndex < tracks.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const playTrackAtIndex = (index: number) => {
    setCurrentIndex(index);
    const mediaEl = mediaRef.current;
    if (mediaEl) {
      // Use a timeout to ensure the new src is loaded before playing
      setTimeout(() => {
        mediaEl.play().catch((e) => console.error("Playback failed", e));
      }, 150);
    }
  };

  const currentTrack = tracks[currentIndex];
  const isVideo = currentTrack?.match(/\.(mp4|webm|mov|ogg)($|\?)/i);
  const isImage = currentTrack?.match(/\.(jpg|jpeg|png|gif|webp|bmp)($|\?)/i);
  const currentType = isVideo ? 'video' : isImage ? 'image' : 'audio';

  useEffect(() => {
    if (isImage && currentIndex < tracks.length - 1) {
      const timer = setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isImage, tracks.length]);

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
          ? 'fixed inset-0 z-50 flex items-center justify-center bg-black'
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
            ? 'w-full h-full'
            : 'w-full bg-black rounded-lg mb-4 aspect-video overflow-hidden flex items-center justify-center'
        }`}
      >
        {currentType !== 'audio' && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover filter blur-2xl brightness-50 scale-110 pointer-events-none"
          />
        )}

        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 rounded-lg text-white transition-colors backdrop-blur-sm"
        >
          {isFullscreen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          )}
        </button>

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
            controls
            controlsList="nofullscreen"
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

            <div className={`absolute left-0 right-0 px-8 flex justify-center z-10 w-full ${isFullscreen ? 'bottom-16' : 'bottom-4'}`}>
              <audio
                ref={mediaRef as React.RefObject<HTMLAudioElement>}
                src={currentTrack}
                controls
                onEnded={handleEnded}
                className={`outline-none ${isFullscreen ? 'w-1/2' : 'w-full'}`}
              />
            </div>
          </div>
        )}

        {isFullscreen && (
          <div
            onMouseLeave={() => setShowOverlayMenu(false)}
            className={`absolute top-0 left-0 bottom-0 w-80 bg-black/80 backdrop-blur-md border-r border-white/10 p-4 transition-transform duration-300 ease-in-out z-40 overflow-y-auto custom-scrollbar ${
              showOverlayMenu ? 'translate-x-0' : '-translate-x-full'
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
                  <path d="M15 18l-6-6 6-6" />
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

      {!isFullscreen && (
        <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          {tracks.map((track, i) => {
            const isActive = i === currentIndex;
            return (
              <div
                key={i}
                className={`p-2.5 cursor-pointer rounded-xl mb-1 flex items-center gap-3 transition-colors ${
                  isActive ? 'bg-blue-50/50' : 'hover:bg-gray-50'
                }`}
                onClick={() => playTrackAtIndex(i)}
              >
                <div className="flex-shrink-0">
                  {isActive ? (
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors" />
                  )}
                </div>
                <span className={`text-[14px] leading-snug truncate ${isActive ? 'text-black font-semibold' : 'text-gray-700 font-medium'}`}>
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
