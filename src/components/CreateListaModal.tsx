// src/components/CreateListaModal.tsx
import React, { useState } from 'react';
import { FaTimes, FaPlus, FaGlobe, FaLock, FaList } from 'react-icons/fa';
import { listaService, ListaCreateDTO } from '../services/listaService';
import { useAuth } from '../context/AuthContext';

interface CreateListaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateListaModal: React.FC<CreateListaModalProps> = ({
                                                                      isOpen,
                                                                      onClose,
                                                                      onSuccess
                                                                  }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState<ListaCreateDTO>({
        nombre: '',
        descripcion: '',
        publica: false
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reiniciar formulario cuando se abre/cierra el modal
    React.useEffect(() => {
        if (isOpen) {
            setFormData({
                nombre: '',
                descripcion: '',
                publica: false
            });
            setErrors({});
        }
    }, [isOpen]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es obligatorio';
        } else if (formData.nombre.length > 100) {
            newErrors.nombre = 'El nombre no puede superar los 100 caracteres';
        }

        if (formData.descripcion && formData.descripcion.length > 500) {
            newErrors.descripcion = 'La descripción no puede superar los 500 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            console.error('Usuario no autenticado');
            return;
        }

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            await listaService.createLista(user.id, formData);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating lista:', error);
            if (error instanceof Error) {
                setErrors({ general: error.message });
            } else {
                setErrors({ general: 'Error al crear la lista. Inténtalo de nuevo.' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof ListaCreateDTO, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Limpiar error del campo cuando el usuario empiece a escribir
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 id="modal-title" className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FaList className="text-aniverse-purple" />
                        Crear Nueva Lista
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
                        aria-label="Cerrar modal"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Error general */}
                    {errors.general && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                            {errors.general}
                        </div>
                    )}

                    {/* Nombre */}
                    <div className="mb-4">
                        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre de la lista *
                        </label>
                        <input
                            type="text"
                            id="nombre"
                            value={formData.nombre}
                            onChange={(e) => handleInputChange('nombre', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-aniverse-purple focus:border-transparent ${
                                errors.nombre
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-300 focus:border-aniverse-purple'
                            }`}
                            placeholder="Ej: Mis animes favoritos, Por ver, Clásicos..."
                            maxLength={100}
                            required
                            autoFocus
                        />
                        {errors.nombre && (
                            <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            {formData.nombre.length}/100 caracteres
                        </p>
                    </div>

                    {/* Descripción */}
                    <div className="mb-4">
                        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                            Descripción (opcional)
                        </label>
                        <textarea
                            id="descripcion"
                            value={formData.descripcion}
                            onChange={(e) => handleInputChange('descripcion', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-aniverse-purple focus:border-transparent resize-none ${
                                errors.descripcion
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-300 focus:border-aniverse-purple'
                            }`}
                            placeholder="Describe de qué trata tu lista..."
                            rows={3}
                            maxLength={500}
                        />
                        {errors.descripcion && (
                            <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            {(formData.descripcion || '').length}/500 caracteres
                        </p>
                    </div>

                    {/* Visibilidad */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Visibilidad
                        </label>

                        <div className="space-y-3">
                            {/* Opción Privada */}
                            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="radio"
                                    name="visibilidad"
                                    checked={!formData.publica}
                                    onChange={() => handleInputChange('publica', false)}
                                    className="sr-only"
                                />
                                <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                                    !formData.publica
                                        ? 'border-aniverse-purple bg-aniverse-purple'
                                        : 'border-gray-300'
                                }`}>
                                    {!formData.publica && (
                                        <div className="w-2 h-2 rounded-full bg-white"></div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FaLock className="text-gray-500 text-sm" />
                                        <span className="font-medium text-gray-800">Privada</span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Solo tú puedes ver esta lista
                                    </p>
                                </div>
                            </label>

                            {/* Opción Pública */}
                            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="radio"
                                    name="visibilidad"
                                    checked={formData.publica}
                                    onChange={() => handleInputChange('publica', true)}
                                    className="sr-only"
                                />
                                <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                                    formData.publica
                                        ? 'border-aniverse-purple bg-aniverse-purple'
                                        : 'border-gray-300'
                                }`}>
                                    {formData.publica && (
                                        <div className="w-2 h-2 rounded-full bg-white"></div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FaGlobe className="text-green-500 text-sm" />
                                        <span className="font-medium text-gray-800">Pública</span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Otros usuarios pueden ver y descubrir tu lista
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.nombre.trim()}
                            className="flex-1 px-4 py-2 bg-aniverse-purple text-white rounded-lg hover:bg-aniverse-purple-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    Creando...
                                </>
                            ) : (
                                <>
                                    <FaPlus className="w-4 h-4" />
                                    Crear Lista
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};