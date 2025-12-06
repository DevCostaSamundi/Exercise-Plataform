import { Link } from 'react-router-dom';

// ============================================
// DADOS DOS TERMOS
// ============================================

const LAST_UPDATED = '02 de Dezembro de 2025';
const EFFECTIVE_DATE = '02 de Dezembro de 2025';

const TABLE_OF_CONTENTS = [
  { id: 'aceitacao', icon: '✅', label: 'Aceitação dos Termos' },
  { id: 'definicoes', icon: '📖', label: 'Definições' },
  { id: 'elegibilidade', icon: '🔞', label: 'Elegibilidade e Idade' },
  { id: 'conta', icon: '👤', label: 'Sua Conta' },
  { id: 'assinantes', icon: '⭐', label: 'Regras para Assinantes' },
  { id: 'criadores', icon: '🎨', label: 'Regras para Criadores' },
  { id: 'conteudo', icon: '📸', label: 'Diretrizes de Conteúdo' },
  { id: 'proibido', icon: '🚫', label: 'Conteúdo Proibido' },
  { id: 'pagamentos', icon: '💰', label: 'Pagamentos e Taxas' },
  { id: 'saques', icon: '🏦', label: 'Saques (Criadores)' },
  { id: 'propriedade', icon: '©️', label: 'Propriedade Intelectual' },
  { id: 'dmca', icon: '⚖️', label: 'DMCA e Direitos Autorais' },
  { id: 'privacidade', icon: '🔒', label: 'Privacidade e Dados' },
  { id: 'conduta', icon: '🤝', label: 'Código de Conduta' },
  { id: 'suspensao', icon: '⛔', label: 'Suspensão e Encerramento' },
  { id: 'isencao', icon: '📋', label: 'Isenção de Garantias' },
  { id: 'responsabilidade', icon: '⚠️', label: 'Limitação de Responsabilidade' },
  { id: 'indenizacao', icon: '🛡️', label: 'Indenização' },
  { id: 'disputas', icon: '⚔️', label: 'Resolução de Disputas' },
  { id: 'alteracoes', icon: '📝', label: 'Alterações nos Termos' },
  { id: 'contato', icon: '📧', label: 'Contato' },
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
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
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
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">
        Termos de Uso
      </h1>

      <p className="text-slate-600 dark:text-slate-400 mb-2">
        PrideConnect — Plataforma de Conteúdo para a Comunidade LGBT+
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-sm text-slate-500 dark:text-slate-500">
        <span>
          Última atualização: <span className="font-medium">{LAST_UPDATED}</span>
        </span>
        <span className="hidden sm:inline">•</span>
        <span>
          Em vigor desde: <span className="font-medium">{EFFECTIVE_DATE}</span>
        </span>
      </div>
    </header>
  );
}

