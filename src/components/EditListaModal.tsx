// src/components/EditListaModal.tsx
import React, { useState, useEffect } from 'react';
import { FaTimes, FaEdit, FaGlobe, FaLock } from 'react-icons/fa';
import { listaService, ListaCreateDTO, ListaDTO } from '../services/listaService';

interface EditListaModalProps {
    isOpen: boolean;
    lista: ListaDTO;
    onClose: () => void;
    onSuccess: () => void;
}

export const EditListaModal: React.FC<EditListaModalProps> = ({
                                                                  isOpen,
                                                                  lista,
                                                                  onClose,
                                                                  onSuccess
                                                              }) => {
    const [formData, setFormData] = useState<ListaCreateDTO>({
        nombre: '',
        descripcion: '',
        publica: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Inicializar formulario con datos de la lista actual
    useEffect(() => {
        if (lista) {
            setFormData({
                nombre: lista.nombre,
                descripcion: lista.descripcion || '',
                publica: lista.publica
            });
        }
    }, [lista]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await listaService.updateLista(lista.id, formData);
            onSuccess();
        } catch (err) {
            console.error('Error updating lista:', err);
            setError('Error al actualizar la lista');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof ListaCreateDTO, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <FaEdit className="w-5 h-5 text-aniverse-purple" />
                        <h2 className="text-xl font-bold text-gray-800">
                            Editar Lista
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        <FaTimes className="w-4 h-4" />
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Nombre de la lista */}
                    <div className="mb-4">
                        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre de la lista *
                        </label>
                        <input
                            type="text"
                            id="nombre"
                            value={formData.nombre}
                            onChange={(e) => handleInputChange('nombre', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aniverse-purple focus:border-transparent"
                            placeholder="Ej: Mis animes favoritos"
                            required
                            disabled={loading}
                            maxLength={100}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                            {formData.nombre.length}/100 caracteres
                        </div>
                    </div>

                    {/* Descripción */}
                    <div className="mb-4">
                        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                            Descripción
                        </label>
                        <textarea
                            id="descripcion"
                            value={formData.descripcion}
                            onChange={(e) => handleInputChange('descripcion', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aniverse-purple focus:border-transparent resize-none"
                            placeholder="Describe tu lista (opcional)"
                            rows={3}
                            disabled={loading}
                            maxLength={500}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                            {(formData.descripcion || '').length}/500 caracteres
                        </div>
                    </div>

                    {/* Visibilidad */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Visibilidad de la lista
                        </label>
                        <div className="space-y-3">
                            {/* Opción Privada */}
                            <div
                                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                    !formData.publica
                                        ? 'border-aniverse-purple bg-aniverse-purple/5'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => !loading && handleInputChange('publica', false)}
                            >
                                <div className="flex items-center">
                                    <input
                                        type="radio"
                                        name="visibilidad"
                                        checked={!formData.publica}
                                        onChange={() => handleInputChange('publica', false)}
                                        className="sr-only"
                                        disabled={loading}
                                    />
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${!formData.publica ? 'bg-aniverse-purple text-white' : 'bg-gray-100 text-gray-600'}`}>
                                            <FaLock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-800">Lista Privada</div>
                                            <div className="text-sm text-gray-600">Solo tú puedes ver esta lista</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Opción Pública */}
                            <div
                                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                    formData.publica
                                        ? 'border-aniverse-purple bg-aniverse-purple/5'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => !loading && handleInputChange('publica', true)}
                            >
                                <div className="flex items-center">
                                    <input
                                        type="radio"
                                        name="visibilidad"
                                        checked={formData.publica}
                                        onChange={() => handleInputChange('publica', true)}
                                        className="sr-only"
                                        disabled={loading}
                                    />
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${formData.publica ? 'bg-aniverse-purple text-white' : 'bg-gray-100 text-gray-600'}`}>
                                            <FaGlobe className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-800">Lista Pública</div>
                                            <div className="text-sm text-gray-600">Otros usuarios pueden ver esta lista</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-aniverse-purple text-white rounded-lg hover:bg-aniverse-purple-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading || !formData.nombre.trim()}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                    Actualizando...
                                </div>
                            ) : (
                                'Guardar Cambios'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};