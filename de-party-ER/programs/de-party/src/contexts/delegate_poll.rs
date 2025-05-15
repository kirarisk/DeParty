use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::delegate;
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use crate::POLL_PDA_SEED;


#[delegate]
#[derive(Accounts)]
#[instruction(party: Pubkey,user: Pubkey)]
pub struct DelegatePoll<'info> {
    pub payer: Signer<'info>,
    /// CHECK The pda to delegate
    #[account(mut, del)]
    pub pda: AccountInfo<'info>,
}

impl<'info> DelegatePoll<'info> {
    pub fn delegate(&self,party: Pubkey,user: Pubkey) -> Result<()> {
        let seeds = [POLL_PDA_SEED,party.as_ref(),user.as_ref()];
        self.delegate_pda(&self.payer, &seeds, DelegateConfig::default())?;
        Ok(())
    }
}
