import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ConnectionProvider, WalletProvider, useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletModalProvider, useWalletModal } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, VersionedTransaction } from '@solana/web3.js';
import { usePage, router, Link } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';

import '@solana/wallet-adapter-react-ui/styles.css';

const DEPOSIT_VAULT_ADDRESS = '8F6FkGNAwbdB3DveHnhjuozu5byyX8aBjUX73x9ncE5A';
const FROM_TOKEN_GROUPS = [
    { label: 'Top', tokens: ['SOL', 'USDC', 'USDT'] },
    { label: 'Yield', tokens: ['stORE'] },
    { label: 'Others', tokens: ['ORE', 'ZEC'] },
];
const TOKEN_MINTS = {
    SOL: 'So11111111111111111111111111111111111111112',
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4uF1qjQ7wN1YfH6mJg4T',
};
const TOKEN_DECIMALS = { SOL: 9, USDC: 6, USDT: 6 };
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

// --- HELPER UNTUK CSRF TOKEN LARAVEL ---
const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
};

// --- KOMPONEN CUSTOM TOMBOL WALLET ---
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

// --- KOMPONEN UTAMA ---
function UtilifyApp() {
    const { publicKey, wallet, sendTransaction } = useWallet();
    const { connection } = useConnection();
    const { setVisible } = useWalletModal();
    const { auth } = usePage().props;

    // State Saldo & Tab
    const [balance, setBalance] = useState(null);
    const [activeTab, setActiveTab] = useState('swap');
    const [isLoading, setIsLoading] = useState(false);

    // State Input
    const [payAmount, setPayAmount] = useState('0.0');
    const [receiveAmount, setReceiveAmount] = useState('0.0');
    const [payToken, setPayToken] = useState('SOL');
    const [receiveToken, setReceiveToken] = useState('USDC');
    const [swapStatus, setSwapStatus] = useState('');
    const [tokenPrices, setTokenPrices] = useState({});
    const [isRateLoading, setIsRateLoading] = useState(false);

    // State wallet balance & deposit form
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
    const swapRate = payTokenPrice && receiveTokenPrice
        ? payTokenPrice / receiveTokenPrice
        : null;
    const quotedReceiveAmount = swapRate && Number.parseFloat(payAmount) > 0
        ? (Number.parseFloat(payAmount) * swapRate * 0.997).toFixed(6)
        : '--';

    useEffect(() => {
        const tokenIds = [...new Set([payToken, receiveToken].map((token) => TOKEN_PRICE_IDS[token]).filter(Boolean))];
        if (tokenIds.length === 0) {
            setTokenPrices({});
            return;
        }

        let isMounted = true;
        setIsRateLoading(true);
        fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds.join(',')}&vs_currencies=usd`)
            .then((response) => {
                if (!response.ok) throw new Error('Price request failed');
                return response.json();
            })
            .then((prices) => {
                if (!isMounted) return;
                const normalizedPrices = Object.entries(TOKEN_PRICE_IDS).reduce((result, [token, id]) => {
                    if (prices[id]?.usd) result[token] = prices[id].usd;
                    return result;
                }, {});
                setTokenPrices(normalizedPrices);
            })
            .catch(() => {
                if (isMounted) setTokenPrices({});
            })
            .finally(() => {
                if (isMounted) setIsRateLoading(false);
            });

        return () => { isMounted = false; };
    }, [payToken, receiveToken]);

    // Ambil saldo SOL (On-Chain)
    useEffect(() => {
        if (!publicKey) {
            setBalance(null);
            return;
        }

        let isMounted = true;
        const fetchBalance = async () => {
            try {
                const lamports = await connection.getBalance(publicKey);
                if (isMounted) {
                    setBalance((lamports / LAMPORTS_PER_SOL).toFixed(4));
                }
            } catch (error) {
                console.error('Gagal mengambil saldo SOL:', error);
            }
        };

        fetchBalance();
        return () => { isMounted = false; };
    }, [publicKey, connection]);

    // Fungsi Logout melalui Inertia
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
            setPayAmount(Math.max(0, parseFloat(balance) - 0.001).toFixed(4));
        }
    };

    const handleReviewSwap = async () => {
        const amount = Number.parseFloat(payAmount);
        if (!publicKey) {
            setVisible(true);
            return;
        }
        if (!Number.isFinite(amount) || amount <= 0) {
            alert('Masukkan jumlah swap yang valid.');
            return;
        }
        if (!TOKEN_MINTS[payToken] || !TOKEN_MINTS[receiveToken]) {
            alert('Token ini belum memiliki alamat mint Solana yang terkonfigurasi.');
            return;
        }

        setIsLoading(true);
        setSwapStatus('Mengambil quote Jupiter...');
        try {
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
            setBalance((await connection.getBalance(publicKey) / LAMPORTS_PER_SOL).toFixed(4));
            alert(`Swap berhasil! Signature: ${signature.slice(0, 8)}...`);
        } catch (error) {
            console.error('Swap Error:', error);
            alert(`Swap gagal: ${error.message || 'Transaksi dibatalkan.'}`);
        } finally {
            setIsLoading(false);
            setSwapStatus('');
        }
    };

    // Kirim SOL melalui Solflare, lalu catat saldo setelah transaksi terkonfirmasi.
    const handleDeposit = async () => {
        const amount = parseFloat(depositAmount);
        if (!depositAmount || isNaN(amount) || amount <= 0) {
            alert('Masukkan jumlah deposit yang valid!');
            return;
        }

        if (!publicKey) {
            setVisible(true);
            return;
        }

        setIsDepositConfirmOpen(false);

        setIsLoading(true);
        try {
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
            const transaction = new Transaction({
                feePayer: publicKey,
                recentBlockhash: blockhash,
            }).add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: new PublicKey(DEPOSIT_VAULT_ADDRESS),
                    lamports: Math.round(amount * LAMPORTS_PER_SOL),
                })
            );

            const signature = await sendTransaction(transaction, connection);
            await connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight,
            }, 'processed');
            setBalance((await connection.getBalance(publicKey) / LAMPORTS_PER_SOL).toFixed(4));
            setDepositAmount('');
            alert(`Top Up Berhasil! Signature: ${signature.slice(0, 8)}...`);
        } catch (error) {
            console.error('Error deposit:', error);
            const errorMessage = error?.message || '';
            const readableError = /insufficient|insufficient funds|debit an account|not enough/i.test(errorMessage)
                    ? 'Saldo SOL tidak cukup untuk nominal top up dan biaya transaksi.'
                    : /internal error/i.test(errorMessage) && Number.parseFloat(balance || '0') <= 0
                        ? 'Saldo SOL wallet 0. Solflare tidak dapat memproses transaksi tanpa SOL untuk biaya network.'
                        : /internal error/i.test(errorMessage) && publicKey?.toBase58() === DEPOSIT_VAULT_ADDRESS
                            ? 'Alamat vault sama dengan wallet pengirim. Gunakan wallet vault terpisah untuk top up pool.'
                    : errorMessage || 'Terjadi kesalahan yang tidak diketahui.';
            alert(`Top Up gagal: ${readableError}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDepositRequest = () => {
        const amount = Number.parseFloat(depositAmount);
        if (!publicKey) {
            setVisible(true);
            return;
        }
        if (!Number.isFinite(amount) || amount <= 0) {
            alert('Masukkan jumlah deposit yang valid.');
            return;
        }
        setIsDepositConfirmOpen(true);
    };

    const handleTopUp = () => {
        if (!publicKey) {
            setVisible(true);
            return;
        }

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
            {/* Background Radial Glow */}
            <div
                className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] z-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, rgba(9, 9, 11, 0) 70%)',
                }}
            />

            {/* Top Navbar */}
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

                    <div className="flex items-center gap-4">
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

                        <div className="hidden lg:flex items-center gap-2 bg-[#201f22] px-3 py-1.5 rounded-full border border-white/10">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-xs font-medium text-[#e5e1e4] font-mono">Solana Mainnet</span>
                        </div>

                        <CustomWalletButton />
                    </div>
                </div>
            </nav>

            {/* Main Section */}
            <main className="flex-grow pt-24 pb-16 px-5 md:px-10 max-w-[1280px] mx-auto w-full relative z-10 flex flex-col gap-16">
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <h1 className="text-3xl md:text-5xl font-bold text-[#e5e1e4] tracking-tight leading-tight">
                            The Universal <br />
                            <span className="text-[#c3c0ff]">Web3 Toolkit</span>
                        </h1>
                        <p className="text-base text-[#c7c4d8] max-w-md">
                            Seamlessly swap tokens, bridge across networks, and manage private liquidity pools from a high-performance terminal.
                        </p>
                        <div className="flex gap-4">
                            <button className="bg-[#2a2a2c] border border-white/10 text-[#e5e1e4] px-6 py-3 rounded-full text-xs font-mono hover:bg-[#39393b] transition-colors flex items-center gap-2 cursor-pointer">
                                <span className="material-symbols-outlined text-[18px]">explore</span>
                                Explore Tools
                            </button>
                        </div>
                    </div>

                    {/* Terminal Card Dynamic Area */}
                    <div className="bg-[#18181B]/60 backdrop-blur-md border border-white/10 rounded-xl p-6 relative overflow-visible group shadow-lg min-h-[400px]">
                        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-4">
                            <h2 className="text-2xl font-semibold text-[#e5e1e4] capitalize">{activeTab}</h2>
                            <span className="text-xs text-gray-400 font-mono bg-[#201f22] px-2 py-1 rounded">Private Mode</span>
                        </div>

                        {/* SWAP TAB */}
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
                                        <div className="flex justify-between text-[#8f8d99] text-xs font-mono mb-3">
                                            <span>Pay</span>
                                            <span>Balance: {publicKey ? (balance !== null ? `${balance} SOL` : 'Loading...') : '0.00 SOL'}</span>
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
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={quotedReceiveAmount}
                                                readOnly
                                                className="bg-transparent text-3xl font-semibold text-[#e5e1e4] outline-none min-w-0 w-full cursor-default"
                                            />
                                            <TokenSelect value={receiveToken} groups={availableToGroups} onChange={setReceiveToken} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between mt-4 text-[11px] text-[#8f8d99] font-mono">
                                    <span>Rate</span>
                                    <span>
                                        {isRateLoading ? 'Loading live rate...' : swapRate ? `1 ${payToken} ≈ ${(swapRate * 0.997).toFixed(6)} ${receiveToken}` : 'Rate unavailable'}
                                    </span>
                                </div>
                                <div className="flex justify-end text-[11px] text-[#8f8d99] font-mono">
                                    <span>{swapRate ? `1 ${receiveToken} ≈ ${(1 / swapRate).toFixed(6)} ${payToken}` : 'Select a supported pair'}</span>
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

                        {/* DEPOSIT TAB */}
                        {activeTab === 'deposit' && (
                            <div className="space-y-4">
                                <div className="bg-[#09090B] p-4 rounded border border-white/10">
                                    <label className="text-xs text-gray-400">Amount to Deposit</label>
                                    <div className="flex gap-2 mt-1">
                                        <input
                                            type="number"
                                            step="any"
                                            value={depositAmount}
                                            onChange={(e) => setDepositAmount(e.target.value)}
                                            className="bg-transparent text-lg outline-none w-full"
                                            placeholder="0.0"
                                        />
                                        <span className="text-sm text-gray-400 font-mono">SOL</span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400 flex justify-between">
                                    <span>Solana Wallet Balance</span>
                                    <span>{publicKey ? (balance !== null ? `${balance} SOL` : 'Loading...') : '0.00 SOL'}</span>
                                </div>
                                <button
                                    onClick={handleDepositRequest}
                                    disabled={isLoading}
                                    className="w-full bg-[#4f46e5] text-white py-4 rounded text-sm font-mono hover:bg-[#4d44e3] transition-colors flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer font-bold"
                                >
                                    {isLoading ? 'Processing Deposit...' : 'Top Up Private Pool'}
                                </button>
                                <button
                                    onClick={handleTopUp}
                                    className="w-full border border-[#c3c0ff]/30 bg-[#c3c0ff]/10 text-[#c3c0ff] py-3 rounded text-sm font-mono hover:bg-[#c3c0ff]/20 transition-colors flex justify-center items-center gap-2 cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                                    {publicKey ? 'Top Up Connected Wallet' : 'Connect Wallet to Top Up'}
                                </button>
                                {topUpMessage && <p className="text-xs text-[#c3c0ff] font-mono">{topUpMessage}</p>}
                            </div>
                        )}

                    </div>
                </section>
            </main>

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
                                <h2 className="mt-1 text-2xl font-semibold text-[#e5e1e4]">Review deposit</h2>
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
                                <span>Available balance</span>
                                <span className="font-mono text-[#e5e1e4]">{balance !== null ? `${balance} SOL` : 'Loading...'}</span>
                            </div>
                            <div className="border-t border-white/10 pt-3 flex justify-between text-base font-semibold text-[#e5e1e4]">
                                <span>Top up amount</span>
                                <span className="font-mono text-[#c3c0ff]">{Number.parseFloat(depositAmount).toFixed(6)} SOL</span>
                            </div>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-[#c7c4d8]">
                            Solflare akan membuka pop-up untuk meminta persetujuan transaksi. Dana akan dikirim ke vault private pool setelah Anda menyetujuinya.
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
                                className="flex-1 rounded-lg bg-[#4f46e5] py-3 text-xs font-mono text-white transition-colors hover:bg-[#4d44e3] disabled:opacity-50 cursor-pointer"
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

// --- WRAPPER UTAMA ---
export default function Welcome() {
    const endpoint = useMemo(
        () => import.meta.env.VITE_SOLANA_RPC_URL || 'https://solana-rpc.publicnode.com',
        []
    );
    const wallets = useMemo(() => [new SolflareWalletAdapter()], []);

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