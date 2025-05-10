use anchor_lang::prelude::*;
use crate::states::{Poll, Party, Config};

#[derive(Accounts)]
pub struct EndPoll<'info> {
    /// CHECK: This is the program's treasury account
    pub treasury: SystemAccount<'info>,
    #[account(
        mut,
        close = treasury,
    )]
    pub poll: Account<'info, Poll>,
    pub system_program: Program<'info, System>,
}

impl<'info> EndPoll<'info> {
    pub fn end_poll(&mut self) -> Result<()> {
        Ok(())
    }
}
