import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import type { Audit, Issue } from '../types';
import { AlertCircle, CheckCircle, Info, ArrowLeft, Download } from 'lucide-react';

export default function AuditResults() {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'warning' | 'notice'>('all');

  useEffect(() => {
    if (id) {
      loadAuditData();
    }
  }, [id]);

  const loadAuditData = async () => {
    if (!id) return;

    try {
      const [auditResponse, issuesResponse] = await Promise.all([
        api.getAuditById(id),
        api.getAuditIssues(id),
      ]);

      setAudit(auditResponse.data.audit);
      setIssues(issuesResponse.data.issues);
    } catch (error) {
      console.error('Failed to load audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredIssues = activeTab === 'all'
    ? issues
    : issues.filter(issue => issue.severity === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading audit results...</div>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">Audit not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{audit.domain}</h1>
              <p className="text-gray-600 mt-2">{audit.url}</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Download className="w-5 h-5" />
              Export Report
            </button>
          </div>
        </div>

        {/* Status Card */}
        {audit.status !== 'completed' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-4" />
              <div>
                <h3 className="font-semibold text-blue-900">
                  Audit {audit.status === 'running' ? 'in Progress' : 'Pending'}
                </h3>
                <p className="text-blue-700">
                  Your audit is being processed. This page will update automatically.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Health Score Card */}
        {audit.status === 'completed' && (
          <>
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">Health Score</h2>
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                    <div
                      className={`h-4 rounded-full ${getHealthScoreColor(audit.health_score)}`}
                      style={{ width: `${audit.health_score}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-3xl font-bold text-red-600">
                        {audit.critical_issues_count}
                      </div>
                      <div className="text-sm text-gray-600">Critical</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-yellow-600">
                        {audit.warnings_count}
                      </div>
                      <div className="text-sm text-gray-600">Warnings</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-blue-600">
                        {audit.notices_count}
                      </div>
                      <div className="text-sm text-gray-600">Notices</div>
                    </div>
                  </div>
                </div>
                <div className="ml-12 text-center">
                  <div className={`text-6xl font-bold ${audit.health_score >= 80 ? 'text-green-600' : audit.health_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {audit.health_score}
                  </div>
                  <div className="text-gray-600 mt-2">out of 100</div>
                  <div className="mt-4 text-sm text-gray-500">
                    {audit.total_pages_crawled} pages analyzed
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-t-lg shadow-md">
              <div className="border-b border-gray-200">
                <div className="flex">
                  {['all', 'critical', 'warning', 'notice'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`px-6 py-4 font-medium capitalize ${
                        activeTab === tab
                          ? 'border-b-2 border-blue-600 text-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab} {tab !== 'all' && `(${issues.filter(i => i.severity === tab).length})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Issues List */}
              <div className="divide-y divide-gray-200">
                {filteredIssues.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                    <p className="text-lg">No {activeTab !== 'all' ? activeTab : ''} issues found!</p>
                  </div>
                ) : (
                  filteredIssues.map((issue) => (
                    <div key={issue.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="mt-1">{getSeverityIcon(issue.severity)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {issue.title}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityBadgeColor(issue.severity)}`}>
                              {issue.severity}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-3">{issue.description}</p>
                          <div className="bg-gray-50 rounded-lg p-4 mb-3">
                            <h4 className="font-medium text-gray-900 mb-2">Recommendation:</h4>
                            <p className="text-gray-700">{issue.recommendation}</p>
                          </div>
                          <div className="text-sm text-gray-500">
                            Affects {issue.affected_count} page{issue.affected_count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
