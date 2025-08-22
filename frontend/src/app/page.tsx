"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Zap, 
  FileText, 
  Play,
  Calculator,
  Target
} from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
  const [currentDemoStep, setCurrentDemoStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDemoStep((prev) => (prev + 1) % 4);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const demoSteps = [
    {
      title: "Upload Vendor Quotes",
      description: "Drag & drop PDFs, Excel files, or scanned documents",
      icon: FileText,
      color: "from-gray-700 to-gray-900"
    },
    {
      title: "AI Extracts & Normalizes",
      description: "Instantly converts messy quotes into structured data",
      icon: Zap,
      color: "from-gray-800 to-black"
    },
    {
      title: "Smart Comparison",
      description: "Side-by-side analysis with cost savings highlighted",
      icon: Calculator,
      color: "from-black to-gray-800"
    },
    {
      title: "Actionable Insights",
      description: "Get recommendations and export reports instantly",
      icon: Target,
      color: "from-gray-900 to-gray-700"
    }
  ];

  const features = [
    {
      icon: "/images/feature-extract.jpeg",
      title: "Extract Messy Quotes",
      description: "Handles PDFs, Excel, scanned docs, and more",
      gradient: "from-gray-700 to-gray-900"
    },
    {
      icon: "/images/feature-compare.png",
      title: "Normalize & Compare",
      description: "Standardizes data across different vendor formats",
      gradient: "from-gray-800 to-black"
    },
    {
      icon: "/images/feature-leaks.png",
      title: "Spot Cost Leaks",
      description: "Identifies hidden charges and pricing anomalies",
      gradient: "from-black to-gray-800"
    },
    {
      icon: "/images/feature-save.png",
      title: "Save Time & Money",
      description: "Reduces analysis time from hours to minutes",
      gradient: "from-gray-900 to-gray-700"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Image 
                src="/images/logo.svg" 
                alt="AutoProcure"
                width={150}
                height={40}
                className="h-8 w-auto"
              />
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#demo" className="text-gray-300 hover:text-white transition-colors">Demo</a>
            </div>
            
            <button className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:from-gray-600 hover:to-gray-800 transition-all duration-200 hover:scale-105 border border-gray-600">
              Get Early Access
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-slide-up">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Procurement,
                <span className="block bg-gradient-to-r from-gray-300 via-white to-gray-400 bg-clip-text text-transparent">
                  Powered by AI
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                AutoProcure cleans vendor quotes, compares them instantly, and helps you make faster, smarter purchasing decisions.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <button className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-gray-600 hover:to-gray-800 transition-all duration-200 flex items-center space-x-2 hover:scale-105 border border-gray-600">
                  <span>Get Early Access</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                
                <button className="border-2 border-gray-600 text-gray-300 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-800 hover:text-white transition-all duration-200 flex items-center space-x-2 hover:scale-105">
                  <Play className="w-5 h-5" />
                  <span>See Demo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="py-20 bg-gradient-to-r from-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Powerful features designed for procurement professionals
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 hover:border-gray-600 hover:shadow-2xl hover:shadow-gray-900/50 transition-all duration-300 hover:-translate-y-2 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-gray-600 overflow-hidden`}>
                  <Image 
                    src={feature.icon} 
                    alt={feature.title}
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Teaser */}
      <section id="demo" className="py-20 bg-gradient-to-r from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold text-white mb-4">
              See It In Action
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Watch how AutoProcure transforms your procurement workflow
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden animate-fade-in">
              <div className="flex items-center space-x-2 p-4 border-b border-gray-700">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex-1 text-center text-sm text-gray-400">
                  AutoProcure Demo
                </div>
              </div>
              
              <div className="p-8">
                <div className="text-center">
                  <div className="mb-8 transition-all duration-500 ease-in-out">
                    <div className={`w-20 h-20 bg-gradient-to-r ${demoSteps[currentDemoStep].color} rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-500 border border-gray-600`}>
                      {React.createElement(demoSteps[currentDemoStep].icon, { className: "w-10 h-10 text-white" })}
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-4">
                      {demoSteps[currentDemoStep].title}
                    </h3>
                    <p className="text-gray-300 text-lg">
                      {demoSteps[currentDemoStep].description}
                    </p>
                  </div>
                  
                  <button className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-gray-600 hover:to-gray-800 transition-all duration-200 flex items-center space-x-2 mx-auto hover:scale-105 border border-gray-600">
                    <span>Request Access</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call-to-Action Footer */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h2 className="text-4xl font-bold text-white mb-4">
              Be Among The First To Use AutoProcure
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join the waitlist and get early access to the future of procurement
            </p>
            
            <div className="max-w-md mx-auto mb-12">
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-l-lg border-0 bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-600 focus:outline-none"
                />
                <button className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-6 py-3 rounded-r-lg font-semibold hover:from-gray-600 hover:to-gray-800 transition-all duration-200 hover:scale-105 border border-gray-600">
                  Join Waitlist
                </button>
              </div>
            </div>
            
            <div className="flex justify-center space-x-8 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
