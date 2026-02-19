import { Shield, Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function SafetyPage() {
  const safetyFeatures = [
    {
      icon: Lock,
      title: 'Locked Liquidity',
      description: 'All liquidity is locked on-chain for 90 days minimum. Smart contracts ensure funds cannot be removed by creators.',
      color: 'text-green-400'
    },
    {
      icon: Shield,
      title: 'Audited Smart Contracts',
      description: 'All contracts are open-source and audited by leading security firms. Code is immutable and verified on BaseScan.',
      color: 'text-blue-400'
    },
    {
      icon: CheckCircle,
      title: 'Transparent On-Chain',
      description: 'Every transaction, balance, and contract action is publicly verifiable on the Base blockchain. No hidden mechanics.',
      color: 'text-yellow-400'
    }
  ];

  const bestPractices = [
    'Never share your private keys or seed phrase with anyone',
    'Always verify contract addresses on BaseScan before interacting',
    'Start with small amounts when trying a new token',
    'Use hardware wallets for large holdings',
    'Be wary of tokens with unrealistic promises or guaranteed returns',
    'Check token holder distribution before buying',
    'Join our Discord to report suspicious activity',
    'Enable 2FA on your email and wallet providers'
  ];

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <div className="flex-1 text-white p-4 md:p-8 pb-20 md:pb-8 overflow-x-hidden w-full md:w-auto">
        <div className="max-w-4xl mx-auto w-full">
          
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="text-yellow-400" size={32} />
              <h1 className="text-5xl font-black">Safety & Security</h1>
            </div>
            <p className="text-gray-400 text-lg">
              Your security is our top priority. Learn how we keep your funds safe.
            </p>
          </div>

          {/* Safety Features */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Platform Security Features</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {safetyFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
                  >
                    <Icon className={`${feature.color} mb-4`} size={40} />
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Best Practices */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Security Best Practices</h2>
            <div className="border border-gray-800 rounded-xl p-6">
              <div className="space-y-3">
                {bestPractices.map((practice, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-gray-300">{practice}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Warning Box */}
          <div className="border border-orange-800 bg-orange-950/20 rounded-xl p-6">
            <div className="flex gap-4">
              <AlertTriangle className="text-orange-400 flex-shrink-0" size={32} />
              <div>
                <h3 className="text-xl font-bold text-orange-400 mb-2">
                  Important Warning
                </h3>
                <p className="text-gray-300 leading-relaxed mb-3">
                  While our platform implements industry-leading security measures, cryptocurrency investments 
                  carry inherent risks. Token prices can be volatile, and you may lose some or all of your investment.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  <strong>Never invest more than you can afford to lose.</strong> Do your own research (DYOR) 
                  before buying any token. Launchpad 2.0 does not endorse or guarantee any specific token.
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 mb-4">
              Found a security vulnerability? Please report it immediately.
            </p>
            <a
              href="mailto:security@launchpad.xyz"
              className="inline-block px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg font-bold"
            >
              Report Security Issue
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
