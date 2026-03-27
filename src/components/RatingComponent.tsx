// src/components/RatingComponent.tsx
import React, { useState } from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { votacionService } from '../services/votacionService';
import { useAuth } from '../context/AuthContext';

interface RatingComponentProps {
    animeId?: number;
    jikanId?: number;
    initialRating?: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export const RatingComponent: React.FC<RatingComponentProps> = ({
                                                                    animeId,
                                                                    jikanId,
                                                                    initialRating = 0,
                                                                    onRatingChange,
                                                                    readonly = false,
                                                                    size = 'md',
                                                                    showLabel = true
                                                                }) => {
    const { isAuthenticated, user } = useAuth();
    const [rating, setRating] = useState(initialRating);
    const [hoverRating, setHoverRating] = useState(0);
    const [loading, setLoading] = useState(false);

    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-lg',
        lg: 'text-2xl'
    };

    const iconSizes = {
        sm: 14,
        md: 18,
        lg: 24
    };

    const handleRating = async (newRating: number) => {
        if (readonly || !isAuthenticated || !user || loading) {
            if (!isAuthenticated) {
                alert('Debes iniciar sesión para calificar');
            }
            return;
        }

        if (!animeId && !jikanId) {
            console.error('No se proporcionó animeId ni jikanId');
            return;
        }

        try {
            setLoading(true);

            const payload: any = { puntuacion: newRating };
            if (animeId) payload.animeId = animeId;
            if (jikanId) payload.jikanId = jikanId;

            await votacionService.createVotacion(payload);

            setRating(newRating);
            onRatingChange?.(newRating);

        } catch (error) {
            console.error('Error rating anime:', error);
            alert('Error al calificar el anime');
        } finally {
            setLoading(false);
        }
    };

    const currentRating = hoverRating || rating;

    return (
        <div className="flex flex-col items-start">
            {showLabel && (
                <p className="text-sm text-gray-600 mb-2">
                    {readonly ? 'Calificación' : '¿Qué te pareció?'}
                </p>
            )}

            <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => handleRating(star)}
                        onMouseEnter={() => !readonly && !loading && setHoverRating(star)}
                        onMouseLeave={() => !readonly && !loading && setHoverRating(0)}
                        disabled={readonly || !isAuthenticated || loading}
                        className={`${sizeClasses[size]} ${
                            readonly || !isAuthenticated || loading
                                ? 'cursor-default'
                                : 'cursor-pointer hover:scale-110'
                        } transition-all duration-200 ${
                            loading ? 'opacity-50' : ''
                        }`}
                    >
                        {currentRating >= star ? (
                            <FaStar
                                className="text-yellow-400"
                                size={iconSizes[size]}
                            />
                        ) : (
                            <FaRegStar
                                className="text-gray-400"
                                size={iconSizes[size]}
                            />
                        )}
                    </button>
                ))}

                {loading && (
                    <div className="ml-2 animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                )}
            </div>

            {!isAuthenticated && !readonly && (
                <p className="text-xs text-gray-500 mt-1">
                    Inicia sesión para calificar
                </p>
            )}

            {rating > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                    Tu calificación: {rating}/5 estrellas
                </p>
            )}
        </div>
    );
};