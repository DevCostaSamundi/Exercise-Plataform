// hooks/usePaymentStatus.js

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export const usePaymentStatus = (paymentId) => {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!paymentId) return;

    const checkStatus = async () => {
      try {
        const res = await axios.get(`/api/v1/payments/${paymentId}/status`);
        const paymentData = res.data.data;
        
        setPayment(paymentData);
        setLoading(false);

        // ⭐ Se completou ou expirou, parar polling
        if (['COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED'].includes(paymentData.status)) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    // Checar imediatamente
    checkStatus();

    // ⭐ Polling a cada 5 segundos
    intervalRef.current = setInterval(checkStatus, 5000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [paymentId]);

  return { payment, loading, error };
};