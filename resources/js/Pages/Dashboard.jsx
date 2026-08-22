import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ConnectionProvider, WalletProvider, useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletModalProvider, useWalletModal } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction, VersionedTransaction } from '@solana/web3.js';
import { usePage, router, Link } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';

import '@solana/wallet-adapter-react-ui/styles.css';

const USER_VAULT_PROGRAM_ID = new PublicKey('5fFzormXushFBX8s5fkUo49AN4G6ZxjJCqH1KSr6o9mb');
const USER_VAULT_SEED = new TextEncoder().encode('user-vault');
const INITIALIZE_VAULT_DISCRIMINATOR = Uint8Array.from([48, 191, 163, 44, 71, 129, 63, 164]);
const DEPOSIT_VAULT_DISCRIMINATOR = Uint8Array.from([242, 35, 198, 137, 82, 225, 242, 182]);

const encodeU64 = (value) => {
    const bytes = new Uint8Array(8);
    let remaining = BigInt(value);
    for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = Number(remaining & 0xffn);
        remaining >>= 8n;
    }
    return bytes;
};

const decodeU64 = (bytes) => {
    let value = 0n;
    for (let index = 7; index >= 0; index -= 1) {
        value = (value << 8n) + BigInt(bytes[index]);
    }
    return value;
};

const concatBytes = (...parts) => {
    const length = parts.reduce((total, part) => total + part.length, 0);
    const result = new Uint8Array(length);
    let offset = 0;
    parts.forEach((part) => {
        result.set(part, offset);
        offset += part.length;
    });
    return result;
};

const FROM_TOKEN_GROUPS = [
    { label: 'Top', tokens: ['SOL', 'USDC', 'USDT'] },
    { label: 'Yield', tokens: ['stORE'] },
    { label: 'Others', tokens: ['ORE', 'ZEC'] },
];

const TOKEN_MINTS = {
    SOL: 'So11111111111111111111111111111111111111112',
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4uF1qjQ7wN1YfH6mJg4T',
    stORE: 'sTorERYB6xAZ1SSbwpK3zoK2EEwbBrc7TZAzg1uCGiH',
};

const TOKEN_DECIMALS = { SOL: 9, USDC: 6, USDT: 6, stORE: 11 };

const TOKEN_PRICE_IDS = {
    SOL: 'solana',
    USDC: 'usd-coin',
    USDT: 'tether',
    ORE: 'ore',
    ZEC: 'zcash',
};

const TOKEN_LOGOS = {
    SOL: 'https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    USDC: 'https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    USDT: 'https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4uF1qjQ7wN1YfH6mJg4T/logo.png',
    stORE: 'https://www.privacycash.org/token_logos/store.png',
    ORE: 'https://www.privacycash.org/token_logos/ore.png',
    ZEC: 'https://www.privacycash.org/token_logos/zec.png',
};

const TOKEN_COLORS = {
    SOL: 'bg-[#8b8bff] text-[#17172a]',
    USDC: 'bg-[#2775ca] text-white',
    USDT: 'bg-[#26a17b] text-white',
    stORE: 'bg-[#e6b85c] text-[#241b08]',
    ORE: 'bg-[#d27b42] text-[#24140b]',
    ZEC: 'bg-[#f4b728] text-[#2a1b00]',
};

// ─── DEVNET RPC ─────────────────────────────────────────────────────────────
const DEVNET_RPC = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

function TokenLogo({ token, size = 'h-7 w-7' }) {
    return (
        <span className={`${size} ${TOKEN_COLORS[token] || 'bg-[#39393b] text-white'} relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-bold font-mono`}>
            {TOKEN_LOGOS[token] && (
                <img
                    src={TOKEN_LOGOS[token]}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(event) => { event.currentTarget.style.display = 'none'; }}
                />
            )}
            <span>{token.slice(0, 2)}</span>
        </span>
    );
}

