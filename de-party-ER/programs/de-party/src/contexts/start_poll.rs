use anchor_lang::prelude::*;
use crate::states::{Config,Poll,Profile};
use crate::errors::CustomError;


// #[delegate]
#[derive(Accounts)]
#[instruction( poll_type: u8, question: String, options: Vec<String>, party: Pubkey,)]
pub struct StartPoll<'info> {
    #[account(mut)]
    pub user: Signer<'info>,



    
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = user,
        space = Poll::LEN,
        seeds = [b"poll", party.as_ref()],
        bump,
    )]
    pub poll: Account<'info, Poll>,
    #[account(
        seeds = [b"profile",user.key().as_ref()],
        bump = profile.bump,
    )]
    pub profile: Account<'info, Profile>,
    pub target : Option<Account<'info, Profile>>,
    pub system_program: Program<'info, System>,
}

impl<'info> StartPoll<'info> {
    pub fn start_poll(&mut self, poll_type: u8, question: String, options: Vec<String>,party: Pubkey, bumps: &StartPollBumps) -> Result<()> {
        
        match poll_type {
            // Mute a User
            0 => {
                self.poll.set_inner(Poll {
                    party: party,
                    poll_question: format!("Mute {}?", self.target.as_ref().unwrap().name),
                    poll_type: poll_type,
                    options: vec!["Yes".to_string(), "No".to_string()],
                    votes: vec![0; 2],
                    total_votes: 0,
                    start_time: Clock::get()?.unix_timestamp,
                    end_time: Clock::get()?.unix_timestamp + 1000,
                    required_votes: 10,
                    bump: bumps.poll,
                    target: Some(self.target.as_ref().unwrap().user),
                    voted: vec![],
                    ended: false,
                });
            }
            // Kick a User
            1 => {
                self.poll.set_inner(Poll {
                    party: party,
                    poll_question: format!("Kick {}?", self.target.as_ref().unwrap().name),
                    poll_type: poll_type,
                    options: vec!["Yes".to_string(), "No".to_string()],
                    votes: vec![0; 2],
                    total_votes: 0,
                    start_time: Clock::get()?.unix_timestamp,
                    end_time: Clock::get()?.unix_timestamp + 1000,
                    bump: bumps.poll,
                    target: Some(self.target.as_ref().unwrap().user),
                    voted: vec![],
                    required_votes: 10,
                    ended: false,
                });
            }
            // Normal Poll
            2 => {
                self.poll.set_inner(Poll {
                    party: party,
                    poll_question: question,
                    poll_type: poll_type,
                    options: options.clone(),
                    votes: vec![0; options.len()],
                    total_votes: 0,
                    start_time: Clock::get()?.unix_timestamp,
                    end_time: Clock::get()?.unix_timestamp + 1000,
                    target: None,
                    bump: bumps.poll,
                    voted: vec![],
                    required_votes: 10,
                    ended: false,
                });
            }
            _ => {
                return Err(CustomError::InvalidPollType.into());
            }
        }
        Ok(())
    }
}