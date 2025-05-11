import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { DeParty } from "../target/types/de_party";
import { LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import { createMint,createTransferInstruction,getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from "@solana/spl-token";

describe("de-party", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.deParty as Program<DeParty>;
  const user = anchor.web3.Keypair.generate();
  const joiner = anchor.web3.Keypair.generate();
  const joiner2 = anchor.web3.Keypair.generate();
  const admin = anchor.web3.Keypair.generate();
  const mintKP = anchor.web3.Keypair.generate();
  const partyPDA = PublicKey.findProgramAddressSync(
    [Buffer.from("party"),user.publicKey.toBuffer(),mintKP.publicKey.toBuffer()],
    program.programId
  )[0];
  const profilePDA = PublicKey.findProgramAddressSync(
    [Buffer.from("profile"),user.publicKey.toBuffer()],
    program.programId
  )[0];
  const configPDA = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  )[0];
  const treasuryPDA = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    program.programId
  )[0];

  it("Admin initializing config", async () => {
    //Airdropping the admin
    const adminAirdrop = await program.provider.connection.requestAirdrop(
      admin.publicKey,
      1* LAMPORTS_PER_SOL
    );
    await program.provider.connection.confirmTransaction(adminAirdrop);
    const tx = await program.methods.setup(new BN(0.1 * LAMPORTS_PER_SOL), new BN(100), 51).accountsPartial({
      config: configPDA,
      admin: admin.publicKey,
      treasury: treasuryPDA
    }).signers([admin]).rpc();
    const config = await program.account.config.fetch(configPDA);
    console.log("Config", config);
  });
  it("User initializing profile", async () => {
    //Airdropping the user
    const userAirdrop = await program.provider.connection.requestAirdrop(
      user.publicKey,
      1* LAMPORTS_PER_SOL
    );
    // Waiting for the airdrop to be confirmed
    await program.provider.connection.confirmTransaction(userAirdrop);

    // Sending the transaction
    const tx = await program.methods.init("Kira").accountsPartial({
      profile: profilePDA,
      user: user.publicKey
    }).signers([user]).rpc();
    //Logging the profile
    const profile = await program.account.profile.fetch(profilePDA);
    console.log("Profile", profile);
  });
  it("User creating party and joins it", async () => {
    //creating mint and token account for demonstration purposes
        const mint = await createMint(program.provider.connection,user,user.publicKey,null,6,mintKP);
        console.log(`Mint Address: ${mint.toBase58()}`); 
        // Create an ATA
        const ata = await getOrCreateAssociatedTokenAccount(program.provider.connection,user,mint,user.publicKey);
        console.log(`Your ata is: ${ata.address.toBase58()}`);
       
               // Mint to ATA
        const mintTx = await mintTo(program.provider.connection,user,mint,ata.address,user.publicKey,99999999999);
        console.log(`Your mint txid: ${mintTx}`);
        const ataBalance = await program.provider.connection.getTokenAccountBalance(ata.address);
        console.log(`Your ata balance: ${ataBalance.value.amount}`);

        const tx1 = await program.methods.create("WIF WHALES", "Party for wif whales to build the social presence.", new BN(19981998),10).accountsPartial({
        party: partyPDA,
        mint: mint,
        tokenAccount: ata.address,
        user: user.publicKey,
        treasury: treasuryPDA,
        profile: profilePDA
      }).signers([user]).rpc();
      const party = await program.account.party.fetch(partyPDA);
      console.log('Party required tokens:', party.tokensRequired.toString());
      const tx2 = await program.methods.join().accountsPartial({
        party: partyPDA,
        user: user.publicKey,
        tokenAccount: ata.address,
        profile: profilePDA
      }).signers([user]).rpc();
    });
    it("Second user initializing profile and joining party", async () => {
      const joinerAirdrop = await program.provider.connection.requestAirdrop(
        joiner.publicKey,
        1* LAMPORTS_PER_SOL
      );
      await program.provider.connection.confirmTransaction(joinerAirdrop);
      // Create an ATA
      const userAta = await getOrCreateAssociatedTokenAccount(program.provider.connection,user,mintKP.publicKey,user.publicKey);
      const joinerAta = await getOrCreateAssociatedTokenAccount(program.provider.connection,joiner,mintKP.publicKey,joiner.publicKey);
      console.log(`Your ata is: ${joinerAta.address.toBase58()}`);
      //send 19981998 tokens to joiner
      const transaction = new Transaction().add(
        createTransferInstruction(
          userAta.address,
          joinerAta.address,
          user.publicKey,
          19981998
        )
      );
    
      // Sign transaction, broadcast, and confirm
      await sendAndConfirmTransaction(program.provider.connection, transaction, [user]);
      const joinerProfilePDA = PublicKey.findProgramAddressSync(
        [Buffer.from("profile"),joiner.publicKey.toBuffer()],
        program.programId
      )[0];
          // Sending the transaction
    const tx1 = await program.methods.init("Bob").accountsPartial({
      profile: joinerProfilePDA,
      user: joiner.publicKey
    }).signers([joiner]).rpc();
    //Logging the profile
    const profile = await program.account.profile.fetch(joinerProfilePDA);
    console.log("Profile", profile);
      const tx2 = await program.methods.join().accountsPartial({
        party: partyPDA,
        user: joiner.publicKey,
        tokenAccount: joinerAta.address,
        profile: joinerProfilePDA
      }).signers([joiner]).rpc();
    });
    it ("Third user initializing profile and joining party", async () => {
      const joinerAirdrop = await program.provider.connection.requestAirdrop(
        joiner2.publicKey,
        1* LAMPORTS_PER_SOL
      );
      await program.provider.connection.confirmTransaction(joinerAirdrop);
      // Create an ATA
      const userAta = await getOrCreateAssociatedTokenAccount(program.provider.connection,user,mintKP.publicKey,user.publicKey);
      const joiner2Ata = await getOrCreateAssociatedTokenAccount(program.provider.connection,joiner2,mintKP.publicKey,joiner2.publicKey);
      console.log(`Your ata is: ${joiner2Ata.address.toBase58()}`);
      //send 19981998 tokens to joiner2
      const transaction = new Transaction().add(
        createTransferInstruction(
          userAta.address,
          joiner2Ata.address,
          user.publicKey,
          19981998
        )
      );
    
      // Sign transaction, broadcast, and confirm
      await sendAndConfirmTransaction(program.provider.connection, transaction, [user]);
      const joiner2ProfilePDA = PublicKey.findProgramAddressSync(
        [Buffer.from("profile"),joiner2.publicKey.toBuffer()],
        program.programId
      )[0];
          // Sending the transaction
      const tx1 = await program.methods.init("Alice").accountsPartial({
        profile: joiner2ProfilePDA,
        user: joiner2.publicKey
      }).signers([joiner2]).rpc();
      //Logging the profile
      const profile = await program.account.profile.fetch(joiner2ProfilePDA);
      console.log("Profile", profile);
      const tx2 = await program.methods.join().accountsPartial({
        party: partyPDA,
        user: joiner2.publicKey,
        tokenAccount: joiner2Ata.address,
        profile: joiner2ProfilePDA
      }).signers([joiner2]).rpc();
    });

    it("User starting poll", async () => {
      const question = "What is the best way to build a social presence?";
      const options = ["Yes", "No"];
      const pollType = 2;
      const pollPDA = PublicKey.findProgramAddressSync(
        [Buffer.from("poll"),partyPDA.toBuffer()],
        program.programId
      )[0];
      const userPDA = PublicKey.findProgramAddressSync( 
        [Buffer.from("profile"),user.publicKey.toBuffer()],
        program.programId
      )[0];
      const tx = await program.methods.startPoll(pollType, question, options).accountsPartial({
        party: partyPDA,
        user: user.publicKey,
        config: configPDA,
        poll: pollPDA,
        profile: userPDA,
        target: null
      }).signers([user]).rpc();
    });
    
    it("First user voting", async () => {
      const optionIndex = 0;
      const pollPDA = PublicKey.findProgramAddressSync(
        [Buffer.from("poll"),partyPDA.toBuffer()],
        program.programId
      )[0];
      const tx = await program.methods.vote(optionIndex).accountsPartial({
        party: partyPDA,
        poll: pollPDA,
        treasury: treasuryPDA,
        voter: user.publicKey,
        config: configPDA
      }).signers([user]).rpc();
    });
    it("Second user voting", async () => {
      const optionIndex = 0;
      const pollPDA = PublicKey.findProgramAddressSync(
        [Buffer.from("poll"),partyPDA.toBuffer()],
        program.programId
      )[0];
      const tx = await program.methods.vote(optionIndex).accountsPartial({
        party: partyPDA,
        poll: pollPDA,
        treasury: treasuryPDA,
        voter: joiner.publicKey,
        config: configPDA
      }).signers([joiner]).rpc();
    });
    it("First user starting poll to mute second user", async () => {
      const question = "";
      const options = [];
      const pollType = 0;
      const pollPDA = PublicKey.findProgramAddressSync(
        [Buffer.from("poll"),partyPDA.toBuffer()],
        program.programId
      )[0];
      const userPDA = PublicKey.findProgramAddressSync( 
        [Buffer.from("profile"),user.publicKey.toBuffer()],
        program.programId
      )[0];
      const joinerPDA = PublicKey.findProgramAddressSync(
        [Buffer.from("profile"),joiner.publicKey.toBuffer()],
        program.programId
      )[0];

      const tx = await program.methods.startPoll(pollType, question, options).accountsPartial({
        party: partyPDA,
        user: user.publicKey,
        config: configPDA,
        poll: pollPDA,
        target: joinerPDA,
        profile: userPDA
      }).signers([user]).rpc();
    });
    it("First user voting to mute second user", async () => {
      const optionIndex = 0;
      const pollPDA = PublicKey.findProgramAddressSync(
        [Buffer.from("poll"),partyPDA.toBuffer()],
        program.programId
      )[0];
      const tx = await program.methods.vote(optionIndex).accountsPartial({
        party: partyPDA,
        poll: pollPDA,
        treasury: treasuryPDA,
        voter: user.publicKey,
        config: configPDA
      }).signers([user]).rpc();
      const poll = await program.account.poll.fetch(pollPDA);
      console.log("Poll", poll);
    });
    it("Third user voting to mute second user", async () => {
      const optionIndex = 0;
      const pollPDA = PublicKey.findProgramAddressSync(
        [Buffer.from("poll"),partyPDA.toBuffer()],
        program.programId
      )[0];
      const tx = await program.methods.vote(optionIndex).accountsPartial({
        party: partyPDA,
        poll: pollPDA,
        treasury: treasuryPDA,
        voter: joiner2.publicKey,
        config: configPDA
      }).signers([joiner2]).rpc();
    });
    it("First user starting poll to kick second user", async () => {
      const question = "";
      const options = [];
      const pollType = 1;
      const pollPDA = PublicKey.findProgramAddressSync(
        [Buffer.from("poll"),partyPDA.toBuffer()],
        program.programId
      )[0];
      const userPDA = PublicKey.findProgramAddressSync( 
        [Buffer.from("profile"),user.publicKey.toBuffer()],
        program.programId
      )[0];
      const joinerPDA = PublicKey.findProgramAddressSync(
        [Buffer.from("profile"),joiner.publicKey.toBuffer()],
        program.programId
      )[0];
      const tx = await program.methods.startPoll(pollType, question, options).accountsPartial({
        party: partyPDA,
        user: user.publicKey,
        config: configPDA,
        poll: pollPDA,
        target: joinerPDA,
        profile: userPDA
      }).signers([user]).rpc();
    });
    it("First user voting to kick second user", async () => {
      const optionIndex = 0;
      const pollPDA = PublicKey.findProgramAddressSync(
        [Buffer.from("poll"),partyPDA.toBuffer()],
        program.programId
      )[0];
      const tx = await program.methods.vote(optionIndex).accountsPartial({
        party: partyPDA,
        poll: pollPDA,
        treasury: treasuryPDA,
        voter: user.publicKey,
        config: configPDA
      }).signers([user]).rpc();
    });
    it("Second user voting No to kick second user", async () => {
      const optionIndex = 1;
      const pollPDA = PublicKey.findProgramAddressSync(
        [Buffer.from("poll"),partyPDA.toBuffer()],
        program.programId
      )[0];
      const tx = await program.methods.vote(optionIndex).accountsPartial({
        party: partyPDA,
        poll: pollPDA,
        treasury: treasuryPDA,
        voter: joiner.publicKey,
        config: configPDA
      }).signers([joiner]).rpc();
    });
    it("Third user voting to kick second user", async () => {
      const members_before = await program.account.party.fetch(partyPDA);
      console.log("Members before kick", members_before.members);
      const optionIndex = 0;
      const pollPDA = PublicKey.findProgramAddressSync(
        [Buffer.from("poll"),partyPDA.toBuffer()],
        program.programId
      )[0];
      const tx = await program.methods.vote(optionIndex).accountsPartial({
        party: partyPDA,
        poll: pollPDA,
        treasury: treasuryPDA,
        voter: joiner2.publicKey,
        config: configPDA
      }).signers([joiner2]).rpc();
      const members = await program.account.party.fetch(partyPDA);
      console.log("Members after kick", members.members);
    });
    
    it("User closing profile", async () => {
      const tx = await program.methods.close().accountsPartial({
        profile: profilePDA,
        user: user.publicKey,
      }).signers([user]).rpc();
    });

    
});
