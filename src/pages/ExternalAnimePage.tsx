// src/pages/ExternalAnimePage.tsx - Versión corregida

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // AGREGADO useLocation
import api from '../api'; // Tu instancia configurada
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext'; // AGREGADO useAuth
import { FaStar, FaHeart, FaBookmark } from 'react-icons/fa';

// Definición de tipo ajustada para coincidir con los datos reales
type AnimeDetail = {
    id: number | null;
    jikanId: number | null | undefined;
    titulo: string;
    descripcion: string;
    genero: string;
    anyo: number;
    temporada: string;
    imagenUrl: string;
    puntuacionPromedio?: number;
};

export const ExternalAnimePage = () => {
    const { id: jikanIdParam } = useParams<{id: string}>();
    const navigate = useNavigate();
    const location = useLocation(); // AGREGADO
    const { isAuthenticated } = useAuth(); // AGREGADO

    const [anime, setAnime] = useState<AnimeDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 2;

    useEffect(() => {
        const fetchAnimeDetails = async () => {
            if (!jikanIdParam) {
                setError("No se proporcionó un ID de Jikan.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                console.log(`Buscando anime externo con JikanID: ${jikanIdParam} (Intento: ${retryCount + 1})`);

                // Utilizamos el endpoint específico para animes externos
                const response = await api.get(`/animes/external/${jikanIdParam}`);
                console.log("Datos recibidos del backend:", response.data);





                if (response.data.success && response.data.data) {
                    const animeData = response.data.data;

                    // ✅ AGREGAR LOS LOGS AQUÍ:
                    console.log("🔍 Raw anime data from backend:", animeData);
                    console.log("📅 Year fields:", { anyo: animeData.anyo, year: animeData.year });
                    console.log("🗓️ Season fields:", { temporada: animeData.temporada, season: animeData.season });

                    // Solo reintentar si realmente faltan datos críticos
                    const hasMinimumData = animeData && animeData.titulo;

                    // Mapear los datos
                    // Mapear los datos con valores por defecto mejorados
                    const formattedAnime: AnimeDetail = {
                        id: animeData.id || null,
                        jikanId: animeData.jikanId,
                        titulo: animeData.titulo || 'Título no disponible',
                        descripcion: animeData.descripcion || 'Descripción no disponible',
                        genero: animeData.genero || 'No especificado',
                        anyo: animeData.anyo || animeData.year || 0, // ✅ Intentar también 'year'
                        temporada: animeData.temporada || animeData.season || 'No especificada', // ✅ Intentar también 'season'
                        imagenUrl: animeData.imagenUrl || animeData.imageUrl || '', // ✅ Intentar también 'imageUrl'
                        puntuacionPromedio: animeData.puntuacionPromedio || animeData.score
                    };

                    setAnime(formattedAnime);


                    if (!hasMinimumData && retryCount < MAX_RETRIES) {
                        console.log(`🔄 Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
                        setTimeout(() => {
                            setRetryCount(prev => prev + 1);
                        }, 1500);
                    } else if (!hasMinimumData) {
                        console.log('❌ No minimum data after max retries');
                    }

                } else {
                    setError(response.data.message || 'No se pudo encontrar el anime externo');
                }
            } catch (err) {
                console.error('Error fetching external anime details:', err);
                setError('Error al cargar detalles del anime externo. Por favor intenta de nuevo.');
            } finally {
                setLoading(false);
            }
        };
        if (jikanIdParam) {
            void fetchAnimeDetails();
        }
    }, [jikanIdParam, retryCount]);

    const handleSaveToLibrary = async () => {
        // Verificar autenticación CORREGIDO
        if (!isAuthenticated) {
            navigate('/login', { state: { from: location.pathname } });
            return;
        }

        if (!anime) {
            setError('No hay datos del anime para guardar');
            return;
        }

        try {
            setSaving(true);
            setError(null); // Limpiar errores previos

            // Los campos aquí deben coincidir con lo que espera tu API /api/animes/save-external
            const payload = {
                jikanId: anime.jikanId,
                titulo: anime.titulo,
                descripcion: anime.descripcion,
                genero: anime.genero,
                anyo: anime.anyo,
                temporada: anime.temporada,
                imagenUrl: anime.imagenUrl
            };
            console.log("Enviando para guardar:", payload);

            const response = await api.post('/animes/save-external', payload);

            if (response.data.success && response.data.data && response.data.data.id) {
                // Mostrar mensaje de éxito y redirigir a la página del anime local
                alert("¡Anime añadido a tu biblioteca con éxito!");
                navigate(`/anime/${response.data.data.id}`);
            } else {
                setError(response.data.message || 'Error al guardar el anime');
            }
         } catch (err: unknown) {
            console.error('Error saving anime:', err);

            // Manejar diferentes tipos de errores
            if (err.response?.status === 403) {
                setError('No tienes permisos para realizar esta acción. Verifica que hayas iniciado sesión.');
            } else if (err.response?.status === 401) {
                setError('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
                navigate('/login', { state: { from: location.pathname } });
            } else {
                setError(err.response?.data?.message || 'Error al guardar el anime en tu biblioteca. Inténtalo de nuevo.');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            <Navbar />

            <main className="flex-grow container mx-auto px-4 pt-24 pb-12">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-aniverse-cyan"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-900/30 border border-red-500 text-red-300 p-6 rounded-lg">
                        <h2 className="text-xl font-bold mb-2">Error</h2>
                        <p>{error}</p>
                        <div className="flex gap-4 mt-4">
                            <button
                                onClick={() => {
                                    setError(null);
                                    setRetryCount(0);
                                    // Esto disparará el useEffect para reintentear
                                }}
                                className="px-4 py-2 bg-aniverse-purple text-white rounded-lg hover:bg-aniverse-purple-light"
                            >
                                Reintentar
                            </button>
                            <button
                                onClick={() => navigate('/trending')}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                            >
                                Volver a Trending
                            </button>
                        </div>
                    </div>
                ) : !anime ? (
                    <div className="text-center text-white py-16">
                        <h2 className="text-2xl font-bold mb-4">Anime no encontrado</h2>
                        <p>No pudimos encontrar el anime que estás buscando.</p>
                        <button
                            onClick={() => navigate('/trending')}
                            className="mt-4 px-4 py-2 bg-aniverse-purple text-white rounded-lg hover:bg-aniverse-purple-light"
                        >
                            Volver a Trending
                        </button>
                    </div>
                ) : (
                    <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden">
                        {/* Banner con imagen de fondo */}
                        <div className="relative h-80 overflow-hidden">
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
                                        <div className="flex items-start">
                                            <div>
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
                                                    <span className="px-3 py-1 bg-purple-900/80 rounded-full text-sm text-purple-300">
                                                        API Externa
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 mt-4">
                                            <button
                                                onClick={handleSaveToLibrary}
                                                disabled={saving || !isAuthenticated}
                                                className={`flex items-center px-6 py-3 rounded-full text-white ${
                                                    saving || !isAuthenticated
                                                        ? 'bg-gray-600 cursor-not-allowed'
                                                        : 'bg-aniverse-cyan hover:bg-aniverse-cyan/80 text-black'
                                                } transition-colors font-semibold`}
                                            >
                                                <FaBookmark className="mr-2" />
                                                {saving ? 'Guardando...' : 'Añadir a Mi Biblioteca'}
                                            </button>

                                            {!isAuthenticated && (
                                                <button
                                                    onClick={() => navigate('/login', { state: { from: location.pathname } })}
                                                    className="flex items-center px-6 py-3 rounded-full bg-aniverse-purple hover:bg-aniverse-purple-light text-white transition-colors font-semibold"
                                                >
                                                    Iniciar Sesión
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contenido principal */}
                        <div className="p-6 text-white">
                            <h2 className="text-2xl font-bold mb-4 text-aniverse-cyan">Sinopsis</h2>
                            <p className="text-gray-300 mb-8 leading-relaxed">
                                {anime.descripcion || 'No hay sinopsis disponible para este anime.'}
                            </p>

                            <div className="bg-gray-700/50 p-6 rounded-lg">
                                <h3 className="text-lg font-semibold mb-2 text-aniverse-pink">Información Adicional</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-gray-400 mb-1">Año</h4>
                                        <p className="text-white">{anime.anyo || 'Desconocido'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-gray-400 mb-1">Temporada</h4>
                                        <p className="text-white">{anime.temporada || 'No especificada'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-gray-400 mb-1">Género</h4>
                                        <p className="text-white">{anime.genero || 'No especificado'}</p>
                                    </div>
                                    {anime.puntuacionPromedio && (
                                        <div>
                                            <h4 className="text-gray-400 mb-1">Puntuación</h4>
                                            <div className="flex items-center">
                                                <FaStar className="text-yellow-400 mr-1" />
                                                <span className="text-white">{anime.puntuacionPromedio.toFixed(1)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 bg-aniverse-purple/30 p-4 rounded-lg border border-aniverse-purple-light">
                                    <div className="flex items-center">
                                        <FaHeart className="text-aniverse-pink mr-2" />
                                        <p className="text-aniverse-cyan font-medium">
                                            Este anime proviene de una fuente externa y no está guardado en tu biblioteca.
                                        </p>
                                    </div>
                                    <p className="mt-2 text-gray-300 text-sm">
                                        {isAuthenticated
                                            ? "Al añadirlo a tu biblioteca podrás calificarlo, añadirlo a tus listas, y marcarlo como favorito."
                                            : "Inicia sesión para añadirlo a tu biblioteca y poder calificarlo, añadirlo a tus listas, y marcarlo como favorito."
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default ExternalAnimePage;