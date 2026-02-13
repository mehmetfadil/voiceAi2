import axios from 'axios';

// Backend URL (Vite projelerinde VITE_ prefixi zorunludur)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 saniye zaman aşımı
});

// Request Interceptor (Gerekirse token eklemek için)
api.interceptors.request.use(
    (config) => {
        // Örn: const token = localStorage.getItem('token');
        // if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor (Hataları global yakalamak için)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Hatası:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export const VoiceService = {
    getStatus: () => api.get('/status'),
    sendPrompt: (data) => api.post('/chat', data),
    // Gelecekteki WebSocket bağlantıları için burası genişletilebilir
};

export default api;