use anchor_lang::prelude::*;
use crate::states::Config;
#[derive(Accounts)]
pub struct CloseConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        mut,
        close = admin,
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}  

impl<'info> CloseConfig<'info> {
    pub fn close(&mut self) -> Result<()> {
        Ok(())
    }
}
