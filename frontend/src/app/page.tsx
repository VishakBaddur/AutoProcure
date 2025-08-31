'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Zap, 
  TrendingUp, 
  Shield, 
  Brain, 
  BarChart3, 
  DollarSign,
  Clock,
  CheckCircle,
  Star,
  Play,
  ChevronRight,
  Sparkles,
  Target,
  Users,
  Globe,
  Award,
  Upload,
  FileText,
  Calculator,
  Building,
  Trophy,
  AlertCircle,
  Search,
  Download
} from 'lucide-react';

// Cool CSS-based 3D floating elements
function FloatingElements({ mousePosition }: { mousePosition: { x: number; y: number } }) {
  return (
    <div className="w-64 h-64 mx-auto mb-12 relative perspective-1000">
      <div 
        className="absolute inset-0 transform-style-preserve-3d animate-spin-slow"
        style={{
          transform: mousePosition.x > 0 ? 
            `rotateY(${(mousePosition.x / window.innerWidth - 0.5) * 20}deg) rotateX(${-(mousePosition.y / window.innerHeight - 0.5) * 20}deg)` : 
            'rotateY(0deg) rotateX(0deg)'
        }}
      >
        <div className="absolute w-32 h-32 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full opacity-80 animate-float" style={{transform: 'translateZ(50px)'}}></div>
        <div className="absolute w-24 h-24 bg-gradient-to-r from-gray-500 to-gray-700 rounded-full opacity-60 animate-float-delayed" style={{transform: 'translateZ(25px) translateX(40px)'}}></div>
        <div className="absolute w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full opacity-40 animate-float-fast" style={{transform: 'translateZ(75px) translateX(-30px)'}}></div>
      </div>
    </div>
  );
}

