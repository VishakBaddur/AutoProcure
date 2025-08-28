'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Float, Sphere } from '@react-three/drei';
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

// 3D Component for Hero Section
function FloatingElements() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Sphere args={[0.5, 32, 32]}>
          <meshStandardMaterial color="#6b7280" wireframe />
        </Sphere>
      </Float>
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.3}>
        <Sphere args={[0.3, 16, 16]} position={[2, 1, 0]}>
          <meshStandardMaterial color="#9ca3af" wireframe />
        </Sphere>
      </Float>
      <Float speed={2.5} rotationIntensity={0.7} floatIntensity={0.7}>
        <Sphere args={[0.4, 24, 24]} position={[-2, -1, 1]}>
          <meshStandardMaterial color="#d1d5db" wireframe />
        </Sphere>
      </Float>
    </Canvas>
  );
}

// Particle Background Component
function ParticleBackground() {
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
            y: [0, -100, 0],
            opacity: [0.2, 0.6, 0.2],
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

// Glassmorphism Card Component
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={`backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl ${className}`}
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
      }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {children}
    </motion.div>
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
    <GlassCard className="max-w-md mx-auto">
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
    </GlassCard>
  );
}

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

// Main Landing Page Component
export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  
  // File upload states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [totalSavings, setTotalSavings] = useState(0);
  
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

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

    return (
      <div className="space-y-6">
        {/* Main Results */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-gray-300" />
            <h3 className="text-xl font-semibold text-white">Analysis Results</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-400">Total Vendors</p>
              <p className="text-2xl font-bold text-white">{currentResult.comparison?.summary?.total_vendors || currentResult.comparison?.vendorCount || 1}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-400">Total Cost</p>
              <p className="text-2xl font-bold text-green-400">
                ${(currentResult.comparison?.summary?.total_cost || currentResult.comparison?.totalCost || 0).toLocaleString()}
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
          {currentResult.comparison?.summary?.winner && (
            <div className="mt-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">🏆 Recommended Winner</h3>
                  <p className="text-gray-300">{currentResult.comparison.summary.winner.vendor_name}</p>
                  <p className="text-sm text-gray-400">Total Cost: ${currentResult.comparison.summary.winner.total_cost.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-gray-800/30 rounded-lg">
            <h3 className="font-semibold text-white mb-2">AI Recommendation</h3>
            <p className="text-gray-300 whitespace-pre-line">{currentResult.recommendation}</p>
          </div>
        </GlassCard>

        {/* Vendor Quotes */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <Building className="h-5 w-5 text-gray-300" />
            <h3 className="text-xl font-semibold text-white">Vendor Quotes</h3>
          </div>
          <div className="space-y-4">
            {currentResult.quotes?.map((quote: any, index: number) => {
              const totalCost = quote.items?.reduce((sum: number, item: any) => sum + item.total, 0) || 0;
              const isWinner = currentResult.comparison?.summary?.winner?.vendor_name === quote.vendorName;
              
              return (
                <div key={index} className={`border rounded-lg p-4 ${
                  isWinner ? 'bg-gray-800/50 border-green-500/30' : 'bg-gray-800/30 border-gray-700'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg text-white">{quote.vendorName}</h3>
                    {isWinner && (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                        🏆 WINNER
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {quote.items?.map((item: any, itemIndex: number) => (
                      <div key={itemIndex} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                        <div className="flex-1">
                          <p className="font-medium text-white">{item.description}</p>
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
                    ))}
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
        </GlassCard>

        {/* Export Options */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <Download className="h-5 w-5 text-gray-300" />
            <h3 className="text-xl font-semibold text-white">Export Results</h3>
          </div>
          <div className="flex gap-2">
            <motion.button 
              onClick={() => downloadResults('json')} 
              className="border border-gray-600 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Export JSON
            </motion.button>
            <motion.button 
              onClick={() => downloadResults('csv')} 
              className="border border-gray-600 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Export CSV
            </motion.button>
          </div>
        </GlassCard>
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
      <ParticleBackground />
      
      {/* Animated Background Gradient */}
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(107, 114, 128, 0.2) 0%, transparent 50%)`,
        }}
      />

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-gray-300 to-gray-100 bg-clip-text text-transparent">
              AutoProcure
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden md:flex items-center space-x-8"
          >
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
            <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
                         <motion.button
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
             
             <h1 className="text-6xl md:text-8xl font-bold mb-6">
               <span className="bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-clip-text text-transparent">
                 The Future of
               </span>
               <br />
               <span className="bg-gradient-to-r from-gray-100 via-gray-300 to-gray-100 bg-clip-text text-transparent">
                 Procurement
               </span>
             </h1>
             
             <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
               Transform supplier quotes into actionable intelligence with AI-powered analysis. 
               <span className="text-gray-200 font-semibold"> Save millions. Make better decisions.</span>
             </p>

                         <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
               <motion.button
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
            <FloatingElements />
          </motion.div>

                     {/* Stats */}
           <motion.div
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, delay: 0.8 }}
             className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
           >
             {stats.map((stat, index) => (
               <GlassCard key={index} className="text-center">
                 <stat.icon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                 <div className="text-2xl font-bold text-white mb-1">
                   {stat.prefix}<AnimatedCounter end={stat.value} />{stat.suffix}
                 </div>
                 <div className="text-sm text-gray-400">{stat.label}</div>
               </GlassCard>
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
                <GlassCard className="h-full">
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

             {/* File Upload Section */}
       <section className="relative z-20 px-6 py-20">
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
             <GlassCard className="p-8">
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
                       <div key={index} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                         <span className="text-gray-300">{file.name}</span>
                         <span className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               <motion.button
                 onClick={handleUpload}
                 disabled={selectedFiles.length === 0 || isUploading}
                 className="w-full bg-gradient-to-r from-gray-700 to-gray-800 text-white py-3 px-6 rounded-xl font-semibold hover:from-gray-600 hover:to-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 border border-gray-600"
                 whileHover={{ scale: selectedFiles.length > 0 && !isUploading ? 1.02 : 1 }}
                 whileTap={{ scale: selectedFiles.length > 0 && !isUploading ? 0.98 : 1 }}
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
               </motion.button>
             </GlassCard>
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
                <GlassCard className="h-full">
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
                </GlassCard>
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
            <GlassCard>
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
            </GlassCard>
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
