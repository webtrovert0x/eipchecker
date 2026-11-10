'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { botchainMainnet } from '../lib/botchain';

const queryClient = new QueryClient();

interface Web3ContextType {
  isConfigured: boolean;
  reownId: string;
  registryAddress: string;
}

const Web3Context = createContext<Web3ContextType>({
  isConfigured: false,
  reownId: '',
  registryAddress: '',
});

export const useWeb3Config = () => useContext(Web3Context);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [wagmiConfig, setWagmiConfig] = useState<any>(null);
  const [reownId, setReownId] = useState<string>('');
  const [registryAddress, setRegistryAddress] = useState<string>('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        const id = data.reownId || '';
        setReownId(id);
        setRegistryAddress(data.registryAddress || '');

        // Fallback or user provided project id
        const activeProjectId = id || 'b56e18d47c72ab683b10814fe9495694';

        const adapter = new WagmiAdapter({
          ssr: true,
          networks: [botchainMainnet as any],
          projectId: activeProjectId,
        });

        createAppKit({
          adapters: [adapter],
          networks: [botchainMainnet as any],
          projectId: activeProjectId,
          metadata: {
            name: 'EIPChecker',
            description: 'Smart Contract Standards Inspector for BOTChain Mainnet',
            url: typeof window !== 'undefined' ? window.location.origin : 'https://eipchecker-bay.vercel.app',
            icons: ['https://avatars.githubusercontent.com/u/179229932'],
          },
          themeMode: 'light',
          themeVariables: {
            '--w3m-accent': '#2563eb', // Blue theme
            '--w3m-color-mix': '#ffffff',
            '--w3m-color-mix-strength': 10,
          },
          features: {
            analytics: false,
          },
        });

        setWagmiConfig(adapter.wagmiConfig);
      } catch (err) {
        console.error('Failed to initialize Web3 provider:', err);
        // Fallback direct wagmi config
        const fallbackConfig = createConfig({
          chains: [botchainMainnet as any],
          transports: {
            [botchainMainnet.id]: http('https://rpc.botchain.ai'),
          },
        });
        setWagmiConfig(fallbackConfig);
      } finally {
        setIsReady(true);
      }
    }

    init();
  }, []);

  if (!isReady || !wagmiConfig) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-slate-900">Loading EIPChecker</h2>
        <p className="text-sm text-slate-500 mt-1">Connecting to BOTChain Mainnet (Chain ID 677)...</p>
      </div>
    );
  }

  return (
    <Web3Context.Provider
      value={{
        isConfigured: Boolean(reownId && reownId.length > 0),
        reownId,
        registryAddress,
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </WagmiProvider>
    </Web3Context.Provider>
  );
}
