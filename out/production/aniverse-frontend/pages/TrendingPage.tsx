// src/pages/TrendingPage.tsx
import React, { useState, useEffect } from 'react';
import { animeService } from '../services/animeService';
import axios from 'axios'; // Añadir importación de axios
import { Anime } from '../types';
import AnimeCard from '../components/AnimeCard';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { FaFire, FaFilter, FaSort, FaStar, FaClock } from 'react-icons/fa';

export const TrendingPage: React.FC = () => {
    const [animes, setAnimes] = useState<Anime[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [category, setCategory] = useState<'trending' | 'recent' | 'top-rated'>('trending');
    const [genreFilter, setGenreFilter] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Lista de géneros disponibles
    const genres = ['Acción', 'Aventura', 'Comedia', 'Drama', 'Fantasía', 'Horror', 'Romance', 'Sci-Fi', 'Slice of Life'];

    useEffect(() => {
        const fetchAnimesByCategory = async () => {
            setLoading(true);
            setError(null);

            try {
                let animesData: Anime[] = [];

                // Obtener datos según la categoría
                if (category === 'trending') {
                    // Usar servicio existente para trending
                    animesData = await animeService.getTrendingAnimes();
                } else {
                    // Usar endpoints específicos para otras categorías
                    const endpoint = category === 'recent'
                        ? '/api/estadisticas/most-recent?limit=24'
                        : '/api/estadisticas/top-rated?limit=24';

                    const response = await axios.get(endpoint);

                    if (response.data.success) {
                        animesData = response.data.data;
                    } else {
                        throw new Error(response.data.message || "No se pudieron cargar los animes.");
                    }
                }

                console.log(`Datos de ${category} obtenidos:`, animesData);

                // Aplicar filtro de género si está seleccionado
                if (genreFilter) {
                    animesData = animesData.filter(anime =>
                        anime.genero && anime.genero.toLowerCase().includes(genreFilter.toLowerCase())
                    );
                }

                setAnimes(animesData);
            } catch (error) {
                console.error(`Error al cargar animes (${category}):`, error);
                setError(`No se pudieron cargar los animes. Intenta de nuevo más tarde.`);
            } finally {
                setLoading(false);
            }
        };

        fetchAnimesByCategory();
    }, [category, genreFilter]);

    // Función para cambiar de categoría
    const handleCategoryChange = (newCategory: 'trending' | 'recent' | 'top-rated') => {
        setCategory(newCategory);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-900">
            <Navbar />

            <main className="flex-grow container mx-auto px-4 pt-24 pb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center">
                            {category === 'trending' && <FaFire className="text-orange-500 mr-2" />}
                            {category === 'recent' && <FaClock className="text-blue-400 mr-2" />}
                            {category === 'top-rated' && <FaStar className="text-yellow-400 mr-2" />}

                            {category === 'trending' && 'Animes en Tendencia'}
                            {category === 'recent' && 'Animes Recientes'}
                            {category === 'top-rated' && 'Animes Mejor Puntuados'}
                        </h1>
                        <p className="text-gray-400 mt-1">
                            {category === 'trending' && 'Los animes más populares del momento'}
                            {category === 'recent' && 'Los lanzamientos más recientes'}
                            {category === 'top-rated' && 'Los animes con mejor puntuación'}
                        </p>
                    </div>

                    <div className="mt-4 md:mt-0 flex gap-2">
                        {/* Selector de categoría */}
                        <div className="bg-gray-800 rounded-lg p-1 flex">
                            <button
                                onClick={() => handleCategoryChange('trending')}
                                className={`px-3 py-1 rounded-md text-sm ${
                                    category === 'trending'
                                        ? 'bg-aniverse-purple text-white'
                                        : 'text-gray-300 hover:bg-gray-700'
                                }`}
                            >
                                Tendencia
                            </button>
                            <button
                                onClick={() => handleCategoryChange('recent')}
                                className={`px-3 py-1 rounded-md text-sm ${
                                    category === 'recent'
                                        ? 'bg-aniverse-purple text-white'
                                        : 'text-gray-300 hover:bg-gray-700'
                                }`}
                            >
                                Recientes
                            </button>
                            <button
                                onClick={() => handleCategoryChange('top-rated')}
                                className={`px-3 py-1 rounded-md text-sm ${
                                    category === 'top-rated'
                                        ? 'bg-aniverse-purple text-white'
                                        : 'text-gray-300 hover:bg-gray-700'
                                }`}
                            >
                                Mejor Puntuados
                            </button>
                        </div>

                        {/* Botón de filtros */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-white"
                        >
                            <FaFilter />
                            <span>Filtros</span>
                        </button>
                    </div>
                </div>

                {/* Panel de filtros */}
                {showFilters && (
                    <div className="bg-gray-800 rounded-lg p-4 mb-6 animate-fadeIn shadow-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-white font-semibold mb-3">Género</h3>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setGenreFilter(null)}
                                        className={`px-3 py-1 rounded-full text-sm ${
                                            genreFilter === null
                                                ? 'bg-aniverse-purple text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                    >
                                        Todos
                                    </button>
                                    {genres.map(genre => (
                                        <button
                                            key={genre}
                                            onClick={() => setGenreFilter(genre)}
                                            className={`px-3 py-1 rounded-full text-sm ${
                                                genreFilter === genre
                                                    ? 'bg-aniverse-purple text-white'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                        >
                                            {genre}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Eliminamos el ordenador por sortBy ya que ahora usamos categorías en su lugar */}
                        </div>
                    </div>
                )}

                {/* Mensajes de estado */}
                {loading && (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-aniverse-cyan"></div>
                    </div>
                )}

                {error && !loading && (
                    <div className="bg-red-900/30 border border-red-500 text-red-300 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Grid de animes */}
                {!loading && !error && (
                    <>
                        {animes.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                                {animes.map(anime => (
                                    <AnimeCard key={anime.id || anime.jikanId} anime={anime} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
                                <p className="text-gray-300 mb-2">No se encontraron animes que coincidan con los filtros.</p>
                                {genreFilter && (
                                    <button
                                        onClick={() => setGenreFilter(null)}
                                        className="text-aniverse-cyan hover:underline"
                                    >
                                        Quitar filtros
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
};