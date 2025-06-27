'use client';
import { motion } from 'framer-motion';
import styles from '../styles/Loader.module.css';

const Loader = () => {
  const text = "EMPTEA STUDIOS";
  const letters = Array.from(text);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, damping: 12, stiffness: 100 },
    },
  };

  return (
    <motion.div
      className={styles.loaderContainer}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeOut' } }}
    >
      <motion.h1
        className={styles.loaderText}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {letters.map((letter, index) => (
          <motion.span key={index} variants={letterVariants}>
            {letter === " " ? "\u00A0" : letter}
          </motion.span>
        ))}
      </motion.h1>
    </motion.div>
  );
};

export default Loader;
