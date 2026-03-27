// src/pages/ListaDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    FaArrowLeft, FaEdit, FaTrash, FaPlus, FaGlobe, FaLock,
    FaUsers, FaCalendarAlt, FaEye, FaPlay, FaPause, FaCheck,
    FaClock, FaTimes, FaEllipsisV
} from 'react-icons/fa';
import { listaService, ListaDTO, ListaAnimeDTO, estadoUtils } from '../services/listaService';
import { useAuth } from '../context/AuthContext';
import { AddAnimeToListModal } from '../components/AddAnimeToListModal';
import { EditListaModal } from '../components/EditListaModal';
import { formatDate } from '../utils/dateUtils';

export const ListaDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [lista, setLista] = useState<ListaDTO | null>(null);
    const [animes, setAnimes] = useState<ListaAnimeDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const listaId = parseInt(id || '0');
    const isOwner = user && lista && user.id === lista.usuarioId;

    // ✅ CORREGIDO: useCallback definido antes de ser usado
    const loadListaData = useCallback(async () => {
        if (!listaId) return;

        setLoading(true);
        setError(null);

        try {
            console.log('🔄 Cargando datos de lista ID:', listaId);

            // Cargar datos secuencialmente
            const listaData = await listaService.getListaDetalles(listaId);

            if (!listaData) {
                setError('Lista no encontrada');
                return;
            }

            console.log('✅ Lista cargada:', listaData);

            const animesData = await listaService.getAnimesFromLista(listaId);
            console.log('✅ Animes cargados:', animesData);

            setLista(listaData);
            setAnimes(animesData);
        } catch (err) {
            console.error('❌ Error loading lista:', err);
            setError('Error al cargar la lista');
        } finally {
            setLoading(false);
        }
    }, [listaId]);

    useEffect(() => {
        loadListaData();
    }, [loadListaData]);

    const handleDeleteLista = async () => {
        if (!lista || !isOwner) return;

        const confirmDelete = window.confirm(
            `¿Estás seguro de que quieres eliminar la lista "${lista.nombre}"? Esta acción no se puede deshacer.`
        );

        if (!confirmDelete) return;

        try {
            await listaService.deleteLista(lista.id);
            navigate('/lists');
        } catch (error) {
            console.error('Error deleting lista:', error);
            alert('Error al eliminar la lista');
        }
    };

    const handleRemoveAnime = async (animeId: number, animeTitulo: string) => {
        if (!lista || !isOwner) return;

        const confirmRemove = window.confirm(
            `¿Quieres eliminar "${animeTitulo}" de la lista?`
        );

        if (!confirmRemove) return;

        try {
            await listaService.removeAnimeFromLista(lista.id, animeId);
            await loadListaData(); // Recargar datos
        } catch (error) {
            console.error('Error removing anime:', error);
            alert('Error al eliminar el anime de la lista');
        }
    };

    const handleUpdateAnimeEstado = async (animeId: number, nuevoEstado: string) => {
        if (!lista || !isOwner) return;

        try {
            await listaService.updateAnimeInLista(lista.id, animeId, {
                animeId: animeId,
                estado: nuevoEstado
            });
            await loadListaData(); // Recargar datos
        } catch (error) {
            console.error('Error updating anime estado:', error);
            alert('Error al actualizar el estado del anime');
        }
    };

    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'VISTO': return <FaCheck className="w-4 h-4" />;
            case 'VIENDO': return <FaPlay className="w-4 h-4" />;
            case 'PAUSADO': return <FaPause className="w-4 h-4" />;
            case 'PENDIENTE': return <FaClock className="w-4 h-4" />;
            case 'ABANDONADO': return <FaTimes className="w-4 h-4" />;
            default: return <FaEye className="w-4 h-4" />;
        }
    };

    const renderAnimeCard = (anime: ListaAnimeDTO) => (
        <div key={anime.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
            {/* Imagen del anime */}
            <div className="relative aspect-[3/4] bg-gray-200">
                {anime.animeImagenUrl ? (
                    <img
                        src={anime.animeImagenUrl}
                        alt={anime.animeTitulo}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-aniverse-purple to-aniverse-pink flex items-center justify-center">
                        <FaEye className="text-white text-4xl opacity-60" />
                    </div>
                )}

                {/* Estado badge */}
                <div className="absolute top-2 left-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${estadoUtils.getEstadoColor(anime.estado)}`}>
                        {getEstadoIcon(anime.estado)}
                        {anime.estado}
                    </span>
                </div>

                {/* Menu de acciones (solo para el dueño) */}
                {isOwner && (
                    <div className="absolute top-2 right-2">
                        <div className="relative group">
                            <button className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors">
                                <FaEllipsisV className="w-3 h-3 text-gray-600" />
                            </button>

                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                <div className="py-1">
                                    <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b">
                                        Cambiar estado:
                                    </div>
                                    {estadoUtils.getAllEstados().map(estado => (
                                        <button
                                            key={estado}
                                            onClick={() => handleUpdateAnimeEstado(anime.animeId, estado)}
                                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                                                anime.estado === estado ? 'bg-aniverse-purple/10 text-aniverse-purple' : 'text-gray-700'
                                            }`}
                                        >
                                            {getEstadoIcon(estado)}
                                            {estado}
                                        </button>
                                    ))}
                                    <div className="border-t">
                                        <button
                                            onClick={() => handleRemoveAnime(anime.animeId, anime.animeTitulo)}
                                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <FaTrash className="w-3 h-3" />
                                            Eliminar de la lista
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Información del anime */}
            <div className="p-3">
                <h3 className="font-semibold text-gray-800 line-clamp-2 mb-2">
                    {anime.animeTitulo}
                </h3>

                {anime.episodiosVistos !== undefined && anime.episodiosVistos > 0 && (
                    <div className="text-sm text-gray-600 mb-2">
                        📺 {anime.episodiosVistos} episodios vistos
                    </div>
                )}

                {anime.notas && (
                    <div className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Notas:</span>
                        <p className="text-xs mt-1 line-clamp-2">{anime.notas}</p>
                    </div>
                )}

                <Link
                    to={`/anime/${anime.animeId}`}
                    className="inline-flex items-center gap-2 text-aniverse-purple hover:text-aniverse-purple-dark text-sm font-medium"
                >
                    <FaEye className="w-3 h-3" />
                    Ver detalles
                </Link>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-16 flex justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-aniverse-purple mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando lista...</p>
                </div>
            </div>
        );
    }

    if (error || !lista) {
        return (
            <div className="container mx-auto px-4 py-16">
                <div className="text-center">
                    <div className="text-6xl mb-4">😕</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        {error || 'Lista no encontrada'}
                    </h1>
                    <Link
                        to="/lists"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-aniverse-purple text-white rounded-lg hover:bg-aniverse-purple-dark transition-colors"
                    >
                        <FaArrowLeft className="w-4 h-4" />
                        Volver a Mis Listas
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 pt-20 md:pt-24">
            {/* Header */}
            <div className="mb-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Link to="/lists" className="hover:text-aniverse-purple">
                        Mis Listas
                    </Link>
                    <span>/</span>
                    <span className="text-gray-800">{lista.nombre}</span>
                </div>

                {/* Información de la lista */}
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <h1 className="text-3xl font-bold text-aniverse-purple">
                                {lista.nombre}
                            </h1>
                            {lista.publica ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                                    <FaGlobe className="w-3 h-3" />
                                    Pública
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                                    <FaLock className="w-3 h-3" />
                                    Privada
                                </span>
                            )}
                        </div>

                        {lista.descripcion && (
                            <p className="text-gray-600 mb-4 max-w-3xl">
                                {lista.descripcion}
                            </p>
                        )}

                        <div className="flex items-center gap-6 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <FaUsers className="w-4 h-4" />
                                {lista.usuarioNombre}
                            </span>
                            <span className="flex items-center gap-1">
                                <FaCalendarAlt className="w-4 h-4" />
                                {formatDate(lista.createdAt)}
                            </span>
                            <span>
                                {animes.length} anime{animes.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>

                    {/* Acciones (solo para el dueño) */}
                    {isOwner && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-aniverse-purple text-white rounded-lg hover:bg-aniverse-purple-dark transition-colors"
                            >
                                <FaPlus className="w-4 h-4" />
                                Agregar Anime
                            </button>
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <FaEdit className="w-4 h-4" />
                                Editar
                            </button>
                            <button
                                onClick={handleDeleteLista}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                <FaTrash className="w-4 h-4" />
                                Eliminar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Contenido de la lista */}
            {animes.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-gray-400 mb-6">
                        <FaEye className="w-16 h-16 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">
                            La lista está vacía
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {isOwner
                                ? 'Agrega algunos animes a tu lista para empezar'
                                : 'Esta lista no tiene animes aún'
                            }
                        </p>
                        {isOwner && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-aniverse-purple text-white rounded-lg hover:bg-aniverse-purple-dark transition-colors"
                            >
                                <FaPlus className="w-4 h-4" />
                                Agregar Primer Anime
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {animes.map(renderAnimeCard)}
                </div>
            )}

            {/* Modales */}
            {showAddModal && (
                <AddAnimeToListModal
                    isOpen={showAddModal}
                    listaId={listaId}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        loadListaData().catch(console.error);
                    }}
                />
            )}

            {showEditModal && (
                <EditListaModal
                    isOpen={showEditModal}
                    lista={lista}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={() => {
                        setShowEditModal(false);
                        loadListaData().catch(console.error);
                    }}
                />
            )}
        </div>
    );
};