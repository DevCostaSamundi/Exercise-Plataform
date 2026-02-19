import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'What is Launchpad 2.0?',
      answer: 'Launchpad 2.0 is a decentralized token creation platform on Base Network. Create, trade, and earn yield from community tokens with bonding curve pricing and automatic liquidity.'
    },
    {
      question: 'How do I create a token?',
      answer: 'Connect your wallet, click "Launch Token", provide your token details (name, symbol, description), and pay the creation fee. Your token will be instantly deployed on Base Network with a bonding curve.'
    },
    {
      question: 'What is a bonding curve?',
      answer: 'A bonding curve is an automated pricing mechanism that increases token price as more tokens are bought, and decreases as tokens are sold. This ensures fair price discovery without traditional liquidity pools.'
    },
    {
      question: 'How does yield distribution work?',
      answer: 'Every buy/sell transaction incurs a 1% fee. This fee is automatically distributed to all token holders proportionally, creating passive income for long-term holders.'
    },
    {
      question: 'Is my liquidity safe?',
      answer: 'Yes. All liquidity is locked on-chain for 90 days minimum. Smart contracts are immutable and audited. No rug pulls are possible.'
    },
    {
      question: 'What networks are supported?',
      answer: 'Currently we support Base Sepolia (testnet) and will launch on Base Mainnet soon. All transactions use ETH for gas fees.'
    },
    {
      question: 'What wallets can I use?',
      answer: 'Any Web3 wallet including MetaMask, Coinbase Wallet, WalletConnect, Rainbow, and more. We use Web3Auth for easy social login as well.'
    },
    {
      question: 'Are there any fees?',
      answer: 'Token creation: ~$5-10 in ETH (gas fees). Trading: 1% fee on each transaction (distributed to holders). No hidden fees.'
    }
  ];

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <div className="flex-1 text-white p-4 md:p-8 pb-20 md:pb-8 overflow-x-hidden w-full md:w-auto">
        <div className="max-w-3xl mx-auto w-full">
          
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-3">
              <HelpCircle className="text-yellow-400" size={32} />
              <h1 className="text-5xl font-black">Help Center</h1>
            </div>
            <p className="text-gray-400 text-lg">
              Everything you need to know about Launchpad 2.0
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-800 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-900 transition-colors"
                >
                  <span className="font-bold text-lg">{faq.question}</span>
                  {openIndex === index ? (
                    <ChevronUp className="text-yellow-400 flex-shrink-0" size={24} />
                  ) : (
                    <ChevronDown className="text-gray-500 flex-shrink-0" size={24} />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-5 pb-5 text-gray-400 leading-relaxed border-t border-gray-900">
                    <p className="pt-4">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="mt-12 border border-gray-800 rounded-lg p-6 text-center">
            <h2 className="font-bold text-xl mb-2">Still need help?</h2>
            <p className="text-gray-400 mb-4">
              Join our community on Discord or send us an email
            </p>
            <div className="flex gap-3 justify-center">
              <a
                href="https://discord.gg/launchpad"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg font-bold"
              >
                Join Discord
              </a>
              <a
                href="mailto:support@launchpad.xyz"
                className="px-6 py-2.5 border border-gray-800 hover:border-gray-700 rounded-lg font-semibold"
              >
                Email Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
