"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Zap, 
  FileText, 
  Play,
  Calculator,
  Target,
  Upload,
  Download,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Search,
  Clock,
  Building,
  Trophy,
  Award
} from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// API functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://autoprocure-backend.onrender.com';

const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });
  return response.json();
};

const uploadMultipleFiles = async (files: File[]) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  const response = await fetch(`${API_BASE_URL}/analyze-multiple`, {
    method: 'POST',
    body: formData,
  });
  return response.json();
};

export default function LandingPage() {
  const [currentDemoStep, setCurrentDemoStep] = useState(0);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // File upload states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [totalSavings, setTotalSavings] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDemoStep((prev) => (prev + 1) % 4);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setSubmitMessage('Please enter a valid email address');
      setSubmitSuccess(false);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitMessage('Thank you! You\'ve been added to our waitlist.');
        setSubmitSuccess(true);
        setEmail('');
      } else {
        setSubmitMessage(data.message || 'Something went wrong. Please try again.');
        setSubmitSuccess(false);
      }
    } catch (error) {
      console.error('Waitlist submission error:', error);
      setSubmitMessage('Network error. Please try again.');
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    setIsUploading(true);
    setCurrentResult(null);
    setShowResults(false);

    try {
      let result: any;
      if (files.length === 1) {
        result = await uploadFile(files[0]);
        setCurrentResult(result);
      } else {
        result = await uploadMultipleFiles(files);
        setCurrentResult(result);
      }
      
      setShowResults(true);
      
      // Calculate total savings for multi-vendor analysis
      if (result.comparison && result.comparison.costSavings) {
        setTotalSavings(result.comparison.costSavings);
      } else if (result.quotes && result.quotes.length > 1) {
        // Calculate savings manually
        const totals = result.quotes.map((quote: any) => 
          quote.items.reduce((sum: number, item: any) => sum + item.total, 0)
        );
        const minTotal = Math.min(...totals);
        const maxTotal = Math.max(...totals);
        setTotalSavings(maxTotal - minTotal);
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      handleFileUpload(selectedFiles);
    }
  };

  const downloadResults = (format: 'json' | 'csv' | 'pdf') => {
    if (!currentResult) return;
    
    let content = '';
    let filename = 'autoprocure-analysis';
    
    if (format === 'json') {
      content = JSON.stringify(currentResult, null, 2);
      filename += '.json';
    } else if (format === 'csv') {
      // Create CSV content
      content = 'Vendor,Item,Quantity,Unit Price,Total\n';
      currentResult.quotes?.forEach((quote: any) => {
        quote.items?.forEach((item: any) => {
          content += `${quote.vendorName},${item.description},${item.quantity},${item.unitPrice},${item.total}\n`;
        });
      });
      filename += '.csv';
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const demoSteps = [
    {
      title: "Upload Vendor Quotes",
      description: "Drag & drop PDFs, Excel files, or scanned documents",
      icon: FileText,
      color: "from-gray-700 to-gray-900"
    },
    {
      title: "AI Extracts & Normalizes",
      description: "Instantly converts messy quotes into structured data",
      icon: Zap,
      color: "from-gray-800 to-black"
    },
    {
      title: "Smart Comparison",
      description: "Side-by-side analysis with cost savings highlighted",
      icon: Calculator,
      color: "from-black to-gray-800"
    },
    {
      title: "Actionable Insights",
      description: "Get recommendations and export reports instantly",
      icon: Target,
      color: "from-gray-900 to-gray-700"
    }
  ];

  const features = [
    {
      icon: "/images/feature-extract.jpeg",
      title: "Extract Messy Quotes",
      description: "Handles PDFs, Excel, scanned docs, and more",
      gradient: "from-gray-700 to-gray-900"
    },
    {
      icon: "/images/feature-compare.png",
      title: "Normalize & Compare",
      description: "Standardizes data across different vendor formats",
      gradient: "from-gray-800 to-black"
    },
    {
      icon: "/images/feature-leaks.png",
      title: "Spot Cost Leaks",
      description: "Identifies hidden charges and pricing anomalies",
      gradient: "from-black to-gray-800"
    },
    {
      icon: "/images/feature-save.png",
      title: "Save Time & Money",
      description: "Reduces analysis time from hours to minutes",
      gradient: "from-gray-900 to-gray-700"
    }
  ];

  const renderResults = () => {
    if (!currentResult) return null;

    return (
      <div className="space-y-6">
        {/* Main Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Total Vendors</p>
                <p className="text-2xl font-bold">{currentResult.comparison?.summary?.total_vendors || currentResult.comparison?.vendorCount || 1}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Total Cost</p>
                <p className="text-2xl font-bold text-green-600">
                  ${(currentResult.comparison?.summary?.total_cost || currentResult.comparison?.totalCost || 0).toLocaleString()}
                </p>
              </div>
              {totalSavings > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Potential Savings</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${totalSavings.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            
            {/* Winner Badge */}
            {currentResult.comparison?.summary?.winner && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900">🏆 Recommended Winner</h3>
                    <p className="text-green-800">{currentResult.comparison.summary.winner.vendor_name}</p>
                    <p className="text-sm text-green-700">Total Cost: ${currentResult.comparison.summary.winner.total_cost.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">AI Recommendation</h3>
              <p className="text-blue-800 whitespace-pre-line">{currentResult.recommendation}</p>
            </div>
          </CardContent>
        </Card>

        {/* Vendor Recommendations */}
        {currentResult.multi_vendor_analysis?.vendor_recommendations && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Vendor Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentResult.multi_vendor_analysis.vendor_recommendations.map((rec: any, index: number) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    rec.is_winner ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-lg">{rec.vendor_name}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          rec.badge_color === 'green' ? 'bg-green-100 text-green-800' :
                          rec.badge_color === 'blue' ? 'bg-blue-100 text-blue-800' :
                          rec.badge_color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {rec.recommendation_type}
                        </span>
                        {rec.is_winner && (
                          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                            🏆 WINNER
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">${rec.total_cost.toLocaleString()}</p>
                        {rec.cost_difference > 0 && (
                          <p className="text-sm text-red-600">+${rec.cost_difference.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{rec.recommendation_reason}</p>
                    
                    {/* Strengths and Weaknesses */}
                    {rec.analysis && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {rec.analysis.strengths && rec.analysis.strengths.length > 0 && (
                          <div>
                            <h5 className="font-medium text-sm text-green-700 mb-2">✅ Strengths:</h5>
                            <ul className="space-y-1">
                              {rec.analysis.strengths.map((strength: string, i: number) => (
                                <li key={i} className="text-xs text-green-600">• {strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {rec.analysis.weaknesses && rec.analysis.weaknesses.length > 0 && (
                          <div>
                            <h5 className="font-medium text-sm text-red-700 mb-2">⚠️ Weaknesses:</h5>
                            <ul className="space-y-1">
                              {rec.analysis.weaknesses.map((weakness: string, i: number) => (
                                <li key={i} className="text-xs text-red-600">• {weakness}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Advanced Analysis Features */}
        {currentResult.advanced_analysis && (
          <div className="space-y-6">
            {/* Obfuscation Detection */}
            {currentResult.advanced_analysis.obfuscation_detection && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    🕵️ Obfuscation Detector
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentResult.advanced_analysis.obfuscation_detection.results.map((result: any, index: number) => (
                    <div key={index} className="mb-4 p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">{result.vendor}</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            result.analysis.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                            result.analysis.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            Risk: {result.analysis.risk_level.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-600">
                            Score: {result.analysis.risk_score}/100
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{result.analysis.summary}</p>
                        {result.analysis.issues.length > 0 && (
                          <div className="mt-3">
                            <h5 className="font-medium text-sm mb-2">Issues Found:</h5>
                            <ul className="space-y-1">
                              {result.analysis.issues.slice(0, 3).map((issue: any, i: number) => (
                                <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                                  <span className={`w-2 h-2 rounded-full mt-1.5 ${
                                    issue.severity === 'high' ? 'bg-red-500' :
                                    issue.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                  }`}></span>
                                  {issue.description}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Math Validator */}
            {currentResult.advanced_analysis.math_validation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    ✅ Math Validator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentResult.advanced_analysis.math_validation.results.map((result: any, index: number) => (
                    <div key={index} className="mb-4 p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">{result.vendor}</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            result.validation.status === 'valid' ? 'bg-green-100 text-green-800' :
                            result.validation.status === 'minor_issues' ? 'bg-yellow-100 text-yellow-800' :
                            result.validation.status === 'moderate_issues' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {result.validation.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-600">
                            Score: {result.validation.validation_score}/100
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{result.validation.summary}</p>
                        {result.validation.issues.length > 0 && (
                          <div className="mt-3">
                            <h5 className="font-medium text-sm mb-2">Issues Found:</h5>
                            <ul className="space-y-1">
                              {result.validation.issues.slice(0, 3).map((issue: any, i: number) => (
                                <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                                  <span className={`w-2 h-2 rounded-full mt-1.5 ${
                                    issue.severity === 'high' ? 'bg-red-500' :
                                    issue.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                  }`}></span>
                                  {issue.description}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Justification Helper */}
            {currentResult.advanced_analysis.justification_helper && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    📑 Justification Helper
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Selected Vendor: {currentResult.advanced_analysis.justification_helper.selected_vendor}</h4>
                    <div className="space-y-3">
                      <div>
                        <h5 className="font-medium text-sm mb-1">Primary Justification:</h5>
                        <p className="text-sm text-gray-700">{currentResult.advanced_analysis.justification_helper.justification.primary_justification}</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-sm mb-1">Risk Mitigation:</h5>
                        <p className="text-sm text-gray-700">{currentResult.advanced_analysis.justification_helper.justification.risk_mitigation}</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-sm mb-1">Audit Summary:</h5>
                        <p className="text-sm text-gray-700">{currentResult.advanced_analysis.justification_helper.justification.audit_summary}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Delay Tracker */}
            {currentResult.advanced_analysis.delay_tracker && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    📌 Delay Tracker
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        currentResult.advanced_analysis.delay_tracker.overall_risk_level === 'critical' ? 'bg-red-100 text-red-800' :
                        currentResult.advanced_analysis.delay_tracker.overall_risk_level === 'high' ? 'bg-orange-100 text-orange-800' :
                        currentResult.advanced_analysis.delay_tracker.overall_risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {currentResult.advanced_analysis.delay_tracker.overall_risk_level.toUpperCase()} RISK
                      </span>
                      <span className="text-sm text-gray-600">
                        {currentResult.advanced_analysis.delay_tracker.total_delays} delays detected
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700">{currentResult.advanced_analysis.delay_tracker.estimated_impact}</p>
                    
                    {currentResult.advanced_analysis.delay_tracker.timeline_blockers.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Timeline Blockers:</h5>
                        <ul className="space-y-2">
                          {currentResult.advanced_analysis.delay_tracker.timeline_blockers.map((blocker: any, i: number) => (
                            <li key={i} className="text-sm text-gray-600 p-2 bg-yellow-50 rounded border">
                              <span className="font-medium">{blocker.blocker}</span> - {blocker.recommendation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {currentResult.advanced_analysis.delay_tracker.recommendations.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Recommendations:</h5>
                        <ul className="space-y-1">
                          {currentResult.advanced_analysis.delay_tracker.recommendations.slice(0, 5).map((rec: string, i: number) => (
                            <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full mt-1.5 bg-blue-500"></span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Vendor Quotes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Vendor Quotes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentResult.quotes?.map((quote: any, index: number) => {
                const totalCost = quote.items?.reduce((sum: number, item: any) => sum + item.total, 0) || 0;
                const isWinner = currentResult.comparison?.summary?.winner?.vendor_name === quote.vendorName;
                
                return (
                  <div key={index} className={`border rounded-lg p-4 ${
                    isWinner ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{quote.vendorName}</h3>
                      {isWinner && (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                          🏆 WINNER
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {quote.items?.map((item: any, itemIndex: number) => (
                        <div key={itemIndex} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex-1">
                            <p className="font-medium">{item.description}</p>
                            <p className="text-sm text-gray-600">
                              SKU: {item.sku} | Qty: {item.quantity.toLocaleString()}
                              {item.deliveryTime && ` | Delivery: ${item.deliveryTime}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${item.unitPrice.toFixed(2)}</p>
                            <p className="text-sm text-gray-600">Total: ${item.total.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total:</span>
                        <span className="font-bold text-lg">
                          ${totalCost.toFixed(2)}
                        </span>
                      </div>
                      
                      {/* Terms */}
                      {quote.terms && (
                        <div className="mt-2 text-sm text-gray-600">
                          <p>Payment: {quote.terms.payment}</p>
                          <p>Warranty: {quote.terms.warranty}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={() => downloadResults('json')} variant="outline">
                Export JSON
              </Button>
              <Button onClick={() => downloadResults('csv')} variant="outline">
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
        <Image
                src="/images/logo.svg" 
                alt="AutoProcure"
                width={150}
                height={40}
                className="h-8 w-auto"
              />
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#demo" className="text-gray-300 hover:text-white transition-colors">Demo</a>
              <a href="#try" className="text-gray-300 hover:text-white transition-colors">Try It</a>
            </div>
            
            <button className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:from-gray-600 hover:to-gray-800 transition-all duration-200 hover:scale-105 border border-gray-600">
              Get Early Access
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-slide-up">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Procurement,
                <span className="block bg-gradient-to-r from-gray-300 via-white to-gray-400 bg-clip-text text-transparent">
                  Powered by AI
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                AutoProcure cleans vendor quotes, compares them instantly, and helps you make faster, smarter purchasing decisions.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <button 
                  onClick={() => document.getElementById('try')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-gray-600 hover:to-gray-800 transition-all duration-200 flex items-center space-x-2 hover:scale-105 border border-gray-600"
                >
                  <span>Try It Now</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                
                <button className="border-2 border-gray-600 text-gray-300 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-800 hover:text-white transition-all duration-200 flex items-center space-x-2 hover:scale-105">
                  <Play className="w-5 h-5" />
                  <span>See Demo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="py-20 bg-gradient-to-r from-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Powerful features designed for procurement professionals
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 hover:border-gray-600 hover:shadow-2xl hover:shadow-gray-900/50 transition-all duration-300 hover:-translate-y-2 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-gray-600 overflow-hidden`}>
            <Image
                    src={feature.icon} 
                    alt={feature.title}
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Teaser */}
      <section id="demo" className="py-20 bg-gradient-to-r from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold text-white mb-4">
              See It In Action
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Watch how AutoProcure transforms your procurement workflow
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden animate-fade-in">
              <div className="flex items-center space-x-2 p-4 border-b border-gray-700">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex-1 text-center text-sm text-gray-400">
                  AutoProcure Demo
                </div>
              </div>
              
              <div className="p-8">
                <div className="text-center">
                  <div className="mb-8 transition-all duration-500 ease-in-out">
                    <div className={`w-20 h-20 bg-gradient-to-r ${demoSteps[currentDemoStep].color} rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-500 border border-gray-600`}>
                      {React.createElement(demoSteps[currentDemoStep].icon, { className: "w-10 h-10 text-white" })}
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-4">
                      {demoSteps[currentDemoStep].title}
                    </h3>
                    <p className="text-gray-300 text-lg">
                      {demoSteps[currentDemoStep].description}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => document.getElementById('try')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-gray-600 hover:to-gray-800 transition-all duration-200 flex items-center space-x-2 mx-auto hover:scale-105 border border-gray-600"
                  >
                    <span>Try It Now</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Try It Now Section */}
      <section id="try" className="py-20 bg-gradient-to-r from-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold text-white mb-4">
              Try AutoProcure Now
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Upload your vendor quotes and see the magic happen
            </p>
          </div>

          {/* File Upload Section */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Vendor Quotes (PDF or Excel)
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600"
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Selected Files:</h3>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                        <span className="text-gray-300">{file.name}</span>
                        <span className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || isUploading}
                className="w-full bg-gradient-to-r from-gray-700 to-gray-900 text-white py-3 px-6 rounded-xl font-semibold hover:from-gray-600 hover:to-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Analyze Quotes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Section */}
          {showResults && currentResult && (
            <div className="max-w-6xl mx-auto mt-12">
              {renderResults()}
            </div>
          )}
        </div>
      </section>

      {/* Call-to-Action Footer */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h2 className="text-4xl font-bold text-white mb-4">
              Be Among The First To Use AutoProcure
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join the waitlist and get early access to the future of procurement
            </p>
            
            <div className="max-w-md mx-auto mb-12">
              <form onSubmit={handleEmailSubmit} className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-l-lg border-0 bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-600 focus:outline-none"
                  disabled={isSubmitting}
                />
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-6 py-3 rounded-r-lg font-semibold hover:from-gray-600 hover:to-gray-800 transition-all duration-200 hover:scale-105 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                </button>
              </form>
              
              {submitMessage && (
                <div className={`mt-4 text-center text-sm ${submitSuccess ? 'text-green-400' : 'text-red-400'}`}>
                  {submitMessage}
                </div>
              )}
            </div>
            
            <div className="flex justify-center space-x-8 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
