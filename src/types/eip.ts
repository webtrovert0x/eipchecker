export enum StandardType {
  UNKNOWN = 0,
  ERC20 = 1,
  ERC721 = 2,
  ERC1155 = 3,
}

export interface CheckItem {
  id: string;
  category: 'erc165' | 'erc20' | 'erc721' | 'erc1155' | 'behavior';
  name: string;
  description: string;
  status: 'passed' | 'warning' | 'failed' | 'not-applicable';
  details?: string;
  rawValue?: any;
}

export interface InspectionReport {
  targetContract: `0x${string}`;
  detectedStandard: StandardType;
  standardName: 'ERC-20' | 'ERC-721' | 'ERC-1155' | 'Unknown / Custom';
  complianceScore: number; // 0 - 100
  flags: number;
  checks: CheckItem[];
  suspiciousFindings: string[];
  recommendations: string[];
  metadata: {
    name?: string;
    symbol?: string;
    decimals?: number;
    totalSupply?: string;
    tokenURI?: string;
    uri?: string;
  };
  erc165Report: {
    supported: boolean;
    validZeroVectorSafe: boolean; // returns false for 0xffffffff
    declaredInterfaces: {
      erc165: boolean;
      erc721: boolean;
      erc721Metadata: boolean;
      erc721Enumerable: boolean;
      erc1155: boolean;
      erc1155MetadataURI: boolean;
    };
  };
  bytecodeSize: number;
  hasCode: boolean;
  timestamp: number;
}

export interface RegistryRecord {
  targetContract: `0x${string}`;
  standardType: StandardType;
  complianceScore: number;
  flags: number;
  inspector: `0x${string}`;
  timestamp: bigint;
  summary: string;
}

export const DIAGNOSTIC_FLAGS = {
  ERC165_SUPPORTED: 1 << 0,              // 1
  ERC165_INVALID_VECTOR_SAFE: 1 << 1,    // 2
  METADATA_SUPPORTED: 1 << 2,            // 4
  STANDARD_SELECTORS_FOUND: 1 << 3,      // 8
  NON_STANDARD_RETURN_TYPE: 1 << 4,      // 16 (e.g. USDT missing bool return)
  REVERT_RULES_COMPLIANT: 1 << 5,        // 32
  CUSTOM_OR_SUSPICIOUS: 1 << 6,          // 64
};

