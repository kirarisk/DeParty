use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::delegate;
use ephemeral_rollups_sdk::cpi::DelegateConfig;
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
