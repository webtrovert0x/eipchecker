'use client';

import React from 'react';
import { AlertTriangle, HelpCircle, CheckCircle2, ShieldAlert, FileCode2, ArrowRight } from 'lucide-react';

export function QuirksExplainer() {
  return (
    <div className="space-y-6">
      {/* Top Banner Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-slate-800 shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-900">
              Why ERC-165 Support Alone Does Not Prove Standard Compliance
            </h3>
            <p className="mt-1 text-sm text-blue-800 leading-relaxed">
              In EVM development, <span className="font-semibold text-blue-950">ERC-165 is merely a self-reported declaration</span>. A contract can return <code className="bg-white px-1.5 py-0.5 rounded text-blue-700 font-mono text-xs border border-blue-200">true</code> for any interface identifier without actually executing the required logic, emitting mandatory events, or adhering to revert specifications.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Standard Pitfalls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quirk 1: The USDT Quirk */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-blue-300 transition-all">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
              !
            </div>
            <h4 className="font-semibold text-slate-900">The "USDT Quirk" (Missing Bool Return)</h4>
          </div>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            The formal <span className="font-medium text-slate-900">EIP-20</span> specification dictates that <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono text-slate-800">transfer(address, uint256)</code> must return a 32-byte boolean (<code className="text-xs font-mono">true</code>). Several major tokens (including USDT and early Binance/BNB) return <strong className="text-amber-700">void (0 bytes)</strong> upon success.
          </p>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs font-mono space-y-1">
            <div className="text-slate-500">// Standard ERC-20 declaration:</div>
            <div className="text-emerald-700">function transfer(address, uint) external returns (bool);</div>
            <div className="text-slate-500 mt-2">// USDT on-chain execution:</div>
            <div className="text-amber-700">returns () // 0 bytes returned! Calling with IERC20 reverts!</div>
          </div>
          <div className="mt-4 text-xs text-blue-600 flex items-center space-x-1 font-medium">
            <span>Solution: Integrators must use OpenZeppelin SafeERC20</span>
          </div>
        </div>

        {/* Quirk 2: ERC-165 Negative Vector */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-blue-300 transition-all">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
              165
            </div>
            <h4 className="font-semibold text-slate-900">The 0xffffffff Negative Vector Test</h4>
          </div>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            <span className="font-medium text-slate-900">EIP-165</span> requires querying <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono text-slate-800">supportsInterface(0xffffffff)</code> to explicitly return <code className="text-xs font-mono font-bold text-emerald-600">false</code>. A compliant interface cannot have an ID of all 1s.
          </p>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs font-mono space-y-1">
            <div className="text-slate-500">// Must be strictly tested:</div>
            <div className="text-blue-700">supportsInterface(0x01ffc9a7) == true  // ERC165 itself</div>
            <div className="text-slate-500 mt-2">// Invalid vector:</div>
            <div className="text-emerald-700">supportsInterface(0xffffffff) == false // Mandatory test</div>
          </div>
          <div className="mt-4 text-xs text-slate-500 flex items-center space-x-1">
            <span>Broken contracts either revert or incorrectly return true.</span>
          </div>
        </div>

        {/* Quirk 3: ERC-721 Revert Mandate */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-blue-300 transition-all">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-sm">
              721
            </div>
            <h4 className="font-semibold text-slate-900">ERC-721 Nonexistent Token Reverts</h4>
          </div>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            Under EIP-721: <em>"NFTs assigned to zero address are considered invalid, and queries about them do throw."</em> Calling <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono text-slate-800">ownerOf(invalidId)</code> <strong className="text-indigo-800">must revert</strong>.
          </p>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs font-mono space-y-1">
            <div className="text-slate-500">// Compliant ERC-721:</div>
            <div className="text-emerald-700">ownerOf(9999999) -&gt; REVERT "ERC721: invalid token ID"</div>
            <div className="text-slate-500 mt-2">// Faulty ERC-721:</div>
            <div className="text-rose-600">ownerOf(9999999) -&gt; 0x0000000000000000000000000000000000000000</div>
          </div>
          <div className="mt-4 text-xs text-slate-500 flex items-center space-x-1">
            <span>Returning address(0) silently breaks NFT indexers and marketplaces.</span>
          </div>
        </div>

        {/* Quirk 4: Gas-Fee-Only Architecture */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-blue-300 transition-all">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              0
            </div>
            <h4 className="font-semibold text-slate-900">Gas-Fee-Only Registry Guarantee</h4>
          </div>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            Every inspection and standard verification in EIPChecker interacts directly with <span className="font-semibold text-slate-900">EIPCheckerRegistry.sol</span> on BOTChain Testnet. Every function requires a standard network gas fee only, with zero protocol or platform fees.
          </p>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Direct on-chain contract inspection</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero protocol/developer fee on registry contract (<code className="font-mono text-[11px]">msg.value == 0</code>)</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>User pays standard BOT network gas fee only for recording checks</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

