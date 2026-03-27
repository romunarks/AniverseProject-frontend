// src/api.ts
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// Obtener URL base desde variables de entorno o usar un valor por defecto
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Crear instancia de axios con la URL base
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Definir tipos para cola de peticiones
interface QueueItem {
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
    config: AxiosRequestConfig;
}

// Estado para controlar renovación de token
let isRefreshing = false;
let failedQueue: QueueItem[] = [];

// Procesar peticiones en cola
const processQueue = (error: AxiosError | null, token: string | null = null) => {
    failedQueue.forEach(promise => {
        if (error) {
            promise.reject(error);
        } else if (token) {
            // Actualizar el token en la petición original
            if (promise.config.headers) {
                promise.config.headers['Authorization'] = `Bearer ${token}`;
            } else {
                promise.config.headers = { 'Authorization': `Bearer ${token}` };
            }
            // Resolver con la config actualizada
            promise.resolve(api(promise.config));
        }
    });

    // Limpiar la cola
    failedQueue = [];
};

// Interceptor para añadir el token a las peticiones
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            // Asegurarse de que headers existe
            config.headers = config.headers || {};
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interfaz para petición con retry
interface RequestWithRetry extends AxiosRequestConfig {
    _retry?: boolean;
}

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
    // Manejar respuestas exitosas
    (response: AxiosResponse) => response,

    // Manejar errores
    async (error: AxiosError) => {
        // Extraer el config original, respuesta y request
        const originalRequest = error.config as RequestWithRetry;

        // Si no hay config, rechazar directamente
        if (!originalRequest) {
            return Promise.reject(error);
        }

        // Obtener el código de estado del error
        const status = error.response?.status;

        // Manejar errores 401 (No autorizado) - Token expirado o inválido
        if (status === 401 && !originalRequest._retry) {
            // Marcar petición como reintentada
            originalRequest._retry = true;

            // Si ya estamos renovando, encolar esta petición
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject, config: originalRequest });
                });
            }

            // Iniciar renovación de token
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');

                // Si no hay refreshToken, limpiar todo y redirigir a login
                if (!refreshToken) {
                    // Limpiar almacenamiento
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('refreshToken');

                    // Redirigir a login
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                // Intentar renovar el token
                const response = await axios.post(`${BASE_URL}/refresh`, { refreshToken });

                if (response.data.success) {
                    const { token, refreshToken: newRefreshToken } = response.data.data;

                    // Actualizar tokens
                    localStorage.setItem('token', token);
                    localStorage.setItem('refreshToken', newRefreshToken);

                    // Actualizar headers para futuras solicitudes
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                    // Actualizar header en la solicitud original
                    originalRequest.headers = originalRequest.headers || {};
                    originalRequest.headers['Authorization'] = `Bearer ${token}`;

                    // Procesar cola de peticiones fallidas
                    processQueue(null, token);

                    // Reintentar solicitud original
                    return api(originalRequest);
                } else {
                    // Si la respuesta no fue exitosa, limpiar estado
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('refreshToken');

                    // Procesar cola con error
                    processQueue(error, null);

                    // Redirigir a login
                    window.location.href = '/login';
                    return Promise.reject(error);
                }
            } catch (refreshError) {
                // Error al renovar token
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('refreshToken');

                // Procesar cola con error
                processQueue(error, null);

                // Redirigir a login
                window.location.href = '/login';
                return Promise.reject(refreshError instanceof Error ? refreshError : new Error('Error al renovar token'));
            } finally {
                // Restablecer bandera de renovación
                isRefreshing = false;
            }
        }

        // Manejar errores 403 (Forbidden)
        if (status === 403) {
            console.error('Acceso denegado:', error.response?.data?.message || 'No tienes permiso para acceder a este recurso');
            // Aquí podrías redirigir a una página de "acceso denegado" o mostrar un mensaje
        }

        // Manejar errores 404 (Not Found)
        if (status === 404) {
            console.error('Recurso no encontrado:', error.response?.data?.message || 'El recurso solicitado no existe');
            // Aquí podrías manejar recursos no encontrados
        }

        // Manejar errores 500 (Server Error)
        if (status && status >= 500) {
            console.error('Error del servidor:', error.response?.data?.message || 'Error interno del servidor');
            // Aquí podrías mostrar un mensaje de error del servidor
        }

        // Manejar errores de red
        if (error.message === 'Network Error') {
            console.error('Error de red:', 'No se pudo conectar con el servidor. Verifica tu conexión a internet.');
            // Mostrar mensaje de error de conexión
        }

        // Rechazar la promesa para que el código que llamó pueda manejar el error
        return Promise.reject(error);
    }
);

export default api;