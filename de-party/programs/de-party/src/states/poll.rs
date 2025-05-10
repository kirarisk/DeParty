use anchor_lang::prelude::*;

#[account]
pub struct Poll {
    pub party: Pubkey,
    pub poll_question: String,
    pub poll_type: u8,
    pub options: Vec<String>,
    pub votes: Vec<u8>,
    pub total_votes: u8,
    pub start_time: i64,
    pub end_time: i64,
    pub target: Option<Pubkey>,
    pub bump: u8,
}


impl Poll {
    pub const LEN: usize = 8 + 32 + 32 + 1 + (32*4) + 1 + 1 + 8 + 8 + 1 ;
}
