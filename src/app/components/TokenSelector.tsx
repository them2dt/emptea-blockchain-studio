"use client";

import styles from '../styles/Page.module.css';

const TOKEN_TYPES = [
  { id: 'token-2022', name: 'Token-2022' },
  { id: 'legacy-spl', name: 'Legacy SPL' },
];

type TokenSelectorProps = {
  selectedType: string;
  onSelectType: (type: string) => void;
};

export function TokenSelector({ selectedType, onSelectType }: TokenSelectorProps) {
  return (
    <div className={styles.carouselContainer}>
      {TOKEN_TYPES.map((type) => (
        <button
          key={type.id}
          className={`${styles.carouselItem} ${selectedType === type.id ? styles.selected : ''}`}
          onClick={() => onSelectType(type.id)}
        >
          {type.name}
        </button>
      ))}
    </div>
  );
} 