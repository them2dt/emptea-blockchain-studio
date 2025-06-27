"use client";

import {
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SendTransactionError,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import styles from "../styles/Page.module.css";

type MinterProps = {
  connection: Connection;
  publicKey: PublicKey | null;
  sendTransaction: any;
  tokenDecimals: number;
  tokenAmount: number;
};

export function LegacySplMinter({
  connection,
  publicKey,
  sendTransaction,
  tokenAmount,
  tokenDecimals,
}: MinterProps) {
  const [status, setStatus] = useState("idle");
  const [signature, setSignature] = useState("");

  const handleCreateToken = useCallback(async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet.");
      return;
    }

    setStatus("creating");
    setSignature("");

    try {
      const mint = Keypair.generate();
      const lamports = await getMinimumBalanceForRentExemptMint(connection);
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mint.publicKey,
        publicKey
      );

      const transaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mint.publicKey,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(
          mint.publicKey,
          tokenDecimals,
          publicKey,
          publicKey,
          TOKEN_PROGRAM_ID
        ),
        createAssociatedTokenAccountInstruction(
          publicKey,
          associatedTokenAddress,
          publicKey,
          mint.publicKey
        ),
        createMintToInstruction(
          mint.publicKey,
          associatedTokenAddress,
          publicKey,
          tokenAmount * 10 ** tokenDecimals
        )
      );

      setStatus("waiting");
      toast("Waiting for wallet approval...", { icon: '⏳' });

      const {
        context: { slot: minContextSlot },
        value: { blockhash, lastValidBlockHeight },
      } = await connection.getLatestBlockhashAndContext();
      
      const signature = await sendTransaction(transaction, connection, {
        minContextSlot,
        signers: [mint],
      });

      setSignature(signature);
      setStatus("confirming");
      toast.success('Transaction sent! Confirming...', { id: signature });

      await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature,
      });

      toast.success("Token created successfully!", { id: signature });
      setStatus("success");
    } catch (error) {
      if (error instanceof SendTransactionError) {
        toast.error(`Transaction failed: ${error.message}`);
      } else {
        toast.error("An unknown error occurred.");
      }
      console.error(error);
      setStatus("error");
    }
  }, [publicKey, connection, sendTransaction, tokenAmount, tokenDecimals]);

  const getButtonText = () => {
    switch (status) {
        case "creating": return "Preparing...";
        case "waiting": return "Waiting for Approval...";
        case "confirming": return "Confirming...";
        case "success": return "Create Another Token";
        default: return "Create Token";
    }
  };

  return (
    <>
      <button
        className={styles.submitButton}
        onClick={handleCreateToken}
        disabled={status === "creating" || status === "waiting" || status === "confirming"}
      >
        {getButtonText()}
      </button>
      
      {signature && (
        <div className={styles.statusContainer}>
            <p>
                {status === "success" ? "Token created successfully!" : "Transaction sent! Waiting for confirmation..."}
            </p>
            <a
                href={`https://solscan.io/tx/${signature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.explorerLink}
            >
                View on Solscan
            </a>
        </div>
      )}

      {status === 'error' && (
        <div className={styles.statusContainer}>
            <p>Something went wrong. Please check the console and try again.</p>
        </div>
      )}
    </>
  );
} 