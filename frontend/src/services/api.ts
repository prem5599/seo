import axios, { type AxiosInstance } from 'axios';
import mockApi from './mockApi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

class ApiService {
  private api: AxiosInstance;
  private useMockApi: boolean = DEMO_MODE;

  constructor() {
    // Show demo mode banner if enabled
    if (this.useMockApi) {
      console.log(
        '%c🎭 DEMO MODE ACTIVE',
        'background: #4CAF50; color: white; padding: 5px 10px; border-radius: 3px; font-weight: bold;',
        '\nRunning with mock data - no backend required!'
      );
    }
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
    if (this.useMockApi) return mockApi.register(email, password);
    const response = await this.api.post('/auth/register', { email, password });
    return response.data;
  }

  async login(email: string, password: string) {
    if (this.useMockApi) return mockApi.login(email, password);
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async logout() {
    if (this.useMockApi) return mockApi.logout();
    const response = await this.api.post('/auth/logout');
    localStorage.removeItem('token');
    return response.data;
  }

  // Audit endpoints
  async createAudit(url: string, domain: string) {
    if (this.useMockApi) return mockApi.createAudit(url);
    const response = await this.api.post('/audits', { url, domain });
    return response.data;
  }

  async getAudits() {
    if (this.useMockApi) return mockApi.getAudits();
    const response = await this.api.get('/audits');
    return response.data;
  }

  async getAuditById(auditId: string) {
    if (this.useMockApi) return mockApi.getAudit(auditId);
    const response = await this.api.get(`/audits/${auditId}`);
    return response.data;
  }

  async getAuditIssues(auditId: string) {
    if (this.useMockApi) return mockApi.getAuditIssues(auditId);
    const response = await this.api.get(`/audits/${auditId}/issues`);
    return response.data;
  }

  async deleteAudit(auditId: string) {
    if (this.useMockApi) return mockApi.deleteAudit(auditId);
    const response = await this.api.delete(`/audits/${auditId}`);
    return response.data;
  }

  // Account endpoints
  async getProfile() {
    if (this.useMockApi) return mockApi.getProfile();
    const response = await this.api.get('/account/profile');
    return response.data;
  }

  async updateProfile(email: string) {
    if (this.useMockApi) return mockApi.updateProfile({ email });
    const response = await this.api.put('/account/profile', { email });
    return response.data;
  }

  async getSubscription() {
    if (this.useMockApi) return mockApi.getSubscription();
    const response = await this.api.get('/account/subscription');
    return response.data;
  }
}

export default new ApiService();
