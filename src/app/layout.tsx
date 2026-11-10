import type { Metadata } from 'next';
import './globals.css';
import { Web3Provider } from '../context/web3-provider';

export const metadata: Metadata = {
  title: 'EIPChecker — Smart Contract Standards Inspector',
  description: 'Inspect ERC-20, ERC-721, ERC-1155, and ERC-165 compatibility on BOTChain Mainnet.',
  icons: {
    icon: '/eipchecker-logo.svg',
    shortcut: '/eipchecker-logo.svg',
    apple: '/eipchecker-logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen text-slate-800 antialiased">
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}

