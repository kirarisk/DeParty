use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};
use crate::states::Party;

#[derive(Accounts)]
pub struct CreateParty<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    pub mint: Account<'info, Mint>,

    pub token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = user,
        space = Party::LEN,
        seeds = [b"party", user.key().as_ref(), mint.key().as_ref()],
        bump,
    )]
    pub party: Account<'info, Party>,

    pub system_program: Program<'info, System>,
}
