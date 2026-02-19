/**
 * FadeIn Component
 * Wrapper para animar entrada de elementos
 */
import { motion } from 'framer-motion';

const FadeIn = ({ 
  children, 
  delay = 0,
  duration = 0.3,
  className = '' 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1] // Custom easing
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default FadeIn;
