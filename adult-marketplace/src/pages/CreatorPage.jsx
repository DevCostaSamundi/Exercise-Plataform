// src/pages/CreatorPage.jsx
import { useParams, useNavigate } from 'react-router-dom';

export default function CreatorPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Simulando dados do criador
  const creator = {
    id,
    name: 'Luna',
    bio: 'Artista multidisciplinar, criando conteúdo autêntico e sensual com foco em empoderamento.',
    price: 'R$24,90/mês',
    avatar: '👩‍🎤',
    cover: 'https://placehold.co/600x300/333/888?text=Capa+Privada',
  };

  const handleSubscribe = () => {
    // Aqui você integraria PIX ou outro gateway
    alert('Integração com PIX virá aqui! (MVP)');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="relative">
        <img
          src={creator.cover}
          alt="capa"
          className="w-full h-48 object-cover opacity-60"
        />
        <div className="absolute bottom-4 left-4 flex items-end">
          <div className="text-4xl mr-3">{creator.avatar}</div>
          <div>
            <h1 className="text-2xl font-bold">{creator.name}</h1>
            <p className="text-gray-300">{creator.price}</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <p className="text-gray-300 mb-6">{creator.bio}</p>

        <div className="bg-gray-800 rounded-xl p-4 mb-6">
          <h3 className="font-semibold mb-2">Conteúdo exclusivo inclui:</h3>
          <ul className="text-sm text-gray-400 list-disc pl-5 space-y-1">
            <li>Fotos semanais</li>
            <li>Vídeos curtos (1–5 min)</li>
            <li>Chat direto (respostas em até 24h)</li>
            <li>Polls e pedidos personalizados</li>
          </ul>
        </div>

        <button
          onClick={handleSubscribe}
          className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-bold transition mb-4"
        >
          Assinar por {creator.price}
        </button>

        <button
          onClick={() => navigate(-1)}
          className="w-full py-2 text-gray-400 border border-gray-700 rounded-lg"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}