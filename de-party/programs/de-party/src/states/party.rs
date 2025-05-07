use anchor_lang::prelude::*;

#[account]
pub struct Party {
    pub name: String,
    pub description: String,
    pub creator: Pubkey,
    pub members: Vec<Pubkey>,
    pub created_at: u64,
    pub mint: Pubkey,
    pub tokens_required: u64,
    pub bump: u8,
}

impl Party {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 32 + 8 + 32 + 8 + 1;
}