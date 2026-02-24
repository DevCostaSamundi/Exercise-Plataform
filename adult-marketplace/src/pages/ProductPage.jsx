// src/pages/ProductPage.jsx

import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import creatorService from '../services/creatorService';

export default function ProductPage() {
  const { id } = useParams();
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCreator() {
      setLoading(true);
      setError(null);
      try {
        const response = await creatorService.getCreatorProfile(id);
        setCreator(response.data);
      } catch (err) {
        setError('Criador não encontrado');
      } finally {
        setLoading(false);
      }
    }
    fetchCreator();
  }, [id]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Carregando criador...</p>
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{error || 'Criador não encontrado'}</h2>
          <Link to="/" className="text-black hover:underline">Voltar para a página inicial</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-4 border-b border-gray-800">
        <Link to="/" className="text-black hover:underline">← Voltar</Link>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-xl p-8 shadow-xl">
          <div className="flex flex-col items-center text-center mb-6">
            <img
              src={creator.avatar || '/default-avatar.png'}
              alt={creator.displayName || creator.name}
              className="w-24 h-24 rounded-full object-cover mb-4"
            />
            <h1 className="text-3xl font-bold mb-2">{creator.displayName || creator.name}</h1>
            <p className="text-gray-400 mb-1">{creator.category || creator.categories?.[0]?.name || 'Criador'}</p>
            <p className="text-2xl text-black font-semibold">
              {creator.subscriptionPrice ? `$${Number(creator.subscriptionPrice).toFixed(2)}/mês` : 'Preço não informado'}
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Sobre</h2>
            <p className="text-gray-300">{creator.bio || creator.description || 'Sem descrição.'}</p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">O que está incluído:</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>Acesso a todo o conteúdo exclusivo</li>
              <li>Atualizações regulares</li>
              <li>Suporte direto ao criador</li>
              <li>Conteúdo em alta qualidade</li>
            </ul>
          </div>

          <button className="w-full bg-black hover:bg-black py-4 rounded-lg font-semibold text-lg transition duration-200">
            Assinar Agora
          </button>

          <p className="text-gray-500 text-sm text-center mt-4">
            Pagamento seguro e discreto. Cancele a qualquer momento.
          </p>
        </div>
      </main>
    </div>
  );
}