function TokenSelect({ value, groups, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const selectorRef = useRef(null);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (selectorRef.current && !selectorRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    return (
        <div ref={selectorRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full border border-[#4f46e5]/30 bg-[#4f46e5]/20 px-3 py-1.5 text-xs font-mono text-[#c3c0ff] transition-colors hover:bg-[#4f46e5]/30 cursor-pointer"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <TokenLogo token={value} size="h-6 w-6" />
                <span>{value}</span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>
            {isOpen && (
                <div className="absolute right-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#201f22] p-1.5 shadow-2xl" role="listbox">
                    {groups.map((group) => (
                        <div key={group.label}>
                            <p className="px-2 pb-1 pt-2 text-[10px] uppercase tracking-[0.16em] text-[#8f8d99]">{group.label}</p>
                            {group.tokens.map((token) => (
                                <button
                                    key={token}
                                    type="button"
                                    onClick={() => { onChange(token); setIsOpen(false); }}
                                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-mono transition-colors cursor-pointer ${value === token ? 'bg-[#4f46e5]/30 text-[#c3c0ff]' : 'text-[#e5e1e4] hover:bg-white/10'}`}
                                    role="option"
                                    aria-selected={value === token}
                                >
                                    <TokenLogo token={token} />
                                    <span>{token}</span>
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function TransactionNotice({ notice, onClose }) {
    if (!notice) return null;
    const isSuccess = notice.type === 'success';

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#18181B] shadow-2xl" onClick={(event) => event.stopPropagation()}>
                <div className={`h-1.5 ${isSuccess ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${isSuccess ? 'bg-emerald-400/15 text-emerald-300' : 'bg-rose-400/15 text-rose-300'}`}>
                            <span className="material-symbols-outlined text-[28px]">{isSuccess ? 'check_circle' : 'error'}</span>
                        </div>
                        <div className="min-w-0">
                            <p className={`text-[10px] font-mono uppercase tracking-[0.2em] ${isSuccess ? 'text-emerald-300' : 'text-rose-300'}`}>
                                {isSuccess ? 'Transaction complete' : 'Transaction failed'}
                            </p>
                            <h2 className="mt-1 text-xl font-semibold text-[#e5e1e4]">{notice.title}</h2>
                        </div>
                    </div>
                    <p className="mt-5 text-sm leading-6 text-[#c7c4d8]">{notice.message}</p>
                    {notice.signature && (
                        <div className="mt-4 rounded-lg border border-white/10 bg-[#09090B] p-3">
                            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#8f8d99]">Signature</p>
                            <p className="mt-1 break-all text-xs font-mono text-[#c3c0ff]">{notice.signature}</p>
                        </div>
                    )}
                    <button onClick={onClose} className={`mt-6 w-full rounded-lg py-3 text-xs font-mono font-bold text-white transition-colors cursor-pointer ${isSuccess ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-rose-500 hover:bg-rose-400'}`}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
};

function CustomWalletButton() {
    const { publicKey, disconnect, wallet, connecting } = useWallet();
    const { setVisible } = useWalletModal();
    const [error, setError] = useState(null);

    const handleOpenWalletModal = async () => {
        try {
            setError(null);
            if (publicKey) {
                await disconnect();
                await new Promise((resolve) => setTimeout(resolve, 300));
            }
            setVisible(true);
        } catch (err) {
            setError(err.message || 'Failed to connect wallet');
        }
    };

    if (!publicKey) {
        return (
            <div className="relative">
                {error && <div className="absolute -top-8 left-0 right-0 text-red-400 text-xs text-center">{error}</div>}
                <button
                    onClick={handleOpenWalletModal}
                    disabled={connecting}
                    className="bg-[#4f46e5] text-white px-5 py-2 rounded-full text-xs font-mono hover:bg-[#4d44e3] transition-colors flex items-center gap-2 shadow-md border border-[#c3c0ff]/20 disabled:opacity-50 cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                    {connecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1.5 bg-[#18181B] border border-white/10 rounded-full p-1 pl-1.5 shadow-md">
            <button
                onClick={handleOpenWalletModal}
                className="flex items-center gap-2 bg-[#201f22] hover:bg-[#2a2a2c] px-3 py-1.5 rounded-full text-xs font-mono text-[#e5e1e4] border border-white/5 cursor-pointer"
            >
                {wallet?.adapter?.icon && <img src={wallet.adapter.icon} alt={wallet.adapter.name} className="w-4 h-4 rounded-full" />}
                <span>{publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}</span>
            </button>
            <button
                onClick={() => disconnect()}
                className="text-[#c7c4d8] hover:text-red-400 p-1.5 rounded-full transition-colors cursor-pointer"
                title="Disconnect Wallet"
            >
                <span className="material-symbols-outlined text-[16px]">logout</span>
            </button>
        </div>
    );
}

function UtilifyApp() {
    const { publicKey, wallet, sendTransaction } = useWallet();
    const { connection } = useConnection();

    const vaultConnection = useMemo(
        () => new Connection(DEVNET_RPC, 'confirmed'),
        []
    );

    const { setVisible } = useWalletModal();
    const { auth } = usePage().props;

    const [balance, setBalance] = useState(null);
    const [privatePoolBalance, setPrivatePoolBalance] = useState(null);
    const [accountBalance, setAccountBalance] = useState(null);
    const [isBalanceRefreshing, setIsBalanceRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('swap');
    const [isLoading, setIsLoading] = useState(false);

    const [payAmount, setPayAmount] = useState('0.0');
    const [receiveAmount, setReceiveAmount] = useState('0.0');
    const [payToken, setPayToken] = useState('SOL');
    const [receiveToken, setReceiveToken] = useState('USDC');
    const [swapStatus, setSwapStatus] = useState('');
    const [tokenPrices, setTokenPrices] = useState({});
    const [isRateLoading, setIsRateLoading] = useState(false);
    const [transactionNotice, setTransactionNotice] = useState(null);

    const [depositAmount, setDepositAmount] = useState('');
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [isDepositConfirmOpen, setIsDepositConfirmOpen] = useState(false);
    const [topUpMessage, setTopUpMessage] = useState('');

    const walletAddress = publicKey?.toBase58() || '';
    const numericTopUpAmount = Number.parseFloat(depositAmount);
    const paymentUri = walletAddress
        ? `solana:${walletAddress}${Number.isFinite(numericTopUpAmount) && numericTopUpAmount > 0 ? `?amount=${numericTopUpAmount}&label=No%20Trace%20Top%20Up` : ''}`
        : '';

    const payTokenPrice = tokenPrices[payToken];
    const receiveTokenPrice = tokenPrices[receiveToken];
    const swapRate = payTokenPrice && receiveTokenPrice ? payTokenPrice / receiveTokenPrice : null;
    const quotedReceiveAmount = swapRate && Number.parseFloat(payAmount) > 0
        ? (Number.parseFloat(payAmount) * swapRate * 0.997).toFixed(6)
        : '--';
    const isStorePair = payToken === 'stORE' || receiveToken === 'stORE';

    const fetchBalances = useCallback(async () => {
        if (!publicKey) {
            setBalance(null);
            setPrivatePoolBalance(null);
            setAccountBalance(null);
            return;
        }

        setIsBalanceRefreshing(true);
        try {
            const lamports = await vaultConnection.getBalance(publicKey);
            setBalance((lamports / LAMPORTS_PER_SOL).toFixed(4));
        } catch (error) {
            console.error('Gagal mengambil saldo SOL:', error);
        }

        try {
            const [userVault] = PublicKey.findProgramAddressSync(
                [USER_VAULT_SEED, publicKey.toBytes()],
                USER_VAULT_PROGRAM_ID
            );
            const accountInfo = await vaultConnection.getAccountInfo(userVault, 'confirmed');
            const isVault = accountInfo?.owner.equals(USER_VAULT_PROGRAM_ID) && accountInfo.data.length >= 48;
            const depositedLamports = isVault ? decodeU64(accountInfo.data.subarray(40, 48)) : 0n;
            setPrivatePoolBalance((Number(depositedLamports) / LAMPORTS_PER_SOL).toFixed(6));
        } catch (error) {
            console.error('Gagal mengambil saldo Private Pool:', error);
            setPrivatePoolBalance(null);
        }

        if (auth?.user) {
            try {
                const res = await fetch('/api/private-balance', {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json',
                    },
                    credentials: 'same-origin',
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data?.balance !== undefined) {
                        setAccountBalance(Number(data.balance).toFixed(6));
                    }
                }
            } catch (error) {
                console.error('Gagal mengambil saldo database:', error);
            }
        }

        setIsBalanceRefreshing(false);
    }, [publicKey, vaultConnection, auth?.user]);

    useEffect(() => {
        fetchBalances();
    }, [fetchBalances]);

    useEffect(() => {
        const tokenIds = [...new Set([payToken, receiveToken].map((token) => TOKEN_PRICE_IDS[token]).filter(Boolean))];
        const needsStorePrice = [payToken, receiveToken].includes('stORE');
        if (tokenIds.length === 0 && !needsStorePrice) {
            setTokenPrices({});
            return;
        }

        let isMounted = true;
        setIsRateLoading(true);
        const priceRequests = [];
        if (tokenIds.length > 0) {
            priceRequests.push(
                fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds.join(',')}&vs_currencies=usd`)
                    .then((response) => response.ok ? response.json() : {})
            );
        } else {
            priceRequests.push(Promise.resolve({}));
        }
        if (needsStorePrice) {
            priceRequests.push(
                fetch('https://api.jup.ag/tokens/v2/search?query=stORE')
                    .then((response) => response.ok ? response.json() : [])
                    .then((tokens) => {
                        const storeToken = tokens.find((token) => token.id === TOKEN_MINTS.stORE || token.symbol === 'stORE');
                        return storeToken?.usdPrice ? { stORE: storeToken.usdPrice } : {};
                    })
            );
        }
        Promise.all(priceRequests)
            .then(([prices, storePrices = {}]) => {
                if (!isMounted) return;
                const normalizedPrices = Object.entries(TOKEN_PRICE_IDS).reduce((result, [token, id]) => {
                    if (prices[id]?.usd) result[token] = prices[id].usd;
                    return result;
                }, {});
                Object.assign(normalizedPrices, storePrices);
                setTokenPrices(normalizedPrices);
            })
            .catch(() => { if (isMounted) setTokenPrices({}); })
            .finally(() => { if (isMounted) setIsRateLoading(false); });

        return () => { isMounted = false; };
    }, [payToken, receiveToken]);

    const handleLogout = (e) => {
        e.preventDefault();
        router.post('/logout');
    };

    const handleSwapDirection = () => {
        setPayToken(receiveToken);
        setReceiveToken(payToken);
        setPayAmount(receiveAmount);
        setReceiveAmount(payAmount);
    };

    const handlePayTokenChange = (token) => {
        setPayToken(token);
        if (token !== 'SOL') {
            setReceiveToken('SOL');
        } else if (receiveToken === 'SOL') {
            setReceiveToken('USDC');
        }
    };

    const availableToGroups = payToken === 'SOL'
        ? [
            { label: 'Top', tokens: ['USDC', 'USDT'] },
            { label: 'Yield', tokens: ['stORE'] },
            { label: 'Others', tokens: ['ZEC', 'ORE'] },
        ]
        : [{ label: 'Top', tokens: ['SOL'] }];

    const handleMaxPayAmount = () => {
        if (payToken === 'SOL' && balance !== null) {
            const maxAmount = Math.max(0, parseFloat(balance) - 0.005).toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
            setPayAmount(maxAmount.includes('.') ? maxAmount : `${maxAmount}.0`);
        }
    };

    const handleSetDepositPercentage = (percent) => {
        if (!balance || parseFloat(balance) <= 0) return;
        const available = Math.max(0, parseFloat(balance) - 0.005);
        const calculated = (available * (percent / 100)).toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
        setDepositAmount(calculated && parseFloat(calculated) > 0 ? (calculated.includes('.') ? calculated : `${calculated}.0`) : '0.0');
    };

    const handleReviewSwap = async () => {
        const amount = Number.parseFloat(payAmount);
        if (!publicKey) { setVisible(true); return; }

        if (!Number.isFinite(amount) || amount <= 0) {
            setTransactionNotice({ type: 'error', title: 'Invalid swap amount', message: 'Masukkan jumlah swap yang lebih besar dari 0.' });
            return;
        }
        if (!TOKEN_MINTS[payToken] || !TOKEN_MINTS[receiveToken]) {
            setTransactionNotice({ type: 'error', title: 'Token belum tersedia', message: 'Token ini belum memiliki mint address Solana yang terkonfigurasi.' });
            return;
        }

        setIsLoading(true);
        setSwapStatus('Mengambil quote Jupiter...');
        try {
            let availableAmount = 0;
            if (payToken === 'SOL') {
                availableAmount = Number.parseFloat(balance || '0');
                if (amount + 0.001 > availableAmount) {
                    setActiveTab('deposit');
                    throw new Error('Insufficient SOL balance. Please top up your wallet before swapping.');
                }
            } else {
                const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
                    mint: new PublicKey(TOKEN_MINTS[payToken]),
                });
                availableAmount = tokenAccounts.value.reduce((total, account) => (
                    total + (account.account.data.parsed.info.tokenAmount.uiAmount || 0)
                ), 0);
                if (amount > availableAmount) {
                    setActiveTab('deposit');
                    throw new Error(`Insufficient ${payToken} balance. Please top up your wallet before swapping.`);
                }
            }

            const rawAmount = Math.round(amount * (10 ** TOKEN_DECIMALS[payToken]));
            const quoteResponse = await fetch('/api/swap/quote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    inputMint: TOKEN_MINTS[payToken],
                    outputMint: TOKEN_MINTS[receiveToken],
                    amount: rawAmount,
                    slippageBps: 50,
                }),
            });
            const quote = await quoteResponse.json();
            if (!quoteResponse.ok) {
                throw new Error(quote.error || quote.message || quote.details || 'Quote Jupiter gagal.');
            }

            setSwapStatus('Menyiapkan transaksi swap...');
            const transactionResponse = await fetch('/api/swap/transaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ quoteResponse: quote, userPublicKey: publicKey.toBase58() }),
            });
            const transactionData = await transactionResponse.json();
            if (!transactionResponse.ok || !transactionData.swapTransaction) {
                const detail = transactionData.details?.error || transactionData.details?.message;
                throw new Error(transactionData.error || detail || 'Transaksi swap gagal dibuat.');
            }

            setSwapStatus('Membuka Solflare untuk konfirmasi...');
            const transactionBytes = Uint8Array.from(atob(transactionData.swapTransaction), (character) => character.charCodeAt(0));
            const transaction = VersionedTransaction.deserialize(transactionBytes);
            const signature = await sendTransaction(transaction, connection);

            setSwapStatus('Mengonfirmasi transaksi di blockchain...');
            await connection.confirmTransaction(signature, 'confirmed');
            await fetchBalances();
            setTransactionNotice({ type: 'success', title: 'Swap berhasil', message: `${amount} ${payToken} berhasil ditukar menjadi ${quotedReceiveAmount} ${receiveToken}.`, signature });
        } catch (error) {
            console.error('Swap Error:', error);
            const message = error.message || 'The transaction was cancelled.';
            setTransactionNotice({
                type: 'error',
                title: message.startsWith('Insufficient') ? 'Insufficient Balance' : 'Swap Failed',
                message,
            });
        } finally {
            setIsLoading(false);
            setSwapStatus('');
        }
    };

    const handleDeposit = async () => {
        const amount = parseFloat(depositAmount);
        if (!depositAmount || isNaN(amount) || amount <= 0) {
            setTransactionNotice({ type: 'error', title: 'Invalid Top Up Amount', message: 'Please enter a top up amount greater than 0.' });
            return;
        }
        if (!publicKey) { setVisible(true); return; }

        setIsDepositConfirmOpen(false);
        setIsLoading(true);
        try {
            const { blockhash, lastValidBlockHeight } = await vaultConnection.getLatestBlockhash('finalized');
            const [userVault] = PublicKey.findProgramAddressSync(
                [USER_VAULT_SEED, publicKey.toBytes()],
                USER_VAULT_PROGRAM_ID
            );
            const accountInfo = await vaultConnection.getAccountInfo(userVault);
            const accountKeys = [
                { pubkey: publicKey, isSigner: true, isWritable: true },
                { pubkey: userVault, isSigner: false, isWritable: true },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            ];
            const instructions = [];

            if (!accountInfo) {
                instructions.push(new TransactionInstruction({
                    programId: USER_VAULT_PROGRAM_ID,
                    keys: accountKeys,
                    data: INITIALIZE_VAULT_DISCRIMINATOR,
                }));
            }

            instructions.push(new TransactionInstruction({
                programId: USER_VAULT_PROGRAM_ID,
                keys: accountKeys,
                data: concatBytes(DEPOSIT_VAULT_DISCRIMINATOR, encodeU64(Math.round(amount * LAMPORTS_PER_SOL))),
            }));

            const transaction = new Transaction({ feePayer: publicKey, recentBlockhash: blockhash }).add(...instructions);
            const signature = await sendTransaction(transaction, vaultConnection);
            await vaultConnection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'processed');
            await fetchBalances();

            // Opsional: sinkronkan riwayat deposit ke server Laravel jika user sedang login
            if (auth?.user) {
                try {
                    await fetch('/api/private-balance/deposit', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-CSRF-TOKEN': getCsrfToken(),
                            'Accept': 'application/json',
                        },
                        credentials: 'same-origin',
                        body: JSON.stringify({
                            amount: amount,
                            signature: signature,
                            wallet_address: publicKey.toBase58(),
                        }),
                    });
                } catch (syncErr) {
                    console.warn('Sync database error:', syncErr);
                }
            }

            setDepositAmount('');
            setTransactionNotice({ type: 'success', title: 'Top Up Successful', message: `${amount} SOL berhasil disimpan ke Private Pool Vault on-chain.`, signature });
        } catch (error) {
            console.error('Error deposit:', error);
            setTransactionNotice({ type: 'error', title: 'Top Up Failed', message: error.message || 'Please have at least 0.01 SOL in your wallet.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDepositRequest = () => {
        const amount = Number.parseFloat(depositAmount);
        if (!publicKey) { setVisible(true); return; }
        if (!Number.isFinite(amount) || amount <= 0) {
            setTransactionNotice({ type: 'error', title: 'Invalid Top Up Amount', message: 'Please enter a top up amount greater than 0.' });
            return;
        }
        setIsDepositConfirmOpen(true);
    };

    const handleTopUp = () => {
        if (!publicKey) { setVisible(true); return; }
        setTopUpMessage('');
        setIsTopUpOpen(true);
    };

    const handleCopyAddress = async () => {
        if (!walletAddress) return;
        await navigator.clipboard.writeText(walletAddress);
        setTopUpMessage('Wallet address copied.');
    };

    return (
        <div className="antialiased min-h-screen flex flex-col bg-[#09090B] text-[#e5e1e4] font-sans relative overflow-x-hidden">
            <div
                className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] z-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, rgba(9, 9, 11, 0) 70%)' }}
            />

            <nav className="fixed top-0 w-full z-50 bg-[#18181B]/80 backdrop-blur-xl border-b border-white/10 shadow-sm">
                <div className="flex justify-between items-center h-16 px-6 md:px-10 max-w-[1280px] mx-auto">
                    <div className="text-2xl font-bold tracking-tighter text-[#c3c0ff]">No Trace</div>

                    <div className="hidden md:flex space-x-6 text-base">
                        {['swap', 'deposit'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-3 py-1 rounded transition-colors cursor-pointer capitalize ${
                                    activeTab === tab
                                        ? 'text-[#c3c0ff] border-b-2 border-[#c3c0ff] font-medium'
                                        : 'text-[#c7c4d8] hover:text-white'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 md:gap-4">
                        {auth?.user && (
                            <div className="flex items-center gap-3">
                                {auth.user.email === 'admin@notracefi.test' && (
                                    <Link
                                        href="/admin/users"
                                        className="bg-[#4f46e5] text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-[#4d44e3] transition-colors flex items-center gap-1.5 border border-[#c3c0ff]/20"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">group</span> Kelola User
                                    </Link>
                                )}
                                <span className="text-sm text-gray-400 hidden sm:inline">{auth.user.name}</span>
                                <button
                                    onClick={handleLogout}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border border-red-400/20 cursor-pointer"
                                >
                                    Logout
                                </button>
                            </div>
                        )}

                        {publicKey && (
                            <div className="hidden xl:flex items-center gap-3 bg-[#18181B] border border-white/10 rounded-full px-3.5 py-1.5 text-xs font-mono">
                                <div className="flex items-center gap-1.5" title="Saldo E-Wallet Anda">
                                    <span className="text-[#8f8d99]">Wallet:</span>
                                    <span className="text-[#e5e1e4] font-medium">{balance !== null ? `${balance} SOL` : '...'}</span>
                                </div>
                                <span className="text-white/20">|</span>
                                <div className="flex items-center gap-1.5" title="Saldo Private Pool Vault Anda">
                                    <span className="text-[#a9a5c9] flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px] text-emerald-400">shield</span>
                                        Pool:
                                    </span>
                                    <span className="text-[#c3c0ff] font-medium">{privatePoolBalance !== null ? `${privatePoolBalance} SOL` : '...'}</span>
                                </div>
                            </div>
                        )}

                        <div className="hidden lg:flex items-center gap-2 bg-[#201f22] px-3 py-1.5 rounded-full border border-white/10">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                            <span className="text-xs font-medium text-[#e5e1e4] font-mono">Solana Devnet</span>
                        </div>

                        <CustomWalletButton />
                    </div>
                </div>
            </nav>

            <main className="flex-grow pt-24 pb-16 px-5 md:px-10 max-w-[1280px] mx-auto w-full relative z-10 flex flex-col gap-12">
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                    <div className="space-y-6">
                        <h1 className="text-3xl md:text-5xl font-bold text-[#e5e1e4] tracking-tight leading-tight">
                            The Universal <br />
                            <span className="text-[#c3c0ff]">Web3 Toolkit</span>
                        </h1>
                        <p className="text-base text-[#c7c4d8] max-w-md">
                            Seamlessly swap tokens, bridge across networks, and manage private liquidity pools from a high-performance terminal.
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            <button 
                                onClick={() => setActiveTab('deposit')}
                                className="bg-[#4f46e5] border border-[#c3c0ff]/30 text-white px-5 py-2.5 rounded-full text-xs font-mono hover:bg-[#4d44e3] transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-[#4f46e5]/20"
                            >
                                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                Deposit Private Pool
                            </button>
                            <button 
                                onClick={() => setActiveTab('swap')}
                                className="bg-[#2a2a2c] border border-white/10 text-[#e5e1e4] px-5 py-2.5 rounded-full text-xs font-mono hover:bg-[#39393b] transition-colors flex items-center gap-2 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                                Private Swap
                            </button>
                            {publicKey && (
                                <button
                                    onClick={fetchBalances}
                                    disabled={isBalanceRefreshing}
                                    title="Segarkan Saldo"
                                    className="bg-[#18181B] text-[#c7c4d8] hover:text-white p-2.5 rounded-full border border-white/10 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
                                >
                                    <span className={`material-symbols-outlined text-[18px] ${isBalanceRefreshing ? 'animate-spin' : ''}`}>sync</span>
                                </button>
                            )}
                        </div>

                        {/* DUAL BALANCE OVERVIEW: SALDO E-WALLET & SALDO PRIVATE POOL */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                            {/* CARD 1: SALDO E-WALLET */}
                            <div className="rounded-xl border border-white/10 bg-[#18181B]/80 backdrop-blur-md p-4 shadow-lg flex flex-col justify-between hover:border-white/20 transition-colors">
                                <div>
                                    <div className="flex items-center justify-between text-xs font-mono uppercase tracking-[0.12em] text-[#8f8d99]">
                                        <span className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[16px] text-[#c3c0ff]">account_balance_wallet</span>
                                            Saldo E-Wallet
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                                            Solana
                                        </span>
                                    </div>
                                    <div className="mt-3">
                                        <p className="text-2xl font-bold text-[#e5e1e4] font-mono">
                                            {publicKey ? (balance !== null ? `${balance} SOL` : 'Loading...') : '0.0000 SOL'}
                                        </p>
                                        <p className="mt-0.5 text-xs text-[#8f8d99] font-mono">
                                            {publicKey && balance && payTokenPrice ? `≈ $${(parseFloat(balance) * payTokenPrice).toFixed(2)} USD` : 'Connected Wallet'}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-[#a9a5c9]">
                                    <span className="truncate max-w-[130px]">
                                        {publicKey ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Belum Terhubung'}
                                    </span>
                                    <button
                                        onClick={handleTopUp}
                                        className="text-[#c3c0ff] hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">qr_code</span>
                                        Receive
                                    </button>
                                </div>
                            </div>

                            {/* CARD 2: SALDO PRIVATE POOL (VAULT) */}
                            <div className="rounded-xl border border-[#c3c0ff]/30 bg-[#18181B]/80 backdrop-blur-md p-4 shadow-lg flex flex-col justify-between hover:border-[#c3c0ff]/50 transition-colors relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-[#4f46e5]/10 rounded-full blur-xl pointer-events-none" />
                                <div>
                                    <div className="flex items-center justify-between text-xs font-mono uppercase tracking-[0.12em] text-[#a9a5c9]">
                                        <span className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[16px] text-emerald-400">shield</span>
                                            Saldo Private Pool
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] text-emerald-300 font-medium">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                                            On-chain Vault
                                        </span>
                                    </div>
                                    <div className="mt-3">
                                        <p className="text-2xl font-bold text-[#e5e1e4] font-mono">
                                            {publicKey ? (privatePoolBalance !== null ? `${privatePoolBalance} SOL` : 'Loading...') : '0.000000 SOL'}
                                        </p>
                                        <p className="mt-0.5 text-xs text-[#8f8d99] font-mono">
                                            {publicKey && privatePoolBalance && payTokenPrice ? `≈ $${(parseFloat(privatePoolBalance) * payTokenPrice).toFixed(2)} USD` : 'Private Pool Vault'}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-[#a9a5c9]">
                                    <span className="text-emerald-400/90 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">lock</span>
                                        Protected
                                    </span>
                                    <button
                                        onClick={() => setActiveTab('deposit')}
                                        className="text-[#c3c0ff] hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">add</span>
                                        Top Up
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#18181B]/60 backdrop-blur-md border border-white/10 rounded-xl p-6 relative overflow-visible group shadow-lg min-h-[400px]">
                        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-4">
                            <h2 className="text-2xl font-semibold text-[#e5e1e4] capitalize">{activeTab}</h2>
                            <span className="text-xs text-gray-400 font-mono bg-[#201f22] px-2 py-1 rounded">Private Mode</span>
                        </div>

                        {activeTab === 'swap' && (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-[#8f8d99] font-mono">Private swap</p>
                                        <p className="mt-1 text-sm text-[#c7c4d8]">Trade tokens without leaving your wallet flow.</p>
                                    </div>
                                    <button
                                        type="button"
                                        aria-label="Swap settings"
                                        title="Swap settings"
                                        className="rounded-full border border-white/10 p-2 text-[#c7c4d8] hover:text-white hover:bg-white/5 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">tune</span>
                                    </button>
                                </div>
                                <div className="space-y-2 relative">
                                    <div className="bg-[#09090B] border border-white/10 rounded-xl p-4 focus-within:border-[#c3c0ff] transition-colors">
                                        <div className="flex flex-col sm:flex-row sm:justify-between text-[#8f8d99] text-xs font-mono mb-3 gap-1">
                                            <span>Pay</span>
                                            <div className="flex items-center gap-2 text-[11px]">
                                                <span>Wallet: <strong className="text-[#e5e1e4]">{publicKey ? (balance !== null ? `${balance} SOL` : '...') : '0.00'}</strong></span>
                                                <span className="text-white/20">•</span>
                                                <span>Pool: <strong className="text-[#c3c0ff]">{publicKey ? (privatePoolBalance !== null ? `${privatePoolBalance} SOL` : '...') : '0.00'}</strong></span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center gap-4">
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={payAmount}
                                                onChange={(e) => setPayAmount(e.target.value)}
                                                className="bg-transparent text-3xl font-semibold text-[#e5e1e4] outline-none min-w-0 w-full"
                                                placeholder="0"
                                            />
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button type="button" onClick={handleMaxPayAmount} className="text-[10px] font-mono text-[#c3c0ff] hover:text-white cursor-pointer">MAX</button>
                                                <TokenSelect value={payToken} groups={FROM_TOKEN_GROUPS} onChange={handlePayTokenChange} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                        <button onClick={handleSwapDirection} aria-label="Reverse swap" title="Reverse swap" className="bg-[#39393b] p-2 rounded-full border border-[#09090B] text-[#e5e1e4] hover:text-[#c3c0ff] transition-all hover:rotate-180 duration-300 cursor-pointer">
                                            <span className="material-symbols-outlined">swap_vert</span>
                                        </button>
                                    </div>

                                    <div className="bg-[#09090B] border border-white/10 rounded-xl p-4 focus-within:border-[#c3c0ff] transition-colors">
                                        <div className="flex justify-between text-[#8f8d99] text-xs font-mono mb-3">
                                            <span>Receive</span>
                                            <span>Estimated output</span>
                                        </div>
                                        <div className="flex justify-between items-center gap-4">
                                            <input
                                                type="text"
                                                value={quotedReceiveAmount}
                                                readOnly
                                                aria-label="Estimated receive amount"
                                                className="bg-transparent text-3xl font-semibold text-[#e5e1e4] outline-none min-w-0 w-full cursor-default"
                                            />
                                            <TokenSelect value={receiveToken} groups={availableToGroups} onChange={setReceiveToken} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between mt-4 text-[11px] text-[#8f8d99] font-mono">
                                    <span>Rate</span>
                                    <span>
                                        {isRateLoading ? 'Loading live rate...' : swapRate ? `1 ${payToken} ≈ ${(swapRate * 0.997).toFixed(6)} ${receiveToken}` : isStorePair ? 'stORE rate not configured' : 'Rate unavailable'}
                                    </span>
                                </div>
                                <div className="flex justify-end text-[11px] text-[#8f8d99] font-mono">
                                    <span>{swapRate ? `1 ${receiveToken} ≈ ${(1 / swapRate).toFixed(6)} ${payToken}` : isStorePair ? 'Requires stORE market price' : 'Select a supported pair'}</span>
                                </div>
                                {swapStatus && (
                                    <div className="mt-3 rounded-lg border border-[#c3c0ff]/20 bg-[#4f46e5]/10 p-3 text-xs text-[#c3c0ff] font-mono animate-pulse">
                                        {swapStatus}
                                    </div>
                                )}
                                {publicKey ? (
                                    <button onClick={handleReviewSwap} disabled={isLoading} className="w-full mt-5 bg-[#4f46e5] text-white py-4 rounded-lg text-xs font-mono hover:bg-[#4d44e3] transition-colors border border-[#c3c0ff]/20 cursor-pointer font-bold disabled:opacity-50">
                                        {isLoading ? 'Processing Swap...' : 'Review Swap'}
                                    </button>
                                ) : (
                                    <div className="w-full mt-6 flex justify-center">
                                        <CustomWalletButton />
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'deposit' && (
                            <div className="space-y-4">
                                {/* Saldo Overview Box */}
                                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#09090B] border border-white/10 text-xs font-mono">
                                    <div>
                                        <span className="text-[#8f8d99] block text-[10px] uppercase tracking-wider">Saldo E-Wallet (Sumber)</span>
                                        <span className="text-[#e5e1e4] font-bold text-sm mt-0.5 block">
                                            {publicKey ? (balance !== null ? `${balance} SOL` : 'Loading...') : '0.00 SOL'}
                                        </span>
                                    </div>
                                    <div className="border-l border-white/10 pl-3.5">
                                        <span className="text-[#a9a5c9] block text-[10px] uppercase tracking-wider flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[13px] text-emerald-400">shield</span>
                                            Saldo Private Pool (Vault)
                                        </span>
                                        <span className="text-[#c3c0ff] font-bold text-sm mt-0.5 block">
                                            {publicKey ? (privatePoolBalance !== null ? `${privatePoolBalance} SOL` : 'Loading...') : '0.000000 SOL'}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-[#09090B] p-4 rounded-xl border border-white/10 focus-within:border-[#c3c0ff] transition-colors">
                                    <div className="flex justify-between text-xs text-gray-400 font-mono mb-2">
                                        <label htmlFor="deposit-amount-input">Jumlah Top Up ke Private Pool</label>
                                        <span>Deposit to Vault</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="deposit-amount-input"
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={depositAmount}
                                            onChange={(e) => setDepositAmount(e.target.value)}
                                            className="bg-transparent text-2xl font-bold text-[#e5e1e4] outline-none w-full font-mono"
                                            placeholder="0.0"
                                        />
                                        <span className="text-xs text-[#c3c0ff] font-mono font-bold bg-[#4f46e5]/20 px-2.5 py-1.5 rounded">SOL</span>
                                    </div>

                                    {/* Quick Percentage Buttons */}
                                    {publicKey && balance && parseFloat(balance) > 0 && (
                                        <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                                            {[25, 50, 75, 100].map((pct) => (
                                                <button
                                                    key={pct}
                                                    type="button"
                                                    onClick={() => handleSetDepositPercentage(pct)}
                                                    className="flex-1 py-1 rounded bg-[#18181B] hover:bg-[#201f22] text-[10px] font-mono text-[#c7c4d8] hover:text-[#c3c0ff] border border-white/5 transition-colors cursor-pointer"
                                                >
                                                    {pct === 100 ? 'MAX' : `${pct}%`}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleDepositRequest}
                                    disabled={isLoading || !depositAmount || parseFloat(depositAmount) <= 0}
                                    className="w-full bg-[#4f46e5] text-white py-3.5 rounded-lg text-sm font-mono hover:bg-[#4d44e3] transition-colors flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer font-bold shadow-lg shadow-[#4f46e5]/20"
                                >
                                    <span className="material-symbols-outlined text-[18px]">lock</span>
                                    {isLoading ? 'Processing Deposit...' : 'Top Up Private Pool'}
                                </button>

                                <div className="relative flex py-1 items-center">
                                    <div className="flex-grow border-t border-white/10"></div>
                                    <span className="flex-shrink mx-3 text-[11px] text-gray-500 font-mono">atau</span>
                                    <div className="flex-grow border-t border-white/10"></div>
                                </div>

                                <button
                                    onClick={handleTopUp}
                                    className="w-full border border-[#c3c0ff]/30 bg-[#c3c0ff]/10 text-[#c3c0ff] py-3 rounded-lg text-xs font-mono hover:bg-[#c3c0ff]/20 transition-colors flex justify-center items-center gap-2 cursor-pointer font-medium"
                                >
                                    <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                                    {publicKey ? 'Top Up Saldo E-Wallet (QR Code)' : 'Connect Wallet to Top Up'}
                                </button>
                                {topUpMessage && <p className="text-xs text-center text-[#c3c0ff] font-mono">{topUpMessage}</p>}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <TransactionNotice notice={transactionNotice} onClose={() => setTransactionNotice(null)} />

            {isDepositConfirmOpen && publicKey && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm"
                    onClick={() => setIsDepositConfirmOpen(false)}
                >
                    <div
                        className="w-full max-w-md rounded-xl border border-white/10 bg-[#18181B] p-6 shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#8f8d99]">Solana Top Up</p>
                                <h2 className="mt-1 text-2xl font-semibold text-[#e5e1e4]">Review Deposit</h2>
                            </div>
                            <button
                                onClick={() => setIsDepositConfirmOpen(false)}
                                className="text-[#c7c4d8] transition-colors hover:text-white cursor-pointer"
                                aria-label="Close top up confirmation"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="mt-6 space-y-3 rounded-lg border border-white/10 bg-[#09090B] p-4">
                            <div className="flex justify-between text-sm text-[#c7c4d8]">
                                <span>Wallet</span>
                                <span className="font-mono text-[#e5e1e4]">{wallet?.adapter?.name || 'Solana Wallet'}</span>
                            </div>
                            <div className="flex justify-between text-sm text-[#c7c4d8]">
                                <span>Saldo E-Wallet Saat Ini</span>
                                <span className="font-mono text-[#e5e1e4]">{balance !== null ? `${balance} SOL` : 'Loading...'}</span>
                            </div>
                            <div className="flex justify-between text-sm text-[#c7c4d8]">
                                <span>Saldo Private Pool Saat Ini</span>
                                <span className="font-mono text-emerald-400">{privatePoolBalance !== null ? `${privatePoolBalance} SOL` : '0.000000 SOL'}</span>
                            </div>
                            <div className="border-t border-white/10 pt-3 flex justify-between text-base font-semibold text-[#e5e1e4]">
                                <span>Jumlah Top Up</span>
                                <span className="font-mono text-[#c3c0ff]">{Number.parseFloat(depositAmount).toFixed(6)} SOL</span>
                            </div>
                            <div className="flex justify-between text-xs text-[#8f8d99] font-mono">
                                <span>Estimasi Saldo Pool Baru</span>
                                <span className="text-emerald-300 font-semibold">
                                    {((Number.parseFloat(privatePoolBalance || '0') || 0) + (Number.parseFloat(depositAmount || '0') || 0)).toFixed(6)} SOL
                                </span>
                            </div>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-[#c7c4d8]">
                            Solflare akan membuka pop-up untuk meminta persetujuan transaksi. Dana akan dikirim ke vault Private Pool setelah Anda menyetujuinya.
                        </p>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setIsDepositConfirmOpen(false)}
                                className="flex-1 rounded-lg border border-white/10 bg-[#2a2a2c] py-3 text-xs font-mono text-[#e5e1e4] transition-colors hover:bg-[#39393b] cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDeposit}
                                disabled={isLoading}
                                className="flex-1 rounded-lg bg-[#4f46e5] py-3 text-xs font-mono text-white transition-colors hover:bg-[#4d44e3] disabled:opacity-50 cursor-pointer font-bold"
                            >
                                Lanjutkan di Solflare
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isTopUpOpen && publicKey && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm"
                    onClick={() => setIsTopUpOpen(false)}
                >
                    <div
                        className="w-full max-w-md rounded-xl border border-white/10 bg-[#18181B] p-6 shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-mono text-[#c7c4d8]">Top Up</p>
                                <h2 className="mt-1 text-2xl font-semibold text-[#e5e1e4]">Receive SOL</h2>
                            </div>
                            <button
                                onClick={() => setIsTopUpOpen(false)}
                                className="text-[#c7c4d8] transition-colors hover:text-white cursor-pointer"
                                aria-label="Close top up popup"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="mt-6 rounded-lg border border-[#c3c0ff]/20 bg-[#09090B] p-5">
                            <div className="mb-3 flex justify-between text-xs font-mono text-[#c7c4d8]">
                                <span>Connected wallet</span>
                                <span className="text-[#c3c0ff]">{wallet?.adapter?.name || 'Wallet'}</span>
                            </div>
                            <div className="flex justify-center rounded-lg bg-white p-4">
                                <QRCodeSVG value={paymentUri} size={220} level="H" includeMargin />
                            </div>
                            <p className="mt-4 break-all text-center text-xs font-mono leading-5 text-[#e5e1e4]">{walletAddress}</p>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-[#c7c4d8]">
                            Scan this QR code from another wallet to send SOL to your connected wallet. The amount follows the Amount field when provided.
                        </p>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={handleCopyAddress}
                                className="flex-1 rounded-lg border border-white/10 bg-[#2a2a2c] py-3 text-xs font-mono text-[#e5e1e4] transition-colors hover:bg-[#39393b] cursor-pointer"
                            >
                                <span className="material-symbols-outlined mr-2 align-middle text-[16px]">content_copy</span>
                                Copy Address
                            </button>
                            <button
                                onClick={() => setIsTopUpOpen(false)}
                                className="flex-1 rounded-lg bg-[#4f46e5] py-3 text-xs font-mono text-white transition-colors hover:bg-[#4d44e3] cursor-pointer"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Welcome() {
    const endpoint = useMemo(() => DEVNET_RPC, []);
    const wallets = useMemo(() => [new SolflareWalletAdapter({ network: WalletAdapterNetwork.Devnet })], []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect={true}>
                <WalletModalProvider>
                    <UtilifyApp />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}
