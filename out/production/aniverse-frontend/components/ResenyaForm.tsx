// src/components/ResenyaForm.tsx - Siguiendo el patrón de Aniverse
import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaStar } from 'react-icons/fa';
import { ResenyaCrear, ResenyaActualizar } from '../services/resenyaService';
import { StarRating } from './StarRating';
import {Resenya} from "../types";

interface ResenyaFormProps {
    onSubmit: (data: ResenyaCrear | ResenyaActualizar) => Promise<void>;
    onCancel: () => void;
    initialData?: Resenya;
    animeId?: number;
    jikanId?: number;
    animeTitulo?: string;
    isEditing?: boolean;
    className?: string;
}

export const ResenyaForm: React.FC<ResenyaFormProps> = ({
                                                            onSubmit,
                                                            onCancel,
                                                            initialData,
                                                            animeId,
                                                            jikanId,
                                                            animeTitulo,
                                                            isEditing = false,
                                                            className = ''
                                                        }) => {
    const [contenido, setContenido] = useState(initialData?.contenido || '');
    const [puntuacion, setPuntuacion] = useState(initialData?.puntuacion || 5);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Limpiar errores cuando el usuario empiece a escribir
    useEffect(() => {
        if (errors.contenido && contenido.trim().length >= 10) {
            setErrors(prev => ({ ...prev, contenido: '' }));
        }
    }, [contenido, errors.contenido]);

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        // Validar contenido
        if (!contenido.trim()) {
            newErrors.contenido = 'El contenido de la reseña es obligatorio';
        } else if (contenido.trim().length < 10) {
            newErrors.contenido = 'La reseña debe tener al menos 10 caracteres';
        } else if (contenido.trim().length > 1000) {
            newErrors.contenido = 'La reseña no puede superar los 1000 caracteres';
        }

        // Validar puntuación
        if (puntuacion < 1 || puntuacion > 10) {
            newErrors.puntuacion = 'La puntuación debe estar entre 1 y 10';
        }

        // Si no es edición, validar que tengamos animeId o jikanId
        if (!isEditing && !animeId && !jikanId) {
            newErrors.anime = 'Información del anime requerida';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            const data = isEditing
                ? {
                    contenido: contenido.trim(),
                    puntuacion
                } as ResenyaActualizar
                : {
                    animeId,
                    jikanId,
                    contenido: contenido.trim(),
                    puntuacion
                } as ResenyaCrear;

            await onSubmit(data);
        } catch (error) {
            console.error('Error al enviar reseña:', error);
            // El error debería ser manejado por el componente padre
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (!isSubmitting) {
            onCancel();
        }
    };

    const getPuntuacionDescription = (rating: number): string => {
        if (rating >= 9) return 'Obra maestra';
        if (rating >= 8) return 'Excelente';
        if (rating >= 7) return 'Muy bueno';
        if (rating >= 6) return 'Bueno';
        if (rating >= 5) return 'Regular';
        if (rating >= 4) return 'Por debajo del promedio';
        if (rating >= 3) return 'Malo';
        if (rating >= 2) return 'Muy malo';
        return 'Horrible';
    };

    return (
        <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-aniverse-purple to-aniverse-pink">
                <h3 className="text-xl font-bold text-white">
                    {isEditing ? 'Editar Reseña' : 'Escribir Reseña'}
                </h3>
                {animeTitulo && !isEditing && (
                    <p className="text-white/90 text-sm mt-1">
                        para <span className="font-medium">{animeTitulo}</span>
                    </p>
                )}
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Error general */}
                {errors.anime && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                        {errors.anime}
                    </div>
                )}

                {/* Sección de puntuación */}
                <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">
                        Puntuación *
                    </label>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <StarRating
                                rating={puntuacion}
                                onRatingChange={setPuntuacion}
                                size="lg"
                                showNumber={false}
                            />
                            <div className="text-right">
                                <div className="text-2xl font-bold text-aniverse-pink">
                                    {puntuacion.toFixed(1)}/10
                                </div>
                                <div className="text-sm text-gray-600">
                                    {getPuntuacionDescription(puntuacion)}
                                </div>
                            </div>
                        </div>

                        {/* Slider para ajuste fino */}
                        <div className="space-y-2">
                            <input
                                type="range"
                                min="1"
                                max="10"
                                step="0.5"
                                value={puntuacion}
                                onChange={(e) => setPuntuacion(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>1 - Horrible</span>
                                <span>5 - Regular</span>
                                <span>10 - Obra maestra</span>
                            </div>
                        </div>
                    </div>

                    {errors.puntuacion && (
                        <p className="text-sm text-red-600">{errors.puntuacion}</p>
                    )}
                </div>

                {/* Sección de contenido */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-semibold text-gray-700">
                            Tu reseña *
                        </label>
                        <span className={`text-xs ${
                            contenido.length > 1000
                                ? 'text-red-500'
                                : contenido.length > 800
                                    ? 'text-yellow-500'
                                    : 'text-gray-500'
                        }`}>
                            {contenido.length}/1000 caracteres
                        </span>
                    </div>

                    <textarea
                        value={contenido}
                        onChange={(e) => setContenido(e.target.value)}
                        placeholder="Comparte tu opinión sobre este anime... ¿Qué te gustó? ¿Qué no te convenció? ¿Lo recomendarías?"
                        rows={6}
                        className={`w-full px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:border-transparent transition-colors ${
                            errors.contenido
                                ? 'border-red-300 focus:ring-red-500'
                                : 'border-gray-300 focus:ring-aniverse-purple'
                        }`}
                        maxLength={1000}
                        disabled={isSubmitting}
                    />

                    {errors.contenido && (
                        <p className="text-sm text-red-600">{errors.contenido}</p>
                    )}

                    <p className="text-sm text-gray-500">
                        <strong>Consejos:</strong> Sé específico sobre lo que te gustó o no.
                        Evita spoilers y mantén un tono respetuoso.
                    </p>
                </div>

                {/* Botones */}
                <div className="flex space-x-4 pt-4 border-t border-gray-200">
                    <button
                        type="submit"
                        disabled={isSubmitting || !contenido.trim() || contenido.length < 10}
                        className="flex-1 flex items-center justify-center space-x-2 bg-aniverse-purple text-white py-3 px-6 rounded-lg font-medium hover:bg-aniverse-purple-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <FaSave />
                        <span>
                            {isSubmitting
                                ? 'Enviando...'
                                : isEditing
                                    ? 'Actualizar Reseña'
                                    : 'Publicar Reseña'
                            }
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center space-x-2 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-400 disabled:opacity-50 transition-colors"
                    >
                        <FaTimes />
                        <span>Cancelar</span>
                    </button>
                </div>
            </form>

            {/* Estilo personalizado para el slider */}
            <style jsx>{`
                .slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #7C3AED;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                }
                
                .slider::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #7C3AED;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                }
            `}</style>
        </div>
    );
};