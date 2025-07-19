"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";
import FileUpload from "@/components/FileUpload";
import QuoteHistory from "@/components/QuoteHistory";
import { api } from "@/utils/api";

interface QuoteItem {
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  deliveryTime: string;
  total: number;
}

interface User {
  id: string;
  email: string;
  name?: string;
}

export default function Home() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [results, setResults] = useState<Array<{fileName: string, result: unknown}>>([]);
  const [showHistory, setShowHistory] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
                      {(result as {quotes?: unknown[]})?.quotes?.map((quote: unknown, index: number) => (
                        <div key={index} className="border rounded-lg p-4 mb-4">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium">{(quote as {vendorName?: string})?.vendorName || 'Unknown Vendor'}</h4>
                            <Badge variant="outline">{(quote as {quoteNumber?: string})?.quoteNumber || 'N/A'}</Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600">Quote Date</p>
                              <p className="font-medium">{(quote as {quoteDate?: string})?.quoteDate || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Valid Until</p>
                              <p className="font-medium">{(quote as {validUntil?: string})?.validUntil || 'N/A'}</p>
                            </div>
                          </div>
                          {/* Items */}
                          <div>
                            <h5 className="font-medium mb-2">Items</h5>
                            <div className="space-y-2">
                              {(quote as {items?: unknown[]})?.items?.map((item: unknown, itemIndex: number) => (
                                <div key={itemIndex} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                  <div>
                                    <p className="font-medium">{(item as {description?: string})?.description || 'Unknown Item'}</p>
                                    <p className="text-sm text-gray-600">
                                      SKU: {(item as {sku?: string})?.sku || 'N/A'} | 
                                      Qty: {(item as {quantity?: number})?.quantity || 0}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">
                                      ${((item as {unitPrice?: number})?.unitPrice || 0).toFixed(2)}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Total: ${((item as {total?: number})?.total || 0).toFixed(2)}
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
                          {(result as {recommendation?: string})?.recommendation || 'No recommendation available'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

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
