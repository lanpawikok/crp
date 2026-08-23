import React, { useMemo, useCallback } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

import '@solana/wallet-adapter-react-ui/styles.css';

export default function WalletContextProvider({ children }) {
  const endpoint = useMemo(() => clusterApiUrl('devnet'), []);

  // Menggunakan Wallet Standard API
  const wallets = useMemo(() => [], []);

  // Menangkap error koneksi agar tidak melempar exception mentah di konsol
  const onError = useCallback((error) => {
    if (error.name === 'WalletConnectionError') {
      console.warn('Koneksi wallet dibatalkan atau gagal merespons:', error.message);
    } else {
      console.error('Error Wallet Lainnya:', error);
    }
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect={false}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}