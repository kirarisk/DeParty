use anchor_lang::prelude::*;
use crate::states::Poll;


#[derive(Accounts)]
pub struct ClosePoll<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        close = user,
    )]
    pub poll: Account<'info, Poll>,
    pub system_program: Program<'info, System>,
}

impl<'info> ClosePoll<'info> {
    pub fn close(&mut self) -> Result<()> {
        Ok(())
    }
}