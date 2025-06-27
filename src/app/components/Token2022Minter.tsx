"use client";

import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createMintToInstruction,
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
import {
  createInitializeMintInstruction,
  getMintLen,
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMetadataPointerInstruction,
  getMetadataPointerState,
  getTokenMetadata,
} from "@solana/spl-token";
import {
  createInitializeInstruction,
  createUpdateFieldInstruction,
  pack,
} from "@solana/spl-token-metadata";

type MinterProps = {
  connection: Connection;
  publicKey: PublicKey | null;
  sendTransaction: any;
  tokenName: string;
  tokenSymbol: string;
  tokenUri: string;
  tokenDecimals: number;
  tokenAmount: number;
};

/**
 * Minter component to create and mint SPL tokens.
 * @param {MinterProps} props The properties for the Minter component.
 * @returns {JSX.Element} The Minter component.
 */
export function Token2022Minter({
  connection,
  publicKey,
  sendTransaction,
  tokenName,
  tokenSymbol,
  tokenUri,
  tokenAmount,
  tokenDecimals,
}: MinterProps) {
  const [status, setStatus] = useState("idle"); // 'idle', 'creating', 'waiting', 'confirming', 'success', 'error'
  const [signature, setSignature] = useState("");

  /**
   * Handles the creation of the token.
   */
  const handleCreateToken = useCallback(async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet.");
      return;
    }

    setStatus("creating");
    setSignature("");

    try {
      const mint = Keypair.generate();
      
      const extensions = [ExtensionType.MetadataPointer];
      const mintLen = getMintLen(extensions);
      const metadata = {
        mint: mint.publicKey,
        name: tokenName,
        symbol: tokenSymbol,
        uri: tokenUri,
        additionalMetadata: [],
      };
      const metadataLen = pack(metadata).length;
      const lamports = await connection.getMinimumBalanceForRentExemption(
        mintLen + metadataLen
      );

      const transaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mint.publicKey,
          space: mintLen,
          lamports,
          programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeMetadataPointerInstruction(
          mint.publicKey,
          publicKey,
          mint.publicKey,
          TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMintInstruction(
          mint.publicKey,
          tokenDecimals,
          publicKey,
          null, // freeze authority
          TOKEN_2022_PROGRAM_ID
        ),
        createInitializeInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          metadata: mint.publicKey,
          updateAuthority: publicKey,
          mint: mint.publicKey,
          mintAuthority: publicKey,
          name: tokenName,
          symbol: tokenSymbol,
          uri: tokenUri,
        }),
      );

      // Add mint to instruction for associated token account
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mint.publicKey,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      transaction.add(
        createAssociatedTokenAccountInstruction(
            publicKey,
            associatedTokenAddress,
            publicKey,
            mint.publicKey,
            TOKEN_2022_PROGRAM_ID
        ),
        createMintToInstruction(
            mint.publicKey,
            associatedTokenAddress,
            publicKey,
            tokenAmount * 10 ** tokenDecimals,
            [],
            TOKEN_2022_PROGRAM_ID
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
  }, [publicKey, connection, sendTransaction, tokenAmount, tokenDecimals, tokenName, tokenSymbol, tokenUri]);
  
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