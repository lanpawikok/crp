import React, { useState, useEffect, useMemo } from 'react';
import { ConnectionProvider, WalletProvider, useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletModalProvider, useWalletModal } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { usePage, router, Link } from '@inertiajs/react';

import '@solana/wallet-adapter-react-ui/styles.css';

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
    const { publicKey } = useWallet();
    const { connection } = useConnection();
    const { auth } = usePage().props;

    // State Saldo & Tab
    const [balance, setBalance] = useState(null);
    const [activeTab, setActiveTab] = useState('swap');
    const [isLoading, setIsLoading] = useState(false);

    // State Input
    const [payAmount, setPayAmount] = useState('0.0');
    const [receiveAmount, setReceiveAmount] = useState('0.0');

    // State Private Balance & Form
    const [privateBalance, setPrivateBalance] = useState(0.0);
    const [depositAmount, setDepositAmount] = useState('');
    const [sendAmount, setSendAmount] = useState('');
    const [recipientAddress, setRecipientAddress] = useState('');
    const [bridgeAmount, setBridgeAmount] = useState('');
    const [targetChain, setTargetChain] = useState('Ethereum');

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

    // Ambil Private Balance dari API Laravel
    useEffect(() => {
        if (!auth?.user) return;

        let isMounted = true;
        const fetchPrivateBalance = async () => {
            try {
                const res = await fetch('/api/private-balance', {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json',
                    },
                });
                if (!res.ok) throw new Error('Network response was not ok');
                const data = await res.json();
                if (isMounted) {
                    setPrivateBalance(parseFloat(data.balance || 0));
                }
            } catch (error) {
                console.error('Gagal mengambil saldo privat:', error);
            }
        };

        fetchPrivateBalance();
        return () => { isMounted = false; };
    }, [auth?.user]);

    // Fungsi Logout melalui Inertia
    const handleLogout = (e) => {
        e.preventDefault();
        router.post('/logout');
    };

    // Deposit Realtime ke Server Laravel
    const handleDeposit = async () => {
        const amount = parseFloat(depositAmount);
        if (!depositAmount || isNaN(amount) || amount <= 0) {
            alert('Masukkan jumlah deposit yang valid!');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/private-balance/deposit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ amount }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setPrivateBalance(parseFloat(data.new_balance));
                setDepositAmount('');
                alert('Deposit berhasil!');
            } else {
                alert(data.message || 'Gagal deposit. Pastikan kamu sudah login.');
            }
        } catch (error) {
            console.error('Error deposit:', error);
            alert('Gagal terhubung ke server.');
        } finally {
            setIsLoading(false);
        }
    };

    // Private Transfer
    const handlePrivateSend = () => {
        const amount = parseFloat(sendAmount);
        if (!sendAmount || isNaN(amount) || amount <= 0) return alert('Masukkan jumlah transfer yang valid!');
        if (!recipientAddress.trim()) return alert('Masukkan alamat penerima!');
        if (privateBalance < amount) return alert('Saldo privat tidak mencukupi!');

        setIsLoading(true);
        setTimeout(() => {
            setPrivateBalance((prev) => prev - amount);
            setSendAmount('');
            setRecipientAddress('');
            setIsLoading(false);
            alert(`Transaksi privat berhasil dikirim ke ${recipientAddress.slice(0, 6)}...`);
        }, 1200);
    };

    // Bridge Transaction
    const handleBridge = () => {
        const amount = parseFloat(bridgeAmount);
        if (!bridgeAmount || isNaN(amount) || amount <= 0) return alert('Masukkan jumlah Bridge yang valid!');

        setIsLoading(true);
        setTimeout(() => {
            setBridgeAmount('');
            setIsLoading(false);
            alert(`Bridge sebesar ${amount} SOL ke network ${targetChain} sedang diproses!`);
        }, 1200);
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
                        {['swap', 'bridge', 'deposit', 'send'].map((tab) => (
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
                            <span className="text-xs font-medium text-[#e5e1e4] font-mono">Solana Devnet</span>
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
                    <div className="bg-[#18181B]/60 backdrop-blur-md border border-white/10 rounded-xl p-6 relative overflow-hidden group shadow-lg min-h-[400px]">
                        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-4">
                            <h2 className="text-2xl font-semibold text-[#e5e1e4] capitalize">{activeTab}</h2>
                            <span className="text-xs text-gray-400 font-mono bg-[#201f22] px-2 py-1 rounded">Private Mode</span>
                        </div>

                        {/* SWAP TAB */}
                        {activeTab === 'swap' && (
                            <>
                                <div className="space-y-2 relative">
                                    <div className="bg-[#09090B] border border-white/10 rounded-lg p-4 focus-within:border-[#c3c0ff] transition-colors">
                                        <div className="flex justify-between text-[#c7c4d8] text-xs font-mono mb-2">
                                            <span>You pay</span>
                                            <span>Balance: {publicKey ? (balance !== null ? `${balance} SOL` : 'Loading...') : '0.00'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <input
                                                type="text"
                                                value={payAmount}
                                                onChange={(e) => setPayAmount(e.target.value)}
                                                className="bg-transparent text-2xl font-semibold text-[#e5e1e4] outline-none w-1/2"
                                                placeholder="0"
                                            />
                                            <button className="flex items-center gap-2 bg-[#201f22] px-3 py-1.5 rounded-full hover:bg-[#39393b] transition-colors border border-white/10 cursor-pointer">
                                                <span className="text-xs font-mono">SOL</span>
                                                <span className="material-symbols-outlined text-[16px]">expand_more</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                        <button className="bg-[#39393b] p-2 rounded-full border border-white/10 text-[#e5e1e4] hover:text-[#c3c0ff] transition-all hover:rotate-180 duration-300 cursor-pointer">
                                            <span className="material-symbols-outlined">swap_vert</span>
                                        </button>
                                    </div>

                                    <div className="bg-[#09090B] border border-white/10 rounded-lg p-4 focus-within:border-[#c3c0ff] transition-colors">
                                        <div className="flex justify-between text-[#c7c4d8] text-xs font-mono mb-2">
                                            <span>You receive</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <input
                                                type="text"
                                                value={receiveAmount}
                                                onChange={(e) => setReceiveAmount(e.target.value)}
                                                className="bg-transparent text-2xl font-semibold text-[#e5e1e4] outline-none w-1/2"
                                                placeholder="0"
                                            />
                                            <button className="flex items-center gap-2 bg-[#4f46e5]/20 px-3 py-1.5 rounded-full hover:bg-[#4f46e5]/30 transition-colors border border-[#4f46e5]/30 text-[#c3c0ff] cursor-pointer">
                                                <span className="text-xs font-mono">Select token</span>
                                                <span className="material-symbols-outlined text-[16px]">expand_more</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {publicKey ? (
                                    <button className="w-full mt-6 bg-[#4f46e5] text-white py-4 rounded-lg text-xs font-mono hover:bg-[#4d44e3] transition-colors border border-[#c3c0ff]/20 cursor-pointer font-bold">
                                        Review Swap
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
                                    <span>Public Wallet: {publicKey ? (balance !== null ? `${balance} SOL` : 'Loading...') : '0.00'}</span>
                                    <span>Private Balance: {privateBalance.toFixed(4)} SOL</span>
                                </div>
                                <button
                                    onClick={handleDeposit}
                                    disabled={isLoading}
                                    className="w-full bg-[#4f46e5] text-white py-4 rounded text-sm font-mono hover:bg-[#4d44e3] transition-colors flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer font-bold"
                                >
                                    {isLoading ? 'Processing Deposit...' : 'Top Up Private Pool'}
                                </button>
                            </div>
                        )}

                        {/* SEND TAB */}
                        {activeTab === 'send' && (
                            <div className="space-y-4">
                                <div className="bg-[#09090B] p-4 rounded border border-white/10">
                                    <label className="text-xs text-gray-400">Recipient Address</label>
                                    <input
                                        type="text"
                                        value={recipientAddress}
                                        onChange={(e) => setRecipientAddress(e.target.value)}
                                        className="bg-transparent text-sm outline-none w-full mt-1 font-mono text-[#c7c4d8]"
                                        placeholder="Enter wallet address (Solana / EVM)"
                                    />
                                </div>
                                <div className="bg-[#09090B] p-4 rounded border border-white/10">
                                    <label className="text-xs text-gray-400">Amount to Send</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={sendAmount}
                                        onChange={(e) => setSendAmount(e.target.value)}
                                        className="bg-transparent text-lg outline-none w-full mt-1"
                                        placeholder="0.0"
                                    />
                                </div>
                                <button
                                    onClick={handlePrivateSend}
                                    disabled={isLoading}
                                    className="w-full bg-[#4f46e5] text-white py-4 rounded text-sm font-mono hover:bg-[#4d44e3] transition-colors flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer font-bold"
                                >
                                    {isLoading ? 'Processing Transfer...' : 'Send Private Transfer'}
                                </button>
                            </div>
                        )}

                        {/* BRIDGE TAB */}
                        {activeTab === 'bridge' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-[#09090B] p-3 rounded border border-white/10">
                                        <span className="text-xs text-gray-400">From</span>
                                        <div className="text-sm font-bold mt-1">Solana</div>
                                    </div>
                                    <div className="bg-[#09090B] p-3 rounded border border-white/10">
                                        <span className="text-xs text-gray-400">To</span>
                                        <select
                                            value={targetChain}
                                            onChange={(e) => setTargetChain(e.target.value)}
                                            className="w-full bg-transparent text-sm font-bold mt-1 outline-none cursor-pointer text-white"
                                        >
                                            <option value="Ethereum" className="bg-[#09090B]">Ethereum</option>
                                            <option value="Base" className="bg-[#09090B]">Base (L2)</option>
                                            <option value="BNB Chain" className="bg-[#09090B]">BNB Chain</option>
                                            <option value="Polygon" className="bg-[#09090B]">Polygon</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="bg-[#09090B] p-4 rounded border border-white/10">
                                    <label className="text-xs text-gray-400">Bridge Amount</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={bridgeAmount}
                                        onChange={(e) => setBridgeAmount(e.target.value)}
                                        className="bg-transparent text-lg outline-none w-full mt-1"
                                        placeholder="0.0"
                                    />
                                </div>
                                <button
                                    onClick={handleBridge}
                                    disabled={isLoading}
                                    className="w-full bg-[#4f46e5] text-white py-4 rounded text-sm font-mono hover:bg-[#4d44e3] transition-colors flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer font-bold"
                                >
                                    {isLoading ? 'Processing Bridge...' : `Bridge to ${targetChain}`}
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

// --- WRAPPER UTAMA ---
export default function Welcome() {
    const endpoint = useMemo(() => clusterApiUrl('devnet'), []);
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