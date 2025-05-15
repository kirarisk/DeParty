// import * as anchor from "@coral-xyz/anchor";
// import { BN, Program } from "@coral-xyz/anchor";
// import { DeParty } from "../target/types/de_party";
// import { Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
// import {
//   GetCommitmentSignature,
// } from "@magicblock-labs/ephemeral-rollups-sdk";
// import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
// import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

// describe("de-party", () => {
//   // Configure the client to use the local cluster.
//   const provider = anchor.AnchorProvider.env();
//   anchor.setProvider(provider);

//   const providerEphemeralRollup = new anchor.AnchorProvider(
//     new anchor.web3.Connection(
//       process.env.PROVIDER_ENDPOINT || "https://devnet.magicblock.app/",
//       {
//         wsEndpoint: process.env.WS_ENDPOINT || "wss://devnet.magicblock.app/",
//       }
//     ),
//     anchor.Wallet.local()
//   );
//   console.log("Base Layer Connection: ", provider.connection.rpcEndpoint);
//   console.log("Ephemeral Rollup Connection: ", providerEphemeralRollup.connection.rpcEndpoint);
//   console.log(`Current SOL Public Key: ${anchor.Wallet.local().publicKey}`)


//   const program = anchor.workspace.deParty as Program<DeParty>;
//   const delegationProgram = new PublicKey("DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh");
//   let fartcoinPK = new PublicKey("");

//   const admin = Keypair.fromSecretKey(bs58.decode(""))
//   const partyPDA = PublicKey.findProgramAddressSync(
//     [Buffer.from("party"),fartcoinPK.toBuffer(),admin.publicKey.toBuffer()],
//     program.programId
//   )[0];
//   const profilePDA = PublicKey.findProgramAddressSync(
//     [Buffer.from("profile"),admin.publicKey.toBuffer()],
//     program.programId
//   )[0];
//   const configPDA = PublicKey.findProgramAddressSync(
//     [Buffer.from("config")],
//     program.programId
//   )[0];
//   const treasuryPDA = PublicKey.findProgramAddressSync(
//     [Buffer.from("treasury")],
//     program.programId
//   )[0];
//   before(async function () {
//     const balance = await provider.connection.getBalance(anchor.Wallet.local().publicKey)
//     console.log('Current balance is', balance / LAMPORTS_PER_SOL, ' SOL','\n')
//   })

//   console.log("Program ID: ", program.programId.toString())

//   // it("Closing party", async () => {
//   //     // let fartcoinPK = new PublicKey("4T6yxPtoZBHob9tyL8vuLzKAvm74f15wTJYbdSqPAmBN");
//   //     // let fartcoinAta = await getOrCreateAssociatedTokenAccount(program.provider.connection, admin,fartcoinPK,admin.publicKey);
//   //     console.log("Party PDA: ", partyPDA.toString());
//   //     let tx = await program.methods
//   //     .undelegateParty(fartcoinPK,admin.publicKey)
//   //     .accounts({
//   //       payer: providerEphemeralRollup.wallet.publicKey,
//   //       party: partyPDA,
//   //     })
//   //     .transaction();
//   //   tx.feePayer = providerEphemeralRollup.wallet.publicKey;
//   //   tx.recentBlockhash = (
//   //     await providerEphemeralRollup.connection.getLatestBlockhash()
//   //   ).blockhash;
//   //   tx = await providerEphemeralRollup.wallet.signTransaction(tx);

