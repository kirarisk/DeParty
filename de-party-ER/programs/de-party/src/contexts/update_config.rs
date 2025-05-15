use anchor_lang::prelude::*;
use crate::states::Config;
use crate::errors::CustomError;

#[derive(Accounts)]
#[instruction(party_fee: u64, reward_basis_points: u64, vote_consensus: u8)]
pub struct UpdateConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        has_one = admin,
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [b"treasury"], 
        bump = config.treasury_bump,
    )]
    pub treasury: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}   

impl<'info> UpdateConfig<'info> {
    pub fn update_config(&mut self, party_fee: u64, reward_basis_points: u64, vote_consensus: u8) -> Result<()> {
        require!(vote_consensus >= 50 && vote_consensus <= 100, CustomError::InvalidVoteConsensus);
        self.config.party_fee = party_fee;
        self.config.reward_basis_points = reward_basis_points;
        self.config.vote_consensus = vote_consensus;
        Ok(())
    }
}
