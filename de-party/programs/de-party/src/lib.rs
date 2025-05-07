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
    pub fn setup(ctx: Context<Setup>, party_fee: u64, reward_basis_points: u64) -> Result<()> {
        ctx.accounts.setup(party_fee, reward_basis_points, &ctx.bumps)
    }
    pub fn init(ctx: Context<Initialize>, name:String)-> Result<()>{
        ctx.accounts.init(name,&ctx.bumps)
    }

}


