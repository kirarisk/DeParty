use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::ephem::commit_accounts;
use crate::states::{Poll, Config, Party, Profile};
use crate::errors::CustomError;
use ephemeral_rollups_sdk::anchor::commit;

#[commit]
#[derive(Accounts)]
#[instruction(option_index: u8)]
pub struct Vote<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    #[account(mut)]
    pub poll: Account<'info, Poll>,
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub party: Account<'info, Party>,
    #[account(
        seeds = [b"profile",voter.key().as_ref()],
        bump = profile.bump,
    )]
    pub profile: Account<'info, Profile>,
    pub system_program: Program<'info, System>,
}

impl<'info> Vote<'info> {
    pub fn vote(&mut self, option_index: u8) -> Result<()> {
        require!(self.poll.voted.iter().all(|voted| voted != &self.profile.key()), CustomError::AlreadyVoted);
        require!(self.party.members.contains(&self.profile.key()), CustomError::NotPartyMember);
        self.poll.voted.push(self.profile.key());
        self.poll.votes[option_index as usize]+=1;
        self.poll.total_votes+=1;
        commit_accounts(&self.voter, vec![&self.poll.to_account_info()], &self.magic_context, &self.magic_program)?;
        let votes_required:u8 = (self.party.members.len() as f32 * (self.config.vote_consensus as f32 / 100.0)).ceil() as u8;
        self.poll.required_votes = votes_required;
        match self.poll.poll_type {
            0 => {
                if self.poll.votes[option_index as usize] >= votes_required {
                    msg!("Mute {}", self.poll.target.unwrap());
                    Ok(())
                } else {
                    Ok(())
                }
            }
            1 => {
                if self.poll.votes[option_index as usize] >= votes_required {
                    let mut index:usize = 0;
                    for member in self.party.members.iter() {
                        msg!("Member: {}", member);
                        msg!("Target: {}", self.poll.target.unwrap());
                        if member == &self.poll.target.unwrap() {
                            self.party.members.remove(index);
                            msg!("Kicked member");
                            break;
                        }
                        index += 1;
                    }
                    Ok(())
                } else {
                    Ok(())
                }
            }
            2 => {
                if self.poll.total_votes >= votes_required{
                    // let mut end_poll_ctx = EndPoll {
                    //     poll: self.poll.clone(),
                    //     treasury: self.treasury.clone(),
                    //     system_program: self.system_program.clone(),
                    // };
                    // end_poll_ctx.end_poll()?;
                    Ok(())
                    // Ok(())
                } else {
                    Ok(())
                }
            }  
            _ => {
                return Err(CustomError::InvalidPollType.into());

            }
        }
    }
}



    

    