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
    pub fn init(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}


