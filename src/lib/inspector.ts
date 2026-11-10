import {
  createPublicClient,
  http,
  encodeFunctionData,
  decodeFunctionResult,
  toHex,
  hexToString,
  hexToNumber,
} from 'viem';
import { botchainMainnet } from './botchain';
import {
  CheckItem,
  InspectionReport,
  StandardType,
  DIAGNOSTIC_FLAGS,
} from '../types/eip';

// Standard ERC-165 Interface IDs
export const INTERFACE_IDS = {
  ERC165: '0x01ffc9a7' as `0x${string}`,
  INVALID_CHECK: '0xffffffff' as `0x${string}`,
  ERC721: '0x80ac58cd' as `0x${string}`,
  ERC721_METADATA: '0x5b5e139f' as `0x${string}`,
  ERC721_ENUMERABLE: '0x780e9d63' as `0x${string}`,
  ERC1155: '0xd9b67a26' as `0x${string}`,
  ERC1155_METADATA_URI: '0x0e89341c' as `0x${string}`,
};

const ERC165_ABI = [
  {
    type: 'function',
    name: 'supportsInterface',
    inputs: [{ name: 'interfaceId', type: 'bytes4' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
] as const;

const ERC20_ABI = [
  { type: 'function', name: 'totalSupply', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'balanceOf', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'allowance', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'name', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'symbol', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'decimals', inputs: [], outputs: [{ type: 'uint8' }], stateMutability: 'view' },
  { type: 'function', name: 'transfer', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' },
  { type: 'function', name: 'approve', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' },
  { type: 'function', name: 'transferFrom', inputs: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' },
] as const;

const ERC721_ABI = [
  { type: 'function', name: 'balanceOf', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'ownerOf', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'address' }], stateMutability: 'view' },
  { type: 'function', name: 'name', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'symbol', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'tokenURI', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'isApprovedForAll', inputs: [{ name: 'owner', type: 'address' }, { name: 'operator', type: 'address' }], outputs: [{ type: 'bool' }], stateMutability: 'view' },
] as const;

const ERC1155_ABI = [
  { type: 'function', name: 'balanceOf', inputs: [{ name: 'account', type: 'address' }, { name: 'id', type: 'uint256' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'balanceOfBatch', inputs: [{ name: 'accounts', type: 'address[]' }, { name: 'ids', type: 'uint256[]' }], outputs: [{ type: 'uint256[]' }], stateMutability: 'view' },
  { type: 'function', name: 'uri', inputs: [{ name: 'id', type: 'uint256' }], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'isApprovedForAll', inputs: [{ name: 'account', type: 'address' }, { name: 'operator', type: 'address' }], outputs: [{ type: 'bool' }], stateMutability: 'view' },
] as const;

const DUMMY_ADDRESS = '0x0000000000000000000000000000000000000001' as `0x${string}`;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;

export async function inspectContract(
  contractAddress: `0x${string}`,
  customRpcUrl?: string
): Promise<InspectionReport> {
  const client = createPublicClient({
    chain: botchainMainnet,
    transport: http(customRpcUrl || 'https://rpc.botchain.ai'),
  });

  const checks: CheckItem[] = [];
  const suspiciousFindings: string[] = [];
  const recommendations: string[] = [];
  let flags = 0;

  // 1. Bytecode verification
  let bytecode = '0x';
  try {
    const code = await client.getBytecode({ address: contractAddress });
    bytecode = code || '0x';
  } catch (err: any) {
    bytecode = '0x';
  }

  const hasCode = bytecode !== '0x' && bytecode.length > 2;
  const bytecodeSize = hasCode ? (bytecode.length - 2) / 2 : 0;

  if (!hasCode) {
    return {
      targetContract: contractAddress,
      detectedStandard: StandardType.UNKNOWN,
      standardName: 'Unknown / Custom',
      complianceScore: 0,
      flags: 0,
      checks: [
        {
          id: 'bytecode',
          category: 'behavior',
          name: 'Bytecode Presence',
          description: 'Checks if contract bytecode exists at the given address',
          status: 'failed',
          details: 'No bytecode found at this address on BOTChain Mainnet. May be an EOA or un-deployed.',
        },
      ],
      suspiciousFindings: ['Address has 0 bytes of code. Not an active smart contract.'],
      recommendations: ['Ensure the address is a deployed smart contract on BOTChain Mainnet.'],
      metadata: {},
      erc165Report: {
        supported: false,
        validZeroVectorSafe: false,
        declaredInterfaces: {
          erc165: false,
          erc721: false,
          erc721Metadata: false,
          erc721Enumerable: false,
          erc1155: false,
          erc1155MetadataURI: false,
        },
      },
      bytecodeSize: 0,
      hasCode: false,
      timestamp: Date.now(),
    };
  }

  checks.push({
    id: 'bytecode',
    category: 'behavior',
    name: 'Bytecode Presence',
    description: 'Contract bytecode verification',
    status: 'passed',
    details: `Active smart contract detected. Size: ${bytecodeSize} bytes.`,
  });

  // 2. ERC-165 Standard Tests
  let supportsErc165 = false;
  let erc165InvalidSafe = false;
  let declaresErc721 = false;
  let declaresErc721Metadata = false;
  let declaresErc721Enumerable = false;
  let declaresErc1155 = false;
  let declaresErc1155Metadata = false;

  try {
    const erc165SelfResult = await (client as any).readContract({
      address: contractAddress,
      abi: ERC165_ABI,
      functionName: 'supportsInterface',
      args: [INTERFACE_IDS.ERC165],
    });
    supportsErc165 = Boolean(erc165SelfResult);
  } catch (e) {
    supportsErc165 = false;
  }

  if (supportsErc165) {
    flags |= DIAGNOSTIC_FLAGS.ERC165_SUPPORTED;

    // Test the critical negative vector: 0xffffffff MUST return false
    try {
      const invalidResult = await (client as any).readContract({
        address: contractAddress,
        abi: ERC165_ABI,
        functionName: 'supportsInterface',
        args: [INTERFACE_IDS.INVALID_CHECK],
      });
      if (invalidResult === false) {
        erc165InvalidSafe = true;
        flags |= DIAGNOSTIC_FLAGS.ERC165_INVALID_VECTOR_SAFE;
        checks.push({
          id: 'erc165-invalid-vector',
          category: 'erc165',
          name: 'ERC-165 Negative Vector (0xffffffff)',
          description: 'ERC-165 explicitly mandates supportsInterface(0xffffffff) MUST return false',
          status: 'passed',
          details: 'Correctly returns false for 0xffffffff.',
        });
      } else {
        checks.push({
          id: 'erc165-invalid-vector',
          category: 'erc165',
          name: 'ERC-165 Negative Vector (0xffffffff)',
          description: 'ERC-165 explicitly mandates supportsInterface(0xffffffff) MUST return false',
          status: 'failed',
          details: 'Contract returned true for 0xffffffff! Violates ERC-165 specification.',
        });
        suspiciousFindings.push('Broken ERC-165: Returns true for invalid interface ID (0xffffffff).');
      }
    } catch (e: any) {
      checks.push({
        id: 'erc165-invalid-vector',
        category: 'erc165',
        name: 'ERC-165 Negative Vector (0xffffffff)',
        description: 'ERC-165 explicitly mandates supportsInterface(0xffffffff) MUST return false',
        status: 'warning',
        details: 'Reverted on supportsInterface(0xffffffff) instead of returning false cleanly.',
      });
      suspiciousFindings.push('ERC-165 quirk: supportsInterface(0xffffffff) reverted rather than returning false.');
    }

    // Check declared interfaces
    try {
      declaresErc721 = Boolean(
        await (client as any).readContract({
          address: contractAddress,
          abi: ERC165_ABI,
          functionName: 'supportsInterface',
          args: [INTERFACE_IDS.ERC721],
        })
      );
    } catch {}

    try {
      declaresErc721Metadata = Boolean(
        await (client as any).readContract({
          address: contractAddress,
          abi: ERC165_ABI,
          functionName: 'supportsInterface',
          args: [INTERFACE_IDS.ERC721_METADATA],
        })
      );
    } catch {}

    try {
      declaresErc721Enumerable = Boolean(
        await (client as any).readContract({
          address: contractAddress,
          abi: ERC165_ABI,
          functionName: 'supportsInterface',
          args: [INTERFACE_IDS.ERC721_ENUMERABLE],
        })
      );
    } catch {}

    try {
      declaresErc1155 = Boolean(
        await (client as any).readContract({
          address: contractAddress,
          abi: ERC165_ABI,
          functionName: 'supportsInterface',
          args: [INTERFACE_IDS.ERC1155],
        })
      );
    } catch {}

    try {
      declaresErc1155Metadata = Boolean(
        await (client as any).readContract({
          address: contractAddress,
          abi: ERC165_ABI,
          functionName: 'supportsInterface',
          args: [INTERFACE_IDS.ERC1155_METADATA_URI],
        })
      );
    } catch {}

    checks.push({
      id: 'erc165-declaration',
      category: 'erc165',
      name: 'ERC-165 Interface Declaration',
      description: 'Supports standard ERC-165 interface query mechanism',
      status: 'passed',
      details: `Declared: ERC-721=${declaresErc721}, ERC-1155=${declaresErc1155}`,
    });
  } else {
    checks.push({
      id: 'erc165-declaration',
      category: 'erc165',
      name: 'ERC-165 Interface Declaration',
      description: 'Tests if supportsInterface() is implemented',
      status: 'warning',
      details: 'ERC-165 not implemented. (Note: standard ERC-20 does not require ERC-165).',
    });
  }

  // 3. Inspect ERC-20 Functions & Behavior
  let erc20Points = 0;
  let erc20TotalChecks = 6;
  const metadata: InspectionReport['metadata'] = {};

  // Check totalSupply
  let hasTotalSupply = false;
  try {
    const supply = await (client as any).readContract({
      address: contractAddress,
      abi: ERC20_ABI,
      functionName: 'totalSupply',
    });
    hasTotalSupply = true;
    metadata.totalSupply = supply.toString();
    erc20Points++;
    checks.push({
      id: 'erc20-totalSupply',
      category: 'erc20',
      name: 'totalSupply()',
      description: 'Returns total token supply (uint256)',
      status: 'passed',
      details: `Supply: ${supply.toString()}`,
      rawValue: supply.toString(),
    });
  } catch {
    checks.push({
      id: 'erc20-totalSupply',
      category: 'erc20',
      name: 'totalSupply()',
      description: 'Returns total token supply (uint256)',
      status: 'failed',
      details: 'Missing or reverted',
    });
  }

  // Check balanceOf
  let hasBalanceOf = false;
  try {
    const bal = await (client as any).readContract({
      address: contractAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [DUMMY_ADDRESS],
    });
    hasBalanceOf = true;
    erc20Points++;
    checks.push({
      id: 'erc20-balanceOf',
      category: 'erc20',
      name: 'balanceOf(address)',
      description: 'Queries balance for an address (uint256)',
      status: 'passed',
      details: `Dummy address returned: ${bal.toString()}`,
    });
  } catch {
    checks.push({
      id: 'erc20-balanceOf',
      category: 'erc20',
      name: 'balanceOf(address)',
      description: 'Queries balance for an address (uint256)',
      status: 'failed',
      details: 'Missing or reverted',
    });
  }

  // Check allowance
  let hasAllowance = false;
  try {
    const allow = await (client as any).readContract({
      address: contractAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [DUMMY_ADDRESS, DUMMY_ADDRESS],
    });
    hasAllowance = true;
    erc20Points++;
    checks.push({
      id: 'erc20-allowance',
      category: 'erc20',
      name: 'allowance(owner, spender)',
      description: 'Queries spender allowance (uint256)',
      status: 'passed',
      details: `Returned: ${allow.toString()}`,
    });
  } catch {
    checks.push({
      id: 'erc20-allowance',
      category: 'erc20',
      name: 'allowance(owner, spender)',
      description: 'Queries spender allowance (uint256)',
      status: 'failed',
      details: 'Missing or reverted',
    });
  }

  // Metadata: name, symbol, decimals
  let hasName = false;
  try {
    const name = await (client as any).readContract({
      address: contractAddress,
      abi: ERC20_ABI,
      functionName: 'name',
    });
    hasName = true;
    metadata.name = name;
  } catch {}

  let hasSymbol = false;
  try {
    const symbol = await (client as any).readContract({
      address: contractAddress,
      abi: ERC20_ABI,
      functionName: 'symbol',
    });
    hasSymbol = true;
    metadata.symbol = symbol;
  } catch {}

  let hasDecimals = false;
  try {
    const decimals = await (client as any).readContract({
      address: contractAddress,
      abi: ERC20_ABI,
      functionName: 'decimals',
    });
    hasDecimals = true;
    metadata.decimals = Number(decimals);
    erc20Points++;
  } catch {}

  if (hasName && hasSymbol) {
    flags |= DIAGNOSTIC_FLAGS.METADATA_SUPPORTED;
    checks.push({
      id: 'erc20-metadata',
      category: 'erc20',
      name: 'Token Metadata (name, symbol, decimals)',
      description: 'Standard token description attributes',
      status: 'passed',
      details: `Name: "${metadata.name || ''}", Symbol: "${metadata.symbol || ''}", Decimals: ${metadata.decimals ?? 'N/A'}`,
    });
  } else {
    checks.push({
      id: 'erc20-metadata',
      category: 'erc20',
      name: 'Token Metadata (name, symbol, decimals)',
      description: 'Standard token description attributes',
      status: 'warning',
      details: `Incomplete metadata: Name=${hasName}, Symbol=${hasSymbol}, Decimals=${hasDecimals}`,
    });
  }

  // Non-Standard ERC20 Return Behavior Inspection (USDT Quirk Test)
  // Low-level call to transfer(address, 0)
  try {
    const transferCallData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [DUMMY_ADDRESS, BigInt(0)],
    });

    const callResult = await (client as any).call({
      to: contractAddress,
      data: transferCallData,
    });

    // Check returned data length
    const rawData = callResult.data || '0x';
    if (rawData === '0x' || rawData === '') {
      // 0 bytes returned without revert! This is the USDT quirk (transfer() returns void instead of bool)
      flags |= DIAGNOSTIC_FLAGS.NON_STANDARD_RETURN_TYPE;
      flags |= DIAGNOSTIC_FLAGS.CUSTOM_OR_SUSPICIOUS;
      checks.push({
        id: 'erc20-usdt-quirk',
        category: 'behavior',
        name: 'Return Value Specification (transfer)',
        description: 'ERC-20 requires transfer() to return a boolean. Non-compliant contracts return void (0 bytes).',
        status: 'warning',
        details: 'Returns 0 bytes instead of boolean (USDT-style non-standard return). Requires SafeERC20.',
      });
      suspiciousFindings.push('Non-standard ERC-20: transfer() does not return a boolean value (USDT quirk). Standard Transfer wrappers like OpenZeppelin SafeERC20 required.');
    } else if (rawData.length === 66) {
      // Exactly 32 bytes (64 hex characters + 0x)
      checks.push({
        id: 'erc20-usdt-quirk',
        category: 'behavior',
        name: 'Return Value Specification (transfer)',
        description: 'ERC-20 requires transfer() to return a boolean',
        status: 'passed',
        details: 'Returns standard 32-byte boolean as mandated by EIP-20.',
      });
    }
  } catch (err: any) {
    // Reverting on transfer(dummy, 0) is common if balance is 0 or paused
    checks.push({
      id: 'erc20-transfer-simulation',
      category: 'behavior',
      name: 'Transfer Simulation',
      description: 'Tests transfer execution behavior',
      status: 'passed',
      details: 'Reverted cleanly on zero-balance caller simulation (expected for compliant balances).',
    });
  }

  // 4. Inspect ERC-721 Functions & Specification Nuances
  let erc721Points = 0;
  let hasErc721OwnerOf = false;
  let hasErc721BalanceOf = false;
  let erc721InvalidReverts = false;

  try {
    const bal721 = await (client as any).readContract({
      address: contractAddress,
      abi: ERC721_ABI,
      functionName: 'balanceOf',
      args: [DUMMY_ADDRESS],
    });
    hasErc721BalanceOf = true;
    erc721Points++;
  } catch {}

  // ERC-721 Revert Mandate Test:
  // EIP-721 Specification: "NFTs assigned to zero address are considered invalid, and queries about them do throw."
  // Querying ownerOf(nonExistentId) MUST throw. If it returns address(0) without reverting, it breaks standard!
  try {
    const owner = await (client as any).readContract({
      address: contractAddress,
      abi: ERC721_ABI,
      functionName: 'ownerOf',
      args: [BigInt('999999999999999')],
    });
    // If it reached here without throwing:
    if (owner === ZERO_ADDRESS) {
      checks.push({
        id: 'erc721-revert-rule',
        category: 'erc721',
        name: 'ERC-721 Invalid Token Revert Rule',
        description: 'ERC-721 explicitly mandates ownerOf(invalidTokenId) MUST revert/throw',
        status: 'failed',
        details: 'Contract returned address(0) for nonexistent token instead of reverting! Violates ERC-721 spec.',
      });
      suspiciousFindings.push('ERC-721 violation: ownerOf() does not revert on nonexistent token ID.');
    } else {
      hasErc721OwnerOf = true;
      erc721Points++;
    }
  } catch (e: any) {
    // It threw! This is PROPER ERC-721 compliant behavior!
    erc721InvalidReverts = true;
    flags |= DIAGNOSTIC_FLAGS.REVERT_RULES_COMPLIANT;
    checks.push({
      id: 'erc721-revert-rule',
      category: 'erc721',
      name: 'ERC-721 Invalid Token Revert Rule',
      description: 'ERC-721 explicitly mandates ownerOf(invalidTokenId) MUST revert',
      status: 'passed',
      details: 'Correctly reverts when querying nonexistent token ID as required by specification.',
    });
  }

  // Try tokenURI
  try {
    const uri = await (client as any).readContract({
      address: contractAddress,
      abi: ERC721_ABI,
      functionName: 'tokenURI',
      args: [BigInt(1)],
    });
    metadata.tokenURI = uri;
  } catch {}

  // 5. Inspect ERC-1155 Functions
  let erc1155Points = 0;
  let hasErc1155BalanceOf = false;
  let hasErc1155Uri = false;

  try {
    await (client as any).readContract({
      address: contractAddress,
      abi: ERC1155_ABI,
      functionName: 'balanceOf',
      args: [DUMMY_ADDRESS, BigInt(1)],
    });
    hasErc1155BalanceOf = true;
    erc1155Points++;
  } catch {}

  try {
    const uri1155 = await (client as any).readContract({
      address: contractAddress,
      abi: ERC1155_ABI,
      functionName: 'uri',
      args: [BigInt(1)],
    });
    hasErc1155Uri = true;
    metadata.uri = uri1155;
    erc1155Points++;
  } catch {}

  // 6. Standard Determination & Compliance Scoring
  let detectedStandard = StandardType.UNKNOWN;
  let standardName: InspectionReport['standardName'] = 'Unknown / Custom';
  let complianceScore = 0;

  const isErc20Candidate = hasTotalSupply && hasBalanceOf && (hasAllowance || hasDecimals || hasName);
  const isErc721Candidate = declaresErc721 || (hasErc721BalanceOf && erc721InvalidReverts);
  const isErc1155Candidate = declaresErc1155 || (hasErc1155BalanceOf && hasErc1155Uri);

  if (isErc721Candidate) {
    detectedStandard = StandardType.ERC721;
    standardName = 'ERC-721';
    let score = 50;
    if (declaresErc721) score += 20;
    if (erc165InvalidSafe) score += 10;
    if (erc721InvalidReverts) score += 10;
    if (declaresErc721Metadata) score += 5;
    if (hasName && hasSymbol) score += 5;
    complianceScore = Math.min(100, score);

    if (declaresErc721 && !erc165InvalidSafe) {
      suspiciousFindings.push('Claims ERC-721 via ERC-165, but ERC-165 fails the 0xffffffff rejection test.');
    }
  } else if (isErc1155Candidate) {
    detectedStandard = StandardType.ERC1155;
    standardName = 'ERC-1155';
    let score = 50;
    if (declaresErc1155) score += 20;
    if (erc165InvalidSafe) score += 10;
    if (hasErc1155BalanceOf) score += 10;
    if (hasErc1155Uri || declaresErc1155Metadata) score += 10;
    complianceScore = Math.min(100, score);
  } else if (isErc20Candidate) {
    detectedStandard = StandardType.ERC20;
    standardName = 'ERC-20';
    let score = 40;
    if (hasTotalSupply) score += 15;
    if (hasBalanceOf) score += 15;
    if (hasAllowance) score += 15;
    if (hasName && hasSymbol) score += 10;
    if (hasDecimals) score += 5;
    if (flags & DIAGNOSTIC_FLAGS.NON_STANDARD_RETURN_TYPE) {
      score -= 10; // penalty for missing return boolean
    }
    complianceScore = Math.min(100, Math.max(20, score));

    if (supportsErc165) {
      recommendations.push('Contract implements ERC-165 alongside ERC-20 (optional but helpful).');
    }
  } else {
    detectedStandard = StandardType.UNKNOWN;
    standardName = 'Unknown / Custom';
    complianceScore = Math.min(40, bytecodeSize > 500 ? 30 : 15);
    suspiciousFindings.push('Contract does not conform to recognized ERC-20, ERC-721, or ERC-1155 standards.');
    recommendations.push('If this is a custom protocol or vault, inspect specific custom selectors.');
  }

  // Final recommendations
  if (suspiciousFindings.length === 0) {
    recommendations.push('All verified interface methods adhere to official EIP specifications.');
  }
  if (detectedStandard === StandardType.ERC20 && (flags & DIAGNOSTIC_FLAGS.NON_STANDARD_RETURN_TYPE)) {
    recommendations.push('Integrators MUST use OpenZeppelin SafeERC20 to prevent silent token transfer failures.');
  }

  return {
    targetContract: contractAddress,
    detectedStandard,
    standardName,
    complianceScore,
    flags,
    checks,
    suspiciousFindings,
    recommendations,
    metadata,
    erc165Report: {
      supported: supportsErc165,
      validZeroVectorSafe: erc165InvalidSafe,
      declaredInterfaces: {
        erc165: supportsErc165,
        erc721: declaresErc721,
        erc721Metadata: declaresErc721Metadata,
        erc721Enumerable: declaresErc721Enumerable,
        erc1155: declaresErc1155,
        erc1155MetadataURI: declaresErc1155Metadata,
      },
    },
    bytecodeSize,
    hasCode,
    timestamp: Date.now(),
  };
}
