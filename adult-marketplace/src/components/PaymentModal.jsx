import { useState, useEffect } from 'react';
import {
    X,
    Wallet,
    CreditCard,
    Loader2,
    AlertCircle,
    CheckCircle,
    ArrowRight,
    ShoppingCart,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { useBalancePayment } from '../hooks/useBalancePayment';
import { useCryptoPayment } from '../hooks/useCryptoPayment';

/**
 * PaymentModal — FlowConnect
 * Modal unificado de pagamento (saldo, crypto ou cartão)
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - paymentData: { creatorId, type, amountUSD, subscriptionId?, postId?, messageId? }
 * - onSuccess: (result) => void
 */
export default function PaymentModal({ isOpen, onClose, paymentData, onSuccess }) {
    const { balance, getBalance, payWithBalance, loading: balanceLoading } = useBalancePayment();
    const cryptoPayment = useCryptoPayment();

    const [selectedMethod, setSelectedMethod] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [showCardOption, setShowCardOption] = useState(false);
    const [onRampLoading, setOnRampLoading] = useState(false);

    const isWalletConnected = cryptoPayment?.isConnected || false;

    // Carrega saldo ao abrir
    useEffect(() => {
        if (isOpen) {
            getBalance();
            setError(null);
            setSuccess(false);
            setSelectedMethod(null);
        }
    }, [isOpen]);

    // Seleciona método padrão baseado no saldo
    useEffect(() => {
        if (balance >= paymentData?.amountUSD) {
            setSelectedMethod('balance');
        } else {
            setSelectedMethod('crypto');
        }
    }, [balance, paymentData?.amountUSD]);

    if (!isOpen || !paymentData) return null;

    const hasEnoughBalance = balance >= paymentData.amountUSD;

    // ============================================
    // TÍTULO DO PAGAMENTO
    // ============================================

    const paymentTitle = {
        SUBSCRIPTION: 'Assinar criador',
        SUBSCRIPTION_RENEWAL: 'Renovar assinatura',
        TIP: 'Enviar gorjeta',
        PPV_MESSAGE: 'Desbloquear mensagem',
        PPV_POST: 'Desbloquear conteúdo',
    }[paymentData.type] || 'Concluir pagamento';

    // ============================================
    // HANDLERS
    // ============================================

    const handlePayment = async () => {
        if (!selectedMethod) return;

        try {
            setProcessing(true);
            setError(null);

            if (selectedMethod === 'balance') {
                const result = await payWithBalance(paymentData);
                setSuccess(true);
                setTimeout(() => {
                    if (onSuccess) onSuccess(result);
                    onClose();
                }, 2000);

            } else if (selectedMethod === 'crypto') {
                if (!isWalletConnected) {
                    await cryptoPayment.connectWallet();
                }

                const paymentResult = await cryptoPayment.processPayment(paymentData);
                const finalStatus = await cryptoPayment.pollPaymentStatus(
                    paymentResult.paymentId,
                    () => { }
                );

                setSuccess(true);
                setTimeout(() => {
                    if (onSuccess) onSuccess({ ...paymentResult, ...finalStatus });
                    onClose();
                }, 2000);
            }

        } catch (err) {
            setError(err.message || 'Não foi possível processar o pagamento. Tente novamente.');
        } finally {
            setProcessing(false);
        }
    };

    const handleBuyWithCard = async () => {
        setOnRampLoading(true);
        try {
            const url = await cryptoPayment.getOnRampUrl({
                provider: 'moonpay',
                amountUSD: paymentData.amountUSD,
                walletAddress: cryptoPayment.userAddress || '',
            });
            window.open(url, '_blank', 'width=500,height=700');
        } catch {
            window.open(
                `https://buy.moonpay.com?currencyCode=usdc_polygon&baseCurrencyAmount=${paymentData.amountUSD}`,
                '_blank'
            );
        } finally {
            setOnRampLoading(false);
        }
    };

    // Mensagem da etapa atual do crypto
    const cryptoStepMsg = cryptoPayment?.stepMessage?.title || '';

    // Botão desabilitado?
    const isButtonDisabled =
        processing ||
        success ||
        !selectedMethod ||
        (selectedMethod === 'balance' && !hasEnoughBalance) ||
        (selectedMethod === 'crypto' && balanceLoading);

    // Texto do botão
    const buttonText = () => {
        if (success) return 'Pagamento realizado!';
        if (processing && selectedMethod === 'crypto' && cryptoStepMsg) return cryptoStepMsg;
        if (processing) return 'Processando...';
        return `Pagar $${paymentData.amountUSD.toFixed(2)} USDC`;
    };

    // ============================================
    // RENDER
    // ============================================

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">{paymentTitle}</h2>
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">

                    {/* Valor */}
                    <div className="bg-black rounded-2xl p-5 text-white">
                        <p className="text-gray-400 text-sm mb-1">Valor total</p>
                        <p className="text-4xl font-bold">${paymentData.amountUSD.toFixed(2)}</p>
                        <p className="text-gray-500 text-xs mt-2">USDC · Polygon · Seguro e instantâneo</p>
                    </div>

                    {/* Saldo disponível */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                        <span className="text-sm text-gray-600">Seu saldo</span>
                        <span className={`text-sm font-bold ${hasEnoughBalance ? 'text-gray-900' : 'text-red-500'}`}>
                            ${balance.toFixed(2)} USDC
                        </span>
                    </div>

                    {/* Erro */}
                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3">
                            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                            <div className="text-sm">
                                <p className="font-medium text-red-800">Ops, algo deu errado</p>
                                <p className="text-red-600 text-xs mt-0.5">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Sucesso */}
                    {success && (
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex gap-3 items-center">
                            <CheckCircle className="text-black flex-shrink-0" size={20} />
                            <div className="text-sm">
                                <p className="font-semibold text-gray-900">Pagamento confirmado!</p>
                                <p className="text-gray-600 text-xs mt-0.5">O conteúdo já está disponível.</p>
                            </div>
                        </div>
                    )}

                    {/* Métodos de pagamento */}
                    {!success && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Forma de pagamento
                            </p>

                            {/* Opção: Saldo */}
                            <button
                                onClick={() => setSelectedMethod('balance')}
                                disabled={!hasEnoughBalance || processing}
                                className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${selectedMethod === 'balance'
                                    ? 'border-black bg-black/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                    } ${!hasEnoughBalance ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl ${selectedMethod === 'balance' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        <Wallet size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 text-sm">Saldo da conta</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {hasEnoughBalance
                                                ? 'Pagamento instantâneo'
                                                : `Faltam $${(paymentData.amountUSD - balance).toFixed(2)}`
                                            }
                                        </p>
                                    </div>
                                    {selectedMethod === 'balance' && (
                                        <CheckCircle size={18} className="text-black" />
                                    )}
                                </div>
                            </button>

                            {/* Opção: Carteira Crypto */}
                            <button
                                onClick={() => setSelectedMethod('crypto')}
                                disabled={processing}
                                className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${selectedMethod === 'crypto'
                                    ? 'border-black bg-black/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                    } cursor-pointer`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl ${selectedMethod === 'crypto' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        <CreditCard size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 text-sm">Carteira cripto (MetaMask)</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {isWalletConnected
                                                ? `Conectada: ${cryptoPayment.userAddress?.slice(0, 6)}...${cryptoPayment.userAddress?.slice(-4)}`
                                                : 'Pague com USDC direto da sua carteira'
                                            }
                                        </p>
                                    </div>
                                    {selectedMethod === 'crypto' && (
                                        <CheckCircle size={18} className="text-black" />
                                    )}
                                </div>
                            </button>

                            {/* Opção: Cartão (expansível) */}
                            <div className="border-2 border-gray-200 rounded-2xl overflow-hidden">
                                <button
                                    onClick={() => setShowCardOption(!showCardOption)}
                                    disabled={processing}
                                    className="w-full p-4 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="p-2.5 rounded-xl bg-gray-100 text-gray-500">
                                        <ShoppingCart size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 text-sm">Comprar USDC com cartão ou PIX</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Via Moonpay ou Transak</p>
                                    </div>
                                    {showCardOption ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                </button>

                                {showCardOption && (
                                    <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                                        <p className="text-xs text-gray-600 mb-3">
                                            Compre USDC com cartão de crédito ou PIX. O valor cai direto na sua carteira e você paga em seguida.
                                        </p>
                                        <button
                                            onClick={handleBuyWithCard}
                                            disabled={onRampLoading}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-black text-white rounded-xl text-sm font-medium"
                                        >
                                            {onRampLoading ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <>
                                                    Comprar USDC agora
                                                    <ArrowRight size={16} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Botão de confirmar */}
                    {!success && (
                        <button
                            onClick={handlePayment}
                            disabled={isButtonDisabled}
                            className="w-full py-4 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    {buttonText()}
                                </>
                            ) : (
                                <>
                                    {buttonText()}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    )}

                    {/* Rodapé */}
                    <p className="text-center text-xs text-gray-400">
                        🔒 Pagamento seguro · Sem dados bancários · Polygon
                    </p>
                </div>
            </div>
        </div>
    );
}