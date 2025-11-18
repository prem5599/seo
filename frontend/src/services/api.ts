import axios, { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(email: string, password: string) {
    const response = await this.api.post('/auth/register', { email, password });
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async logout() {
    const response = await this.api.post('/auth/logout');
    localStorage.removeItem('token');
    return response.data;
  }

  // Audit endpoints
  async createAudit(url: string, domain: string) {
    const response = await this.api.post('/audits', { url, domain });
    return response.data;
  }

  async getAudits() {
    const response = await this.api.get('/audits');
    return response.data;
  }

  async getAuditById(auditId: string) {
    const response = await this.api.get(`/audits/${auditId}`);
    return response.data;
  }

  async getAuditIssues(auditId: string) {
    const response = await this.api.get(`/audits/${auditId}/issues`);
    return response.data;
  }

  async deleteAudit(auditId: string) {
    const response = await this.api.delete(`/audits/${auditId}`);
    return response.data;
  }

  // Account endpoints
  async getProfile() {
    const response = await this.api.get('/account/profile');
    return response.data;
  }

  async updateProfile(email: string) {
    const response = await this.api.put('/account/profile', { email });
    return response.data;
  }

  async getSubscription() {
    const response = await this.api.get('/account/subscription');
    return response.data;
  }
}

export default new ApiService();
