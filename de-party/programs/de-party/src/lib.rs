use anchor_lang::prelude::*;
pub mod states;
pub mod contexts;
pub mod errors;
pub use states::*;
pub use contexts::*;
pub use errors::*;

declare_id!("BsyqwwzW4gxZ74epwgGuc3N1qsjg67zsZXyLmYodMLGv");

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
    pub fn close(ctx: Context<Close>)-> Result<()>{
        ctx.accounts.close()
    }
    pub fn start_poll(ctx: Context<StartPoll>, poll_type: u8, question: String, options: Vec<String>)-> Result<()>{
        ctx.accounts.start_poll(poll_type, question, options, &ctx.bumps)
    }
    pub fn vote(ctx: Context<Vote>, option_index: u8)-> Result<()>{
        ctx.accounts.vote(option_index)
    }
    pub fn end_poll(ctx: Context<EndPoll>)-> Result<()>{
        ctx.accounts.end_poll()
    }
    pub fn end_party(ctx: Context<EndParty>)-> Result<()>{
        ctx.accounts.end_party()
    }
    pub fn kick(ctx: Context<Kick>)-> Result<()>{
        ctx.accounts.kick()
    }
    pub fn mute(ctx: Context<Mute>)-> Result<()>{
        ctx.accounts.mute()
    }
    
}


