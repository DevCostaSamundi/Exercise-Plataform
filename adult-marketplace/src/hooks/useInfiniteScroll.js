/**
 * Hook para implementar infinite scroll
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * @param {Function} callback - Função a ser chamada quando chegar no fim
 * @param {boolean} hasMore - Se há mais conteúdo para carregar
 * @param {boolean} loading - Se está carregando
 * @param {number} threshold - Distância do fim para disparar (0-1)
 */
export const useInfiniteScroll = (callback, hasMore, loading, threshold = 0.8) => {
  const observerRef = useRef(null);

  const lastElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            callback();
          }
        },
        { threshold }
      );

      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore, callback, threshold]
  );

  return lastElementRef;
};

export default useInfiniteScroll;