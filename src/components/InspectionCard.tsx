'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Loader2,
  Fuel,
} from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useAppKitAccount, useAppKit } from '@reown/appkit/react';
import { createWalletClient, createPublicClient, custom, http } from 'viem';
import { inspectContract } from '../lib/inspector';
import { InspectionReport } from '../types/eip';
import { EIP_CHECKER_REGISTRY_ABI } from '../lib/registry-abi';
import { useWeb3Config } from '../context/web3-provider';
import { botchainMainnet } from '../lib/botchain';

// Deployed contracts on BOTChain Mainnet (Chain ID 677)
const PRESET_CONTRACTS = [
  {
    name: 'EIPChecker Registry (Mainnet)',
    address: '0x4c2fe22b741cf9784511f92c803004bd898fd512',
    type: 'Core Registry',
  },
  {
    name: 'Standard Token (ERC-20)',
    address: '0x011b3f1df87355c5596f57751289fa3e23b0cc1b',
    type: 'ERC-20 (BSTT)',
  },
  {
    name: 'Target Contract (BOTChain)',
    address: '0xB61b62B1b18e285E8360618bc9A04F62A10435E3',
    type: 'Contract',
  },
];

export function InspectionCard({ onCheckRecorded }: { onCheckRecorded?: () => void }) {
  const [addressInput, setAddressInput] = useState('');
  const [report, setReport] = useState<InspectionReport | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTxHash, setActiveTxHash] = useState<`0x${string}` | null>(null);

  const { isConnected: isWagmiConnected, address: wagmiAddress } = useAccount();
  const { isConnected: isAppKitConnected, address: appKitAddress } = useAppKitAccount();
  const { open } = useAppKit();
  const { registryAddress } = useWeb3Config();

  // Dual connection state check: AppKit, Wagmi, or direct injected window.ethereum
  const [injectedAddress, setInjectedAddress] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      (window as any).ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setInjectedAddress(accounts[0]);
          }
        })
        .catch(() => {});
    }
  }, []);

  const connectedAddress =
    appKitAddress ||
    wagmiAddress ||
    injectedAddress ||
    (typeof window !== 'undefined' ? (window as any).ethereum?.selectedAddress : null);

  const isWalletConnected = Boolean(isAppKitConnected || isWagmiConnected || connectedAddress);

  const {
    data: wagmiTxHash,
    writeContractAsync,
    isPending: isWagmiPending,
    error: wagmiError,
  } = useWriteContract();

  const currentTxHash = activeTxHash || wagmiTxHash;

  const {
    data: txReceipt,
    isLoading: isTxConfirming,
    isSuccess: isTxMined,
  } = useWaitForTransactionReceipt({
    hash: currentTxHash || undefined,
  });

  const isTxSuccess = txReceipt?.status === 'success';
  const isTxReverted = txReceipt?.status === 'reverted';

  // Notify directory when transaction successfully confirms on-chain
  useEffect(() => {
    if (isTxSuccess && onCheckRecorded) {
      onCheckRecorded();
    }
  }, [isTxSuccess, onCheckRecorded]);

  async function handleInspectOnChain(overrideAddress?: string) {
    const targetAddress = (overrideAddress || addressInput).trim();
    if (!targetAddress.startsWith('0x') || targetAddress.length !== 42) {
      setErrorMsg('Please enter a valid 42-character EVM contract address (0x...)');
      return;
    }

    if (!isWalletConnected) {
      setErrorMsg('Wallet not connected. Opening connection prompt...');
      try {
        await open();
      } catch (e) {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        }
      }
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);

    // Pre-flight check: Verify bytecode exists on BOTChain before spending gas
    try {
      const publicClient = createPublicClient({
        chain: botchainMainnet,
        transport: http('https://rpc.botchain.ai'),
      });

      const bytecode = await publicClient.getBytecode({ address: targetAddress as `0x${string}` });
      if (!bytecode || bytecode === '0x' || bytecode.length <= 2) {
        setIsProcessing(false);
        setErrorMsg(
          `Address ${targetAddress} has no bytecode deployed on BOTChain Mainnet (Chain ID 677). Transaction prevented to protect your gas fee.`
        );
        return;
      }

      // Generate diagnostic report immediately
      const inspectionResult = await inspectContract(targetAddress as `0x${string}`);
      setReport(inspectionResult);
    } catch (err: any) {
      console.warn('Pre-flight inspection notice:', err);
    }

    const activeRegistry =
      registryAddress ||
      (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`) ||
      '0x4c2fe22b741cf9784511f92c803004bd898fd512';

    try {
      let txResultHash: `0x${string}` | null = null;

      // Primary: Try Wagmi writeContractAsync
      try {
        if (writeContractAsync) {
          const res = await (writeContractAsync as any)({
            address: activeRegistry as `0x${string}`,
            abi: EIP_CHECKER_REGISTRY_ABI,
            functionName: 'inspectAndRecord',
            args: [targetAddress as `0x${string}`],
          });
          if (res) txResultHash = res;
        }
      } catch (err: any) {
        console.warn('Wagmi execution notice:', err?.message || err);
      }

      // Fallback: Direct window.ethereum for MetaMask
      if (!txResultHash && typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        const sender = accounts[0] || connectedAddress;

        const walletClient = createWalletClient({
          account: sender,
          chain: botchainMainnet,
          transport: custom((window as any).ethereum),
        });

        txResultHash = await (walletClient as any).writeContract({
          address: activeRegistry as `0x${string}`,
          abi: EIP_CHECKER_REGISTRY_ABI,
          functionName: 'inspectAndRecord',
          args: [targetAddress as `0x${string}`],
          chain: botchainMainnet,
        });
      }

      if (txResultHash) {
        setActiveTxHash(txResultHash);
      } else {
        throw new Error('Transaction prompt was cancelled or not confirmed.');
      }
    } catch (err: any) {
      console.error('Inspection transaction error:', err);
      setErrorMsg(err?.shortMessage || err?.message || 'Transaction was rejected or failed.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Search & Address Input Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h2 className="text-xl font-bold text-slate-900">
              Inspect Contract Standards
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 inline-flex items-center space-x-1">
              <img
                src="/botchain-logo.png"
                alt="BOTChain"
                className="w-3.5 h-3.5 rounded-full object-contain shrink-0"
              />
              <span>BOTChain Mainnet (677)</span>
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 flex items-center space-x-1">
              <Fuel className="w-3 h-3 text-blue-600" />
              <span>Gas Fee Only</span>
            </span>
          </div>

          <p className="text-sm text-slate-500">
            Every inspection directly executes against the on-chain registry contract. Interacts via standard BOT network gas fee only (zero protocol fees).
          </p>

          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Enter contract address (0x...)"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInspectOnChain()}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm font-mono text-slate-900"
              />
            </div>
            <button
              onClick={() => handleInspectOnChain()}
              disabled={isWagmiPending || isTxConfirming || isProcessing || !addressInput}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shrink-0"
            >
              {isWagmiPending || isTxConfirming || isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isTxConfirming ? 'Confirming on BOTChain...' : 'Confirm in Wallet...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Inspect On-Chain (Gas Fee Only)</span>
                </>
              )}
            </button>
          </div>

          {/* Quick preset chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">BOTChain Verified Presets:</span>
            {PRESET_CONTRACTS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  setAddressInput(preset.address);
                  handleInspectOnChain(preset.address);
                }}
                className="text-xs bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 px-2.5 py-1 rounded-lg transition-colors font-medium"
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Error alerts */}
          {(errorMsg || wagmiError) && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg || (wagmiError as any)?.shortMessage || wagmiError?.message}</span>
            </div>
          )}

          {/* Transaction status */}
          {currentTxHash && (
            <div
              className={`mt-4 p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                isTxReverted
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                {isTxConfirming ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : isTxReverted ? (
                  <XCircle className="w-4 h-4 text-rose-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
                <span>
                  {isTxConfirming
                    ? 'Inspection transaction mining on BOTChain Mainnet (gas fee only)...'
                    : isTxReverted
                    ? 'Transaction reverted on-chain. Please check target contract.'
                    : 'Transaction confirmed! Inspection findings recorded in BOTChain Directory.'}
                </span>
              </div>
              <a
                href={`https://scan.botchain.ai/tx/${currentTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline flex items-center space-x-1.5 text-blue-700 hover:text-blue-900"
              >
                <img
                  src="/botchain-logo.png"
                  alt="BOTChain"
                  className="w-3.5 h-3.5 rounded-full object-contain shrink-0"
                />
                <span>BOTChain Scan</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Inspection Results */}
      {report && (
        <div className="space-y-6">
          {/* Header Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-blue-600 text-white shadow-sm">
                    {report.standardName}
                  </span>
                  <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    {report.targetContract}
                  </span>
                  <a
                    href={`https://scan.botchain.ai/address/${report.targetContract}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1.5 font-medium"
                  >
                    <img
                      src="/botchain-logo.png"
                      alt="BOTChain"
                      className="w-3.5 h-3.5 rounded-full object-contain shrink-0"
                    />
                    <span>BOTChain Scan</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex items-center space-x-4 pt-1">
                  <div>
                    <span className="text-xs text-slate-400">Bytecode Size:</span>
                    <p className="text-sm font-semibold text-slate-800">{report.bytecodeSize} bytes</p>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <span className="text-xs text-slate-400">ERC-165 Supported:</span>
                    <p className="text-sm font-semibold text-slate-800">
                      {report.erc165Report.supported ? 'Yes' : 'No (Optional for ERC20)'}
                    </p>
                  </div>
                  {report.metadata.name && (
                    <div className="border-l border-slate-200 pl-4">
                      <span className="text-xs text-slate-400">Token Name:</span>
                      <p className="text-sm font-semibold text-slate-800">
                        {report.metadata.name} ({report.metadata.symbol || ''})
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Score Display */}
              <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 px-5 py-3 rounded-xl self-start lg:self-auto">
                <div className="text-right">
                  <div className="text-[11px] text-slate-400 font-medium uppercase">Compliance Score</div>
                  <div className="text-2xl font-black text-blue-600">{report.complianceScore}%</div>
                </div>
                <div className="w-10 h-10 rounded-full border-4 border-blue-600 border-t-slate-200 flex items-center justify-center font-bold text-xs text-blue-700">
                  ✓
                </div>
              </div>
            </div>

            {/* Gas Fee Guarantee Notice */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center space-x-1.5 text-blue-700 font-medium">
                <Fuel className="w-3.5 h-3.5" />
                <span>Gas Fee Only: All check and inspect interactions require network gas fee only. Zero platform fees.</span>
              </span>
            </div>
          </div>

          {/* Suspicious Findings or Deviations Alert */}
          {report.suspiciousFindings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 shadow-sm">
              <div className="flex items-start space-x-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-amber-950">Detected Deviations & Interface Quirks</h4>
                  <ul className="mt-2 space-y-1 text-xs text-amber-900 list-disc list-inside">
                    {report.suspiciousFindings.map((finding, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {finding}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Itemized Checks Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <span>Standard Verification Checks</span>
              <span className="text-xs text-slate-400 font-normal">({report.checks.length} checks)</span>
            </h3>

            <div className="divide-y divide-slate-100">
              {report.checks.map((check) => (
                <div key={check.id} className="py-3.5 flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    {check.status === 'passed' && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                    {check.status === 'warning' && (
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    {check.status === 'failed' && (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-slate-800">{check.name}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {check.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{check.description}</p>
                      {check.details && (
                        <p className="text-xs font-mono text-blue-700 bg-blue-50/50 rounded-lg px-2 py-1 mt-1.5 inline-block border border-blue-100">
                          {check.details}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                      check.status === 'passed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : check.status === 'warning'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {check.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
