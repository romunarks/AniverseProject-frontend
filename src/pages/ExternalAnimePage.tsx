// src/pages/ExternalAnimePage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// ✅ PASO 1: Restaurar la interfaz que faltaba
interface AnimeDetail {
    id: number | null;
    jikanId: number | null | undefined;
    titulo: string;
    descripcion: string;
    genero: string;
    anyo: number;
    temporada: string;
    imagenUrl: string;
    puntuacionPromedio?: number;
}

// ✅ PASO 2: Mantener solo una versión de JikanResponse (limpia)
interface JikanResponse {
    success: boolean;
    message?: string;
    data: {
        id?: number;
        jikanId?: number;
        titulo?: string;
        title?: string;
        descripcion?: string;
        synopsis?: string;
        genero?: string;
        anyo?: number;
        year?: number;
        temporada?: string;
        season?: string;
        imagenUrl?: string;
        imageUrl?: string;
        puntuacionPromedio?: number;
        score?: number;
    };
}

export const ExternalAnimePage = () => {
    const { id: jikanIdParam } = useParams<{id: string}>();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();

    // Ahora 'AnimeDetail' ya está definido
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
                const response = await api.get<JikanResponse>(`/animes/external/${jikanIdParam}`);

                if (response.data.success && response.data.data) {
                    const animeData = response.data.data;
                    const hasMinimumData = !!(animeData.titulo || animeData.title);

                    // Mapeo seguro utilizando la interfaz AnimeDetail
                    const formattedAnime: AnimeDetail = {
                        id: animeData.id || null,
                        jikanId: animeData.jikanId,
                        titulo: animeData.titulo || animeData.title || 'Título no disponible',
                        descripcion: animeData.descripcion || animeData.synopsis || 'Descripción no disponible',
                        genero: animeData.genero || 'No especificado',
                        anyo: animeData.anyo || animeData.year || 0,
                        temporada: animeData.temporada || animeData.season || 'No especificada',
                        imagenUrl: animeData.imagenUrl || animeData.imageUrl || '',
                        puntuacionPromedio: animeData.puntuacionPromedio || animeData.score
                    };

                    setAnime(formattedAnime);

                    if (!hasMinimumData && retryCount < MAX_RETRIES) {
                        setTimeout(() => setRetryCount(prev => prev + 1), 1500);
                    }
                } else {
                    setError(response.data.message || 'No se pudo encontrar el anime externo');
                }
            } catch (err: unknown) {
                // ✅ CORRECCIÓN: Eliminamos la constante 'message' que no se usaba
                // y pasamos la lógica directamente al log y al estado.
                console.error('Error fetching external anime:', err instanceof Error ? err.message : 'Error desconocido');
                setError('Error al cargar detalles del anime. Por favor intenta de nuevo.');
            } finally {
                setLoading(false);
            }
        };

        void fetchAnimeDetails();
    }, [jikanIdParam, retryCount]);

    const handleSaveToLibrary = async () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: location.pathname } });
            return;
        }

        if (!anime) return;

        try {
            setSaving(true);
            setError(null);

            const response = await api.post('/animes/save-external', {
                jikanId: anime.jikanId,
                titulo: anime.titulo,
                descripcion: anime.descripcion,
                genero: anime.genero,
                anyo: anime.anyo,
                temporada: anime.temporada,
                imagenUrl: anime.imagenUrl
            });

            if (response.data.success && response.data.data?.id) {
                alert("¡Anime añadido con éxito!");
                navigate(`/anime/${response.data.data.id}`);
            } else {
                setError(response.data.message || 'Error al guardar el anime');
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || 'Error al guardar en la biblioteca.');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 pt-24 pb-12">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 flex items-center text-aniverse-cyan hover:text-white transition-colors group"
                >
                    <span className="mr-2 transform group-hover:-translate-x-1 transition-transform">←</span>
                    Volver
                </button>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-aniverse-cyan"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-900/30 border border-red-500 text-red-300 p-6 rounded-lg text-center">
                        <p>{error}</p>
                        <button onClick={() => setRetryCount(0)} className="mt-4 px-4 py-2 bg-aniverse-purple text-white rounded-lg">
                            Reintentar
                        </button>
                    </div>
                ) : !anime ? (
                    <div className="text-center text-white py-16">
                        <p>Anime no encontrado</p>
                    </div>
                ) : (
                    <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden">
                        <div className="p-6 text-white">
                            <h1 className="text-4xl font-bold mb-4">{anime.titulo}</h1>
                            <p className="text-gray-300 leading-relaxed">{anime.descripcion}</p>
                            <button
                                onClick={handleSaveToLibrary}
                                disabled={saving}
                                className="mt-6 px-6 py-3 bg-aniverse-cyan text-black rounded-full font-bold disabled:bg-gray-600"
                            >
                                {saving ? 'Guardando...' : 'Añadir a mi biblioteca'}
                            </button>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default ExternalAnimePage;