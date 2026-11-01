'use client';

import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { InspectionCard } from '../components/InspectionCard';
import { DirectoryView } from '../components/DirectoryView';
import { QuirksExplainer } from '../components/QuirksExplainer';
import { ShieldCheck, HelpCircle, CheckCircle, Database, Sparkles, Terminal } from 'lucide-react';
import { useWeb3Config } from '../context/web3-provider';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'inspect' | 'directory' | 'guide'>('inspect');
  const [prefillAddress, setPrefillAddress] = useState<string>('');
  const { isConfigured, registryAddress } = useWeb3Config();

  function handleSelectFromDirectory(address: string) {
    setPrefillAddress(address);
    setActiveTab('inspect');
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold uppercase tracking-wider mb-4 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>BOTChain Testnet Standards Inspector</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              EIPChecker & Compatibility Directory
            </h1>

            <p className="mt-3 text-sm sm:text-base text-blue-100 leading-relaxed font-light">
              A contract can claim to implement an Ethereum standard without correctly supporting its expected behavior. Inspect ERC-20, ERC-721, ERC-1155, and ERC-165 compliance with deep behavioral simulation.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-medium">
              <div className="flex items-center space-x-1.5 bg-blue-800/40 px-3 py-1.5 rounded-xl border border-white/15">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>On-Chain Standards Inspection</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-blue-800/40 px-3 py-1.5 rounded-xl border border-white/15">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Gas Fee Only for On-Chain Registry</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-blue-800/40 px-3 py-1.5 rounded-xl border border-white/15">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Zero Protocol Fees</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'inspect' && (
          <InspectionCard onCheckRecorded={() => {}} />
        )}

        {activeTab === 'directory' && (
          <DirectoryView onInspectSelect={handleSelectFromDirectory} />
        )}

        {activeTab === 'guide' && (
          <QuirksExplainer />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">EIPChecker</span>
            <span>—</span>
            <span>Smart Contract Standards Inspector for BOTChain Testnet (Chain ID 968)</span>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://scan.bohr.life/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              BOHR Scan Explorer
            </a>
            <span>•</span>
            <a
              href="https://rpc.bohr.life"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              RPC Endpoint
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

