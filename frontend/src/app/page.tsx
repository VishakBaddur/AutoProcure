'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { useSpring as useSpringReact, animated } from '@react-spring/web';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, Text3D, Sphere } from '@react-three/drei';
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
  Award
} from 'lucide-react';

// 3D Component for Hero Section
function FloatingElements() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Sphere args={[0.5, 32, 32]}>
          <meshStandardMaterial color="#6366f1" wireframe />
        </Sphere>
      </Float>
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.3}>
        <Sphere args={[0.3, 16, 16]} position={[2, 1, 0]}>
          <meshStandardMaterial color="#8b5cf6" wireframe />
        </Sphere>
      </Float>
      <Float speed={2.5} rotationIntensity={0.7} floatIntensity={0.7}>
        <Sphere args={[0.4, 24, 24]} position={[-2, -1, 1]}>
          <meshStandardMaterial color="#06b6d4" wireframe />
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
          className="absolute w-1 h-1 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full opacity-30"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0.3, 0.8, 0.3],
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

// Main Landing Page Component
export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  
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
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Process complex quotes in seconds, not hours. Get insights instantly when you need them most.",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption and compliance. Your data is protected with the highest security standards.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: TrendingUp,
      title: "Smart Insights",
      description: "Predictive analytics help you make better procurement decisions and maximize your savings.",
      gradient: "from-blue-500 to-cyan-500"
    }
  ];

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
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
      <ParticleBackground />
      
      {/* Animated Background Gradient */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.3) 0%, transparent 50%)`,
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
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
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
              className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-6 py-2 rounded-xl font-semibold"
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
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </motion.div>
            
            <h1 className="text-6xl md:text-8xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                The Future of
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Procurement
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Transform supplier quotes into actionable intelligence with AI-powered analysis. 
              <span className="text-cyan-400 font-semibold"> Save millions. Make better decisions.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center group"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg backdrop-blur-sm hover:bg-white/10 transition-all"
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
                <stat.icon className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
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
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
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

      {/* Interactive Demo Section */}
      <section className="relative z-20 px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                See It In Action
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience the power of AutoProcure with our interactive demo. 
              Watch as AI transforms your procurement process in real-time.
            </p>
          </motion.div>

          <InteractiveDemo />
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
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
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
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
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
                  className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold text-lg"
                >
                  Start Free Trial
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg backdrop-blur-sm hover:bg-white/10 transition-all"
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
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
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
