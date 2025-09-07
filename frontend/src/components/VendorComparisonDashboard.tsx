'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Users, 
  Mail, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  BarChart2, 
  RefreshCw, 
  PlusCircle,
  FileText,
  Download,
  ArrowLeft
} from 'lucide-react';
import { EnterpriseCard, EnterpriseButton } from './EnterpriseComponents';
import ComparisonTable from './ComparisonTable';

interface Vendor {
  id: string;
  name: string;
  company: string;
  email: string;
}

interface RFQ {
  id: string;
  title: string;
  description: string;
  deadline: string;
  budget?: number;
  created_by_user_id?: string;
  created_at: string;
  updated_at: string;
}

interface RFQDashboardItem {
  rfq_id: string;
  title: string;
  deadline: string;
  total_vendors: number;
  submitted_vendors: number;
  status: string;
  progress: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface VendorComparisonDashboardProps {
  onBack: () => void;
}

const VendorComparisonDashboard: React.FC<VendorComparisonDashboardProps> = ({ onBack }) => {
  const [rfqDashboard, setRfqDashboard] = useState<RFQDashboardItem[]>([]);
  const [selectedRfq, setSelectedRfq] = useState<RFQDashboardItem | null>(null);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchRfqDashboard();
  }, []);

  const fetchRfqDashboard = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendor/rfq/dashboard`);
      if (!response.ok) throw new Error('Failed to fetch RFQ dashboard data');
      const data = await response.json();
      setRfqDashboard(data);
    } catch (error: any) {
      setMessage(`Error fetching RFQ dashboard: ${error.message}`);
      console.error('Error fetching RFQ dashboard:', error);
    }
  };

  const handleSelectRfq = async (rfq: RFQDashboardItem) => {
    if (rfq.submitted_vendors === 0) {
      setMessage('No submitted quotes available for comparison');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // Fetch participations for this RFQ
      const response = await fetch(`${API_BASE_URL}/api/vendor/rfq/${rfq.rfq_id}/participations`);
      if (!response.ok) throw new Error('Failed to fetch RFQ participations');
      
      const participations = await response.json();
      const submittedParticipations = participations.filter((p: any) => p.status === 'submitted');
      
      if (submittedParticipations.length === 0) {
        setMessage('No submitted quotes found for comparison');
        return;
      }

      // Convert to comparison format
      const quotes = submittedParticipations.map((participation: any) => {
        const items = participation.submission_data?.items || [];
        const totalCost = items.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
        
        return {
          vendorName: participation.vendor.name,
          items: items,
          terms: participation.submission_data?.terms || {},
          totalCost: totalCost,
          complianceScore: 85, // Default - would be calculated
          riskScore: 15, // Default - would be calculated
          anomalies: [] // Would be populated by analysis
        };
      });

      setComparisonData(quotes);
      setSelectedRfq(rfq);
    } catch (error: any) {
      setMessage(`Error loading comparison data: ${error.message}`);
      console.error('Error loading comparison data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = async () => {
    if (!selectedRfq) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/vendor/rfq/${selectedRfq.rfq_id}/export-report`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rfq_${selectedRfq.rfq_id}_comparison_report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage('Report exported successfully!');
    } catch (error: any) {
      setMessage(`Error exporting report: ${error.message}`);
    }
  };

  if (selectedRfq && comparisonData.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <EnterpriseButton variant="ghost" onClick={() => setSelectedRfq(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to RFQs
            </EnterpriseButton>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-300 to-gray-100 bg-clip-text text-transparent">
              {selectedRfq.title} - Comparison
            </h1>
          </div>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 mb-6 rounded-lg text-center ${
                message.startsWith('Error') ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'
              }`}
            >
              {message}
            </motion.div>
          )}

          <ComparisonTable quotes={comparisonData} onExport={handleExportReport} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <EnterpriseButton variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </EnterpriseButton>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-300 to-gray-100 bg-clip-text text-transparent">
            Vendor Comparison
          </h1>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 mb-6 rounded-lg text-center ${
              message.startsWith('Error') ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'
            }`}
          >
            {message}
          </motion.div>
        )}

        <EnterpriseCard>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="h-5 w-5 text-gray-300" />
            <h2 className="text-2xl font-semibold text-white">Select RFQ for Comparison</h2>
            <EnterpriseButton variant="ghost" onClick={fetchRfqDashboard} className="ml-auto px-3 py-1 text-sm">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </EnterpriseButton>
          </div>
          
          {rfqDashboard.length === 0 ? (
            <p className="text-gray-400">No RFQs available for comparison.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rfqDashboard.map(rfq => (
                <motion.div
                  key={rfq.rfq_id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-5 space-y-3"
                >
                  <h3 className="text-xl font-semibold text-white">{rfq.title}</h3>
                  <p className="text-sm text-gray-400">Deadline: {new Date(rfq.deadline).toLocaleDateString()}</p>
                  <div className="flex justify-between items-center text-sm text-gray-300">
                    <span>Vendors Invited: {rfq.total_vendors}</span>
                    <span>Submitted: {rfq.submitted_vendors}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-blue-500 h-2.5 rounded-full"
                      style={{ width: `${rfq.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400">{rfq.progress.toFixed(0)}% Submitted</p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      rfq.status === 'Open' ? 'bg-blue-900/50 text-blue-300' : 'bg-green-900/50 text-green-300'
                    }`}>
                      {rfq.status}
                    </span>
                    
                    {rfq.submitted_vendors > 0 ? (
                      <EnterpriseButton 
                        onClick={() => handleSelectRfq(rfq)}
                        disabled={isLoading}
                        className="px-3 py-1 text-xs"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Compare
                      </EnterpriseButton>
                    ) : (
                      <span className="text-xs text-gray-500">No submissions</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </EnterpriseCard>
      </div>
    </div>
  );
};

export default VendorComparisonDashboard;
