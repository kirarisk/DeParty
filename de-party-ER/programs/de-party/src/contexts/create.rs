use anchor_lang::{prelude::*, system_program};
use anchor_spl::token::{Mint, TokenAccount};
use crate::states::{Party,Config,Profile};
use anchor_lang::solana_program::clock::Clock;
use crate::errors::CustomError;
use ephemeral_rollups_sdk::anchor::{commit, delegate, ephemeral};
use ephemeral_rollups_sdk::cpi::{delegate_account, DelegateConfig};
use ephemeral_rollups_sdk::ephem::{commit_accounts, commit_and_undelegate_accounts};
use crate::PARTY_PDA_SEED;

// #[delegate]
#[derive(Accounts)]
#[instruction(name: String, description: String, min_holdings: u64,capacity: u8)]
pub struct CreateParty<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    pub mint: Account<'info, Mint>,

    pub token_account: Account<'info, TokenAccount>,
    /// CHECK The pda to delegate
    #[account(
        init,
        // del,
        payer = user,
        space = Party::LEN,
        seeds = [PARTY_PDA_SEED,mint.key().as_ref(),user.key().as_ref()],
        bump,
    )]
    pub party: Account<'info, Party>,
    #[account(
        seeds = [b"profile",user.key().as_ref()],
        bump = profile.bump,
    )]
    pub profile: Account<'info, Profile>,
    #[account(
        seeds = [b"config"],
        bump=config.bump,
    )]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [b"treasury"],
        bump = config.treasury_bump,
    )]
    /// CHECK: This is the program's treasury account
    pub treasury: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}


impl<'info> CreateParty<'info> {
    pub fn create_party(&mut self, name: String, description: String, min_holdings: u64, bumps: &CreatePartyBumps,capacity: u8) -> Result<()> {
        require!(min_holdings <= self.token_account.amount, CustomError::InvalidMinHoldings);
                // Transfer SOL from user to treasury
                let transfer_instruction_accounts = system_program::Transfer {
                    from: self.user.to_account_info(),
                    to: self.treasury.to_account_info(),
                };
                
                system_program::transfer(
                    CpiContext::new(
                        self.system_program.to_account_info(),
                        transfer_instruction_accounts
                    ),
                    self.config.party_fee
                )?;

                
        self.party.set_inner(Party {
            mint: self.mint.key().clone(),
            creator: self.user.key().clone(),
            created_at: Clock::get()?.unix_timestamp,
            members: Box::new(vec![]),
            tokens_required: min_holdings,
            bump: bumps.party,
            name,
            description,
            capacity,
        });
        // self.delegate_party(
        //     &self.user,
        //     &[PARTY_PDA_SEED],
        //     DelegateConfig::default(),
        // )?;
        Ok(())
    }
}


