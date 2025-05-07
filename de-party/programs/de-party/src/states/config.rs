use anchor_lang::prelude::*;

#[account]
pub struct Config {
    pub admin: Pubkey,
    pub party_fee: u64,
    pub reward_basis_points: u64,
    pub bump: u8,
}

impl Config {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 1;
}
