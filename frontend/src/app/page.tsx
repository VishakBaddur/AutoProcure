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
  AlertCircle
} from 'lucide-react';
import Image from 'next/image';

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
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white">Analysis Results</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => downloadResults('json')}
                      className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>JSON</span>
                    </button>
                    <button
                      onClick={() => downloadResults('csv')}
                      className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-700 rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                      <div>
                        <p className="text-gray-300 text-sm">Vendors Analyzed</p>
                        <p className="text-white text-2xl font-bold">{currentResult.quotes?.length || 1}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-8 h-8 text-blue-400" />
                      <div>
                        <p className="text-gray-300 text-sm">Total Value</p>
                        <p className="text-white text-2xl font-bold">
                          ${currentResult.comparison?.totalCost?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-8 h-8 text-yellow-400" />
                      <div>
                        <p className="text-gray-300 text-sm">Potential Savings</p>
                        <p className="text-white text-2xl font-bold">
                          ${totalSavings.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                {currentResult.recommendation && (
                  <div className="bg-gray-700 rounded-xl p-6 mb-8">
                    <h4 className="text-lg font-semibold text-white mb-3">AI Recommendation</h4>
                    <p className="text-gray-300">{currentResult.recommendation}</p>
                  </div>
                )}

                {/* Quote Details */}
                {currentResult.quotes && currentResult.quotes.map((quote: any, index: number) => (
                  <div key={index} className="bg-gray-700 rounded-xl p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xl font-semibold text-white">{quote.vendorName}</h4>
                      <div className="flex items-center space-x-2">
                        {index === 0 && (
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Winner
                          </span>
                        )}
                        <span className="text-gray-300">
                          Total: ${quote.items?.reduce((sum: number, item: any) => sum + item.total, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {quote.items?.map((item: any, itemIndex: number) => (
                        <div key={itemIndex} className="flex justify-between items-center bg-gray-600 rounded-lg p-3">
                          <div>
                            <p className="text-white font-medium">{item.description}</p>
                            <p className="text-gray-300 text-sm">Qty: {item.quantity} × ${item.unitPrice}</p>
                          </div>
                          <p className="text-white font-semibold">${item.total.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
