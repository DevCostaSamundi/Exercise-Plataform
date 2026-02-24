import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useCryptoPayment, STEP_MESSAGES } from '../hooks/useCryptoPayment';
import {
    X,
    Wallet,
    Loader2,
    CheckCircle,
    XCircle,
    AlertCircle,
    ExternalLink,
    CreditCard,
    ArrowRight,
    ShieldCheck,
} from 'lucide-react';

/**
 * CryptoPaymentModal — FlowConnect
 *
 * Modal de pagamento crypto com UX amigável:
 * - Linguagem simples, sem jargão blockchain
 * - Troca de rede automática
 * - Suporte a fiat on-ramp (comprar com cartão)
 * - Feedback visual em tempo real
 */
export default function CryptoPaymentModal({
    isOpen,
    onClose,
    creator,
    amountUSD,
    type = 'SUBSCRIPTION',
    subscriptionId,
    postId,
    messageId,
    onSuccess,
}) {
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();

    const {
        processPayment,
        pollPaymentStatus,
        currentStep,
        error,
        loading,
        usdcBalance,
        stepMessage,
        getOnRampUrl,
        reset,
    } = useCryptoPayment();

    const [paymentResult, setPaymentResult] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [showOnRamp, setShowOnRamp] = useState(false);
    const [onRampLoading, setOnRampLoading] = useState(false);

    // Reset ao abrir/fechar
    useEffect(() => {
        if (!isOpen) {
            setPaymentResult(null);
            setPaymentStatus(null);
            setShowOnRamp(false);
            reset();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // ============================================
    // HANDLERS
    // ============================================

    const handlePayment = async () => {
        try {
            const result = await processPayment({
                creatorId: creator.id,
                type,
                amountUSD,
                subscriptionId,
                postId,
                messageId,
            });

            setPaymentResult(result);

            const finalStatus = await pollPaymentStatus(result.paymentId, (status) => {
                setPaymentStatus(status);
            });

            setTimeout(() => {
                if (onSuccess) onSuccess(finalStatus);
                onClose();
            }, 2500);

        } catch (err) {
            console.error('Payment error:', err);
        }
    };

    const handleBuyWithCard = async () => {
        setOnRampLoading(true);
        try {
            const url = await getOnRampUrl({
                provider: 'moonpay',
                amountUSD,
                walletAddress: address || '',
            });
            window.open(url, '_blank', 'width=500,height=700');
        } catch {
            // Fallback: abre Moonpay diretamente
            window.open(`https://buy.moonpay.com?currencyCode=usdc_polygon&baseCurrencyAmount=${amountUSD}`, '_blank');
        } finally {
            setOnRampLoading(false);
        }
    };

    const getExplorerUrl = (txHash) => {
        const isMainnet = import.meta.env.VITE_NETWORK === 'polygon';
        return `${isMainnet ? 'https://polygonscan.com' : 'https://amoy.polygonscan.com'}/tx/${txHash}`;
    };

    const isProcessing = loading || ['creating', 'checking', 'approving', 'paying', 'confirming'].includes(currentStep);

    // ============================================
    // COMPONENTES AUXILIARES
    // ============================================

    const AmountCard = () => (
        <div className="bg-black rounded-2xl p-5 text-white mb-6">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <p className="text-gray-400 text-sm mb-1">
                        {type === 'SUBSCRIPTION' && 'Assinatura mensal'}
                        {type === 'TIP' && 'Gorjeta'}
                        {type === 'PPV_POST' && 'Desbloquear conteúdo'}
                        {type === 'PPV_MESSAGE' && 'Desbloquear mensagem'}
                    </p>
                    <p className="text-4xl font-bold">${amountUSD.toFixed(2)}</p>
                    <p className="text-gray-400 text-sm mt-1">USDC · Polygon</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2">
                    <ShieldCheck size={24} className="text-white" />
                </div>
            </div>
            <div className="border-t border-white/10 pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-300">
                    <span>Criador recebe</span>
                    <span className="font-medium text-white">${(amountUSD * 0.9).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                    <span>Taxa da plataforma (10%)</span>
                    <span>${(amountUSD * 0.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                    <span>Taxa de rede</span>
                    <span>~$0,01</span>
                </div>
            </div>
        </div>
    );

    const StepIndicator = () => {
        if (currentStep === 'idle' || currentStep === 'error') return null;
        if (currentStep === 'success') return null;

        const steps = [
            { key: 'creating', label: 'Preparando' },
            { key: 'checking', label: 'Verificando' },
            { key: 'approving', label: 'Autorizando' },
            { key: 'paying', label: 'Pagando' },
            { key: 'confirming', label: 'Confirmando' },
        ];

        const currentIndex = steps.findIndex(s => s.key === currentStep);

        return (
            <div className="flex items-center justify-between mb-6 px-1">
                {steps.map((step, i) => (
                    <div key={step.key} className="flex items-center">
                        <div className={`flex flex-col items-center ${i <= currentIndex ? 'opacity-100' : 'opacity-30'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < currentIndex
                                ? 'bg-black text-white'
                                : i === currentIndex
                                    ? 'bg-black text-white ring-2 ring-black ring-offset-2'
                                    : 'bg-gray-200 text-gray-500'
                                }`}>
                                {i < currentIndex ? (
                                    <CheckCircle size={14} />
                                ) : (
                                    i === currentIndex && isProcessing ? (
                                        <Loader2 size={12} className="animate-spin" />
                                    ) : i + 1
                                )}
                            </div>
                            <span className="text-xs text-gray-500 mt-1 hidden sm:block">{step.label}</span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`h-px flex-1 mx-1 transition-all ${i < currentIndex ? 'bg-black' : 'bg-gray-200'}`} style={{ minWidth: 12 }} />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const StatusMessage = () => {
        if (currentStep === 'idle' || currentStep === 'error') return null;

        const msg = STEP_MESSAGES[currentStep];
        if (!msg?.title) return null;

        return (
            <div className={`rounded-xl p-4 mb-4 text-center ${currentStep === 'success' ? 'bg-gray-50' : 'bg-gray-50'}`}>
                {currentStep === 'success' ? (
                    <CheckCircle size={32} className="mx-auto mb-2 text-black" />
                ) : (
                    <Loader2 size={32} className="mx-auto mb-2 animate-spin text-black" />
                )}
                <p className="font-semibold text-gray-900">{msg.title}</p>
                <p className="text-sm text-gray-600 mt-1">{msg.description}</p>
                {msg.tip && (
                    <p className="text-xs text-gray-400 mt-2">{msg.tip}</p>
                )}
                {currentStep === 'confirming' && paymentResult?.txHash && (
                    <a
                        href={getExplorerUrl(paymentResult.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-black mt-2 underline"
                    >
                        Ver transação <ExternalLink size={10} />
                    </a>
                )}
            </div>
        );
    };

    // ============================================
    // RENDER PRINCIPAL
    // ============================================

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Pagar com Cripto</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Para {creator.displayName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <AmountCard />

                    {/* Indicador de etapas */}
                    {isProcessing && <StepIndicator />}

                    {/* Mensagem de status */}
                    <StatusMessage />

                    {/* SUCESSO */}
                    {currentStep === 'success' && (
                        <div className="text-center py-4">
                            <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={40} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                Tudo certo! 🎉
                            </h3>
                            <p className="text-gray-600">
                                Seu pagamento foi confirmado. O conteúdo já está disponível.
                            </p>
                            {paymentResult?.txHash && (
                                <a
                                    href={getExplorerUrl(paymentResult.txHash)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black mt-3 underline"
                                >
                                    Ver comprovante <ExternalLink size={12} />
                                </a>
                            )}
                        </div>
                    )}

                    {/* ERRO */}
                    {error && currentStep !== 'success' && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                            <div className="flex gap-3">
                                <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="font-medium text-red-800 text-sm">Não foi possível processar</p>
                                    <p className="text-red-600 text-xs mt-1">{error}</p>
                                    <button
                                        onClick={reset}
                                        className="text-xs text-red-700 underline mt-2 hover:text-red-900"
                                    >
                                        Tentar novamente
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ETAPA: Sem carteira */}
                    {currentStep === 'idle' && !isConnected && (
                        <div className="space-y-3">
                            <div className="bg-blue-50 rounded-xl p-4">
                                <div className="flex gap-3">
                                    <AlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
                                    <div className="text-sm">
                                        <p className="font-medium text-blue-900 mb-0.5">Primeira vez usando cripto?</p>
                                        <p className="text-blue-700 text-xs">
                                            Você vai precisar de uma carteira digital com USDC.{' '}
                                            <a href="/ajuda/crypto" className="underline">Saiba mais →</a>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Conectores de carteira */}
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Conectar carteira
                                </p>
                                {connectors.map((connector) => (
                                    <button
                                        key={connector.id}
                                        onClick={() => connect({ connector })}
                                        className="w-full flex items-center gap-3 p-3.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-900 transition-colors"
                                    >
                                        <Wallet size={18} className="text-gray-600" />
                                        {connector.name}
                                        <ArrowRight size={16} className="ml-auto text-gray-400" />
                                    </button>
                                ))}
                            </div>

                            {/* Divisor */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-xs text-gray-400">ou</span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>

                            {/* Comprar com cartão */}
                            <button
                                onClick={handleBuyWithCard}
                                disabled={onRampLoading}
                                className="w-full flex items-center gap-3 p-3.5 border-2 border-gray-200 hover:border-gray-400 rounded-xl text-sm font-medium text-gray-700 transition-colors"
                            >
                                <CreditCard size={18} className="text-gray-500" />
                                {onRampLoading ? 'Carregando...' : 'Comprar USDC com cartão ou PIX'}
                                <ArrowRight size={16} className="ml-auto text-gray-400" />
                            </button>
                        </div>
                    )}

                    {/* ETAPA: Carteira conectada, pronto para pagar */}
                    {currentStep === 'idle' && isConnected && (
                        <div className="space-y-4">
                            {/* Info da carteira */}
                            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                                        <Wallet size={14} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Carteira conectada</p>
                                        <p className="text-sm font-mono font-medium text-gray-900">
                                            {address?.slice(0, 6)}...{address?.slice(-4)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {usdcBalance !== null && (
                                        <p className="text-sm font-medium text-gray-900">
                                            ${usdcBalance.toFixed(2)}
                                        </p>
                                    )}
                                    <button
                                        onClick={() => disconnect()}
                                        className="text-xs text-gray-400 hover:text-gray-600"
                                    >
                                        Trocar
                                    </button>
                                </div>
                            </div>

                            {/* Aviso de saldo insuficiente */}
                            {usdcBalance !== null && usdcBalance < amountUSD && (
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5">
                                    <div className="flex gap-2">
                                        <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="font-medium text-amber-800">Saldo insuficiente</p>
                                            <p className="text-amber-700 text-xs mt-0.5">
                                                Você precisa de mais ${(amountUSD - usdcBalance).toFixed(2)} USDC.
                                            </p>
                                            <button
                                                onClick={handleBuyWithCard}
                                                className="text-xs text-amber-800 underline mt-1"
                                            >
                                                Comprar USDC agora →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* O que esperar */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs font-medium text-gray-500 mb-2.5 uppercase tracking-wide">
                                    O que vai acontecer
                                </p>
                                <div className="space-y-2">
                                    {[
                                        'O MetaMask vai pedir sua confirmação',
                                        'Pagamento processado em menos de 30 segundos',
                                        'Conteúdo liberado automaticamente',
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                            <div className="w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">
                                                {i + 1}
                                            </div>
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Botão de pagamento */}
                            <button
                                onClick={handlePayment}
                                disabled={loading || (usdcBalance !== null && usdcBalance < amountUSD)}
                                className="w-full py-4 bg-black hover:bg-gray-900 disabled:bg-gray-300 text-white rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        Pagar ${amountUSD.toFixed(2)} USDC
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>

                            <p className="text-center text-xs text-gray-400">
                                🔒 Pagamento seguro via Polygon · Sem intermediários
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}