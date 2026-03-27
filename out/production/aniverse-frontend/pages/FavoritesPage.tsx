// src/pages/FavoritesPage.tsx - Versión actualizada con lógica avanzada
import React, { useState, useEffect, useCallback } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Link, useNavigate } from 'react-router-dom';
import {
    FaGrid3X3,
    FaList,
    FaSearch,
    FaFilter,
    FaSpinner,
    FaExclamationTriangle,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    FaHeart,
    FaStar,
    FaEye
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { favoritoService, PaginatedFavoritos } from '../services/favoritoService';
import { Favorito } from '../types';
import { FavoriteButton } from '../components/FavoriteButton';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const FavoritesPage: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Estados principales
    const [favoritos, setFavoritos] = useState<Favorito[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados de paginación
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [pageSize] = useState(12);

    // Estados de UI
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'fechaCreacion' | 'animeTitulo'>('fechaCreacion');
    const [direction, setDirection] = useState<'asc' | 'desc'>('desc');
    const [showFilters, setShowFilters] = useState(false);

    // Verificar autenticación
    useEffect(() => {
        if (!isAuthenticated || !user) {
            navigate('/login');
            return;
        }
    }, [isAuthenticated, user, navigate]);

    // Función para cargar favoritos
    const loadFavoritos = useCallback(async (page: number = 0, append: boolean = false) => {
        if (!user?.id) return;

        try {
            if (!append) {
                setLoading(true);
                setError(null);
            }

            const response: PaginatedFavoritos = await favoritoService.getFavoritosByUsuario(
                user.id,
                page,
                pageSize
            );

            // Filtrar por término de búsqueda si existe
            let filteredFavoritos = response.content;
            if (searchTerm.trim()) {
                filteredFavoritos = filteredFavoritos.filter(fav =>
                    fav.animeTitulo.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            // Aplicar ordenamiento
            filteredFavoritos.sort((a, b) => {
                let comparison = 0;
                if (sortBy === 'animeTitulo') {
                    comparison = a.animeTitulo.localeCompare(b.animeTitulo);
                } else {
                    // Usar ID como proxy para fecha de creación
                    comparison = (a.id || 0) - (b.id || 0);
                }
                return direction === 'desc' ? -comparison : comparison;
            });

            // Actualizar estados
            if (append) {
                setFavoritos(prev => [...prev, ...filteredFavoritos]);
            } else {
                setFavoritos(filteredFavoritos);
            }

            setCurrentPage(response.number);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
            setHasMore(!response.last);

        } catch (err) {
            console.error('Error loading favoritos:', err);
            setError('Error al cargar tus favoritos. Por favor, intenta de nuevo.');
            if (!append) {
                setFavoritos([]);
            }
        } finally {
            setLoading(false);
        }
    }, [user?.id, pageSize, searchTerm, sortBy, direction]);

    // Cargar favoritos inicial
    useEffect(() => {
        if (user?.id) {
            loadFavoritos(0, false);
        }
    }, [loadFavoritos]);

    // Handler para búsqueda con debounce
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (user?.id) {
                setCurrentPage(0);
                loadFavoritos(0, false);
            }
        }, 500);

        return () => clearTimeout(timeout);
    }, [searchTerm, sortBy, direction]);

    // Handler para cargar más (paginación infinita)
    const handleLoadMore = () => {
        if (!loading && hasMore) {
            loadFavoritos(currentPage + 1, true);
        }
    };

    // Handler para remover favorito
    const handleRemoveFavorite = async (favorito: Favorito) => {
        try {
            await favoritoService.removeFavorito(favorito.id);

            // Remover de la lista local
            setFavoritos(prev => prev.filter(f => f.id !== favorito.id));
            setTotalElements(prev => prev - 1);
        } catch (error) {
            console.error('Error removing favorite:', error);
            alert('Error al remover de favoritos');
        }
    };

    // Handler para navegar al anime
    const handleAnimeClick = (favorito: Favorito) => {
        navigate(`/anime/${favorito.animeId}`);
    };

    // No mostrar nada si no está autenticado (el redirect manejará esto)
    if (!isAuthenticated || !user) {
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-grow container mx-auto p-4 md:p-6">
                <div className="space-y-6">
                    {/* Header con controles */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-aniverse-cyan">
                                Mis Animes Favoritos
                                {totalElements > 0 && (
                                    <span className="text-lg font-normal text-gray-400 ml-2">
                                        ({totalElements})
                                    </span>
                                )}
                            </h1>
                            <p className="text-gray-400 mt-1">
                                Todos tus animes favoritos en un solo lugar
                            </p>
                        </div>

                        <div className="flex items-center space-x-3">
                            {/* Buscador */}
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar favoritos..."
                                    className="pl-10 pr-4 py-2 bg-black/30 border border-aniverse-cyan/20 rounded-lg focus:ring-2 focus:ring-aniverse-cyan focus:border-transparent w-48 text-white placeholder-gray-400"
                                />
                            </div>

                            {/* Filtros/Ordenamiento */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                                    showFilters
                                        ? 'bg-aniverse-cyan text-black border-aniverse-cyan'
                                        : 'bg-black/30 text-white border-aniverse-cyan/20 hover:bg-aniverse-cyan/10'
                                }`}
                            >
                                <FaFilter />
                                <span>Filtros</span>
                            </button>

                            {/* Toggle de vista */}
                            <div className="flex border border-aniverse-cyan/20 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 transition-colors ${
                                        viewMode === 'grid'
                                            ? 'bg-aniverse-cyan text-black'
                                            : 'bg-black/30 text-white hover:bg-aniverse-cyan/10'
                                    }`}
                                    title="Vista de cuadrícula"
                                >
                                    <FaGrid3X3 />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 transition-colors ${
                                        viewMode === 'list'
                                            ? 'bg-aniverse-cyan text-black'
                                            : 'bg-black/30 text-white hover:bg-aniverse-cyan/10'
                                    }`}
                                    title="Vista de lista"
                                >
                                    <FaList />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Panel de filtros */}
                    {showFilters && (
                        <div className="bg-black/30 backdrop-blur-sm rounded-lg border border-aniverse-cyan/20 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Ordenar por
                                    </label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as 'fechaCreacion' | 'animeTitulo')}
                                        className="w-full px-3 py-2 bg-black/50 border border-aniverse-cyan/20 rounded-lg focus:ring-2 focus:ring-aniverse-cyan focus:border-transparent text-white"
                                    >
                                        <option value="fechaCreacion">Fecha agregado</option>
                                        <option value="animeTitulo">Nombre del anime</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Dirección
                                    </label>
                                    <select
                                        value={direction}
                                        onChange={(e) => setDirection(e.target.value as 'asc' | 'desc')}
                                        className="w-full px-3 py-2 bg-black/50 border border-aniverse-cyan/20 rounded-lg focus:ring-2 focus:ring-aniverse-cyan focus:border-transparent text-white"
                                    >
                                        <option value="desc">Más recientes primero</option>
                                        <option value="asc">Más antiguos primero</option>
                                    </select>
                                </div>

                                <div className="flex items-end">
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setSortBy('fechaCreacion');
                                            setDirection('desc');
                                        }}
                                        className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        Limpiar filtros
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Estado de carga inicial */}
                    {loading && favoritos.length === 0 && (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-aniverse-cyan"></div>
                            <span className="ml-3 text-white">Cargando favoritos...</span>
                        </div>
                    )}

                    {/* Estado de error */}
                    {error && (
                        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
                            <div className="flex items-center">
                                <FaExclamationTriangle className="text-red-500 mr-3" />
                                <div>
                                    <h3 className="text-red-400 font-medium">Error al cargar favoritos</h3>
                                    <p className="text-red-300 text-sm mt-1">{error}</p>
                                    <button
                                        onClick={() => loadFavoritos(0, false)}
                                        className="mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                                    >
                                        Reintentar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Lista vacía */}
                    {!loading && favoritos.length === 0 && !error && (
                        <div className="bg-black/30 backdrop-blur-sm rounded-lg border border-aniverse-cyan/20 p-8 text-center">
                            <div className="text-gray-400 text-6xl mb-4">💖</div>
                            <h3 className="text-xl font-medium text-white mb-2">
                                {searchTerm ? 'No se encontraron favoritos' : 'No has agregado ningún anime a favoritos todavía'}
                            </h3>
                            <p className="text-gray-400 mb-4">
                                {searchTerm
                                    ? `No hay favoritos que coincidan con "${searchTerm}"`
                                    : 'Explora animes y agrégalos a favoritos para verlos aquí'
                                }
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={() => navigate('/animes')}
                                    className="bg-aniverse-cyan hover:bg-aniverse-cyan/80 text-black font-bold py-2 px-4 rounded transition-colors"
                                >
                                    Explorar Animes
                                </button>
                            )}
                        </div>
                    )}

                    {/* Lista de favoritos */}
                    {favoritos.length > 0 && (
                        <>
                            {/* Vista de cuadrícula */}
                            {viewMode === 'grid' && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {favoritos.map((favorito) => (
                                        <div key={favorito.id} className="group relative">
                                            {/* Tarjeta del anime */}
                                            <div
                                                className="aspect-[2/3] rounded-lg overflow-hidden mb-2 shadow-md cursor-pointer"
                                                onClick={() => handleAnimeClick(favorito)}
                                            >
                                                {favorito.anime?.imagenUrl ? (
                                                    <img
                                                        src={favorito.anime.imagenUrl}
                                                        alt={favorito.animeTitulo}
                                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-r from-aniverse-purple to-aniverse-pink flex items-center justify-center">
                                                        <span className="text-white text-xs text-center p-2">
                                                            {favorito.animeTitulo}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Overlay con botones */}
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAnimeClick(favorito);
                                                            }}
                                                            className="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors"
                                                            title="Ver detalles"
                                                        >
                                                            <FaEye />
                                                        </button>
                                                        <FavoriteButton
                                                            animeId={favorito.animeId}
                                                            animeTitulo={favorito.animeTitulo}
                                                            initialIsFavorite={true}
                                                            onToggle={(isFavorite) => {
                                                                if (!isFavorite) {
                                                                    handleRemoveFavorite(favorito);
                                                                }
                                                            }}
                                                            size="sm"
                                                            variant="minimal"
                                                            className="bg-white text-red-500 p-2 rounded-full hover:bg-red-50"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Información del anime */}
                                            <div>
                                                <h4 className="text-sm font-medium text-white line-clamp-2 group-hover:text-aniverse-cyan transition-colors cursor-pointer"
                                                    onClick={() => handleAnimeClick(favorito)}>
                                                    {favorito.animeTitulo}
                                                </h4>
                                                {favorito.anime?.puntuacionPromedio && (
                                                    <div className="flex items-center mt-1 text-xs text-gray-400">
                                                        <FaStar className="text-yellow-400 mr-1" />
                                                        {favorito.anime.puntuacionPromedio.toFixed(1)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Vista de lista */}
                            {viewMode === 'list' && (
                                <div className="space-y-4">
                                    {favoritos.map((favorito) => (
                                        <div key={favorito.id} className="bg-black/30 backdrop-blur-sm rounded-lg border border-aniverse-cyan/20 p-4 hover:border-aniverse-cyan/40 transition-colors">
                                            <div className="flex items-center space-x-4">
                                                {/* Imagen */}
                                                <div
                                                    className="w-16 h-24 rounded-md overflow-hidden flex-shrink-0 cursor-pointer"
                                                    onClick={() => handleAnimeClick(favorito)}
                                                >
                                                    {favorito.anime?.imagenUrl ? (
                                                        <img
                                                            src={favorito.anime.imagenUrl}
                                                            alt={favorito.animeTitulo}
                                                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-r from-aniverse-purple to-aniverse-pink flex items-center justify-center">
                                                            <span className="text-white text-xs text-center p-1">No img</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Información del anime */}
                                                <div className="flex-1">
                                                    <h3
                                                        className="text-lg font-semibold text-white hover:text-aniverse-cyan transition-colors cursor-pointer"
                                                        onClick={() => handleAnimeClick(favorito)}
                                                    >
                                                        {favorito.animeTitulo}
                                                    </h3>

                                                    {favorito.anime?.descripcion && (
                                                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                                                            {favorito.anime.descripcion}
                                                        </p>
                                                    )}

                                                    <div className="flex items-center space-x-4 mt-2">
                                                        {favorito.anime?.puntuacionPromedio && (
                                                            <div className="flex items-center text-sm text-gray-400">
                                                                <FaStar className="text-yellow-400 mr-1" />
                                                                {favorito.anime.puntuacionPromedio.toFixed(1)}/10
                                                            </div>
                                                        )}

                                                        {favorito.anime?.genero && (
                                                            <span className="text-xs bg-aniverse-cyan/20 text-aniverse-cyan px-2 py-1 rounded-full">
                                                                {favorito.anime.genero}
                                                            </span>
                                                        )}

                                                        {favorito.anime?.anyo && (
                                                            <span className="text-xs text-gray-400">
                                                                {favorito.anime.anyo}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Acciones */}
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleAnimeClick(favorito)}
                                                        className="flex items-center space-x-2 px-4 py-2 bg-aniverse-cyan text-black rounded-lg hover:bg-aniverse-cyan/80 transition-colors font-medium"
                                                    >
                                                        <FaEye />
                                                        <span>Ver</span>
                                                    </button>

                                                    <FavoriteButton
                                                        animeId={favorito.animeId}
                                                        animeTitulo={favorito.animeTitulo}
                                                        initialIsFavorite={true}
                                                        onToggle={(isFavorite) => {
                                                            if (!isFavorite) {
                                                                handleRemoveFavorite(favorito);
                                                            }
                                                        }}
                                                        size="md"
                                                        variant="outlined"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Botón cargar más */}
                            {hasMore && (
                                <div className="flex justify-center pt-6">
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loading}
                                        className="flex items-center space-x-2 bg-aniverse-cyan/20 text-aniverse-cyan px-6 py-3 rounded-lg hover:bg-aniverse-cyan hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-aniverse-cyan/30"
                                    >
                                        {loading ? (
                                            <>
                                                <FaSpinner className="animate-spin" />
                                                <span>Cargando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Cargar más favoritos</span>
                                                <span className="text-sm opacity-75">
                                                    ({favoritos.length} de {totalElements})
                                                </span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};