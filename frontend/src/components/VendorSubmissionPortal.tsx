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

interface OrganizationTemplate {
  template_id: string;
  organization_name: string;
  template_name: string;
  description: string;
  header_fields: Array<{
    field_name: string;
    field_type: string;
    required: boolean;
    description: string;
  }>;
  item_fields: Array<{
    field_name: string;
    field_type: string;
    required: boolean;
    description: string;
  }>;
  terms_fields: Array<{
    field_name: string;
    field_type: string;
    required: boolean;
    description: string;
  }>;
  required_documents: string[];
  compliance_requirements: string[];
}

interface TemplateMappingResult {
  vendor_name: string;
  template_compliance_score: number;
  mapped_fields: Record<string, any>;
  unmapped_fields: string[];
  confidence_scores: Record<string, number>;
  mapping_notes: string[];
  requires_manual_review: boolean;
}

interface VendorSubmissionPortalProps {
  uniqueLink: string;
}

export default function VendorSubmissionPortal({ uniqueLink }: VendorSubmissionPortalProps) {
  const [portalInfo, setPortalInfo] = useState<PortalInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionMethod, setSubmissionMethod] = useState<'form' | 'upload' | null>(null);
  
  // Template-related state
  const [organizationTemplate, setOrganizationTemplate] = useState<OrganizationTemplate | null>(null);
  const [templateMappingResult, setTemplateMappingResult] = useState<TemplateMappingResult | null>(null);
  const [showTemplateMapping, setShowTemplateMapping] = useState(false);
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
    loadOrganizationTemplate();
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

  const loadOrganizationTemplate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendor/template/organization`);
      if (response.ok) {
        const data = await response.json();
        setOrganizationTemplate(data.template);
      }
    } catch (error) {
      console.error('Error loading organization template:', error);
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

  const mapFileToTemplate = async () => {
    if (!uploadFile) {
      alert('Please select a file to upload');
      return;
    }

    try {
      // First, analyze the uploaded file using the existing AI processor
      const formData = new FormData();
      formData.append('file', uploadFile);

      const analysisResponse = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!analysisResponse.ok) {
        throw new Error('Failed to analyze uploaded file');
      }

      const analysisResult = await analysisResponse.json();
      
      // Get the first quote from analysis (assuming single vendor quote)
      const vendorQuote = analysisResult.quotes?.[0];
      if (!vendorQuote) {
        throw new Error('No quote data found in uploaded file');
      }

      // Map the analyzed quote to organization template
      const mappingResponse = await fetch(`${API_BASE_URL}/api/vendor/template/map-vendor-quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vendorQuote)
      });

      if (!mappingResponse.ok) {
        throw new Error('Failed to map quote to template');
      }

      const mappingResult = await mappingResponse.json();
      setTemplateMappingResult(mappingResult.mapping_result);
      setShowTemplateMapping(true);

    } catch (error) {
      console.error('Error mapping file to template:', error);
      alert('Failed to map file to organization template. Please try again.');
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

        {/* Organization Template Display */}
        {organizationTemplate && (
          <div className="mb-8">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                📋 Organization Quote Template
              </h3>
              <p className="text-gray-300 mb-4">
                Please structure your quote according to our standard template. 
                You can either fill the form below or upload your existing quote - 
                our AI will automatically map it to our template format.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Header Fields */}
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-400 mb-3">Header Information</h4>
                  <ul className="space-y-2 text-sm">
                    {organizationTemplate.header_fields.map((field, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-gray-400 mt-1">•</span>
                        <div>
                          <span className="text-white">{field.field_name}</span>
                          {field.required && <span className="text-red-400 ml-1">*</span>}
                          <p className="text-gray-400 text-xs">{field.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Item Fields */}
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <h4 className="font-semibold text-green-400 mb-3">Item Details</h4>
                  <ul className="space-y-2 text-sm">
                    {organizationTemplate.item_fields.map((field, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-gray-400 mt-1">•</span>
                        <div>
                          <span className="text-white">{field.field_name}</span>
                          {field.required && <span className="text-red-400 ml-1">*</span>}
                          <p className="text-gray-400 text-xs">{field.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Terms Fields */}
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-400 mb-3">Terms & Conditions</h4>
                  <ul className="space-y-2 text-sm">
                    {organizationTemplate.terms_fields.map((field, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-gray-400 mt-1">•</span>
                        <div>
                          <span className="text-white">{field.field_name}</span>
                          {field.required && <span className="text-red-400 ml-1">*</span>}
                          <p className="text-gray-400 text-xs">{field.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Required Documents */}
              {organizationTemplate.required_documents.length > 0 && (
                <div className="mt-4 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-400 mb-2">Required Documents</h4>
                  <ul className="space-y-1">
                    {organizationTemplate.required_documents.map((doc, index) => (
                      <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        {doc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

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

                      <div className="flex justify-between">
                        <button
                          onClick={mapFileToTemplate}
                          disabled={!uploadFile}
                          className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:from-orange-700 hover:to-orange-800 transition-all disabled:opacity-50"
                        >
                          <FileText className="w-5 h-5" />
                          Map to Organization Template
                        </button>
                        
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

                {/* Template Mapping Results */}
                {showTemplateMapping && templateMappingResult && (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-white">Template Mapping Results</h3>
                      <button
                        onClick={() => setShowTemplateMapping(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Compliance Score */}
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">Template Compliance</h4>
                        <div className="flex items-center gap-3">
                          <div className="text-3xl font-bold text-green-400">
                            {templateMappingResult.template_compliance_score.toFixed(0)}%
                          </div>
                          <div>
                            <p className="text-sm text-gray-300">
                              {templateMappingResult.template_compliance_score >= 80 ? 'Excellent' : 
                               templateMappingResult.template_compliance_score >= 60 ? 'Good' : 'Needs Review'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {templateMappingResult.requires_manual_review ? 'Manual review required' : 'Auto-approved'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Mapping Summary */}
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">Mapping Summary</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Mapped Fields:</span>
                            <span className="text-green-400">
                              {Object.keys(templateMappingResult.mapped_fields).length}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Unmapped Fields:</span>
                            <span className="text-orange-400">
                              {templateMappingResult.unmapped_fields.length}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Confidence:</span>
                            <span className="text-blue-400">
                              {Object.values(templateMappingResult.confidence_scores).length > 0 ? 
                                (Object.values(templateMappingResult.confidence_scores).reduce((a, b) => a + b, 0) / 
                                 Object.values(templateMappingResult.confidence_scores).length * 100).toFixed(0) + '%' : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mapped Fields Preview */}
                    {Object.keys(templateMappingResult.mapped_fields).length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold text-white mb-3">Mapped Data Preview</h4>
                        <div className="bg-gray-700/30 rounded-lg p-4 max-h-60 overflow-y-auto">
                          <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                            {JSON.stringify(templateMappingResult.mapped_fields, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Mapping Notes */}
                    {templateMappingResult.mapping_notes.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-white mb-2">Mapping Notes</h4>
                        <ul className="space-y-1">
                          {templateMappingResult.mapping_notes.map((note, index) => (
                            <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                              <span className="text-blue-400 mt-1">•</span>
                              {note}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Unmapped Fields */}
                    {templateMappingResult.unmapped_fields.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-orange-400 mb-2">Fields Requiring Manual Input</h4>
                        <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
                          <p className="text-sm text-gray-300 mb-2">
                            The following fields could not be automatically mapped from your file:
                          </p>
                          <ul className="space-y-1">
                            {templateMappingResult.unmapped_fields.map((field, index) => (
                              <li key={index} className="text-sm text-orange-300 flex items-start gap-2">
                                <span className="text-orange-400 mt-1">•</span>
                                {field}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
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