//   //   const txHash = await providerEphemeralRollup.sendAndConfirm(tx);
//   //     tx.feePayer = provider.wallet.publicKey;
//   //     const txCommitSgn = await GetCommitmentSignature(
//   //       txHash,
//   //       providerEphemeralRollup.connection
//   //   );
//   //     console.log(`(ER) Undelegate txHash: ${txCommitSgn}`);
//   // });
//   //   it("Undelegating poll", async () => {
//   //     // let fartcoinPK = new PublicKey("4T6yxPtoZBHob9tyL8vuLzKAvm74f15wTJYbdSqPAmBN");
//   //     // let fartcoinAta = await getOrCreateAssociatedTokenAccount(program.provider.connection, admin,fartcoinPK,admin.publicKey);
//   //     const pollPDA = PublicKey.findProgramAddressSync(
//   //       [Buffer.from("poll"),partyPDA.toBuffer()],
//   //       program.programId
//   //     )[0];
//   //     const userPDA = PublicKey.findProgramAddressSync( 
//   //       [Buffer.from("profile"),admin.publicKey.toBuffer()],
//   //       program.programId
//   //     )[0];
//   //     console.log("Poll PDA: ", pollPDA.toString());
//   //     let tx = await program.methods
//   //     .startPoll(1, "What is the best way to build a social presence?", ["Yes", "No"], partyPDA)
//   //     .accounts({
//   //       user: admin.publicKey,
//   //       poll: pollPDA,
//   //       profile: userPDA,
//   //       config: configPDA,
//   //       target: null,
//   //     })
//   //     .transaction();
//   //   tx.feePayer = providerEphemeralRollup.wallet.publicKey;
//   //   tx.recentBlockhash = (
//   //     await providerEphemeralRollup.connection.getLatestBlockhash()
//   //   ).blockhash;
//   //   tx = await providerEphemeralRollup.wallet.signTransaction(tx);

//   //   const txHash = await providerEphemeralRollup.sendAndConfirm(tx);
//   //     tx.feePayer = provider.wallet.publicKey;
//   //     const txCommitSgn = await GetCommitmentSignature(
//   //       txHash,
//   //       providerEphemeralRollup.connection
//   //   );
//   //     console.log(`(ER) Undelegate txHash: ${txCommitSgn}`);
//   // });
//   // it("Admin closing config", async () => {
//   //   const tx = await program.methods.closeConfig().accountsPartial({
//   //     config: configPDA,
//   //     admin: admin.publicKey,
//   //   }).signers([admin]).rpc();
//   //   console.log("Config closed");
//   // });
//   // it("Admin initializing config", async () => {
//   //   console.log("Admin pubkey:", admin.publicKey);
//   //   const tx = await program.methods.setup(new BN(0.01 * LAMPORTS_PER_SOL), new BN(100), 51).accountsPartial({
//   //     config: configPDA,
//   //     admin: admin.publicKey,
//   //     treasury: treasuryPDA
//   //   }).signers([admin]).rpc();
//   //   const config = await program.account.config.fetch(configPDA);
//   //   console.log("Config", config);
//   // });
//   // it("User initializing profile", async () => {
//   //   const tx = await program.methods.init("Kira").accountsPartial({
//   //     profile: profilePDA,
//   //     user: admin.publicKey
//   //   }).signers([admin]).rpc();
//   //   const profile = await program.account.profile.fetch(profilePDA);
//   //   console.log("Profile", profile);
//   // });
//   it("ER wallet creating party and delegates it to Ephemeral Rollup", async () => {
//     console.log("Party PDA: ", partyPDA.toString());
//     let fartcoinAta = await getOrCreateAssociatedTokenAccount(program.provider.connection, admin, fartcoinPK, admin.publicKey);
//     let tx = await program.methods
//     .create("FartCoin", "FartCoin party for OG farts to build the social presence.", new BN(5000), 5)
//     .accountsPartial({
//       party: partyPDA,
//       mint: fartcoinPK,
//       tokenAccount: fartcoinAta.address,
//       user: admin.publicKey,
//       treasury: treasuryPDA,
//       profile: profilePDA
//     })
//     .signers([admin]).rpc();
//     let party = await program.account.party.fetch(partyPDA);
//     let tx2 = await program.methods.delegateParty(fartcoinPK,admin.publicKey).accountsPartial({
//       payer: admin.publicKey,
//       pda: partyPDA,
//     }).signers([admin]).rpc();

