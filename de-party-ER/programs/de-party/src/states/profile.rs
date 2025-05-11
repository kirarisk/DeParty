use anchor_lang::prelude::*;

#[account]
pub struct Profile {
    pub name: String,
    pub points: u64,
    pub created_at: u64,
    pub bump: u8,
}

impl Profile {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 1;
}