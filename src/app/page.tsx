"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState, useCallback } from "react";
import { Toaster } from "react-hot-toast";
import styles from "./styles/Page.module.css";
import Loader from "./components/Loader";
import { motion, AnimatePresence } from "framer-motion";
import { TokenSelector } from "./components/TokenSelector";
import { LegacySplMinter } from "./components/LegacySplMinter";
import { StatusModal } from "./components/StatusModal";
import { NftMinter } from "./components/NftMinter";

export default function Home() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenUri, setTokenUri] = useState("");
  const [tokenDecimals, setTokenDecimals] = useState('9');
  const [tokenAmount, setTokenAmount] = useState('1000');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTokenType, setSelectedTokenType] = useState<"legacy" | "nft">("legacy");
  const [isClient, setIsClient] = useState(false);

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
    setIsClient(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const sharedMinterProps = {
    connection,
    publicKey,
    sendTransaction,
    onStateChange: handleStateChange,
  };

  return (
    <>
      <AnimatePresence>
        {isLoading && <Loader />}
      </AnimatePresence>

      <div className={styles.walletButtonContainer}>
        {isClient && <WalletMultiButton />}
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
            <AnimatePresence mode="wait">
              {selectedTokenType === "nft" && (
                <motion.div
                  key="nft-inputs"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <input
                    type="text"
                    placeholder="Metadata URI (e.g., https://...)"
                    className={styles.inputField}
                    value={tokenUri}
                    onChange={(e) => setTokenUri(e.target.value)}
                    required
                  />
                </motion.div>
              )}

              {selectedTokenType === "legacy" && (
                <motion.div
                  key="legacy-inputs"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className={styles.legacyInputsContainer}
                >
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
                </motion.div>
              )}
            </AnimatePresence>

            <div className={styles.buttonContainer}>
              <AnimatePresence mode="wait">
                {selectedTokenType === "legacy" ? (
                  <motion.div
                    key="legacy-minter"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className={styles.minterContainer}
                  >
                    <LegacySplMinter
                      {...sharedMinterProps}
                      tokenAmount={Number(tokenAmount)}
                      tokenDecimals={Number(tokenDecimals)}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="nft-minter"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className={styles.minterContainer}
                  >
                    <NftMinter
                      {...sharedMinterProps}
                      tokenName={tokenName}
                      tokenSymbol={tokenSymbol}
                      tokenUri={tokenUri}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        
        <footer className={styles.footer}>
            <div className={styles.footerBottom}>
                <p>Emptea Blockchain Studio | © 2024 Emptea Studios</p>
            </div>
        </footer>
      </main>

      <Toaster />
    </>
  );
}
