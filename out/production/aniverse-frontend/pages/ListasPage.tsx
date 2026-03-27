// src/pages/ListasPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaList, FaGlobe, FaLock, FaUsers, FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import { listaService, ListaDTO } from '../services/listaService';
import { useAuth } from '../context/AuthContext';
import { CreateListaModal } from '../components/CreateListaModal';

interface TabType {
    id: 'mis-listas' | 'publicas';
    label: string;
    icon: React.ReactNode;
}

export const ListasPage: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'mis-listas' | 'publicas'>('mis-listas');
    const [misListas, setMisListas] = useState<ListaDTO[]>([]);
    const [listasPublicas, setListasPublicas] = useState<ListaDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Configuración de tabs
    const tabs: TabType[] = [
        {
            id: 'mis-listas',
            label: 'Mis Listas',
            icon: <FaList className="w-4 h-4" />
        },
        {
            id: 'publicas',
            label: 'Listas Públicas',
            icon: <FaGlobe className="w-4 h-4" />
        }
    ];

    useEffect(() => {
        loadData();
    }, [activeTab, user]);

    const loadData = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            if (activeTab === 'mis-listas') {
                const response = await listaService.getListasByUsuario(user.id);
                setMisListas(response.content);
            } else {
                const response = await listaService.getPublicListas();
                setListasPublicas(response.content);
            }
        } catch (err) {
            console.error('Error loading listas:', err);
            setError('Error al cargar las listas');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLista = async (listaId: number) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta lista?')) {
            return;
        }

        try {
            await listaService.deleteLista(listaId);
            await loadData(); // Recargar listas
        } catch (error) {
            console.error('Error eliminando lista:', error);
            alert('Error al eliminar la lista');
        }
    };

    const renderListaCard = (lista: ListaDTO) => (
        <div key={lista.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
            {/* Header de la card */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">
                                {lista.nombre}
                            </h3>
                            <div className="flex items-center gap-1">
                                {lista.publica ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                        <FaGlobe className="w-3 h-3" />
                                        Pública
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                                        <FaLock className="w-3 h-3" />
                                        Privada
                                    </span>
                                )}
                            </div>
                        </div>

                        {lista.descripcion && (
                            <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                                {lista.descripcion}
                            </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                <FaUsers className="w-3 h-3" />
                                {lista.usuarioNombre}
                            </span>
                            <span className="flex items-center gap-1">
                                <FaList className="w-3 h-3" />
                                {lista.cantidadAnimes} anime{lista.cantidadAnimes !== 1 ? 's' : ''}
                            </span>
                            <span>
                                {new Date(lista.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    {/* Acciones (solo para listas propias) */}
                    {user && lista.usuarioId === user.id && (
                        <div className="flex items-center gap-2 ml-4">
                            <Link
                                to={`/listas/${lista.id}/editar`}
                                className="p-2 text-gray-500 hover:text-aniverse-purple hover:bg-gray-100 rounded-lg transition-colors"
                                title="Editar lista"
                            >
                                <FaEdit className="w-4 h-4" />
                            </Link>
                            <button
                                onClick={() => handleDeleteLista(lista.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar lista"
                            >
                                <FaTrash className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer con botón de acción */}
            <div className="p-4 bg-gray-50">
                <Link
                    to={`/listas/${lista.id}`}
                    className="inline-flex items-center gap-2 w-full justify-center px-4 py-2 bg-aniverse-purple text-white rounded-lg hover:bg-aniverse-purple-dark transition-colors"
                >
                    <FaEye className="w-4 h-4" />
                    Ver Lista
                </Link>
            </div>
        </div>
    );

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-aniverse-purple"></div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center py-12">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg inline-block">
                        <p>{error}</p>
                        <button
                            onClick={loadData}
                            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            );
        }

        const listas = activeTab === 'mis-listas' ? misListas : listasPublicas;

        if (listas.length === 0) {
            return (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                        <FaList className="w-16 h-16 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">
                            {activeTab === 'mis-listas' ? 'No tienes listas aún' : 'No hay listas públicas'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {activeTab === 'mis-listas'
                                ? 'Crea tu primera lista para organizar tus animes favoritos'
                                : 'Sé el primero en crear una lista pública'
                            }
                        </p>
                        {activeTab === 'mis-listas' && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-aniverse-purple text-white rounded-lg hover:bg-aniverse-purple-dark transition-colors"
                            >
                                <FaPlus className="w-4 h-4" />
                                Crear Primera Lista
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {listas.map(renderListaCard)}
            </div>
        );
    };

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-16">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        Inicia sesión para ver tus listas
                    </h1>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-aniverse-purple text-white rounded-lg hover:bg-aniverse-purple-dark transition-colors"
                    >
                        Iniciar Sesión
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 pt-20 md:pt-24">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-aniverse-purple mb-2">
                        Mis Listas de Anime
                    </h1>
                    <p className="text-gray-600">
                        Organiza y gestiona tus animes favoritos en listas personalizadas
                    </p>
                </div>

                {activeTab === 'mis-listas' && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-6 py-3 bg-aniverse-purple text-white rounded-lg hover:bg-aniverse-purple-dark transition-colors shadow-md"
                    >
                        <FaPlus className="w-4 h-4" />
                        Nueva Lista
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === tab.id
                                ? 'border-aniverse-purple text-aniverse-purple'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {renderContent()}

            {/* Modal para crear lista */}
            {showCreateModal && (
                <CreateListaModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        loadData();
                    }}
                />
            )}
        </div>
    );
};