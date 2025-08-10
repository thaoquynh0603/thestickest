'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  // Different transition variants for different page types
  const pageVariants = {
    initial: { 
      opacity: 0, 
      y: 20,
      scale: 0.98
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1
    },
    exit: { 
      opacity: 0, 
      y: -20,
      scale: 0.98
    }
  };

  const pageTransition = {
    type: 'tween' as const,
    ease: [0.4, 0.0, 0.2, 1] as const, // Custom easing for smooth feel
    duration: 0.3
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        className="page-transition-wrapper"
      >
        <div className="page-content">
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
