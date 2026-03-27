// src/pages/EstadisticasPage.tsx - CORREGIDO
import React, { useState, useEffect } from 'react';
import api from '../api'; // ✅ USAR api EN LUGAR DE axios directo
import { Anime, EstadisticasDTO } from '../types';
import { Link } from 'react-router-dom';
import { FaStar, FaCalendarAlt, FaChartLine, FaThumbsUp } from 'react-icons/fa';
import AnimeCard from '../components/AnimeCard';

export const EstadisticasPage: React.FC = () => {
    const [estadisticas, setEstadisticas] = useState<EstadisticasDTO | null>(null);
    const [topRatedAnimes, setTopRatedAnimes] = useState<Anime[]>([]);
    const [recentAnimes, setRecentAnimes] = useState<Anime[]>([]);
    const [mostVotedAnimes, setMostVotedAnimes] = useState<Anime[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'general' | 'topRated' | 'recent' | 'mostVoted'>('general');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                console.log('🔄 Fetching estadísticas data...');

                // ✅ USAR api CON ESTRUCTURA AniverseResponse
                const statsResponse = await api.get('/estadisticas');
                console.log('📊 Stats response:', statsResponse.data);
                if (statsResponse.data.success) {
                    setEstadisticas(statsResponse.data.data);
                }

                const topRatedResponse = await api.get('/estadisticas/top-rated?limit=6');
                console.log('⭐ Top rated response:', topRatedResponse.data);
                if (topRatedResponse.data.success) {
                    setTopRatedAnimes(topRatedResponse.data.data);
                }

                const recentResponse = await api.get('/estadisticas/most-recent?limit=6');
                console.log('📅 Recent response:', recentResponse.data);
                if (recentResponse.data.success) {
                    setRecentAnimes(recentResponse.data.data);
                }

                const mostVotedResponse = await api.get('/estadisticas/most-voted?limit=6');
                console.log('👍 Most voted response:', mostVotedResponse.data);
                if (mostVotedResponse.data.success) {
                    setMostVotedAnimes(mostVotedResponse.data.data);
                }

                console.log('✅ All estadísticas data loaded successfully');
            } catch (err) {
                console.error('❌ Error fetching statistics:', err);
                setError('Error al cargar estadísticas. Por favor, intenta de nuevo más tarde.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-16 flex justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-aniverse-pink"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-16">
                <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">Error</span>
                    </div>
                    <p className="mt-2">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 pt-20 md:pt-24">
            <h1 className="text-3xl font-bold text-aniverse-purple mb-6">Estadísticas de Aniverse</h1>

            {/* Tabs navigation */}
            <div className="border-b border-gray-200 mb-8">
                <nav className="flex -mb-px">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                            activeTab === 'general'
                                ? 'border-aniverse-purple text-aniverse-purple'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <FaChartLine className="inline mr-2" />
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab('topRated')}
                        className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                            activeTab === 'topRated'
                                ? 'border-aniverse-purple text-aniverse-purple'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <FaStar className="inline mr-2" />
                        Mejor Puntuados
                    </button>
                    <button
                        onClick={() => setActiveTab('recent')}
                        className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                            activeTab === 'recent'
                                ? 'border-aniverse-purple text-aniverse-purple'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <FaCalendarAlt className="inline mr-2" />
                        Más Recientes
                    </button>
                    <button
                        onClick={() => setActiveTab('mostVoted')}
                        className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                            activeTab === 'mostVoted'
                                ? 'border-aniverse-purple text-aniverse-purple'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <FaThumbsUp className="inline mr-2" />
                        Más Votados
                    </button>
                </nav>
            </div>

            {/* Tab content */}
            <div className="mt-6">
                {activeTab === 'general' && estadisticas && (
                    <div className="animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {/* General stats cards */}
                            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-aniverse-purple">
                                <div className="flex items-start">
                                    <div className="bg-aniverse-purple/10 rounded-full p-3">
                                        <svg className="w-8 h-8 text-aniverse-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-gray-500 text-sm font-medium">Total animes</h3>
                                        <p className="text-3xl font-bold text-gray-800">{estadisticas.totalAnimes.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-aniverse-cyan">
                                <div className="flex items-start">
                                    <div className="bg-aniverse-cyan/10 rounded-full p-3">
                                        <svg className="w-8 h-8 text-aniverse-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-gray-500 text-sm font-medium">Total usuarios</h3>
                                        <p className="text-3xl font-bold text-gray-800">{estadisticas.totalUsuarios.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-aniverse-pink">
                                <div className="flex items-start">
                                    <div className="bg-aniverse-pink/10 rounded-full p-3">
                                        <svg className="w-8 h-8 text-aniverse-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-gray-500 text-sm font-medium">Total reseñas</h3>
                                        <p className="text-3xl font-bold text-gray-800">{estadisticas.totalResenyas.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-400">
                                <div className="flex items-start">
                                    <div className="bg-yellow-100 rounded-full p-3">
                                        <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-gray-500 text-sm font-medium">Puntuación media</h3>
                                        <p className="text-3xl font-bold text-gray-800">{estadisticas.puntuacionPromedio.toFixed(1)} / 5</p>
                                        <p className="text-sm text-gray-500">De {estadisticas.totalVotaciones.toLocaleString()} votaciones</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Distribution charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Genres distribution */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h3 className="text-lg font-semibold text-aniverse-purple mb-4">Distribución por géneros</h3>
                                <div className="space-y-3">
                                    {estadisticas.distribucionGeneros.slice(0, 8).map((genero) => (
                                        <div key={genero.genero} className="flex items-center">
                                            <div className="w-1/3">
                                                <span className="text-sm font-medium text-gray-600">{genero.genero}</span>
                                            </div>
                                            <div className="w-2/3">
                                                <div className="relative pt-1">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="overflow-hidden h-4 text-xs flex rounded bg-gray-100">
                                                                <div
                                                                    style={{ width: `${genero.porcentaje}%` }}
                                                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-aniverse-purple"
                                                                ></div>
                                                            </div>
                                                        </div>
                                                        <div className="ml-4 text-xs font-semibold text-gray-600 w-12 text-right">
                                                            {genero.porcentaje.toFixed(1)}%
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Years distribution */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h3 className="text-lg font-semibold text-aniverse-purple mb-4">Distribución por años</h3>
                                <div className="space-y-3">
                                    {estadisticas.distribucionAnyos.slice(0, 8).map((anyo) => (
                                        <div key={anyo.anyo} className="flex items-center">
                                            <div className="w-1/4">
                                                <span className="text-sm font-medium text-gray-600">{anyo.anyo}</span>
                                            </div>
                                            <div className="w-3/4">
                                                <div className="relative pt-1">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="overflow-hidden h-4 text-xs flex rounded bg-gray-100">
                                                                <div
                                                                    style={{ width: `${(anyo.cantidad / Math.max(...estadisticas.distribucionAnyos.map(a => a.cantidad))) * 100}%` }}
                                                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-aniverse-cyan"
                                                                ></div>
                                                            </div>
                                                        </div>
                                                        <div className="ml-4 text-xs font-semibold text-gray-600 w-12 text-right">
                                                            {anyo.cantidad}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'topRated' && (
                    <div className="animate-fadeIn">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-aniverse-purple">Animes mejor puntuados</h2>
                            <Link to="/top-rated" className="text-aniverse-purple hover:text-aniverse-purple-light font-medium">
                                Ver todos →
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {topRatedAnimes.map((anime, index) => (
                                <div key={anime.id || anime.jikanId || `top-${index}`}>
                                    <AnimeCard anime={anime} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'recent' && (
                    <div className="animate-fadeIn">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-aniverse-purple">Animes más recientes</h2>
                            <Link to="/recent" className="text-aniverse-purple hover:text-aniverse-purple-light font-medium">
                                Ver todos →
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {recentAnimes.map((anime, index) => (
                                <div key={anime.id || anime.jikanId || `recent-${index}`}>
                                    <AnimeCard anime={anime} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'mostVoted' && (
                    <div className="animate-fadeIn">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-aniverse-purple">Animes más votados</h2>
                            <Link to="/most-voted" className="text-aniverse-purple hover:text-aniverse-purple-light font-medium">
                                Ver todos →
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {mostVotedAnimes.map((anime, index) => (
                                <div key={anime.id || anime.jikanId || `voted-${index}`}>
                                    <AnimeCard anime={anime} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};