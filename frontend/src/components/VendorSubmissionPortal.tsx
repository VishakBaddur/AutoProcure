'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Building,
  User,
  DollarSign,
  Package,
  Clock,
  Send,
  ArrowLeft
} from 'lucide-react';

interface PortalInfo {
  participation_id: string;
  vendor_name: string;
  vendor_company: string;
  rfq_title: string;
  rfq_description: string;
  deadline: string;
  status: string;
  submitted_at?: string;
}

interface QuoteItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  additional_fees?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface VendorSubmissionPortalProps {
  uniqueLink: string;
}

export default function VendorSubmissionPortal({ uniqueLink }: VendorSubmissionPortalProps) {
  const [portalInfo, setPortalInfo] = useState<PortalInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionMethod, setSubmissionMethod] = useState<'form' | 'upload' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form submission state
  const [formData, setFormData] = useState({
    company_name: '',
    items: [] as QuoteItem[],
    additional_notes: ''
  });

  // File upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    loadPortalInfo();
  }, [uniqueLink]);

  const loadPortalInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendor/vendor-portal/${uniqueLink}`);
      
      if (response.ok) {
        const data = await response.json();
        setPortalInfo(data);
        
        // Pre-fill company name
        setFormData(prev => ({
          ...prev,
          company_name: data.vendor_company
        }));
        
        // Check if already submitted
        if (data.status === 'submitted') {
          setSubmitted(true);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Invalid submission link');
      }
    } catch (error) {
      console.error('Error loading portal info:', error);
      setError('Failed to load submission portal');
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        description: '',
        quantity: 1,
        unit: 'each',
        unit_price: 0,
        total: 0,
        additional_fees: 0
      }]
    }));
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          
          // Auto-calculate total
          if (field === 'quantity' || field === 'unit_price') {
            updatedItem.total = updatedItem.quantity * updatedItem.unit_price;
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!formData.company_name.trim()) {
      alert('Please enter your company name');
      return false;
    }

    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return false;
    }

    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.description.trim()) {
        alert(`Please enter description for item ${i + 1}`);
        return false;
      }
      if (item.quantity <= 0) {
        alert(`Please enter valid quantity for item ${i + 1}`);
        return false;
      }
      if (item.unit_price <= 0) {
        alert(`Please enter valid unit price for item ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const submitFormQuote = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const submissionData = {
        method: 'form',
        company_name: formData.company_name,
        items: formData.items,
        additional_notes: formData.additional_notes,
        submitted_at: new Date().toISOString()
      };

      const response = await fetch(`${API_BASE_URL}/api/vendor/vendor-portal/${uniqueLink}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });

      if (response.ok) {
        const result = await response.json();
        setSubmitted(true);
        alert('Quote submitted successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit quote');
      }
    } catch (error) {
      console.error('Error submitting quote:', error);
      alert('Failed to submit quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitFileQuote = async () => {
    if (!uploadFile) {
      alert('Please select a file to upload');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('method', 'file_upload');
      formData.append('company_name', portalInfo?.vendor_company || '');
      formData.append('submitted_at', new Date().toISOString());

      const response = await fetch(`${API_BASE_URL}/api/vendor/vendor-portal/${uniqueLink}/submit`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setSubmitted(true);
        alert('Quote submitted successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit quote');
      }
    } catch (error) {
      console.error('Error submitting quote:', error);
      alert('Failed to submit quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading submission portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="bg-gray-800 border border-red-500 rounded-lg p-8 max-w-md mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="bg-gray-800 border border-green-500 rounded-lg p-8 max-w-md mx-auto text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Quote Submitted Successfully!</h2>
          <p className="text-gray-400 mb-4">
            Thank you for your submission. We will review your quote and get back to you soon.
          </p>
          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-300">
              <strong>Reference ID:</strong> {portalInfo?.participation_id}
            </p>
            <p className="text-sm text-gray-300">
              <strong>Submitted:</strong> {new Date().toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!portalInfo) return null;

  const isDeadlinePassed = new Date(portalInfo.deadline) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => window.location.href = '/'}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold text-white">Vendor Submission Portal</h1>
          </div>
          
          {/* RFQ Info Card */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">{portalInfo.rfq_title}</h2>
                <p className="text-gray-300 mb-4">{portalInfo.rfq_description}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Building className="w-4 h-4" />
                  <span>{portalInfo.vendor_company}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <User className="w-4 h-4" />
                  <span>{portalInfo.vendor_name}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">
                  Deadline: {new Date(portalInfo.deadline).toLocaleDateString()} at {new Date(portalInfo.deadline).toLocaleTimeString()}
                </span>
              </div>
              {isDeadlinePassed && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span>Deadline has passed</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {isDeadlinePassed ? (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Submission Deadline Passed</h3>
            <p className="text-gray-400">
              The submission deadline for this RFQ has passed. Please contact the procurement team if you need assistance.
            </p>
          </div>
        ) : (
          <>
            {/* Submission Method Selection */}
            {!submissionMethod ? (
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <motion.div
                  onClick={() => setSubmissionMethod('form')}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 cursor-pointer hover:border-blue-500 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Form Entry</h3>
                    <p className="text-gray-400 mb-4">
                      Fill out our structured form with item details, quantities, and pricing
                    </p>
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-400 mb-2">Benefits:</h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• Auto-validation of calculations</li>
                        <li>• Structured data format</li>
                        <li>• Easy to fill out</li>
                        <li>• Instant error checking</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  onClick={() => setSubmissionMethod('upload')}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 cursor-pointer hover:border-green-500 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-center">
                    <Upload className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">File Upload</h3>
                    <p className="text-gray-400 mb-4">
                      Upload your existing quote in PDF or Excel format
                    </p>
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                      <h4 className="font-semibold text-green-400 mb-2">Benefits:</h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• Use your existing format</li>
                        <li>• No need to reformat</li>
                        <li>• AI extracts data automatically</li>
                        <li>• Supports PDF and Excel</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : (
              <>
                {/* Back Button */}
                <div className="mb-6">
                  <button
                    onClick={() => setSubmissionMethod(null)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Method Selection
                  </button>
                </div>

                {/* Form Submission */}
                {submissionMethod === 'form' && (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-6">Quote Form</h3>
                    
                    {/* Company Name */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Company Name *</label>
                      <input
                        type="text"
                        value={formData.company_name}
                        onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                        className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your Company Name"
                      />
                    </div>

                    {/* Items */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-white">Items</h4>
                        <button
                          onClick={addItem}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <Package className="w-4 h-4" />
                          Add Item
                        </button>
                      </div>

                      <div className="space-y-4">
                        {formData.items.map((item, index) => (
                          <div key={index} className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                              <div className="lg:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-1">Description *</label>
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                                  className="w-full bg-gray-600 border border-gray-500 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Item description"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Quantity *</label>
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                  className="w-full bg-gray-600 border border-gray-500 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  min="1"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Unit Price *</label>
                                <input
                                  type="number"
                                  value={item.unit_price}
                                  onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                  className="w-full bg-gray-600 border border-gray-500 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                              <div className="flex items-end gap-2">
                                <div className="flex-1">
                                  <label className="block text-sm font-medium text-gray-300 mb-1">Total</label>
                                  <div className="bg-gray-500 border border-gray-400 text-white px-3 py-2 rounded">
                                    ${item.total.toFixed(2)}
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeItem(index)}
                                  className="text-red-400 hover:text-red-300 p-2"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Additional Notes */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Additional Notes</label>
                      <textarea
                        value={formData.additional_notes}
                        onChange={(e) => setFormData({...formData, additional_notes: e.target.value})}
                        className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                        placeholder="Any additional information, terms, or conditions..."
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={submitFormQuote}
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Submit Quote
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* File Upload Submission */}
                {submissionMethod === 'upload' && (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-6">Upload Quote File</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Select File *</label>
                        <input
                          type="file"
                          accept=".pdf,.xlsx,.xls"
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-sm text-gray-400 mt-2">
                          Supported formats: PDF, Excel (.xlsx, .xls)
                        </p>
                      </div>

                      {uploadFile && (
                        <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 text-blue-400" />
                            <div>
                              <p className="font-medium text-white">{uploadFile.name}</p>
                              <p className="text-sm text-gray-400">
                                {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-400 mb-2">File Requirements:</h4>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• File should contain item descriptions, quantities, and prices</li>
                          <li>• PDF files will be processed using OCR if needed</li>
                          <li>• Excel files should have clear column headers</li>
                          <li>• Maximum file size: 10MB</li>
                        </ul>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={submitFileQuote}
                          disabled={isSubmitting || !uploadFile}
                          className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-5 h-5" />
                              Upload & Submit
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
