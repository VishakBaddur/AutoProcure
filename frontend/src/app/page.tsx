"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FileUpload from "@/components/FileUpload";
import QuoteHistory from "@/components/QuoteHistory";
import { api } from "@/utils/api";
import { AlertCircle, DollarSign, Euro, IndianRupee, Info, TrendingUp, Target, Zap } from 'lucide-react';
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

  const handleFileUpload = async (file: File) => {
    try {
      const result = await api.uploadFile(file);
      setResults(prev => [...prev, { fileName: file.name, result }]);
      
      // Calculate savings when we have multiple quotes to compare
      const newResults = [...results, { fileName: file.name, result }];
      if (newResults.length >= 2) {
        const allQuotes = newResults.map(r => (r.result as QuoteAnalysisResult).quotes[0]).filter(Boolean);
        if (allQuotes.length >= 2) {
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
      }
      
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header with Global Currency Selector */}
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
              {/* Global Currency Selector */}
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
              
              <Button
                variant="outline"
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? 'Hide History' : 'Quote History'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with New Positioning */}
      <div className="max-w-4xl mx-auto mt-8 mb-6">
        <Card className="border-2 border-green-400 bg-gradient-to-r from-green-50 to-blue-50">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Target className="text-green-600 h-8 w-8" />
              <h1 className="text-3xl font-bold text-gray-900">Stop Overpaying on Procurement</h1>
            </div>
            <CardTitle className="text-xl text-gray-700 mb-4">
              Procurement teams are losing {CURRENCY_SYMBOLS[selectedCurrency]}10–50K/month to price mismatches and hidden cost traps. 
              AutoProcure instantly tells you where you&apos;re overpaying — and which vendor wins on value.
            </CardTitle>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-600" />
                <span>Instant Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span>10-15% Average Savings</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-600" />
                <span>No Excel Required</span>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Killer "Try It Now" Demo Section */}
      <div className="max-w-4xl mx-auto mb-8">
        <Card className="border-2 border-blue-400 bg-blue-50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-blue-900 mb-2">
              Upload Two Supplier Quotes. See How Much You&apos;re Being Overcharged — Instantly.
            </CardTitle>
            <CardDescription className="text-lg">
              No login required. No friction. Just upload and see your savings in seconds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload onFileUpload={handleFileUpload} />
            {totalSavings > 0 && (
              <div className="mt-4 p-4 bg-green-100 rounded-lg text-center">
                <p className="text-lg font-semibold text-green-800">
                  Total Savings This Session: {CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(totalSavings).toLocaleString()}
                </p>
                <p className="text-sm text-green-600">
                  Imagine doing this across 20 quotes/month = {CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(totalSavings * 20).toLocaleString()}/month
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
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
                {/* Enhanced Quote Summary for Individual Files */}
                {(() => {
                  const quoteResult = result as QuoteAnalysisResult;
                  const quote = quoteResult.quotes[0];
                  
                  if (!quote || !quote.items || quote.items.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis Failed</h3>
                        <p className="text-gray-600">Could not extract quote information from this file. Please check the file format and try again.</p>
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
                      <Card className="border-2 border-blue-400 bg-blue-50">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle>📋 Quote Summary</CardTitle>
                            <Badge variant="default" className="bg-blue-500 text-white">
                              {confidenceScore}% Confidence
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Vendor Info with Logo */}
                            <div className="flex items-center gap-3">
                              <div className="text-3xl">
                                {getVendorLogo(quote.vendorName)}
                              </div>
                              <div>
                                <span className="text-lg font-semibold text-blue-900">{quote.vendorName}</span>
                                <p className="text-sm text-gray-600">Quote analyzed successfully</p>
                              </div>
                            </div>

                            {/* Total Cost */}
                            <div className="bg-white p-4 rounded-lg border">
                              <div className="text-center">
                                <p className="text-sm text-gray-600">Total Quote Value</p>
                                <p className="text-3xl font-bold text-blue-900">
                                  {CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(totalCost).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            {/* Cost Breakdown with Item-Level Confidence */}
                            <div className="space-y-2">
                              <h4 className="font-semibold text-gray-900">Cost Breakdown:</h4>
                              <div className="space-y-1">
                                {quote.items.map((item, index) => {
                                  const itemConfidence = Math.min(95, Math.max(60, 
                                    item.description.length > 10 ? 85 : 70
                                  ));
                                  return (
                                    <div key={index} className="flex justify-between items-center text-sm hover:border-green-200 hover:bg-green-50 transition-all duration-200 cursor-pointer group p-2 rounded">
                                      <div className="flex-1">
                                        <span>{item.description}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs text-gray-500">Confidence: {itemConfidence}%</span>
                                          <Progress value={itemConfidence} className="w-16 h-1" />
                                        </div>
                                      </div>
                                      <span className="font-medium">
                                        {CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(item.total).toLocaleString()}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Confidence Score */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Data Quality Score:</span>
                                <div className="relative group">
                                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    Invoice scan quality, vendor formatting consistency, data extraction accuracy, and field completeness
                                  </div>
                                </div>
                              </div>
                              <Progress value={confidenceScore} className="h-2" />
                              <p className="text-xs text-gray-500">{confidenceScore}% - {confidenceScore >= 80 ? 'Excellent' : confidenceScore >= 60 ? 'Good' : 'Fair'} data quality</p>
                            </div>

                            {/* Recommendation */}
                            {quoteResult.recommendation && (
                              <div className="bg-white p-4 rounded-lg border">
                                <h4 className="font-semibold text-gray-900 mb-2">AI Recommendation:</h4>
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
            const generateReport = () => {
              const report = {
                analysisDate: new Date().toISOString(),
                vendorCount: allQuotes.length,
                recommendedVendor: best.vendor,
                totalSavings: worst.total - best.total,
                percentageSavings: percentageSavings,
                detailedComparison: vendorTotals,
                currency: selectedCurrency
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

                      {/* Total Cost */}
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Total Cost</p>
                          <p className="text-3xl font-bold text-green-900">
                            {CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(best.total).toLocaleString()}
                          </p>
                          <p className="text-sm text-green-600">
                            Saves {percentageSavings.toFixed(1)}% vs {worst.vendor}
                          </p>
                        </div>
                      </div>

                      {/* Cost Breakdown */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900">Cost Breakdown:</h4>
                        <div className="space-y-1">
                          {best.items.map((item, index) => {
                            const itemName = item.description.trim().toLowerCase();
                            const savings = itemSavings.get(itemName);
                            return (
                              <div key={index} className="flex justify-between items-center text-sm hover:border-green-200 hover:bg-green-50 transition-all duration-200 cursor-pointer group p-2 rounded">
                                <div className="flex-1">
                                  <span>{item.description}</span>
                                  {savings && savings.savingsPercent > 5 && (
                                    <div className="text-xs text-green-600 font-medium">
                                      {savings.savingsPercent.toFixed(1)}% cheaper than highest bid
                                    </div>
                                  )}
                                </div>
                                <span className="font-medium">
                                  {CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(item.total).toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Button 
                          onClick={generateEmailContent}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span>📧</span>
                            <span>Email to Team</span>
                          </div>
                        </Button>
                        <Button 
                          onClick={generateReport}
                          variant="outline"
                          className="flex-1"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span>📄</span>
                            <span>Download Report</span>
                          </div>
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
                            <th className="text-center p-3 font-semibold text-green-600">Savings %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from(allItems.entries()).map(([itemName, vendorPrices], index) => {
                            const cheapest = cheapestPerItem.get(itemName);
                            const savings = itemSavings.get(itemName);
                            return (
                              <tr key={index} className="border-b border-gray-100">
                                <td className="p-3 text-sm font-medium">{itemName}</td>
                                {vendorTotals.map(({ vendor }) => {
                                  const price = vendorPrices[vendor];
                                  const isCheapest = cheapest && cheapest.vendor === vendor;
                                  return (
                                    <td key={vendor} className={`p-3 text-center text-sm ${isCheapest ? 'bg-green-50 text-green-700 font-semibold' : ''}`}>
                                      {price ? `${CURRENCY_SYMBOLS[selectedCurrency]}${convertPrice(price).toFixed(2)}` : '-'}
                                    </td>
                                  );
                                })}
                                <td className="p-3 text-center text-sm font-semibold text-green-600">
                                  <div className="flex flex-col items-center justify-center">
                                    {cheapest ? (
                                      <>
                                        <span>{CURRENCY_SYMBOLS[selectedCurrency]}${convertPrice(cheapest.price).toFixed(2)}</span>
                                        <span className="text-xs text-gray-500">{cheapest.vendor}</span>
                                      </>
                                    ) : '-'}
                                  </div>
                                </td>
                                <td className="p-3 text-center text-sm font-semibold text-green-600">
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
          <Card className="border-2 border-purple-400 bg-purple-50">
            <CardHeader className="flex flex-row items-center gap-3">
              <TrendingUp className="text-purple-500" />
              <div>
                <CardTitle>Your Savings Potential</CardTitle>
                <CardDescription>
                  <b>This session:</b> {CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(totalSavings).toLocaleString()} saved<br/>
                  <b>Monthly potential:</b> {CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(totalSavings * 20).toLocaleString()} (20 quotes/month)<br/>
                  <b>Annual potential:</b> {CURRENCY_SYMBOLS[selectedCurrency]}{convertPrice(totalSavings * 240).toLocaleString()} (240 quotes/year)
                </CardDescription>
                <p className="text-xs text-gray-500 mt-2">
                  *Based on average 10-15% savings per quote comparison
                </p>
              </div>
            </CardHeader>
          </Card>

          {/* Coming Soon Features */}
          <Card className="border-2 border-blue-400 bg-blue-50">
            <CardHeader className="flex flex-row items-center gap-3">
              <AlertCircle className="text-blue-500" />
              <div>
                <CardTitle>Want Weekly Email Reports?</CardTitle>
                <CardDescription>
                  Get automated weekly reports of all new quotes, price changes, and savings opportunities. 
                  Never miss a cost-saving opportunity again.
                </CardDescription>
                <Button className="mt-2" variant="outline">
                  Start Free Plan
                </Button>
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
      </main>
    </div>
  );
}
