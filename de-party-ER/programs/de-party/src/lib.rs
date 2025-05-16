use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::ephemeral;
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
    pub fn close_profile(ctx: Context<CloseProfile>)-> Result<()>{
        ctx.accounts.close()
    }
    pub fn close_party(ctx: Context<CloseParty>)-> Result<()>{
        ctx.accounts.close()
    }
    pub fn start_poll(ctx: Context<StartPoll>, poll_type: u8, question: String, options: Vec<String>, party: Pubkey)-> Result<()>{
        ctx.accounts.start_poll(poll_type, question, options, party, &ctx.bumps)
    }
    pub fn vote(ctx: Context<Vote>, option_index: u8)-> Result<()>{
        ctx.accounts.vote(option_index)
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
    pub fn delegate_poll(ctx: Context<DelegatePoll>,party: Pubkey)-> Result<()>{
        ctx.accounts.delegate(party)
    }
    pub fn undelegate_party(ctx: Context<UndelegateParty>)-> Result<()>{
        ctx.accounts.undelegate_party()
    }
    pub fn update_config(ctx: Context<UpdateConfig>, party_fee: u64, reward_basis_points: u64, vote_consensus: u8)-> Result<()>{
        ctx.accounts.update_config(party_fee, reward_basis_points, vote_consensus)
    }
    pub fn undelegate_poll(ctx: Context<UndelegatePoll>)-> Result<()>{
        ctx.accounts.undelegate_poll()
    }
    pub fn close_poll(ctx: Context<ClosePoll>)-> Result<()>{
        ctx.accounts.close()
    }
}
