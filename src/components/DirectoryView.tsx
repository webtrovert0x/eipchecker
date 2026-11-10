'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Search,
  RefreshCw,
  Clock,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { createPublicClient, http } from 'viem';
import { botchainMainnet } from '../lib/botchain';
import { EIP_CHECKER_REGISTRY_ABI } from '../lib/registry-abi';
import { useWeb3Config } from '../context/web3-provider';
import { StandardType } from '../types/eip';

interface DirectoryRecord {
  targetContract: `0x${string}`;
  standardType: number;
  complianceScore: number;
  flags: number;
  inspector: `0x${string}`;
  timestamp: bigint;
  summary: string;
}

export function DirectoryView({ onInspectSelect }: { onInspectSelect: (address: string) => void }) {
  const { registryAddress } = useWeb3Config();
  const [records, setRecords] = useState<DirectoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStandard, setFilterStandard] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activeRegistry =
    registryAddress ||
    (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`) ||
    '';

  const isRegistryConfigured = Boolean(activeRegistry && activeRegistry.startsWith('0x') && activeRegistry.length === 42 && activeRegistry !== '0x0000000000000000000000000000000000000000');

  async function fetchDirectoryRecords() {
    if (!isRegistryConfigured) {
      return;
    }

    setIsLoading(true);
    try {
      const client = createPublicClient({
        chain: botchainMainnet,
        transport: http('https://rpc.botchain.ai'),
      });

      const count = await (client as any).readContract({
        address: activeRegistry as `0x${string}`,
        abi: EIP_CHECKER_REGISTRY_ABI,
        functionName: 'getRecordCount',
      });

      const total = Number(count);
      if (total > 0) {
        const fetched = await (client as any).readContract({
          address: activeRegistry as `0x${string}`,
          abi: EIP_CHECKER_REGISTRY_ABI,
          functionName: 'getRecords',
          args: [BigInt(0), BigInt(total)],
        });
        setRecords(fetched as DirectoryRecord[]);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error('Failed to query BOTChain registry:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchDirectoryRecords();
  }, [activeRegistry, isRegistryConfigured]);

  const standardLabels: Record<number, string> = {
    [StandardType.ERC20]: 'ERC-20',
    [StandardType.ERC721]: 'ERC-721',
    [StandardType.ERC1155]: 'ERC-1155',
    [StandardType.UNKNOWN]: 'Unknown / Custom',
  };

  const filteredRecords = records.filter((rec) => {
    const matchesFilter =
      filterStandard === 'all' ||
      (filterStandard === 'erc20' && rec.standardType === StandardType.ERC20) ||
      (filterStandard === 'erc721' && rec.standardType === StandardType.ERC721) ||
      (filterStandard === 'erc1155' && rec.standardType === StandardType.ERC1155);

    const matchesSearch =
      rec.targetContract.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.summary.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Directory Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900">
                BOT Chain Standards Compatibility Directory
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              On-chain verified standards registry. Query compatibility status and verified behavior of contracts on BOTChain.
            </p>
          </div>

          <button
            onClick={fetchDirectoryRecords}
            disabled={isLoading || !isRegistryConfigured}
            className="px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center space-x-2 transition-colors self-start sm:self-auto shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Directory</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by address or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
            {['all', 'erc20', 'erc721', 'erc1155'].map((std) => (
              <button
                key={std}
                onClick={() => setFilterStandard(std)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-colors ${
                  filterStandard === std
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {std}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Registry Address Status Banner */}
      {!isRegistryConfigured && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-slate-800">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-blue-900 text-base">EIPCheckerRegistry.sol Ready for BOTChain Mainnet</h4>
              <p className="mt-1 text-sm text-blue-800 leading-relaxed">
                The smart contract <code className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-900">contracts/EIPCheckerRegistry.sol</code> is fully compiled and ready to be deployed to BOTChain Mainnet.
              </p>
              <div className="mt-3 bg-white p-3 rounded-xl border border-blue-200 text-xs font-mono text-slate-800 space-y-1">
                <div className="text-slate-500"># 1. Add your private key to .env:</div>
                <div>PRIVATE_KEY=0x...</div>
                <div className="text-slate-500 mt-2"># 2. Deploy to BOTChain Mainnet (gas fee only):</div>
                <div className="text-blue-700 font-bold">npm run deploy</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Directory Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">No Contracts In Directory Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Inspect any contract on BOTChain Mainnet and record the findings to register it in this public compatibility index.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Target Contract</th>
                  <th className="py-3 px-4">Standard</th>
                  <th className="py-3 px-4">Compliance Score</th>
                  <th className="py-3 px-4">Summary / Findings</th>
                  <th className="py-3 px-4">Inspector</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((record, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      <div className="flex items-center space-x-2">
                        <span>
                          {record.targetContract.slice(0, 10)}...{record.targetContract.slice(-8)}
                        </span>
                        <a
                          href={`https://scan.botchain.ai/address/${record.targetContract}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-blue-600 inline-flex items-center space-x-1"
                          title="View on BOTChain Scan"
                        >
                          <img
                            src="/botchain-logo.png"
                            alt="BOTChain"
                            className="w-3.5 h-3.5 rounded-full object-contain shrink-0"
                          />
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800">
                        {standardLabels[record.standardType] || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              record.complianceScore >= 80
                                ? 'bg-emerald-500'
                                : record.complianceScore >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${record.complianceScore}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800">{record.complianceScore}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600" title={record.summary}>
                      {record.summary || 'Verified compliant'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {record.inspector.slice(0, 6)}...{record.inspector.slice(-4)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onInspectSelect(record.targetContract)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-medium transition-colors flex items-center space-x-1 ml-auto"
                      >
                        <span>Re-inspect</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
