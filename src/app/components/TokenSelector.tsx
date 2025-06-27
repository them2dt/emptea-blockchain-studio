"use client";

import styles from '../styles/Page.module.css';

const TOKEN_TYPES = [
  { id: 'spl-20', name: 'SPL-20' },
  { id: 'spl-22', name: 'SPL-22' },
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