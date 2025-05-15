use anchor_lang::prelude::*;
use crate::states::Poll;
use ephemeral_rollups_sdk::anchor::commit;
use ephemeral_rollups_sdk::ephem::commit_and_undelegate_accounts;

#[commit]
#[derive(Accounts)]
pub struct UndelegatePoll<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub poll: Account<'info, Poll>,
}


impl<'info> UndelegatePoll<'info> {
    pub fn undelegate_poll(&self) -> Result<()> {
        commit_and_undelegate_accounts(
            &self.payer,
            vec![&self.poll.to_account_info()],
            &self.magic_context,
            &self.magic_program,
        )?;
        Ok(())
    }
}
