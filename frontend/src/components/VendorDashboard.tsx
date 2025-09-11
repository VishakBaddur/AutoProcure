'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Users, 
  Mail, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  FileSpreadsheet,
  Send,
  Eye,
  Download,
  Plus,
  Calendar,
  DollarSign,
  ArrowLeft
} from 'lucide-react';

interface Vendor {
  vendor_id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  address?: string;
}

interface RFQ {
  rfq_id: string;
  title: string;
  description: string;
  deadline: string;
  total_budget?: string;
  currency: string;
  status: string;
  created_by: string;
  created_at: string;
}

interface Participation {
  participation_id: string;
  vendor_name: string;
  vendor_company: string;
  vendor_email: string;
  status: string;
  email_sent: boolean;
  email_sent_at?: string;
  submitted_at?: string;
  unique_link: string;
}

interface DashboardData {
  rfq_id: string;
  total_vendors: number;
  emails_sent: number;
  submissions_received: number;
  submitted_quotes: number;
  pending: number;
  participation_rate: number;
  participations: Participation[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface VendorDashboardProps {
  onBack?: () => void;
}

export default function VendorDashboard({ onBack }: VendorDashboardProps) {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateRfq, setShowCreateRfq] = useState(false);
  const [showUploadVendors, setShowUploadVendors] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Create RFQ form state
  const [rfqForm, setRfqForm] = useState({
    title: '',
    description: '',
    deadline: '',
    total_budget: '',
    currency: 'USD'
  });

  useEffect(() => {
    // Load RFQs on component mount
    loadRfqs();
  }, []);

  const loadRfqs = async () => {
    try {
      // For now, we'll create mock data since we don't have a list endpoint yet
      const mockRfqs: RFQ[] = [
        {
          rfq_id: 'rfq-1',
          title: 'Office Supplies Procurement',
          description: 'Procurement of office supplies including chairs, desks, and stationery',
          deadline: '2025-02-15T23:59:59Z',
          total_budget: '50000',
          currency: 'USD',
          status: 'active',
          created_by: 'admin@company.com',
          created_at: '2025-01-15T10:00:00Z'
        }
      ];
      setRfqs(mockRfqs);
    } catch (error) {
      console.error('Error loading RFQs:', error);
    }
  };

  const createRfq = async () => {
    if (!rfqForm.title || !rfqForm.description || !rfqForm.deadline) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', rfqForm.title);
      formData.append('description', rfqForm.description);
      formData.append('deadline', rfqForm.deadline);
      formData.append('total_budget', rfqForm.total_budget);
      formData.append('currency', rfqForm.currency);
      formData.append('created_by', 'admin@company.com');

      const response = await fetch(`${API_BASE_URL}/api/vendor/rfq/create`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const newRfq = await response.json();
        setRfqs([...rfqs, newRfq]);
        setShowCreateRfq(false);
        setRfqForm({ title: '', description: '', deadline: '', total_budget: '', currency: 'USD' });
        alert('RFQ created successfully!');
      } else {
        throw new Error('Failed to create RFQ');
      }
    } catch (error) {
      console.error('Error creating RFQ:', error);
      alert('Failed to create RFQ');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadVendorList = async () => {
    if (!uploadFile || !selectedRfq) {
      alert('Please select a file and an RFQ');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('rfq_id', selectedRfq.rfq_id);
      formData.append('file', uploadFile);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(`${API_BASE_URL}/api/vendor/upload-vendor-list`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (response.ok) {
        const result = await response.json();
        alert(`Vendor list uploaded successfully! Created: ${result.vendors_created}, Existing: ${result.vendors_existing}`);
        setShowUploadVendors(false);
        setUploadFile(null);
        if (selectedRfq) {
          loadDashboardData(selectedRfq.rfq_id);
        }
      } else {
        const err = await response.json().catch(() => ({} as any));
        const msg = err?.detail || `Failed to upload vendor list (HTTP ${response.status})`;
        throw new Error(msg);
      }
    } catch (error) {
      console.error('Error uploading vendor list:', error);
      const message = error instanceof Error ? error.message : 'Failed to upload vendor list';
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const sendRfqEmails = async (rfqId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendor/send-rfq-emails/${rfqId}`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Emails sent successfully! Sent: ${result.emails_sent}, Failed: ${result.emails_failed}`);
        loadDashboardData(rfqId);
      } else {
        throw new Error('Failed to send emails');
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      alert('Failed to send emails');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeRfqQuotes = async (rfqId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendor/rfq/${rfqId}/analyze-quotes`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Quote analysis completed! Found ${result.submitted_quotes || 'some'} submitted quotes. Check the comparison dashboard for detailed analysis.`);
        // TODO: Navigate to comparison dashboard with analysis results
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze quotes');
      }
    } catch (error) {
      console.error('Error analyzing quotes:', error);
      alert('Failed to analyze quotes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const exportRfqAnalysis = async (rfqId: string, format: 'pdf' | 'excel') => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendor/rfq/${rfqId}/export/${format}`, {
        method: 'POST'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rfq_${rfqId}_analysis.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert(`${format.toUpperCase()} export completed successfully!`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to export ${format.toUpperCase()}`);
      }
    } catch (error) {
      console.error(`Error exporting ${format}:`, error);
      alert(`Failed to export ${format.toUpperCase()}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async (rfqId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendor/rfq/${rfqId}/dashboard`);
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleRfqSelect = (rfq: RFQ) => {
    setSelectedRfq(rfq);
    loadDashboardData(rfq.rfq_id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'text-green-400 bg-green-900/20';
      case 'pending': return 'text-yellow-400 bg-yellow-900/20';
      case 'reviewed': return 'text-blue-400 bg-blue-900/20';
      case 'rejected': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'reviewed': return <Eye className="w-4 h-4" />;
      case 'rejected': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {onBack && (
              <motion.button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800/50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </motion.button>
            )}
            <h1 className="text-4xl font-bold text-white">Vendor Outreach Dashboard</h1>
          </div>
          <p className="text-gray-400">Manage RFQs and track vendor submissions</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <motion.button
            onClick={() => setShowCreateRfq(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5" />
            Create New RFQ
          </motion.button>

          {selectedRfq && (
            <motion.button
              onClick={() => setShowUploadVendors(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:from-green-700 hover:to-green-800 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Upload className="w-5 h-5" />
              Upload Vendor List
            </motion.button>
          )}

          {selectedRfq && dashboardData && dashboardData.total_vendors > 0 && (
            <motion.button
              onClick={() => sendRfqEmails(selectedRfq.rfq_id)}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send className="w-5 h-5" />
              Send RFQ Emails
            </motion.button>
          )}

          {selectedRfq && dashboardData && dashboardData.submitted_quotes > 0 && (
            <div className="flex gap-3">
              <motion.button
                onClick={() => analyzeRfqQuotes(selectedRfq.rfq_id)}
                disabled={isLoading}
                className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:from-orange-700 hover:to-orange-800 transition-all disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Eye className="w-5 h-5" />
                Analyze Quotes
              </motion.button>
              
              <motion.button
                onClick={() => exportRfqAnalysis(selectedRfq.rfq_id, 'pdf')}
                disabled={isLoading}
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FileText className="w-5 h-5" />
                Export PDF
              </motion.button>
              
              <motion.button
                onClick={() => exportRfqAnalysis(selectedRfq.rfq_id, 'excel')}
                disabled={isLoading}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FileSpreadsheet className="w-5 h-5" />
                Export Excel
              </motion.button>
            </div>
          )}
        </div>

        {/* RFQ Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* RFQ List */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Active RFQs</h3>
              <div className="space-y-3">
                {rfqs.map((rfq) => (
                  <motion.div
                    key={rfq.rfq_id}
                    onClick={() => handleRfqSelect(rfq)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedRfq?.rfq_id === rfq.rfq_id
                        ? 'bg-blue-900/30 border-blue-500'
                        : 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <h4 className="font-semibold text-white">{rfq.title}</h4>
                    <p className="text-sm text-gray-400 mt-1">{rfq.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        Deadline: {new Date(rfq.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    {rfq.total_budget && (
                      <div className="flex items-center gap-2 mt-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          Budget: {rfq.currency} {parseInt(rfq.total_budget).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Dashboard Data */}
          <div className="lg:col-span-2">
            {selectedRfq && dashboardData ? (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-8 h-8 text-blue-400" />
                      <div>
                        <p className="text-2xl font-bold text-white">{dashboardData.total_vendors}</p>
                        <p className="text-sm text-gray-400">Total Vendors</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Mail className="w-8 h-8 text-green-400" />
                      <div>
                        <p className="text-2xl font-bold text-white">{dashboardData.emails_sent}</p>
                        <p className="text-sm text-gray-400">Emails Sent</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-8 h-8 text-purple-400" />
                      <div>
                        <p className="text-2xl font-bold text-white">{dashboardData.submissions_received}</p>
                        <p className="text-sm text-gray-400">Submissions</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-8 h-8 text-yellow-400" />
                      <div>
                        <p className="text-2xl font-bold text-white">{dashboardData.pending}</p>
                        <p className="text-sm text-gray-400">Pending</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Participation Rate */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Participation Rate</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-gray-700 rounded-full h-4">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${dashboardData.participation_rate}%` }}
                      ></div>
                    </div>
                    <span className="text-2xl font-bold text-white">{dashboardData.participation_rate.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Vendor List */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Vendor Status</h3>
                  <div className="space-y-3">
                    {dashboardData.participations.map((participation) => (
                      <div key={participation.participation_id} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{participation.vendor_name}</h4>
                          <p className="text-sm text-gray-400">{participation.vendor_company}</p>
                          <p className="text-xs text-gray-500">{participation.vendor_email}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(participation.status)}`}>
                            {getStatusIcon(participation.status)}
                            <span className="text-sm font-medium capitalize">{participation.status}</span>
                          </div>
                          {participation.email_sent && (
                            <div className="text-xs text-gray-400">
                              Sent: {new Date(participation.email_sent_at!).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : selectedRfq ? (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Vendor Data</h3>
                <p className="text-gray-400 mb-4">Upload a vendor list to get started with this RFQ.</p>
                <button
                  onClick={() => setShowUploadVendors(true)}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  Upload Vendor List
                </button>
              </div>
            ) : (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Select an RFQ</h3>
                <p className="text-gray-400">Choose an RFQ from the list to view vendor data and manage submissions.</p>
              </div>
            )}
          </div>
        </div>

        {/* Create RFQ Modal */}
        {showCreateRfq && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-white mb-4">Create New RFQ</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                  <input
                    type="text"
                    value={rfqForm.title}
                    onChange={(e) => setRfqForm({...rfqForm, title: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="RFQ Title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                  <textarea
                    value={rfqForm.description}
                    onChange={(e) => setRfqForm({...rfqForm, description: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="RFQ Description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Deadline *</label>
                  <input
                    type="datetime-local"
                    value={rfqForm.deadline}
                    onChange={(e) => setRfqForm({...rfqForm, deadline: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Budget</label>
                    <input
                      type="number"
                      value={rfqForm.total_budget}
                      onChange={(e) => setRfqForm({...rfqForm, total_budget: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="50000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Currency</label>
                    <select
                      value={rfqForm.currency}
                      onChange={(e) => setRfqForm({...rfqForm, currency: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="CAD">CAD</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={createRfq}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create RFQ'}
                </button>
                <button
                  onClick={() => setShowCreateRfq(false)}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Vendor List Modal */}
        {showUploadVendors && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-white mb-4">Upload Vendor List</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Select File</label>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Supported formats: CSV, Excel (.xlsx, .xls)
                  </p>
                </div>
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-400 mb-2">Required Columns:</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• <strong>name</strong> - Vendor contact name</li>
                    <li>• <strong>company</strong> - Company name</li>
                    <li>• <strong>email</strong> - Email address</li>
                    <li>• <strong>phone</strong> - Phone number (optional)</li>
                    <li>• <strong>address</strong> - Address (optional)</li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={uploadVendorList}
                  disabled={isLoading || !uploadFile}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                >
                  {isLoading ? 'Uploading...' : 'Upload List'}
                </button>
                <button
                  onClick={() => setShowUploadVendors(false)}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
