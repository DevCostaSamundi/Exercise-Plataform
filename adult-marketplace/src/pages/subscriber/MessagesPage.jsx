import { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import { Link, useSearchParams } from 'react-router-dom';
import messageService from '../../services/messageService';
import { useMessageSocket } from '../../hooks/useMessageSocket';
import PPVMessageModal from '../../components/subscriber/PPVMessageModal';

export default function MessagesPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const conversationIdParam = searchParams.get('conversation');

  // Estados da API
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [showChat, setShowChat] = useState(false); // 👈 NOVO: controla mobile

  // Estado PPV
  const [showPPVModal, setShowPPVModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Ref para scroll automático
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ✅ Pegar user do localStorage (objeto completo)
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return {};
    }
  }, []);

  // ✅ Passar objeto user completo
  const {
    isConnected,
    newMessage,
    typingUsers,
    sendMessage: sendSocketMessage,
    startTyping,
    stopTyping,
    setNewMessage
  } = useMessageSocket(currentUser);

  // Log para debug
  useEffect(() => {
    console.log('📊 Current user:', currentUser);
    console.log('🔌 Socket connected:', isConnected);
  }, [currentUser, isConnected]);

  // Buscar conversas ao montar componente
  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages(selectedConversationId);
    }
  }, [selectedConversationId]);

  // Scroll automático para última mensagem
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Lidar com nova mensagem via WebSocket
  useEffect(() => {
    if (newMessage) {
      console.log('📨 New message received:', newMessage);

      // Verificar se é da conversa atual
      if (newMessage.conversationId === selectedConversationId) {
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
      }

      // Atualizar lista de conversas
      setConversations(prev => prev.map(conv =>
        conv.id === newMessage.conversationId
          ? {
            ...conv,
            lastMessage: {
              text: newMessage.content?.text || 'Mídia',
              timestamp: new Date(),
            },
            unreadCount: conv.id === selectedConversationId ? 0 : conv.unreadCount + 1,
          }
          : conv
      ));

      // Limpar a nova mensagem
      setNewMessage(null);
    }
  }, [newMessage, selectedConversationId, setNewMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Buscar conversas
  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await messageService.getConversations();
      console.log('📥 Conversations response:', response);

      setConversations(response.data || []);
      if (response.data && response.data.length > 0) {
        if (conversationIdParam) {
          const exists = response.data.find(c => c.id === conversationIdParam);
          if (exists) {
            setSelectedConversationId(conversationIdParam);
            setShowChat(true); // Mostrar chat se vier da URL
          } else {
            setSelectedConversationId(response.data[0].id);
          }
        } else {
          setSelectedConversationId(response.data[0].id);
          await fetchMessages(response.data[0].id);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar conversas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Buscar mensagens
  const fetchMessages = async (conversationId) => {
    try {
      const response = await messageService.getMessages(conversationId);
      console.log('📥 Messages response:', response);
      setMessages(response.data || []);
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
      setError(err.message);
    }
  };

  // Enviar mensagem
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageInput.trim() || !selectedConversationId) return;

    const selectedConv = conversations.find(c => c.id === selectedConversationId);
    if (!selectedConv) return;

    const content = {
      text: messageInput.trim(),
    };

    try {
      setSending(true);

      // ✅ Usar WebSocket se conectado
      if (isConnected) {
        console.log('📤 Sending via WebSocket');
        sendSocketMessage({
          conversationId: selectedConversationId,
          senderId: currentUser.id,
          recipientId: selectedConv.otherUser.id,
          content,
          type: 'text',
        });
      } else {
        // Fallback para HTTP
        console.log('📤 Sending via HTTP (fallback)');
        const response = await messageService.sendMessage(
          selectedConversationId,
          selectedConv.otherUser.id,
          content,
          'text'
        );

        setMessages(prev => [...prev, response.data]);
      }

      // Atualizar última mensagem da conversa
      setConversations(prev => prev.map(conv =>
        conv.id === selectedConversationId
          ? {
            ...conv,
            lastMessage: {
              text: messageInput.trim(),
              sender: { _id: currentUser.id },
              timestamp: new Date(),
            },
          }
          : conv
      ));

      setMessageInput('');
      scrollToBottom();
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      alert('Erro ao enviar mensagem:  ' + err.message);
    } finally {
      setSending(false);
    }
  };

  // Desbloquear mensagem paga
  const handleUnlockMessage = async (messageId, paymentData) => {
    try {
      await messageService.unlockPaidMessage(messageId, paymentData.paymentMethod);

      // Atualizar mensagem para desbloqueada
      setMessages(prev => prev.map(m =>
        m._id === messageId
          ? { ...m, isUnlocked: true }
          : m
      ));

      setShowPPVModal(false);
      setSelectedMessage(null);
    } catch (err) {
      console.error('Erro ao desbloquear mensagem:', err);
      alert('Erro ao desbloquear mensagem: ' + err.message);
    }
  };

  // Indicador de digitação
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    const selectedConv = conversations.find(c => c.id === selectedConversationId);
    if (!selectedConv) return;

    // Iniciar indicador de digitação
    startTyping(selectedConversationId, selectedConv.otherUser.id);

    // Parar após 3 segundos de inatividade
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(selectedConversationId, selectedConv.otherUser.id);
    }, 3000);
  };

  // 👈 NOVO: Selecionar conversa e mostrar chat no mobile
  const handleSelectConversation = (convId) => {
    setSelectedConversationId(convId);
    setShowChat(true);
  };

  // 👈 NOVO: Voltar para lista no mobile
  const handleBackToList = () => {
    setShowChat(false);
  };

  // Filtrar conversas por busca
  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;

    const s = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.otherUser.displayName?.toLowerCase().includes(s) ||
        c.otherUser.username?.toLowerCase().includes(s)
    );
  }, [conversations, search]);

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  // Formatar timestamp
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return `Há ${Math.floor(diffInHours * 60)} min`;
    } else if (diffInHours < 24) {
      return `Há ${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    }
  };

  const formatFullTime = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isYesterday) {
      return `Ontem, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Carregando mensagens...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                💬 Mensagens
              </h1>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-500 dark: text-slate-400">
              <span className="inline-flex items-center space-x-1">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span>{isConnected ? 'Online' : 'Offline'}</span>
              </span>
            </div>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 flex gap-4 overflow-hidden">
          {/* Lista de conversas - 👈 RESPONSIVO */}
          <section className={`w-full md:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col ${showChat ? 'hidden md:flex' : 'flex'
            }`}>
            {/* Busca */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar criador..."
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark: bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>

            {/* Conversas */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Nenhuma conversa ainda
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full text-left px-3 py-3 flex items-center space-x-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${conv.id === selectedConversationId ? 'bg-slate-100 dark:bg-slate-800/70' : ''
                      }`}
                  >
                    <img
                      src={conv.otherUser.avatar || `https://placehold.co/48x48`}
                      alt={conv.otherUser.displayName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {conv.otherUser.displayName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {conv.lastMessage?.text || 'Sem mensagens'}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </section>

          {/* Janela de chat - 👈 RESPONSIVO */}
          <section className={`flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col ${showChat ? 'flex' : 'hidden md:flex'
            }`}>
            {!selectedConversation ? (
              <div className="flex-1 flex flex-col items-center justify-center text-sm text-slate-500 p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-slate-600 dark:text-slate-400">Selecione uma conversa para começar</p>
              </div>
            ) : (
              <>
                {/* Header conversa - 👈 COM BOTÃO VOLTAR */}
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center space-x-3">
                    {/* Botão voltar (apenas mobile) */}
                    <button
                      onClick={handleBackToList}
                      className="md:hidden p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    </button>

                    <img
                      src={selectedConversation.otherUser.avatar || `https://placehold.co/48x48`}
                      alt={selectedConversation.otherUser.displayName}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {selectedConversation.otherUser.displayName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        @{selectedConversation.otherUser.username}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mensagens */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50 dark:bg-slate-950/40">
                  {messages.map((msg) => {
                    const isCurrentUser = msg.sender._id === currentUser.id;
                    const isPaid = msg.content.isPaid && !msg.isUnlocked;

                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 py-2 text-sm ${isCurrentUser
                              ? 'bg-indigo-600 text-white rounded-br-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm'
                            }`}
                        >
                          {isPaid ? (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2 sm:gap-3">
                              <div>
                                <p className="font-semibold text-xs sm:text-sm">🔒 Conteúdo Bloqueado</p>
                                <p className="text-xs">R$ {msg.content.price?.toFixed(2)}</p>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedMessage(msg);
                                  setShowPPVModal(true);
                                }}
                                className="bg-yellow-500 text-black px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap hover:bg-yellow-600 transition-colors"
                              >
                                Desbloquear
                              </button>
                            </div>
                          ) : (
                            <>
                              {msg.content.mediaUrl && msg.content.mediaUrl.length > 0 && (
                                <div className="mb-2">
                                  {msg.content.mediaUrl.map((url, idx) => (
                                    <img key={idx} src={url} alt="Mídia" className="rounded-lg max-w-full sm:max-w-sm" />
                                  ))}
                                </div>
                              )}
                              {msg.content.text && <p className="break-words whitespace-pre-wrap">{msg.content.text}</p>}
                              <p className="text-[10px] mt-1 opacity-70">
                                {formatFullTime(msg.createdAt)}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Indicador de digitação */}
                  {typingUsers[selectedConversationId] && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-slate-800 rounded-2xl px-4 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input - 👈 RESPONSIVO */}
                <form
                  onSubmit={handleSendMessage}
                  className="border-t border-slate-200 dark:border-slate-800 px-2 sm:px-3 py-2 flex items-center space-x-2"
                >
                  <input
                    type="text"
                    value={messageInput}
                    onChange={handleInputChange}
                    placeholder="Escreva uma mensagem..."
                    disabled={sending}
                    className="flex-1 text-sm px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  <button
                    type="submit"
                    disabled={!messageInput.trim() || sending}
                    className="px-3 sm:px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    <span className="hidden sm:inline">{sending ? 'Enviando...' : 'Enviar'}</span>
                    {/* Ícone enviar (apenas mobile) */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:hidden" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </form>
              </>
            )}
          </section>
        </main>
      </div>

      {/* Modal PPV */}
      {showPPVModal && selectedMessage && (
        <PPVMessageModal
          message={selectedMessage}
          creator={selectedConversation.otherUser}
          onClose={() => {
            setShowPPVModal(false);
            setSelectedMessage(null);
          }}
          onUnlock={handleUnlockMessage}
        />
      )}
    </div>
  );
}