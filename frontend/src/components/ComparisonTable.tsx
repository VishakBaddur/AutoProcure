'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  FileText
} from 'lucide-react';
import { EnterpriseCard, EnterpriseButton } from './EnterpriseComponents';

interface QuoteItem {
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  deliveryTime: string;
  total: number;
  unit?: string;
}

interface VendorQuote {
  vendorName: string;
  items: QuoteItem[];
  terms: {
    payment: string;
    warranty: string;
  };
  reliability_score?: number;
  delivery_rating?: number;
  quality_rating?: number;
  totalCost: number;
  complianceScore: number;
  riskScore: number;
  anomalies: string[];
}

interface ComparisonTableProps {
  quotes: VendorQuote[];
  onExport: () => void;
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ quotes, onExport }) => {
  const [sortBy, setSortBy] = useState<'totalCost' | 'complianceScore' | 'riskScore'>('totalCost');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [normalizedItems, setNormalizedItems] = useState<Map<string, any>>(new Map());

  // Normalize units and create comparison grid
  useEffect(() => {
    const normalized = new Map();
    
    // Get all unique items across vendors
    const allItems = new Set<string>();
    quotes.forEach(quote => {
      quote.items.forEach(item => {
        allItems.add(item.description.toLowerCase().trim());
      });
    });

    // Normalize each item
    allItems.forEach(itemDesc => {
      const itemData = {
        description: itemDesc,
        vendors: new Map(),
        bestPrice: Infinity,
        worstPrice: 0,
        averagePrice: 0,
        totalQuantity: 0,
        unit: 'unit', // Default unit
        anomalies: [] as string[]
      };

      quotes.forEach(quote => {
        const matchingItem = quote.items.find(item => 
          item.description.toLowerCase().trim() === itemDesc
        );
        
        if (matchingItem) {
          const normalizedPrice = normalizePrice(matchingItem.unitPrice, matchingItem.unit || 'unit');
          itemData.vendors.set(quote.vendorName, {
            ...matchingItem,
            normalizedPrice,
            originalPrice: matchingItem.unitPrice,
            originalUnit: matchingItem.unit || 'unit'
          });
          
          itemData.bestPrice = Math.min(itemData.bestPrice, normalizedPrice);
          itemData.worstPrice = Math.max(itemData.worstPrice, normalizedPrice);
          itemData.totalQuantity += matchingItem.quantity;
        } else {
          // Missing item - anomaly
          itemData.anomalies.push(`Missing from ${quote.vendorName}`);
        }
      });

      // Calculate average price
      const prices = Array.from(itemData.vendors.values()).map(v => v.normalizedPrice);
      itemData.averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

      normalized.set(itemDesc, itemData);
    });

    setNormalizedItems(normalized);
  }, [quotes]);

  const normalizePrice = (price: number, unit: string): number => {
    // Basic unit normalization
    const unitMap: { [key: string]: number } = {
      'unit': 1,
      'each': 1,
      'piece': 1,
      'item': 1,
      'kg': 1,
      'kilogram': 1,
      'lb': 0.453592,
      'pound': 0.453592,
      'pack': 1,
      'box': 1,
      'case': 1,
      'dozen': 12,
      'gross': 144
    };

    const normalizedUnit = unit.toLowerCase().trim();
    const multiplier = unitMap[normalizedUnit] || 1;
    
    return price * multiplier;
  };

  const sortedQuotes = [...quotes].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortOrder === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  const handleSort = (column: 'totalCost' | 'complianceScore' | 'riskScore') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getAnomalyIcon = (anomaly: string) => {
    if (anomaly.includes('Missing')) return <XCircle className="w-4 h-4 text-red-500" />;
    if (anomaly.includes('Hidden')) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    if (anomaly.includes('Obfuscation')) return <Eye className="w-4 h-4 text-purple-500" />;
    return <AlertTriangle className="w-4 h-4 text-orange-500" />;
  };

  const getScoreColor = (score: number, type: 'compliance' | 'risk') => {
    if (type === 'compliance') {
      if (score >= 80) return 'text-green-400';
      if (score >= 60) return 'text-yellow-400';
      return 'text-red-400';
    } else {
      if (score <= 20) return 'text-green-400';
      if (score <= 40) return 'text-yellow-400';
      return 'text-red-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <EnterpriseCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Vendor Comparison Table
          </h2>
          <EnterpriseButton onClick={onExport} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </EnterpriseButton>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <span className="text-gray-300">Sort by:</span>
          <div className="flex gap-2">
            {[
              { key: 'totalCost', label: 'Total Cost', icon: DollarSign },
              { key: 'complianceScore', label: 'Compliance', icon: CheckCircle },
              { key: 'riskScore', label: 'Risk Score', icon: AlertTriangle }
            ].map(({ key, label, icon: Icon }) => (
              <EnterpriseButton
                key={key}
                variant={sortBy === key ? 'primary' : 'secondary'}
                onClick={() => handleSort(key as any)}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {label}
                {sortBy === key && (
                  sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                )}
              </EnterpriseButton>
            ))}
          </div>
        </div>
      </EnterpriseCard>

      {/* Vendor Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedQuotes.map((quote, index) => (
          <motion.div
            key={quote.vendorName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">{quote.vendorName}</h3>
              {index === 0 && (
                <span className="px-2 py-1 bg-green-900/50 text-green-300 text-xs rounded-full">
                  Best Value
                </span>
              )}
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Cost:</span>
                <span className="text-white font-medium">${quote.totalCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Compliance:</span>
                <span className={getScoreColor(quote.complianceScore, 'compliance')}>
                  {quote.complianceScore}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Risk Score:</span>
                <span className={getScoreColor(quote.riskScore, 'risk')}>
                  {quote.riskScore}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Items:</span>
                <span className="text-white">{quote.items.length}</span>
              </div>
            </div>

            {quote.anomalies.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="text-xs text-red-400 font-medium mb-1">Anomalies:</div>
                <div className="space-y-1">
                  {quote.anomalies.slice(0, 2).map((anomaly, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-xs text-red-300">
                      {getAnomalyIcon(anomaly)}
                      {anomaly}
                    </div>
                  ))}
                  {quote.anomalies.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{quote.anomalies.length - 2} more...
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Detailed Item Comparison */}
      <EnterpriseCard>
        <h3 className="text-xl font-semibold text-white mb-4">Line-Item Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-2 text-gray-300">Item Description</th>
                {quotes.map(quote => (
                  <th key={quote.vendorName} className="text-center py-3 px-2 text-gray-300 min-w-[120px]">
                    {quote.vendorName}
                  </th>
                ))}
                <th className="text-center py-3 px-2 text-gray-300">Best Price</th>
                <th className="text-center py-3 px-2 text-gray-300">Savings</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(normalizedItems.entries()).map(([itemDesc, itemData]) => (
                <tr key={itemDesc} className="border-b border-gray-800">
                  <td className="py-3 px-2 text-gray-300">
                    <div className="font-medium">{itemData.description}</div>
                    {itemData.anomalies.length > 0 && (
                      <div className="text-xs text-red-400 mt-1">
                        {itemData.anomalies.join(', ')}
                      </div>
                    )}
                  </td>
                  {quotes.map(quote => {
                    const vendorItem = itemData.vendors.get(quote.vendorName);
                    const isBestPrice = vendorItem && vendorItem.normalizedPrice === itemData.bestPrice;
                    
                    return (
                      <td key={quote.vendorName} className="py-3 px-2 text-center">
                        {vendorItem ? (
                          <div className={`${isBestPrice ? 'bg-green-900/30 rounded p-2' : ''}`}>
                            <div className="text-white font-medium">
                              ${vendorItem.normalizedPrice.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {vendorItem.quantity} {vendorItem.originalUnit}
                            </div>
                            {isBestPrice && (
                              <div className="text-xs text-green-400 font-medium">Best</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-red-400 text-xs">Missing</div>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-3 px-2 text-center">
                    <div className="text-green-400 font-medium">
                      ${itemData.bestPrice.toFixed(2)}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="text-green-400 font-medium">
                      ${(itemData.worstPrice - itemData.bestPrice).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {((itemData.worstPrice - itemData.bestPrice) / itemData.worstPrice * 100).toFixed(1)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EnterpriseCard>
    </div>
  );
};

export default ComparisonTable;
