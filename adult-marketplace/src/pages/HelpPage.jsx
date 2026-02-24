import { useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const faqs = [
    {
      category: 'Geral',
      questions: [
        {
          id: 1,
          question: 'O que é FlowConnect?',
          answer: 'FlowConnect é uma plataforma que conecta criadores de conteúdo com seus fãs através de assinaturas mensais. Criadores podem monetizar seu conteúdo exclusivo e construir uma comunidade engajada.',
        },
        {
          id: 2,
          question: 'Como funciona a plataforma?',
          answer: 'Criadores publicam conteúdo exclusivo que pode ser acessado apenas por assinantes pagantes. Assinantes pagam uma mensalidade definida pelo criador e recebem acesso a todo o conteúdo premium.',
        },
        {
          id: 3,
          question: 'É seguro usar a plataforma?',
          answer: 'Sim! Utilizamos criptografia de ponta a ponta, processamento de pagamento seguro e seguimos rigorosos padrões de segurança e privacidade para proteger seus dados e transações.',
        },
      ],
    },
    {
      category: 'Para Assinantes',
      questions: [
        {
          id: 4,
          question: 'Como assinar um criador?',
          answer: 'Visite o perfil do criador, clique em "Assinar" e escolha seu método de pagamento. Você terá acesso imediato ao conteúdo após a confirmação do pagamento.',
        },
        {
          id: 5,
          question: 'Posso cancelar minha assinatura?',
          answer: 'Sim, você pode cancelar a qualquer momento em "Minhas Assinaturas". Você manterá acesso até o fim do período pago.',
        },
        {
          id: 6,
          question: 'Quais métodos de pagamento são aceitos?',
          answer: 'Só criptomoedas. Todos os pagamentos são processados de forma segura.',
        },
      ],
    },
    {
      category: 'Para Criadores',
      questions: [
        {
          id: 7,
          question: 'Como me tornar um criador?',
          answer: 'Clique em "Vire Criador" na sidebar, complete o formulário de registro e aguarde a aprovação. O processo geralmente leva 24-48 horas.',
        },
        {
          id: 8,
          question: 'Como recebo meus ganhos?',
          answer: 'Você pode solicitar saques quando atingir o valor mínimo de $ 100. Os pagamentos são processados em até 5 dias úteis via transferência bancária.',
        },
        {
          id: 9,
          question: 'Qual é a taxa da plataforma?',
          answer: 'Cobramos uma taxa de 10% sobre os ganhos dos criadores. Os criadores recebem 80% do valor das assinaturas.',
        },
      ],
    },
    {
      category: 'Segurança e Privacidade',
      questions: [
        {
          id: 10,
          question: 'Meus dados pessoais estão seguros?',
          answer: 'Sim, seguimos a LGPD e utilizamos criptografia para proteger seus dados. Nunca compartilhamos informações pessoais com terceiros sem seu consentimento.',
        },
        {
          id: 11,
          question: 'Como reportar conteúdo inadequado?',
          answer: 'Use o botão "Reportar" presente em cada post ou perfil. Nossa equipe analisa todos os reports em até 24 horas.',
        },
        {
          id: 12,
          question: 'Posso usar um nome fictício?',
          answer: 'Sim, você pode usar um nome artístico ou apelido. Apenas criadores precisam fornecer dados reais para verificação e pagamentos.',
        },
      ],
    },
  ];

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              💡 Central de Ajuda
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
              Encontre respostas para as perguntas mais comuns
            </p>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar na central de ajuda..."
                className="w-full px-4 py-3 pl-12 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              <Link
                to="/support"
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-all text-center"
              >
                <div className="w-12 h-12 bg-black dark:bg-black rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-black dark:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">Contato</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Fale com nosso suporte</p>
              </Link>

              <Link
                to="/terms"
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-all text-center"
              >
                <div className="w-12 h-12 bg-black dark:bg-black rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-black dark:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">Termos de Uso</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Leia nossos termos</p>
              </Link>

              <Link
                to="/safety"
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-all text-center"
              >
                <div className="w-12 h-12 bg-slate-800 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-slate-800 dark:text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">Segurança</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Diretrizes de segurança</p>
              </Link>
            </div>

            {/* FAQ Sections */}
            <div className="space-y-8">
              {filteredFaqs.map((category) => (
                <div key={category.category}>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                    {category.category}
                  </h2>
                  <div className="space-y-3">
                    {category.questions.map((faq) => (
                      <div
                        key={faq.id}
                        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                      >
                        <button
                          onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                          className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <span className="font-semibold text-slate-900 dark:text-white pr-4">
                            {faq.question}
                          </span>
                          <svg
                            className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${openFaq === faq.id ? 'rotate-180' : ''
                              }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {openFaq === faq.id && (
                          <div className="px-6 pb-6 text-slate-600 dark:text-slate-400">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {filteredFaqs.length === 0 && (
              <div className="text-center py-16">
                <p className="text-slate-600 dark:text-slate-400">
                  Nenhuma pergunta encontrada. Tente outro termo de busca.
                </p>
              </div>
            )}

            {/* Contact CTA */}
            <div className="mt-16 bg-black dark:bg-white rounded-2xl p-8 text-center text-white dark:text-black">
              <h2 className="text-2xl font-bold text-white mb-2">
                Ainda precisa de ajuda?
              </h2>
              <p className="text-black mb-6">
                Nossa equipe de suporte está pronta para ajudar
              </p>
              <Link
                to="/support"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-100 text-black rounded-lg font-medium transition-colors"
              >
                Entrar em Contato
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
