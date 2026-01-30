/**
 * ImageViewer Component
 * Modal para visualização de imagens em fullscreen
 * Features: Zoom, navegação, download, keyboard shortcuts
 */

import { useState, useEffect } from 'react';
import { FiX, FiZoomIn, FiZoomOut, FiDownload, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const ImageViewer = ({ images = [], initialIndex = 0, onClose, allowDownload = true }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [zoom, setZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const currentImage = Array.isArray(images) ? images[currentIndex] : images;
    const hasMultiple = Array.isArray(images) && images.length > 1;

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            switch (e.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowLeft':
                    if (hasMultiple && currentIndex > 0) {
                        handlePrevious();
                    }
                    break;
                case 'ArrowRight':
                    if (hasMultiple && currentIndex < images.length - 1) {
                        handleNext();
                    }
                    break;
                case '+':
                case '=':
                    handleZoomIn();
                    break;
                case '-':
                case '_':
                    handleZoomOut();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, images, onClose, hasMultiple]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            resetZoom();
        }
    };

    const handleNext = () => {
        if (currentIndex < images.length - 1) {
            setCurrentIndex(currentIndex + 1);
            resetZoom();
        }
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.5, 3));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.5, 0.5));
    };

    const resetZoom = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleDownload = async () => {
        try {
            const imageUrl = typeof currentImage === 'string' ? currentImage : currentImage?.url;
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `image-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading image:', error);
        }
    };

    const handleMouseDown = (e) => {
        if (zoom > 1) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && zoom > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const imageUrl = typeof currentImage === 'string' ? currentImage : currentImage?.url;

    return (
        <div
            className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
            onClick={onClose}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all"
                aria-label="Close"
            >
                <FiX className="text-2xl" />
            </button>

            {/* Controls */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-2 bg-black bg-opacity-50 rounded-full px-4 py-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleZoomOut();
                    }}
                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                    aria-label="Zoom out"
                >
                    <FiZoomOut className="text-xl" />
                </button>

                <span className="text-white text-sm font-medium min-w-[60px] text-center">
                    {Math.round(zoom * 100)}%
                </span>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleZoomIn();
                    }}
                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                    aria-label="Zoom in"
                >
                    <FiZoomIn className="text-xl" />
                </button>

                {allowDownload && (
                    <>
                        <div className="w-px h-6 bg-white bg-opacity-30 mx-2" />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDownload();
                            }}
                            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                            aria-label="Download"
                        >
                            <FiDownload className="text-xl" />
                        </button>
                    </>
                )}
            </div>

            {/* Image Counter */}
            {hasMultiple && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-black bg-opacity-50 rounded-full px-4 py-2">
                    <span className="text-white text-sm font-medium">
                        {currentIndex + 1} / {images.length}
                    </span>
                </div>
            )}

            {/* Previous Button */}
            {hasMultiple && currentIndex > 0 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePrevious();
                    }}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all"
                    aria-label="Previous image"
                >
                    <FiChevronLeft className="text-2xl" />
                </button>
            )}

            {/* Next Button */}
            {hasMultiple && currentIndex < images.length - 1 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleNext();
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all"
                    aria-label="Next image"
                >
                    <FiChevronRight className="text-2xl" />
                </button>
            )}

            {/* Image */}
            <div
                className="relative max-w-full max-h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            >
                <img
                    src={imageUrl}
                    alt="Full size"
                    className="max-w-full max-h-screen object-contain transition-transform duration-200"
                    style={{
                        transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                        transformOrigin: 'center',
                    }}
                    draggable={false}
                />
            </div>

            {/* Thumbnails */}
            {hasMultiple && images.length > 1 && (
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-10 flex gap-2 max-w-full overflow-x-auto px-4 py-2 bg-black bg-opacity-50 rounded-lg">
                    {images.map((img, index) => {
                        const thumbUrl = typeof img === 'string' ? img : img?.url;
                        return (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentIndex(index);
                                    resetZoom();
                                }}
                                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${index === currentIndex
                                        ? 'border-white scale-110'
                                        : 'border-transparent opacity-60 hover:opacity-100'
                                    }`}
                            >
                                <img
                                    src={thumbUrl}
                                    alt={`Thumbnail ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ImageViewer;