//     console.log("Party created on Base Layer", party);
//   });
//   it("user joins the party", async () => {
//     const ata = await getOrCreateAssociatedTokenAccount(program.provider.connection, admin, fartcoinPK, admin.publicKey);
//     let tx = await program.methods.join().accountsPartial({
//       party: partyPDA,
//       user: admin.publicKey,
//       tokenAccount: ata.address,
//       profile: profilePDA
//     }).signers([admin]).transaction();
//     tx.feePayer = providerEphemeralRollup.wallet.publicKey;
//     tx.recentBlockhash = (
//       await providerEphemeralRollup.connection.getLatestBlockhash()
//     ).blockhash;
//     tx = await providerEphemeralRollup.wallet.signTransaction(tx);
//     const txHash = await providerEphemeralRollup.sendAndConfirm(tx);
//     console.log("User joined party");
//   });
//   it("User starting poll", async () => {
//     const question = "What is the best way to build a social presence?";
//     const options = ["Yes", "No"];
//     const pollType = 2;
//     const pollPDA = PublicKey.findProgramAddressSync(
//       [Buffer.from("poll"),partyPDA.toBuffer(),admin.publicKey.toBuffer()],
//       program.programId
//     )[0];
//     const tx = await program.methods.startPoll(pollType, question, options, partyPDA).accountsPartial({
//       user: admin.publicKey,
//       config: configPDA,
//       poll: pollPDA,
//       profile: profilePDA,
//       target: null,
//     }).signers([admin]).rpc();
//     let tx2 = await program.methods.delegatePoll(partyPDA,admin.publicKey).accountsPartial({
//       payer: admin.publicKey,
//       pda: pollPDA,
//     }).signers([admin]).rpc();
//     console.log("Poll started");
//   });
//   it("First user voting", async () => {
//     console.log("Party PDA: ", partyPDA.toString());
//     const optionIndex = 0;
//     const pollPDA = PublicKey.findProgramAddressSync(
//       [Buffer.from("poll"),partyPDA.toBuffer(),admin.publicKey.toBuffer()],
//       program.programId
//     )[0];
//     let tx = await program.methods.vote(optionIndex).accountsPartial({
//       party: partyPDA,
//       poll: pollPDA,
//       voter: admin.publicKey,
//       config: configPDA,
//       profile: profilePDA,
//     }).signers([admin]).transaction();
//     tx.feePayer = providerEphemeralRollup.wallet.publicKey;
//     tx.recentBlockhash = (
//       await providerEphemeralRollup.connection.getLatestBlockhash()
//     ).blockhash;
//     tx = await providerEphemeralRollup.wallet.signTransaction(tx);
//     const txHash = await providerEphemeralRollup.sendAndConfirm(tx);
//     console.log("Vote transaction submitted:", txHash);
//   });
//   //   it("Second user voting", async () => {
//   //     const optionIndex = 0;
//   //     const pollPDA = PublicKey.findProgramAddressSync(
//   //       [Buffer.from("poll"),partyPDA.toBuffer()],
//   //       program.programId
//   //     )[0];
//   //     const tx = await program.methods.vote(optionIndex).accountsPartial({
//   //       party: partyPDA,
//   //       poll: pollPDA,
//   //       treasury: treasuryPDA,
//   //       voter: joiner.publicKey,
//   //       config: configPDA
//   //     }).signers([joiner]).rpc();
//   //   });
//   //   it("First user starting poll to mute second user", async () => {
//   //     const question = "";
//   //     const options = [];
//   //     const pollType = 0;
//   //     const pollPDA = PublicKey.findProgramAddressSync(
//   //       [Buffer.from("poll"),partyPDA.toBuffer()],
//   //       program.programId
//   //     )[0];
//   //     const userPDA = PublicKey.findProgramAddressSync( 
//   //       [Buffer.from("profile"),admin.publicKey.toBuffer()],
//   //       program.programId
//   //     )[0];
//   //     const joinerPDA = PublicKey.findProgramAddressSync(
//   //       [Buffer.from("profile"),joiner.publicKey.toBuffer()],
//   //       program.programId
//   //     )[0];

