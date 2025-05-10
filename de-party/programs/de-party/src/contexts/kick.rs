use anchor_lang::prelude::*;
use crate::states::{Party,Poll};
use crate::errors::CustomError;



#[derive(Accounts)]
pub struct Kick<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub party: Account<'info, Party>,
    pub poll: Account<'info, Poll>,
}

impl<'info> Kick<'info> {
    pub fn kick(&mut self) -> Result<()> {
        require!(self.party.members.contains(&self.user.key()), CustomError::NotPartyMember);

        Ok(())
        
        
    }
}