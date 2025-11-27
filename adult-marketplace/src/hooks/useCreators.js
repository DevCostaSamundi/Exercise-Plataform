import { useState, useEffect } from 'react';
import creatorsAPI from '../services/creatorsAPI';

export const useCreators = (options = {}) => {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const fetchCreators = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await creatorsAPI.getAll({
        ...options,
        ...params,
      });

      const data = response.data;
      setCreators(data.data?.items || data.items || []);
      setPagination(data.data?.pagination || data.pagination || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao buscar creators');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.page, options.category, options.search]);

  return {
    creators,
    loading,
    error,
    pagination,
    refetch: fetchCreators,
  };
};
