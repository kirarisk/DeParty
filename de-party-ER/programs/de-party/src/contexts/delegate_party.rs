use anchor_lang::{prelude::*, system_program};
use anchor_spl::token::{Mint, TokenAccount};
use crate::states::{Party,Config,Profile};
use anchor_lang::solana_program::clock::Clock;
use crate::errors::CustomError;
use ephemeral_rollups_sdk::anchor::{commit, delegate, ephemeral};
use ephemeral_rollups_sdk::cpi::{delegate_account, DelegateAccounts, DelegateConfig};
use ephemeral_rollups_sdk::ephem::{commit_accounts, commit_and_undelegate_accounts};
use crate::PARTY_PDA_SEED;


#[delegate]
#[derive(Accounts)]
#[instruction(mint: Pubkey,user: Pubkey)]
pub struct DelegateInput<'info> {
    pub payer: Signer<'info>,
    /// CHECK The pda to delegate
    #[account(mut, del)]
    pub pda: AccountInfo<'info>,
}

impl<'info> DelegateInput<'info> {
    pub fn delegate(&self,mint: Pubkey,user: Pubkey) -> Result<()> {
        let seeds = [PARTY_PDA_SEED,mint.as_ref(),user.as_ref()];
        self.delegate_pda(&self.payer, &seeds, DelegateConfig::default())?;
        Ok(())
    }
}
