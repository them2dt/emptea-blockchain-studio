"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState, useCallback } from "react";
import { Toaster } from "react-hot-toast";
import styles from "./styles/Page.module.css";
import { LoadingScreen } from "./components/LoadingScreen";
import { TokenSelector } from "./components/TokenSelector";
import { Token2022Minter } from "./components/Token2022Minter";
import { LegacySplMinter } from "./components/LegacySplMinter";
import { StatusModal } from "./components/StatusModal";

export default function Home() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenUri, setTokenUri] = useState("");
  const [tokenDecimals, setTokenDecimals] = useState('9');
  const [tokenAmount, setTokenAmount] = useState('1000');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTokenType, setSelectedTokenType] = useState("spl-20");

  // State for the transaction modal
  const [txState, setTxState] = useState({
    status: 'idle', // 'idle', 'creating', 'waiting', 'confirming', 'success', 'error'
    signature: ''
  });

  const handleStateChange = useCallback((status: string, signature?: string) => {
    setTxState({ status, signature: signature || txState.signature });
  }, [txState.signature]);

  const closeModal = () => {
    setTxState({ status: 'idle', signature: ''});
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const sharedMinterProps = {
    connection,
    publicKey,
    sendTransaction,
    tokenAmount: Number(tokenAmount),
    tokenDecimals: Number(tokenDecimals),
    onStateChange: handleStateChange,
  };

  return (
    <>
      <div className={styles.walletButtonContainer}>
        <WalletMultiButton />
      </div>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>
            <span>Solana</span> Token Creator
          </h1>
          <p className={styles.heroSubtitle}>
            Easily create and launch your own SPL token on the Solana network.
          </p>
        </div>

        <TokenSelector
          selectedType={selectedTokenType}
          onSelectType={setSelectedTokenType}
        />

        <StatusModal 
          status={txState.status}
          signature={txState.signature}
          onClose={closeModal}
        />

        <div className={styles.card}>
          <div className={styles.contactForm}>
            <input
              type="text"
              placeholder="Token Name (e.g., Emptea Coin)"
              className={styles.inputField}
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Token Symbol (e.g., MPT)"
              className={styles.inputField}
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
            />
            {selectedTokenType === "spl-22" && (
              <input
                type="text"
                placeholder="Token Metadata URI (e.g., https://...)"
                className={styles.inputField}
                value={tokenUri}
                onChange={(e) => setTokenUri(e.target.value)}
              />
            )}
            <input
              type="number"
              placeholder="Decimals"
              className={styles.inputField}
              value={tokenDecimals}
              onChange={(e) => setTokenDecimals(e.target.value)}
            />
            <input
              type="number"
              placeholder="Amount to Mint"
              className={styles.inputField}
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
            />

            <div className={styles.buttonContainer}>
              {selectedTokenType === "spl-22" ? (
                <Token2022Minter
                  {...sharedMinterProps}
                  tokenName={tokenName}
                  tokenSymbol={tokenSymbol}
                  tokenUri={tokenUri}
                />
              ) : (
                <LegacySplMinter {...sharedMinterProps} />
              )}
            </div>
          </div>
        </div>
        
        <footer className={styles.footer}>
            <div className={styles.footerBottom}>
                <p>Powered by Solana | © 2024 Emptea Blockchain Studio</p>
            </div>
        </footer>
      </main>

      <Toaster />
    </>
  );
}
