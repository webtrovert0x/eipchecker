require('dotenv').config();
const fs = require('fs');
const path = require('path');
const solc = require('solc');
const { createWalletClient, createPublicClient, http, defineChain } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

const botChain = defineChain({
  id: 968,
  name: 'BOTChain Testnet',
  nativeCurrency: { decimals: 18, name: 'BOT', symbol: 'BOT' },
  rpcUrls: { default: { http: ['https://rpc.bohr.life'] } }
});

function compileFile(filename, contractName) {
  const filePath = path.resolve(__dirname, '../contracts', filename);
  const source = fs.readFileSync(filePath, 'utf8');
  const input = {
    language: 'Solidity',
    sources: { [filename]: { content: source } },
    settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } } }
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  if (output.errors) {
    for (const err of output.errors) {
      if (err.severity === 'error') throw new Error(err.formattedMessage);
    }
  }
  const contract = output.contracts[filename][contractName];
  return { abi: contract.abi, bytecode: '0x' + contract.evm.bytecode.object };
}

async function main() {
  const privateKey = '0x' + process.env.PRIVATE_KEY.replace('0x', '');
  const account = privateKeyToAccount(privateKey);
  const client = createPublicClient({ chain: botChain, transport: http('https://rpc.bohr.life') });
  const wallet = createWalletClient({ account, chain: botChain, transport: http('https://rpc.bohr.life') });

  console.log('Deploying MockERC20 and MockUSDTQuirk to BOTChain Testnet...');

  // 1. MockERC20
  const erc20 = compileFile('MockERC20.sol', 'MockERC20');
  const hash1 = await wallet.deployContract({ abi: erc20.abi, bytecode: erc20.bytecode, args: [] });
  console.log('MockERC20 Tx:', hash1);
  const receipt1 = await client.waitForTransactionReceipt({ hash: hash1 });
  console.log('MockERC20 Address:', receipt1.contractAddress);

  // 2. MockUSDTQuirk
  const usdt = compileFile('MockUSDTQuirk.sol', 'MockUSDTQuirk');
  const hash2 = await wallet.deployContract({ abi: usdt.abi, bytecode: usdt.bytecode, args: [] });
  console.log('MockUSDTQuirk Tx:', hash2);
  const receipt2 = await client.waitForTransactionReceipt({ hash: hash2 });
  console.log('MockUSDTQuirk Address:', receipt2.contractAddress);

  const outputPath = path.resolve(__dirname, '../contracts/build/mock-addresses.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    MockERC20: receipt1.contractAddress,
    MockUSDTQuirk: receipt2.contractAddress
  }, null, 2));

  console.log('Mock deployment complete! Saved to contracts/build/mock-addresses.json');
}

main().catch(console.error);

