use anchor_lang::{prelude::*, solana_program::native_token::LAMPORTS_PER_SOL};
use crate::states::Config;

#[derive(Accounts)]
#[instruction(party_fee: u64, reward_basis_points: u64)]
pub struct Setup<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = Config::LEN,
        seeds = [b"config"],
        bump,
    )]
    pub config: Account<'info, Config>,

    pub system_program: Program<'info, System>,
}   

impl<'info> Setup<'info> {
    pub fn setup(&mut self, party_fee: u64, reward_basis_points: u64, bumps: &SetupBumps) -> Result<()> {
        self.config.set_inner(Config {
            admin: self.admin.key(),
            party_fee,
            reward_basis_points,
            bump: bumps.config,
        });
        Ok(())
    }
}
