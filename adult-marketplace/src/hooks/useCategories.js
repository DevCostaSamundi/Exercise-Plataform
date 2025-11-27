import { useState, useEffect } from 'react';
import categoriesAPI from '../services/categoriesAPI';

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await categoriesAPI.getAll();
        setCategories(response.data?.data || response.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Erro ao buscar categorias');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};
