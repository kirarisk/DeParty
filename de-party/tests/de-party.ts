import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { DeParty } from "../target/types/de_party";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
describe("de-party", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.deParty as Program<DeParty>;
  const user = anchor.web3.Keypair.generate();
  const admin = anchor.web3.Keypair.generate();
  const profilePDA = PublicKey.findProgramAddressSync(
    [Buffer.from("profile"),user.publicKey.toBuffer()],
    program.programId
  )[0];
  const configPDA = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  )[0];

  it("Admin initializing config", async () => {
    //Airdropping the admin
    const adminAirdrop = await program.provider.connection.requestAirdrop(
      admin.publicKey,
      1* LAMPORTS_PER_SOL
    );
    await program.provider.connection.confirmTransaction(adminAirdrop);
    const tx = await program.methods.setup(new BN(0.1 * LAMPORTS_PER_SOL), new BN(100)).accountsPartial({
      config: configPDA,
      admin: admin.publicKey
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
  it("User creating party", async () => {
    const tx = await program.methods.createParty(new BN(0.1 * LAMPORTS_PER_SOL), new BN(100)).accountsPartial({
      config: configPDA,
      admin: admin.publicKey
    }).signers([admin]).rpc();
  });
});
