"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/utils/api";

interface Quote {
  id: string;
  filename: string;
  file_type: string;
  created_at: string;
  total_cost?: number;
  vendor_count?: number;
  vendor_name?: string;
}

interface Analytics {
  total_quotes: number;
  total_value: number;
  avg_quote_value: number;
  top_vendors: string[];
}

export default function QuoteHistory() {
  const { token } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchQuoteHistory();
      fetchAnalytics();
    }
  }, [token]);

  const fetchQuoteHistory = async () => {
    try {
      const data = await api.getQuoteHistory(20);
      setQuotes(data.quotes || []);
    } catch (error) {
      console.error('Failed to fetch quote history:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading quote history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Summary */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Analytics Summary</CardTitle>
            <CardDescription>
              Overview of your procurement activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Quotes</p>
                <p className="text-2xl font-bold text-blue-600">
                  {analytics.total_quotes}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-green-600">
                  ${analytics.total_value?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Avg Quote Value</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${analytics.avg_quote_value?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quote History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Quote History</CardTitle>
          <CardDescription>
            Recent quote analyses and their results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No quotes found. Upload your first quote to get started!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Vendors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">
                      {quote.filename}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {quote.file_type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(quote.created_at)}
                    </TableCell>
                    <TableCell>
                      {quote.total_cost ? `$${quote.total_cost.toLocaleString()}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {quote.vendor_name || 'Unknown'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 