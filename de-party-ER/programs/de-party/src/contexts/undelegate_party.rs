use anchor_lang::prelude::*;
use crate::states::Party;
use ephemeral_rollups_sdk::anchor::commit;
use ephemeral_rollups_sdk::ephem::commit_and_undelegate_accounts;

#[commit]
#[derive(Accounts)]
pub struct UndelegateParty<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub party: Account<'info, Party>,
}


impl<'info> UndelegateParty<'info> {
    pub fn undelegate_party(&self) -> Result<()> {
        commit_and_undelegate_accounts(
            &self.payer,
            vec![&self.party.to_account_info()],
            &self.magic_context,
            &self.magic_program,
        )?;
        Ok(())
    }
}
