use anchor_lang::prelude::*;
use crate::states::Config;
use crate::errors::CustomError;
#[derive(Accounts)]
#[instruction(party_fee: u64, reward_basis_points: u64, vote_consensus: u8)]
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
    #[account(
        mut,
        seeds = [b"treasury"], 
        bump,
    )]
    pub treasury: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}   

impl<'info> Setup<'info> {
    pub fn setup(&mut self, party_fee: u64, reward_basis_points: u64, vote_consensus: u8, bumps: &SetupBumps) -> Result<()> {
        require!(vote_consensus >= 50 && vote_consensus <= 100, CustomError::InvalidVoteConsensus);
        self.config.set_inner(Config {
            admin: self.admin.key(),
            party_fee,
            reward_basis_points,
            vote_consensus,
            treasury: self.treasury.key(),
            treasury_bump: bumps.treasury,
            bump: bumps.config,
        });
        Ok(())
    }
}
