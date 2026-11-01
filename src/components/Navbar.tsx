'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ExternalLink, Activity, Sparkles, Database } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useWeb3Config } from '../context/web3-provider';

interface NavbarProps {
  activeTab: 'inspect' | 'directory' | 'guide';
  setActiveTab: (tab: 'inspect' | 'directory' | 'guide') => void;
}

export function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const { address, isConnected } = useAccount();
  const { isConfigured } = useWeb3Config();

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-blue-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl tracking-tight text-slate-900">EIP<span className="text-blue-600">Checker</span></span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Inspector
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Smart Contract Standards & Compatibility</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('inspect')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'inspect'
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Inspector</span>
            </button>

            <button
              onClick={() => setActiveTab('directory')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'directory'
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Database className="w-4 h-4 text-blue-600" />
              <span>BOT Chain Directory</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'guide'
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Standards Nuances</span>
            </button>
          </nav>

          {/* Network & Wallet Controls */}
          <div className="flex items-center space-x-3">
            {/* BOTChain Badge */}
            <a
              href="https://scan.bohr.life/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50/50 text-xs text-blue-900 hover:bg-blue-100/50 transition-colors"
              title="BOTChain Testnet (Chain ID 968)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium">BOTChain</span>
              <span className="text-blue-500">|</span>
              <span className="text-slate-500 font-mono">968 (BOT)</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {/* Reown AppKit Button */}
            <div className="appkit-button-container">
              {/* @ts-ignore */}
              <appkit-button />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

