// src/components/AnimeRatingDisplay.tsx - Siguiendo el patrón de Aniverse
import React, { useState, useEffect } from 'react';
import { FaStar, FaRegStar, FaStarHalfAlt, FaChartBar, FaUsers } from 'react-icons/fa';
import { resenyaService, EstadisticasAnime } from '../services/resenyaService';
import { StarRatingDisplay } from './StarRating';

interface AnimeRatingDisplayProps {
    animeId?: number;
    jikanId?: number;
    showDetailedStats?: boolean;
    showReviewsLink?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    onReviewsClick?: () => void;
}

interface RatingBreakdown {
    puntuacion: number;
    count: number;
    percentage: number;
}

export const AnimeRatingDisplay: React.FC<AnimeRatingDisplayProps> = ({
                                                                          animeId,
                                                                          jikanId,
                                                                          showDetailedStats = false,
                                                                          showReviewsLink = false,
                                                                          size = 'md',
                                                                          className = '',
                                                                          onReviewsClick
                                                                      }) => {
    const [estadisticas, setEstadisticas] = useState<EstadisticasAnime | null>(null);
    const [breakdown, setBreakdown] = useState<RatingBreakdown[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Cargar estadísticas
    useEffect(() => {
        const loadEstadisticas = async () => {
            if (!animeId && !jikanId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                let stats: EstadisticasAnime | Partial<EstadisticasAnime>;

                if (animeId) {
                    stats = await resenyaService.getEstadisticasAnime(animeId);
                } else {
                    stats = await resenyaService.getEstadisticasPorJikanId(jikanId!);
                }

                setEstadisticas({
                    animeId: animeId || 0,
                    puntuacionPromedio: stats.puntuacionPromedio || 0,
                    totalResenyas: stats.totalResenyas || 0
                });

                // Generar breakdown simulado (en una implementación real, esto vendría del backend)
                if (stats.totalResenyas && stats.totalResenyas > 0) {
                    generateRatingBreakdown(stats.puntuacionPromedio || 0, stats.totalResenyas);
                }

            } catch (err) {
                console.error('Error loading anime statistics:', err);
                setError('No se pudieron cargar las estadísticas');
                setEstadisticas({
                    animeId: animeId || 0,
                    puntuacionPromedio: 0,
                    totalResenyas: 0
                });
            } finally {
                setLoading(false);
            }
        };

        loadEstadisticas();
    }, [animeId, jikanId]);

    // Generar breakdown de puntuaciones (simulado)
    const generateRatingBreakdown = (promedio: number, total: number) => {
        // Distribución simulada basada en el promedio
        const distribution = [
            { puntuacion: 10, weight: promedio >= 9 ? 0.3 : 0.1 },
            { puntuacion: 9, weight: promedio >= 8 ? 0.25 : 0.15 },
            { puntuacion: 8, weight: promedio >= 7 ? 0.2 : 0.2 },
            { puntuacion: 7, weight: promedio >= 6 ? 0.15 : 0.25 },
            { puntuacion: 6, weight: promedio >= 5 ? 0.1 : 0.15 },
            { puntuacion: 5, weight: 0.05 },
            { puntuacion: 4, weight: 0.03 },
            { puntuacion: 3, weight: 0.02 },
            { puntuacion: 2, weight: 0.01 },
            { puntuacion: 1, weight: 0.01 }
        ];

        const breakdown = distribution.map(item => {
            const count = Math.round(total * item.weight);
            const percentage = (count / total) * 100;
            return {
                puntuacion: item.puntuacion,
                count,
                percentage
            };
        }).filter(item => item.count > 0);

        setBreakdown(breakdown);
    };

    // Función para obtener el color basado en la puntuación
    const getRatingColor = (rating: number): string => {
        if (rating >= 8.5) return 'text-green-600';
        if (rating >= 7.0) return 'text-lime-600';
        if (rating >= 6.0) return 'text-yellow-600';
        if (rating >= 4.0) return 'text-orange-600';
        return 'text-red-600';
    };

    // Función para obtener el color de fondo
    const getRatingBgColor = (rating: number): string => {
        if (rating >= 8.5) return 'bg-green-100 border-green-200';
        if (rating >= 7.0) return 'bg-lime-100 border-lime-200';
        if (rating >= 6.0) return 'bg-yellow-100 border-yellow-200';
        if (rating >= 4.0) return 'bg-orange-100 border-orange-200';
        return 'bg-red-100 border-red-200';
    };

    // Función para obtener la descripción textual
    const getRatingDescription = (rating: number): string => {
        if (rating >= 9.0) return 'Obra maestra';
        if (rating >= 8.0) return 'Excelente';
        if (rating >= 7.0) return 'Muy bueno';
        if (rating >= 6.0) return 'Bueno';
        if (rating >= 5.0) return 'Regular';
        if (rating >= 4.0) return 'Por debajo del promedio';
        if (rating >= 3.0) return 'Malo';
        if (rating >= 2.0) return 'Muy malo';
        return 'Horrible';
    };

    // Configuración de tamaños
    const getSizeConfig = () => {
        switch (size) {
            case 'sm':
                return {
                    container: 'p-3',
                    ratingText: 'text-2xl',
                    maxText: 'text-xs',
                    descText: 'text-xs',
                    statsText: 'text-xs',
                    starSize: 'sm' as const
                };
            case 'lg':
                return {
                    container: 'p-6',
                    ratingText: 'text-5xl',
                    maxText: 'text-lg',
                    descText: 'text-base',
                    statsText: 'text-sm',
                    starSize: 'lg' as const
                };
            case 'xl':
                return {
                    container: 'p-8',
                    ratingText: 'text-6xl',
                    maxText: 'text-xl',
                    descText: 'text-lg',
                    statsText: 'text-base',
                    starSize: 'lg' as const
                };
            default:
                return {
                    container: 'p-4',
                    ratingText: 'text-4xl',
                    maxText: 'text-sm',
                    descText: 'text-sm',
                    statsText: 'text-xs',
                    starSize: 'md' as const
                };
        }
    };

    const sizeConfig = getSizeConfig();

    if (loading) {
        return (
            <div className={`bg-white rounded-lg shadow-md border-2 ${sizeConfig.container} ${className}`}>
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-aniverse-purple"></div>
                    <span className="ml-3 text-gray-600">Cargando...</span>
                </div>
            </div>
        );
    }

    if (error || !estadisticas) {
        return (
            <div className={`bg-gray-50 rounded-lg shadow-md border-2 border-gray-200 ${sizeConfig.container} ${className}`}>
                <div className="text-center">
                    <FaChartBar className="text-gray-400 text-2xl mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                        {error || 'No hay estadísticas disponibles'}
                    </p>
                </div>
            </div>
        );
    }

    const { puntuacionPromedio, totalResenyas } = estadisticas;
    const hasRatings = totalResenyas > 0;

    return (
        <div className={`bg-white rounded-lg shadow-md border-2 ${hasRatings ? getRatingBgColor(puntuacionPromedio) : 'border-gray-200'} ${sizeConfig.container} ${className}`}>
            {hasRatings ? (
                <div className="space-y-4">
                    {/* Puntuación principal */}
                    <div className="text-center">
                        <div className={`${sizeConfig.ratingText} font-bold ${getRatingColor(puntuacionPromedio)} mb-1`}>
                            {puntuacionPromedio.toFixed(1)}
                            <span className={`${sizeConfig.maxText} text-gray-500 ml-1`}>/10</span>
                        </div>

                        {/* Estrellas */}
                        <div className="flex justify-center mb-2">
                            <StarRatingDisplay
                                rating={puntuacionPromedio}
                                size={sizeConfig.starSize}
                                showNumber={false}
                            />
                        </div>

                        {/* Descripción */}
                        <p className={`${sizeConfig.descText} font-medium ${getRatingColor(puntuacionPromedio)}`}>
                            {getRatingDescription(puntuacionPromedio)}
                        </p>

                        {/* Estadísticas básicas */}
                        <div className={`${sizeConfig.statsText} text-gray-600 mt-2 flex items-center justify-center space-x-4`}>
                            <div className="flex items-center space-x-1">
                                <FaUsers />
                                <span>{totalResenyas} reseña{totalResenyas !== 1 ? 's' : ''}</span>
                            </div>
                            {showReviewsLink && onReviewsClick && (
                                <button
                                    onClick={onReviewsClick}
                                    className="text-aniverse-purple hover:text-aniverse-purple-light font-medium transition-colors"
                                >
                                    Ver todas →
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Breakdown detallado */}
                    {showDetailedStats && breakdown.length > 0 && (
                        <div className="border-t border-gray-200 pt-4">
                            <h4 className={`${sizeConfig.statsText} font-semibold text-gray-700 mb-3`}>
                                Distribución de puntuaciones
                            </h4>
                            <div className="space-y-2">
                                {breakdown.slice(0, 5).map((item) => (
                                    <div key={item.puntuacion} className="flex items-center space-x-3">
                                        <span className={`${sizeConfig.statsText} font-medium text-gray-600 w-8`}>
                                            {item.puntuacion}★
                                        </span>
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-aniverse-purple h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${item.percentage}%` }}
                                            />
                                        </div>
                                        <span className={`${sizeConfig.statsText} text-gray-500 w-12 text-right`}>
                                            {item.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Estadísticas adicionales */}
                    {showDetailedStats && size !== 'sm' && (
                        <div className="border-t border-gray-200 pt-4">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <div className={`${sizeConfig.ratingText.replace('text-', 'text-').replace('xl', 'lg')} font-bold text-aniverse-purple`}>
                                        {((puntuacionPromedio / 10) * 100).toFixed(0)}%
                                    </div>
                                    <div className={`${sizeConfig.statsText} text-gray-600`}>
                                        Puntuación
                                    </div>
                                </div>
                                <div>
                                    <div className={`${sizeConfig.ratingText.replace('text-', 'text-').replace('xl', 'lg')} font-bold text-aniverse-pink`}>
                                        #{totalResenyas > 100 ? '1K+' : totalResenyas}
                                    </div>
                                    <div className={`${sizeConfig.statsText} text-gray-600`}>
                                        Ranking
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                // Estado sin reseñas
                <div className="text-center">
                    <div className="text-gray-300 text-4xl mb-3">📊</div>
                    <h3 className={`${sizeConfig.descText} font-medium text-gray-600 mb-2`}>
                        Sin puntuaciones aún
                    </h3>
                    <p className={`${sizeConfig.statsText} text-gray-500 mb-4`}>
                        Sé el primero en calificar este anime
                    </p>
                    {showReviewsLink && onReviewsClick && (
                        <button
                            onClick={onReviewsClick}
                            className="bg-aniverse-purple text-white px-4 py-2 rounded-lg hover:bg-aniverse-purple-light transition-colors"
                        >
                            Escribir primera reseña
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// Componente simplificado para uso básico
export const SimpleAnimeRating: React.FC<{
    animeId?: number;
    jikanId?: number;
    className?: string;
}> = ({ animeId, jikanId, className = '' }) => {
    return (
        <AnimeRatingDisplay
            animeId={animeId}
            jikanId={jikanId}
            size="sm"
            className={className}
        />
    );
};

// Componente para tarjetas de anime
export const AnimeCardRating: React.FC<{
    animeId?: number;
    jikanId?: number;
    className?: string;
}> = ({ animeId, jikanId, className = '' }) => {
    const [estadisticas, setEstadisticas] = useState<{ puntuacionPromedio: number; totalResenyas: number } | null>(null);

    useEffect(() => {
        const loadStats = async () => {
            if (!animeId && !jikanId) return;

            try {
                let stats;
                if (animeId) {
                    stats = await resenyaService.getEstadisticasAnime(animeId);
                } else {
                    stats = await resenyaService.getEstadisticasPorJikanId(jikanId!);
                }
                setEstadisticas(stats);
            } catch (err) {
                console.error('Error loading rating stats:', err);
            }
        };

        loadStats();
    }, [animeId, jikanId]);

    if (!estadisticas || estadisticas.totalResenyas === 0) {
        return (
            <div className={`flex items-center space-x-1 text-gray-400 ${className}`}>
                <FaRegStar />
                <span className="text-sm">Sin calificar</span>
            </div>
        );
    }

    return (
        <div className={`flex items-center space-x-1 ${className}`}>
            <FaStar className="text-yellow-400" />
            <span className="font-medium text-gray-700">
                {estadisticas.puntuacionPromedio.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500">
                ({estadisticas.totalResenyas})
            </span>
        </div>
    );
};