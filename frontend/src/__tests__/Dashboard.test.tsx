import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import api from '../services/api';

// Mock the API module
vi.mock('../services/api', () => ({
  default: {
    getAudits: vi.fn(),
    createAudit: vi.fn(),
    deleteAudit: vi.fn(),
  },
}));

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake-token');
  });

  it('renders dashboard header', () => {
    renderDashboard();

    expect(screen.getByText(/seo audit dashboard/i)).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    vi.mocked(api.getAudits).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderDashboard();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays audits when data is loaded', async () => {
    const mockAudits = [
      {
        id: '1',
        domain: 'example.com',
        url: 'https://example.com',
        status: 'completed',
        health_score: 85,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        domain: 'test.com',
        url: 'https://test.com',
        status: 'pending',
        health_score: 0,
        created_at: new Date().toISOString(),
      },
    ];

    vi.mocked(api.getAudits).mockResolvedValue(mockAudits);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('example.com')).toBeInTheDocument();
      expect(screen.getByText('test.com')).toBeInTheDocument();
    });
  });

  it('displays error message when fetching fails', async () => {
    vi.mocked(api.getAudits).mockRejectedValue(new Error('Failed to fetch'));

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('shows new audit button', () => {
    renderDashboard();

    expect(screen.getByText(/new audit/i)).toBeInTheDocument();
  });

  it('displays empty state when no audits exist', async () => {
    vi.mocked(api.getAudits).mockResolvedValue([]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/no audits yet/i)).toBeInTheDocument();
    });
  });
});
