use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("User is Banned!")]
    Banned,
    #[msg("Vote Consensus must be between 50 and 100")]
    InvalidVoteConsensus,
    #[msg("Minimum holdings must be less than the token account balance")]
    InvalidMinHoldings,
    #[msg("Party is full")]
    PartyFull,
    #[msg("Insufficient tokens")]
    InsufficientTokens,
    #[msg("Invalid options")]
    InvalidOptions,
    #[msg("Invalid question")]
    InvalidQuestion,
    #[msg("Not a party member")]
    NotPartyMember,
    #[msg("Invalid poll type")]
    InvalidPollType,
    #[msg("Already voted")]
    AlreadyVoted,
    #[msg("Unauthorized")]
    Unauthorized,
}

