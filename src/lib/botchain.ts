import { defineChain } from 'viem';

export const botchainMainnet = defineChain({
  id: 677,
  name: 'BOTChain Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.botchain.ai'],
    },
    public: {
      http: ['https://rpc.botchain.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BOTChain Scan',
      url: 'https://scan.botchain.ai',
    },
  },
  testnet: false,
});

// Alias for backwards compatibility
export const botchainTestnet = botchainMainnet;

export const BOTCHAIN_CONFIG = {
  chainId: 677,
  chainName: 'BOTChain Mainnet',
  rpcUrl: 'https://rpc.botchain.ai',
  nativeToken: 'BOT',
  explorerUrl: 'https://scan.botchain.ai',
};
