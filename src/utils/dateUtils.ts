// src/utils/dateUtils.ts

/**
 * Convierte una fecha del backend a un formato legible
 * Maneja diferentes formatos de fecha que puede enviar Spring Boot
 */
export const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Fecha no disponible';

    try {
        // Intentar parsear la fecha
        let date: Date;

        // Si la fecha viene como array de números [year, month, day, hour, minute, second]
        if (Array.isArray(dateString)) {
            const [year, month, day, hour = 0, minute = 0, second = 0] = dateString;
            date = new Date(year, month - 1, day, hour, minute, second); // month - 1 porque Date usa 0-indexado
        }
        // Si la fecha viene como string ISO
        else if (typeof dateString === 'string') {
            // Reemplazar espacios por T si es necesario para ISO format
            const isoString = dateString.includes('T') ? dateString : dateString.replace(' ', 'T');
            date = new Date(isoString);
        }
        // Si ya es un objeto Date
        else {
            date = new Date(dateString);
        }

        // Verificar si la fecha es válida
        if (isNaN(date.getTime())) {
            console.warn('Fecha inválida recibida:', dateString);
            return 'Fecha inválida';
        }

        // Formatear la fecha de manera amigable
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

    } catch (error) {
        console.error('Error parsing date:', dateString, error);
        return 'Fecha inválida';
    }
};

/**
 * Convierte una fecha a formato corto (DD/MM/YYYY)
 */
export const formatDateShort = (dateString: string | null | undefined): string => {
    if (!dateString) return '--';

    try {
        let date: Date;

        if (Array.isArray(dateString)) {
            const [year, month, day] = dateString;
            date = new Date(year, month - 1, day);
        } else {
            const isoString = typeof dateString === 'string' && dateString.includes('T')
                ? dateString
                : dateString.replace(' ', 'T');
            date = new Date(isoString);
        }

        if (isNaN(date.getTime())) {
            return '--';
        }

        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

    } catch (error) {
        console.error('Error parsing date:', dateString, error);
        return '--';
    }
};

/**
 * Convierte una fecha a formato relativo (hace X días)
 */
export const formatDateRelative = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Fecha desconocida';

    try {
        let date: Date;

        if (Array.isArray(dateString)) {
            const [year, month, day, hour = 0, minute = 0, second = 0] = dateString;
            date = new Date(year, month - 1, day, hour, minute, second);
        } else {
            const isoString = typeof dateString === 'string' && dateString.includes('T')
                ? dateString
                : dateString.replace(' ', 'T');
            date = new Date(isoString);
        }

        if (isNaN(date.getTime())) {
            return 'Fecha inválida';
        }

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        if (diffDays > 0) {
            return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
        } else if (diffHours > 0) {
            return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        } else if (diffMinutes > 0) {
            return `Hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
        } else {
            return 'Hace un momento';
        }

    } catch (error) {
        console.error('Error parsing date:', dateString, error);
        return 'Fecha inválida';
    }
};