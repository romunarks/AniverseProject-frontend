// src/pages/UserProfilePage.tsx - Con paginación COMPLETA de favoritos
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usuarioService, EditableProfile } from '../services/usuarioService';
import { favoritoService } from '../services/favoritoService';
import { Usuario, UserStats, Favorito, PaginatedData } from '../types';
import { ResenyasList } from '../components/ResenyasList';
import { useResenyas } from '../hooks/useResenyas';
import {
    FaEdit,
    FaHeart,
    FaStar,
    FaEye,
    FaChartBar,
    FaSave,
    FaTimes,
    FaLock,
    FaCommentAlt
} from 'react-icons/fa';

export const UserProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();

    // Estados principales
    const [user, setUser] = useState<Usuario | null>(null);
    const [stats, setStats] = useState<UserStats>({
        favoritosCount: 0,
        resenyasCount: 0,
        votacionesCount: 0,
        promedioPuntuacion: 0,
        generosFavoritos: [],
        animesFavoritos: []
    });
    const [favoritos, setFavoritos] = useState<Favorito[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados de edición
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<EditableProfile>({ nombre: '', email: '' });
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Estados de UI
    const [activeTab, setActiveTab] = useState<'overview' | 'favorites' | 'reviews' | 'stats'>('overview');
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    // Estados específicos para paginación de favoritos
    const [allFavoritos, setAllFavoritos] = useState<PaginatedData<Favorito> | null>(null);
    const [favoritosPage, setFavoritosPage] = useState(0);
    const [favoritosLoading, setFavoritosLoading] = useState(false);
    const [favoritosError, setFavoritosError] = useState<string | null>(null);

    const FAVORITOS_PER_PAGE = 12; // Mostrar 12 favoritos por página
    const isOwnProfile = currentUser?.id.toString() === id;
    const profileUserId = id ? parseInt(id) : 0;

    // Hook para reseñas del usuario
    const {
        resenyas: userResenyas,
        refresh: refreshResenyas
    } = useResenyas({
        usuarioId: profileUserId,
        autoLoad: !!profileUserId && activeTab === 'reviews',
        pageSize: 12
    });

    // ========================================
    // COMPONENTE DE PAGINACIÓN
    // ========================================
    const PaginationControls: React.FC<{
        currentPage: number;
        totalPages: number;
        totalElements: number;
        onPageChange: (page: number) => void;
        loading?: boolean;
    }> = ({ currentPage, totalPages, totalElements, onPageChange, loading = false }) => {
        const generatePageNumbers = () => {
            const pages = [];
            const showPages = 5; // Mostrar máximo 5 números de página

            let startPage = Math.max(0, currentPage - Math.floor(showPages / 2));
            let endPage = Math.min(totalPages - 1, startPage + showPages - 1);

            // Ajustar si estamos cerca del final
            if (endPage - startPage < showPages - 1) {
                startPage = Math.max(0, endPage - showPages + 1);
            }

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            return pages;
        };

        if (totalPages <= 1) return null;

        const pages = generatePageNumbers();
        const startItem = currentPage * FAVORITOS_PER_PAGE + 1;
        const endItem = Math.min((currentPage + 1) * FAVORITOS_PER_PAGE, totalElements);

        return (
            <div className="flex flex-col items-center space-y-4 mt-6">
                {/* Información de paginación */}
                <div className="text-sm text-gray-600">
                    Mostrando {startItem} - {endItem} de {totalElements} favoritos • Página {currentPage + 1} de {totalPages}
                </div>

                {/* Controles de navegación */}
                <div className="flex items-center space-x-2 flex-wrap justify-center">
                    {/* Botón Anterior */}
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage <= 0 || loading}
                        className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        ← Anterior
                    </button>

                    {/* Números de página */}
                    <div className="flex space-x-1">
                        {/* Primera página si no está visible */}
                        {pages[0] > 0 && (
                            <>
                                <button
                                    onClick={() => onPageChange(0)}
                                    disabled={loading}
                                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                >
                                    1
                                </button>
                                {pages[0] > 1 && <span className="px-2 py-2 text-gray-500">...</span>}
                            </>
                        )}

                        {/* Páginas visibles */}
                        {pages.map((page) => (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                disabled={loading}
                                className={`px-3 py-2 rounded-lg border transition-colors ${
                                    page === currentPage
                                        ? 'bg-aniverse-purple text-white border-aniverse-purple'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                } disabled:opacity-50`}
                            >
                                {page + 1}
                            </button>
                        ))}

                        {/* Última página si no está visible */}
                        {pages[pages.length - 1] < totalPages - 1 && (
                            <>
                                {pages[pages.length - 1] < totalPages - 2 && <span className="px-2 py-2 text-gray-500">...</span>}
                                <button
                                    onClick={() => onPageChange(totalPages - 1)}
                                    disabled={loading}
                                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                >
                                    {totalPages}
                                </button>
                            </>
                        )}
                    </div>

                    {/* Botón Siguiente */}
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages - 1 || loading}
                        className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Siguiente →
                    </button>
                </div>
            </div>
        );
    };

    // ========================================
    // FUNCIONES HELPER
    // ========================================
    const getSafeNumber = (value: any, defaultValue: number = 0): number => {
        if (value === null || value === undefined || isNaN(Number(value))) {
            return defaultValue;
        }
        return Number(value);
    };

    const getSafeString = (value: any, decimals: number = 1): string => {
        const num = getSafeNumber(value, 0);
        return num.toFixed(decimals);
    };

    const getSafeArray = <T,>(value: any, defaultValue: T[] = []): T[] => {
        return Array.isArray(value) ? value : defaultValue;
    };

    // ========================================
    // FUNCIONES DE FAVORITOS CON PAGINACIÓN
    // ========================================
    const loadFavoritosPaginated = async (page: number = 0) => {
        if (!profileUserId) return;

        try {
            setFavoritosLoading(true);
            setFavoritosError(null);

            console.log(`📋 Cargando favoritos - página ${page}, tamaño ${FAVORITOS_PER_PAGE}`);

            // Usar getMisFavoritos solo para perfil propio, getFavoritosByUsuario para otros
            const response = isOwnProfile
                ? await favoritoService.getMisFavoritos(page, FAVORITOS_PER_PAGE)
                : await favoritoService.getFavoritosByUsuario(profileUserId, page, FAVORITOS_PER_PAGE);

            setAllFavoritos(response);
            setFavoritosPage(page);

            console.log('✅ Favoritos paginados cargados:', response);
        } catch (error) {
            console.error('❌ Error cargando favoritos paginados:', error);
            setFavoritosError('Error al cargar favoritos');
            setAllFavoritos(null);
        } finally {
            setFavoritosLoading(false);
        }
    };

    const handleFavoritosPageChange = (newPage: number) => {
        if (allFavoritos && newPage >= 0 && newPage < allFavoritos.totalPages) {
            loadFavoritosPaginated(newPage);
        }
    };

    // ========================================
    // FUNCIONES DE EDICIÓN
    // ========================================
    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            setSavingProfile(true);
            const updatedUser = await usuarioService.updateProfile(user.id, editForm);
            setUser(updatedUser);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error al actualizar el perfil');
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert('Las contraseñas nuevas no coinciden');
            return;
        }

        try {
            setSavingPassword(true);
            await usuarioService.changePassword(user.id, passwordForm);
            setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
            setIsEditingPassword(false);
            alert('Contraseña actualizada correctamente');
        } catch (error) {
            console.error('Error changing password:', error);
            alert('Error al cambiar la contraseña');
        } finally {
            setSavingPassword(false);
        }
    };

    const handleCancelEdit = () => {
        if (user) {
            setEditForm({ nombre: user.nombre, email: user.email });
        }
        setIsEditing(false);
        setIsEditingPassword(false);
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    };

    // ========================================
    // EFFECTS
    // ========================================

    // Cargar datos del usuario
    useEffect(() => {
        const fetchUserData = async () => {
            if (!id) return;

            try {
                setLoading(true);
                setError(null);

                const userId = parseInt(id);

                try {
                    const userData = await usuarioService.getUsuarioById(userId);
                    setUser(userData);
                    setEditForm({
                        nombre: userData.nombre || '',
                        email: userData.email || ''
                    });

                    // Cargar stats
                    try {
                        const statsData = await usuarioService.getUserStats(userId);
                        console.log('Raw stats data:', statsData);

                        const sanitizedStats: UserStats = {
                            favoritosCount: getSafeNumber(statsData.favoritosCount),
                            resenyasCount: getSafeNumber(statsData.resenyasCount),
                            votacionesCount: getSafeNumber(statsData.votacionesCount),
                            promedioPuntuacion: getSafeNumber(statsData.promedioPuntuacion),
                            generosFavoritos: getSafeArray(statsData.generosFavoritos),
                            animesFavoritos: getSafeArray(statsData.animesFavoritos)
                        };

                        setStats(sanitizedStats);
                        console.log('Sanitized stats:', sanitizedStats);
                    } catch (statsError) {
                        console.warn('No se pudieron cargar las estadísticas:', statsError);
                    }

                    // Cargar favoritos preview (solo para overview)
                    try {
                        const favoritosData = await favoritoService.getFavoritosByUsuario(userId, 0, 6);
                        setFavoritos(getSafeArray(favoritosData.content));
                    } catch (favError) {
                        console.warn('No se pudieron cargar los favoritos:', favError);
                        setFavoritos([]);
                    }

                } catch (userError) {
                    console.error('Error cargando usuario:', userError);
                    throw new Error('Usuario no encontrado');
                }

            } catch (err) {
                setError('Error al cargar el perfil del usuario');
                console.error('Error fetching user data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [id]);

    // Cargar favoritos paginados cuando se cambie a la pestaña favorites
    useEffect(() => {
        if (activeTab === 'favorites' && profileUserId) {
            loadFavoritosPaginated(0); // Cargar primera página
        }
    }, [activeTab, profileUserId]);

    // Refrescar reseñas cuando se actualiza la pestaña
    useEffect(() => {
        if (activeTab === 'reviews' && profileUserId) {
            refreshResenyas();
        }
    }, [activeTab, profileUserId, refreshResenyas]);

    // ========================================
    // RENDER
    // ========================================
    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-aniverse-pink"></div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error || 'Usuario no encontrado'}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
                {/* Header del perfil */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                        <div className="flex items-center space-x-4 mb-4 md:mb-0">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-aniverse-purple to-aniverse-pink flex items-center justify-center text-white text-2xl font-bold">
                                {(user.nombre || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-aniverse-purple">{user.nombre || 'Usuario'}</h1>
                                <p className="text-gray-600">{user.email || 'Sin email'}</p>
                                <div className="flex space-x-4 mt-2">
                                    <span className="text-sm text-gray-500">
                                        <FaHeart className="inline mr-1 text-red-500" />
                                        {stats.favoritosCount} favoritos
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        <FaCommentAlt className="inline mr-1 text-blue-500" />
                                        {stats.resenyasCount} reseñas
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        <FaStar className="inline mr-1 text-yellow-500" />
                                        {stats.votacionesCount} votaciones
                                    </span>
                                </div>
                            </div>
                        </div>

                        {isOwnProfile && (
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-aniverse-purple text-white rounded-lg hover:bg-aniverse-purple-light transition-colors"
                                >
                                    <FaEdit />
                                    <span>Editar Perfil</span>
                                </button>
                                <button
                                    onClick={() => setIsEditingPassword(true)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    <FaLock />
                                    <span>Cambiar Contraseña</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modales de edición */}
                {isEditing && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">Editar Perfil</h2>
                            <form onSubmit={handleProfileUpdate}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.nombre}
                                        onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aniverse-purple"
                                        required
                                    />
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aniverse-purple"
                                        required
                                    />
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        type="submit"
                                        disabled={savingProfile}
                                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-aniverse-purple text-white rounded-md hover:bg-aniverse-purple-light transition-colors disabled:opacity-50"
                                    >
                                        <FaSave />
                                        <span>{savingProfile ? 'Guardando...' : 'Guardar'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                                    >
                                        <FaTimes />
                                        <span>Cancelar</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isEditingPassword && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">Cambiar Contraseña</h2>
                            <form onSubmit={handlePasswordChange}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Contraseña Actual
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.oldPassword}
                                        onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aniverse-purple"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nueva Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aniverse-purple"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirmar Nueva Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aniverse-purple"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        type="submit"
                                        disabled={savingPassword}
                                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-aniverse-purple text-white rounded-md hover:bg-aniverse-purple-light transition-colors disabled:opacity-50"
                                    >
                                        <FaSave />
                                        <span>{savingPassword ? 'Guardando...' : 'Cambiar'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                                    >
                                        <FaTimes />
                                        <span>Cancelar</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Navegación por pestañas */}
                <div className="bg-white rounded-lg shadow-lg mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            {[
                                { key: 'overview', label: 'Resumen', icon: FaEye },
                                { key: 'favorites', label: `Favoritos (${stats.favoritosCount})`, icon: FaHeart },
                                { key: 'reviews', label: `Reseñas (${stats.resenyasCount})`, icon: FaCommentAlt },
                                { key: 'stats', label: 'Estadísticas', icon: FaChartBar }
                            ].map((tab) => {
                                const IconComponent = tab.icon;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key as any)}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors flex items-center space-x-2 ${
                                            activeTab === tab.key
                                                ? 'border-aniverse-purple text-aniverse-purple'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <IconComponent />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* Tab: Overview */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Estadísticas rápidas */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-lg p-4 text-white">
                                        <FaHeart className="text-2xl mb-2" />
                                        <div className="text-2xl font-bold">{stats.favoritosCount}</div>
                                        <div className="text-sm opacity-90">Favoritos</div>
                                    </div>
                                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg p-4 text-white">
                                        <FaCommentAlt className="text-2xl mb-2" />
                                        <div className="text-2xl font-bold">{stats.resenyasCount}</div>
                                        <div className="text-sm opacity-90">Reseñas</div>
                                    </div>
                                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-4 text-white">
                                        <FaStar className="text-2xl mb-2" />
                                        <div className="text-2xl font-bold">{stats.votacionesCount}</div>
                                        <div className="text-sm opacity-90">Votaciones</div>
                                    </div>
                                    <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-lg p-4 text-white">
                                        <FaChartBar className="text-2xl mb-2" />
                                        <div className="text-2xl font-bold">{getSafeString(stats.promedioPuntuacion)}</div>
                                        <div className="text-sm opacity-90">Promedio</div>
                                    </div>
                                </div>

                                {/* Favoritos recientes */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800">Favoritos Recientes</h3>
                                        <button
                                            onClick={() => setActiveTab('favorites')}
                                            className="text-aniverse-purple hover:text-aniverse-purple-light font-medium"
                                        >
                                            Ver todos →
                                        </button>
                                    </div>
                                    {favoritos.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                            {favoritos.slice(0, 6).map((favorito) => (
                                                <div
                                                    key={favorito.id}
                                                    className="group cursor-pointer"
                                                    onClick={() => navigate(`/anime/${favorito.animeId}`)}
                                                >
                                                    <div className="aspect-[2/3] rounded-lg overflow-hidden mb-2 shadow-md">
                                                        {favorito.anime?.imagenUrl ? (
                                                            <img
                                                                src={favorito.anime.imagenUrl}
                                                                alt={favorito.animeTitulo}
                                                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-r from-aniverse-purple to-aniverse-pink flex items-center justify-center">
                                                                <span className="text-white text-xs text-center p-2">No imagen</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <h4 className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-aniverse-purple transition-colors">
                                                        {favorito.animeTitulo}
                                                    </h4>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-center py-8">No hay favoritos aún</p>
                                    )}
                                </div>

                                {/* Reseñas recientes */}
                                {stats.resenyasCount > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-800">Reseñas Recientes</h3>
                                            <button
                                                onClick={() => setActiveTab('reviews')}
                                                className="text-aniverse-purple hover:text-aniverse-purple-light font-medium"
                                            >
                                                Ver todas →
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            {userResenyas.slice(0, 3).map((resenya) => (
                                                <div key={resenya.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-medium text-aniverse-purple">
                                                            {resenya.animeTitulo}
                                                        </h4>
                                                        <div className="flex items-center space-x-1">
                                                            <FaStar className="text-yellow-400" />
                                                            <span className="font-bold text-aniverse-pink">
                                                                {resenya.puntuacion.toFixed(1)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-700 text-sm line-clamp-2">
                                                        {resenya.contenido}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        {new Date(resenya.fechaCreacion).toLocaleDateString('es-ES')}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab: Favorites CON PAGINACIÓN COMPLETA */}
                        {activeTab === 'favorites' && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        {isOwnProfile ? 'Mis Favoritos' : `Favoritos de ${user.nombre}`}
                                    </h3>
                                    {allFavoritos && (
                                        <div className="text-sm text-gray-600">
                                            {allFavoritos.totalElements} favoritos en total
                                        </div>
                                    )}
                                </div>

                                {/* Loading state */}
                                {favoritosLoading && (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-aniverse-purple"></div>
                                    </div>
                                )}

                                {/* Error state */}
                                {favoritosError && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                        {favoritosError}
                                        <button
                                            onClick={() => loadFavoritosPaginated(favoritosPage)}
                                            className="ml-2 text-red-800 underline hover:no-underline"
                                        >
                                            Reintentar
                                        </button>
                                    </div>
                                )}

                                {/* Contenido principal */}
                                {!favoritosLoading && !favoritosError && (
                                    <>
                                        {/* Grid de favoritos */}
                                        {allFavoritos && allFavoritos.content.length > 0 ? (
                                            <>
                                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                                    {allFavoritos.content.map((favorito) => (
                                                        <div
                                                            key={favorito.id}
                                                            className="group cursor-pointer"
                                                            onClick={() => navigate(`/anime/${favorito.animeId}`)}
                                                        >
                                                            <div className="aspect-[2/3] rounded-lg overflow-hidden mb-2 shadow-md hover:shadow-lg transition-shadow">
                                                                {favorito.anime?.imagenUrl ? (
                                                                    <img
                                                                        src={favorito.anime.imagenUrl}
                                                                        alt={favorito.animeTitulo}
                                                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full bg-gradient-to-r from-aniverse-purple to-aniverse-pink flex items-center justify-center">
                                                                        <span className="text-white text-xs text-center p-2">No imagen</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <h4 className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-aniverse-purple transition-colors">
                                                                {favorito.animeTitulo}
                                                            </h4>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Controles de paginación */}
                                                <PaginationControls
                                                    currentPage={allFavoritos.number}
                                                    totalPages={allFavoritos.totalPages}
                                                    totalElements={allFavoritos.totalElements}
                                                    onPageChange={handleFavoritosPageChange}
                                                    loading={favoritosLoading}
                                                />
                                            </>
                                        ) : (
                                            /* Estado vacío */
                                            <div className="text-center py-12">
                                                <div className="text-gray-400 text-6xl mb-4">💖</div>
                                                <h3 className="text-xl font-medium text-gray-600 mb-2">No hay favoritos aún</h3>
                                                <p className="text-gray-500 mb-4">
                                                    {isOwnProfile ? 'Explora animes y agrégalos a favoritos' : 'Este usuario no ha agregado favoritos'}
                                                </p>
                                                {isOwnProfile && (
                                                    <button
                                                        onClick={() => navigate('/animes')}
                                                        className="px-6 py-2 bg-aniverse-purple text-white rounded-lg hover:bg-aniverse-purple-light transition-colors"
                                                    >
                                                        Explorar Animes
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Mostrar favoritos preview solo para perfiles de otros usuarios si no hay datos paginados */}
                                {!isOwnProfile && !allFavoritos && favoritos.length > 0 && (
                                    <div className="mt-8 pt-6 border-t border-gray-200">
                                        <h4 className="text-md font-medium text-gray-700 mb-4">Vista Previa de Favoritos</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                            {favoritos.slice(0, 6).map((favorito) => (
                                                <div
                                                    key={favorito.id}
                                                    className="group cursor-pointer"
                                                    onClick={() => navigate(`/anime/${favorito.animeId}`)}
                                                >
                                                    <div className="aspect-[2/3] rounded-lg overflow-hidden mb-2 shadow-md">
                                                        {favorito.anime?.imagenUrl ? (
                                                            <img
                                                                src={favorito.anime.imagenUrl}
                                                                alt={favorito.animeTitulo}
                                                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-r from-aniverse-purple to-aniverse-pink flex items-center justify-center">
                                                                <span className="text-white text-xs text-center p-2">No imagen</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <h4 className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-aniverse-purple transition-colors">
                                                        {favorito.animeTitulo}
                                                    </h4>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab: Reviews */}
                        {activeTab === 'reviews' && (
                            <div>
                                <ResenyasList
                                    usuarioId={profileUserId}
                                    showAnimeInfo={true}
                                    showUserActions={isOwnProfile}
                                    title={isOwnProfile ? 'Mis Reseñas' : `Reseñas de ${user.nombre}`}
                                    className="bg-transparent shadow-none"
                                />
                            </div>
                        )}

                        {/* Tab: Stats */}
                        {activeTab === 'stats' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-800">Estadísticas Detalladas</h3>

                                {/* Géneros favoritos */}
                                <div>
                                    <h4 className="text-md font-medium text-gray-700 mb-3">Géneros Favoritos</h4>
                                    {stats.generosFavoritos.length > 0 ? (
                                        <div className="space-y-2">
                                            {stats.generosFavoritos.slice(0, 5).map((genero, index) => (
                                                <div key={genero.genero || index} className="flex items-center">
                                                    <span className="w-24 text-sm text-gray-600">{genero.genero || 'Desconocido'}</span>
                                                    <div className="flex-1 bg-gray-200 rounded-full h-2 mx-3">
                                                        <div
                                                            className="bg-aniverse-purple h-2 rounded-full transition-all duration-500"
                                                            style={{
                                                                width: `${stats.favoritosCount > 0 ? (getSafeNumber(genero.count) / stats.favoritosCount) * 100 : 0}%`
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm text-gray-600">{getSafeNumber(genero.count)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">No hay datos de géneros</p>
                                    )}
                                </div>

                                {/* Animes favoritos */}
                                <div>
                                    <h4 className="text-md font-medium text-gray-700 mb-3">Animes Favoritos</h4>
                                    {stats.animesFavoritos.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {stats.animesFavoritos.slice(0, 8).map((anime, index) => (
                                                <div key={index} className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                                                    {anime || 'Anime sin título'}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">No hay animes favoritos</p>
                                    )}
                                </div>

                                {/* Actividad reciente */}
                                <div>
                                    <h4 className="text-md font-medium text-gray-700 mb-3">Resumen de Actividad</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <FaCommentAlt className="text-blue-500" />
                                                <span className="font-medium text-blue-700">Reseñas</span>
                                            </div>
                                            <div className="text-2xl font-bold text-blue-600">{stats.resenyasCount}</div>
                                            <div className="text-sm text-blue-500">
                                                Promedio: {getSafeString(stats.promedioPuntuacion)} ⭐
                                            </div>
                                        </div>
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <FaHeart className="text-red-500" />
                                                <span className="font-medium text-red-700">Favoritos</span>
                                            </div>
                                            <div className="text-2xl font-bold text-red-600">{stats.favoritosCount}</div>
                                            <div className="text-sm text-red-500">Animes guardados</div>
                                        </div>
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <FaStar className="text-yellow-500" />
                                                <span className="font-medium text-yellow-700">Votaciones</span>
                                            </div>
                                            <div className="text-2xl font-bold text-yellow-600">{stats.votacionesCount}</div>
                                            <div className="text-sm text-yellow-500">Animes calificados</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};