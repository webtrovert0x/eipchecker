// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EIPCheckerRegistry
 * @dev On-chain inspector & registry for smart contract standards compliance on BOTChain Testnet.
 * EVERY check, inspection, and recording function is an on-chain transaction that requires
 * a network GAS FEE ONLY. Zero platform fees, zero protocol fees (msg.value == 0).
 */
contract EIPCheckerRegistry {
    // Enum representing recognized token standards
    enum StandardType {
        UNKNOWN,    // 0: Unidentified / Custom
        ERC20,      // 1: ERC-20 Fungible Token
        ERC721,     // 2: ERC-721 Non-Fungible Token
        ERC1155     // 3: ERC-1155 Multi-Token
    }

    struct CheckRecord {
        address targetContract;
        StandardType standardType;
        uint16 complianceScore;     // 0 - 100 (%)
        uint32 flags;               // Bitmask of diagnostic findings
        address inspector;
        uint256 timestamp;
        string summary;             // Short diagnostic summary
    }

    struct InspectionState {
        bool hasErc165;
        bool invSafe;
        bool declares721;
        bool ownerOfReverts;
        bool declares1155;
        bool hasSupply;
        bool hasBal;
        bool hasAllow;
        bool hasMeta;
        bool hasDec;
        bool isVoidReturnQuirk;
    }

    // Diagnostic bitmask flags
    uint32 public constant FLAG_ERC165_SUPPORTED = 1 << 0;           // 1
    uint32 public constant FLAG_ERC165_INVALID_VECTOR_SAFE = 1 << 1; // 2
    uint32 public constant FLAG_METADATA_SUPPORTED = 1 << 2;         // 4
    uint32 public constant FLAG_STANDARD_SELECTORS_FOUND = 1 << 3;   // 8
    uint32 public constant FLAG_NON_STANDARD_RETURN_TYPE = 1 << 4;   // 16 (e.g. USDT missing bool return)
    uint32 public constant FLAG_REVERT_RULES_COMPLIANT = 1 << 5;     // 32 (ERC-721 ownerOf reverts on invalid token)
    uint32 public constant FLAG_CUSTOM_OR_SUSPICIOUS = 1 << 6;       // 64

    // Mapping from target contract address to inspection record
    mapping(address => CheckRecord) public records;

    // Array of all inspected contract addresses for directory enumeration
    address[] public directoryAddresses;

    // Mapping to check if an address has been indexed
    mapping(address => bool) private _isIndexed;

    // Event emitted when any check or inspect transaction completes
    event CheckRecorded(
        address indexed targetContract,
        address indexed inspector,
        StandardType standardType,
        uint16 complianceScore,
        uint32 flags,
        uint256 timestamp,
        string summary
    );

    /**
     * @notice Performs full on-chain inspection of a contract and records findings.
     * @dev Transaction requires a network GAS FEE ONLY. Zero protocol fees.
     * @param targetContract Address of the smart contract to inspect.
     */
    function inspectAndRecord(address targetContract) external returns (
        StandardType detectedType,
        uint16 complianceScore,
        uint32 flags,
        string memory summary
    ) {
        require(targetContract != address(0), "Invalid target address");
        uint256 size;
        assembly { size := extcodesize(targetContract) }
        require(size > 0, "Target address has no bytecode");

        InspectionState memory state = _executeInspectionProbes(targetContract);

        if (state.hasErc165) flags |= FLAG_ERC165_SUPPORTED;
        if (state.invSafe) flags |= FLAG_ERC165_INVALID_VECTOR_SAFE;
        if (state.ownerOfReverts) flags |= FLAG_REVERT_RULES_COMPLIANT;
        if (state.hasMeta) flags |= FLAG_METADATA_SUPPORTED;
        if (state.isVoidReturnQuirk) {
            flags |= FLAG_NON_STANDARD_RETURN_TYPE;
            flags |= FLAG_CUSTOM_OR_SUSPICIOUS;
        }

        // Standard Determination
        if (state.declares721 || (state.ownerOfReverts && state.hasBal && !state.hasSupply)) {
            detectedType = StandardType.ERC721;
            uint16 score = 50;
            if (state.declares721) score += 20;
            if (state.invSafe) score += 10;
            if (state.ownerOfReverts) score += 10;
            if (state.hasMeta) score += 10;
            complianceScore = score > 100 ? 100 : score;
            summary = state.invSafe
                ? "Verified ERC-721 (Compliant)"
                : "ERC-721: Broken ERC-165 0xffffffff vector";
        } else if (state.declares1155) {
            detectedType = StandardType.ERC1155;
            uint16 score = 60;
            if (state.invSafe) score += 20;
            if (state.hasMeta) score += 20;
            complianceScore = score > 100 ? 100 : score;
            summary = "Verified ERC-1155 (Multi-Token)";
        } else if (state.hasSupply && state.hasBal && (state.hasAllow || state.hasDec || state.hasMeta)) {
            detectedType = StandardType.ERC20;
            flags |= FLAG_STANDARD_SELECTORS_FOUND;
            uint16 score = 60;
            if (state.hasAllow) score += 15;
            if (state.hasMeta) score += 15;
            if (state.hasDec) score += 10;
            if (state.isVoidReturnQuirk) {
                if (score > 15) score -= 15;
                summary = "ERC-20: Missing bool return (USDT Quirk)";
            } else {
                summary = "Verified ERC-20 (Standard Compliant)";
            }
            complianceScore = score > 100 ? 100 : score;
        } else {
            detectedType = StandardType.UNKNOWN;
            complianceScore = 20;
            flags |= FLAG_CUSTOM_OR_SUSPICIOUS;
            summary = "Custom / Non-Standard Contract";
        }

        records[targetContract] = CheckRecord({
            targetContract: targetContract,
            standardType: detectedType,
            complianceScore: complianceScore,
            flags: flags,
            inspector: msg.sender,
            timestamp: block.timestamp,
            summary: summary
        });

        if (!_isIndexed[targetContract]) {
            _isIndexed[targetContract] = true;
            directoryAddresses.push(targetContract);
        }

        emit CheckRecorded(
            targetContract,
            msg.sender,
            detectedType,
            complianceScore,
            flags,
            block.timestamp,
            summary
        );

        return (detectedType, complianceScore, flags, summary);
    }

    function _executeInspectionProbes(address target) internal returns (InspectionState memory s) {
        // 1. ERC-165 probes
        (bool ok165, bytes memory d165) = target.staticcall{gas: 25000}(
            abi.encodeWithSelector(0x01ffc9a7, bytes4(0x01ffc9a7))
        );
        s.hasErc165 = ok165 && d165.length >= 32 && abi.decode(d165, (bool));

        (bool okInv, bytes memory dInv) = target.staticcall{gas: 25000}(
            abi.encodeWithSelector(0x01ffc9a7, bytes4(0xffffffff))
        );
        s.invSafe = okInv && dInv.length >= 32 && !abi.decode(dInv, (bool));

        // 2. ERC-721 probes
        (bool ok721, bytes memory d721) = target.staticcall{gas: 25000}(
            abi.encodeWithSelector(0x01ffc9a7, bytes4(0x80ac58cd))
        );
        s.declares721 = ok721 && d721.length >= 32 && abi.decode(d721, (bool));

        (bool okOwner,) = target.staticcall{gas: 25000}(
            abi.encodeWithSelector(0x6352211e, uint256(999999999999999))
        );
        s.ownerOfReverts = !okOwner;

        // 3. ERC-1155 probe
        (bool ok1155, bytes memory d1155) = target.staticcall{gas: 25000}(
            abi.encodeWithSelector(0x01ffc9a7, bytes4(0xd9b67a26))
        );
        s.declares1155 = ok1155 && d1155.length >= 32 && abi.decode(d1155, (bool));

        // 4. ERC-20 probes
        (bool okSupply, bytes memory dSupply) = target.staticcall{gas: 25000}(abi.encodeWithSelector(0x18160ddd));
        s.hasSupply = okSupply && dSupply.length >= 32;

        (bool okBal, bytes memory dBal) = target.staticcall{gas: 25000}(abi.encodeWithSelector(0x70a08231, address(1)));
        s.hasBal = okBal && dBal.length >= 32;

        (bool okAllow, bytes memory dAllow) = target.staticcall{gas: 25000}(abi.encodeWithSelector(0xdd62ed3e, address(1), address(1)));
        s.hasAllow = okAllow && dAllow.length >= 32;

        (bool okName,) = target.staticcall{gas: 25000}(abi.encodeWithSelector(0x06fdde03));
        (bool okSym,) = target.staticcall{gas: 25000}(abi.encodeWithSelector(0x95d89b41));
        s.hasMeta = okName && okSym;

        (bool okDec,) = target.staticcall{gas: 25000}(abi.encodeWithSelector(0x313ce567));
        s.hasDec = okDec;

        // USDT return value quirk test (void return)
        (bool okTransfer, bytes memory dTransfer) = target.call{gas: 35000}(
            abi.encodeWithSelector(0xa9059cbb, address(1), uint256(0))
        );
        s.isVoidReturnQuirk = okTransfer && dTransfer.length == 0;
    }

    /**
     * @notice Manually record or attest an inspection check.
     * @dev Transaction requires network GAS FEE ONLY. Zero protocol fees.
     */
    function recordCheck(
        address targetContract,
        StandardType standardType,
        uint16 complianceScore,
        uint32 flags,
        string calldata summary
    ) external {
        require(targetContract != address(0), "Invalid target address");
        require(complianceScore <= 100, "Score cannot exceed 100");

        records[targetContract] = CheckRecord({
            targetContract: targetContract,
            standardType: standardType,
            complianceScore: complianceScore,
            flags: flags,
            inspector: msg.sender,
            timestamp: block.timestamp,
            summary: summary
        });

        if (!_isIndexed[targetContract]) {
            _isIndexed[targetContract] = true;
            directoryAddresses.push(targetContract);
        }

        emit CheckRecorded(
            targetContract,
            msg.sender,
            standardType,
            complianceScore,
            flags,
            block.timestamp,
            summary
        );
    }

    /**
     * @notice Returns total number of inspected contracts in the directory.
     */
    function getRecordCount() external view returns (uint256) {
        return directoryAddresses.length;
    }

    /**
     * @notice Returns paginated directory records.
     */
    function getRecords(uint256 offset, uint256 limit) external view returns (CheckRecord[] memory) {
        uint256 total = directoryAddresses.length;
        if (offset >= total) {
            return new CheckRecord[](0);
        }

        uint256 count = limit;
        if (offset + count > total) {
            count = total - offset;
        }

        CheckRecord[] memory result = new CheckRecord[](count);
        for (uint256 i = 0; i < count; i++) {
            address target = directoryAddresses[offset + i];
            result[i] = records[target];
        }

        return result;
    }

    /**
     * @notice Returns the full inspection record for a specific contract.
     */
    function getRecord(address targetContract) external view returns (CheckRecord memory) {
        return records[targetContract];
    }

    /**
     * @notice Checks if a target contract has been inspected in the directory.
     */
    function isRegistered(address targetContract) external view returns (bool) {
        return _isIndexed[targetContract];
    }

    /**
     * @notice Returns all indexed addresses in the directory.
     */
    function getAllTargetAddresses() external view returns (address[] memory) {
        return directoryAddresses;
    }
}
