import { useState, useMemo } from 'react';
import CreatorSidebar from '../../components/CreatorSidebar';
import { Link } from 'react-router-dom';

// Mock de conversas e mensagens
const mockConversations = [
  {
    id: 1,
    subscriberName: 'Maria Silva',
    subscriberUsername: 'maria.silva',
    avatar: 'https://placehold.co/48x48/8B7FE8/white?text=M',
    lastMessage: 'Obrigada pelo último conteúdo, foi incrível! 💜',
    lastMessageTime: 'Há 2h',
    unreadCount: 2,
    isSubscriber: true,
    isVIP: true,
  },
  {
    id: 2,
    subscriberName: 'João Pedro',
    subscriberUsername: 'joaopedro',
    avatar: 'https://placehold.co/48x48/6366F1/white?text=J',
    lastMessage: 'Você vai postar algo novo essa semana?',
    lastMessageTime: 'Ontem',
    unreadCount: 0,
    isSubscriber: true,
    isVIP: false,
  },
  {
    id: 3,
    subscriberName: 'Ana Costa',
    subscriberUsername: 'anacosta',
    avatar: 'https://placehold.co/48x48/A78BFA/white?text=A',
    lastMessage: 'Tem como fazer um conteúdo personalizado?',
    lastMessageTime: 'Seg',
    unreadCount: 1,
    isSubscriber: true,
    isVIP: false,
  },
];

const mockMessagesByConversation = {
  1: [
    {
      id: 1,
      from: 'subscriber',
      text: 'Oi Luna! 💜',
      time: 'Hoje, 14:05',
    },
    {
      id: 2,
      from: 'subscriber',
      text: 'Obrigada pelo último conteúdo, foi incrível!',
      time: 'Hoje, 14:06',
    },
    {
      id: 3,
      from: 'creator',
      text: 'Aiii, feliz que você gostou! 😍 Semana que vem tem mais.',
      time: 'Hoje, 14:10',
    },
  ],
  2: [
    {
      id: 4,
      from: 'subscriber',
      text: 'Você vai postar algo novo essa semana?',
      time: 'Ontem, 21:15',
    },
    {
      id: 5,
      from: 'creator',
      text: 'Sim! Vou postar fotos novas sexta-feira 😉',
      time: 'Ontem, 21:20',
    },
  ],
  3: [
    {
      id: 6,
      from: 'subscriber',
      text: 'Tem como fazer um conteúdo personalizado?',
      time: 'Seg, 18:02',
    },
  ],
};

export default function CreatorMessagesPage() {
  const [search, setSearch] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState(
    mockConversations[0]?.id ?? null,
  );
  const [messageInput, setMessageInput] = useState('');

  const conversations = useMemo(() => {
    let list = [...mockConversations];

    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.subscriberName.toLowerCase().includes(s) ||
          c.subscriberUsername.toLowerCase().includes(s),
      );
    }

    // Ordenar por: quem tem não lidas primeiro, depois ordem original (mock)
    list.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      return 0;
    });

    return list;
  }, [search]);

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId,
  );

  const messages =
    mockMessagesByConversation[selectedConversationId] ?? [];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversationId) return;

    // Aqui você depois vai chamar a API.
    alert(
      `Mensagem enviada para ${selectedConversation?.subscriberName}: "${messageInput.trim()}" (mock)`,
    );
    setMessageInput('');
  };

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
                className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
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
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Mensagens
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Inbox com assinantes e fãs
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Online</span>
              </span>
              <span>•</span>
              <span>{mockConversations.length} conversa(s)</span>
            </div>
          </div>
        </header>

        {/* Conteúdo: layout em 2 colunas */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 flex gap-4">
          {/* Coluna esquerda: lista de conversas */}
          <section className="w-full md:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col">
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
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Lista de conversas */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  Nenhuma conversa encontrada.
                </div>
              ) : (
                conversations.map((conv) => {
                  const isSelected = conv.id === selectedConversationId;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversationId(conv.id)}
                      className={`w-full text-left px-3 py-3 flex items-center space-x-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-slate-800/70'
                          : ''
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={conv.avatar}
                          alt={conv.subscriberName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        {conv.isVIP && (
                          <span className="absolute -bottom-1 -right-1 bg-yellow-400 text-[10px] px-1 rounded-full text-black font-bold border border-slate-900">
                            VIP
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {conv.subscriberName}
                          </p>
                          <span className="text-[11px] text-slate-400 ml-2">
                            {conv.lastMessageTime}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {conv.lastMessage}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="ml-1 bg-indigo-600 text-white text-[11px] px-2 py-0.5 rounded-full font-semibold">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Coluna direita: janela de chat */}
          <section className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                Selecione uma conversa para começar.
              </div>
            ) : (
              <>
                {/* Header da conversa */}
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={selectedConversation.avatar}
                      alt={selectedConversation.subscriberName}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {selectedConversation.subscriberName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        @{selectedConversation.subscriberUsername}{' '}
                        {selectedConversation.isSubscriber && '• Assinante'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                    <button className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                      Ver perfil
                    </button>
                    <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Área de mensagens */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50 dark:bg-slate-950/40">
                  {messages.map((msg) => {
                    const isCreator = msg.from === 'creator';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${
                          isCreator ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                            isCreator
                              ? 'bg-indigo-600 text-white rounded-br-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {msg.text}
                          </p>
                          <p
                            className={`text-[10px] mt-1 ${
                              isCreator
                                ? 'text-indigo-100/80'
                                : 'text-slate-400'
                            }`}
                          >
                            {msg.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {messages.length === 0 && (
                    <div className="text-xs text-center text-slate-500 dark:text-slate-400 mt-10">
                      Nenhuma mensagem ainda. Envie a primeira!
                    </div>
                  )}
                </div>

                {/* Input de nova mensagem */}
                <form
                  onSubmit={handleSendMessage}
                  className="border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center space-x-2 bg-white dark:bg-slate-900"
                >
                  <button
                    type="button"
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M4 3a2 2 0 00-2 2v2.586A1.5 1.5 0 013.5 8h1A1.5 1.5 0 016 9.5v1A1.5 1.5 0 014.5 12h-1A1.5 1.5 0 012 13.5V16a2 2 0 002 2h2.586A1.5 1.5 0 018 16.5v-1A1.5 1.5 0 019.5 14h1a1.5 1.5 0 011.5 1.5v1A1.5 1.5 0 0013.5 18H16a2 2 0 002-2v-2.586A1.5 1.5 0 0016.5 12h-1A1.5 1.5 0 0114 10.5v-1A1.5 1.5 0 0115.5 8h1A1.5 1.5 0 0018 6.5V5a2 2 0 00-2-2h-2.586A1.5 1.5 0 0012 4.5v1A1.5 1.5 0 0110.5 7h-1A1.5 1.5 0 018 5.5v-1A1.5 1.5 0 006.586 3H4z" />
                    </svg>
                  </button>

                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Escreva uma mensagem..."
                    className="flex-1 text-sm px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Enviar
                  </button>
                </form>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}