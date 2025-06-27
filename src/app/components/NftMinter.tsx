"use client";

import { useCallback } from "react";
import toast from "react-hot-toast";
import styles from "../styles/Page.module.css";
import { Connection, Keypair, PublicKey, SendTransactionError, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createMintToInstruction,
  createInitializeMintInstruction,
  TOKEN_PROGRAM_ID,
  createSetAuthorityInstruction,
  AuthorityType,
} from "@solana/spl-token";
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplTokenMetadata, createMetadataAccountV3 } from '@metaplex-foundation/mpl-token-metadata';
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { useWallet } from "@solana/wallet-adapter-react";
import { some } from "@metaplex-foundation/umi";

type NftMinterProps = {
  connection: Connection;
  publicKey: PublicKey | null;
  sendTransaction: any;
  tokenName: string;
  tokenSymbol: string;
  tokenUri: string;
  onStateChange: (status: string, signature?: string) => void;
};

export function NftMinter({
  connection,
  publicKey,
  sendTransaction,
  tokenName,
  tokenSymbol,
  tokenUri,
  onStateChange,
}: NftMinterProps) {
  const wallet = useWallet();

  const handleCreateNft = useCallback(async () => {
    if (!publicKey || !wallet) {
      toast.error("Please connect your wallet.");
      return;
    }
    if (!tokenName || !tokenSymbol || !tokenUri) {
      toast.error("Please fill out all fields.");
      return;
    }
    onStateChange("creating");

    try {
      const mint = Keypair.generate();
      const umi = createUmi(connection.rpcEndpoint)
        .use(mplTokenMetadata())
        .use(walletAdapterIdentity(wallet));
        
      const metadataIx = createMetadataAccountV3(
        umi,
        {
          mint: fromWeb3JsPublicKey(mint.publicKey),
          mintAuthority: umi.identity,
          payer: umi.identity,
          updateAuthority: fromWeb3JsPublicKey(publicKey),
          data: {
            name: tokenName,
            symbol: tokenSymbol,
            uri: tokenUri,
            sellerFeeBasisPoints: 0,
            creators: some([{ address: fromWeb3JsPublicKey(publicKey), verified: true, share: 100 }]),
            collection: null,
            uses: null,
          },
          isMutable: true,
          collectionDetails: null,
        }
      ).getInstructions();

      const web3jsInstructions = metadataIx.map(ix => new TransactionInstruction({
        keys: ix.keys.map(key => ({
            pubkey: new PublicKey(key.pubkey),
            isSigner: key.isSigner,
            isWritable: key.isWritable,
        })),
        programId: new PublicKey(ix.programId),
        data: Buffer.from(ix.data),
      }));

      const associatedTokenAddress = await getAssociatedTokenAddress(mint.publicKey, publicKey);
      const transaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mint.publicKey,
          space: 82,
          lamports: await connection.getMinimumBalanceForRentExemption(82),
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(mint.publicKey, 0, publicKey, publicKey, TOKEN_PROGRAM_ID),
        createAssociatedTokenAccountInstruction(publicKey, associatedTokenAddress, publicKey, mint.publicKey),
        createMintToInstruction(mint.publicKey, associatedTokenAddress, publicKey, 1),
        ...web3jsInstructions,
        createSetAuthorityInstruction(mint.publicKey, publicKey, AuthorityType.MintTokens, null)
      );

      onStateChange("waiting");
      
      const signature = await sendTransaction(transaction, connection, {
        signers: [mint],
      });

      onStateChange("confirming", signature);
      
      await connection.confirmTransaction(signature);

      onStateChange("success", signature);

    } catch (error) {
      console.error(error);
      onStateChange("error");
    }
  }, [publicKey, wallet, connection, sendTransaction, tokenName, tokenSymbol, tokenUri, onStateChange]);

  return (
    <button
      className={styles.submitButton}
      onClick={handleCreateNft}
      disabled={!tokenName || !tokenSymbol || !tokenUri}
    >
      Create NFT
    </button>
  );
} 