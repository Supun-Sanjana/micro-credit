"use client";
import React, { useState } from "react";
import { ChevronDown, ChevronRight, Menu } from "lucide-react";
import { DashboardPreview } from "./dashboard-preview";

export function Hero() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative w-full h-[calc(100vh-24px)] sm:h-[calc(100vh-32px)] overflow-hidden bg-[#d9d9d9] rounded-2xl sm:rounded-3xl shadow-sm">
      {/* Mountains and Clouds Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=2000&auto=format&fit=crop" 
          alt="Mountains and clouds"
          className="w-full h-full object-cover animate-pan-slow opacity-90"
        />
      </div>
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]" />

        <div className="relative z-10 flex flex-col h-full overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: "none" }}>
          
          {/* Navbar Pill */}
          <div className="flex justify-center pt-4 sm:pt-6 px-3 sm:px-4 shrink-0">
            <nav className="bg-white rounded-full shadow-sm border border-neutral-200 pl-2 pr-2 py-2 w-full max-w-[760px] relative flex items-center">
              
              {/* Logo */}
              <div className="shrink-0 flex items-center gap-2 px-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-brand-violet to-brand-violet/50 p-[1px] shadow-[0_0_10px_rgba(124,58,237,0.2)]">
                  <div className="w-full h-full rounded-[7px] bg-black flex items-center justify-center">
                    <span className="text-white font-bold text-sm tracking-tighter">S</span>
                  </div>
                </div>
                <span className="font-semibold text-[15px] tracking-tight hidden sm:block">Solida</span>
              </div>
              
              {/* Desktop Links */}
              <div className="hidden md:flex items-center gap-6 ml-10">
                <a href="#" className="flex items-center gap-1.5 text-[14px] font-medium text-neutral-900">
                  <div className="w-1.5 h-1.5 rounded-full bg-black" /> Home
                </a>
                <a href="#features" className="text-[14px] font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Features</a>
                <a href="#pricing" className="text-[14px] font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Pricing</a>
                <a href="#contact" className="flex items-center gap-1 text-[14px] font-medium text-[#7c3aed]">
                  Contact <ChevronDown className="w-3.5 h-3.5" />
                </a>
              </div>
              
              {/* Right Cluster */}
              <div className="ml-auto flex items-center gap-2">
                <a href="/app/login" className="hidden sm:block text-[14px] font-medium text-neutral-600 hover:text-neutral-900 transition-colors px-3">
                  Log in
                </a>
                <a href="/app/signup" className="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-full pl-4 pr-1.5 py-1.5 sm:py-2 transition-colors">
                  <span className="text-[13px] sm:text-[14px] font-medium">Early access</span>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 flex items-center justify-center">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </a>
                <button 
                  className="md:hidden flex items-center justify-center p-1.5 text-neutral-700 ml-1"
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Menu Dropdown */}
              {menuOpen && (
                <div className="absolute top-full left-2 right-2 mt-2 bg-white rounded-2xl shadow-lg border border-neutral-200 p-3 z-20 md:hidden flex flex-col gap-2">
                   <a href="#" className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-lg text-[14px] font-medium text-neutral-900">
                    <div className="w-1.5 h-1.5 rounded-full bg-black" /> Home
                  </a>
                  <a href="#features" className="px-3 py-2 text-[14px] font-medium text-neutral-600">Features</a>
                  <a href="#pricing" className="px-3 py-2 text-[14px] font-medium text-neutral-600">Pricing</a>
                  <a href="#contact" className="px-3 py-2 text-[14px] font-medium text-[#7c3aed]">Contact</a>
                  <div className="h-px bg-neutral-100 my-1" />
                  <a href="/app/login" className="px-3 py-2 text-[14px] font-medium text-neutral-600">Log in</a>
                </div>
              )}
            </nav>
          </div>

          {/* Hero Content */}
          <div className="flex flex-col items-center px-4 pt-10 sm:pt-16 pb-8 sm:pb-12 text-center shrink-0">
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 shadow-sm border border-neutral-100 mb-6">
              <div className="w-2 h-2 rounded-full bg-[#7c3aed] animate-pulse" />
              <span className="text-[13px] font-medium text-neutral-800 tracking-wide">Solida Early Access</span>
            </div>
            
            <h1 
              className="max-w-4xl text-neutral-900"
              style={{
                fontSize: "clamp(36px, 8vw, 72px)",
                lineHeight: 1.05,
                fontWeight: 500,
                letterSpacing: "-0.02em"
              }}
            >
              Shaping <span className="font-instrument italic font-normal text-[#7c3aed]">Microfinance</span> <br /> of tomorrow
            </h1>
            
            <p 
              className="mt-4 sm:mt-6 text-neutral-700 px-2 max-w-2xl font-medium"
              style={{ fontSize: "clamp(13px, 3.5vw, 16px)" }}
            >
              The All-In-One Core Banking Platform Powering the Future of Microfinance Institutions
            </p>
            
            <a href="/app/signup" className="mt-6 sm:mt-8 inline-flex items-center gap-3 bg-[#0b0f1a] hover:bg-black text-white rounded-full pl-6 sm:pl-7 pr-2 py-2 sm:py-2.5 transition-transform hover:scale-105 shadow-xl shadow-black/10">
              <span className="text-[14px] font-medium">Get Started</span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/15 flex items-center justify-center">
                <ChevronRight className="w-4 h-4" />
              </div>
            </a>
          </div>

          {/* Dashboard Preview */}
          <DashboardPreview />
          
        </div>
    </div>
  );
}
