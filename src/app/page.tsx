"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { Minter } from "./components/minter";
import { Toaster } from "react-hot-toast";
import styles from "./styles/Page.module.css";
import Image from "next/image";
import { LoadingScreen } from "./components/LoadingScreen";

export default function Home() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenDecimals, setTokenDecimals] = useState('9');
  const [tokenAmount, setTokenAmount] = useState('1000');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // Show loading screen for 3 seconds

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div>
      <header className={styles.header}>
        <nav className={styles.navbar} style={{ justifyContent: 'flex-end' }}>
          <div className={styles.contactButton}>
            <WalletMultiButton />
          </div>
        </nav>
      </header>

      <main>
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>
            <span className={styles.highlight}>SPL Token</span> Creator
          </h1>
        </section>
        
        <section className={styles.contact}>
          <div className={styles.contactHeader}>
            <h2>Create a New Token</h2>
          </div>
          <div className={styles.contactForm}>
            <input
              type="text"
              placeholder="Token Name"
              className={styles.inputField}
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Token Symbol"
              className={styles.inputField}
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
            />
            <input
              type="number"
              placeholder="Token Decimals"
              className={styles.inputField}
              value={tokenDecimals}
              onChange={(e) => setTokenDecimals(e.target.value)}
            />
            <input
              type="number"
              placeholder="Token Amount"
              className={styles.inputField}
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
            />

            <Minter
              connection={connection}
              publicKey={publicKey}
              sendTransaction={sendTransaction}
              tokenAmount={parseInt(tokenAmount) || 0}
              tokenDecimals={parseInt(tokenDecimals) || 0}
              tokenName={tokenName}
              tokenSymbol={tokenSymbol}
            />
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerBottom} style={{ textAlign: 'center', width: '100%' }}>
            <p>Powered by Solana | © 2024 Emptea Studios</p>
        </div>
    </footer>

      <Toaster />
    </div>
  );
}
