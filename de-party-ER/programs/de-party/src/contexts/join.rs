use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::ephem::commit_accounts;
use crate::states::{Party,Profile};
use crate::errors::CustomError;
use anchor_spl::token::TokenAccount;
use ephemeral_rollups_sdk::anchor::commit;

#[commit]
#[derive(Accounts)]
pub struct Join<'info> {

    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub party: Account<'info, Party>,
    #[account(
        seeds = [b"profile",user.key().as_ref()],
        bump = profile.bump,
    )]
    pub profile: Account<'info, Profile>,
    pub token_account: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
}

impl<'info> Join<'info> {
    pub fn join(&mut self) -> Result<()> {
        require!(self.party.capacity > self.party.members.len() as u8, CustomError::PartyFull);
        require!(self.party.tokens_required <= self.token_account.amount, CustomError::InsufficientTokens);
        if !self.party.members.contains(&self.profile.key()) {
            self.party.members.push(self.profile.key());
        }
        commit_accounts(
            &self.user,
            vec![&self.party.to_account_info()],
            &self.magic_context,
            &self.magic_program,
        )?;

        Ok(())
    }
}

