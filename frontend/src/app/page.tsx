"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";
import FileUpload from "@/components/FileUpload";
import QuoteHistory from "@/components/QuoteHistory";
import { api } from "@/utils/api";
import { AlertCircle, Sparkles, DollarSign, Euro, IndianRupee } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface QuoteItem {
  sku?: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  deliveryTime?: string;
  total?: number;
}

interface Quote {
  vendorName?: string;
  items?: QuoteItem[];
  terms?: Record<string, string>;
}

interface QuoteAnalysisResult {
  quotes?: Quote[];
  suggestion?: string;
  recommendation?: string;
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
  const { user, isAuthenticated, login, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [results, setResults] = useState<Array<{fileName: string, result: unknown}>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'EUR' | 'INR'>('USD');

  const handleAuthSuccess = (token: string, userData: User) => {
    login(token, userData);
    setShowAuthModal(false);
  };

  const handleFileUpload = async (file: File) => {
    if (!isAuthenticated) {
      setAuthMode('login');
      setShowAuthModal(true);
      throw new Error('Not authenticated');
    }

    try {
      const result = await api.uploadFile(file);
      setResults(prev => [...prev, { fileName: file.name, result }]);
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      throw new Error(errorMessage);
    }
  };

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* AI Coming Soon Banner */}
      <div className="max-w-2xl mx-auto mt-8 mb-6">
        <Card className="border-2 border-yellow-400 bg-yellow-50">
          <CardHeader className="flex flex-row items-center gap-3">
            <Sparkles className="text-yellow-500" />
            <div>
              <CardTitle>AI-Powered Multi-Vendor Optimization <span className="text-yellow-500">Coming Soon!</span></CardTitle>
              <CardDescription>
                Soon, AutoProcure will recommend the best vendor(s) for each item, split orders for maximum savings, and explain every decision. For now, you can upload and compare quotes side-by-side.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">AutoProcure</h1>
              <Badge variant="secondary" className="ml-3">
                AI-Powered Procurement
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-gray-600">
                    Welcome, {user?.name || user?.email}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    {showHistory ? 'Hide History' : 'Quote History'}
                  </Button>
                  <Button variant="outline" onClick={logout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => openAuthModal('login')}>
                    Login
                  </Button>
                  <Button onClick={() => openAuthModal('signup')}>
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isAuthenticated ? (
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to AutoProcure
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Streamline your procurement process with AI-powered quote analysis, 
              vendor comparison, and intelligent recommendations.
            </p>
            <div className="space-x-4">
              <Button size="lg" onClick={() => openAuthModal('signup')}>
                Get Started
              </Button>
              <Button size="lg" variant="outline" onClick={() => openAuthModal('login')}>
                Sign In
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* File Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Vendor Quotes</CardTitle>
                <CardDescription>
                  Upload one or more PDF or Excel files to analyze quotes and get AI-powered insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload onFileUpload={handleFileUpload} />
              </CardContent>
            </Card>

            {/* Analysis Results for Each File */}
            {results.length > 0 && results.map(({ fileName, result }, idx) => (
              <Card key={fileName + idx}>
                <CardHeader>
                  <CardTitle>Analysis Results: {fileName}</CardTitle>
                  <CardDescription>
                    AI-powered insights and recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Quotes */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Extracted Quotes</h3>
                      {(result as QuoteAnalysisResult)?.quotes?.map((quote: Quote, index: number) => (
                        <div key={index} className="border rounded-lg p-4 mb-4">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium">{(quote as Quote)?.vendorName || 'Unknown Vendor'}</h4>
                            <Badge variant="outline">{(quote as Quote)?.terms?.quoteNumber || 'N/A'}</Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600">Quote Date</p>
                              <p className="font-medium">{(quote as Quote)?.terms?.quoteDate || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Valid Until</p>
                              <p className="font-medium">{(quote as Quote)?.terms?.validUntil || 'N/A'}</p>
                            </div>
                          </div>
                          {/* Items */}
                          <div>
                            <h5 className="font-medium mb-2">Items</h5>
                            <div className="space-y-2">
                              {(quote as Quote)?.items?.map((item: QuoteItem, itemIndex: number) => (
                                <div key={itemIndex} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                  <div>
                                    <p className="font-medium">{(item as QuoteItem)?.description || 'Unknown Item'}</p>
                                    <p className="text-sm text-gray-600">
                                      SKU: {(item as QuoteItem)?.sku || 'N/A'} | 
                                      Qty: {(item as QuoteItem)?.quantity || 0}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">
                                      ${(item as QuoteItem)?.unitPrice?.toFixed(2) || '0.00'}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Total: ${(item as QuoteItem)?.total?.toFixed(2) || '0.00'}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Recommendation */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">AI Recommendation</h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-900">
                          {(result as QuoteAnalysisResult)?.recommendation || 'No recommendation available'}
                        </p>
                      </div>
                    </div>

                    {/* Multi-vendor Suggestion/Conclusion */}
                    {(result as QuoteAnalysisResult)?.suggestion && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Conclusion / Suggestion</h3>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-green-900">
                            {(result as QuoteAnalysisResult).suggestion}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Enhanced Quote Summary with Winner Features */}
                    {(result as QuoteAnalysisResult)?.quotes?.[0] && (() => {
                      const quote = (result as QuoteAnalysisResult).quotes![0];
                      const total = quote.items?.reduce((sum: number, item: QuoteItem) => sum + (item.total || 0), 0) || 0;
                      const items = quote.items || [];
                      
                      // Calculate confidence score based on data quality
                      const confidenceScore = Math.min(95, Math.max(60, 
                        items.length > 0 ? 85 : 60 + 
                        (quote.vendorName !== 'Unknown Vendor' ? 10 : 0)
                      ));
                      
                      return (
                        <div className="mt-6">
                          <Card className="border-2 border-green-400 bg-green-50">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle>Quote Summary</CardTitle>
                                <Badge variant="default" className="bg-green-500 text-white">
                                  📊 Analyzed
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {/* Currency Selection */}
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-700">Currency:</span>
                                  <Select value={selectedCurrency} onValueChange={(value: 'USD' | 'EUR' | 'INR') => setSelectedCurrency(value)}>
                                    <SelectTrigger className="w-24">
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
                                
                                {/* Vendor Info with Logo */}
                                <div className="flex items-center gap-3">
                                  <div className="text-3xl">
                                    {getVendorLogo(quote.vendorName || 'Unknown')}
                                  </div>
                                  <div>
                                    <span className="text-lg font-semibold text-green-900">{quote.vendorName || 'Unknown Vendor'}</span>
                                    <p className="text-sm text-gray-600">Quote analyzed successfully</p>
                                  </div>
                                </div>
                                
                                {/* Total Price */}
                                <div className="bg-white rounded-lg p-4 border shadow-sm">
                                  <div className="text-center">
                                    <p className="text-sm text-gray-600">Total Quote Value</p>
                                    <p className="text-3xl font-bold text-green-600">
                                      {CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(total).toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {selectedCurrency !== 'USD' && `($${total.toFixed(2)} USD)`}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Cost Breakdown with Hover Effects */}
                                {items.length > 0 && (
                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Item Breakdown:</h4>
                                    <div className="bg-white rounded-lg p-4 border shadow-sm space-y-3">
                                      {items.map((item, index) => (
                                        <div 
                                          key={index} 
                                          className="flex justify-between items-center p-3 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all duration-200 cursor-pointer group"
                                        >
                                          <div className="flex-1">
                                            <p className="font-medium group-hover:text-green-700 transition-colors">
                                              {item.description || 'Unknown Item'}
                                            </p>
                                            <p className="text-gray-600 text-sm">
                                              Qty: {item.quantity || 0} × {CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(item.unitPrice || 0).toFixed(2)}
                                            </p>
                                            {item.sku && (
                                              <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                                            )}
                                          </div>
                                          <div className="text-right">
                                            <span className="font-semibold text-green-700 group-hover:text-green-800 transition-colors">
                                              {CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(item.total || 0).toFixed(2)}
                                            </span>
                                            {item.deliveryTime && (
                                              <p className="text-xs text-gray-500 mt-1">
                                                Delivery: {item.deliveryTime}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Confidence Score */}
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Analysis Confidence</span>
                                    <span className="text-sm font-semibold text-green-600">{confidenceScore}%</span>
                                  </div>
                                  <Progress value={confidenceScore} className="w-full h-2" />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Based on data quality and extraction accuracy
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Simple Best Vendor Comparison Card - Only for Multiple Files */}
            {results.length > 1 && (() => {
              // Find the best vendor by total price
              const vendorTotals = results.map(({ fileName, result }) => {
                const vendor = (result as QuoteAnalysisResult)?.quotes?.[0]?.vendorName || fileName;
                const total = (result as QuoteAnalysisResult)?.quotes?.[0]?.items?.reduce((sum: number, item: QuoteItem) => sum + (item.total || 0), 0) || 0;
                const items = (result as QuoteAnalysisResult)?.quotes?.[0]?.items || [];
                return { vendor, total, items };
              });
              const best = vendorTotals.reduce((min, v) => v.total < min.total ? v : min, vendorTotals[0]);
              const worst = vendorTotals.reduce((max, v) => v.total > max.total ? v : max, vendorTotals[0]);
              if (!best || best.total === 0) return null;
              
              // Calculate percentage savings
              const percentageSavings = worst.total > 0 ? ((worst.total - best.total) / worst.total * 100) : 0;
              
              // Calculate confidence score based on data quality
              const confidenceScore = Math.min(95, Math.max(60, 
                best.items.length > 0 ? 85 : 60 + 
                (best.vendor !== 'Unknown Vendor' ? 10 : 0)
              ));

              // Create comparison table data
              const allItems = new Map<string, { description: string, sku?: string, vendors: Array<{ name: string, price: number, quantity: number, total: number }> }>();
              
              vendorTotals.forEach(({ vendor, items }) => {
                items.forEach(item => {
                  const key = item.sku || item.description || 'Unknown';
                  if (!allItems.has(key)) {
                    allItems.set(key, {
                      description: item.description || 'Unknown Item',
                      sku: item.sku,
                      vendors: []
                    });
                  }
                  allItems.get(key)!.vendors.push({
                    name: vendor,
                    price: item.unitPrice || 0,
                    quantity: item.quantity || 0,
                    total: item.total || 0
                  });
                });
              });

              // Find cheapest vendor for each item
              const cheapestPerItem = new Map<string, string>();
              allItems.forEach((itemData) => {
                const cheapest = itemData.vendors.reduce((min, v) => v.total < min.total ? v : min, itemData.vendors[0]);
                cheapestPerItem.set(itemData.description || 'Unknown Item', cheapest.name);
              });

              // Generate email content
              const generateEmailContent = () => {
                const subject = encodeURIComponent(`Vendor Quote Comparison - ${best.vendor} is ${percentageSavings.toFixed(1)}% cheaper`);
                const body = encodeURIComponent(`
Vendor Quote Comparison Report

Summary:
- Best Overall: ${best.vendor} ($${best.total.toFixed(2)})
- Savings: ${percentageSavings.toFixed(1)}% compared to ${worst.vendor}
- Total Savings: $${(worst.total - best.total).toFixed(2)}

Detailed Comparison:
${Array.from(allItems.entries()).map(([, itemData]) => {
  const cheapest = itemData.vendors.reduce((min, v) => v.total < min.total ? v : min, itemData.vendors[0]);
  return `\n${itemData.description} (${itemData.sku || 'No SKU'}):
${itemData.vendors.map(v => `  ${v.name}: $${v.total.toFixed(2)} (${v.quantity} × $${v.price.toFixed(2)})`).join('\n')}
  → Best: ${cheapest.name} ($${cheapest.total.toFixed(2)})`;
}).join('\n')}

Generated by AutoProcure AI
                `);
                return `mailto:?subject=${subject}&body=${body}`;
              };

              // Generate downloadable report
              const generateReport = () => {
                const report = {
                  summary: {
                    bestVendor: best.vendor,
                    bestTotal: best.total,
                    worstVendor: worst.vendor,
                    worstTotal: worst.total,
                    percentageSavings: percentageSavings,
                    totalSavings: worst.total - best.total
                  },
                  comparison: Array.from(allItems.entries()).map(([, itemData]) => ({
                    item: itemData.description,
                    sku: itemData.sku,
                    vendors: itemData.vendors,
                    cheapest: itemData.vendors.reduce((min, v) => v.total < min.total ? v : min, itemData.vendors[0])
                  })),
                  generatedAt: new Date().toISOString()
                };
                
                const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `vendor-comparison-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              };
              
              return (
                <div className="space-y-6">
                  {/* Summary Card */}
                  <Card className="border-2 border-green-400 bg-green-50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>🏆 Best Vendor Summary</CardTitle>
                        <Badge variant="default" className="bg-green-500 text-white">
                          🏆 Winner
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Currency Selection */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Currency:</span>
                          <Select value={selectedCurrency} onValueChange={(value: 'USD' | 'EUR' | 'INR') => setSelectedCurrency(value)}>
                            <SelectTrigger className="w-24">
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
                        
                        {/* Winner Info with Logo */}
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">
                            {getVendorLogo(best.vendor)}
                          </div>
                          <div>
                            <span className="text-lg font-semibold text-green-900">{best.vendor}</span>
                            <p className="text-sm text-gray-600">Best overall value</p>
                          </div>
                        </div>
                        
                        {/* Savings Summary */}
                        <div className="bg-white rounded-lg p-4 border shadow-sm">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Total Price</p>
                            <p className="text-3xl font-bold text-green-600">
                              {CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(best.total).toFixed(2)}
                            </p>
                            <p className="text-lg font-semibold text-green-700 mt-2">
                              {percentageSavings.toFixed(1)}% cheaper than {worst.vendor}
                            </p>
                            <p className="text-sm text-gray-600">
                              Savings: {CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(worst.total - best.total).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {selectedCurrency !== 'USD' && `($${best.total.toFixed(2)} USD)`}
                            </p>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <Button 
                            onClick={generateEmailContent}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                          >
                            📧 Email to Team
                          </Button>
                          <Button 
                            onClick={generateReport}
                            variant="outline"
                            className="flex-1"
                          >
                            📄 Download Report
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Comparison Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>📊 Item-by-Item Comparison</CardTitle>
                      <CardDescription>
                        Compare pricing across all vendors. Green highlights indicate the best price for each item.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b-2 border-gray-200">
                              <th className="text-left p-3 font-semibold">Item</th>
                              {vendorTotals.map(({ vendor }) => (
                                <th key={vendor} className="text-center p-3 font-semibold">
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="text-lg">{getVendorLogo(vendor)}</span>
                                    <span className="text-sm">{vendor}</span>
                                  </div>
                                </th>
                              ))}
                              <th className="text-center p-3 font-semibold text-green-600">Best Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from(allItems.entries()).map(([key, itemData]) => {
                              const cheapest = itemData.vendors.reduce((min, v) => v.total < min.total ? v : min, itemData.vendors[0]);
                              return (
                                <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="p-3">
                                    <div>
                                      <p className="font-medium">{itemData.description}</p>
                                      {itemData.sku && (
                                        <p className="text-xs text-gray-500">SKU: {itemData.sku}</p>
                                      )}
                                    </div>
                                  </td>
                                  {vendorTotals.map(({ vendor }) => {
                                    const vendorItem = itemData.vendors.find(v => v.name === vendor);
                                    const isCheapest = vendorItem && vendorItem.name === cheapest.name;
                                    return (
                                      <td key={vendor} className={`text-center p-3 ${isCheapest ? 'bg-green-50 border-2 border-green-200' : ''}`}>
                                        {vendorItem ? (
                                          <div>
                                            <p className="font-semibold">{CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(vendorItem.total).toFixed(2)}</p>
                                            <p className="text-xs text-gray-600">
                                              {vendorItem.quantity} × {CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(vendorItem.price).toFixed(2)}
                                            </p>
                                            {isCheapest && (
                                              <Badge variant="default" className="bg-green-500 text-white text-xs mt-1">
                                                Best
                                              </Badge>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-gray-400">-</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                  <td className="text-center p-3 bg-green-50">
                                    <div>
                                      <p className="font-bold text-green-700">{CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(cheapest.total).toFixed(2)}</p>
                                      <p className="text-xs text-green-600">{cheapest.name}</p>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Confidence Score */}
                  <Card>
                    <CardHeader>
                      <CardTitle>📈 Analysis Confidence</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Data Quality Score</span>
                        <span className="text-sm font-semibold text-green-600">{confidenceScore}%</span>
                      </div>
                      <Progress value={confidenceScore} className="w-full h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        Based on data quality and extraction accuracy
                      </p>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}

            {/* Potential with AI Card */}
            <Card className="border-2 border-blue-400 bg-blue-50">
              <CardHeader className="flex flex-row items-center gap-3">
                <AlertCircle className="text-blue-500" />
                <div>
                  <CardTitle>Potential with AI (Coming Soon)</CardTitle>
                  <CardDescription>
                    <b>Estimated savings:</b> 10-15% per order<br/>
                    <b>Time saved:</b> 10+ hours/month<br/>
                    <b>How?</b> AI will recommend the best vendor(s) for each item, split orders for maximum value, and explain every decision.
                  </CardDescription>
                  <p className="text-xs text-gray-500 mt-2">
                    *This is a preview. AI-powered recommendations will be available soon!*
                  </p>
                </div>
              </CardHeader>
            </Card>

            {/* Quote History */}
            {showHistory && (
              <Card>
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
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onAuthSuccess={handleAuthSuccess}
          />
    </div>
  );
}
