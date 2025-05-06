use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("User is Banned!")]
    Banned,
    #[msg("User cannot join this room")]
    UnPrivelaged,
}

