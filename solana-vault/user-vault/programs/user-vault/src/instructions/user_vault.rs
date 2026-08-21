use anchor_lang::prelude::*;

use crate::{constants::USER_VAULT_SEED, error::ErrorCode, state::UserVault};

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init,
        payer = owner,
        space = 8 + UserVault::INIT_SPACE,
        seeds = [USER_VAULT_SEED, owner.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, UserVault>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [USER_VAULT_SEED, owner.key().as_ref()],
        bump = vault.bump,
        has_one = owner,
    )]
    pub vault: Account<'info, UserVault>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [USER_VAULT_SEED, owner.key().as_ref()],
        bump = vault.bump,
        has_one = owner,
    )]
    pub vault: Account<'info, UserVault>,
    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
    ctx.accounts.vault.owner = ctx.accounts.owner.key();
    ctx.accounts.vault.deposited_lamports = 0;
    ctx.accounts.vault.bump = ctx.bumps.vault;
    Ok(())
}

pub fn handle_deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    require!(amount > 0, ErrorCode::InvalidAmount);

    let cpi_accounts = anchor_lang::system_program::Transfer {
        from: ctx.accounts.owner.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(anchor_lang::system_program::ID, cpi_accounts);
    anchor_lang::system_program::transfer(cpi_ctx, amount)?;
    ctx.accounts.vault.deposited_lamports = ctx.accounts.vault.deposited_lamports
        .checked_add(amount)
        .ok_or(ErrorCode::AmountOverflow)?;
    Ok(())
}

pub fn handle_withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    require!(amount > 0, ErrorCode::InvalidAmount);
    require!(amount <= ctx.accounts.vault.deposited_lamports, ErrorCode::InsufficientVaultBalance);

    let signer_seeds: &[&[u8]] = &[
        USER_VAULT_SEED,
        ctx.accounts.owner.key.as_ref(),
        &[ctx.accounts.vault.bump],
    ];
    let signer_seeds_array = [signer_seeds];
    let cpi_accounts = anchor_lang::system_program::Transfer {
        from: ctx.accounts.vault.to_account_info(),
        to: ctx.accounts.owner.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        anchor_lang::system_program::ID,
        cpi_accounts,
        &signer_seeds_array,
    );
    anchor_lang::system_program::transfer(cpi_ctx, amount)?;
    ctx.accounts.vault.deposited_lamports -= amount;
    Ok(())
}