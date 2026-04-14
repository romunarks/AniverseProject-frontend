import React, { useState, useEffect } from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { votacionService } from '../services/votacionService';

interface RatingComponentProps {
    animeId?: number;
    jikanId?: number;
    initialRating?: number;
    onRatingChange?: (rating: number) => void;
    size?: 'sm' | 'md' | 'lg';
    readOnly?: boolean;
    showAverage?: boolean;
    averageRating?: number;
    totalVotes?: number;
    className?: string;
}

export const RatingComponent: React.FC<RatingComponentProps> = ({
                                                                    animeId,
                                                                    jikanId,
                                                                    initialRating = 0,
                                                                    onRatingChange,
                                                                    size = 'md',
                                                                    readOnly = false,
                                                                    showAverage = false,
                                                                    averageRating,
                                                                    totalVotes,
                                                                    className = ''
                                                                }) => {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate(); // ✅ Soluciona "Unresolved navigate"

    // ✅ Soluciona "Unresolved userRating", "setError" y "setRating unused"
    const [userRating, setUserRating] = useState(initialRating);
    const [hoverRating, setHoverRating] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Verificar calificación inicial del usuario
    useEffect(() => {
        const fetchUserRating = async () => {
            if (!isAuthenticated || !user || (!animeId && !jikanId)) return;

            try {
                let result;
                if (animeId) {
                    result = await votacionService.getVotacionUsuarioAnime(user.id, animeId);
                } else if (jikanId) {
                    result = await votacionService.getVotacionUsuarioAnimeByJikanId(user.id, jikanId);
                }

                if (result && result.puntuacion) {
                    setUserRating(result.puntuacion);
                }
            } catch (err) {
                console.error('Error fetching user rating:', err);
            }
        };

        fetchUserRating();
    }, [isAuthenticated, user, animeId, jikanId]);

    const handleRating = async (rating: number) => {
        // ✅ "readOnly" ya está bien referenciado
        if (readOnly) return;

        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (!user || (!animeId && !jikanId)) {
            setError('Datos insuficientes para calificar');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const votacionData = {
                animeId: animeId || undefined,
                jikanId: jikanId || undefined,
                puntuacion: rating
            };

            // Llamada al backend con UPSERT
            const result = await votacionService.createVotacion(votacionData);

            if (result) {
                setUserRating(rating);
                if (onRatingChange) {
                    onRatingChange(rating);
                }
            }
            // ✅ Soluciona el ESLint "Unexpected any"
        } catch (err: unknown) {
            console.error('Error rating anime:', err);
            if (err instanceof Error) {
                setError(err.message || 'Error al calificar');
            } else {
                setError('Error al calificar');
            }
            setTimeout(() => setError(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    const getStarSize = () => {
        switch (size) {
            case 'sm': return 'text-sm';
            case 'lg': return 'text-2xl';
            default: return 'text-lg';
        }
    };

    const getContainerPadding = () => {
        switch (size) {
            case 'sm': return 'p-1';
            case 'lg': return 'p-3';
            default: return 'p-2';
        }
    };

    const renderStars = () => {
        return [1, 2, 3, 4, 5].map((star) => {
            const isActive = star <= (hoverRating || userRating);
            const isHovered = !readOnly && star <= hoverRating;

            return (
                <button
                    key={star}
                    type="button"
                    onClick={() => handleRating(star)}
                    onMouseEnter={() => !readOnly && setHoverRating(star)}
                    onMouseLeave={() => !readOnly && setHoverRating(0)}
                    disabled={loading || readOnly}
                    className={`
                        ${getStarSize()}
                        ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
                        ${isActive ? 'text-yellow-400' : 'text-gray-300'}
                        ${isHovered ? 'text-yellow-500' : ''}
                        ${loading ? 'opacity-50' : ''}
                        transition-all duration-150
                        ${!isAuthenticated && !readOnly ? 'opacity-50' : ''}
                    `}
                    title={
                        readOnly
                            ? `Calificación: ${star}/5`
                            : !isAuthenticated
                                ? 'Inicia sesión para calificar'
                                : `Calificar con ${star} estrella${star !== 1 ? 's' : ''}`
                    }
                >
                    {isActive ? <FaStar /> : <FaRegStar />}
                </button>
            );
        });
    };

    return (
        <div className={`${className}`}>
            <div className={`flex flex-col items-center ${getContainerPadding()}`}>
                <div className="flex items-center gap-1 mb-2">
                    {loading ? (
                        <div className="flex items-center gap-1">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-yellow-400"></div>
                            <span className="text-sm text-gray-500">Cargando...</span>
                        </div>
                    ) : (
                        renderStars()
                    )}
                </div>

                <div className="text-center">
                    {showAverage && averageRating !== undefined && (
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">{averageRating.toFixed(1)}</span>
                            {totalVotes !== undefined && (
                                <span className="text-gray-500"> ({totalVotes} voto{totalVotes !== 1 ? 's' : ''})</span>
                            )}
                        </div>
                    )}

                    {!readOnly && userRating > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                            Tu calificación: {userRating}/5
                        </div>
                    )}

                    {!readOnly && !isAuthenticated && (
                        <div className="text-xs text-gray-500 mt-1">
                            <button
                                onClick={() => navigate('/login')}
                                className="text-aniverse-purple hover:underline"
                            >
                                Inicia sesión para calificar
                            </button>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mt-2 px-2 py-1 bg-red-100 border border-red-300 text-red-700 text-xs rounded-md">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};