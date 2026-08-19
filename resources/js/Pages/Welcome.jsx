import React, { useState, useEffect, useMemo } from 'react';
import { ConnectionProvider, WalletProvider, useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletModalProvider, useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Import CSS bawaan Solana Wallet Modal
import '@solana/wallet-adapter-react-ui/styles.css';

// --- KOMPONEN CUSTOM TOMBOL WALLET (CONNECT, GANTI, & DISCONNECT) ---
function CustomWalletButton() {
  const { publicKey, disconnect, wallet, connecting, select } = useWallet();
  const { setVisible } = useWalletModal();
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Debug: Log state wallet
  useEffect(() => {
    console.log('Wallet State:', {
      walletName: wallet?.adapter?.name,
      publicKey: publicKey?.toBase58(),
      connected: !!publicKey,
      connecting,
      hasWallet: !!wallet,
      isPhantomInstalled: !!window?.solana?.isPhantom
    });
  }, [wallet, publicKey, connecting]);

  // Handle khusus untuk Phantom error
  useEffect(() => {
    if (wallet?.adapter?.name === 'Phantom') {
      const handleError = (error) => {
        console.error('Phantom error:', error);
        if (error.message?.includes('rejected')) {
          setError('Please approve the connection in Phantom wallet');
        } else if (error.message?.includes('already processing')) {
          setError('Phantom is busy, please wait...');
        }
      };
      
      // Coba tambahkan event listener
      try {
        wallet.adapter.on('error', handleError);
        return () => {
          wallet.adapter.off('error', handleError);
        };
      } catch (e) {
        console.log('Cannot add event listener to adapter');
      }
    }
  }, [wallet]);

  // Fungsi khusus untuk connect ke Phantom secara manual
  const connectPhantomManually = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      // Cek apakah Phantom terinstall
      if (!window?.solana?.isPhantom) {
        alert('Phantom wallet not installed! Please install it first.');
        window.open('https://phantom.app/', '_blank');
        setIsConnecting(false);
        return false;
      }

      console.log('Attempting manual Phantom connection...');
      
      // Coba connect via window.solana
      const resp = await window.solana.connect();
      
      if (resp?.publicKey) {
        console.log('Manual Phantom connect success:', resp.publicKey.toString());
        // Refresh page to sync state
        setTimeout(() => {
          window.location.reload();
        }, 500);
        setIsConnecting(false);
        return true;
      }
      
      setIsConnecting(false);
      return false;
    } catch (error) {
      console.error('Manual Phantom connection error:', error);
      setError(error.message || 'Failed to connect Phantom');
      setIsConnecting(false);
      return false;
    }
  };

  // Fungsi untuk buka modal wallet
  const handleOpenWalletModal = async () => {
    try {
      setError(null);
      
      // Cek apakah Phantom terinstall
      const hasPhantom = window?.solana?.isPhantom;
      console.log('Phantom installed:', hasPhantom);
      
      // Jika Phantom terinstall dan wallet belum terhubung, coba manual dulu
      if (hasPhantom && !publicKey && !connecting) {
        console.log('Trying manual Phantom connection first...');
        const connected = await connectPhantomManually();
        if (connected) {
          return; // Success, exit function
        }
        // Jika manual gagal, lanjut ke modal
      }
      
      // Jika wallet sudah terhubung, disconnect dulu
      if (publicKey) {
        await disconnect();
        // Tunggu sebentar sebelum buka modal
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Buka modal pilihan wallet
      setVisible(true);
    } catch (error) {
      console.error('Error handling wallet:', error);
      setError(error.message || 'Failed to connect wallet');
    }
  };

  // Jika wallet BELUM terhubung
  if (!publicKey) {
    return (
      <div className="relative">
        {error && (
          <div className="absolute -top-8 left-0 right-0 text-red-400 text-xs text-center bg-red-400/10 px-2 py-1 rounded">
            {error}
          </div>
        )}
        <button 
          onClick={handleOpenWalletModal}
          disabled={connecting || isConnecting}
          className="bg-[#4f46e5] text-white px-5 py-2 rounded-full text-xs font-mono hover:bg-[#4d44e3] transition-colors flex items-center gap-2 border border-[#c3c0ff]/20 shadow-md active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
          {connecting || isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      </div>
    );
  }

  // Jika wallet SUDAH terhubung
  return (
    <div className="flex items-center gap-1.5 bg-[#18181B] border border-white/10 rounded-full p-1 pl-1.5 shadow-md">
      {/* Tombol Klik untuk Ganti Wallet */}
      <button
        onClick={handleOpenWalletModal}
        className="flex items-center gap-2 bg-[#201f22] hover:bg-[#2a2a2c] px-3 py-1.5 rounded-full text-xs font-mono text-[#e5e1e4] transition-all border border-white/5 active:scale-95 cursor-pointer"
        title="Klik untuk ganti wallet"
      >
        {wallet?.adapter?.icon && (
          <img 
            src={wallet.adapter.icon} 
            alt={wallet.adapter.name} 
            className="w-4 h-4 rounded-full"
          />
        )}
        <span>{publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}</span>
        <span className="material-symbols-outlined text-[14px] text-[#c3c0ff]">swap_horiz</span>
      </button>

      {/* Tombol Disconnect/Logout */}
      <button 
        onClick={() => {
          try {
            disconnect();
            setError(null);
          } catch (error) {
            console.error('Error disconnecting:', error);
            // Force disconnect via window.solana
            if (window?.solana?.disconnect) {
              window.solana.disconnect();
            }
          }
        }}
        className="text-[#c7c4d8] hover:text-red-400 hover:bg-[#201f22] transition-colors p-1.5 rounded-full flex items-center active:scale-95 cursor-pointer"
        title="Disconnect Wallet"
      >
        <span className="material-symbols-outlined text-[16px]">logout</span>
      </button>
    </div>
  );
}

// --- KOMPONEN UTAMA UI UTILIFY ---
function UtilifyApp() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  
  const [balance, setBalance] = useState(null);
  const [payAmount, setPayAmount] = useState('0.0');
  const [receiveAmount, setReceiveAmount] = useState('0.0');

  // Ambil saldo SOL dari wallet terhubung
  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    const fetchBalance = async () => {
      try {
        const lamports = await connection.getBalance(publicKey);
        setBalance((lamports / LAMPORTS_PER_SOL).toFixed(4));
      } catch (error) {
        console.error('Gagal mengambil saldo:', error);
      }
    };

    fetchBalance();
  }, [publicKey, connection]);

  return (
    <div className="antialiased min-h-screen flex flex-col bg-[#09090B] text-[#e5e1e4] font-sans relative overflow-x-hidden">
      {/* Hero Glow Background */}
      <div 
        className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, rgba(9, 9, 11, 0) 70%)'
        }}
      />

      {/* Top Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#18181B]/80 backdrop-blur-xl border-b border-white/10 shadow-sm">
        <div className="flex justify-between items-center h-16 px-6 md:px-10 max-w-[1280px] mx-auto">
          <div className="text-2xl font-bold tracking-tighter text-[#c3c0ff]">Utilify</div>
          
          <div className="hidden md:flex space-x-8 text-base">
            <a href="#" className="text-[#c3c0ff] font-bold border-b-2 border-[#c3c0ff] pb-1 active:scale-95 transition-transform duration-100">
              Swap
            </a>
            <a href="#" className="text-[#c7c4d8] hover:text-[#e5e1e4] transition-colors hover:bg-[#2a2a2c]/50 px-3 py-1 rounded active:scale-95">
              Bridge
            </a>
            <a href="#" className="text-[#c7c4d8] hover:text-[#e5e1e4] transition-colors hover:bg-[#2a2a2c]/50 px-3 py-1 rounded active:scale-95">
              Tools
            </a>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 bg-[#201f22] px-3 py-1.5 rounded-full border border-white/10">
              <img 
                className="w-4 h-4 rounded-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMVyTsgD7VCKXgVK5I5LHBpp0PcAVdeTqDeuA0b928InzYUIyDHn4zDbZr8bbL24X0iZZtroGujFSIKcauQTUAZnR7LJA6Tpb76CqJR9ycDPD9gwKGejc36pHb-VTAdzXV-Q6IyKPgSiVXiGKUV3Tn8k9vQ1_Hp19MDXmwuXnAG9WE4jyjOrMlqxrPUSXhLcjv7dWcm842Jty8vD4F_4KxxaTMamK6dycy0spfePPxjCQnrYVBV8V_vg" 
                alt="Solana"
              />
              <span className="text-xs font-medium text-[#e5e1e4] font-mono">Solana</span>
            </div>
            
            {/* Custom Wallet Button di Navbar */}
            <CustomWalletButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-24 pb-16 px-5 md:px-10 max-w-[1280px] mx-auto w-full relative z-10 flex flex-col gap-16">
        
        {/* Hero & Swap Terminal Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-3xl md:text-5xl font-bold text-[#e5e1e4] tracking-tight leading-tight">
              The Universal <br />
              <span className="text-[#c3c0ff]">Web3 Toolkit</span>
            </h1>
            <p className="text-base text-[#c7c4d8] max-w-md">
              Seamlessly swap tokens, bridge across networks, and deploy smart contracts from a single, high-performance terminal.
            </p>
            <div className="flex gap-4">
              <button className="bg-[#2a2a2c] border border-white/10 text-[#e5e1e4] px-6 py-3 rounded-full text-xs font-mono hover:bg-[#39393b] transition-colors flex items-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">explore</span> 
                Explore Tools
              </button>
            </div>
          </div>

          {/* Swap Terminal Card */}
          <div className="bg-[#18181B]/60 backdrop-blur-md border border-white/10 rounded-xl p-6 relative overflow-hidden group shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-[#4f46e5]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-[#e5e1e4]">Swap</h2>
              <span className="material-symbols-outlined text-[#c7c4d8] cursor-pointer hover:text-[#c3c0ff] transition-colors">
                settings
              </span>
            </div>

            <div className="space-y-2 relative">
              {/* You Pay Input */}
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
                    <img 
                      className="w-5 h-5 rounded-full object-cover" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUoyfZUzHI1LkQwYxkHJwmF5yC1Uec-D3cOxiguljyc_xjJKQX0tqE9GVJgZ6YPeIZegPEHUHpPD7EyIg8p2x5itsV_jEoDQ6GWRiGJZRw4VFICWha4Sn8I9cTMbU9xr9OhmUdN6pprYUZCKNUq7Bc5DtUI6BP4q2uOjpCodQgu6WXnFCb5aT3kOV1lNCUytkE4iTCSFzSlo5p1iRK-7DFXW54vW3e3Zmy6113xXH3SfYWIOLTr3FWAA" 
                      alt="SOL"
                    />
                    <span className="text-xs font-mono">SOL</span>
                    <span className="material-symbols-outlined text-[16px]">expand_more</span>
                  </button>
                </div>
              </div>

              {/* Swap Icon Button */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <button className="bg-[#39393b] p-2 rounded-full border border-white/10 text-[#e5e1e4] hover:text-[#c3c0ff] transition-all hover:rotate-180 duration-300 cursor-pointer">
                  <span className="material-symbols-outlined">swap_vert</span>
                </button>
              </div>

              {/* You Receive Input */}
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

            {/* Action Button Swap Card */}
            {publicKey ? (
              <button className="w-full mt-6 bg-[#4f46e5] text-white py-4 rounded-lg text-xs font-mono hover:bg-[#4d44e3] transition-colors border border-[#c3c0ff]/20 cursor-pointer">
                Review Swap
              </button>
            ) : (
              <div className="w-full mt-6">
                <CustomWalletButton />
              </div>
            )}
          </div>
        </section>

        {/* Supported Networks Section */}
        <section className="space-y-6 border-t border-white/10 pt-12">
          <div>
            <h3 className="text-2xl font-semibold text-[#e5e1e4]">Supported Networks</h3>
            <p className="text-sm text-[#c7c4d8]">Lightning fast bridging across top chains.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#18181B]/60 backdrop-blur-md p-4 rounded-lg flex items-center gap-4 border border-white/10 hover:border-[#c3c0ff]/50 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-[#39393b] flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                <img className="w-6 h-6 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAi3jXNZjtcefzEjaXpG5S7Fku51l6uJ-tYNXmOUbJkqm64A_2SCCFjh8HNeq3QMYV-o3-iBOOYQIq7sMffsksKzw1tUAU84TFPVb0u7JoqQ-osdWWoSYHlG-mOqzkyfpRdXXDiEOoUMfAwIugr5rrLqvJhSqh-sxcZaklwkrDesX4WqSvqFQ3BSoMQqLr2CQudkTgfg4olpfwWT_81k3xQ85hLDOgUhYPRG1L6uFwEygQgJMmAowLcCw" alt="Solana" />
              </div>
              <span className="text-xs font-mono text-[#e5e1e4]">Solana</span>
            </div>

            <div className="bg-[#18181B]/60 backdrop-blur-md p-4 rounded-lg flex items-center gap-4 border border-white/10 hover:border-[#c3c0ff]/50 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-[#39393b] flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                <img className="w-6 h-6 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2XFzu42Ps48XISL0JQivsLxmvdPS8N9PBzR5JLlQqNb3Nvo-kupV8vGNCDIBxX9spGqvVoQeaJFDXEJClz4muoj01TPGvYCYrsmNh5t6F5FnKA8HfrVM0h5-aqiivQDwN7V7LIkUyeIM6oQRZ8DlGR5KqZd65PKoR21gMYteLbqVYAxtwe2YzX8bUTbpH94be1ofPL_GSgq0MqbLGoAeZV24yIwq7pQTWkCANY3n2W5STR6_k_U9YrQ" alt="Ethereum" />
              </div>
              <span className="text-xs font-mono text-[#e5e1e4]">Ethereum</span>
            </div>

            <div className="bg-[#18181B]/60 backdrop-blur-md p-4 rounded-lg flex items-center gap-4 border border-white/10 hover:border-[#c3c0ff]/50 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-[#39393b] flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                <img className="w-6 h-6 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_Irkc_ayOkZdRgPcxDUtZd5_VNBZOfXuzeQwvLvQnVikmJmoMkIsXxax5UNGItY2BairZrvICbT2POR2hej2ZIbW1jUVMrWXKAp7jmA-a2XzkQhBZwRuUKWzg_tjCQeZv5kQhyPCbIVf4AMc6okRzZjX6GEtWqjMssG_h2EjmnmiLyBOamdjorLpg1qJPypm13ZIGUDmsTDndChJYUO0BevKK36z7nmDcNiW9ioe0vNNgaZ9Jgz0YQQ" alt="Polygon" />
              </div>
              <span className="text-xs font-mono text-[#e5e1e4]">Polygon</span>
            </div>

            <div className="bg-[#18181B]/60 backdrop-blur-md p-4 rounded-lg flex items-center gap-4 border border-white/10 hover:border-[#c3c0ff]/50 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-[#39393b] flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[#c7c4d8] group-hover:text-[#c3c0ff]">more_horiz</span>
              </div>
              <span className="text-xs font-mono text-[#e5e1e4]">12+ More</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 mt-auto bg-[#131315] border-t border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-10 max-w-[1280px] mx-auto gap-4">
          <div className="text-2xl font-bold text-[#e5e1e4]">Utilify</div>
          <div className="flex space-x-6 text-xs font-mono">
            <a href="#" className="text-[#c7c4d8] hover:text-[#c3c0ff] transition-colors">Privacy Policy</a>
            <a href="#" className="text-[#c7c4d8] hover:text-[#c3c0ff] transition-colors">Terms of Service</a>
            <a href="#" className="text-[#c7c4d8] hover:text-[#c3c0ff] transition-colors">Docs</a>
            <a href="#" className="text-[#c7c4d8] hover:text-[#c3c0ff] transition-colors">Github</a>
          </div>
          <div className="text-[#c3c0ff] text-xs font-mono">© 2024 Utilify Web3 Hub</div>
        </div>
      </footer>
    </div>
  );
}

