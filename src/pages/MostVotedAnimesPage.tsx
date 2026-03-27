// src/pages/MostVotedAnimesPage.tsx
import React, { useState, useEffect } from 'react';
import { estadisticaService } from '../services/estadisticaService.ts';
import { Anime } from '../types';
import AnimeCard from '../components/AnimeCard';
import { FaThumbsUp } from 'react-icons/fa';

export const MostVotedAnimesPage: React.FC = () => {
    const [animes, setAnimes] = useState<Anime[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [genreFilter, setGenreFilter] = useState<string | null>(null);

    // Lista de géneros disponibles
    const genres = ['Acción', 'Aventura', 'Comedia', 'Drama', 'Fantasía', 'Horror', 'Romance', 'Sci-Fi', 'Slice of Life'];

    useEffect(() => {
        const fetchMostVotedAnimes = async () => {
            setLoading(true);
            setError(null);

            try {
                // Obtener un número mayor para poder filtrar después
                let filteredAnimes = await estadisticaService.getMostVotedAnimes(50);

                // Filtrar por género si está seleccionado
                if (genreFilter) {
                    filteredAnimes = filteredAnimes.filter(anime =>
                        anime.genero && anime.genero.toLowerCase().includes(genreFilter.toLowerCase())
                    );
                }

                setAnimes(filteredAnimes);
            } catch (error) {
                console.error('Error al cargar animes más votados:', error);
                setError('No se pudieron cargar los animes. Por favor, intenta de nuevo más tarde.');
            } finally {
                setLoading(false);
            }
        };

        fetchMostVotedAnimes();
    }, [genreFilter]);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-aniverse-purple flex items-center mb-6">
                <FaThumbsUp className="text-aniverse-pink mr-2" /> Animes Más Votados
            </h1>

            <div className="bg-white rounded-lg p-4 mb-6 shadow-md">
                <div>
                    <h3 className="text-gray-700 font-semibold mb-3">Filtrar por género</h3>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setGenreFilter(null)}
                            className={`px-3 py-1 rounded-full text-sm ${
                                genreFilter === null
                                    ? 'bg-aniverse-purple text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                {genre}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-aniverse-pink"></div>
                </div>
            ) : error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">Error</span>
                    </div>
                    <p className="mt-2">{error}</p>
                </div>
            ) : (
                <>
                    {animes.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {animes.map(anime => (
                                <AnimeCard key={anime.id || anime.jikanId} anime={anime} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-lg shadow-md text-center">
                            <p className="text-gray-600 mb-4">No se encontraron animes que coincidan con los filtros.</p>
                            <button
                                onClick={() => setGenreFilter(null)}
                                className="px-4 py-2 bg-aniverse-purple text-white rounded-lg hover:bg-aniverse-purple-light transition-colors"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};