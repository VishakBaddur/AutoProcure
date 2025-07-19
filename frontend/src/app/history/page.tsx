"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { api } from "@/utils/api";

interface QuoteHistory {
  id: string;
  filename: string;
  vendor_name: string;
  total_cost: number;
  delivery_time: string;
  ai_recommendation: string;
  created_at: string;
}

interface Analytics {
  total_quotes: number;
  total_value: number;
  avg_delivery_time: string;
}

export default function HistoryPage() {
  const [quotes, setQuotes] = useState<QuoteHistory[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch quote history
      const quotesData = await api.getQuoteHistory(20);
      setQuotes(quotesData.quotes || []);
      
      // Fetch analytics
      const analyticsData = await api.getAnalytics();
      setAnalytics(analyticsData);
      
    } catch (err) {
      setError('Failed to load quote history');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="text-xl">Loading quote history...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Quote History
            </h1>
            <p className="text-xl text-gray-600">
              View and manage your analyzed vendor quotes
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">
              ← Back to Upload
            </Button>
          </Link>
        </div>

        {/* Analytics Summary */}
        {analytics && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Analytics Summary</CardTitle>
              <CardDescription>
                Overview of your quote analysis activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {analytics.total_quotes}
                  </div>
                  <div className="text-sm text-gray-600">Total Quotes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    ${analytics.total_value.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Value</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {analytics.avg_delivery_time}
                  </div>
                  <div className="text-sm text-gray-600">Avg Delivery</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quote History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Quotes</CardTitle>
            <CardDescription>
              Your most recent vendor quote analyses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <div className="text-red-600 mb-4">{error}</div>
                <Button onClick={fetchData} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : quotes.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-600 mb-4">No quotes found</div>
                <p className="text-sm text-gray-500 mb-4">
                  Upload your first vendor quote to see it here
                </p>
                <Link href="/">
                  <Button>Upload Quote</Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Recommendation</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="text-sm">
                        {formatDate(quote.created_at)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {quote.filename}
                      </TableCell>
                      <TableCell className="font-medium">
                        {quote.vendor_name || 'Unknown'}
                      </TableCell>
                      <TableCell className="font-bold">
                        ${quote.total_cost?.toLocaleString() || '0'}
                      </TableCell>
                      <TableCell>
                        {quote.delivery_time || 'N/A'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {quote.ai_recommendation || 'No recommendation'}
                      </TableCell>
                      <TableCell>
                        <Link href={`/quotes/${quote.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 