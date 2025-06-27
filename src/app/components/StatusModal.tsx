"use client";

import styles from '../styles/StatusModal.module.css';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

type StatusModalProps = {
  status: string;
  signature: string;
  onClose: () => void;
};

const Step = ({ text, isCompleted, isActive, isError }: { text: string; isCompleted: boolean; isActive: boolean; isError: boolean }) => (
    <div className={styles.step}>
        <div className={styles.stepIcon}>
            {isCompleted ? <CheckCircle color="green" /> : isActive ? <div className={styles.spinner}></div> : isError ? <X color="red" /> : <div style={{width: 24, height: 24, borderRadius: '50%', border: '2px solid #ccc'}}></div>}
        </div>
        <span className={styles.stepText}>{text}</span>
    </div>
);

export function StatusModal({ status, signature, onClose }: StatusModalProps) {
  if (status === 'idle') {
    return null;
  }

  const steps = [
    { id: 'creating', text: 'Preparing Transaction' },
    { id: 'waiting', text: 'Awaiting Wallet Approval' },
    { id: 'confirming', text: 'Confirming Transaction' },
    { id: 'success', text: 'Token Created!' },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === status);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 style={{fontFamily: 'satoshi-bold', fontSize: '1.5rem', marginBottom: '2rem'}}>
          {status === 'success' ? 'Congratulations!' : status === 'error' ? 'An Error Occurred' : 'Creating Your Token'}
        </h2>
        
        {status !== 'error' ? (
          steps.map((step, index) => (
            <Step
              key={step.id}
              text={step.text}
              isActive={status === step.id}
              isCompleted={currentStepIndex > index || status === 'success'}
              isError={false}
            />
          ))
        ) : (
          <div className={styles.step}>
            <AlertCircle color="red" className={styles.stepIcon} />
            <span className={styles.stepText}>Something went wrong. Please check your wallet and try again.</span>
          </div>
        )}

        {signature && (
            <a href={`https://solscan.io/tx/${signature}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className={styles.explorerLink}>
                View on Solscan
            </a>
        )}
        
        {(status === 'success' || status === 'error') && (
            <button onClick={onClose} className={styles.closeButton}>
                Close
            </button>
        )}
      </div>
    </div>
  );
} 