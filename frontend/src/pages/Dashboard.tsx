import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Audit } from '../types';
import { Search, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAuditUrl, setNewAuditUrl] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    try {
      const response = await api.getAudits();
      setAudits(response.data.audits);
    } catch (error) {
      console.error('Failed to load audits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuditUrl) return;

    setCreating(true);
    try {
      const domain = new URL(newAuditUrl).hostname;
      await api.createAudit(newAuditUrl, domain);
      setNewAuditUrl('');
      loadAudits();
    } catch (error) {
      console.error('Failed to create audit:', error);
      alert('Failed to create audit. Please check the URL and try again.');
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'running': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SEO Audit Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Analyze your websites and get actionable SEO recommendations
          </p>
        </div>

        {/* New Audit Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Start New Audit</h2>
          <form onSubmit={handleCreateAudit} className="flex gap-4">
            <input
              type="url"
              value={newAuditUrl}
              onChange={(e) => setNewAuditUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              {creating ? 'Creating...' : 'Audit Site'}
            </button>
          </form>
        </div>

        {/* Stats Overview */}
        {audits.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Audits</p>
                  <p className="text-2xl font-bold text-gray-900">{audits.length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {audits.filter(a => a.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {audits.filter(a => a.status === 'running').length}
                  </p>
                </div>
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Failed</p>
                  <p className="text-2xl font-bold text-red-600">
                    {audits.filter(a => a.status === 'failed').length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>
        )}

        {/* Audits List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Recent Audits</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {audits.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg">No audits yet</p>
                <p className="mt-2">Start by entering a URL above</p>
              </div>
            ) : (
              audits.map((audit) => (
                <Link
                  key={audit.id}
                  to={`/audit/${audit.id}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{audit.domain}</h3>
                      <p className="text-sm text-gray-500 mt-1">{audit.url}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`text-sm font-medium ${getStatusColor(audit.status)}`}>
                          {audit.status.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(audit.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {audit.status === 'completed' && (
                      <div className="text-right">
                        <div className={`text-4xl font-bold ${getHealthScoreColor(audit.health_score)}`}>
                          {audit.health_score}
                        </div>
                        <div className="text-sm text-gray-500">Health Score</div>
                        <div className="mt-2 text-sm text-gray-600">
                          {audit.critical_issues_count} critical •{' '}
                          {audit.warnings_count} warnings
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
