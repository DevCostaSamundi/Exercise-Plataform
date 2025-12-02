import { Link } from 'react-router-dom';

// ============================================
// DADOS DA POLÍTICA
// ============================================

const LAST_UPDATED = '02 de Dezembro de 2025';

const TABLE_OF_CONTENTS = [
  { id: 'introducao', icon: '📋', label: 'Introdução e Escopo' },
  { id: 'bases-legais', icon: '⚖️', label: 'Bases Legais (LGPD/GDPR)' },
  { id: 'dados-coletados', icon: '📊', label: 'Dados que Coletamos' },
  { id: 'uso-dados', icon: '🔄', label: 'Como Utilizamos seus Dados' },
  { id: 'compartilhamento', icon: '🤝', label: 'Compartilhamento de Dados' },
  { id: 'retencao', icon: '🗄️', label: 'Retenção e Exclusão' },
  { id: 'direitos', icon: '✊', label: 'Seus Direitos de Privacidade' },
  { id: 'seguranca', icon: '🔒', label: 'Segurança da Informação' },
  { id: 'cookies', icon: '🍪', label: 'Cookies e Tecnologias' },
  { id: 'conteudo-adulto', icon: '🔞', label: 'Conteúdo Adulto e Menores' },
  { id: 'criadores', icon: '🎨', label: 'Informações para Criadores' },
  { id: 'pagamentos', icon: '💰', label: 'Pagamentos e Criptomoedas' },
  { id: 'transferencias', icon: '🌍', label: 'Transferências Internacionais' },
  { id: 'alteracoes', icon: '📝', label: 'Alterações na Política' },
  { id: 'contato', icon: '📧', label: 'Contato e Suporte' },
];

// ============================================
// COMPONENTES AUXILIARES
// ============================================

function PageHeader() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
      <Link
        to="/"
        className="inline-flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
      >
        <svg xmlns="http://www.w3. org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9. 707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        <span>Voltar para Home</span>
      </Link>

      <button
        onClick={() => window.print()}
        className="inline-flex items-center space-x-2 text-sm px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
        </svg>
        <span>Imprimir / PDF</span>
      </button>
    </div>
  );
}

function TitleSection() {
  return (
    <header className="text-center mb-8 pb-8 border-b border-slate-200 dark:border-slate-800">
      {/* Logo */}
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M2. 166 4.999A11.954 11.954 0 0010 1. 944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10. 586 7.707 9. 293a1 1 0 00-1.414 1. 414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">
        Política de Privacidade
      </h1>

      <p className="text-slate-600 dark:text-slate-400 mb-2">
        PrideConnect — Plataforma de Conteúdo para a Comunidade LGBT+
      </p>

      <p className="text-sm text-slate-500 dark:text-slate-500">
        Última atualização: <span className="font-medium">{LAST_UPDATED}</span>
      </p>
    </header>
  );
}

function AlertBanner() {
  return (
    <div className="mb-8 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 p-5">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <span className="text-2xl">⚠️</span>
        </div>
        <div>
          <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
            Aviso Importante
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            Esta política descreve como coletamos, usamos e protegemos seus dados pessoais 
            no PrideConnect. Por ser uma plataforma de conteúdo adulto, aplicamos medidas 
            adicionais de segurança, privacidade e verificação de idade.  Este documento 
            tem caráter informativo e não constitui aconselhamento jurídico.
          </p>
        </div>
      </div>
    </div>
  );
}

function TableOfContents() {
  return (
    <nav className="mb-10 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
        <span>📑</span>
        <span>Índice</span>
      </h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {TABLE_OF_CONTENTS.map((item, index) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
          >
            <span className="text-base">{item.icon}</span>
            <span className="group-hover:underline">
              {index + 1}. {item. label}
            </span>
          </a>
        ))}
      </div>
    </nav>
  );
}

function Section({ id, icon, title, children }) {
  return (
    <section id={id} className="scroll-mt-24 mb-10">
      <h2 className="flex items-center space-x-3 text-xl font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <span className="text-2xl">{icon}</span>
        <span>{title}</span>
      </h2>
      <div className="text-slate-700 dark:text-slate-300 leading-relaxed space-y-4">
        {children}
      </div>
    </section>
  );
}

