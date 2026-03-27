// src/pages/AnimePage.tsx - CORREGIDO SIN SEARCHBAR DUPLICADO
import React, { useState, useEffect } from 'react';
import { Anime } from '../types';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import AnimeCard from '../components/AnimeCard';

export const AnimePage: React.FC = () => {
    const [animes, setAnimes] = useState<Anime[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        const fetchAnimes = async () => {
            try {
                setLoading(true);
                console.log('🔄 Cargando animes paginados - página:', page);

                // ✅ LLAMADA DIRECTA AL ENDPOINT CORRECTO
                const response = await fetch(`http://localhost:8080/api/animes?page=${page}&size=12&sortBy=id&sortDir=desc`);
                const data = await response.json();

                console.log('📊 Datos recibidos del backend:', data);

                // ✅ TU BACKEND DEVUELVE UN MAP DIRECTO, NO AniverseResponse
                setAnimes(data.animes || []);
                setTotalPages(data.totalPages || 0);
                setError(null);

                console.log('✅ Animes establecidos:', data.animes?.length || 0);

            } catch (err) {
                console.error('❌ Error al cargar animes:', err);
                setError('No se pudieron cargar los animes. Intenta de nuevo más tarde.');
                setAnimes([]); // Limpiar animes en caso de error
            } finally {
                setLoading(false);
            }
        };

        // ✅ EJECUTAR LA FUNCIÓN ASYNC CORRECTAMENTE
        fetchAnimes().catch(err => {
            console.error('Error en useEffect:', err);
            setError('Error inesperado al cargar los animes.');
            setLoading(false);
        });
    }, [page]);

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

            <main className="flex-grow container mx-auto p-4 md:p-6 pt-20 md:pt-24">
                {/* ✅ HEADER CON MARGEN SUPERIOR SUFICIENTE */}
                <div className="flex flex-col items-center mb-8">
                    <h1 className="text-3xl font-bold text-aniverse-cyan mb-2">
                        Explorar Animes {animes.length > 0 && `(${animes.length})`}
                    </h1>
                    <p className="text-gray-400 text-center">
                        Usa el buscador del menú superior para encontrar animes específicos
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-500 p-4 rounded mb-6">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-aniverse-cyan"></div>
                        <span className="ml-3 text-white">Cargando animes...</span>
                    </div>
                ) : animes.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            {animes.map((anime, index) => (
                                <div key={anime.id || anime.jikanId || `anime-${index}`}>
                                    <AnimeCard anime={anime} />
                                </div>
                            ))}
                        </div>

                        {/* Solo mostrar paginación si hay más de una página */}
                        {totalPages > 1 && (
                            <div className="flex justify-center mt-8 space-x-4">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={page === 0}
                                    className="px-4 py-2 bg-aniverse-purple-light text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-aniverse-purple transition-colors"
                                >
                                    Anterior
                                </button>
                                <span className="px-4 py-2 bg-black/30 text-white rounded">
                                    Página {page + 1} de {totalPages}
                                </span>
                                <button
                                    onClick={handleNextPage}
                                    disabled={page === totalPages - 1}
                                    className="px-4 py-2 bg-aniverse-purple-light text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-aniverse-purple transition-colors"
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg border border-aniverse-cyan/20 p-8 text-center">
                        <p className="text-white mb-4">No hay animes disponibles en este momento.</p>
                        <p className="text-gray-400 text-sm">
                            {page > 0 ? 'Intenta volver a la primera página.' : 'Intenta recargar la página o verifica la conexión.'}
                        </p>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};