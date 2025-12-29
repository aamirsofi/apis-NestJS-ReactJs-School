import axios, { AxiosInstance, AxiosError } from 'axios';

// Use relative URL when using Vite proxy, or full URL if VITE_API_URL is set
const API_URL = (import.meta.env?.VITE_API_URL as string) || '/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token and school subdomain
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add school subdomain header for localhost testing
        const subdomain = localStorage.getItem('school_subdomain');
        if (subdomain) {
          config.headers['X-School-Subdomain'] = subdomain;
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      },
    );
  }

  get instance(): AxiosInstance {
    return this.api;
  }
}

export default new ApiService();

