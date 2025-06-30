"use client";

import {
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SendTransactionError,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { useCallback } from "react";
import toast from "react-hot-toast";
import styles from "../styles/Page.module.css";
import { WalletContextState } from "@solana/wallet-adapter-react";

type MinterProps = {
  connection: Connection;
  publicKey: PublicKey | null;
  sendTransaction: WalletContextState['sendTransaction'];
  tokenDecimals: number;
  tokenAmount: number;
  onStateChange: (status: string, signature?: string) => void;
};

export function LegacySplMinter({
  connection,
  publicKey,
  sendTransaction,
  tokenAmount,
  tokenDecimals,
  onStateChange,
}: MinterProps) {
  const handleCreateToken = useCallback(async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet.");
      return;
    }

    onStateChange("creating");

    try {
      const mint = Keypair.generate();
      const lamports = await connection.getMinimumBalanceForRentExemption(82);

      const transaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mint.publicKey,
          space: 82,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(
          mint.publicKey,
          tokenDecimals,
          publicKey,
          null,
          TOKEN_PROGRAM_ID
        )
      );

      const associatedTokenAddress = await getAssociatedTokenAddress(
        mint.publicKey,
        publicKey
      );

      transaction.add(
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
      
      try {
        const { blockhash } = await connection.getLatestBlockhash();
        const feeTx = new Transaction({
          feePayer: publicKey,
          recentBlockhash: blockhash,
        }).add(...transaction.instructions);
        
        const fee = (await connection.getFeeForMessage(feeTx.compileMessage(), 'confirmed')).value;
        if (fee) {
          console.log(`Estimated transaction fee: ${fee / LAMPORTS_PER_SOL} SOL`);
        }
      } catch (e) {
        console.error("Could not estimate transaction fee:", e);
      }

      onStateChange("waiting");
      toast("Waiting for wallet approval...", { icon: '⏳' });

      const {
        context: { slot: minContextSlot },
        value: { blockhash, lastValidBlockHeight },
      } = await connection.getLatestBlockhashAndContext();
      
      const signature = await sendTransaction(transaction, connection, {
        minContextSlot,
        signers: [mint],
      });

      onStateChange("confirming", signature);
      toast.success('Transaction sent! Confirming...', { id: signature });

      await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature,
      });

      toast.success("Token created successfully!", { id: signature });
      onStateChange("success", signature);
    } catch (error) {
      if (error instanceof SendTransactionError) {
        toast.error(`Transaction failed: ${error.message}`);
      } else {
        toast.error("An unknown error occurred.");
      }
      console.error(error);
      onStateChange("error");
    }
  }, [publicKey, connection, sendTransaction, tokenAmount, tokenDecimals, onStateChange]);

  return (
    <button
      className={styles.submitButton}
      onClick={handleCreateToken}
    >
      Create Token
    </button>
  );
} 