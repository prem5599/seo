import {
  mockUser,
  mockAudits,
  mockAuditDetails,
  mockIssues,
  mockProfile,
} from './mockData';

/**
 * Mock API Service for demo/development without backend
 * Simulates API delays and responses
 */
class MockApiService {
  private delay(ms: number = 500) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Auth endpoints
  async register(email: string, password: string) {
    await this.delay(800);
    const token = `mock_token_${Date.now()}`;
    localStorage.setItem('token', token);
    return {
      status: 'success',
      data: {
        token,
        user: { ...mockUser, email },
      },
    };
  }

  async login(email: string, password: string) {
    await this.delay(600);

    // Simulate login validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const token = `mock_token_${Date.now()}`;
    localStorage.setItem('token', token);
    return {
      status: 'success',
      data: {
        token,
        user: { ...mockUser, email },
      },
    };
  }

  async logout() {
    await this.delay(300);
    localStorage.removeItem('token');
    return {
      status: 'success',
      message: 'Logged out successfully',
    };
  }

  // Audit endpoints
  async getAudits() {
    await this.delay(400);
    return {
      status: 'success',
      data: mockAudits,
    };
  }

  async getAudit(id: string) {
    await this.delay(500);
    const audit = mockAudits.find(a => a.id === id) || mockAuditDetails;
    return {
      status: 'success',
      data: audit,
    };
  }

  async createAudit(url: string, maxPages?: number) {
    await this.delay(1000);
    const newAudit = {
      id: `mock_${Date.now()}`,
      domain: new URL(url).hostname,
      url,
      status: 'pending',
      health_score: 0,
      critical_issues: 0,
      warnings: 0,
      notices: 0,
      pages_crawled: 0,
      created_at: new Date().toISOString(),
      completed_at: null,
    };

    // Simulate audit starting
    setTimeout(() => {
      console.log('Mock audit would be running...');
    }, 2000);

    return {
      status: 'success',
      data: newAudit,
    };
  }

  async deleteAudit(id: string) {
    await this.delay(400);
    return {
      status: 'success',
      message: 'Audit deleted successfully',
    };
  }

  async getAuditIssues(id: string) {
    await this.delay(600);
    return {
      status: 'success',
      data: mockIssues,
    };
  }

  // Account endpoints
  async getProfile() {
    await this.delay(400);
    return {
      status: 'success',
      data: mockProfile,
    };
  }

  async updateProfile(data: any) {
    await this.delay(600);
    return {
      status: 'success',
      data: {
        ...mockProfile,
        ...data,
      },
    };
  }

  async getSubscription() {
    await this.delay(400);
    return {
      status: 'success',
      data: {
        plan: 'pro',
        status: 'active',
        current_period_end: '2025-12-31T23:59:59Z',
        audits_limit: 100,
        audits_used: 15,
      },
    };
  }
}

export default new MockApiService();
