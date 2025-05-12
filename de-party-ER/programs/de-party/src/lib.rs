use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::{commit, ephemeral};
pub mod states;
pub mod contexts;
pub mod errors;
pub use states::*;
pub use contexts::*;
pub use errors::*;

declare_id!("ParTyJHHCxDHCZkeXBZTAtMQT1t1eospvjgYdpYQmHb");

#[ephemeral]
#[program]
pub mod de_party {
    use ephemeral_rollups_sdk::ephem::{commit_accounts, commit_and_undelegate_accounts};

    use super::*;
    pub fn setup(ctx: Context<Setup>, party_fee: u64, reward_basis_points: u64, vote_consensus: u8) -> Result<()> {
        ctx.accounts.setup(party_fee, reward_basis_points, vote_consensus, &ctx.bumps)
    }
    pub fn init(ctx: Context<Initialize>, name:String)-> Result<()>{
        ctx.accounts.init(name,&ctx.bumps)
    }
    pub fn create(ctx: Context<CreateParty>, name:String, description:String, min_holdings:u64,capacity:u8)-> Result<()>{
        ctx.accounts.create_party(name, description, min_holdings , &ctx.bumps, capacity)
    }
    pub fn join(ctx: Context<Join>)-> Result<()>{
        ctx.accounts.join()
    }
    pub fn close(ctx: Context<Close>)-> Result<()>{
        ctx.accounts.close()
    }
    pub fn start_poll(ctx: Context<StartPoll>, poll_type: u8, question: String, options: Vec<String>)-> Result<()>{
        ctx.accounts.start_poll(poll_type, question, options, &ctx.bumps)
    }
    pub fn vote(ctx: Context<Vote>, option_index: u8)-> Result<()>{
        ctx.accounts.vote(option_index)
    }
    pub fn end_party(ctx: Context<EndParty>)-> Result<()>{
        ctx.accounts.end_party()
    }
    pub fn delegate_party(ctx: Context<DelegateInput>,mint: Pubkey,user: Pubkey)-> Result<()>{
        ctx.accounts.delegate(mint,user)
    }
    pub fn close_config(ctx: Context<CloseConfig>)-> Result<()>{
        ctx.accounts.close()
    }
    pub fn withdraw_treasury(ctx: Context<WithdrawTreasury>, amount: u64)-> Result<()>{
        ctx.accounts.withdraw_treasury(amount)
    }
        /// Undelegate the account from the delegation program
    pub fn undelegate_party(ctx: Context<IncrementAndCommit>) -> Result<()> {
            commit_and_undelegate_accounts(
                &ctx.accounts.payer,
                vec![&ctx.accounts.party.to_account_info()],
                &ctx.accounts.magic_context,
                &ctx.accounts.magic_program,
            )?;
            Ok(())
    }
        /// Manual commit the account in the ER.
        pub fn commit_party(ctx: Context<IncrementAndCommit>) -> Result<()> {
            commit_accounts(
                &ctx.accounts.payer,
                vec![&ctx.accounts.party.to_account_info()],
                &ctx.accounts.magic_context,
                &ctx.accounts.magic_program,
            )?;
            Ok(())
        }
    
    
}

/// Account for the increment instruction + manual commit.
#[commit]
#[derive(Accounts)]
pub struct IncrementAndCommit<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, seeds = [PARTY_PDA_SEED], bump)]
    pub party: Account<'info, Party>,
}
