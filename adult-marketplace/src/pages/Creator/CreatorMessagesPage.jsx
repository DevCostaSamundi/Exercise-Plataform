import { useState, useEffect, useMemo, useRef } from 'react';
import CreatorSidebar from '../../components/CreatorSidebar';
import { Link } from 'react-router-dom';
import messageService from '../../services/messageService';
import { useMessageSocket } from '../../hooks/useMessageSocket';
import PaymentModal from '../../components/PaymentModal';

export default function CreatorMessagesPage() {
  const [search, setSearch] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [showChat, setShowChat] = useState(false); // 👈 NOVO: controla mobile

  // Estados da API
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [lockedMessageId, setLockedMessageId] = useState(null);

  // Estados de upload
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Estados de PPV
  const [showPPVModal, setShowPPVModal] = useState(false);
  const [ppvPrice, setPpvPrice] = useState(10);

  // Ref para scroll automático
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // WebSocket
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return {};
    }
  }, []);

  const {
    isConnected,
    newMessage,
    typingUsers,
    sendMessage: sendSocketMessage,
    startTyping,
    stopTyping,
    setNewMessage
  } = useMessageSocket(currentUser);

  // Buscar conversas ao montar componente
  useEffect(() => {
    fetchConversations();
  }, []);

  // Buscar mensagens quando conversa é selecionada
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
      if (newMessage.conversationId === selectedConversationId) {
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
      }

      setConversations(prev => prev.map(conv =>
        conv.id === newMessage.conversationId
          ? {
            ...conv,
            lastMessage: {
              text: newMessage.content.text || 'Mídia',
              timestamp: new Date(),
            },
            unreadCount: conv.id === selectedConversationId ? 0 : conv.unreadCount + 1,
          }
          : conv
      ));

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
      setConversations(response.data || []);

      if (response.data && response.data.length > 0) {
        setSelectedConversationId(response.data[0].id);
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
      setMessages(response.data || []);
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
      setError(err.message);
    }
  };

  // Upload de arquivo
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    if (uploadedFiles.length + files.length > 5) {
      alert('Máximo 5 arquivos por mensagem');
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = files.map(file => messageService.uploadMedia(file));
      const results = await Promise.all(uploadPromises);

      const newFiles = results.map(r => r.data);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      alert('Erro ao fazer upload:  ' + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remover arquivo
  const handleRemoveFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Enviar mensagem normal
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if ((!messageInput.trim() && uploadedFiles.length === 0) || !selectedConversationId) return;

    const selectedConv = conversations.find(c => c.id === selectedConversationId);
    if (!selectedConv) return;

    const content = {
      text: messageInput.trim(),
      mediaUrl: uploadedFiles.map(f => f.url),
    };

    try {
      setSending(true);

      if (isConnected) {
        sendSocketMessage({
          conversationId: selectedConversationId,
          senderId: currentUser.id,
          recipientId: selectedConv.otherUser.id,
          content,
          type: uploadedFiles.length > 0 ? (uploadedFiles[0].type === 'video' ? 'video' : 'image') : 'text',
        });
      } else {
        const response = await messageService.sendMessage(
          selectedConversationId,
          selectedConv.otherUser.id,
          content,
          uploadedFiles.length > 0 ? (uploadedFiles[0].type === 'video' ? 'video' : 'image') : 'text'
        );

        setMessages(prev => [...prev, response.data]);
      }

      setConversations(prev => prev.map(conv =>
        conv.id === selectedConversationId
          ? {
            ...conv,
            lastMessage: {
              text: messageInput.trim() || 'Mídia',
              sender: { _id: currentUser.id },
              timestamp: new Date(),
            },
          }
          : conv
      ));

      setMessageInput('');
      setUploadedFiles([]);
      scrollToBottom();
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      alert('Erro ao enviar mensagem: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  // Enviar mensagem paga (PPV)
  const handleSendPPV = async () => {
    if (uploadedFiles.length === 0) {
      alert('Adicione mídia para criar conteúdo pago');
      return;
    }

    if (!ppvPrice || ppvPrice < 5 || ppvPrice > 500) {
      alert('Preço deve estar entre $ 5.00 e $ 500.00');
      return;
    }

    const selectedConv = conversations.find(c => c.id === selectedConversationId);
    if (!selectedConv) return;

    try {
      setSending(true);

      const response = await messageService.sendPaidMessage(
        selectedConversationId,
        selectedConv.otherUser.id,
        {
          text: messageInput.trim() || 'Conteúdo exclusivo 🔒',
          mediaUrl: uploadedFiles.map(f => f.url),
        },
        ppvPrice
      );

      setMessages(prev => [...prev, response.data]);

      setConversations(prev => prev.map(conv =>
        conv.id === selectedConversationId
          ? {
            ...conv,
            lastMessage: {
              text: `💰 Conteúdo pago - $ ${ppvPrice.toFixed(2)}`,
              sender: { _id: currentUser.id },
              timestamp: new Date(),
            },
          }
          : conv
      ));

      setMessageInput('');
      setUploadedFiles([]);
      setShowPPVModal(false);
      setPpvPrice(10);
      scrollToBottom();
    } catch (err) {
      console.error('Erro ao enviar mensagem paga:', err);
      alert('Erro ao enviar mensagem paga: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  // Indicador de digitação
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    const selectedConv = conversations.find(c => c.id === selectedConversationId);
    if (!selectedConv) return;

    startTyping(selectedConversationId, selectedConv.otherUser.id);

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
        <CreatorSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black dark:border-white border-t-transparent"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Carregando mensagens...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <CreatorSidebar />

      <div className="flex-1 flex flex-col">
        {/* Header topo */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link
                to="/creator/dashboard"
                className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 111.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                  Mensagens
                </h1>
                <p className="hidden sm:block text-sm text-slate-500 dark:text-slate-400">
                  Inbox com assinantes e fãs
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center space-x-1">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-slate-800' : 'bg-slate-900'}`} />
                <span>{isConnected ? 'Online' : 'Offline'}</span>
              </span>
              <span>•</span>
              <span>{conversations.length} conversa(s)</span>
            </div>
          </div>
        </header>

        {/* Conteúdo:  layout em 2 colunas - 👈 RESPONSIVO */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 flex gap-4 overflow-hidden">
          {/* Coluna esquerda: lista de conversas - 👈 RESPONSIVO */}
          <section className={`w-full md:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col ${showChat ? 'hidden md:flex' : 'flex'
            }`}>
            {/* Busca */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar assinante..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>
            </div>

            {/* Lista de conversas */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  {conversations.length === 0
                    ? 'Nenhuma conversa ainda. Aguarde mensagens de assinantes!'
                    : 'Nenhuma conversa encontrada. '}
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = conv.id === selectedConversationId;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={`w-full text-left px-3 py-3 flex items-center space-x-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${isSelected ? 'bg-slate-100 dark:bg-slate-800/70' : ''
                        }`}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={conv.otherUser.avatar || `https://placehold.co/48x48/8B7FE8/white?text=${conv.otherUser.displayName?.[0] || 'U'}`}
                          alt={conv.otherUser.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            e.target.src = `https://placehold.co/48x48/8B7FE8/white?text=${conv.otherUser.displayName?.[0] || 'U'}`;
                          }}
                        />
                        {conv.isVIP && (
                          <span className="absolute -bottom-1 -right-1 bg-slate-600 text-[10px] px-1 rounded-full text-black font-bold border border-slate-900">
                            VIP
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {conv.otherUser.displayName || conv.otherUser.username}
                          </p>
                          {conv.lastMessage?.timestamp && (
                            <span className="text-[11px] text-slate-400 ml-2 flex-shrink-0">
                              {formatMessageTime(conv.lastMessage.timestamp)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {conv.lastMessage?.text || 'Sem mensagens'}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="ml-1 bg-black text-white text-[11px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Coluna direita: janela de chat - 👈 RESPONSIVO */}
          <section className={`flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col ${showChat ? 'flex' : 'hidden md:flex'
            }`}>
            {!selectedConversation ? (
              <div className="flex-1 flex flex-col items-center justify-center text-sm text-slate-500 dark:text-slate-400 p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-slate-600 dark:text-slate-400">Selecione uma conversa para começar</p>
              </div>
            ) : (
              <>
                {/* Header da conversa - 👈 COM BOTÃO VOLTAR */}
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* Botão voltar (apenas mobile) */}
                    <button
                      onClick={handleBackToList}
                      className="md:hidden p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    </button>

                    <img
                      src={selectedConversation.otherUser.avatar || `https://placehold.co/48x48/8B7FE8/white? text=${selectedConversation.otherUser.displayName?.[0] || 'U'}`}
                      alt={selectedConversation.otherUser.displayName}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        e.target.src = `https://placehold.co/48x48/8B7FE8/white?text=${selectedConversation.otherUser.displayName?.[0] || 'U'}`;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {selectedConversation.otherUser.displayName || selectedConversation.otherUser.username}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        @{selectedConversation.otherUser.username}
                        {selectedConversation.otherUser.isVerified && ' • Verificado'}
                      </p>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                    <Link
                      to={`/creator/${selectedConversation.otherUser.id}`}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Ver perfil
                    </Link>
                  </div>
                </div>

                {/* Área de mensagens */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50 dark:bg-slate-950/40">
                  {messages.length === 0 ? (
                    <div className="text-xs text-center text-slate-500 dark:text-slate-400 mt-10">
                      Nenhuma mensagem ainda.  Envie a primeira!
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isCurrentUser = msg.sender._id === currentUser.id;
                      const isPaid = msg.type === 'paid';

                      return (
                        <div
                          key={msg._id}
                          className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 py-2 text-sm ${isCurrentUser
                              ? 'bg-black text-white rounded-br-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm'
                              } ${isPaid ? 'border-2 border-yellow-400' : ''}`}
                          >
                            {/* Mensagem paga */}
                            {isPaid && (
                              <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-yellow-400/30">
                                <span className="text-slate-600">💰</span>
                                <span className="text-xs font-semibold">
                                  Conteúdo Pago - $ {msg.content.price?.toFixed(2)}
                                </span>
                              </div>
                            )}

                            {/* Se a mensagem é paga e não foi desbloqueada */}
                            {msg.content.isPaid && !msg.isUnlocked && (
                              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black dark:bg-black/20 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-black" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">Conteúdo Bloqueado</p>
                                    <p className="text-xs text-slate-500 truncate">
                                      {msg.content.mediaUrl?.length > 0 && `${msg.content.mediaUrl.length} mídia(s) • `}
                                      ${msg.content.price}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setPaymentData({
                                      creatorId: selectedConversation.otherUser.id,
                                      type: 'PPV_MESSAGE',
                                      amountUSD: msg.content.price,
                                      messageId: msg._id,
                                    });
                                    setLockedMessageId(msg._id);
                                    setShowPaymentModal(true);
                                  }}
                                  className="w-full sm:w-auto bg-black hover:bg-black text-white px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 text-xs sm:text-sm whitespace-nowrap"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm: w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c. 22. 071.412.164.567.267.364.243.433.468.433.582 0.114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                  </svg>
                                  <span>Desbloquear</span>
                                </button>
                              </div>
                            )}

                            {/* Mídia (somente se desbloqueada ou não é paga) */}
                            {(!msg.content.isPaid || msg.isUnlocked) && msg.content.mediaUrl && msg.content.mediaUrl.length > 0 && (
                              <div className="mb-2 space-y-2">
                                {msg.content.mediaUrl.map((url, idx) => (
                                  <div key={idx} className="rounded-lg overflow-hidden">
                                    {msg.type === 'video' ? (
                                      <video
                                        src={url}
                                        controls
                                        className="w-full max-w-full sm:max-w-sm rounded-lg"
                                      />
                                    ) : (
                                      <img
                                        src={url}
                                        alt="Mídia"
                                        className="w-full max-w-full sm:max-w-sm rounded-lg"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Texto */}
                            {msg.content.text && (
                              <p className="whitespace-pre-wrap break-words">
                                {msg.content.text}
                              </p>
                            )}

                            <p
                              className={`text-[10px] mt-1 ${isCurrentUser ? 'text-black/80' : 'text-slate-400'
                                }`}
                            >
                              {formatFullTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Indicador de digitação */}
                  {typingUsers[selectedConversationId] && typingUsers[selectedConversationId] !== currentUser.id && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl px-4 py-2 text-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Preview de arquivos */}
                {uploadedFiles.length > 0 && (
                  <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center space-x-2 overflow-x-auto">
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="relative group flex-shrink-0">
                          {file.type === 'video' ? (
                            <video
                              src={file.url}
                              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                            />
                          ) : (
                            <img
                              src={file.url}
                              alt="Preview"
                              className="w-16 h-16 sm: w-20 sm:h-20 object-cover rounded-lg"
                            />
                          )}
                          <button
                            onClick={() => handleRemoveFile(idx)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input de nova mensagem - 👈 RESPONSIVO */}
                <form
                  onSubmit={handleSendMessage}
                  className="border-t border-slate-200 dark:border-slate-800 px-2 sm:px-3 py-2 flex items-center space-x-2 bg-white dark:bg-slate-900"
                >
                  {/* Botão de anexar */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || uploadedFiles.length >= 5}
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors flex-shrink-0"
                    title="Anexar mídia"
                  >
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>

                  {/* Botão PPV */}
                  {uploadedFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowPPVModal(true)}
                      className="p-2 rounded-lg text-slate-600 hover:text-slate-600 hover:bg-slate-600 dark:hover:bg-slate-600/20 transition-colors flex-shrink-0"
                      title="Enviar como conteúdo pago"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0.99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}

                  <input
                    type="text"
                    value={messageInput}
                    onChange={handleInputChange}
                    placeholder="Escreva uma mensagem..."
                    disabled={sending || uploading}
                    className="flex-1 text-sm px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50"
                  />

                  <button
                    type="submit"
                    disabled={(!messageInput.trim() && uploadedFiles.length === 0) || sending || uploading}
                    className="px-3 sm:px-4 py-2 rounded-lg bg-black text-white text-sm font-semibold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

      {/* Modal PPV - 👈 RESPONSIVO */}
      {showPPVModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">💰 Conteúdo Pago</h3>
              <button
                onClick={() => setShowPPVModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Defina o preço ($ 5.00 - $ 500.00)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <input
                  type="number"
                  min="5"
                  max="500"
                  step="0.01"
                  value={ppvPrice}
                  onChange={(e) => setPpvPrice(parseFloat(e.target.value))}
                  className="w-full pl-10 pr-4 py-2 sm:py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-base sm:text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Você receberá ~$ {(ppvPrice * 0.8).toFixed(2)} (80% após taxas)
              </p>
            </div>

            <div className="mb-4 sm:mb-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                📸 {uploadedFiles.length} arquivo(s) anexado(s)
              </p>
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex-shrink-0">
                    {file.type === 'video' ? (
                      <video src={file.url} className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg" />
                    ) : (
                      <img src={file.url} alt="Preview" className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowPPVModal(false)}
                className="flex-1 px-4 py-2 sm:py-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendPPV}
                disabled={sending || !ppvPrice || ppvPrice < 5 || ppvPrice > 500}
                className="flex-1 px-4 py-2 sm:py-3 rounded-lg bg-black hover:from-yellow-600 hover:to-orange-600 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Enviando...' : 'Enviar PPV'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && paymentData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setLockedMessageId(null);
          }}
          paymentData={paymentData}
          onSuccess={(payment) => {
            setShowPaymentModal(false);
            setLockedMessageId(null);
            setMessages(prev => prev.map(m =>
              m._id === lockedMessageId
                ? { ...m, isUnlocked: true }
                : m
            ));
          }}
        />
      )}
    </div>
  );
}