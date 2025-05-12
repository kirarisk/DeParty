use anchor_lang::prelude::*;
use crate::states::{Party,Config};
use anchor_spl::token::Mint;
use ephemeral_rollups_sdk::anchor::commit;
use ephemeral_rollups_sdk::ephem::commit_and_undelegate_accounts;
use crate::PARTY_PDA_SEED;

#[commit]
#[derive(Accounts)]
pub struct EndParty<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, seeds = [PARTY_PDA_SEED], bump)]
    pub party: Account<'info, Party>,
}


impl<'info> EndParty<'info> {
    pub fn end_party(&self) -> Result<()> {
        commit_and_undelegate_accounts(
            &self.payer,
            vec![&self.party.to_account_info()],
            &self.magic_context,
            &self.magic_program,
        )?;
        Ok(())
    }
}
