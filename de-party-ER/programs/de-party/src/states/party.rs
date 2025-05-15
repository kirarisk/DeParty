use anchor_lang::prelude::*;

#[account]
pub struct Party {
    pub name: String,
    pub description: String,
    pub creator: Pubkey,
    pub members: Box<Vec<Pubkey>>,
    pub created_at: i64,
    pub mint: Pubkey,
    pub tokens_required: u64,
    pub bump: u8,
    pub capacity: u8,
}

impl Party {
    pub const LEN: usize = 8 + 32 + 32 + 32 + (32 *10)+ (32 * 2) + 8 + 32 + 8 + 1 +1;
}