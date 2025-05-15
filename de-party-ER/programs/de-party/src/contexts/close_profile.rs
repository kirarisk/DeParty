use anchor_lang::prelude::*;
use crate::states::Profile;


#[derive(Accounts)]
pub struct CloseProfile<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        close = user,
        seeds = [b"profile",user.key().as_ref()],
        bump = profile.bump
    )]
    pub profile: Account<'info, Profile>,
    pub system_program: Program<'info, System>,
}

impl<'info> CloseProfile<'info> {
    pub fn close(&mut self) -> Result<()> {
        Ok(())
    }
}