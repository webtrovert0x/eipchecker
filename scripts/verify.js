const fs = require('fs');
const path = require('path');

async function main() {
  const contractPath = path.resolve(__dirname, '../contracts/EIPCheckerRegistry.sol');
  const source = fs.readFileSync(contractPath, 'utf8');
  const contractAddress = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || '0x4c2fe22b741cf9784511f92c803004bd898fd512';

  const standardJson = {
    language: 'Solidity',
    sources: {
      'contracts/EIPCheckerRegistry.sol': {
        content: source
      }
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true,
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode']
        }
      }
    }
  };

  const compilerversion = 'v0.8.38+commit.1835d247';
  console.log(`Submitting verification for ${contractAddress} with compiler ${compilerversion}...`);

  const params = new URLSearchParams();
  params.append('module', 'contract');
  params.append('action', 'verifysourcecode');
  params.append('contractaddress', contractAddress);
  params.append('contractname', 'contracts/EIPCheckerRegistry.sol:EIPCheckerRegistry');
  params.append('compilerversion', compilerversion);
  params.append('codeformat', 'solidity-standard-json-input');
  params.append('sourceCode', JSON.stringify(standardJson));

  const res = await fetch('https://scan.botchain.ai/api', {
    method: 'POST',
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  const data = await res.json();
  console.log('Submission result:', data);

  if (data.status === '1' && data.result) {
    const guid = data.result;
    console.log(`Tracking verification job GUID: ${guid}...`);
    
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await fetch(`https://scan.botchain.ai/api?module=contract&action=checkverifystatus&guid=${guid}`);
      const statusData = await statusRes.json();
      console.log(`Status poll [${i + 1}]:`, statusData);
      if (statusData.result && (statusData.result.toLowerCase().includes('pass') || statusData.result.toLowerCase().includes('verified'))) {
        console.log('Contract successfully verified on BOTChain Scan!');
        console.log(`View verified contract at: https://scan.botchain.ai/address/${contractAddress}#code`);
        return;
      }
    }
  }
}

main().catch(console.error);
