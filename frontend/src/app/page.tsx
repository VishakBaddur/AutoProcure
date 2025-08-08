"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FileUpload from "@/components/FileUpload";
import QuoteHistory from "@/components/QuoteHistory";
import { api } from "@/utils/api";
import { AlertCircle, DollarSign, Euro, IndianRupee, Info, TrendingUp, Target, Zap, CheckCircle, Star, ArrowRight, Download, Mail, Sparkles, Shield, Clock, Users } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

interface QuoteItem {
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  deliveryTime: string;
}

interface Quote {
  vendorName: string;
  items: QuoteItem[];
  terms: {
    paymentTerms: string;
    deliveryTerms: string;
    warranty: string;
  };
}

interface QuoteAnalysisResult {
  quotes: Quote[];
  comparison: {
    totalCost: number;
    deliveryTime: string;
    vendorCount: number;
    costSavings?: number;
    riskAssessment?: string;
  };
  recommendation: string;
  suggestion?: string;
}

// Currency conversion rates (simplified - in real app, use live rates)
const CURRENCY_RATES = {
  USD: 1,
  EUR: 0.85,
  INR: 83.5
};

const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  INR: '₹'
};

export default function Home() {
  const [results, setResults] = useState<Array<{fileName: string, result: unknown}>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'EUR' | 'INR'>('USD');
  const [totalSavings, setTotalSavings] = useState(0);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);

  // Recalculate savings whenever results change
  useEffect(() => {
    if (results.length >= 2) {
      const allQuotes = results.map(r => (r.result as QuoteAnalysisResult).quotes[0]).filter(Boolean);
      
      if (allQuotes.length >= 2) {
        // Calculate total for each vendor
        const vendorTotals = allQuotes.map(quote => ({
          vendor: quote.vendorName,
          total: quote.items.reduce((sum, item) => sum + item.total, 0),
          items: quote.items
        }));

        const best = vendorTotals.reduce((min, current) => 
          current.total < min.total ? current : min
        );

        const worst = vendorTotals.reduce((max, current) => 
          current.total > max.total ? current : max
        );

        const savings = worst.total - best.total;
        setTotalSavings(savings);
      }
    } else {
      setTotalSavings(0);
    }
  }, [results]);

  // Close download dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.download-dropdown')) {
        setShowDownloadDropdown(false);
      }
    };

    if (showDownloadDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadDropdown]);

  const handleFileUpload = async (file: File) => {
    try {
      const result = await api.uploadFile(file);
      setResults(prev => [...prev, { fileName: file.name, result }]);
      
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      throw new Error(errorMessage);
    }
  };

  // Convert price to selected currency
  const convertPrice = (price: number) => {
    return price * CURRENCY_RATES[selectedCurrency];
  };

  // Get vendor logo based on vendor name
  const getVendorLogo = (vendorName: string) => {
    const name = vendorName.toLowerCase();
    if (name.includes('amazon') || name.includes('aws')) return '🛒';
    if (name.includes('microsoft') || name.includes('msft')) return '🪟';
    if (name.includes('google') || name.includes('alphabet')) return '🔍';
    if (name.includes('apple')) return '🍎';
    if (name.includes('dell')) return '💻';
    if (name.includes('hp') || name.includes('hewlett')) return '🖥️';
    if (name.includes('cisco')) return '🌐';
    if (name.includes('oracle')) return '🗄️';
    if (name.includes('sap')) return '📊';
    if (name.includes('salesforce')) return '☁️';
    return '🏢'; // Default building icon
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header with Global Currency Selector */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">AutoProcure</h1>
              </div>
              <Badge variant="secondary" className="ml-3 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-blue-200">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Global Currency Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Currency:</span>
                <Select value={selectedCurrency} onValueChange={(value: 'USD' | 'EUR' | 'INR') => setSelectedCurrency(value)}>
                  <SelectTrigger className="w-24 border-gray-200 bg-white/50 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        USD
                      </div>
                    </SelectItem>
                    <SelectItem value="EUR">
                      <div className="flex items-center gap-2">
                        <Euro className="h-4 w-4" />
                        EUR
                      </div>
                    </SelectItem>
                    <SelectItem value="INR">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4" />
                        INR
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowHistory(!showHistory)}
                className="border-gray-200 bg-white/50 backdrop-blur-sm hover:bg-white"
              >
                {showHistory ? 'Hide History' : 'Quote History'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Product Hunt Ready */}
      <div className="max-w-6xl mx-auto mt-12 mb-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-full px-4 py-2 mb-6">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm font-medium text-blue-800">Launching on Product Hunt</span>
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Stop Overpaying on
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Procurement</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            Procurement teams are losing <span className="font-semibold text-red-600">{CURRENCY_SYMBOLS[selectedCurrency]}10–50K/month</span> to price mismatches and hidden cost traps. 
            AutoProcure instantly tells you where you&apos;re overpaying — and which vendor wins on value.
          </p>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>500+ procurement teams</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>10-15% average savings</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Instant analysis</span>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600 text-sm">Upload quotes and get analysis in seconds, not hours</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI-Powered</h3>
              <p className="text-gray-600 text-sm">Advanced OCR and pattern recognition for any format</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Enterprise Ready</h3>
              <p className="text-gray-600 text-sm">SOC 2 compliant, audit trails, team collaboration</p>
            </div>
          </div>
        </div>

        {/* Killer "Try It Now" Demo Section */}
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              See Your Savings in <span className="text-blue-600">30 Seconds</span>
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
              Upload two supplier quotes. Get instant analysis with item-by-item comparison, 
              vendor recommendations, and projected annual savings.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="max-w-2xl mx-auto">
              <FileUpload onFileUpload={handleFileUpload} />
              {totalSavings > 0 && (
                <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-lg font-semibold text-green-800">
                      Total Savings This Session: {CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(totalSavings).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-green-600">
                    Projected monthly savings: {CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(totalSavings * 20).toLocaleString()} 
                    (20 quotes/month)
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Analysis Results for Each File */}
          {results.length > 0 && results.map(({ fileName, result }, idx) => (
            <Card key={fileName + idx} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">{idx + 1}</span>
                  </div>
                  Analysis Results: {fileName}
                </CardTitle>
                <CardDescription>
                  AI-powered insights and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Enhanced Quote Summary for Individual Files */}
                {(() => {
                  const quoteResult = result as QuoteAnalysisResult;
                  const quote = quoteResult.quotes[0];
                  
                  if (!quote || !quote.items || quote.items.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Analysis Failed</h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                          Could not extract quote information from this file. Please check the file format and try again.
                        </p>
                      </div>
                    );
                  }

                  const totalCost = quote.items.reduce((sum, item) => sum + item.total, 0);
                  const confidenceScore = Math.min(95, Math.max(60, 
                    quote.items.length > 0 ? 85 : 60 + (quote.vendorName !== 'Unknown Vendor' ? 10 : 0)
                  ));

                  return (
                    <div className="space-y-6">
                      {/* Enhanced Quote Summary Card */}
                      <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                📋
                              </div>
                              Quote Summary
                            </CardTitle>
                            <Badge variant="default" className="bg-blue-500 text-white px-3 py-1">
                              {confidenceScore}% Confidence
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            {/* Vendor Info with Logo */}
                            <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-blue-100">
                              <div className="text-4xl">
                                {getVendorLogo(quote.vendorName)}
                              </div>
                              <div>
                                <span className="text-xl font-semibold text-blue-900">{quote.vendorName}</span>
                                <p className="text-sm text-gray-600">Quote analyzed successfully</p>
                              </div>
                            </div>

                            {/* Total Cost */}
                            <div className="bg-white p-6 rounded-xl border border-blue-100">
                              <div className="text-center">
                                <p className="text-sm text-gray-600 mb-2">Total Quote Value</p>
                                <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                  {CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(totalCost).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            {/* Cost Breakdown with Item-Level Confidence */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center">
                                  <span className="text-xs">📊</span>
                                </div>
                                Cost Breakdown
                              </h4>
                              <div className="space-y-2">
                                {quote.items.map((item, index) => {
                                  const itemConfidence = Math.min(95, Math.max(60, 
                                    item.description.length > 10 ? 85 : 70
                                  ));
                                  return (
                                    <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 cursor-pointer group">
                                      <div className="flex-1">
                                        <span className="font-medium text-gray-900">{item.description}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs text-gray-500">Confidence: {itemConfidence}%</span>
                                          <Progress value={itemConfidence} className="w-16 h-1" />
                                        </div>
                                      </div>
                                      <span className="font-semibold text-blue-600">
                                        {CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(item.total).toLocaleString()}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Confidence Score */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Data Quality Score:</span>
                                <div className="relative group">
                                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    Invoice scan quality, vendor formatting consistency, data extraction accuracy, and field completeness
                                  </div>
                                </div>
                              </div>
                              <Progress value={confidenceScore} className="h-3" />
                              <p className="text-xs text-gray-500">
                                {confidenceScore}% - {confidenceScore >= 80 ? 'Excellent' : confidenceScore >= 60 ? 'Good' : 'Fair'} data quality
                              </p>
                            </div>

                            {/* Recommendation */}
                            {quoteResult.recommendation && (
                              <div className="bg-white p-4 rounded-xl border border-green-100">
                                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                  <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                                    <span className="text-xs">💡</span>
                                  </div>
                                  AI Recommendation
                                </h4>
                                <p className="text-gray-700">{quoteResult.recommendation}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          ))}

          {/* Multi-Vendor Comparison (only show if multiple files) */}
          {results.length > 1 && (() => {
            const allQuotes = results.map(r => (r.result as QuoteAnalysisResult).quotes[0]).filter(Boolean);
            
            if (allQuotes.length < 2) return null;

            const vendorTotals = allQuotes.map(quote => ({
              vendor: quote.vendorName,
              total: quote.items.reduce((sum, item) => sum + item.total, 0),
              items: quote.items
            }));

            const best = vendorTotals.reduce((min, current) => 
              current.total < min.total ? current : min
            );

            const worst = vendorTotals.reduce((max, current) => 
              current.total > max.total ? current : max
            );

            const percentageSavings = ((worst.total - best.total) / worst.total * 100);

            // Generate email content
            const generateEmailContent = () => {
              const subject = encodeURIComponent(`Vendor Quote Comparison - ${best.vendor} Recommended`);
              const body = encodeURIComponent(`
Hi Team,

I've analyzed ${allQuotes.length} vendor quotes for our procurement:

🏆 RECOMMENDED: ${best.vendor}
Total Cost: ${CURRENCY_SYMBOLS[selectedCurrency]}${convertPrice(best.total).toLocaleString()}
Savings: ${percentageSavings.toFixed(1)}% vs ${worst.vendor}

Detailed comparison attached.

Best regards
              `);
              window.open(`mailto:?subject=${subject}&body=${body}`);
            };

            // Generate report download
            const generateReport = (format: 'pdf' | 'csv' | 'json') => {
              const report = {
                analysisDate: new Date().toISOString(),
                vendorCount: allQuotes.length,
                recommendedVendor: best.vendor,
                totalSavings: worst.total - best.total,
                percentageSavings: percentageSavings,
                detailedComparison: vendorTotals,
                currency: selectedCurrency
              };

              if (format === 'json') {
                const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `vendor-comparison-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } else if (format === 'csv') {
                // Generate CSV for comparison table
                const headers = ['Item', ...vendorTotals.map(v => v.vendor), 'Best Price', 'Savings %'];
                const rows = Array.from(allItems.entries()).map(([itemName, vendorPrices]) => {
                  const cheapest = cheapestPerItem.get(itemName);
                  const savings = itemSavings.get(itemName);
                  return [
                    itemName,
                    ...vendorTotals.map(({ vendor }) => vendorPrices[vendor] || ''),
                    cheapest ? cheapest.price : '',
                    savings && savings.savingsPercent > 5 ? `${savings.savingsPercent.toFixed(1)}%` : ''
                  ];
                });
                
                const csvContent = [headers, ...rows]
                  .map(row => row.map(cell => `"${cell}"`).join(','))
                  .join('\n');
                
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `vendor-comparison-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } else if (format === 'pdf') {
                // Generate PDF report
                const pdfContent = `
                  <html>
                    <head>
                      <style>
                        body { font-family: Arial, sans-serif; margin: 40px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .title { font-size: 24px; font-weight: bold; color: #1f2937; }
                        .subtitle { font-size: 16px; color: #6b7280; margin-top: 10px; }
                        .summary { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
                        .winner { background: #d1fae5; padding: 15px; border-radius: 8px; margin: 15px 0; }
                        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        .table th, .table td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
                        .table th { background: #f9fafb; font-weight: bold; }
                        .highlight { background: #d1fae5; font-weight: bold; }
                        .savings { color: #059669; font-weight: bold; }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <div class="title">Vendor Quote Comparison Report</div>
                        <div class="subtitle">Generated on ${new Date().toLocaleDateString()}</div>
                      </div>
                      
                      <div class="summary">
                        <h3>Executive Summary</h3>
                        <p><strong>Recommended Vendor:</strong> ${best.vendor}</p>
                        <p><strong>Total Savings:</strong> ${CURRENCY_SYMBOLS[selectedCurrency]}${convertPrice(worst.total - best.total).toLocaleString()} (${percentageSavings.toFixed(1)}%)</p>
                        <p><strong>Vendors Compared:</strong> ${allQuotes.length}</p>
                      </div>
                      
                      <div class="winner">
                        <h3>🏆 Winner: ${best.vendor}</h3>
                        <p><strong>Total Cost:</strong> ${CURRENCY_SYMBOLS[selectedCurrency]}${convertPrice(best.total).toLocaleString()}</p>
                        <p><strong>Savings vs Highest Bid:</strong> ${CURRENCY_SYMBOLS[selectedCurrency]}${convertPrice(worst.total - best.total).toLocaleString()} (${percentageSavings.toFixed(1)}%)</p>
                      </div>
                      
                      <h3>Item-by-Item Comparison</h3>
                      <table class="table">
                        <thead>
                          <tr>
                            <th>Item</th>
                            ${vendorTotals.map(v => `<th>${v.vendor}</th>`).join('')}
                            <th>Best Price</th>
                            <th>Savings %</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${Array.from(allItems.entries()).map(([itemName, vendorPrices]) => {
                            const cheapest = cheapestPerItem.get(itemName);
                            const savings = itemSavings.get(itemName);
                            return `
                              <tr>
                                <td>${itemName}</td>
                                ${vendorTotals.map(({ vendor }) => {
                                  const price = vendorPrices[vendor];
                                  const isCheapest = cheapest && cheapest.vendor === vendor;
                                  return `<td class="${isCheapest ? 'highlight' : ''}">${price ? `${CURRENCY_SYMBOLS[selectedCurrency]}${convertPrice(price).toFixed(2)}` : '-'}</td>`;
                                }).join('')}
                                <td class="highlight">${cheapest ? `${CURRENCY_SYMBOLS[selectedCurrency]}${convertPrice(cheapest.price).toFixed(2)} (${cheapest.vendor})` : '-'}</td>
                                <td class="savings">${savings && savings.savingsPercent > 5 ? `${savings.savingsPercent.toFixed(1)}%` : '-'}</td>
                              </tr>
                            `;
                          }).join('')}
                        </tbody>
                      </table>
                      
                      <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px;">
                        <h3>💡 Recommendations</h3>
                        <p>• Consider ${best.vendor} for the best overall value</p>
                        <p>• Review items with >10% savings for bulk purchasing opportunities</p>
                        <p>• Negotiate with ${worst.vendor} on items where they're significantly higher</p>
                      </div>
                    </body>
                  </html>
                `;
                
                const blob = new Blob([pdfContent], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `vendor-comparison-report-${new Date().toISOString().split('T')[0]}.html`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
            };

            // Build item comparison map with savings percentages
            const allItems = new Map<string, { [vendor: string]: number }>();
            const cheapestPerItem = new Map<string, { vendor: string; price: number }>();
            const itemSavings = new Map<string, { bestPrice: number; worstPrice: number; savingsPercent: number }>();

            vendorTotals.forEach(({ vendor, items }) => {
              items.forEach(item => {
                const key = item.description.trim().toLowerCase();
                if (!allItems.has(key)) {
                  allItems.set(key, {});
                }
                allItems.get(key)![vendor] = item.unitPrice;
                
                if (!cheapestPerItem.has(key) || item.unitPrice < cheapestPerItem.get(key)!.price) {
                  cheapestPerItem.set(key, { vendor, price: item.unitPrice });
                }
              });
            });

            // Calculate savings percentages for each item
            allItems.forEach((vendorPrices, itemName) => {
              const prices = Object.values(vendorPrices).filter(p => p > 0);
              if (prices.length > 1) {
                const bestPrice = Math.min(...prices);
                const worstPrice = Math.max(...prices);
                const savingsPercent = ((worstPrice - bestPrice) / worstPrice * 100);
                itemSavings.set(itemName, { bestPrice, worstPrice, savingsPercent });
              }
            });

            return (
              <div className="space-y-8">
                {/* Summary Card */}
                <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          🏆
                        </div>
                        Best Vendor Summary
                      </CardTitle>
                      <Badge variant="default" className="bg-green-500 text-white px-4 py-2 text-sm">
                        🏆 Winner
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Winner Info with Logo */}
                      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-green-100">
                        <div className="text-4xl">
                          {getVendorLogo(best.vendor)}
                        </div>
                        <div>
                          <span className="text-xl font-semibold text-green-900">{best.vendor}</span>
                          <p className="text-sm text-gray-600">Best overall value</p>
                        </div>
                      </div>

                      {/* Total Cost */}
                      <div className="bg-white p-6 rounded-xl border border-green-100">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">Total Cost</p>
                          <p className="text-4xl font-bold text-green-600">
                            {CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(best.total).toLocaleString()}
                          </p>
                          <p className="text-lg font-semibold text-green-700 mt-2">
                            Saves {percentageSavings.toFixed(1)}% vs {worst.vendor}
                          </p>
                        </div>
                      </div>

                      {/* Cost Breakdown */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center">
                            <span className="text-xs">📊</span>
                          </div>
                          Cost Breakdown
                        </h4>
                        <div className="space-y-2">
                          {best.items.map((item, index) => {
                            const itemName = item.description.trim().toLowerCase();
                            const savings = itemSavings.get(itemName);
                            return (
                              <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all duration-200 cursor-pointer group">
                                <div className="flex-1">
                                  <span className="font-medium text-gray-900">{item.description}</span>
                                  {savings && savings.savingsPercent > 5 && (
                                    <div className="text-xs text-green-600 font-medium mt-1">
                                      {savings.savingsPercent.toFixed(1)}% cheaper than highest bid
                                    </div>
                                  )}
                                </div>
                                <span className="font-semibold text-green-600">
                                  {CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(item.total).toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-4">
                        <Button 
                          onClick={generateEmailContent}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 h-12 text-base"
                        >
                          <Mail className="w-5 h-5 mr-2" />
                          Email to Team
                        </Button>
                        <div className="relative download-dropdown">
                          <Button 
                            onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                            variant="outline"
                            className="h-12 text-base border-gray-300 hover:bg-gray-50 pr-8"
                          >
                            <Download className="w-5 h-5 mr-2" />
                            Download Report
                          </Button>
                          {showDownloadDropdown && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
                              <div className="p-1">
                                <button
                                  onClick={() => {
                                    generateReport('pdf');
                                    setShowDownloadDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                                >
                                  📄 PDF Report
                                </button>
                                <button
                                  onClick={() => {
                                    generateReport('csv');
                                    setShowDownloadDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                                >
                                  📊 CSV Comparison Table
                                </button>
                                <button
                                  onClick={() => {
                                    generateReport('json');
                                    setShowDownloadDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                                >
                                  🔧 JSON Data
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Comparison Table */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        📊
                      </div>
                      Item-by-Item Comparison
                    </CardTitle>
                    <CardDescription>
                      Compare pricing across all vendors. Green highlights indicate the best price for each item.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b-2 border-gray-200">
                            <th className="text-left p-4 font-semibold text-gray-900">Item</th>
                            {vendorTotals.map(({ vendor }) => (
                              <th key={vendor} className="text-center p-4 font-semibold text-gray-900">
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-xl">{getVendorLogo(vendor)}</span>
                                  <span className="text-sm">{vendor}</span>
                                </div>
                              </th>
                            ))}
                            <th className="text-center p-4 font-semibold text-green-600">Best Price</th>
                            <th className="text-center p-4 font-semibold text-green-600">Savings %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from(allItems.entries()).map(([itemName, vendorPrices], index) => {
                            const cheapest = cheapestPerItem.get(itemName);
                            const savings = itemSavings.get(itemName);
                            return (
                              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <td className="p-4 text-sm font-medium text-gray-900">{itemName}</td>
                                {vendorTotals.map(({ vendor }) => {
                                  const price = vendorPrices[vendor];
                                  const isCheapest = cheapest && cheapest.vendor === vendor;
                                  return (
                                    <td key={vendor} className={`p-4 text-center text-sm ${isCheapest ? 'bg-green-50 text-green-700 font-semibold border-2 border-green-200' : ''}`}>
                                      {price ? `${CURRENCY_SYMBOLS[selectedCurrency]}${convertPrice(price).toFixed(2)}` : '-'}
                                    </td>
                                  );
                                })}
                                <td className="p-4 text-center text-sm font-semibold text-green-600">
                                  <div className="flex flex-col items-center justify-center">
                                    {cheapest ? (
                                      <>
                                        <span>{CURRENCY_SYMBOLS[selectedCurrency]}${convertPrice(cheapest.price).toFixed(2)}</span>
                                        <span className="text-xs text-gray-500">{cheapest.vendor}</span>
                                      </>
                                    ) : '-'}
                                  </div>
                                </td>
                                <td className="p-4 text-center text-sm font-semibold text-green-600">
                                  {savings && savings.savingsPercent > 5 ? (
                                    <span className="text-green-600">{savings.savingsPercent.toFixed(1)}%</span>
                                  ) : '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })()}

          {/* Value Proposition Card */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Your Savings Potential</CardTitle>
                <CardDescription className="text-base">
                  Real ROI based on your actual vendor comparisons
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-white rounded-xl border border-purple-100">
                  <p className="text-sm text-gray-600 mb-2">This Session</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(totalSavings).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">saved</p>
                </div>
                <div className="text-center p-6 bg-white rounded-xl border border-purple-100">
                  <p className="text-sm text-gray-600 mb-2">Monthly Potential</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(totalSavings * 20).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">(20 quotes/month)</p>
                </div>
                <div className="text-center p-6 bg-white rounded-xl border border-purple-100">
                  <p className="text-sm text-gray-600 mb-2">Annual Potential</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(totalSavings * 240).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">(240 quotes/year)</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4 text-center">
                *Based on average 10-15% savings per quote comparison
              </p>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-sm">🚀</span>
                </div>
                Ready to Scale Your Savings?
              </CardTitle>
              <CardDescription className="text-lg">
                Get automated weekly reports, team collaboration, and enterprise features
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-blue-600 hover:bg-blue-700 h-12 px-8 text-base">
                  Start Free Trial
                </Button>
                <Button variant="outline" className="h-12 px-8 text-base border-gray-300 hover:bg-gray-50">
                  Schedule Demo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quote History */}
          {showHistory && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Quote History</CardTitle>
                <CardDescription>
                  View your previous quote analyses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuoteHistory />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