//   //     const tx = await program.methods.startPoll(pollType, question, options).accountsPartial({
//   //       party: partyPDA,
//   //       user: admin.publicKey,
//   //       config: configPDA,
//   //       poll: pollPDA,
//   //       target: joinerPDA,
//   //       profile: userPDA
//   //     }).signers([admin]).rpc();
//   //   });
//   //   it("First user voting to mute second user", async () => {
//   //     const optionIndex = 0;
//   //     const pollPDA = PublicKey.findProgramAddressSync(
//   //       [Buffer.from("poll"),partyPDA.toBuffer()],
//   //       program.programId
//   //     )[0];
//   //     const tx = await program.methods.vote(optionIndex).accountsPartial({
//   //       party: partyPDA,
//   //       poll: pollPDA,
//   //       treasury: treasuryPDA,
//   //       voter: user.publicKey,
//   //       config: configPDA
//   //     }).signers([user]).rpc();
//   //     const poll = await program.account.poll.fetch(pollPDA);
//   //     console.log("Poll", poll);
//   //   });
//   //   it("Third user voting to mute second user", async () => {
//   //     const optionIndex = 0;
//   //     const pollPDA = PublicKey.findProgramAddressSync(
//   //       [Buffer.from("poll"),partyPDA.toBuffer()],
//   //       program.programId
//   //     )[0];
//   //     const tx = await program.methods.vote(optionIndex).accountsPartial({
//   //       party: partyPDA,
//   //       poll: pollPDA,
//   //       treasury: treasuryPDA,
//   //       voter: joiner2.publicKey,
//   //       config: configPDA
//   //     }).signers([joiner2]).rpc();
//   //   });
//   //   it("First user starting poll to kick second user", async () => {
//   //     const question = "";
//   //     const options = [];
//   //     const pollType = 1;
//   //     const pollPDA = PublicKey.findProgramAddressSync(
//   //       [Buffer.from("poll"),partyPDA.toBuffer()],
//   //       program.programId
//   //     )[0];
//   //     const userPDA = PublicKey.findProgramAddressSync( 
//   //       [Buffer.from("profile"),user.publicKey.toBuffer()],
//   //       program.programId
//   //     )[0];
//   //     const joinerPDA = PublicKey.findProgramAddressSync(
//   //       [Buffer.from("profile"),joiner.publicKey.toBuffer()],
//   //       program.programId
//   //     )[0];
//   //     const tx = await program.methods.startPoll(pollType, question, options).accountsPartial({
//   //       party: partyPDA,
//   //       user: user.publicKey,
//   //       config: configPDA,
//   //       poll: pollPDA,
//   //       target: joinerPDA,
//   //       profile: userPDA
//   //     }).signers([user]).rpc();
//   //   });
//   //   it("First user voting to kick second user", async () => {
//   //     const optionIndex = 0;
//   //     const pollPDA = PublicKey.findProgramAddressSync(
//   //       [Buffer.from("poll"),partyPDA.toBuffer()],
//   //       program.programId
//   //     )[0];
//   //     const tx = await program.methods.vote(optionIndex).accountsPartial({
//   //       party: partyPDA,
//   //       poll: pollPDA,
//   //       treasury: treasuryPDA,
//   //       voter: user.publicKey,
//   //       config: configPDA
//   //     }).signers([user]).rpc();
//   //   });
//   //   it("Second user voting No to kick second user", async () => {
//   //     const optionIndex = 1;
//   //     const pollPDA = PublicKey.findProgramAddressSync(
//   //       [Buffer.from("poll"),partyPDA.toBuffer()],
//   //       program.programId
//   //     )[0];
//   //     const tx = await program.methods.vote(optionIndex).accountsPartial({
//   //       party: partyPDA,
//   //       poll: pollPDA,
//   //       treasury: treasuryPDA,
//   //       voter: joiner.publicKey,
//   //       config: configPDA
//   //     }).signers([joiner]).rpc();
//   //   });
//   //   it("Third user voting to kick second user", async () => {
//   //     const members_before = await program.account.party.fetch(partyPDA);
//   //     console.log("Members before kick", members_before.members);
//   //     const optionIndex = 0;
//   //     const pollPDA = PublicKey.findProgramAddressSync(
//   //       [Buffer.from("poll"),partyPDA.toBuffer()],
//   //       program.programId
//   //     )[0];
//   //     const tx = await program.methods.vote(optionIndex).accountsPartial({
//   //       party: partyPDA,
//   //       poll: pollPDA,
//   //       treasury: treasuryPDA,
//   //       voter: joiner2.publicKey,
//   //       config: configPDA
//   //     }).signers([joiner2]).rpc();
//   //     const members = await program.account.party.fetch(partyPDA);
//   //     console.log("Members after kick", members.members);
//   //   });
    
//   //   it("User closing profile", async () => {
//   //     const tx = await program.methods.close().accountsPartial({
//   //       profile: profilePDA,
//   //       user: user.publicKey,
//   //     }).signers([user]).rpc();
//   //   });

//   });

