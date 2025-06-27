"use client";

import styles from '../styles/TokenSelector.module.css';

type TokenSelectorProps = {
  selectedType: string;
  onSelectType: (type: "legacy" | "nft") => void;
};

const TOKEN_TYPES = [
  { id: 'legacy', name: 'Coin' },
  { id: 'nft', name: 'NFT' },
];

export function TokenSelector({ selectedType, onSelectType }: TokenSelectorProps) {
  return (
    <div className={styles.selectorContainer}>
      {TOKEN_TYPES.map((type) => (
        <button
          key={type.id}
          className={`${styles.selectorButton} ${selectedType === type.id ? styles.active : ''}`}
          onClick={() => onSelectType(type.id as "legacy" | "nft")}
        >
          {type.name}
        </button>
      ))}
    </div>
  );
} 