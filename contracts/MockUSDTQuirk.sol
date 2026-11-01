// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Mock token demonstrating the famous USDT Quirk on BOTChain:
 * transfer() and transferFrom() return void (0 bytes) instead of bool!
 */
contract MockUSDTQuirk {
    string public name = "Tether USD Quirk Demo";
    string public symbol = "USDT-QUIRK";
    uint8 public decimals = 6;
    uint256 public totalSupply = 5000000 * 10**6;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    // The quirk: does NOT return bool!
    function transfer(address to, uint256 value) public {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
    }

    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    // The quirk: does NOT return bool!
    function transferFrom(address from, address to, uint256 value) public {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        balanceOf[from] -= value;
        allowance[from][msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }
}

