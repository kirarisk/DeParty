use anchor_lang::prelude::*;
use crate::states::{Party,Config};
use anchor_spl::token::Mint;
#[derive(Accounts)]
pub struct EndParty<'info> {
    #[account(
        mut,
        close = treasury,
        seeds = [b"party", party.key().as_ref(), mint.key().as_ref()],
        bump = party.bump,
    )]
    pub party: Account<'info, Party>,
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"treasury"],
        bump = config.treasury_bump,
    )]
    /// CHECK: This is the program's treasury account
    pub treasury: SystemAccount<'info>,

    pub config: Account<'info, Config>,

    pub system_program: Program<'info, System>,
}

impl<'info> EndParty<'info> {
    pub fn end_party(&mut self) -> Result<()> {
        Ok(())
    }
}
