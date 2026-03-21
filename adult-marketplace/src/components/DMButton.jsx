import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function DMButton({ creatorId }) {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [allowed,   setAllowed]  = useState(false);
  const [message,   setMessage]  = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const cfg = await api.get(`/api/v1/creators/${creatorId}/chat-config`);
        if (!mounted) return;

        if (cfg.dmPolicy === 'none') {
          setAllowed(false);
          setMessage('Esta criadora não aceita DMs.');
          return;
        }

        if (cfg.dmPolicy === 'any') {
          setAllowed(true);
          return;
        }

        if (!user) {
          setAllowed(false);
          setMessage(
            cfg.dmPolicy === 'subscribers'
              ? 'Somente assinantes Premium'
              : 'Dá um tip para desbloquear o chat'
          );
          return;
        }

        if (cfg.dmPolicy === 'subscribers') {
          const res = await api.get(
            `/api/v1/users/${user.id}/subscription-status?creatorId=${creatorId}`
          );
          if (res?.isSubscriber) setAllowed(true);
          else {
            setAllowed(false);
            setMessage('Esta criadora só aceita mensagens de assinantes Premium');
          }
          return;
        }

        if (cfg.dmPolicy === 'tippers') {
          const r = await api.get(
            `/api/v1/users/${user.id}/has-tipped?creatorId=${creatorId}`
          );
          if (r?.hasTipped) setAllowed(true);
          else {
            setAllowed(false);
            setMessage('Dá um tip para desbloquear o chat');
          }
        }
      } catch (err) {
        console.error('DMButton load error:', err);
      }
    }

    load();
    return () => { mounted = false; };
  }, [creatorId, user]);

  const openChat = async () => {
    if (!allowed) return;
    try {
      const { chatId } = await api.post('/api/v1/chats', { creatorId });
      // ⚠️  CORRIGIDO: useNavigate em vez de window.location.href
      // Evita reload completo da app e perda de estado
      navigate(`/messages?chatId=${chatId}`);
    } catch (err) {
      console.error('DMButton openChat error:', err);
    }
  };

  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        allowed
          ? 'bg-black text-white hover:bg-gray-900'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
      }`}
      onClick={openChat}
      disabled={!allowed}
      title={!allowed ? message : 'Enviar mensagem'}
    >
      Enviar mensagem
    </button>
  );
}