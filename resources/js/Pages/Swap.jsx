import React, { useState, useEffect, useMemo } from 'react';
import { 
    ConnectionProvider, 
    WalletProvider, 
    useWallet, 
    useConnection 
} from '@solana/wallet-adapter-react';
import { 
    WalletModalProvider, 
    useWalletModal 
} from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { 
    LAMPORTS_PER_SOL, 
    PublicKey, 
    Transaction, 
    SystemProgram 
} from '@solana/web3.js';
import { usePage, router } from '@inertiajs/react';

import '@solana/wallet-adapter-react-ui/styles.css';

// DEPOSIT VAULT / REPOSITORY WALLET ADDRESS
const DEPOSIT_VAULT_ADDRESS = "8F6FkGNAwbdB3DveHnhjuozu5byyX8aBjUX73x9ncE5A"; // Temporary for testing

const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
};

function WalletConnectButton() {
    const { publicKey, disconnect, wallet, connecting } = useWallet();
    const { setVisible } = useWalletModal();

    if (!publicKey) {
        return (
            <button 
                onClick={() => setVisible(true)}
                disabled={connecting}
                className="bg-[#4f46e5] text-[#dad7ff] px-6 py-2 rounded-full text-xs font-medium font-mono hover:bg-[#4d44e3] transition-all border border-[#c3c0ff]/20 cursor-pointer disabled:opacity-50"
            >
                {connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2 bg-[#18181B] border border-white/10 rounded-full p-1 pl-3">
            <div className="flex items-center gap-2">
                {wallet?.adapter?.icon && (
                    <img src={wallet.adapter.icon} alt={wallet.adapter.name} className="w-4 h-4 rounded-full" />
                )}
                <span className="text-xs font-mono text-[#e5e1e4]">
                    {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
                </span>
            </div>
            <button 
                onClick={() => disconnect()}
                className="bg-[#201f22] hover:bg-red-500/20 text-gray-400 hover:text-red-400 p-1.5 rounded-full transition-colors cursor-pointer"
            >
                <span className="material-symbols-outlined text-[16px]">logout</span>
            </button>
        </div>
    );
}

function SwapContent() {
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();
    const { setVisible } = useWalletModal();

    const [activeTab, setActiveTab] = useState('deposit');
    const [balance, setBalance] = useState(null);
    const [depositAmount, setDepositAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [txStatus, setTxStatus] = useState('');

    // Fetch On-Chain Balance
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
            } catch (err) {
                console.error("Error fetching balance:", err);
            }
        };

        fetchBalance();
        return () => { isMounted = false; };
    }, [publicKey, connection]);

    // --- PROSES TOP UP FIX FOR POPUP BLOCKER & NETWORK ---
    const handleTopUp = async () => {
        const amount = parseFloat(depositAmount);

        if (!publicKey) {
            setVisible(true);
            return;
        }

        if (!depositAmount || isNaN(amount) || amount <= 0) {
            alert("Please enter a valid SOL top-up amount!");
            return;
        }

        if (balance && amount > parseFloat(balance)) {
            alert("Your wallet does not have enough SOL balance!");
            return;
        }

        setIsLoading(true);
        setTxStatus('Preparing Transaction Solana...');

        try {
            // 1. Fetch the blockhash first
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
            const vaultPublicKey = new PublicKey(DEPOSIT_VAULT_ADDRESS);
            const lamports = Math.round(amount * LAMPORTS_PER_SOL);

            // 2. Build the transaction object
            const transaction = new Transaction({
                feePayer: publicKey,
                recentBlockhash: blockhash,
            }).add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: vaultPublicKey,
                    lamports: lamports,
                })
            );

            setTxStatus('Opening Solflare Pop-up (Please Sign)...');

            // 3. Call sendTransaction directly without extra awaits in between
            const signature = await sendTransaction(transaction, connection);
            
            setTxStatus('Confirming transaction on the blockchain...');
            await connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            }, 'processed');

            setTxStatus('Recording balance to the server...');

            // 4. Send the transaction proof (signature) to the Laravel backend
            const response = await fetch('/api/private-balance/deposit', {
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
                    wallet_address: publicKey.toBase58()
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert(`Top Up Successful! Signature: ${signature.slice(0, 8)}...`);
                setDepositAmount('');
                router.reload();
            } else {
                alert(result.message || 'On-chain transaction succeeded, but failed to update the server.');
            }

        } catch (error) {
            console.error("Top Up Error:", error);
            alert(`Top Up Failed: ${error.message || 'User rejected the transaction / Transaction failed.'}`);
        } finally {
            setIsLoading(false);
            setTxStatus('');
        }
    };

    return (
        <div className="antialiased min-h-screen flex flex-col bg-[#09090B] text-[#e5e1e4] font-sans relative overflow-x-hidden">
            {/* Top Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-[#18181B]/80 backdrop-blur-xl border-b border-white/10 shadow-sm">
                <div className="flex justify-between items-center h-16 px-6 md:px-10 max-w-[1280px] mx-auto">
                    <div className="text-2xl font-bold tracking-tighter text-[#c3c0ff]">No Trace</div>
                    
                    <div className="hidden md:flex space-x-6 text-base">
                        <button 
                            onClick={() => setActiveTab('swap')} 
                            className={`px-3 py-1 ${activeTab === 'swap' ? 'text-[#c3c0ff] font-bold border-b-2 border-[#c3c0ff]' : 'text-gray-400'}`}
                        >
                            Swap
                        </button>
                        <button 
                            onClick={() => setActiveTab('deposit')} 
                            className={`px-3 py-1 ${activeTab === 'deposit' ? 'text-[#c3c0ff] font-bold border-b-2 border-[#c3c0ff]' : 'text-gray-400'}`}
                        >
                            Top Up / Deposit
                        </button>
                    </div>

                    <WalletConnectButton />
                </div>
            </nav>

            {/* Main Section */}
            <main className="flex-grow pt-28 pb-16 px-5 md:px-10 max-w-[600px] mx-auto w-full relative z-10 flex flex-col justify-center">
                <div className="bg-[#18181B]/80 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-4 text-[#e5e1e4]">Top Up Solflare</h2>

                    {txStatus && (
                        <div className="mb-4 p-3 bg-[#4f46e5]/10 border border-[#4f46e5]/30 rounded-lg text-xs text-[#c3c0ff] animate-pulse">
                            {txStatus}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="bg-[#09090B] p-4 rounded-lg border border-white/10">
                            <div className="flex justify-between text-xs text-gray-400 mb-2">
                                <span>Deposit Amount (SOL)</span>
                                <span>Wallet Balance: {balance !== null ? `${balance} SOL` : '0.00'}</span>
                            </div>
                            <input 
                                type="number"
                                step="any"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                className="bg-transparent text-2xl font-bold text-white outline-none w-full"
                                placeholder="0.0"
                                disabled={isLoading}
                            />
                        </div>

                        {!publicKey ? (
                            <button
                                onClick={() => setVisible(true)}
                                className="w-full bg-[#4f46e5] text-white py-3.5 rounded-lg text-sm font-mono hover:bg-[#4d44e3] transition-colors font-bold cursor-pointer"
                            >
                                Connect Your Wallet First
                            </button>
                        ) : (
                            <button
                                onClick={handleTopUp}
                                disabled={isLoading}
                                className="w-full bg-[#4f46e5] text-white py-3.5 rounded-lg text-sm font-mono hover:bg-[#4d44e3] transition-colors font-bold disabled:opacity-50 cursor-pointer"
                            >
                                {isLoading ? 'Processing Top Up...' : 'Confirm Top Up via Solflare'}
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function SwapPage() {
    const network = WalletAdapterNetwork.Devnet;

    // Use a stable, CORS-free Devnet RPC
    const endpoint = useMemo(() => "https://devnet.helius-rpc.com/?api-key=1530d05f-5b20-49ae-982e-4366b7a2ff0e", []);

    const wallets = useMemo(() => [
        new SolflareWalletAdapter({ network })
    ], [network]);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <SwapContent />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}
