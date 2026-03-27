// src/components/AddAnimeToListModal.tsx
import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaSearch, FaEye, FaCheck } from 'react-icons/fa';
import { listaService, ListaAnimeCreateDTO, estadoUtils } from '../services/listaService';
import { animeService } from '../services/animeService';
import { Anime } from '../types';

interface AddAnimeToListModalProps {
    isOpen: boolean;
    listaId: number;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddAnimeToListModal: React.FC<AddAnimeToListModalProps> = ({
                                                                            isOpen,
                                                                            listaId,
                                                                            onClose,
                                                                            onSuccess
                                                                        }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Anime[]>([]);
    const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
    const [formData, setFormData] = useState<Omit<ListaAnimeCreateDTO, 'animeId'>>({
        estado: 'PENDIENTE',
        notas: '',
        episodiosVistos: 0
    });
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'search' | 'details'>('search');

    // Resetear modal cuando se abre
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setSearchResults([]);
            setSelectedAnime(null);
            setFormData({
                estado: 'PENDIENTE',
                notas: '',
                episodiosVistos: 0
            });
            setError(null);
            setStep('search');
        }
    }, [isOpen]);

    // Buscar animes con debounce
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setSearching(true);
            try {
                const results = await animeService.searchAnimes(searchQuery);
                // ✅ Verificar que results es un array antes de usar slice
                if (Array.isArray(results)) {
                    setSearchResults(results.slice(0, 20)); // Limitar a 20 resultados
                } else {
                    setSearchResults([]);
                }
            } catch (error) {
                console.error('Error searching animes:', error);
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleSelectAnime = (anime: Anime) => {
        setSelectedAnime(anime);
        setStep('details');
    };

    const handleBackToSearch = () => {
        setStep('search');
        setSelectedAnime(null);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedAnime) return;

        setLoading(true);
        setError(null);

        try {
            const animeData: ListaAnimeCreateDTO = {
                animeId: selectedAnime.id!,
                ...formData
            };

            await listaService.addAnimeToLista(listaId, animeData);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error adding anime to lista:', error);
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Error al agregar el anime a la lista');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        {step === 'details' && (
                            <button
                                onClick={handleBackToSearch}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-2"
                            >
                                ←
                            </button>
                        )}
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <FaPlus className="text-aniverse-purple" />
                            {step === 'search' ? 'Buscar Anime' : 'Agregar a Lista'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {step === 'search' ? (
                        /* PASO 1: Búsqueda de anime */
                        <div className="p-6">
                            {/* Barra de búsqueda */}
                            <div className="relative mb-6">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaSearch className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aniverse-purple focus:border-transparent"
                                    placeholder="Buscar anime por título..."
                                    autoFocus
                                />
                            </div>

                            {/* Estado de búsqueda */}
                            {searching && (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-aniverse-purple"></div>
                                </div>
                            )}

                            {/* Resultados de búsqueda */}
                            {!searching && searchResults.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-gray-800 mb-4">
                                        Resultados ({searchResults.length})
                                    </h3>
                                    <div className="grid gap-3 max-h-96 overflow-y-auto">
                                        {searchResults.map((anime) => (
                                            <div
                                                key={anime.id || anime.jikanId}
                                                onClick={() => handleSelectAnime(anime)}
                                                className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:border-aniverse-purple hover:bg-gray-50 cursor-pointer transition-colors"
                                            >
                                                <div className="w-16 h-20 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                                    {anime.imagenUrl ? (
                                                        <img
                                                            src={anime.imagenUrl}
                                                            alt={anime.titulo}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-aniverse-purple to-aniverse-pink">
                                                            <FaEye className="text-white text-lg opacity-60" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-gray-800 truncate">
                                                        {anime.titulo}
                                                    </h4>
                                                    {anime.anyo && (
                                                        <p className="text-sm text-gray-500">
                                                            {anime.anyo}
                                                        </p>
                                                    )}
                                                    {anime.genero && (
                                                        <p className="text-xs text-gray-400 truncate">
                                                            {anime.genero}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-aniverse-purple">
                                                    <FaCheck className="w-5 h-5" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sin resultados */}
                            {!searching && searchQuery.trim() && searchResults.length === 0 && (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 mb-4">
                                        <FaSearch className="w-12 h-12 mx-auto mb-2" />
                                        <p>No se encontraron animes con "{searchQuery}"</p>
                                    </div>
                                </div>
                            )}

                            {/* Instrucciones iniciales */}
                            {!searchQuery.trim() && (
                                <div className="text-center py-8">
                                    <div className="text-gray-400">
                                        <FaSearch className="w-12 h-12 mx-auto mb-4" />
                                        <p className="text-lg font-medium">Busca un anime</p>
                                        <p className="text-sm">Escribe el título del anime que quieres agregar a tu lista</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* PASO 2: Detalles del anime */
                        <form onSubmit={handleSubmit} className="p-6">
                            {error && (
                                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Anime seleccionado */}
                            {selectedAnime && (
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-6">
                                    <div className="w-16 h-20 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                        {selectedAnime.imagenUrl ? (
                                            <img
                                                src={selectedAnime.imagenUrl}
                                                alt={selectedAnime.titulo}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-aniverse-purple to-aniverse-pink">
                                                <FaEye className="text-white text-lg opacity-60" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-800">
                                            {selectedAnime.titulo}
                                        </h3>
                                        {selectedAnime.anyo && (
                                            <p className="text-sm text-gray-500">{selectedAnime.anyo}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Estado */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Estado *
                                </label>
                                <select
                                    value={formData.estado}
                                    onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aniverse-purple focus:border-transparent"
                                    required
                                >
                                    {estadoUtils.getAllEstados().map(estado => (
                                        <option key={estado} value={estado}>
                                            {estadoUtils.getEstadoIcon(estado)} {estado}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Episodios vistos */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Episodios vistos
                                </label>
                                <input
                                    type="number"
                                    value={formData.episodiosVistos || ''}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        episodiosVistos: e.target.value ? parseInt(e.target.value) : 0
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aniverse-purple focus:border-transparent"
                                    min="0"
                                    placeholder="0"
                                />
                            </div>

                            {/* Notas */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notas personales (opcional)
                                </label>
                                <textarea
                                    value={formData.notas}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aniverse-purple focus:border-transparent resize-none"
                                    rows={3}
                                    placeholder="Agrega tus comentarios sobre este anime..."
                                />
                            </div>

                            {/* Botones */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleBackToSearch}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    disabled={loading}
                                >
                                    Cambiar Anime
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-aniverse-purple text-white rounded-lg hover:bg-aniverse-purple-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            Agregando...
                                        </>
                                    ) : (
                                        <>
                                            <FaPlus className="w-4 h-4" />
                                            Agregar a Lista
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};