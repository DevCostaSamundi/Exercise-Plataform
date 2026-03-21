import { useState, useEffect } from 'react';
import { FiX, FiChevronLeft, FiChevronRight, FiMaximize, FiDownload } from 'react-icons/fi';

const MediaViewer = ({ media = [], initialIndex = 0, onClose, allowDownload = false }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentMedia = media[currentIndex];
  const isVideo      = currentMedia?.type === 'video';
  const hasPrevious  = currentIndex > 0;
  const hasNext      = currentIndex < media.length - 1;

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape')      onClose();
      if (e.key === 'ArrowLeft'  && hasPrevious) previous();
      if (e.key === 'ArrowRight' && hasNext)     next();
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, hasPrevious, hasNext]);

  const previous = () => { if (hasPrevious) setCurrentIndex((p) => p - 1); };
  const next     = () => { if (hasNext)     setCurrentIndex((p) => p + 1); };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentMedia.url);
      const blob     = await response.blob();
      const url      = window.URL.createObjectURL(blob);
      const link     = document.createElement('a');
      link.href      = url;
      // ⚠️  CORRIGIDO: espaço removido — era `flowconnect-${Date.now()}. mp4`
      link.download  = `flowconnect-${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      {/* Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-10">
        <span className="text-sm text-white">{currentIndex + 1} / {media.length}</span>
        <div className="flex items-center gap-2">
          {allowDownload && (
            <button onClick={handleDownload} className="p-2 hover:bg-white/20 rounded-full text-white">
              <FiDownload className="text-xl" />
            </button>
          )}
          <button onClick={toggleFullscreen} className="p-2 hover:bg-white/20 rounded-full text-white">
            <FiMaximize className="text-xl" />
          </button>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full text-white">
            <FiX className="text-2xl" />
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center p-4">
        {isVideo ? (
          <video src={currentMedia.url} controls autoPlay className="max-w-full max-h-full rounded-lg" />
        ) : (
          <img src={currentMedia.url} alt={`Media ${currentIndex + 1}`} className="max-w-full max-h-full object-contain rounded-lg" />
        )}
      </div>

      {/* Navigation */}
      {media.length > 1 && (
        <>
          {hasPrevious && (
            <button onClick={previous} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white">
              <FiChevronLeft className="text-3xl" />
            </button>
          )}
          {hasNext && (
            <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white">
              <FiChevronRight className="text-3xl" />
            </button>
          )}
        </>
      )}

      {/* Thumbnails */}
      {media.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex gap-2 justify-center overflow-x-auto pb-2">
            {media.map((item, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                {item.type === 'video' ? (
                  <video src={item.url} className="w-full h-full object-cover" />
                ) : (
                  <img src={item.thumbnail || item.url} alt={`Thumb ${index + 1}`} className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaViewer;