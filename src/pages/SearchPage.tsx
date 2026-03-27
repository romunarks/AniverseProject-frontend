// src/pages/SearchPage.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { animeService } from '../services/animeService';
import { Anime } from '../types';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
// CORRECTO para una exportación por defecto
import AnimeCard from '../components/AnimeCard'; // <-- Sin llaves {}

export const SearchPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [animes, setAnimes] = useState<Anime[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        const searchAnimes = async () => {
            if (!query) {
                setAnimes([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await animeService.searchAnimes(query, undefined, undefined, page, 12);
                setAnimes(response.data.data.content || []);
                setTotalPages(response.data.data.totalPages);
                setError(null);
            } catch (err) {
                console.error('Error al buscar animes:', err);
                setError('No se pudieron cargar los resultados. Intenta de nuevo más tarde.');
            } finally {
                setLoading(false);
            }
        };

        searchAnimes();
    }, [query, page]);

    const handleNextPage = () => {
        if (page < totalPages - 1) {
            setPage(page + 1);
        }
    };

    const handlePrevPage = () => {
        if (page > 0) {
            setPage(page - 1);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-grow container mx-auto p-4 md:p-6">
                <div className="mb-6">
                    <Link to="/animes" className="text-aniverse-cyan hover:text-aniverse-pink">
                        ← Volver a animes
                    </Link>
                    <h1 className="text-3xl font-bold text-aniverse-cyan mt-4">Resultados para: {query}</h1>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-500 p-4 rounded mb-6">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-aniverse-cyan"></div>
                    </div>
                ) : animes.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            {animes.map(anime => (
                                <AnimeCard key={anime.id} anime={anime} />
                            ))}
                        </div>

                        <div className="flex justify-center mt-8 space-x-4">
                            <button
                                onClick={handlePrevPage}
                                disabled={page === 0}
                                className="px-4 py-2 bg-aniverse-purple-light text-white rounded disabled:opacity-50"
                            >
                                Anterior
                            </button>
                            <span className="px-4 py-2 bg-black/30 text-white rounded">
                                Página {page + 1} de {totalPages}
                            </span>
                            <button
                                onClick={handleNextPage}
                                disabled={page === totalPages - 1}
                                className="px-4 py-2 bg-aniverse-purple-light text-white rounded disabled:opacity-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg border border-aniverse-cyan/20 p-8 text-center">
                        <p className="text-white mb-4">No se encontraron animes que coincidan con tu búsqueda.</p>
                        <Link to="/animes" className="bg-aniverse-cyan hover:bg-aniverse-cyan/80 text-black font-bold py-2 px-4 rounded transition">
                            Ver todos los animes
                        </Link>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};