import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { APP_INFO } from '../config/constants';

export default function SafetyPage() {
  const safetyGuidelines = [
    {
      icon: '🔒',
      title: 'Proteja Sua Conta',
      items: [
        'Use senhas fortes e únicas',
        'Ative a autenticação de dois fatores',
        'Nunca compartilhe suas credenciais',
        'Desconfie de emails suspeitos',
        'Faça logout em dispositivos públicos',
      ],
    },
    {
      icon: '💳',
      title: 'Segurança de Pagamento',
      items: [
        'Use apenas métodos de pagamento oficiais',
        'Nunca faça pagamentos fora da plataforma',
        'Verifique extratos regularmente',
        'Reporte transações suspeitas imediatamente',
        'Mantenha informações de pagamento atualizadas',
      ],
    },
    {
      icon: '🚫',
      title: 'Conteúdo Proibido',
      items: [
        'Conteúdo ilegal ou que viole leis',
        'Exploração ou abuso de menores',
        'Violência extrema ou gore',
        'Discurso de ódio ou discriminação',
        'Spam ou fraude',
      ],
    },
    {
      icon: '👤',
      title: 'Privacidade Pessoal',
      items: [
        'Não compartilhe informações pessoais sensíveis',
        'Use nomes artísticos se preferir',
        'Configure privacidade de perfil',
        'Controle quem pode te contatar',
        'Bloqueie usuários indesejados',
      ],
    },
    {
      icon: '⚠️',
      title: 'Reportar Problemas',
      items: [
        'Reporte conteúdo inadequado usando o botão "Reportar"',
        'Denuncie assédio ou comportamento abusivo',
        'Contate suporte para questões urgentes',
        'Preserve evidências (screenshots)',
        'Nossa equipe analisa reports em 24h',
      ],
    },
    {
      icon: '🤝',
      title: 'Interações Respeitosas',
      items: [
        'Trate todos com respeito',
        'Respeite limites e consentimento',
        'Não faça assédio ou stalking',
        'Não compartilhe conteúdo sem permissão',
        'Mantenha comunicação profissional',
      ],
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-black dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <h1 className="text-4xl font-bold">Diretrizes de Segurança</h1>
            </div>
            <p className="text-xl text-slate-300 max-w-3xl">
              Sua segurança é nossa prioridade. Siga estas diretrizes para uma experiência segura e positiva na plataforma.
            </p>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Emergency Banner */}
            <div className="bg-slate-900 dark:bg-slate-900/20 border-l-4 border-red-500 rounded-lg p-6 mb-12">
              <div className="flex items-start gap-4">
                <svg className="w-6 h-6 text-slate-900 dark:text-slate-900 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-900 mb-2">
                    Emergência ou Situação Perigosa?
                  </h3>
                  <p className="text-slate-900 dark:text-slate-900 mb-3">
                    Se você estiver em perigo imediato, contate as autoridades locais (190) antes de nos contatar.
                  </p>
                  <Link
                    to="/support"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors"
                  >
                    Reportar Urgência ao Suporte
                  </Link>
                </div>
              </div>
            </div>

            {/* Guidelines Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {safetyGuidelines.map((guideline, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">{guideline.icon}</span>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {guideline.title}
                    </h2>
                  </div>
                  <ul className="space-y-2">
                    {guideline.items.map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className="flex items-start gap-2 text-slate-600 dark:text-slate-400"
                      >
                        <svg className="w-5 h-5 text-black dark:text-white flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Additional Resources */}
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-8 mb-12">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                Recursos Adicionais
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/help"
                  className="bg-white dark:bg-slate-900 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">Central de Ajuda</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Perguntas frequentes e guias
                  </p>
                </Link>
                <Link
                  to="/privacy"
                  className="bg-white dark:bg-slate-900 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">Política de Privacidade</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Como protegemos seus dados
                  </p>
                </Link>
                <Link
                  to="/terms"
                  className="bg-white dark:bg-slate-900 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">Termos de Uso</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Regras e condições da plataforma
                  </p>
                </Link>
              </div>
            </div>

            {/* Contact CTA */}
            <div className="bg-black dark:bg-slate-900 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                Viu algo suspeito ou preocupante?
              </h2>
              <p className="text-slate-300 mb-6">
                Reporte imediatamente. Sua denúncia é anônima e ajuda a manter a comunidade segura.
              </p>
              <Link
                to="/support"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-100 text-black rounded-lg font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Reportar Problema
              </Link>
            </div>

            {/* Last Updated */}
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
              Última atualização: {new Date(APP_INFO.LAST_UPDATED).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