// Interactive Particle Background Component
function ParticleBackground({ mousePosition }: { mousePosition: { x: number; y: number } }) {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    speed: Math.random() * 2 + 0.5,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full opacity-20"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            x: mousePosition.x > 0 ? [
              particle.x,
              particle.x + (mousePosition.x / window.innerWidth) * 20 - 10,
              particle.x
            ] : particle.x,
            y: mousePosition.y > 0 ? [
              particle.y,
              particle.y + (mousePosition.y / window.innerHeight) * 20 - 10,
              particle.y
            ] : [0, -100, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: mousePosition.x > 0 ? [1, 1.2, 1] : [1, 1, 1],
          }}
          transition={{
            duration: particle.speed * 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

// Enterprise-Grade Card Component
function EnterpriseCard({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={`enterprise-card p-8 ${className}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.8, 
        delay: delay * 0.1,
        ease: "easeOut"
      }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 35px 60px -12px rgba(0, 0, 0, 0.35)",
        borderColor: "rgba(156, 163, 175, 0.3)"
      }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
}

// Enterprise Button Component
function EnterpriseButton({ 
  children, 
  onClick, 
  className = "", 
  variant = "primary" 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const baseClasses = "enterprise-button transition-all duration-300 font-semibold";
  const variantClasses = {
    primary: "bg-gradient-to-r from-gray-700 to-gray-800 border-gray-600 hover:from-gray-600 hover:to-gray-700",
    secondary: "bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800/50 hover:text-white",
    ghost: "bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-gray-800/30"
  };

  return (
    <motion.button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      whileHover={{ 
        scale: 1.05,
        y: -2
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.button>
  );
}

// Animated Counter Component
function AnimatedCounter({ end, duration = 2 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (inView) {
      let start = 0;
      const increment = end / (duration * 60);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 1000 / 60);
      return () => clearInterval(timer);
    }
  }, [inView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

// Interactive Demo Component
function InteractiveDemo() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDemo = () => {
    setIsAnalyzing(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  return (
    <EnterpriseCard className="max-w-md mx-auto">
      <div className="text-center">
        <motion.div
          className="w-16 h-16 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full mx-auto mb-4 flex items-center justify-center"
          animate={{ rotate: isAnalyzing ? 360 : 0 }}
          transition={{ duration: 2, repeat: isAnalyzing ? Infinity : 0 }}
        >
          <Brain className="w-8 h-8 text-white" />
        </motion.div>
        
        <h3 className="text-xl font-bold mb-2">Try AutoProcure Now</h3>
        <p className="text-gray-300 mb-4">Experience AI-powered procurement in action</p>
        
        {!isAnalyzing ? (
          <motion.button
            onClick={handleDemo}
            className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-cyan-700 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play className="w-4 h-4 inline mr-2" />
            Start Demo
          </motion.button>
        ) : (
          <div className="space-y-3">
            <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <p className="text-sm text-gray-400">
              {progress < 30 && "Analyzing quote structure..."}
              {progress >= 30 && progress < 60 && "Extracting vendor data..."}
              {progress >= 60 && progress < 90 && "Calculating margins..."}
              {progress >= 90 && "Generating insights..."}
            </p>
          </div>
        )}
      </div>
    </EnterpriseCard>
  );
}

// API functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
  
  const result = await response.json();
  return result;
};

// Main Landing Page Component
export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  // File upload states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [totalSavings, setTotalSavings] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleFileUpload = async (files: File[]) => {
    setIsUploading(true);
    setCurrentResult(null);
    setShowResults(false);

    try {
      let result: any;
      if (files.length === 1) {
        result = await uploadFile(files[0]);
        console.log('Single file result:', result);
        setCurrentResult(result);
      } else {
        result = await uploadMultipleFiles(files);
        console.log('Multi-file result:', result);
        setCurrentResult(result);
      }
      
      setShowResults(true);
      
      // Calculate total savings for multi-vendor analysis
      const quotes = result.multi_vendor_analysis?.quotes || result.quotes || [];
      if (result.comparison && result.comparison.costSavings) {
        setTotalSavings(result.comparison.costSavings);
      } else if (quotes.length > 1) {
        // Calculate savings manually
        const totals = quotes.map((quote: any) => 
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
    console.log('Files selected:', files);
    setSelectedFiles(files);
  };

  const handleUpload = () => {
    console.log('Upload button clicked, files:', selectedFiles);
    if (selectedFiles.length > 0) {
      console.log('Starting file upload...');
      handleFileUpload(selectedFiles);
    } else {
      console.log('No files selected');
      alert('Please select files first');
    }
  };

  const downloadResults = (format: 'json' | 'csv' | 'pdf') => {
    if (!currentResult) return;
    
    // Get the correct quotes array
    const quotes = currentResult.multi_vendor_analysis?.quotes || currentResult.quotes || [];
    
    let content = '';
    let filename = 'autoprocure-analysis';
    
    if (format === 'json') {
      content = JSON.stringify(currentResult, null, 2);
      filename += '.json';
    } else if (format === 'csv') {
      // Create CSV content
      content = 'Vendor,Item,Quantity,Unit Price,Total\n';
      quotes.forEach((quote: any) => {
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

  // Scroll functions
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToUpload = () => {
    const uploadSection = document.getElementById('upload-section');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const stats = [
    { label: "Quotes Analyzed", value: 15420, icon: BarChart3 },
    { label: "Savings Generated", value: 2840000, prefix: "$", suffix: "+", icon: DollarSign },
    { label: "Time Saved", value: 1240, suffix: "hrs", icon: Clock },
    { label: "Happy Clients", value: 89, suffix: "%", icon: Users },
  ];

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced machine learning algorithms analyze every quote for hidden opportunities and risks.",
      gradient: "from-gray-600 to-gray-800"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Process complex quotes in seconds, not hours. Get insights instantly when you need them most.",
      gradient: "from-gray-700 to-gray-900"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption and compliance. Your data is protected with the highest security standards.",
      gradient: "from-gray-800 to-gray-950"
    },
    {
      icon: TrendingUp,
      title: "Smart Insights",
      description: "Predictive analytics help you make better procurement decisions and maximize your savings.",
      gradient: "from-gray-600 to-gray-800"
    }
  ];

  const renderResults = () => {
    if (!currentResult) return null;

    // Calculate time saved (estimate: manual comparison takes 3 hours, automated takes 2 minutes)
    const manualTimeHours = 3;
    const automatedTimeMinutes = 2;
    const timeSavedHours = manualTimeHours - (automatedTimeMinutes / 60);

    // Extract data from the correct structure
    const multiVendorAnalysis = currentResult.multi_vendor_analysis;
    const quotes = multiVendorAnalysis?.quotes || [];
    const vendorRecommendations = multiVendorAnalysis?.vendor_recommendations || [];
    const recommendation = multiVendorAnalysis?.recommendation || currentResult.recommendation || "";
    const advancedAnalysis = currentResult.advanced_analysis || {};
    
    // Calculate total cost from quotes
    const totalCost = quotes.reduce((sum: number, quote: any) => {
      return sum + (quote.items?.reduce((itemSum: number, item: any) => itemSum + item.total, 0) || 0);
    }, 0);

    // Get winner information
    const winner = vendorRecommendations.find((rec: any) => rec.is_winner);
    const winnerName = winner?.vendor_name || winner?.vendorName || "Unknown";
    const winnerCost = winner?.total_cost || winner?.totalCost || 0;

    // Debug: Log the actual structure
    console.log('Current Result:', currentResult);
    console.log('Multi Vendor Analysis:', multiVendorAnalysis);
    console.log('Quotes:', quotes);
    console.log('Vendor Recommendations:', vendorRecommendations);
    console.log('Winner:', winner);
    console.log('Total Cost:', totalCost);



    return (
      <div className="space-y-6">
        {/* Debug Info - Remove after testing */}
        {process.env.NODE_ENV === 'development' && currentResult && (
          <EnterpriseCard>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Debug Info</h3>
              <pre className="text-xs text-gray-400 text-left overflow-auto max-h-40">
                {JSON.stringify(currentResult, null, 2)}
              </pre>
            </div>
          </EnterpriseCard>
        )}

        {/* Time Saved Counter - DEMO FEATURE */}
        <EnterpriseCard delay={1}>
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-6">Performance Impact</h3>
            <div className="grid grid-cols-3 gap-8 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-red-400 mb-2">{manualTimeHours}h</div>
                <div className="text-sm text-gray-400 font-medium">Manual Processing</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">{automatedTimeMinutes}m</div>
                <div className="text-sm text-gray-400 font-medium">AI Processing</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">{timeSavedHours.toFixed(1)}h</div>
                <div className="text-sm text-gray-400 font-medium">Time Saved</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-4">
              <p className="text-gray-300 text-lg font-semibold">
                ⚡ <span className="text-green-400">{(timeSavedHours/manualTimeHours*100).toFixed(0)}% faster</span> than traditional methods
              </p>
            </div>
          </div>
        </EnterpriseCard>

        {/* Main Results */}
        <EnterpriseCard>
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-gray-300" />
            <h3 className="text-xl font-semibold text-white">Analysis Results</h3>
          </div>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-400">Total Vendors</p>
                <p className="text-2xl font-bold text-white">
                  {quotes.length || 1}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-400">Total Cost</p>
                <p className="text-2xl font-bold text-green-400">
                  ${totalCost.toLocaleString()}
                </p>
              </div>
              {totalSavings > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-400">Potential Savings</p>
                  <p className="text-2xl font-bold text-blue-400">
                    ${totalSavings.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          
          {/* Winner Badge */}
          {quotes.length > 1 && (
            <div className="mt-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">🏆 Recommended Winner</h3>
                  {(() => {
                    // Use the pre-calculated winner information
                    if (winnerName && winnerName !== "Unknown") {
                      return (
                        <>
                          <p className="text-gray-300">{winnerName}</p>
                          <p className="text-sm text-gray-400">Total Cost: ${winnerCost.toLocaleString()}</p>
                        </>
                      );
                    }
                    
                    // Fallback to manual calculation
                    const manualWinner = quotes.reduce((best: any, current: any) => {
                      const currentTotal = current.items?.reduce((sum: number, item: any) => sum + item.total, 0) || 0;
                      const bestTotal = best.items?.reduce((sum: number, item: any) => sum + item.total, 0) || 0;
                      return currentTotal < bestTotal ? current : best;
                    });
                    const manualWinnerTotal = manualWinner.items?.reduce((sum: number, item: any) => sum + item.total, 0) || 0;
                    return (
                      <>
                        <p className="text-gray-300">{manualWinner.vendorName || 'Unknown Vendor'}</p>
                        <p className="text-sm text-gray-400">Total Cost: ${manualWinnerTotal.toLocaleString()}</p>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-gray-800/30 rounded-lg">
            <h3 className="font-semibold text-white mb-2">AI Recommendation</h3>
            <p className="text-gray-300 whitespace-pre-line">
              {recommendation || currentResult.recommendation || currentResult.multi_vendor_analysis?.recommendation || "Analysis complete. Review the comparison below for detailed insights."}
            </p>
          </div>
        </EnterpriseCard>

        {/* Scenario Simulation - DEMO FEATURE */}
        {quotes.length > 1 && (
          <EnterpriseCard>
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-5 w-5 text-gray-300" />
              <h3 className="text-xl font-semibold text-white">Scenario Simulation</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <h4 className="font-semibold text-white mb-2">🎯 Split Order Analysis</h4>
                <p className="text-gray-300 mb-3">
                  What if you buy each item from the vendor offering the lowest price?
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Best Single Vendor</p>
                    <p className="text-lg font-bold text-white">
                      ${quotes.length > 0 ? Math.min(...quotes.map((q: any) => 
                        q.items.reduce((sum: number, item: any) => sum + item.total, 0)
                      )).toLocaleString() : '0'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Split Order Savings</p>
                    <p className="text-lg font-bold text-green-400">
                      ${totalSavings.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Advanced Scenario Simulation */}
              {quotes.length > 1 && (
                <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg mt-4">
                  <h4 className="font-semibold text-white mb-2">📊 Advanced Scenario Simulation</h4>
                  <p className="text-gray-300 mb-3">
                    What if you buy 60% from the cheapest vendor and 40% from the second cheapest?
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">60% from Cheapest</p>
                      <p className="text-lg font-bold text-blue-400">
                        ${quotes.length > 0 ? (Math.min(...quotes.map((q: any) => 
                          q.items.reduce((sum: number, item: any) => sum + item.total, 0)
                        )) * 0.6).toLocaleString() : '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">40% from Second</p>
                      <p className="text-lg font-bold text-blue-400">
                        ${quotes.length > 1 ? (quotes.sort((a: any, b: any) => 
                          a.items.reduce((sum: number, item: any) => sum + item.total, 0) - 
                          b.items.reduce((sum: number, item: any) => sum + item.total, 0)
                        )[1].items.reduce((sum: number, item: any) => sum + item.total, 0) * 0.4).toLocaleString() : '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Scenario</p>
                      <p className="text-lg font-bold text-green-400">
                        ${quotes.length > 1 ? (
                          Math.min(...quotes.map((q: any) => 
                            q.items.reduce((sum: number, item: any) => sum + item.total, 0)
                          )) * 0.6 + 
                          quotes.sort((a: any, b: any) => 
                            a.items.reduce((sum: number, item: any) => sum + item.total, 0) - 
                            b.items.reduce((sum: number, item: any) => sum + item.total, 0)
                          )[1].items.reduce((sum: number, item: any) => sum + item.total, 0) * 0.4
                        ).toLocaleString() : '0'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </EnterpriseCard>
        )}

        {/* Side-by-Side Comparison Table - DEMO FEATURE */}
        {quotes.length > 1 && (
          <EnterpriseCard>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-gray-300" />
              <h3 className="text-xl font-semibold text-white">Side-by-Side Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-3 text-gray-400 font-medium">Item</th>
                    {quotes.map((quote: any, index: number) => (
                      <th key={index} className="text-center py-2 px-3 text-gray-400 font-medium">
                        {quote.vendorName}
                      </th>
                    ))}
                    <th className="text-center py-2 px-3 text-gray-400 font-medium">Best Price</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes[0]?.items?.map((item: any, itemIndex: number) => {
                    const prices = quotes.map((quote: any) => {
                      const matchingItem = quote.items?.find((i: any) => 
                        i.description.toLowerCase().includes(item.description.toLowerCase().split(' ')[0])
                      );
                      return matchingItem ? matchingItem.unitPrice : null;
                    }).filter(Boolean);
                    
                    const bestPrice = Math.min(...prices);
                    const bestVendorIndex = prices.indexOf(bestPrice);
                    
                    return (
                      <tr key={itemIndex} className="border-b border-gray-800">
                        <td className="py-2 px-3 text-white font-medium">
                          {item.description}
                        </td>
                        {quotes.map((quote: any, quoteIndex: number) => {
                          const matchingItem = quote.items?.find((i: any) => 
                            i.description.toLowerCase().includes(item.description.toLowerCase().split(' ')[0])
                          );
                          const price = matchingItem ? matchingItem.unitPrice : 'N/A';
                          const isBest = quoteIndex === bestVendorIndex && price === bestPrice;
                          
                          return (
                            <td key={quoteIndex} className={`py-2 px-3 text-center ${
                              isBest ? 'text-green-400 font-bold' : 'text-gray-300'
                            }`}>
                              {price !== 'N/A' ? `$${price.toFixed(2)}` : price}
                            </td>
                          );
                        })}
                        <td className="py-2 px-3 text-center text-green-400 font-bold">
                          ${bestPrice.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </EnterpriseCard>
        )}

        {/* Vendor Quotes with Suspicious Item Detection */}
        <EnterpriseCard>
          <div className="flex items-center gap-2 mb-4">
            <Building className="h-5 w-5 text-gray-300" />
            <h3 className="text-xl font-semibold text-white">Vendor Quotes Analysis</h3>
          </div>
          
          {/* Suspicious Items Detection - DEMO FEATURE */}
          {quotes.length > 1 && advancedAnalysis.obfuscation_detection && (
            <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <h4 className="font-semibold text-yellow-400">⚠️ Suspicious Items Detected</h4>
              </div>
              <div className="space-y-2 text-sm text-gray-300">
                {advancedAnalysis.obfuscation_detection.results.map((result: any, index: number) => (
                  result.analysis.issues.map((issue: any, issueIndex: number) => (
                    <p key={`${index}-${issueIndex}`}>• <strong>{result.vendor}</strong>: {issue.description}</p>
                  ))
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {quotes.map((quote: any, index: number) => {
              const totalCost = quote.items?.reduce((sum: number, item: any) => sum + item.total, 0) || 0;
              const isWinner = winnerName === quote.vendorName;
              
              return (
                <div key={index} className={`border rounded-lg p-4 ${
                  isWinner ? 'bg-gray-800/50 border-green-500/30' : 'bg-gray-800/30 border-gray-700'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg text-white">{quote.vendorName || 'Unknown Vendor'}</h3>
                    <div className="flex items-center gap-2">
                      {isWinner && (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                          🏆 WINNER
                        </span>
                      )}
                      <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded-full">
                        ${totalCost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {quote.items?.map((item: any, itemIndex: number) => {
                      // Check if this item has suspicious pricing
                      const isSuspicious = item.unitPrice > 1000 || item.quantity > 1000;
                      
                      return (
                        <div key={itemIndex} className={`flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0 ${
                          isSuspicious ? 'bg-red-900/10 border-l-2 border-l-red-500' : ''
                        }`}>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white">{item.description}</p>
                              {isSuspicious && (
                                <span className="px-1 py-0.5 bg-red-500 text-white text-xs rounded">
                                  ⚠️
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400">
                              SKU: {item.sku} | Qty: {item.quantity.toLocaleString()}
                              {item.deliveryTime && ` | Delivery: ${item.deliveryTime}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-white">${item.unitPrice.toFixed(2)}</p>
                            <p className="text-sm text-gray-400">Total: ${item.total.toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-white">Total:</span>
                      <span className="font-bold text-lg text-white">
                        ${totalCost.toFixed(2)}
                      </span>
                    </div>
                    
                    {/* Terms */}
                    {quote.terms && (
                      <div className="mt-2 text-sm text-gray-400">
                        <p>Payment: {quote.terms.payment}</p>
                        <p>Warranty: {quote.terms.warranty}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </EnterpriseCard>

        {/* Audit-Friendly Export Options */}
        <EnterpriseCard>
          <div className="flex items-center gap-2 mb-4">
            <Download className="h-5 w-5 text-gray-300" />
            <h3 className="text-xl font-semibold text-white">Audit-Friendly Export</h3>
          </div>
          <p className="text-gray-400 mb-4 text-sm">
            Generate comprehensive reports for procurement audits, compliance reviews, and stakeholder presentations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <motion.button 
              onClick={() => downloadResults('csv')} 
              className="border border-gray-600 text-gray-300 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-left"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4" />
                <span className="font-semibold">CSV Report</span>
              </div>
              <p className="text-xs text-gray-400">Line-by-line comparison for Excel analysis</p>
            </motion.button>
            <motion.button 
              onClick={() => downloadResults('json')} 
              className="border border-gray-600 text-gray-300 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-left"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4" />
                <span className="font-semibold">JSON Data</span>
              </div>
              <p className="text-xs text-gray-400">Complete analysis data for integration</p>
            </motion.button>
            <motion.button 
              onClick={() => downloadResults('pdf')} 
              className="border border-gray-600 text-gray-300 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-left"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Download className="w-4 h-4" />
                <span className="font-semibold">PDF Report</span>
              </div>
              <p className="text-xs text-gray-400">Professional report for stakeholders</p>
            </motion.button>
          </div>
          <div className="mt-4 p-3 bg-gray-800/30 rounded-lg">
            <p className="text-sm text-gray-400">
              <strong>Audit Trail:</strong> All exports include timestamps, analysis metadata, and decision rationale for compliance purposes.
            </p>
          </div>
        </EnterpriseCard>
      </div>
    );
  };

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Procurement Director",
      company: "TechFlow Inc",
      content: "AutoProcure saved us $2.4M in our first quarter. The AI insights are game-changing.",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      role: "Operations Manager", 
      company: "Global Manufacturing",
      content: "We reduced our quote processing time by 85%. The ROI was immediate and substantial.",
      rating: 5
    },
    {
      name: "Dr. Emily Watson",
      role: "CFO",
      company: "Healthcare Solutions",
      content: "The margin risk detection caught issues we never would have spotted manually.",
      rating: 5
    }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative overflow-hidden">
      <ParticleBackground mousePosition={mousePosition} />
      
      {/* Interactive Animated Background Gradient */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{
          background: [
            `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(107, 114, 128, 0.2) 0%, transparent 50%)`,
            `radial-gradient(circle at ${mousePosition.x + 50}px ${mousePosition.y + 50}px, rgba(156, 163, 175, 0.15) 0%, transparent 50%)`,
            `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(107, 114, 128, 0.2) 0%, transparent 50%)`,
          ]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Additional Interactive Background Elements */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: mousePosition.x > 0 ? [
            `conic-gradient(from ${mousePosition.x / 10}deg at ${mousePosition.x}px ${mousePosition.y}px, rgba(75, 85, 99, 0.1) 0deg, transparent 60deg, transparent 360deg)`,
            `conic-gradient(from ${mousePosition.x / 10 + 180}deg at ${mousePosition.x}px ${mousePosition.y}px, rgba(75, 85, 99, 0.1) 0deg, transparent 60deg, transparent 360deg)`,
            `conic-gradient(from ${mousePosition.x / 10}deg at ${mousePosition.x}px ${mousePosition.y}px, rgba(75, 85, 99, 0.1) 0deg, transparent 60deg, transparent 360deg)`,
          ] : "none"
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.button
            onClick={scrollToTop}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2 hover:scale-105 transition-transform cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-gray-300 to-gray-100 bg-clip-text text-transparent">
              AutoProcure
            </span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden md:flex items-center space-x-8"
          >
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
            <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
                         <motion.button
               onClick={scrollToUpload}
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               className="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-6 py-2 rounded-xl font-semibold border border-gray-600"
             >
               Get Started
             </motion.button>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-40 px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
                         <motion.div
               animate={{ rotate: [0, 360] }}
               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
               className="inline-block mb-4"
             >
               <div className="w-16 h-16 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center">
                 <Sparkles className="w-8 h-8 text-white" />
               </div>
             </motion.div>
             
                         <h1 className="text-6xl md:text-8xl font-bold mb-6 text-shadow">
              <span className="bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-clip-text text-transparent text-glow">
                The Future of
              </span>
              <br />
              <span className="bg-gradient-to-r from-gray-100 via-gray-300 to-gray-100 bg-clip-text text-transparent text-glow">
                Procurement
              </span>
            </h1>
             
             <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
               Transform supplier quotes into actionable intelligence with AI-powered analysis. 
               <span className="text-gray-200 font-semibold"> Save millions. Make better decisions.</span>
             </p>

                         <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
               <motion.button
                 onClick={scrollToUpload}
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 className="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center group border border-gray-600"
               >
                 Start Free Trial
                 <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
               </motion.button>
               
               <motion.button
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 className="border border-gray-600 text-white px-8 py-4 rounded-xl font-semibold text-lg backdrop-blur-sm hover:bg-gray-800/50 transition-all"
               >
                 <Play className="w-5 h-5 inline mr-2" />
                 Watch Demo
               </motion.button>
             </div>
          </motion.div>

                     {/* 3D Elements */}
           <motion.div
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 1, delay: 0.5 }}
             className="w-64 h-64 mx-auto mb-12"
           >
             <FloatingElements mousePosition={mousePosition} />
           </motion.div>

                     {/* Stats */}
                     <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <EnterpriseCard key={index} className="text-center" delay={index}>
                <stat.icon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white mb-1">
                  {stat.prefix}<AnimatedCounter end={stat.value} />{stat.suffix}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </EnterpriseCard>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-30 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
                         <h2 className="text-4xl md:text-5xl font-bold mb-6">
               <span className="bg-gradient-to-r from-gray-300 to-gray-100 bg-clip-text text-transparent">
                 Why AutoProcure?
               </span>
             </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Built by procurement professionals, for procurement professionals. 
              Experience the power of AI-driven insights.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <EnterpriseCard className="h-full">
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </EnterpriseCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

             {/* File Upload Section */}
       <section id="upload-section" className="relative z-20 px-6 py-20">
         <div className="max-w-7xl mx-auto">
           <motion.div
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8 }}
             className="text-center mb-16"
           >
             <h2 className="text-4xl md:text-5xl font-bold mb-6">
               <span className="bg-gradient-to-r from-gray-300 to-gray-100 bg-clip-text text-transparent">
                 Try AutoProcure Now
               </span>
             </h2>
             <p className="text-xl text-gray-300 max-w-3xl mx-auto">
               Upload your vendor quotes and see the magic happen. 
               Get instant insights and recommendations.
             </p>
           </motion.div>

                       {/* File Upload Interface */}
            <div className="max-w-4xl mx-auto">
              <EnterpriseCard className="p-8" delay={0}>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Upload Vendor Quotes</h3>
                  <p className="text-gray-400">Drag and drop or select files to begin analysis</p>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Supported Formats: PDF, Excel, CSV
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      className="enterprise-input w-full file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-gray-700 file:to-gray-800 file:text-white hover:file:from-gray-600 hover:file:to-gray-700 file:transition-all file:duration-300"
                    />
                  </div>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Selected Files ({selectedFiles.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedFiles.map((file, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between bg-gray-800/30 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg flex items-center justify-center">
                              <FileText className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-gray-300 font-medium">{file.name}</span>
                          </div>
                          <span className="text-sm text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={selectedFiles.length === 0 || isUploading}
                  className={`w-full py-4 text-lg font-semibold rounded-xl transition-all duration-300 ${
                    selectedFiles.length > 0 && !isUploading
                      ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white border border-gray-600 hover:from-gray-600 hover:to-gray-700 hover:scale-105'
                      : 'bg-transparent border border-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isUploading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>AI Analysis in Progress...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <Brain className="w-6 h-6" />
                      <span>Analyze with AI</span>
                    </div>
                  )}
                </button>
             </EnterpriseCard>
           </div>

           {/* Results Section */}
           {showResults && currentResult && (
             <div className="max-w-6xl mx-auto mt-12">
               {renderResults()}
             </div>
           )}
         </div>
       </section>

      {/* Testimonials Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
                         <h2 className="text-4xl md:text-5xl font-bold mb-6">
               <span className="bg-gradient-to-r from-gray-300 to-gray-100 bg-clip-text text-transparent">
                 Trusted by Industry Leaders
               </span>
             </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <EnterpriseCard className="h-full">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role} at {testimonial.company}</div>
                  </div>
                </EnterpriseCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-0 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <EnterpriseCard>
                             <h2 className="text-4xl md:text-5xl font-bold mb-6">
                 <span className="bg-gradient-to-r from-gray-300 to-gray-100 bg-clip-text text-transparent">
                   Ready to Transform Your Procurement?
                 </span>
               </h2>
              <p className="text-xl text-gray-300 mb-8">
                Join hundreds of companies already saving millions with AutoProcure. 
                Start your free trial today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                 <motion.button
                   onClick={scrollToUpload}
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   className="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-8 py-4 rounded-xl font-semibold text-lg border border-gray-600"
                 >
                   Start Free Trial
                 </motion.button>
                 <motion.button
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   className="border border-gray-600 text-white px-8 py-4 rounded-xl font-semibold text-lg backdrop-blur-sm hover:bg-gray-800/50 transition-all"
                 >
                   Schedule Demo
                 </motion.button>
              </div>
            </EnterpriseCard>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-0 px-6 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
                     <div className="flex items-center justify-center space-x-2 mb-4">
             <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg flex items-center justify-center">
               <Sparkles className="w-5 h-5 text-white" />
             </div>
             <span className="text-xl font-bold bg-gradient-to-r from-gray-300 to-gray-100 bg-clip-text text-transparent">
               AutoProcure
             </span>
           </div>
          <p className="text-gray-400">
            © 2025 AutoProcure. The future of procurement intelligence.
          </p>
        </div>
      </footer>
    </div>
  );
}
