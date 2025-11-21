// src/pages/ProductPage.jsx
import { useParams, Link } from 'react-router-dom';

const creators = [
  { id: 1, name: 'Luna', category: 'Fotos', price: 'R$24,90/mês', avatar: '👩‍🎤', description: 'Conteúdo exclusivo de fotos artísticas e sensuais.' },
  { id: 2, name: 'Kai', category: 'Vídeos', price: 'R$34,90/mês', avatar: '👨‍🎤', description: 'Vídeos premium e conteúdo audiovisual de alta qualidade.' },
  { id: 3, name: 'Zayn', category: 'Chat', price: 'R$19,90/mês', avatar: '🤎', description: 'Chat privado e interação direta.' },
  { id: 4, name: 'Aria', category: 'Lives', price: 'R$29,90/mês', avatar: '🌈', description: 'Lives exclusivas e transmissões ao vivo.' },
];

export default function ProductPage() {
  const { id } = useParams();
  const creator = creators.find(c => c.id === parseInt(id));

  if (!creator) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Criador não encontrado</h2>
          <Link to="/" className="text-purple-400 hover:underline">Voltar para a página inicial</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-4 border-b border-gray-800">
        <Link to="/" className="text-purple-400 hover:underline">← Voltar</Link>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-xl p-8 shadow-xl">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="text-6xl mb-4">{creator.avatar}</div>
            <h1 className="text-3xl font-bold mb-2">{creator.name}</h1>
            <p className="text-gray-400 mb-1">{creator.category}</p>
            <p className="text-2xl text-purple-400 font-semibold">{creator.price}</p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Sobre</h2>
            <p className="text-gray-300">{creator.description}</p>
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

          <button className="w-full bg-purple-600 hover:bg-purple-700 py-4 rounded-lg font-semibold text-lg transition duration-200">
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
