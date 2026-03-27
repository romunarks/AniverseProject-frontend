// src/components/RecommendationsSection.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaStar, FaChevronRight, FaRobot, FaMagic, FaUser } from 'react-icons/fa';
import { recommendationService } from '../services/recommendationService';
import { useAuth } from '../context/AuthContext';
import { Anime } from '../types';
import AnimeCard from './AnimeCard';

export const RecommendationsSection: React.FC = () => {
    const { user } = useAuth();
    const [recommendations, setRecommendations] = useState<Anime[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recommendationType, setRecommendationType] = useState<'basic' | 'advanced'>('basic');

    useEffect(() => {
        if (user?.id) {
            loadRecommendations();
        }
    }, [user, recommendationType]);

    const loadRecommendations = async () => {
        if (!user?.id) return;

        setLoading(true);
        setError(null);

        try {
            let animes: Anime[] = [];

            if (recommendationType === 'advanced') {
                animes = await recommendationService.getAdvancedRecommendations(user.id, 12);
            } else {
                animes = await recommendationService.getPersonalizedRecommendations(user.id, 12);
            }

            setRecommendations(animes);
        } catch (err) {
            console.error('Error loading recommendations:', err);
            setError('No se pudieron cargar las recomendaciones');
        } finally {
            setLoading(false);
        }
    };

    // Si no hay usuario autenticado, no mostrar la sección
    if (!user) {
        return null;
    }

    return (
        <section className="bg-gradient-to-r from-purple-50 to-pink-50 py-12">
            <div className="container mx-auto px-4">
                {/* Header con toggle de algoritmo */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <div className="mb-4 md:mb-0">
                        <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                            <FaMagic className="text-aniverse-purple" />
                            Recomendados para ti
                        </h2>
                        <p className="text-gray-600 flex items-center gap-2">
                            <FaUser className="text-aniverse-pink w-4 h-4" />
                            Basado en tus gustos y preferencias
                        </p>
                    </div>

                    {/* Toggle de algoritmo */}
                    <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-md">
                        <button
                            onClick={() => setRecommendationType('basic')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                recommendationType === 'basic'
                                    ? 'bg-aniverse-purple text-white shadow-md'
                                    : 'text-gray-600 hover:text-aniverse-purple'
                            }`}
                        >
                            <FaStar className="w-4 h-4 inline mr-2" />
                            Básico
                        </button>
                        <button
                            onClick={() => setRecommendationType('advanced')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                recommendationType === 'advanced'
                                    ? 'bg-aniverse-purple text-white shadow-md'
                                    : 'text-gray-600 hover:text-aniverse-purple'
                            }`}
                        >
                            <FaRobot className="w-4 h-4 inline mr-2" />
                            IA Avanzada
                        </button>
                    </div>
                </div>

                {/* Contenido */}
                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-aniverse-purple mx-auto mb-4"></div>
                            <p className="text-gray-600">
                                {recommendationType === 'advanced'
                                    ? 'Analizando tus gustos con IA...'
                                    : 'Cargando recomendaciones...'
                                }
                            </p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-white rounded-lg p-8 text-center shadow-md">
                        <div className="text-gray-400 mb-4">
                            <FaHeart className="w-12 h-12 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">
                                {error}
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Agrega algunos animes a favoritos para obtener mejores recomendaciones
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Link
                                    to="/animes"
                                    className="px-4 py-2 bg-aniverse-purple text-white rounded-lg hover:bg-aniverse-purple-dark transition-colors"
                                >
                                    Explorar Animes
                                </Link>
                                <button
                                    onClick={loadRecommendations}
                                    className="px-4 py-2 border border-aniverse-purple text-aniverse-purple rounded-lg hover:bg-aniverse-purple hover:text-white transition-colors"
                                >
                                    Reintentar
                                </button>
                            </div>
                        </div>
                    </div>
                ) : recommendations.length === 0 ? (
                    <div className="bg-white rounded-lg p-8 text-center shadow-md">
                        <div className="text-gray-400 mb-4">
                            <FaHeart className="w-12 h-12 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">
                                ¡Aún no tenemos suficientes datos sobre tus gustos!
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Para obtener recomendaciones personalizadas, agrega algunos animes a favoritos
                                o califica algunos animes que hayas visto.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Link
                                    to="/animes"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-aniverse-purple text-white rounded-lg hover:bg-aniverse-purple-dark transition-colors"
                                >
                                    <FaStar className="w-4 h-4" />
                                    Explorar Animes
                                </Link>
                                <Link
                                    to="/trending"
                                    className="inline-flex items-center gap-2 px-6 py-3 border border-aniverse-purple text-aniverse-purple rounded-lg hover:bg-aniverse-purple hover:text-white transition-colors"
                                >
                                    <FaChevronRight className="w-4 h-4" />
                                    Ver Trending
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Grid de animes recomendados */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                            {recommendations.slice(0, 12).map((anime) => (
                                <div key={anime.id || anime.jikanId} className="relative group">
                                    <AnimeCard anime={anime} />
                                    {/* Badge de recomendación */}
                                    <div className="absolute -top-2 -right-2 z-10">
                                        <div className="bg-aniverse-purple text-white text-xs px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                                            {recommendationType === 'advanced' ? (
                                                <FaRobot className="w-3 h-3" />
                                            ) : (
                                                <FaStar className="w-3 h-3" />
                                            )}
                                            {recommendationType === 'advanced' ? 'IA' : '★'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Botón para ver más */}
                        {recommendations.length >= 12 && (
                            <div className="text-center">
                                <button
                                    onClick={() => {
                                        // Aquí podrías implementar cargar más recomendaciones
                                        // o redirigir a una página dedicada de recomendaciones
                                    }}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-aniverse-purple border-2 border-aniverse-purple rounded-lg hover:bg-aniverse-purple hover:text-white transition-colors shadow-md"
                                >
                                    Ver más recomendaciones
                                    <FaChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Información del algoritmo */}
                <div className="mt-8 bg-white rounded-lg p-4 shadow-md">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        {recommendationType === 'advanced' ? (
                            <>
                                <FaRobot className="text-aniverse-purple" />
                                <span>
                                    <strong>IA Avanzada:</strong> Utilizamos algoritmos de machine learning
                                    que analizan patrones complejos en tus gustos y los de usuarios similares
                                    para recomendaciones más precisas.
                                </span>
                            </>
                        ) : (
                            <>
                                <FaStar className="text-aniverse-purple" />
                                <span>
                                    <strong>Algoritmo Básico:</strong> Basado en tus animes favoritos
                                    y calificaciones altas para encontrar contenido similar que te pueda gustar.
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};