export const EIP_CHECKER_REGISTRY_ABI = [
  {
    "type": "function",
    "name": "inspectAndRecord",
    "inputs": [
      { "name": "targetContract", "type": "address", "internalType": "address" }
    ],
    "outputs": [
      { "name": "detectedType", "type": "uint8", "internalType": "enum EIPCheckerRegistry.StandardType" },
      { "name": "complianceScore", "type": "uint16", "internalType": "uint16" },
      { "name": "flags", "type": "uint32", "internalType": "uint32" },
      { "name": "summary", "type": "string", "internalType": "string" }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "recordCheck",
    "inputs": [
      { "name": "targetContract", "type": "address", "internalType": "address" },
      { "name": "standardType", "type": "uint8", "internalType": "uint8" },
      { "name": "complianceScore", "type": "uint16", "internalType": "uint16" },
      { "name": "flags", "type": "uint32", "internalType": "uint32" },
      { "name": "summary", "type": "string", "internalType": "string" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getRecord",
    "inputs": [
      { "name": "targetContract", "type": "address", "internalType": "address" }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct EIPCheckerRegistry.CheckRecord",
        "components": [
          { "name": "targetContract", "type": "address", "internalType": "address" },
          { "name": "standardType", "type": "uint8", "internalType": "enum EIPCheckerRegistry.StandardType" },
          { "name": "complianceScore", "type": "uint16", "internalType": "uint16" },
          { "name": "flags", "type": "uint32", "internalType": "uint32" },
          { "name": "inspector", "type": "address", "internalType": "address" },
          { "name": "timestamp", "type": "uint256", "internalType": "uint256" },
          { "name": "summary", "type": "string", "internalType": "string" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRecords",
    "inputs": [
      { "name": "offset", "type": "uint256", "internalType": "uint256" },
      { "name": "limit", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct EIPCheckerRegistry.CheckRecord[]",
        "components": [
          { "name": "targetContract", "type": "address", "internalType": "address" },
          { "name": "standardType", "type": "uint8", "internalType": "enum EIPCheckerRegistry.StandardType" },
          { "name": "complianceScore", "type": "uint16", "internalType": "uint16" },
          { "name": "flags", "type": "uint32", "internalType": "uint32" },
          { "name": "inspector", "type": "address", "internalType": "address" },
          { "name": "timestamp", "type": "uint256", "internalType": "uint256" },
          { "name": "summary", "type": "string", "internalType": "string" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRecordCount",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isRegistered",
    "inputs": [
      { "name": "targetContract", "type": "address", "internalType": "address" }
    ],
    "outputs": [
      { "name": "", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAllTargetAddresses",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "address[]", "internalType": "address[]" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "CheckRecorded",
    "inputs": [
      { "name": "targetContract", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "inspector", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "standardType", "type": "uint8", "indexed": false, "internalType": "enum EIPCheckerRegistry.StandardType" },
      { "name": "complianceScore", "type": "uint16", "indexed": false, "internalType": "uint16" },
      { "name": "flags", "type": "uint32", "indexed": false, "internalType": "uint32" },
      { "name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "summary", "type": "string", "indexed": false, "internalType": "string" }
    ],
    "anonymous": false
  }
] as const;
