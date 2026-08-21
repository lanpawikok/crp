use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Only the counter authority can update this counter")]
    Unauthorized,
    #[msg("Counter has reached the maximum value")]
    CounterOverflow,

    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Vault balance is insufficient")]
    InsufficientVaultBalance,
    #[msg("Amount overflow")]
    AmountOverflow,
}
