use anchor_lang::prelude::*;
use crate::states::Profile;
use anchor_lang::system_program::System;

#[derive(Accounts)]
#[instruction(name:String)]
pub struct Initialize<'info> {
#[account(mut)]
pub user: Signer<'info>,

#[account(
    init,
    payer = user,
    space= Profile::LEN,
    seeds = [b"profile",user.key().as_ref()],
    bump,
)]
pub profile: Account<'info,Profile>,
pub system_program: Program<'info, System>,
pub sysvar_clock: Sysvar<'info, Clock>,

}




impl<'info> Initialize<'info> {
    pub fn init(&mut self, name:String,bumps: &InitializeBumps) -> Result<()> {
      self.profile.set_inner(Profile {
        user: self.user.key(),
        name,
        points: 0,
        created_at: self.sysvar_clock.unix_timestamp as u64,
        bump: bumps.profile,
    });
      Ok(())
    }
  }

