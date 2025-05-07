use anchor_lang::prelude::*;
use crate::states::Party;

#[derive(Accounts)]
pub struct EndParty<'info> {
    #[account(
        mut,
        close = user,
        seeds = [b"party", party.key().as_ref(), mint.key().as_ref()],
        bump = party.bump,
    )]
    pub party: Account<'info, Party>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> EndParty<'info> {
    pub fn end_party(&mut self) -> Result<()> {
        Ok(())
    }
}
