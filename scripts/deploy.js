require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createWalletClient, createPublicClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { defineChain } = require('viem');

const botChainTestnet = defineChain({
  id: 968,
  name: 'BOTChain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.bohr.life'],
    },
    public: {
      http: ['https://rpc.bohr.life'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BOHR Scan',
      url: 'https://scan.bohr.life',
    },
  },
});

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey || privateKey.trim() === '' || privateKey.includes('your_private_key')) {
    console.error('\n❌ ERROR: PRIVATE_KEY is missing in your .env file!');
    console.error('Please open .env and set your private key:');
    console.error('  PRIVATE_KEY=0xYourPrivateKeyHere\n');
    process.exit(1);
  }

  const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const account = privateKeyToAccount(formattedKey);

  console.log('----------------------------------------------------');
  console.log('🚀 Deploying EIPCheckerRegistry to BOTChain Testnet');
  console.log('   Chain ID: 968');
  console.log('   RPC: https://rpc.bohr.life');
  console.log('   Deployer Address:', account.address);
  console.log('   Native Token: BOT');
  console.log('----------------------------------------------------');

  const publicClient = createPublicClient({
    chain: botChainTestnet,
    transport: http('https://rpc.bohr.life'),
  });

  const walletClient = createWalletClient({
    account,
    chain: botChainTestnet,
    transport: http('https://rpc.bohr.life'),
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Deployer balance: ${Number(balance) / 1e18} BOT`);

  const buildPath = path.resolve(__dirname, '../contracts/build/EIPCheckerRegistry.json');
  if (!fs.existsSync(buildPath)) {
    console.log('Compiled artifact not found. Running compilation first...');
    require('./compile');
  }

  const { abi, bytecode } = JSON.parse(fs.readFileSync(buildPath, 'utf8'));

  console.log('Sending deployment transaction (gas fee only)...');
  const hash = await walletClient.deployContract({
    abi,
    bytecode,
    args: [],
  });

  console.log(`Transaction sent! Tx Hash: ${hash}`);
  console.log(`View on explorer: https://scan.bohr.life/tx/${hash}`);
  console.log('Waiting for block confirmation...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const contractAddress = receipt.contractAddress;

  console.log('\n====================================================');
  console.log('🎉 EIPCheckerRegistry successfully deployed!');
  console.log('Contract Address:', contractAddress);
  console.log('Explorer URL:', `https://scan.bohr.life/address/${contractAddress}`);
  console.log('====================================================\n');

  // Automatically update .env with NEXT_PUBLIC_REGISTRY_ADDRESS
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('NEXT_PUBLIC_REGISTRY_ADDRESS=')) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_REGISTRY_ADDRESS=.*/,
        `NEXT_PUBLIC_REGISTRY_ADDRESS=${contractAddress}`
      );
    } else {
      envContent += `\nNEXT_PUBLIC_REGISTRY_ADDRESS=${contractAddress}\n`;
    }
    fs.writeFileSync(envPath, envContent);
    console.log(`Updated .env with NEXT_PUBLIC_REGISTRY_ADDRESS=${contractAddress}`);
  }
}

main().catch((err) => {
  console.error('Deployment failed:', err);
  process.exit(1);
});

