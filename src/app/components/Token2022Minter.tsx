"use client";

import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createMintToInstruction,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  getMintLen,
  ExtensionType,
  createInitializeMetadataPointerInstruction,
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
import {
  createUpdateFieldInstruction,
  pack,
} from "@solana/spl-token-metadata";
import { WalletContextState } from "@solana/wallet-adapter-react";

type MinterProps = {
  connection: Connection;
  publicKey: PublicKey | null;
  sendTransaction: WalletContextState['sendTransaction'];
  tokenName: string;
  tokenSymbol: string;
  tokenUri: string;
  tokenDecimals: number;
  tokenAmount: number;
  onStateChange: (status: string, signature?: string) => void;
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
  onStateChange,
}: MinterProps) {
  const handleCreateToken = useCallback(async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet.");
      return;
    }

    onStateChange("creating");

    try {
      console.log("Creating token...");
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
          space: mintLen + metadataLen,
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
        createUpdateFieldInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          metadata: mint.publicKey,
          updateAuthority: publicKey,
          field: "name",
          value: tokenName,
        }),
        createUpdateFieldInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          metadata: mint.publicKey,
          updateAuthority: publicKey,
          field: "symbol",
          value: tokenSymbol,
        }),
        createUpdateFieldInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          metadata: mint.publicKey,
          updateAuthority: publicKey,
          field: "uri",
          value: tokenUri,
        })
      );

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
  }, [publicKey, connection, sendTransaction, tokenAmount, tokenDecimals, tokenName, tokenSymbol, tokenUri, onStateChange]);
  
  return (
    <button
      className={styles.submitButton}
      onClick={handleCreateToken}
    >
      Create Token
    </button>
  );
} 