// --- EXPORT WELCOME BERSAMA WRAPPER WALLET PROVIDER ---
export default function Welcome() {
  const endpoint = useMemo(() => clusterApiUrl('devnet'), []);
  
  // Prioritaskan Phantom dengan konfigurasi khusus
  const wallets = useMemo(() => {
    const isPhantomInstalled = window?.solana?.isPhantom;
    console.log('Phantom installed:', isPhantomInstalled);
    
    const walletList = [];
    
    // Prioritaskan Phantom jika terinstall
    if (isPhantomInstalled) {
      walletList.push(new PhantomWalletAdapter({
        network: 'devnet',
      }));
    }
    
    // Tambahkan Solflare
    walletList.push(new SolflareWalletAdapter());
    
    // Fallback Phantom jika tidak terinstall
    if (!isPhantomInstalled) {
      walletList.push(new PhantomWalletAdapter({
        network: 'devnet',
      }));
    }
    
    return walletList;
  }, []);

  console.log('Wallet adapters:', wallets.map(w => w.name));

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect={true}
        onError={(error) => {
          console.error('Wallet Provider Error:', error);
          
          // Handle khusus untuk Phantom error
          if (error.message?.includes('Phantom') || error.message?.includes('already processing')) {
            console.log('Phantom error detected. Trying to recover...');
            
            // Coba reconnect dengan delay
            setTimeout(() => {
              if (window?.solana?.isPhantom) {
                window.solana.connect().catch(() => {});
              }
            }, 1000);
          }
        }}
      >
        <WalletModalProvider>
          <UtilifyApp />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}