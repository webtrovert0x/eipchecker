const fs = require('fs');
const path = require('path');
const solc = require('solc');

function compile() {
  const contractPath = path.resolve(__dirname, '../contracts/EIPCheckerRegistry.sol');
  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'EIPCheckerRegistry.sol': {
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

  console.log('Compiling contracts/EIPCheckerRegistry.sol with solc (viaIR: true)...');
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    let hasError = false;
    for (const error of output.errors) {
      if (error.severity === 'error') {
        hasError = true;
        console.error(error.formattedMessage);
      } else {
        console.warn(error.formattedMessage);
      }
    }
    if (hasError) {
      process.exit(1);
    }
  }

  const contract = output.contracts['EIPCheckerRegistry.sol']['EIPCheckerRegistry'];
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;

  const buildDir = path.resolve(__dirname, '../contracts/build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(buildDir, 'EIPCheckerRegistry.json'),
    JSON.stringify({ abi, bytecode: '0x' + bytecode }, null, 2)
  );

  console.log('Compilation successful! Build saved to contracts/build/EIPCheckerRegistry.json');
}

compile();