function AlertBanner() {
  return (
    <div className="mb-8 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-5">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <span className="text-2xl">⚠️</span>
        </div>
        <div>
          <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">
            Leia com Atenção
          </h3>
          <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
            Ao acessar ou usar o PrideConnect, você concorda com estes Termos de Uso.  
            Esta plataforma contém <strong>conteúdo adulto</strong> e é destinada 
            exclusivamente a pessoas com <strong>18 anos ou mais</strong>. Se você não 
            concorda com estes termos ou não possui a idade mínima, não utilize a plataforma.
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
              {index + 1}.{item.label}
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
          <span className="text-indigo-500 mt-1.5">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function NumberedList({ items }) {
  return (
    <ol className="space-y-2 ml-1">
      {items.map((item, index) => (
        <li key={index} className="flex items-start space-x-3">
          <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-xs font-bold">
            {index + 1}
          </span>
          <span className="pt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function HighlightBox({ type = 'info', title, children }) {
  const styles = {
    info: {
      container: 'border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20',
      title: 'text-blue-900 dark:text-blue-200',
      text: 'text-blue-800 dark:text-blue-300',
      icon: 'ℹ️',
    },
    warning: {
      container: 'border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20',
      title: 'text-amber-900 dark:text-amber-200',
      text: 'text-amber-800 dark:text-amber-300',
      icon: '⚠️',
    },
    danger: {
      container: 'border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20',
      title: 'text-red-900 dark:text-red-200',
      text: 'text-red-800 dark:text-red-300',
      icon: '🚫',
    },
    success: {
      container: 'border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20',
      title: 'text-green-900 dark:text-green-200',
      text: 'text-green-800 dark:text-green-300',
      icon: '✅',
    },
  };

  const style = styles[type];

  return (
    <div className={`rounded-lg border p-4 ${style.container}`}>
      {title && (
        <div className={`flex items-center space-x-2 font-semibold mb-2 ${style.title}`}>
          <span>{style.icon}</span>
          <span>{title}</span>
        </div>
      )}
      <div className={`text-sm ${style.text}`}>{children}</div>
    </div>
  );
}

function DefinitionList({ items }) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="flex items-start space-x-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <span className="text-2xl">{item.icon}</span>
          <div>
            <dt className="font-semibold text-slate-900 dark:text-white">
              {item.term}
            </dt>
            <dd className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {item.definition}
            </dd>
          </div>
        </div>
      ))}
    </div>
  );
}

function FeeTable({ fees }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-800">
            <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white rounded-tl-lg">
              Tipo
            </th>
            <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
              Taxa
            </th>
            <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white rounded-tr-lg">
              Descrição
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {fees.map((fee, index) => (
            <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                {fee.type}
              </td>
              <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400 font-semibold">
                {fee.rate}
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                {fee.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
          🏳️‍🌈 PrideConnect — Construindo um espaço seguro e inclusivo para a 
          comunidade LGBT+. 
        </p>

        <div className="flex items-center space-x-4 text-sm">
          <InternalLink to="/privacy">Política de Privacidade</InternalLink>
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

export default function TermsPage() {
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

          {/* 1. Aceitação */}
          <Section id="aceitacao" icon="✅" title="1. Aceitação dos Termos">
            <p>
              Ao acessar, navegar ou utilizar o PrideConnect ("Plataforma", "Serviço", 
              "nós", "nosso"), você ("Usuário", "você") declara que leu, compreendeu 
              e concorda em ficar vinculado a estes Termos de Uso ("Termos"). 
            </p>

            <p>
              Estes Termos constituem um acordo legal vinculante entre você e o 
              PrideConnect.  Se você não concorda com qualquer parte destes Termos, 
              não deve acessar ou usar a Plataforma.
            </p>

            <HighlightBox type="info" title="Acordo Vinculante">
              O uso continuado da Plataforma após quaisquer alterações nestes 
              Termos constitui sua aceitação das modificações. É sua responsabilidade 
              revisar periodicamente estes Termos. 
            </HighlightBox>
          </Section>

          {/* 2. Definições */}
          <Section id="definicoes" icon="📖" title="2. Definições">
            <p>
              Para fins destes Termos, os seguintes termos têm os significados 
              indicados:
            </p>

            <DefinitionList
              items={[
                {
                  icon: '🌐',
                  term: 'Plataforma',
                  definition: 'O website, aplicativos, APIs e todos os serviços relacionados ao PrideConnect.',
                },
                {
                  icon: '👤',
                  term: 'Usuário',
                  definition: 'Qualquer pessoa que acessa ou utiliza a Plataforma, incluindo Assinantes e Criadores.',
                },
                {
                  icon: '⭐',
                  term: 'Assinante',
                  definition: 'Usuário que paga para acessar conteúdo exclusivo de Criadores.',
                },
                {
                  icon: '🎨',
                  term: 'Criador',
                  definition: 'Usuário que produz e disponibiliza conteúdo na Plataforma mediante remuneração.',
                },
                {
                  icon: '📸',
                  term: 'Conteúdo',
                  definition: 'Qualquer material publicado na Plataforma, incluindo textos, fotos, vídeos, áudios e mensagens.',
                },
                {
                  icon: '💎',
                  term: 'Conteúdo PPV',
                  definition: 'Conteúdo pay-per-view vendido individualmente, além da assinatura regular.',
                },
                {
                  icon: '💰',
                  term: 'Gorjeta (Tip)',
                  definition: 'Pagamento voluntário enviado por Assinantes aos Criadores como forma de apoio adicional.',
                },
              ]}
            />
          </Section>

          {/* 3.  Elegibilidade */}
          <Section id="elegibilidade" icon="🔞" title="3. Elegibilidade e Verificação de Idade">
            <p>
              Para usar o PrideConnect, você deve atender aos seguintes requisitos:
            </p>

            <BulletList
              items={[
                <><strong>Idade mínima:</strong> Ter pelo menos 18 anos de idade ou a maioridade legal em sua jurisdição, o que for maior. </>,
                <><strong>Capacidade legal:</strong> Possuir capacidade legal para celebrar contratos vinculantes.</>,
                <><strong>Jurisdição:</strong> Residir em uma jurisdição onde o acesso a conteúdo adulto seja legal.</>,
                <><strong>Veracidade:</strong> Fornecer informações verdadeiras e precisas durante o cadastro.</>,
              ]}
            />

            <HighlightBox type="danger" title="Proibição Absoluta">
              O acesso por menores de 18 anos é estritamente proibido. Implementamos 
              verificação de idade na entrada da Plataforma.  Se descobrirmos que um 
              usuário é menor de idade, sua conta será imediatamente encerrada e 
              as autoridades competentes poderão ser notificadas.
            </HighlightBox>

            <SubSection title="3.1 Verificação de Idade">
              <p>
                Ao criar uma conta ou acessar a Plataforma, você declara e garante que:
              </p>
              <NumberedList
                items={[
                  'Possui 18 anos completos ou mais;',
                  'A data de nascimento informada é verdadeira;',
                  'Compreende que a Plataforma contém conteúdo adulto;',
                  'Assume total responsabilidade por declarações falsas.',
                ]}
              />
            </SubSection>
          </Section>

          {/* 4. Conta */}
          <Section id="conta" icon="👤" title="4. Sua Conta">
            <SubSection title="4.1 Criação de Conta">
              <p>
                Para acessar recursos completos da Plataforma, você deve criar uma 
                conta fornecendo:
              </p>
              <BulletList
                items={[
                  'Endereço de e-mail válido e acessível;',
                  'Nome de usuário único (username);',
                  'Senha segura (mínimo 8 caracteres, com letras e números);',
                  'Data de nascimento para verificação de idade;',
                  'Concordância com estes Termos e Política de Privacidade.',
                ]}
              />
            </SubSection>

            <SubSection title="4.2 Segurança da Conta">
              <p>Você é responsável por:</p>
              <BulletList
                items={[
                  'Manter a confidencialidade de suas credenciais de acesso;',
                  'Todas as atividades realizadas em sua conta;',
                  'Notificar imediatamente sobre uso não autorizado;',
                  'Não compartilhar sua conta com terceiros;',
                  'Manter suas informações de contato atualizadas.',
                ]}
              />
            </SubSection>

            <SubSection title="4.3 Uma Conta por Pessoa">
              <p>
                Cada pessoa pode manter apenas uma conta na Plataforma.  Contas 
                múltiplas podem ser encerradas sem aviso prévio.  Criadores podem 
                ter uma conta pessoal convertida em conta de criador.
              </p>
            </SubSection>
          </Section>

          {/* 5. Assinantes */}
          <Section id="assinantes" icon="⭐" title="5.  Regras para Assinantes">
            <p>
              Como Assinante do PrideConnect, você concorda com as seguintes regras:
            </p>

            <SubSection title="5.1 Direitos do Assinante">
              <BulletList
                items={[
                  'Acessar conteúdo exclusivo dos Criadores que você assina;',
                  'Enviar mensagens para Criadores (conforme configurações do criador);',
                  'Enviar gorjetas e comprar conteúdo PPV;',
                  'Curtir, comentar e interagir com o conteúdo permitido;',
                  'Cancelar assinaturas a qualquer momento.',
                ]}
              />
            </SubSection>

            <SubSection title="5.2 Obrigações do Assinante">
              <BulletList
                items={[
                  <><strong>Não redistribuir:</strong> É proibido copiar, baixar, gravar, compartilhar ou redistribuir conteúdo de Criadores;</>,
                  <><strong>Respeito:</strong> Tratar Criadores e outros usuários com respeito e dignidade;</>,
                  <><strong>Não assédio:</strong> Não enviar mensagens ofensivas, ameaçadoras ou não solicitadas;</>,
                  <><strong>Pagamentos legítimos:</strong> Utilizar apenas meios de pagamento legítimos e autorizados;</>,
                  <><strong>Não solicitar:</strong> Não solicitar conteúdo ilegal ou que viole estes Termos.</>,
                ]}
              />
            </SubSection>

            <HighlightBox type="warning" title="Redistribuição de Conteúdo">
              A redistribuição não autorizada de conteúdo de Criadores é uma 
              violação grave que resultará em banimento permanente e possíveis 
              ações legais. Respeitamos e protegemos os direitos dos Criadores.
            </HighlightBox>
          </Section>

          {/* 6. Criadores */}
          <Section id="criadores" icon="🎨" title="6. Regras para Criadores">
            <p>
              Como Criador no PrideConnect, você possui direitos e responsabilidades 
              adicionais:
            </p>

            <SubSection title="6.1 Requisitos para Criadores">
              <BulletList
                items={[
                  'Ter pelo menos 18 anos de idade;',
                  'Completar verificação de identidade (KYC) quando solicitado;',
                  'Fornecer informações bancárias/PIX válidas para recebimento;',
                  'Manter informações fiscais atualizadas quando aplicável;',
                  'Concordar com os termos específicos para criadores.',
                ]}
              />
            </SubSection>

            <SubSection title="6. 2 Direitos do Criador">
              <BulletList
                items={[
                  'Definir preços de assinatura dentro dos limites da Plataforma;',
                  'Publicar conteúdo em conformidade com as diretrizes;',
                  'Receber pagamentos por assinaturas, PPV e gorjetas;',
                  'Bloquear usuários específicos de acessar seu conteúdo;',
                  'Solicitar remoção de conteúdo redistribuído ilegalmente.',
                ]}
              />
            </SubSection>

            <SubSection title="6.3 Responsabilidades do Criador">
              <BulletList
                items={[
                  <><strong>Conteúdo próprio:</strong> Publicar apenas conteúdo que você criou ou tem direitos de publicar;</>,
                  <><strong>Consentimento:</strong> Obter consentimento de todas as pessoas que aparecem em seu conteúdo;</>,
                  <><strong>Legalidade:</strong> Garantir que seu conteúdo cumpre todas as leis aplicáveis;</>,
                  <><strong>Tributação:</strong> Cumprir obrigações fiscais relacionadas aos seus ganhos;</>,
                  <><strong>Comunicação:</strong> Responder assinantes dentro de prazos razoáveis. </>,
                ]}
              />
            </SubSection>

            <HighlightBox type="success" title="Proteção ao Criador">
              O PrideConnect oferece ferramentas de proteção incluindo: marca 
              d'água automática, detecção de vazamentos, sistema DMCA, bloqueio 
              por região e moderação de comentários. 
            </HighlightBox>
          </Section>

          {/* 7. Diretrizes de Conteúdo */}
          <Section id="conteudo" icon="📸" title="7. Diretrizes de Conteúdo">
            <p>
              Todo conteúdo publicado na Plataforma deve seguir estas diretrizes:
            </p>

            <SubSection title="7.1 Conteúdo Permitido">
              <BulletList
                items={[
                  'Fotos e vídeos de adultos consentidores (18+);',
                  'Conteúdo artístico, sensual e erótico;',
                  'Nudez adulta consensual;',
                  'Conteúdo fetichista legal entre adultos;',
                  'Lives e transmissões ao vivo (seguindo regras específicas);',
                  'Mensagens e interações respeitosas.',
                ]}
              />
            </SubSection>

            <SubSection title="7.2 Requisitos Técnicos">
              <BulletList
                items={[
                  'Formatos suportados: JPG, PNG, GIF, MP4, MOV, WEBM;',
                  'Tamanho máximo por arquivo: 2GB para vídeos, 50MB para imagens;',
                  'Resolução recomendada: mínimo 720p para vídeos;',
                  'Conteúdo deve ser de qualidade razoável e visualizável.',
                ]}
              />
            </SubSection>
          </Section>

          {/* 8. Conteúdo Proibido */}
          <Section id="proibido" icon="🚫" title="8. Conteúdo Proibido">
            <p>
              Os seguintes tipos de conteúdo são <strong>estritamente proibidos</strong> 
              e resultarão em ação imediata:
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              {[
                { icon: '👶', title: 'Menores de idade', desc: 'Qualquer conteúdo envolvendo pessoas menores de 18 anos.' },
                { icon: '⛓️', title: 'Não-consensual', desc: 'Conteúdo sem consentimento de todos os envolvidos.' },
                { icon: '🩸', title: 'Violência extrema', desc: 'Gore, mutilação, tortura real ou violência gráfica.' },
                { icon: '🐾', title: 'Bestialidade', desc: 'Conteúdo sexual envolvendo animais.' },
                { icon: '☠️', title: 'Necrofilia', desc: 'Conteúdo envolvendo cadáveres ou simulação.' },
                { icon: '💉', title: 'Drogas ilegais', desc: 'Promoção ou venda de substâncias ilegais.' },
                { icon: '🔫', title: 'Armas/Terrorismo', desc: 'Promoção de violência, terrorismo ou armas.' },
                { icon: '😡', title: 'Discurso de ódio', desc: 'Discriminação, racismo, homofobia, transfobia.' },
                { icon: '💸', title: 'Fraude/Golpes', desc: 'Esquemas fraudulentos ou enganosos.' },
                { icon: '🎭', title: 'Personificação', desc: 'Fingir ser outra pessoa ou roubo de identidade.' },
                { icon: '🔒', title: 'Dados privados', desc: 'Compartilhamento de informações pessoais de terceiros.' },
                { icon: '⚖️', title: 'Conteúdo ilegal', desc: 'Qualquer conteúdo que viole leis aplicáveis.' },
              ]. map((item) => (
                <div
                  key={item.title}
                  className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h4 className="font-semibold text-red-900 dark:text-red-200">
                      {item.title}
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <HighlightBox type="danger" title="Tolerância Zero">
              <p>
                Violações de conteúdo proibido resultarão em:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Remoção imediata do conteúdo;</li>
                <li>Suspensão ou banimento permanente da conta;</li>
                <li>Retenção de quaisquer fundos pendentes;</li>
                <li>Comunicação às autoridades competentes quando aplicável;</li>
                <li>Possíveis ações legais civis e criminais.</li>
              </ul>
            </HighlightBox>
          </Section>

          {/* 9. Pagamentos */}
          <Section id="pagamentos" icon="💰" title="9.  Pagamentos e Taxas">
            <SubSection title="9.1 Métodos de Pagamento">
              <p>Aceitamos os seguintes métodos de pagamento:</p>
              <BulletList
                items={[
                  <><strong>Criptomoedas:</strong> Bitcoin (BTC), Ethereum (ETH), USDT, USDC, Litecoin (LTC), Monero (XMR) e outras;</>,
                  <><strong>PIX:</strong> Pagamentos instantâneos para usuários brasileiros;</>,
                  <><strong>Cartão de crédito:</strong> Via processadores terceirizados (quando disponível). </>,
                ]}
              />
            </SubSection>

            <SubSection title="9.2 Taxas da Plataforma">
              <FeeTable
                fees={[
                  { type: 'Assinaturas', rate: '20%', description: 'Taxa sobre assinaturas mensais' },
                  { type: 'Conteúdo PPV', rate: '20%', description: 'Taxa sobre vendas pay-per-view' },
                  { type: 'Gorjetas (Tips)', rate: '20%', description: 'Taxa sobre gorjetas recebidas' },
                  { type: 'Mensagens Pagas', rate: '20%', description: 'Taxa sobre mensagens PPV' },
                  { type: 'Saque (Crypto)', rate: '$2 + rede', description: 'Taxa fixa + fee da blockchain' },
                  { type: 'Saque (PIX)', rate: '$2', description: 'Taxa fixa por saque' },
                ]}
              />
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
                * Taxas sujeitas a alteração com aviso prévio de 30 dias.  Taxas de 
                rede blockchain variam conforme congestionamento.
              </p>
            </SubSection>

            <SubSection title="9.3 Política de Reembolso">
              <BulletList
                items={[
                  'Assinaturas: Não reembolsáveis após acesso ao conteúdo;',
                  'Conteúdo PPV: Não reembolsável após visualização;',
                  'Gorjetas: Não reembolsáveis;',
                  'Disputas: Analisadas caso a caso pela equipe de suporte;',
                  'Chargebacks fraudulentos resultarão em banimento.',
                ]}
              />
            </SubSection>

            <HighlightBox type="info" title="Discrição nos Pagamentos">
              Nossos pagamentos aparecem de forma discreta em extratos bancários 
              e faturas de cartão.  Para máxima privacidade, recomendamos o uso 
              de criptomoedas, especialmente Monero (XMR).
            </HighlightBox>
          </Section>

          {/* 10. Saques */}
          <Section id="saques" icon="🏦" title="10. Saques (Criadores)">
            <SubSection title="10.1 Requisitos para Saque">
              <BulletList
                items={[
                  'Saldo mínimo disponível: $10 USD;',
                  'Verificação de identidade (KYC) completa;',
                  'Conta em situação regular (sem violações pendentes);',
                  'Período de retenção: 7 dias após confirmação do pagamento.',
                ]}
              />
            </SubSection>

            <SubSection title="10.2 Métodos de Saque">
              <BulletList
                items={[
                  <><strong>Criptomoedas:</strong> BTC, ETH, USDT, LTC, XMR e outras (processamento em 24h);</>,
                  <><strong>PIX:</strong> Disponível para criadores brasileiros (processamento em 24-48h);</>,
                  <><strong>Transferência bancária:</strong> Disponibilidade varia por região. </>,
                ]}
              />
            </SubSection>

            <SubSection title="10.3 Retenção de Fundos">
              <p>Podemos reter fundos em caso de:</p>
              <BulletList
                items={[
                  'Suspeita de fraude ou atividade irregular;',
                  'Violações pendentes de investigação;',
                  'Disputas ou chargebacks em andamento;',
                  'Solicitações de autoridades competentes;',
                  'Violação dos Termos de Uso.',
                ]}
              />
            </SubSection>
          </Section>

          {/* 11. Propriedade Intelectual */}
          <Section id="propriedade" icon="©️" title="11. Propriedade Intelectual">
            <SubSection title="11.1 Conteúdo da Plataforma">
              <p>
                O PrideConnect e todo o seu conteúdo original (design, código, 
                logotipos, textos) são propriedade exclusiva da empresa e protegidos 
                por leis de propriedade intelectual.
              </p>
            </SubSection>

            <SubSection title="11.2 Conteúdo do Criador">
              <p>
                Criadores mantêm todos os direitos autorais sobre seu conteúdo.  Ao 
                publicar na Plataforma, você concede ao PrideConnect:
              </p>
              <BulletList
                items={[
                  'Licença não-exclusiva para hospedar e exibir seu conteúdo;',
                  'Direito de distribuir aos assinantes pagantes;',
                  'Permissão para criar thumbnails e previews;',
                  'Direito de usar em materiais promocionais (com consentimento adicional).',
                ]}
              />
            </SubSection>

            <SubSection title="11.3 Conteúdo do Usuário">
              <p>
                Ao publicar comentários, mensagens ou outro conteúdo, você concede 
                licença para seu uso na Plataforma. Você garante que possui direitos 
                sobre todo conteúdo que publica.
              </p>
            </SubSection>
          </Section>

          {/* 12.  DMCA */}
          <Section id="dmca" icon="⚖️" title="12.  DMCA e Direitos Autorais">
            <p>
              Respeitamos os direitos de propriedade intelectual e respondemos a 
              notificações de violação conforme o Digital Millennium Copyright Act 
              (DMCA) e legislações equivalentes.
            </p>

            <SubSection title="12. 1 Notificação de Violação">
              <p>
                Para reportar violação de direitos autorais, envie uma notificação 
                contendo:
              </p>
              <NumberedList
                items={[
                  'Identificação da obra protegida que foi violada;',
                  'Identificação do material infrator na Plataforma (URL);',
                  'Suas informações de contato (nome, e-mail, telefone);',
                  'Declaração de boa-fé de que o uso não é autorizado;',
                  'Declaração de precisão das informações, sob pena de perjúrio;',
                  'Assinatura física ou eletrônica do titular dos direitos.',
                ]}
              />
            </SubSection>

            <SubSection title="12.2 Contra-Notificação">
              <p>
                Se você acredita que seu conteúdo foi removido por engano, pode 
                enviar uma contra-notificação.  Consulte nossa página de 
                <InternalLink to="/support"> Suporte</InternalLink> para mais informações.
              </p>
            </SubSection>

            <HighlightBox type="info" title="Reincidência">
              Usuários que violarem repetidamente direitos autorais terão suas 
              contas encerradas permanentemente, conforme nossa política de 
              reincidência.
            </HighlightBox>
          </Section>

          {/* 13. Privacidade */}
          <Section id="privacidade" icon="🔒" title="13.  Privacidade e Dados">
            <p>
              Sua privacidade é importante para nós. O tratamento de seus dados 
              pessoais é regido pela nossa{' '}
              <InternalLink to="/privacy">Política de Privacidade</InternalLink>, 
              que faz parte integrante destes Termos. 
            </p>

            <BulletList
              items={[
                'Coletamos apenas dados necessários para operar a Plataforma;',
                'Utilizamos criptografia e medidas de segurança robustas;',
                'Não vendemos seus dados pessoais a terceiros;',
                'Você pode exercer seus direitos de privacidade a qualquer momento;',
                'Cumprimos a LGPD, GDPR e outras leis de proteção de dados.',
              ]}
            />
          </Section>

          {/* 14.  Conduta */}
          <Section id="conduta" icon="🤝" title="14. Código de Conduta">
            <p>
              O PrideConnect é um espaço inclusivo para a comunidade LGBT+. Esperamos 
              que todos os usuários mantenham um ambiente respeitoso:
            </p>

            <SubSection title="14.1 Comportamento Esperado">
              <BulletList
                items={[
                  'Tratar todos os usuários com respeito e dignidade;',
                  'Respeitar identidades de gênero e orientações sexuais;',
                  'Usar pronomes corretos quando conhecidos;',
                  'Manter comunicações construtivas e respeitosas;',
                  'Reportar violações através dos canais apropriados.',
                ]}
              />
            </SubSection>

            <SubSection title="14.2 Comportamento Proibido">
              <BulletList
                items={[
                  'Assédio, bullying ou intimidação de qualquer tipo;',
                  'Discriminação baseada em orientação, identidade, raça, etc. ;',
                  'Stalking ou contato não desejado persistente;',
                  'Ameaças de violência ou dano;',
                  'Doxxing (exposição de informações pessoais);',
                  'Spam, scam ou comportamento manipulativo.',
                ]}
              />
            </SubSection>

            <HighlightBox type="success" title="Comunidade Segura">
              Nosso objetivo é manter o PrideConnect como um espaço seguro e 
              acolhedor.  Violações do código de conduta serão tratadas com 
              seriedade e podem resultar em ação imediata.
            </HighlightBox>
          </Section>

          {/* 15. Suspensão */}
          <Section id="suspensao" icon="⛔" title="15. Suspensão e Encerramento">
            <SubSection title="15.1 Suspensão pela Plataforma">
              <p>Podemos suspender ou encerrar sua conta por:</p>
              <BulletList
                items={[
                  'Violação destes Termos de Uso;',
                  'Publicação de conteúdo proibido;',
                  'Comportamento fraudulento ou abusivo;',
                  'Solicitação de autoridades competentes;',
                  'Inatividade prolongada (após aviso);',
                  'Qualquer motivo a nosso critério razoável.',
                ]}
              />
            </SubSection>

            <SubSection title="15.2 Encerramento pelo Usuário">
              <p>
                Você pode encerrar sua conta a qualquer momento através das 
                configurações.  Ao encerrar:
              </p>
              <BulletList
                items={[
                  'Assinantes: Acesso continua até o fim do período pago;',
                  'Criadores: Deve solicitar saque de fundos disponíveis primeiro;',
                  'Conteúdo pode ser retido por período legal obrigatório;',
                  'Algumas informações podem ser mantidas para compliance.',
                ]}
              />
            </SubSection>

            <SubSection title="15.3 Efeitos do Encerramento">
              <BulletList
                items={[
                  'Perda de acesso à conta e conteúdo;',
                  'Assinaturas ativas serão canceladas;',
                  'Fundos pendentes seguem política de retenção;',
                  'Contas banidas não podem criar novas contas.',
                ]}
              />
            </SubSection>
          </Section>

          {/* 16. Isenção */}
          <Section id="isencao" icon="📋" title="16. Isenção de Garantias">
            <p>
              A PLATAFORMA É FORNECIDA "COMO ESTÁ" E "CONFORME DISPONÍVEL", SEM 
              GARANTIAS DE QUALQUER TIPO, EXPRESSAS OU IMPLÍCITAS. 
            </p>

            <p>Não garantimos que:</p>
            <BulletList
              items={[
                'A Plataforma estará sempre disponível ou livre de erros;',
                'Defeitos serão corrigidos em prazo específico;',
                'A Plataforma estará livre de vírus ou componentes nocivos;',
                'Os resultados obtidos serão precisos ou confiáveis;',
                'Qualquer conteúdo de terceiros seja preciso ou legal.',
              ]}
            />
          </Section>

          {/* 17. Responsabilidade */}
          <Section id="responsabilidade" icon="⚠️" title="17. Limitação de Responsabilidade">
            <p>
              NA MÁXIMA EXTENSÃO PERMITIDA POR LEI, O PRIDECONNECT NÃO SERÁ 
              RESPONSÁVEL POR DANOS INDIRETOS, INCIDENTAIS, ESPECIAIS, 
              CONSEQUENCIAIS OU PUNITIVOS, INCLUINDO:
            </p>

            <BulletList
              items={[
                'Perda de lucros, dados ou oportunidades de negócio;',
                'Interrupção de negócios ou serviços;',
                'Custos de aquisição de serviços substitutos;',
                'Danos decorrentes de conteúdo de terceiros;',
                'Danos decorrentes de acesso não autorizado.',
              ]}
            />

            <p>
              Nossa responsabilidade total não excederá o maior valor entre: 
              (a) valores pagos por você nos últimos 12 meses; ou (b) R$ 500,00. 
            </p>
          </Section>

          {/* 18. Indenização */}
          <Section id="indenizacao" icon="🛡️" title="18.  Indenização">
            <p>
              Você concorda em indenizar, defender e isentar o PrideConnect, seus 
              diretores, funcionários, agentes e parceiros de quaisquer 
              reivindicações, danos, perdas, custos e despesas (incluindo 
              honorários advocatícios) decorrentes de:
            </p>

            <BulletList
              items={[
                'Seu uso da Plataforma;',
                'Violação destes Termos por você;',
                'Violação de direitos de terceiros por você;',
                'Conteúdo que você publicar na Plataforma;',
                'Sua conduta em conexão com a Plataforma.',
              ]}
            />
          </Section>

          {/* 19. Disputas */}
          <Section id="disputas" icon="⚔️" title="19. Resolução de Disputas">
            <SubSection title="19.1 Negociação">
              <p>
                Antes de iniciar qualquer procedimento formal, as partes 
                concordam em tentar resolver disputas através de negociação 
                de boa-fé por um período mínimo de 30 dias. 
              </p>
            </SubSection>

            <SubSection title="19.2 Lei Aplicável">
              <p>
                Estes Termos são regidos pelas leis da República Federativa do 
                Brasil, independentemente de conflitos de disposições legais.
              </p>
            </SubSection>

            <SubSection title="19.3 Foro">
              <p>
                As partes elegem o foro da Comarca de São Paulo, Estado de São 
                Paulo, Brasil, para dirimir quaisquer controvérsias decorrentes 
                destes Termos, com exclusão de qualquer outro. 
              </p>
            </SubSection>

            <SubSection title="19.4 Arbitragem (Opcional)">
              <p>
                Disputas podem ser submetidas à arbitragem, a critério das 
                partes, conforme as regras da Câmara de Arbitragem aplicável.
              </p>
            </SubSection>
          </Section>

          {/* 20.  Alterações */}
          <Section id="alteracoes" icon="📝" title="20. Alterações nos Termos">
            <p>
              Reservamos o direito de modificar estes Termos a qualquer momento. 
              Mudanças entrarão em vigor após publicação na Plataforma.
            </p>

            <BulletList
              items={[
                'Notificaremos sobre mudanças significativas por e-mail ou na Plataforma;',
                'Mudanças menores podem ser feitas sem aviso prévio;',
                'Uso continuado após alterações constitui aceitação;',
                'Versões anteriores podem ser solicitadas via suporte;',
                'A data de "última atualização" sempre indicará a versão atual.',
              ]}
            />

            <HighlightBox type="info" title="Fique Informado">
              Recomendamos revisar estes Termos periodicamente.  Para mudanças 
              que afetem significativamente seus direitos, enviaremos notificação 
              com pelo menos 30 dias de antecedência. 
            </HighlightBox>
          </Section>

          {/* 21. Contato */}
          <Section id="contato" icon="📧" title="21. Contato">
            <p>
              Para dúvidas, sugestões ou preocupações sobre estes Termos, entre 
              em contato conosco:
            </p>

            <div className="mt-4 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800/50">
              <div className="grid sm:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                    📬 Suporte Geral
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Dúvidas, problemas e solicitações. 
                  </p>
                  <InternalLink to="/support">
                    Acessar Suporte →
                  </InternalLink>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                    🔒 Privacidade
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Questões sobre dados pessoais.
                  </p>
                  <InternalLink to="/privacy">
                    Ver Política →
                  </InternalLink>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                    ⚖️ DMCA/Legal
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Violações de direitos autorais. 
                  </p>
                  <InternalLink to="/support">
                    Reportar →
                  </InternalLink>
                </div>
              </div>
            </div>

            <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
              <strong>Tempo de resposta:</strong> Nosso objetivo é responder todas 
              as solicitações em até 5 dias úteis.  Questões urgentes relacionadas 
              a segurança ou conteúdo ilegal são priorizadas.
            </p>
          </Section>

          {/* Aceitação Final */}
          <div className="mt-10 p-6 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                ✅ Declaração de Aceitação
              </h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Ao criar uma conta, acessar ou usar o PrideConnect, você confirma 
                que leu, compreendeu e concorda com estes Termos de Uso em sua 
                totalidade.  Se você não concorda, não utilize a Plataforma.
              </p>
            </div>
          </div>

          <FooterNote />
        </article>
      </div>
    </div>
  );
}