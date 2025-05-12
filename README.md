# DeParty - Decentralized Token-Gated Community Hub with Instant Finality

![DeParty Banner](./banner.png)

DeParty is a decentralized application that enables token/NFT-gated communities to collaborate with instant finality using MagicBlock's Ephemeral Rollups technology.

## Live Demo

Coming Soon (TBA)

Program ID: `ParTyJHHCxDHCZkeXBZTAtMQT1t1eospvjgYdpYQmHb`

## Project Description

DeParty revolutionizes community engagement by providing:
- **Instant finality** through MagicBlock's Ephemeral Rollups
- Token/NFT-gated party/room creation with **sub-second confirmation times**
- Decentralized discussion forums with **on-chain persistence**
- **Fast polling** for community decision making
- **Fair moderation** system with member consensus
- **Low-latency** collaborative environment

## Key Technologies

- **MagicBlock Ephemeral Rollups**: For instant transaction finality
- **Solana Blockchain**: For secure, decentralized state storage
- **Anchor Framework 0.31.1**: For Solana smart contract development
- **Token/NFT Standards**: For gating access to parties/rooms
- **SPL Governance**: For on-chain decision making

## Prerequisites

Ensure you have the following installed:

- **Rust**: `rustc 1.82.0` (active toolchain)
- **Solana CLI**: `solana-cli 2.1.21`
- **Anchor CLI**: `anchor-cli 0.31.1`
- **Node.js**: `v20.10.0` or later
- **npm**: `11.3.0`

## Building and Testing Locally

1. **Clone the Repository**
   ```bash
   git clone [https://github.com/kirarisk/DeParty.git]

2. **Navigate to the Project Directory**
   ```bash
   cd DeParty/de-party-ER/
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Build the Program**
   ```bash
   anchor build
   ```

5. **Run Tests**
   ```bash
   anchor test
   ```

## Project Structure

```
de-party-ER/
├── programs/          # Sagent program implementation
│   └── de-party/       # Core program logic
├── tests/            # Program test suite
├── migrations/       # Deployment scripts
├── Anchor.toml       # Anchor configuration
└── Cargo.toml        # Rust dependencies
```


## Performance Benchmarks

| Feature               | Traditional Solana| With Ephemeral Rollups |
|-----------------------|-------------------|------------------------|
| Confirmation Time     | 0.4 seconds       | <10ms                  |
| Poll Creation         | ~3 seconds        | Instant                |
| Moderation Actions    | ~4 seconds        | Sub-second             |
| Member Join/Leave     | ~3.5 seconds      | <400ms                 |
| Voting Resolution     | ~5 seconds        | <10 ms                 |
| Party Creation        | ~6 seconds        | 410ms                  |
| Message Propagation   | ~2 seconds        | Instant                |


## Test Results

When running `anchor test`, you should see successful test execution similar to the screenshots below (16 Passing):

### Test Execution
![Test Execution Screenshot](./test-execution.png)

*Screenshot showing the test suite running with all tests passing*

### Test Coverage
![Test Coverage Screenshot](./test-coverage.png)

*Screenshot showing test coverage metrics*