// src/components/ResenyasList.tsx - Versión corregida
import React, { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaFilter, FaSpinner, FaExclamationTriangle, FaPlus } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { resenyaService, PaginatedResenyas } from '../services/resenyaService';
import { ResenyaCard } from './ResenyaCard';
import { ResenyaForm } from './ResenyaForm';
import { Resenya } from '../types';

interface ResenyasListProps {
    // Filtros específicos
    animeId?: number;
    jikanId?: number;
    usuarioId?: number;
    animeTitulo?: string;

    // Configuración de visualización
    showAnimeInfo?: boolean;
    showUserActions?: boolean;
    showCreateButton?: boolean;
    maxItems?: number;

    // Callbacks
    onResenyaCreated?: (resenya: Resenya) => void;
    onResenyaUpdated?: (resenya: Resenya) => void;
    onResenyaDeleted?: (resenyaId: number) => void;

    // Estilos
    className?: string;
    title?: string;
}

interface FilterState {
    contenido: string;
    puntuacionMin: number | null;
    puntuacionMax: number | null;
    sortBy: 'fechaCreacion' | 'puntuacion';
    direction: 'asc' | 'desc';
}

export const ResenyasList: React.FC<ResenyasListProps> = ({
                                                              animeId,
                                                              jikanId,
                                                              usuarioId,
                                                              animeTitulo,
                                                              showAnimeInfo = true,
                                                              showUserActions = true,
                                                              showCreateButton = false,
                                                              maxItems,
                                                              onResenyaCreated,
                                                              onResenyaUpdated,
                                                              onResenyaDeleted,
                                                              className = '',
                                                              title = 'Reseñas'
                                                          }) => {
    const { user, isAuthenticated } = useAuth();

    // Estados principales
    const [resenyas, setResenyas] = useState<Resenya[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);

    // Estados de paginación
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize] = useState(maxItems || 10);

    // Estados de filtros
    const [filters, setFilters] = useState<FilterState>({
        contenido: '',
        puntuacionMin: null,
        puntuacionMax: null,
        sortBy: 'fechaCreacion',
        direction: 'desc'
    });
    const [showFilters, setShowFilters] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState<number | null>(null);

    // Estados del formulario
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingResenya, setEditingResenya] = useState<Resenya | null>(null);
    const [submittingAction, setSubmittingAction] = useState(false);

    // Función para cargar reseñas
    const loadResenyas = useCallback(async (page: number = 0, append: boolean = false) => {
        try {
            if (!append) {
                setLoading(true);
                setError(null);
            }

            let response: PaginatedResenyas;

            // Determinar qué servicio usar según los props
            if (animeId || jikanId) {
                // Reseñas de un anime específico
                if (animeId) {
                    response = await resenyaService.getResenyasByAnime(animeId, page, pageSize);
                } else {
                    response = await resenyaService.getResenyasByJikanId(jikanId!, page, pageSize);
                }
            } else if (usuarioId) {
                // Reseñas de un usuario específico
                response = await resenyaService.getResenyasByUsuario(usuarioId, page, pageSize);
            } else {
                // Todas las reseñas con filtros
                response = await resenyaService.buscarResenyas({
                    contenido: filters.contenido || undefined,
                    puntuacionMin: filters.puntuacionMin || undefined,
                    puntuacionMax: filters.puntuacionMax || undefined,
                    page,
                    size: pageSize,
                    sortBy: filters.sortBy,
                    direction: filters.direction
                });
            }

            // Actualizar estados
            if (append) {
                setResenyas(prev => [...prev, ...response.content]);
            } else {
                setResenyas(response.content);
            }

            setCurrentPage(response.number);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
            setHasMore(!response.last);

        } catch (err) {
            console.error('Error loading reseñas:', err);
            setError('Error al cargar las reseñas. Por favor, intenta de nuevo.');
            if (!append) {
                setResenyas([]);
            }
        } finally {
            setLoading(false);
        }
    }, [animeId, jikanId, usuarioId, pageSize, filters]);

    // Cargar reseñas inicial y cuando cambian los filtros
    useEffect(() => {
        loadResenyas(0, false);
    }, [loadResenyas]);

    // Handler para búsqueda con debounce
    const handleSearchChange = (searchTerm: string) => {
        setFilters(prev => ({ ...prev, contenido: searchTerm }));

        if (searchTimeout) {
            window.clearTimeout(searchTimeout);
        }

        const timeout = window.setTimeout(() => {
            setCurrentPage(0);
            loadResenyas(0, false);
        }, 500);

        setSearchTimeout(timeout);
    };

    // Handler para cambios de filtros
    const handleFilterChange = (newFilters: Partial<FilterState>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(0);
        loadResenyas(0, false);
    };

    // Handler para cargar más (paginación infinita)
    const handleLoadMore = () => {
        if (!loading && hasMore) {
            loadResenyas(currentPage + 1, true);
        }
    };

    // Handlers para acciones de reseñas
    const handleCreateResenya = async (data: any) => {
        try {
            setSubmittingAction(true);
            const nuevaResenya = await resenyaService.crearResenya(data);

            // Actualizar lista
            setResenyas(prev => [nuevaResenya, ...prev]);
            setTotalElements(prev => prev + 1);

            // Callbacks
            if (onResenyaCreated) {
                onResenyaCreated(nuevaResenya);
            }

            setShowCreateForm(false);
        } catch (err: any) {
            throw new Error(err.message || 'Error al crear la reseña');
        } finally {
            setSubmittingAction(false);
        }
    };

    const handleEditResenya = async (data: any) => {
        if (!editingResenya) return;

        try {
            setSubmittingAction(true);
            const resenyaActualizada = await resenyaService.actualizarResenya(editingResenya.id, data);

            // Actualizar en la lista
            setResenyas(prev =>
                prev.map(r => r.id === resenyaActualizada.id ? resenyaActualizada : r)
            );

            // Callbacks
            if (onResenyaUpdated) {
                onResenyaUpdated(resenyaActualizada);
            }

            setEditingResenya(null);
        } catch (err: any) {
            throw new Error(err.message || 'Error al actualizar la reseña');
        } finally {
            setSubmittingAction(false);
        }
    };

    const handleDeleteResenya = async (resenyaId: number) => {
        try {
            await resenyaService.eliminarResenya(resenyaId);

            // Remover de la lista
            setResenyas(prev => prev.filter(r => r.id !== resenyaId));
            setTotalElements(prev => prev - 1);

            // Callbacks
            if (onResenyaDeleted) {
                onResenyaDeleted(resenyaId);
            }
        } catch (err: any) {
            alert(err.message || 'Error al eliminar la reseña');
        }
    };

    // ✅ CORREGIDO: Usar el método correcto del servicio
    const canCreateReview = useCallback(async () => {
        if (!isAuthenticated || !user || (!animeId && !jikanId)) return false;

        try {
            const result = await resenyaService.puedeResenar(animeId, jikanId);
            return result.puedeResenar;
        } catch {
            return false;
        }
    }, [isAuthenticated, user, animeId, jikanId]);

    // Estado para verificar si puede crear reseña
    const [canCreate, setCanCreate] = useState(false);
    useEffect(() => {
        if (showCreateButton) {
            canCreateReview().then(setCanCreate);
        }
    }, [showCreateButton, canCreateReview]);

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header con título y controles */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-aniverse-purple">
                        {title}
                        {totalElements > 0 && (
                            <span className="text-lg font-normal text-gray-600 ml-2">
                                ({totalElements})
                            </span>
                        )}
                    </h2>
                    {animeTitulo && (
                        <p className="text-gray-600">para {animeTitulo}</p>
                    )}
                </div>

                <div className="flex items-center space-x-3">
                    {/* Botón para crear reseña */}
                    {showCreateButton && canCreate && isAuthenticated && (
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="flex items-center space-x-2 bg-aniverse-purple text-white px-4 py-2 rounded-lg hover:bg-aniverse-purple/80 transition-colors"
                        >
                            <FaPlus />
                            <span>Escribir Reseña</span>
                        </button>
                    )}

                    {/* Botón para mostrar/ocultar filtros */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                            showFilters
                                ? 'bg-aniverse-purple text-white border-aniverse-purple'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        <FaFilter />
                        <span>Filtros</span>
                    </button>
                </div>
            </div>

            {/* Panel de filtros */}
            {showFilters && (
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Búsqueda por contenido */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Buscar en contenido
                            </label>
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={filters.contenido}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    placeholder="Buscar..."
                                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-aniverse-purple focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Puntuación mínima */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Puntuación mínima
                            </label>
                            <select
                                value={filters.puntuacionMin || ''}
                                onChange={(e) => handleFilterChange({
                                    puntuacionMin: e.target.value ? parseFloat(e.target.value) : null
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aniverse-purple focus:border-transparent"
                            >
                                <option value="">Cualquiera</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <option key={num} value={num}>{num}+ puntos</option>
                                ))}
                            </select>
                        </div>

                        {/* Ordenamiento */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ordenar por
                            </label>
                            <select
                                value={`${filters.sortBy}-${filters.direction}`}
                                onChange={(e) => {
                                    const [sortBy, direction] = e.target.value.split('-');
                                    handleFilterChange({
                                        sortBy: sortBy as 'fechaCreacion' | 'puntuacion',
                                        direction: direction as 'asc' | 'desc'
                                    });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aniverse-purple focus:border-transparent"
                            >
                                <option value="fechaCreacion-desc">Más recientes</option>
                                <option value="fechaCreacion-asc">Más antiguos</option>
                                <option value="puntuacion-desc">Mejor puntuados</option>
                                <option value="puntuacion-asc">Peor puntuados</option>
                            </select>
                        </div>

                        {/* Botón limpiar filtros */}
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setFilters({
                                        contenido: '',
                                        puntuacionMin: null,
                                        puntuacionMax: null,
                                        sortBy: 'fechaCreacion',
                                        direction: 'desc'
                                    });
                                    setCurrentPage(0);
                                    loadResenyas(0, false);
                                }}
                                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Estado de carga inicial */}
            {loading && resenyas.length === 0 && (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-aniverse-purple"></div>
                    <span className="ml-3 text-gray-600">Cargando reseñas...</span>
                </div>
            )}

            {/* Estado de error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <FaExclamationTriangle className="text-red-500 mr-3" />
                        <div>
                            <h3 className="text-red-800 font-medium">Error al cargar reseñas</h3>
                            <p className="text-red-600 text-sm mt-1">{error}</p>
                            <button
                                onClick={() => loadResenyas(0, false)}
                                className="mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                            >
                                Reintentar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista de reseñas */}
            {!loading && resenyas.length === 0 && !error && (
                <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-medium text-gray-600 mb-2">
                        No hay reseñas aún
                    </h3>
                    <p className="text-gray-500 mb-4">
                        {animeId || jikanId
                            ? 'Sé el primero en escribir una reseña para este anime'
                            : 'No se encontraron reseñas con los filtros actuales'
                        }
                    </p>
                    {showCreateButton && canCreate && isAuthenticated && (
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="bg-aniverse-purple text-white px-6 py-3 rounded-lg hover:bg-aniverse-purple/80 transition-colors"
                        >
                            Escribir primera reseña
                        </button>
                    )}
                </div>
            )}

            {/* Lista de reseñas */}
            {resenyas.length > 0 && (
                <div className="space-y-6">
                    {resenyas.map((resenya) => (
                        <ResenyaCard
                            key={resenya.id}
                            resenya={resenya}
                            showAnimeInfo={showAnimeInfo}
                            onEdit={showUserActions ? (r) => setEditingResenya(r) : undefined}
                            onDelete={showUserActions ? handleDeleteResenya : undefined}
                        />
                    ))}
                </div>
            )}

            {/* Botón cargar más */}
            {hasMore && resenyas.length > 0 && (
                <div className="flex justify-center pt-6">
                    <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="flex items-center space-x-2 bg-aniverse-purple/20 text-aniverse-purple px-6 py-3 rounded-lg hover:bg-aniverse-purple hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-aniverse-purple/30"
                    >
                        {loading ? (
                            <>
                                <FaSpinner className="animate-spin" />
                                <span>Cargando...</span>
                            </>
                        ) : (
                            <>
                                <span>Cargar más reseñas</span>
                                <span className="text-sm opacity-75">
                                    ({resenyas.length} de {totalElements})
                                </span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Modal: Formulario de creación */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <ResenyaForm
                            onSubmit={handleCreateResenya}
                            onCancel={() => setShowCreateForm(false)}
                            animeId={animeId}
                            jikanId={jikanId}
                            animeTitulo={animeTitulo}
                        />
                    </div>
                </div>
            )}

            {/* Modal: Formulario de edición */}
            {editingResenya && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <ResenyaForm
                            onSubmit={handleEditResenya}
                            onCancel={() => setEditingResenya(null)}
                            initialData={editingResenya}
                            isEditing={true}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};