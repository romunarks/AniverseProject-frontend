// src/components/StarRating.tsx - Siguiendo el patrón de Aniverse
import React, { useState } from 'react';
import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';

interface StarRatingProps {
    rating: number;
    onRatingChange?: (rating: number) => void;
    readOnly?: boolean;
    size?: 'sm' | 'md' | 'lg';
    showNumber?: boolean;
    maxRating?: number;
    className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
                                                          rating,
                                                          onRatingChange,
                                                          readOnly = false,
                                                          size = 'md',
                                                          showNumber = true,
                                                          maxRating = 10,
                                                          className = ''
                                                      }) => {
    const [hoverRating, setHoverRating] = useState(0);

    // Convertir rating de escala 1-10 a escala 1-5 para estrellas
    const starsRating = rating / 2;
    const starsHover = hoverRating / 2;
    const displayRating = (readOnly ? starsRating : (starsHover || starsRating));

    const getSizeClasses = () => {
        switch (size) {
            case 'sm': return 'text-sm';
            case 'lg': return 'text-xl';
            default: return 'text-base';
        }
    };

    const getStarSize = () => {
        switch (size) {
            case 'sm': return 'w-4 h-4';
            case 'lg': return 'w-6 h-6';
            default: return 'w-5 h-5';
        }
    };

    const handleStarClick = (starValue: number) => {
        if (!readOnly && onRatingChange) {
            // Convertir de escala de estrellas (1-5) a escala de puntuación (1-10)
            const newRating = starValue * 2;
            onRatingChange(newRating);
        }
    };

    const handleStarHover = (starValue: number) => {
        if (!readOnly) {
            setHoverRating(starValue * 2); // Convertir a escala 1-10
        }
    };

    const handleMouseLeave = () => {
        if (!readOnly) {
            setHoverRating(0);
        }
    };

    const renderStar = (starIndex: number) => {
        const filled = displayRating >= starIndex;
        const halfFilled = displayRating >= starIndex - 0.5 && displayRating < starIndex;

        let StarIcon = FaRegStar;
        let colorClass = 'text-gray-300';

        if (filled) {
            StarIcon = FaStar;
            colorClass = 'text-yellow-400';
        } else if (halfFilled) {
            StarIcon = FaStarHalfAlt;
            colorClass = 'text-yellow-400';
        }

        // Agregar hover colors si no es readonly
        if (!readOnly) {
            if (hoverRating >= starIndex * 2) {
                colorClass = 'text-yellow-500';
            }
        }

        return (
            <button
                key={starIndex}
                type="button"
                className={`${getStarSize()} ${colorClass} ${
                    readOnly
                        ? 'cursor-default'
                        : 'cursor-pointer hover:text-yellow-500 transition-colors duration-150'
                } focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 rounded`}
                onClick={() => handleStarClick(starIndex)}
                onMouseEnter={() => handleStarHover(starIndex)}
                onMouseLeave={handleMouseLeave}
                disabled={readOnly}
                title={`${starIndex * 2}/10`}
            >
                <StarIcon className="w-full h-full" />
            </button>
        );
    };

    return (
        <div className={`flex items-center space-x-1 ${className}`}>
            {/* Estrellas */}
            <div className="flex items-center space-x-0.5">
                {Array.from({ length: 5 }, (_, index) => renderStar(index + 1))}
            </div>

            {/* Número de puntuación */}
            {showNumber && (
                <div className={`ml-2 ${getSizeClasses()}`}>
                    <span className="font-medium text-gray-700">
                        {rating.toFixed(1)}/10
                    </span>
                    {!readOnly && hoverRating > 0 && (
                        <span className="text-gray-500 ml-1">
                            ({hoverRating.toFixed(1)})
                        </span>
                    )}
                </div>
            )}

            {/* Indicador de interactividad */}
            {!readOnly && (
                <div className="text-xs text-gray-400 ml-2">
                    {hoverRating > 0 ? 'Suelta para calificar' : 'Haz clic para calificar'}
                </div>
            )}
        </div>
    );
};

// Componente simplificado para mostrar solo la puntuación
export const StarRatingDisplay: React.FC<{
    rating: number;
    size?: 'sm' | 'md' | 'lg';
    showNumber?: boolean;
    className?: string;
}> = ({ rating, size = 'md', showNumber = true, className = '' }) => {
    return (
        <StarRating
            rating={rating}
            readOnly={true}
            size={size}
            showNumber={showNumber}
            className={className}
        />
    );
};