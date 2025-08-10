'use client';

import { motion } from 'framer-motion';

export default function LoadingSpinner() {
  return (
    <div className="loading-spinner-container">
      <motion.div
        className="loading-spinner"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <motion.p
        className="loading-text"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        Loading...
      </motion.p>
    </div>
  );
}
