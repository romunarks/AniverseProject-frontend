import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import {animeService} from "../services/animeService.ts";

// Define the Anime type for proper type checking
type Anime = {
    id: number;
    titulo: string;
    descripcion: string;
    genero: string;
    imagenUrl: string;
    puntuacionPromedio?: number;
    jikanId?: number; // Para identificar animes externos
};

// Define the API response structure
type AnimeResponse = {
    success: boolean;
    message: string;
    data: {
        content: Anime[];
        totalElements: number;
        totalPages: number;
        size: number;
        number: number;
    };
};

export const SearchResultsPage = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const query = queryParams.get('q') || '';
    const [results, setResults] = useState<Anime[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchType, setSearchType] = useState<'local' | 'all'>('all');
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                setLoading(true);
                setError(null);
                setIsSearching(true);

                // Reset to first page when search query changes
                const pageToFetch = 0;
                setCurrentPage(pageToFetch);

                const response = await axios.get<AnimeResponse>(
                    `/api/animes/buscar?titulo=${encodeURIComponent(query)}&page=${pageToFetch}&size=12&includeExternal=${searchType === 'all'}`
                );

                console.log("Search results:", response.data);

                if (response.data.success) {
                    setResults(response.data.data.content);
                    setTotalPages(response.data.data.totalPages);
                } else {
                    setError(response.data.message || 'Error fetching search results');
                    setResults([]);
                }
            } catch (err) {
                console.error('Error fetching search results:', err);
                setError('An error occurred while searching. Please try again.');
                setResults([]);
            } finally {
                setLoading(false);
                setIsSearching(false);
            }
        };

        if (query) {
            fetchResults();
        } else {
            setResults([]);
            setLoading(false);
        }
    }, [query, searchType]);

    const handlePageChange = async (newPage: number) => {
        if (newPage < 0 || newPage >= totalPages) return;

        try {
            setLoading(true);
            setError(null);

            const response = await axios.get<AnimeResponse>(
                `/api/animes/buscar?titulo=${encodeURIComponent(query)}&page=${newPage}&size=12&includeExternal=${searchType === 'all'}`
            );

            if (response.data.success) {
                setResults(response.data.data.content);
                setCurrentPage(newPage);
            } else {
                setError(response.data.message || 'Error fetching search results');
            }
        } catch (err) {
            console.error('Error fetching search results:', err);
            setError('An error occurred while changing pages. Please try again.');
        } finally {
            setLoading(false);
            // Scroll to top of results
            window.scrollTo(0, 0);
        }
    };

    // Modifica esta función en SearchResultsPage.tsx
    // ✅ POR ESTA (más simple y reutilizable):
    const handleAnimeClick = (anime: Anime): string => {
        return animeService.getAnimeDetailUrl(anime);
    };

    const getAnimeSource = (anime: Anime) => {
        return anime.jikanId || anime.id < 0 ? 'External' : 'Local';
    };

    const toggleSearchType = (type: 'local' | 'all') => {
        if (searchType !== type) {
            setSearchType(type);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-aniverse-purple mb-4 md:mb-0">
                    {query ? `Search Results for: "${query}"` : 'Search Anime'}
                </h1>

                <div className="inline-flex rounded-md shadow-sm">
                    <button
                        onClick={() => toggleSearchType('local')}
                        className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                            searchType === 'local'
                                ? 'bg-aniverse-purple text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        } border border-aniverse-purple-light transition-colors duration-200`}
                    >
                        Local DB Only
                    </button>
                    <button
                        onClick={() => toggleSearchType('all')}
                        className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                            searchType === 'all'
                                ? 'bg-aniverse-purple text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        } border border-aniverse-purple-light transition-colors duration-200`}
                    >
                        All Sources
                    </button>
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
                        <span className="font-medium">Error!</span>
                    </div>
                    <p className="mt-2">{error}</p>
                </div>
            ) : results.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {results.map((anime) => (
                            <Link
                                to={handleAnimeClick(anime)}
                                key={`${anime.id || ''}-${anime.jikanId || ''}`}
                                className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 group"
                            >
                                <div className="h-64 overflow-hidden relative">
                                    {anime.imagenUrl ? (
                                        <img
                                            src={anime.imagenUrl}
                                            alt={anime.titulo}
                                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-r from-aniverse-purple to-aniverse-purple-light flex items-center justify-center">
                                            <span className="text-white font-medium">No image</span>
                                        </div>
                                    )}
                                    <div className="absolute top-0 right-0 flex flex-col items-end space-y-2 p-2">
                                        {anime.puntuacionPromedio && (
                                            <div className="bg-aniverse-pink text-white px-2 py-1 rounded-md text-sm font-bold">
                                                {anime.puntuacionPromedio.toFixed(1)}
                                            </div>
                                        )}
                                        <div className={`text-xs px-2 py-1 rounded-md ${
                                            getAnimeSource(anime) === 'External'
                                                ? 'bg-aniverse-cyan text-aniverse-purple-light'
                                                : 'bg-aniverse-purple-light text-white'
                                        } font-medium`}>
                                            {getAnimeSource(anime)}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-gray-100">
                                    <h2 className="text-lg font-semibold text-aniverse-purple line-clamp-1">{anime.titulo}</h2>
                                    <p className="text-sm text-aniverse-pink mt-1 font-medium">{anime.genero || 'Unknown Genre'}</p>
                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{anime.descripcion || 'No description available'}</p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-10">
                            <nav className="flex items-center space-x-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 0 || isSearching}
                                    className={`px-4 py-2 rounded-md ${
                                        currentPage === 0 || isSearching
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-aniverse-purple-light text-white hover:bg-aniverse-purple transition-colors'
                                    }`}
                                >
                                    Previous
                                </button>

                                {totalPages <= 7 ? (
                                    // Show all pages if there are 7 or fewer
                                    [...Array(totalPages)].map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handlePageChange(index)}
                                            disabled={isSearching}
                                            className={`w-10 h-10 rounded-md flex items-center justify-center ${
                                                currentPage === index
                                                    ? 'bg-aniverse-pink text-white'
                                                    : 'bg-white text-aniverse-purple-light hover:bg-gray-100 border border-aniverse-purple-light'
                                            } transition-colors`}
                                        >
                                            {index + 1}
                                        </button>
                                    ))
                                ) : (
                                    // Show limited pages with ellipsis for larger page counts
                                    <>
                                        <button
                                            onClick={() => handlePageChange(0)}
                                            disabled={isSearching}
                                            className={`w-10 h-10 rounded-md flex items-center justify-center ${
                                                currentPage === 0
                                                    ? 'bg-aniverse-pink text-white'
                                                    : 'bg-white text-aniverse-purple-light hover:bg-gray-100 border border-aniverse-purple-light'
                                            } transition-colors`}
                                        >
                                            1
                                        </button>

                                        {currentPage > 2 && (
                                            <span className="text-gray-500">...</span>
                                        )}

                                        {currentPage > 1 && (
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={isSearching}
                                                className="w-10 h-10 rounded-md flex items-center justify-center bg-white text-aniverse-purple-light hover:bg-gray-100 border border-aniverse-purple-light transition-colors"
                                            >
                                                {currentPage}
                                            </button>
                                        )}

                                        {currentPage > 0 && currentPage < totalPages - 1 && (
                                            <button
                                                onClick={() => handlePageChange(currentPage)}
                                                disabled={isSearching}
                                                className="w-10 h-10 rounded-md flex items-center justify-center bg-aniverse-pink text-white transition-colors"
                                            >
                                                {currentPage + 1}
                                            </button>
                                        )}

                                        {currentPage < totalPages - 2 && (
                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={isSearching}
                                                className="w-10 h-10 rounded-md flex items-center justify-center bg-white text-aniverse-purple-light hover:bg-gray-100 border border-aniverse-purple-light transition-colors"
                                            >
                                                {currentPage + 2}
                                            </button>
                                        )}

                                        {currentPage < totalPages - 3 && (
                                            <span className="text-gray-500">...</span>
                                        )}

                                        <button
                                            onClick={() => handlePageChange(totalPages - 1)}
                                            disabled={isSearching}
                                            className={`w-10 h-10 rounded-md flex items-center justify-center ${
                                                currentPage === totalPages - 1
                                                    ? 'bg-aniverse-pink text-white'
                                                    : 'bg-white text-aniverse-purple-light hover:bg-gray-100 border border-aniverse-purple-light'
                                            } transition-colors`}
                                        >
                                            {totalPages}
                                        </button>
                                    </>
                                )}

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages - 1 || isSearching}
                                    className={`px-4 py-2 rounded-md ${
                                        currentPage === totalPages - 1 || isSearching
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-aniverse-purple-light text-white hover:bg-aniverse-purple transition-colors'
                                    }`}
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    )}
                </>
            ) : query ? (
                <div className="text-center py-16 bg-white rounded-xl shadow-md border border-gray-200">
                    <div className="text-6xl mb-6">😢</div>
                    <h2 className="text-2xl font-bold mb-3 text-aniverse-purple">No results found</h2>
                    <p className="text-gray-600 max-w-md mx-auto mb-6">
                        We couldn't find any anime matching "{query}". Try a different search term
                        {searchType === 'local' ? ' or switch to "All Sources" to search external anime databases.' : '.'}
                    </p>

                    {searchType === 'local' && (
                        <button
                            onClick={() => toggleSearchType('all')}
                            className="px-4 py-2 bg-aniverse-pink text-white rounded-md hover:bg-opacity-90 transition-colors"
                        >
                            Search All Sources
                        </button>
                    )}
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-xl shadow-md border border-gray-200">
                    <div className="text-6xl mb-6">🔍</div>
                    <h2 className="text-2xl font-bold mb-3 text-aniverse-purple">Start searching</h2>
                    <p className="text-gray-600 max-w-md mx-auto">
                        Enter a search term in the search bar above to find your favorite anime titles.
                    </p>
                </div>
            )}
        </div>
    );
};