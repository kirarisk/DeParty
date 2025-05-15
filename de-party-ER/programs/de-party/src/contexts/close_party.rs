use anchor_lang::prelude::*;
use crate::states::Party;


#[derive(Accounts)]
pub struct CloseParty<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        close = user,
    )]
    pub party: Account<'info, Party>,
    pub system_program: Program<'info, System>,
}

impl<'info> CloseParty<'info> {
    pub fn close(&mut self) -> Result<()> {
        Ok(())
    }
}