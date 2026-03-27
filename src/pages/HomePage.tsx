// src/pages/HomePage.tsx
import React, {useState, useEffect, JSX} from 'react';
import { Link } from 'react-router-dom';
import { animeService } from '../services/animeService';
import { Anime } from '../types';
import AnimeCard from '../components/AnimeCard';
import HeroSection from '../components/HeroSection';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
// Añadir FaArrowRight a las importaciones existentes
import { FaFire, FaChevronRight, FaStar, FaCalendarAlt, FaMagic, FaUser, FaRobot } from 'react-icons/fa';
import { estadisticaService } from '../services/estadisticaService.ts';
import { recommendationService } from '../services/recommendationService';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
    const { user } = useAuth(); // ✅ NUEVO: Para recomendaciones personalizadas

    // Estado para datos principales (mantiene lo existente)
    const [featuredAnime, setFeaturedAnime] = useState<Anime | null>(null);
    const [trendingAnimes, setTrendingAnimes] = useState<Anime[]>([]);
    const [recentAnimes, setRecentAnimes] = useState<Anime[]>([]);

    // Mantener tus variables de estado actuales
    const [topRatedAnimes, setTopRatedAnimes] = useState<Anime[]>([]);
    const [, setLoadingTopAnimes] = useState(true);

    // ✅ NUEVO: Estado para recomendaciones personalizadas
    const [recommendations, setRecommendations] = useState<Anime[]>([]);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const [recommendationType, setRecommendationType] = useState<'basic' | 'advanced'>('basic');

    // Estados de carga y error (mantiene lo existente)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Cargar datos para la página principal (mantiene lo existente)
    useEffect(() => {
        const loadHomePageData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Array para almacenar todas las promesas
                const promises = [
                    await animeService.getFeaturedAnime(),
                    await animeService.getTrendingAnimes(),
                    await animeService.getRealAnimesPaginated(0, 6) // Animes recientes
                ];

                // Ejecutar todas las promesas en paralelo
                const [featured, trending, paginatedData] = await Promise.all(promises);

                // Establecer datos
                setFeaturedAnime(featured);
                setTrendingAnimes(Array.isArray(trending) ? trending.slice(0, 6) : []);
                setRecentAnimes(paginatedData.content || []);

                // Ya no necesitamos esta asignación porque añadiremos un nuevo useEffect
                // para cargar los animes mejor puntuados desde el servicio de estadísticas
            } catch (err) {
                console.error("Error al cargar datos de la página principal:", err);
                setError("Ocurrió un error al cargar la página principal. Por favor, inténtalo de nuevo.");
            } finally {
                setLoading(false);
            }
        };

        loadHomePageData();
    }, []);

    // NUEVO EFECTO: Añadir el efecto específico para cargar los animes mejor puntuados
    useEffect(() => {
        const fetchTopAnimes = async () => {
            try {
                setLoadingTopAnimes(true);
                const animes = await estadisticaService.getTopRatedAnimes(6);
                setTopRatedAnimes(animes);
            } catch (error) {
                console.error('Error loading top animes:', error);
                // Fallback: Si falla la carga específica, usar los trending como antes
                if (trendingAnimes.length > 0) {
                    setTopRatedAnimes(
                        [...trendingAnimes].sort((a, b) =>
                            (b.puntuacionPromedio || 0) - (a.puntuacionPromedio || 0)).slice(0, 6)
                    );
                }
            } finally {
                setLoadingTopAnimes(false);
            }
        };

        fetchTopAnimes();
    }, [trendingAnimes]); // Añadir trendingAnimes como dependencia para el fallback

    // ✅ NUEVO: Efecto para cargar recomendaciones personalizadas
    useEffect(() => {
        if (user?.id) {
            loadRecommendations();
        }
    }, [user, recommendationType]);

    // ✅ NUEVA FUNCIÓN: Cargar recomendaciones
    const loadRecommendations = async () => {
        if (!user?.id) return;

        setLoadingRecommendations(true);
        try {
            let animes: Anime[] = [];

            if (recommendationType === 'advanced') {
                animes = await recommendationService.getAdvancedRecommendations(user.id, 6);
            } else {
                animes = await recommendationService.getPersonalizedRecommendations(user.id, 6);
            }

            setRecommendations(animes);
        } catch (err) {
            console.error('Error loading recommendations:', err);
            setRecommendations([]);
        } finally {
            setLoadingRecommendations(false);
        }
    };

    // Renderizado de sección con título y "Ver más" (mantiene lo existente)
    const renderSection = (title: string, icon: JSX.Element, linkTo: string, animes: Anime[]) => (
        <section className="mb-10">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center">
                    {icon}
                    <span className="ml-2">{title}</span>
                </h2>
                <Link to={linkTo} className="text-aniverse-cyan hover:text-aniverse-cyan/80 flex items-center text-sm">
                    Ver más <FaChevronRight className="ml-1" size={12} />
                </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {animes.map(anime => (
                    <AnimeCard key={anime.id || anime.jikanId} anime={anime} />
                ))}
            </div>
        </section>
    );

    // ✅ NUEVA FUNCIÓN: Renderizar sección de recomendaciones
    const renderRecommendationsSection = () => {
        if (!user) return null;

        return (
            <section className="mb-10 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                    <div className="mb-4 md:mb-0">
                        <h2 className="text-2xl font-bold text-white flex items-center">
                            <FaMagic className="text-aniverse-purple mr-2" />
                            Recomendados para ti
                        </h2>
                        <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
                            <FaUser className="w-3 h-3" />
                            Basado en tus gustos y preferencias
                        </p>
                    </div>

                    {/* Toggle de algoritmo */}
                    <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
                        <button
                            onClick={() => setRecommendationType('basic')}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                recommendationType === 'basic'
                                    ? 'bg-aniverse-purple text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <FaStar className="w-3 h-3 inline mr-1" />
                            Básico
                        </button>
                        <button
                            onClick={() => setRecommendationType('advanced')}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                recommendationType === 'advanced'
                                    ? 'bg-aniverse-purple text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <FaRobot className="w-3 h-3 inline mr-1" />
                            IA
                        </button>
                    </div>
                </div>

                {loadingRecommendations ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-aniverse-purple"></div>
                    </div>
                ) : recommendations.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {recommendations.map(anime => (
                            <div key={anime.id || anime.jikanId} className="relative">
                                <AnimeCard anime={anime} />
                                {/* Badge de recomendación */}
                                <div className="absolute -top-1 -right-1 bg-aniverse-purple text-white text-xs px-1 py-0.5 rounded-full">
                                    {recommendationType === 'advanced' ? '🤖' : '⭐'}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-400 mb-4">Agrega algunos animes a favoritos para obtener recomendaciones</p>
                        <Link
                            to="/animes"
                            className="text-aniverse-cyan hover:text-aniverse-cyan/80 text-sm"
                        >
                            Explorar Animes
                        </Link>
                    </div>
                )}
            </section>
        );
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-900">
            <Navbar />

            <main className="flex-grow">
                {/* Hero section con anime destacado */}
                {!error && (
                    <HeroSection anime={featuredAnime} loading={loading} />
                )}

                {/* Contenedor principal */}
                <div className="container mx-auto px-4 py-10">
                    {/* Mensajes de estado */}
                    {loading && !featuredAnime && (
                        <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-aniverse-cyan"></div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-900/30 border border-red-500 text-red-300 p-4 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    {/* Secciones de animes */}
                    {!loading && !error && (
                        <>
                            {/* ✅ NUEVA SECCIÓN: Recomendaciones personalizadas */}
                            {renderRecommendationsSection()}

                            {/* Trending Now */}
                            {trendingAnimes.length > 0 && renderSection(
                                'Trending Now',
                                <FaFire className="text-orange-500" />,
                                '/trending',
                                trendingAnimes
                            )}

                            {/* Top Rated */}
                            {topRatedAnimes.length > 0 && renderSection(
                                'Mejor Valorados',
                                <FaStar className="text-yellow-500" />,
                                '/top-rated',
                                topRatedAnimes
                            )}

                            {/* Recent Additions */}
                            {recentAnimes.length > 0 && renderSection(
                                'Añadidos Recientemente',
                                <FaCalendarAlt className="text-green-500" />,
                                '/animes',
                                recentAnimes
                            )}
                        </>
                    )}
                </div>

                {/* OPCIONAL: Sección alternativa de Top Rated en estilo diferente
                    Descomenta si quieres esta sección adicional */}
                {/*
                <section className="py-12 bg-gray-100">
                    <div className="container mx-auto px-4">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-aniverse-purple">Animes Mejor Puntuados</h2>
                            <Link to="/top-rated" className="text-aniverse-purple hover:text-aniverse-purple-light font-medium flex items-center">
                                Ver todos <FaArrowRight className="ml-1" />
                            </Link>
                        </div>

                        {loadingTopAnimes ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-aniverse-purple"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                {topRatedAnimes.map(anime => (
                                    <AnimeCard key={anime.id || anime.jikanId} anime={anime} />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
                */}
            </main>

            <Footer />
        </div>
    );
};