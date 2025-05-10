use anchor_lang::prelude::*;
use crate::states::Poll;


#[derive(Accounts)]
pub struct Mute<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub poll: Account<'info, Poll>,
}

impl<'info> Mute<'info> {
    pub fn mute(&mut self) -> Result<()> {
        msg!("Mute");
        Ok(())
    }
}