function SubSection({ title, children }) {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function BulletList({ items }) {
  return (
    <ul className="space-y-2 ml-1">
      {items.map((item, index) => (
        <li key={index} className="flex items-start space-x-3">
          <span className="text-indigo-500 mt-1. 5">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function HighlightBox({ type = 'info', children }) {
  const styles = {
    info: 'border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200',
    warning: 'border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200',
    success: 'border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-200',
  };

  return (
    <div className={`rounded-lg border p-4 text-sm ${styles[type]}`}>
      {children}
    </div>
  );
}

function InternalLink({ to, children }) {
  return (
    <Link
      to={to}
      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline underline-offset-2"
    >
      {children}
    </Link>
  );
}

function FooterNote() {
  return (
    <footer className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center sm:text-left">
          🏳️‍🌈 PrideConnect — Comprometido com a privacidade, inclusão e 
          segurança da comunidade LGBT+. 
        </p>

        <div className="flex items-center space-x-4 text-sm">
          <InternalLink to="/terms">Termos de Uso</InternalLink>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <InternalLink to="/support">Suporte</InternalLink>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4">
      <div className="mx-auto w-full">
        
        <PageHeader />

        {/* Card Principal */}
        <article className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm">
          
          <TitleSection />
          <AlertBanner />
          <TableOfContents />

          {/* ========== SEÇÕES DE CONTEÚDO ========== */}

          {/* 1. Introdução */}
          <Section id="introducao" icon="📋" title="1. Introdução e Escopo">
            <p>
              O <strong>PrideConnect</strong> é uma plataforma que conecta criadores e 
              assinantes de conteúdo adulto de forma segura, inclusiva e respeitosa. 
              Nossa missão é proporcionar um espaço onde a comunidade LGBT+ possa se 
              expressar livremente enquanto mantém total controle sobre sua privacidade.
            </p>
            
            <p>
              Esta Política de Privacidade se aplica ao website, aplicativos móveis, 
              APIs e todos os serviços relacionados ao PrideConnect.  Ao utilizar nossa 
              plataforma, você concorda com as práticas descritas neste documento.
            </p>

            <HighlightBox type="info">
              <strong>Aplicabilidade:</strong> Esta política se aplica a todos os 
              usuários, incluindo visitantes, assinantes e criadores de conteúdo, 
              independentemente de sua localização geográfica.
            </HighlightBox>
          </Section>

          {/* 2. Bases Legais */}
          <Section id="bases-legais" icon="⚖️" title="2.  Bases Legais (LGPD/GDPR)">
            <p>
              Tratamos seus dados pessoais de acordo com a Lei Geral de Proteção de 
              Dados (LGPD - Brasil), o Regulamento Geral de Proteção de Dados (GDPR - 
              União Europeia) e outras legislações aplicáveis. As bases legais que 
              utilizamos incluem:
            </p>

            <BulletList
              items={[
                <><strong>Execução de contrato:</strong> Necessário para prestar nossos serviços, processar pagamentos e fornecer suporte. </>,
                <><strong>Consentimento:</strong> Para comunicações de marketing, cookies não essenciais e funcionalidades opcionais.</>,
                <><strong>Legítimo interesse:</strong> Para segurança da plataforma, prevenção de fraudes e melhoria dos serviços.</>,
                <><strong>Obrigação legal:</strong> Cumprimento de requisitos fiscais, contábeis e ordens judiciais.</>,
                <><strong>Exercício regular de direitos:</strong> Em disputas, cobranças e procedimentos de compliance.</>,
              ]}
            />
          </Section>

          {/* 3. Dados Coletados */}
          <Section id="dados-coletados" icon="📊" title="3. Dados que Coletamos">
            <p>
              Coletamos diferentes tipos de dados dependendo de como você interage 
              com nossa plataforma:
            </p>

            <SubSection title="3.1 Dados de Cadastro e Identificação">
              <BulletList
                items={[
                  'Nome de usuário (username) e nome de exibição',
                  'Endereço de e-mail',
                  'Senha (armazenada com criptografia hash)',
                  'Data de nascimento (para verificação de maioridade)',
                  'Identidade de gênero e orientação sexual (opcional)',
                ]}
              />
            </SubSection>

            <SubSection title="3.2 Dados de Perfil e Conteúdo">
              <BulletList
                items={[
                  'Foto de perfil (avatar) e imagem de capa',
                  'Biografia e descrição pessoal',
                  'Links para redes sociais',
                  'Conteúdo publicado (fotos, vídeos, textos)',
                  'Interações (curtidas, comentários, visualizações)',
                ]}
              />
            </SubSection>

            <SubSection title="3.3 Verificação de Idade e KYC (Criadores)">
              <BulletList
                items={[
                  'Documento de identidade com foto',
                  'Selfie com documento para verificação',
                  'Informações bancárias/PIX para recebimento',
                  'Dados fiscais quando exigido por lei',
                ]}
              />
              <HighlightBox type="warning">
                <strong>Segurança KYC:</strong> Documentos de verificação são 
                armazenados em servidores seguros com acesso restrito e são 
                utilizados exclusivamente para fins de compliance.
              </HighlightBox>
            </SubSection>

            <SubSection title="3. 4 Dados de Comunicação">
              <BulletList
                items={[
                  'Mensagens enviadas e recebidas entre usuários',
                  'Conteúdo de mídia compartilhado em conversas',
                  'Histórico de conversas e metadados (horário, status)',
                  'Comunicações com nosso suporte',
                ]}
              />
            </SubSection>

            <SubSection title="3.5 Dados Técnicos e de Uso">
              <BulletList
                items={[
                  'Endereço IP e geolocalização aproximada',
                  'Tipo de dispositivo, navegador e sistema operacional',
                  'Páginas visitadas e tempo de permanência',
                  'Cookies e identificadores de sessão',
                  'Logs de acesso e atividade na plataforma',
                ]}
              />
            </SubSection>
          </Section>

          {/* 4. Uso de Dados */}
          <Section id="uso-dados" icon="🔄" title="4.  Como Utilizamos seus Dados">
            <p>
              Utilizamos os dados coletados para as seguintes finalidades:
            </p>

            <BulletList
              items={[
                <><strong>Prestação de serviços:</strong> Operar a plataforma, gerenciar sua conta e processar transações.</>,
                <><strong>Personalização:</strong> Recomendar criadores, conteúdos e melhorar sua experiência. </>,
                <><strong>Comunicação:</strong> Enviar notificações, atualizações e informações sobre sua conta.</>,
                <><strong>Segurança:</strong> Detectar fraudes, abusos e proteger a integridade da plataforma.</>,
                <><strong>Análise:</strong> Entender como os usuários utilizam a plataforma para melhorá-la.</>,
                <><strong>Compliance:</strong> Cumprir obrigações legais e responder a solicitações de autoridades. </>,
                <><strong>Marketing:</strong> Enviar ofertas e novidades (apenas com seu consentimento).</>,
              ]}
            />
          </Section>

          {/* 5. Compartilhamento */}
          <Section id="compartilhamento" icon="🤝" title="5. Compartilhamento de Dados">
            <p>
              Compartilhamos seus dados apenas quando necessário e com as seguintes 
              categorias de destinatários:
            </p>

            <SubSection title="5.1 Provedores de Serviços">
              <BulletList
                items={[
                  'Processadores de pagamento (NOWPayments, BTCPay, PIX, Stripe)',
                  'Serviços de hospedagem e infraestrutura em nuvem',
                  'Armazenamento de mídia (Cloudinary)',
                  'Serviços de e-mail e notificações',
                  'Ferramentas de análise e monitoramento',
                ]}
              />
            </SubSection>

            <SubSection title="5.2 Parceiros de Segurança">
              <BulletList
                items={[
                  'Serviços de prevenção a fraudes',
                  'Moderação de conteúdo',
                  'Verificação de identidade (KYC)',
                ]}
              />
            </SubSection>

            <SubSection title="5.3 Autoridades">
              <p>
                Podemos compartilhar dados com autoridades governamentais quando 
                exigido por lei, ordem judicial ou para proteger direitos, 
                propriedade ou segurança. 
              </p>
            </SubSection>

            <HighlightBox type="success">
              <strong>Garantia:</strong> Todos os nossos parceiros e provedores são 
              contratualmente obrigados a proteger seus dados com o mesmo nível de 
              segurança que aplicamos internamente.
            </HighlightBox>
          </Section>

          {/* 6.  Retenção */}
          <Section id="retencao" icon="🗄️" title="6. Retenção e Exclusão de Dados">
            <p>
              Mantemos seus dados pelo tempo necessário para cumprir as finalidades 
              descritas nesta política e atender requisitos legais:
            </p>

            <BulletList
              items={[
                <><strong>Dados de conta:</strong> Enquanto sua conta estiver ativa, mais 30 dias após exclusão.</>,
                <><strong>Dados financeiros:</strong> Mínimo de 5 anos para fins fiscais e contábeis.</>,
                <><strong>Logs de segurança:</strong> Até 2 anos para investigação de incidentes.</>,
                <><strong>Conteúdo publicado:</strong> Até a exclusão pelo usuário ou encerramento da conta.</>,
                <><strong>Backups:</strong> Podem ser retidos por até 90 dias adicionais. </>,
              ]}
            />

            <p>
              Você pode solicitar a exclusão de seus dados a qualquer momento, 
              sujeito a limitações legais (obrigações fiscais, prevenção a fraudes, 
              disputas pendentes).
            </p>
          </Section>

          {/* 7. Direitos */}
          <Section id="direitos" icon="✊" title="7. Seus Direitos de Privacidade">
            <p>
              De acordo com a LGPD, GDPR e outras leis aplicáveis, você possui os 
              seguintes direitos:
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              {[
                { icon: '👁️', title: 'Acesso', desc: 'Solicitar uma cópia dos dados que temos sobre você.' },
                { icon: '✏️', title: 'Correção', desc: 'Corrigir dados incompletos ou incorretos.' },
                { icon: '🗑️', title: 'Exclusão', desc: 'Solicitar a exclusão de seus dados pessoais.' },
                { icon: '⏸️', title: 'Limitação', desc: 'Restringir o processamento em certas situações.' },
                { icon: '📦', title: 'Portabilidade', desc: 'Receber seus dados em formato estruturado.' },
                { icon: '🚫', title: 'Oposição', desc: 'Opor-se ao processamento baseado em legítimo interesse.' },
                { icon: '🔄', title: 'Revogação', desc: 'Retirar consentimentos previamente concedidos.' },
                { icon: '🤖', title: 'Revisão', desc: 'Solicitar revisão de decisões automatizadas.' },
              ]. map((right) => (
                <div
                  key={right.title}
                  className="flex items-start space-x-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                >
                  <span className="text-2xl">{right.icon}</span>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {right.title}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {right.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4">
              Para exercer qualquer um desses direitos, entre em contato através da 
              nossa página de <InternalLink to="/support">Suporte</InternalLink>. 
              Podemos solicitar verificação de identidade para proteger sua conta.
            </p>
          </Section>

          {/* 8. Segurança */}
          <Section id="seguranca" icon="🔒" title="8.  Segurança da Informação">
            <p>
              Implementamos medidas técnicas e organizacionais robustas para 
              proteger seus dados:
            </p>

            <BulletList
              items={[
                <><strong>Criptografia:</strong> HTTPS em todas as comunicações e criptografia em repouso para dados sensíveis.</>,
                <><strong>Autenticação:</strong> Senhas armazenadas com hash bcrypt e suporte a autenticação segura.</>,
                <><strong>Controle de acesso:</strong> Políticas de acesso mínimo necessário para funcionários e sistemas.</>,
                <><strong>Monitoramento:</strong> Logs de auditoria e detecção de atividades suspeitas.</>,
                <><strong>Backups:</strong> Backups regulares com criptografia e armazenamento seguro.</>,
                <><strong>Testes:</strong> Avaliações periódicas de segurança e correção de vulnerabilidades.</>,
              ]}
            />

            <HighlightBox type="warning">
              <strong>Importante:</strong> Nenhum sistema é 100% seguro.  Em caso de 
              incidente de segurança, notificaremos os usuários afetados e as 
              autoridades competentes conforme exigido por lei.
            </HighlightBox>
          </Section>

          {/* 9.  Cookies */}
          <Section id="cookies" icon="🍪" title="9. Cookies e Tecnologias Similares">
            <p>
              Utilizamos cookies e tecnologias similares para melhorar sua 
              experiência:
            </p>

            <SubSection title="9.1 Tipos de Cookies">
              <div className="space-y-3">
                {[
                  { type: 'Essenciais', desc: 'Necessários para funcionamento básico (autenticação, segurança, navegação). ', required: true },
                  { type: 'Preferências', desc: 'Salvam suas configurações (tema escuro, modo discreto, idioma).', required: false },
                  { type: 'Analytics', desc: 'Coletam estatísticas de uso anônimas para melhorar a plataforma.', required: false },
                  { type: 'Marketing', desc: 'Utilizados para campanhas e remarketing (apenas com consentimento).', required: false },
                ].map((cookie) => (
                  <div
                    key={cookie.type}
                    className="flex items-start justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">
                        {cookie.type}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {cookie.desc}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      cookie.required
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      {cookie.required ? 'Obrigatório' : 'Opcional'}
                    </span>
                  </div>
                ))}
              </div>
            </SubSection>

            <p className="mt-4">
              Você pode gerenciar cookies através das configurações do seu navegador. 
              Note que desabilitar cookies essenciais pode afetar o funcionamento 
              da plataforma.
            </p>
          </Section>

          {/* 10. Conteúdo Adulto */}
          <Section id="conteudo-adulto" icon="🔞" title="10. Conteúdo Adulto e Proteção de Menores">
            <p>
              O PrideConnect é uma plataforma exclusivamente para maiores de 18 anos. 
              Implementamos medidas rigorosas para proteger menores:
            </p>

            <BulletList
              items={[
                <><strong>Verificação de idade:</strong> Confirmação obrigatória de maioridade no acesso. </>,
                <><strong>Age Gate:</strong> Tela de verificação antes de acessar qualquer conteúdo. </>,
                <><strong>Proibição:</strong> Conteúdo envolvendo menores é estritamente proibido e resulta em banimento permanente.</>,
                <><strong>Denúncia:</strong> Sistema de denúncia para conteúdo suspeito ou ilegal.</>,
                <><strong>Cooperação:</strong> Colaboramos com autoridades na investigação de crimes.</>,
              ]}
            />

            <HighlightBox type="warning">
              <strong>Tolerância Zero:</strong> Qualquer conteúdo que explore, abuse 
              ou envolva menores de idade resultará em ação imediata, incluindo 
              banimento permanente, exclusão de dados e comunicação às autoridades 
              competentes.
            </HighlightBox>
          </Section>

          {/* 11. Criadores */}
          <Section id="criadores" icon="🎨" title="11.  Informações para Criadores">
            <p>
              Se você é um criador de conteúdo, coletamos dados adicionais para 
              operar sua conta profissional:
            </p>

            <SubSection title="11.1 Verificação (KYC)">
              <BulletList
                items={[
                  'Documento de identidade oficial com foto',
                  'Selfie segurando o documento para verificação',
                  'Comprovante de endereço (quando necessário)',
                  'Informações fiscais para compliance',
                ]}
              />
            </SubSection>

            <SubSection title="11.2 Dados Financeiros">
              <BulletList
                items={[
                  'Chave PIX ou dados bancários para recebimento',
                  'Endereços de carteiras de criptomoedas',
                  'Histórico de ganhos e saques',
                  'Informações para emissão de relatórios fiscais',
                ]}
              />
            </SubSection>

            <SubSection title="11.3 Conteúdo e Direitos">
              <BulletList
                items={[
                  'Você mantém os direitos autorais do seu conteúdo',
                  'Concede licença à plataforma para distribuição aos assinantes',
                  'Pode solicitar remoção de conteúdo a qualquer momento',
                  'Procedimentos DMCA disponíveis para proteção de direitos',
                ]}
              />
            </SubSection>
          </Section>

          {/* 12. Pagamentos */}
          <Section id="pagamentos" icon="💰" title="12. Pagamentos e Criptomoedas">
            <p>
              Processamos pagamentos através de diversos métodos, priorizando sua 
              privacidade:
            </p>

            <SubSection title="12.1 Métodos de Pagamento">
              <BulletList
                items={[
                  <><strong>Criptomoedas:</strong> Bitcoin, Ethereum, USDT, Monero e outras (via NOWPayments/BTCPay).</>,
                  <><strong>PIX:</strong> Pagamentos instantâneos para usuários brasileiros.</>,
                  <><strong>Cartão:</strong> Processado por gateway terceirizado (não armazenamos dados de cartão).</>,
                ]}
              />
            </SubSection>

            <SubSection title="12.2 Privacidade em Pagamentos">
              <BulletList
                items={[
                  'Extratos bancários mostram nomes genéricos, não "PrideConnect"',
                  'Criptomoedas oferecem maior nível de privacidade',
                  'Monero (XMR) disponível para máxima privacidade',
                  'Não compartilhamos dados de pagamento com terceiros desnecessários',
                ]}
              />
            </SubSection>

            <HighlightBox type="info">
              <strong>Discrição:</strong> Entendemos a importância da privacidade 
              financeira. Nossos pagamentos são processados de forma discreta e 
              não revelarão a natureza da plataforma em extratos bancários.
            </HighlightBox>
          </Section>

          {/* 13.  Transferências */}
          <Section id="transferencias" icon="🌍" title="13. Transferências Internacionais">
            <p>
              Podemos processar dados em servidores localizados fora do seu país de 
              residência.  Quando isso ocorre:
            </p>

            <BulletList
              items={[
                'Utilizamos provedores que aderem a padrões internacionais de segurança',
                'Aplicamos cláusulas contratuais padrão aprovadas por autoridades',
                'Garantimos o mesmo nível de proteção independente da localização',
                'Priorizamos provedores em jurisdições com leis de proteção adequadas',
              ]}
            />
          </Section>

          {/* 14. Alterações */}
          <Section id="alteracoes" icon="📝" title="14. Alterações nesta Política">
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente para 
              refletir mudanças em nossas práticas ou requisitos legais. 
            </p>

            <BulletList
              items={[
                'A data de atualização será sempre indicada no topo do documento',
                'Mudanças significativas serão comunicadas por e-mail ou notificação na plataforma',
                'Recomendamos revisar esta política periodicamente',
                'O uso continuado após alterações constitui aceitação da nova versão',
              ]}
            />
          </Section>

          {/* 15. Contato */}
          <Section id="contato" icon="📧" title="15. Contato e Suporte">
            <p>
              Se você tiver dúvidas, preocupações ou quiser exercer seus direitos 
              de privacidade, entre em contato conosco:
            </p>

            <div className="mt-4 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800/50">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                    📬 Página de Suporte
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Para solicitações gerais, dúvidas e exercício de direitos. 
                  </p>
                  <InternalLink to="/support">
                    Acessar Suporte →
                  </InternalLink>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                    📋 Termos de Uso
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Consulte também nossos termos e condições de uso.
                  </p>
                  <InternalLink to="/terms">
                    Ver Termos →
                  </InternalLink>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              <strong>Tempo de resposta:</strong> Respondemos solicitações de 
              privacidade em até 15 dias úteis, conforme exigido pela LGPD.  
              Solicitações complexas podem requerer prazo adicional, do qual 
              você será informado.
            </p>
          </Section>

          <FooterNote />
        </article>
      </div>
    </div>
  );
}