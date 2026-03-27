// src/pages/AnimeDetailPage.tsx - Versión con sistema completo de reseñas
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStar, FaCommentAlt } from 'react-icons/fa';import { useAuth } from '../context/AuthContext';
import { animeService } from '../services/animeService';
import { favoritoService } from '../services/favoritoService';
import { votacionService } from '../services/votacionService';
// ✅ AGREGAR después de la línea 8:
import { estadisticaService, EstadisticasAnime } from '../services/estadisticaService';
import { Anime } from '../types';
import { FavoriteButton } from '../components/FavoriteButton';
import { RatingComponent } from '../components/RatingComponent';
import { ResenyasList } from '../components/ResenyasList';
import { AnimeRatingDisplay } from '../components/AnimeRatingDisplay';
import { useResenyas } from '../hooks/useResenyas';

export const AnimeDetailPage: React.FC = () => {
    const { id: animeIdFromParams } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    const [anime, setAnime] = useState<Anime | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [userRating, setUserRating] = useState<number>(0);
    const [relatedAnimes, setRelatedAnimes] = useState<Anime[]>([]);
    const [votacionesCount, setVotacionesCount] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'related'>('overview');
// ✅ AGREGAR después de línea 30:
    const [estadisticas, setEstadisticas] = useState<EstadisticasAnime | null>(null);
    const [canCreateReview, setCanCreateReview] = useState(false);
    // Hook para manejar reseñas
    const {
        resenyas,
        //loading: resenyasLoading,
        totalElements: totalResenyas,
        canUserReview,
        refresh: refreshResenyas
    } = useResenyas({
        animeId: anime?.id || undefined, // ✅ CAMBIAR: agregar || undefined
        jikanId: anime?.jikanId || undefined,
        autoLoad: !!anime,
        pageSize: 5
    });

    // Cargar datos del anime
    useEffect(() => {
        const fetchAnimeData = async () => {
            if (!animeIdFromParams) {
                setError("No se proporcionó un ID de anime.");
                setLoading(false);
                return;
            }

            const numericId = Number(animeIdFromParams);
            if (isNaN(numericId) || numericId <= 0) {
                setError("El ID del anime es inválido.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const animeData = await animeService.getAnimeById(animeIdFromParams);

                if (!animeData || !animeData.id) {
                    setError(`No se pudo encontrar el anime con ID ${animeIdFromParams}`);
                    setLoading(false);
                    return;
                }
                setAnime(animeData);

                // Cargar datos adicionales en paralelo
                const promises = [];

                // Cargar animes relacionados
                promises.push(
                    animeService.getAnimesRecomendados(animeData.jikanId || animeData.id || 1)
                        .then(response => {
                            if (Array.isArray(response)) {
                                setRelatedAnimes(response.slice(0, 6));
                            }
                        })
                        .catch(error => console.error('Error al cargar animes relacionados:', error))
                );

                // Cargar conteo de votaciones
                promises.push(
                    votacionService.getVotacionesCount(animeData.id)
                        .then(count => setVotacionesCount(count))
                        .catch(error => console.error('Error al obtener conteo de votaciones:', error))
                );

                await Promise.allSettled(promises);

            } catch (fetchError) {
                console.error('Error loading anime:', fetchError);
                if (fetchError instanceof Error && fetchError.message.includes('404')) {
                    setError('Anime no encontrado. Puede que haya sido eliminado o no exista.');
                } else {
                    setError('Ha ocurrido un error al cargar la información del anime.');
                }
            } finally {
                setLoading(false);
            }
        };

        void fetchAnimeData();
    }, [animeIdFromParams]);

    // Al inicio del componente, después de los useState
    useEffect(() => {
        // 🔍 Debug completo del estado de autenticación
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        const refreshToken = localStorage.getItem('refreshToken');

        console.log('🔐 DEBUG AUTENTICACIÓN:');
        console.log('Token exists:', !!token);
        console.log('User exists:', !!user);
        console.log('RefreshToken exists:', !!refreshToken);
        console.log('isAuthenticated from context:', isAuthenticated);
        console.log('user from context:', user);

        if (token) {
            console.log('✅ Token found, length:', token.length);
            // Verificar si el token es válido
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                console.log('Token expires:', new Date(payload.exp * 1000));
                console.log('Current time:', new Date());
                console.log('Token is valid:', payload.exp * 1000 > Date.now());
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                console.error('❌ Invalid token format');
            }
        } else {
            console.log('❌ NO TOKEN - Need to login');
        }
    }, [isAuthenticated, user]);

    // Cargar datos del usuario autenticado
    useEffect(() => {
        const loadUserData = async () => {
            if (!isAuthenticated || !user || !anime) return;

            try {
                // setLoadingUserData(true); // ❌ ELIMINAR

                // ✅ VALIDACIÓN COMPLETA - Solo llamar APIs si hay datos necesarios
                const promises = [];

                // Solo verificar favorito si hay jikanId y usuario autenticado
                if (anime.jikanId) {
                    promises.push(favoritoService.isFavorite(anime.jikanId));
                } else {
                    promises.push(Promise.resolve(false));
                }

                // Solo verificar rating si hay anime.id y user.id
                if (anime.id && user.id) {
                    promises.push(votacionService.getVotacionUsuarioAnime(user.id, anime.id));
                } else {
                    promises.push(Promise.resolve(null));
                }

                const [favoriteResult, ratingResult] = await Promise.allSettled(promises);

                // ✅ MANEJO CORRECTO DE RESULTADOS
                if (favoriteResult.status === 'fulfilled') {
                    setIsFavorite(favoriteResult.value); // isFavorite() devuelve boolean directo
                }

                if (ratingResult.status === 'fulfilled' && ratingResult.value) {
                    setUserRating(ratingResult.value.puntuacion);
                }

            } catch (error) {
                console.error('Error loading user data:', error);
            }
            // finally {
            //     setLoadingUserData(false); // ❌ ELIMINAR
            // }
        };

        void loadUserData();
    }, [isAuthenticated, user, anime]); // ✅ anime no anime?.id

    // ✅ AGREGAR:
    useEffect(() => {
        const loadEstadisticas = async () => {
            if (!anime?.id) return;

            try {
                const stats = await estadisticaService.getEstadisticasAnime(anime.id);
                setEstadisticas(stats);

                const canReview = await canUserReview();
                setCanCreateReview(canReview);
            } catch (error) {
                console.error('Error loading statistics:', error);
            }
        };

        void loadEstadisticas();
    }, [anime, canUserReview]); // ✅ anime no anime?.id

    // Handlers para los componentes
    const handleFavoriteToggle = (newIsFavorite: boolean) => {
        setIsFavorite(newIsFavorite);
    };

    const handleRatingChange = (newRating: number) => {
        setUserRating(newRating);
        // Actualizar el conteo de votaciones si es necesario
        if (anime?.id) {
            votacionService.getVotacionesCount(anime.id)
                .then(count => setVotacionesCount(count))
                .catch(error => console.error('Error updating vote count:', error));
        }
    };

    const handleReviewsScroll = () => {
        setActiveTab('reviews');
        // Scroll suave a la sección de reseñas
        setTimeout(() => {
            const reviewsSection = document.getElementById('reviews-section');
            if (reviewsSection) {
                reviewsSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };

    const handleReviewCreated = () => {
        void refreshResenyas(); // ✅ Agregar void
        setActiveTab('reviews');
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-16 flex justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-aniverse-pink"></div>
            </div>
        );
    }

    if (error || !anime) {
        return (
            <div className="container mx-auto px-4 py-16">
                <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">Error</span>
                    </div>
                    <p className="mt-2">{error || 'No se pudo cargar la información del anime.'}</p>
                    <div className="mt-4">
                        <button
                            onClick={() => navigate('/')}
                            className="bg-aniverse-purple text-white py-2 px-4 rounded hover:bg-aniverse-purple-light"
                        >
                            Volver al inicio
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Banner con imagen de fondo */}
            <div className="relative h-64 md:h-80 lg:h-96 rounded-xl overflow-hidden mb-8">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: `url(${anime.imagenUrl || '/placeholder-banner.jpg'})`,
                        filter: 'blur(8px)',
                        transform: 'scale(1.1)'
                    }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-b from-aniverse-purple-light/80 to-aniverse-purple/90"></div>
                <div className="absolute inset-0 flex items-center">
                    <div className="container mx-auto px-6 flex flex-col md:flex-row items-center">
                        <div className="w-48 h-64 md:w-56 md:h-80 flex-shrink-0 rounded-lg overflow-hidden shadow-2xl border-4 border-white/20 mr-6">
                            {anime.imagenUrl ? (
                                <img
                                    src={anime.imagenUrl}
                                    alt={anime.titulo}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-b from-aniverse-purple to-aniverse-purple-light flex items-center justify-center">
                                    <span className="text-white text-lg font-medium">No imagen</span>
                                </div>
                            )}
                        </div>
                        <div className="text-white mt-4 md:mt-0">
                            <h1 className="text-4xl font-bold mb-2">{anime.titulo}</h1>
                            <div className="flex flex-wrap items-center mb-4">
                                {anime.genero && (
                                    <span className="bg-aniverse-pink/80 text-white px-3 py-1 rounded-full text-sm mr-2 mb-2">
                                        {anime.genero}
                                    </span>
                                )}
                                {anime.anyo && (
                                    <span className="bg-aniverse-cyan/80 text-aniverse-purple px-3 py-1 rounded-full text-sm mr-2 mb-2">
                                        {anime.anyo}
                                    </span>
                                )}
                                {anime.temporada && (
                                    <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm mr-2 mb-2">
                                        {anime.temporada}
                                    </span>
                                )}
                            </div>

                            {/* Estadísticas rápidas */}
                            // ✅ SOLUCIÓN:
                            {estadisticas && estadisticas.totalResenyas > 0 && (
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="flex items-center space-x-2">
                                        <FaStar className="text-yellow-400" />
                                            <span className="text-xl font-bold">
                                             {estadisticas.promedioPuntuacion.toFixed(1)} // ✅ Nombre correcto
                                         </span>
                                        <span className="text-sm opacity-90">
                                            ({estadisticas.totalResenyas} reseñas)
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleReviewsScroll}
                                        className="text-sm text-white/90 hover:text-white underline"
                                    >
                                        Ver reseñas
                                    </button>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 mt-4">
                                <FavoriteButton
                                    animeId={anime.id || undefined}
                                    jikanId={anime.jikanId || undefined}
                                    initialIsFavorite={isFavorite}
                                    onToggle={handleFavoriteToggle}
                                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full"
                                />

                                {canCreateReview && (
                                    <button
                                        onClick={() => setActiveTab('reviews')}
                                        className="bg-aniverse-pink/80 hover:bg-aniverse-pink text-white px-4 py-2 rounded-full transition-colors"
                                    >
                                        <FaCommentAlt className="inline mr-2" />
                                        Escribir reseña
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navegación por pestañas */}
            <div className="bg-white rounded-lg shadow-md mb-8">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                        {[
                            { key: 'overview', label: 'Información', icon: '📋' },
                            { key: 'reviews', label: `Reseñas (${totalResenyas})`, icon: '📝' },
                            { key: 'related', label: 'Relacionados', icon: '🔗' }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as 'overview' | 'reviews' | 'related')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === tab.key
                                        ? 'border-aniverse-purple text-aniverse-purple'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Contenido de las pestañas */}
                <div className="p-6">
                    {/* Tab: Información General */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Columna principal */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Sinopsis */}
                                <div>
                                    <h2 className="text-2xl font-bold text-aniverse-purple mb-4">Sinopsis</h2>
                                    <p className="text-gray-700 leading-relaxed">
                                        {anime.descripcion || 'No hay sinopsis disponible para este anime.'}
                                    </p>
                                </div>

                                {/* Reseñas destacadas */}
                                {resenyas.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-bold text-aniverse-purple">Reseñas Destacadas</h3>
                                            <button
                                                onClick={() => setActiveTab('reviews')}
                                                className="text-aniverse-purple hover:text-aniverse-purple-light font-medium"
                                            >
                                                Ver todas →
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            {resenyas.slice(0, 2).map((resenya) => (
                                                <div key={resenya.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-8 h-8 rounded-full bg-aniverse-purple text-white flex items-center justify-center text-sm font-bold">
                                                                {resenya.usuarioNombre.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="font-medium">{resenya.usuarioNombre}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <FaStar className="text-yellow-400" />
                                                            <span className="font-bold text-aniverse-pink">
                                                                {resenya.puntuacion.toFixed(1)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-700 text-sm line-clamp-3">
                                                        {resenya.contenido}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Columna lateral */}
                            <div className="space-y-6">
                                {/* Puntuación */}
                                <AnimeRatingDisplay
                                    animeId={anime.id || undefined}
                                    jikanId={anime.jikanId || undefined}
                                    showDetailedStats={true}
                                    showReviewsLink={true}
                                    onReviewsClick={handleReviewsScroll}
                                    size="lg"
                                />

                                {/* Calificación del usuario */}
                                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                                    <h3 className="text-lg font-bold text-aniverse-purple mb-4">Tu Calificación</h3>
                                    <RatingComponent
                                        animeId={anime.id || undefined}
                                        jikanId={anime.jikanId || undefined}
                                        initialRating={userRating}
                                        onRatingChange={handleRatingChange}
                                        size="lg"
                                    />
                                </div>

                                {/* Información adicional */}
                                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                                    <h3 className="text-lg font-bold text-aniverse-purple mb-4">Información</h3>
                                    <div className="space-y-2 text-sm">
                                        {anime.anyo && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Año:</span>
                                                <span className="font-medium">{anime.anyo}</span>
                                            </div>
                                        )}
                                        {anime.temporada && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Temporada:</span>
                                                <span className="font-medium">{anime.temporada}</span>
                                            </div>
                                        )}
                                        {anime.genero && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Género:</span>
                                                <span className="font-medium">{anime.genero}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Reseñas:</span>
                                            <span className="font-medium">{totalResenyas}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Votaciones:</span>
                                            <span className="font-medium">{votacionesCount}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Reseñas */}
                    {activeTab === 'reviews' && (
                        <div id="reviews-section">
                            <ResenyasList
                                animeId={anime.id || undefined}
                                jikanId={anime.jikanId || undefined}
                                animeTitulo={anime.titulo}
                                showAnimeInfo={false}
                                showCreateButton={true}
                                onResenyaCreated={handleReviewCreated}
                                title="Reseñas del Anime"
                            />
                        </div>
                    )}

                    {/* Tab: Animes Relacionados */}
                    {activeTab === 'related' && (
                        <div>
                            <h2 className="text-2xl font-bold text-aniverse-purple mb-6">Animes Relacionados</h2>
                            {relatedAnimes.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                    {relatedAnimes.map((relAnime) => (
                                        <div
                                            key={relAnime.id || relAnime.jikanId}
                                            className="group cursor-pointer"
                                            onClick={() => {
                                                const path = animeService.getAnimeDetailUrl(relAnime);
                                                navigate(path);
                                            }}
                                        >
                                            <div className="aspect-[2/3] rounded-lg overflow-hidden mb-2 shadow-md">
                                                {relAnime.imagenUrl ? (
                                                    <img
                                                        src={relAnime.imagenUrl}
                                                        alt={relAnime.titulo}
                                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-r from-aniverse-purple to-aniverse-purple-light flex items-center justify-center">
                                                        <span className="text-white text-xs text-center p-2">No imagen</span>
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-aniverse-purple transition-colors">
                                                {relAnime.titulo}
                                            </h3>
                                            {relAnime.anyo && (
                                                <p className="text-xs text-gray-500">{relAnime.anyo}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 text-4xl mb-4">🔗</div>
                                    <p className="text-gray-500">No hay animes relacionados disponibles</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};