import React, { useEffect, useState } from 'react';
import { getSocket } from '../services/SocketService';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function LiveChatInput({ liveId }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [canSend, setCanSend] = useState(true);
  const [cooldown, setCooldown] = useState(0);
  const [liveConfig, setLiveConfig] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const cfg = await api.get(`/api/v1/lives/${liveId}/config`);
        setLiveConfig(cfg);
      } catch (err) {}
    }
    load();
  }, [liveId]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(prev => prev - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const trySend = async () => {
    if (!user && liveConfig?.requireAuthToChat) {
      alert('Faça login para enviar mensagens');
      return;
    }

    // check permissions locally too (server must enforce)
    if (liveConfig) {
      if (liveConfig.mode === 'premium-only') {
        // verify subscription
        const r = await api.get(`/api/v1/users/${user.id}/subscription-status?creatorId=${liveConfig.creatorId}`);
        if (!r.isSubscriber) {
          alert('Somente assinantes podem falar nesta live');
          return;
        }
      } else if (liveConfig.mode === 'tippers-only') {
        const r = await api.get(`/api/v1/users/${user.id}/has-tipped?creatorId=${liveConfig.creatorId}`);
        if (!r.hasTipped) {
          alert(`Apenas quem deu tip nos últimos ${liveConfig.tippersWindowMinutes} minutos pode falar`);
          return;
        }
      }
    }

    if (!canSend || cooldown > 0) {
      alert(`Aguarde ${cooldown} segundos (modo lento)`);
      return;
    }

    // send via socket
    const socket = getSocket();
    if (!socket) {
      alert('Sem conexão em tempo real');
      return;
    }

    socket.emit('live:message', { liveId, type: 'text', content: text }, (err, savedMessage) => {
      if (err) {
        alert('Erro ao enviar mensagem');
      } else {
        setText('');
        if (liveConfig?.slowModeSeconds) {
          setCooldown(liveConfig.slowModeSeconds);
        }
      }
    });
  };

  const sendTip = async (amount) => {
    if (!user) {
      alert('Faça login para enviar tips');
      return;
    }

    // In production, this would open a payment modal
    // For now, we stub the payment as successful
    const socket = getSocket();
    if (!socket) {
      alert('Sem conexão em tempo real');
      return;
    }

    // TODO: Replace with proper modal component for better UX
    // This is a stub for MVP - payment integration pending
    const confirmTip = confirm(`Enviar tip de $${amount}? (STUB - sem pagamento real)`);
    if (!confirmTip) return;

    socket.emit('tip:send', { liveId, amount, content: text || `Tip de $${amount}` }, (err, savedMessage) => {
      if (err) {
        alert('Erro ao enviar tip');
      } else {
        alert(`Tip de $${amount} enviado com sucesso!`);
        setText('');
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        <input className="flex-1 p-2 rounded" value={text} onChange={e=>setText(e.target.value)} placeholder="Escreva algo..." />
        <button className="bg-indigo-600 text-white px-4 py-2 rounded" onClick={trySend}>Enviar</button>
      </div>
      <div className="flex space-x-2">
        <button 
          className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
          onClick={() => sendTip(10)}
        >
          💰 Tip $10
        </button>
      </div>
    </div>
  );
}