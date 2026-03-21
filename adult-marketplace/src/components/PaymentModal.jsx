import { useState, useEffect } from 'react';
import {
    X,
    Wallet,
    Loader2,
    AlertCircle,
    CheckCircle,
    ArrowRight,
    ExternalLink,
    Copy,
    CreditCard,
} from 'lucide-react';
import { useBalancePayment } from '../hooks/useBalancePayment';
import { useCryptoPayment } from '../hooks/useCryptoPayment';

/**
 * PaymentModal — FlowConnect
 * Modal unificado de pagamento (crypto via Web3Auth wallet)
 */
export default function PaymentModal({ isOpen, onClose, paymentData, onSuccess }) {
    const { balance: rawBalance, getBalance, payWithBalance } = useBalancePayment();
    const balance = Number(rawBalance) || 0;
    const cryptoPayment = useCryptoPayment();

    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    const isWalletConnected = cryptoPayment?.isConnected || false;
    const amountUSD = Number(paymentData?.amountUSD || 0);
    const userAddress = cryptoPayment?.userAddress || '';

    useEffect(() => {
        if (isOpen) {
            getBalance().catch(() => { });
            setError(null);
            setSuccess(false);
            setCopied(false);
        }
    }, [isOpen]);

    if (!isOpen || !paymentData) return null;

    const hasEnoughBalance = balance >= amountUSD;
    const missingAmount = Math.max(0, amountUSD - balance);

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

    const handleCryptoPayment = async () => {
        try {
            setProcessing(true);
            setError(null);

            const paymentResult = await cryptoPayment.processPayment(paymentData);

            setSuccess(true);
            setTimeout(() => {
                if (onSuccess) onSuccess(paymentResult);
                onClose();
            }, 2000);
        } catch (err) {
            setError(err.message || 'Não foi possível processar o pagamento.');
        } finally {
            setProcessing(false);
        }
    };

    const handleBalancePayment = async () => {
        try {
            setProcessing(true);
            setError(null);

            const result = await payWithBalance(paymentData);
            setSuccess(true);
            setTimeout(() => {
                if (onSuccess) onSuccess(result);
                onClose();
            }, 2000);
        } catch (err) {
            setError(err.message || 'Não foi possível processar o pagamento.');
        } finally {
            setProcessing(false);
        }
    };

    const copyAddress = () => {
        if (userAddress) {
            navigator.clipboard.writeText(userAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const openOnRamp = (provider) => {
        const amount = Math.ceil(missingAmount);
        const urls = {
            moonpay: `https://buy.moonpay.com?currencyCode=usdc_polygon&walletAddress=${userAddress}&baseCurrencyAmount=${amount}&colorCode=%239333ea`,
            ramp: `https://buy.ramp.network/?defaultAsset=USDC_POLYGON&userAddress=${userAddress}&fiatValue=${amount}&fiatCurrency=USD&hostAppName=FlowConnect`,
            transak: `https://global.transak.com/?cryptoCurrencyCode=USDC&network=polygon&walletAddress=${userAddress}&fiatAmount=${amount}&fiatCurrency=USD&themeColor=9333ea&hideMenu=true`,
            onramper: `https://buy.onramper.com/?mode=buy&onlyCryptos=usdc_polygon&wallets=usdc_polygon:${userAddress}&defaultAmount=${amount}&defaultFiat=USD&themeName=dark`,
        };
        window.open(urls[provider] || urls.moonpay, '_blank', 'width=500,height=700');
    };

    const cryptoStepMsg = cryptoPayment?.stepMessage?.title || '';

    const buttonText = () => {
        if (success) return 'Pagamento realizado!';
        if (processing && cryptoStepMsg) return cryptoStepMsg;
        if (processing) return 'Processando...';
        if (!hasEnoughBalance) return `Comprar USDC para pagar`;
        return `Pagar $${amountUSD.toFixed(2)} USDC`;
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
                        <p className="text-4xl font-bold">${amountUSD.toFixed(2)}</p>
                        <p className="text-gray-500 text-xs mt-2">USDC · Polygon · Seguro e instantâneo</p>
                    </div>

                    {/* Saldo disponível */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                        <span className="text-sm text-gray-600">Seu saldo</span>
                        <span className={`text-sm font-bold ${hasEnoughBalance ? 'text-green-600' : 'text-red-500'}`}>
                            ${balance.toFixed(2)} USDC
                        </span>
                    </div>

                    {/* Wallet conectada */}
                    {isWalletConnected && userAddress && (
                        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                            <span className="text-sm text-gray-600">Carteira</span>
                            <button onClick={copyAddress} className="flex items-center gap-1 text-sm font-mono text-gray-700 hover:text-black transition-colors">
                                {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                                {copied ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                        </div>
                    )}

                    {/* ============================================ */}
                    {/* SALDO INSUFICIENTE → OPÇÕES DE COMPRA */}
                    {/* ============================================ */}
                    {!hasEnoughBalance && !success && (
                        <div className="space-y-4">
                            {/* Aviso */}
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                                <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">Adicione fundos para continuar</p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Faltam <strong>${missingAmount.toFixed(2)}</strong> para completar o pagamento. Escolha como deseja adicionar:
                                    </p>
                                </div>
                            </div>

                            {/* Opções de compra */}
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Pagar com cartão de crédito</p>

                                {/* Moonpay */}
                                <button
                                    onClick={() => openOnRamp('moonpay')}
                                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all text-left group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                        M
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 text-sm">Moonpay</p>
                                        <p className="text-xs text-gray-500">Visa, Mastercard, Apple Pay</p>
                                    </div>
                                    <ExternalLink size={15} className="text-gray-300 group-hover:text-purple-500 transition-colors" />
                                </button>

                                {/* Ramp Network */}
                                <button
                                    onClick={() => openOnRamp('ramp')}
                                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50/50 transition-all text-left group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                        R
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 text-sm">Ramp</p>
                                        <p className="text-xs text-gray-500">Cartão, transferência bancária</p>
                                    </div>
                                    <ExternalLink size={15} className="text-gray-300 group-hover:text-green-500 transition-colors" />
                                </button>

                                {/* Transak */}
                                <button
                                    onClick={() => openOnRamp('transak')}
                                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                        T
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 text-sm">Transak</p>
                                        <p className="text-xs text-gray-500">Cartão, PIX, transferência</p>
                                    </div>
                                    <ExternalLink size={15} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                </button>

                                {/* Onramper (Agregador) */}
                                <button
                                    onClick={() => openOnRamp('onramper')}
                                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50/50 transition-all text-left group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                        O
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 text-sm">Onramper</p>
                                        <p className="text-xs text-gray-500">Compara preços · Vários métodos</p>
                                    </div>
                                    <ExternalLink size={15} className="text-gray-300 group-hover:text-orange-500 transition-colors" />
                                </button>
                            </div>

                            {/* Transferir de outra carteira */}
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Ou transferir de outra carteira</p>
                                <div className="p-3.5 rounded-xl border-2 border-gray-200 space-y-2.5">
                                    <p className="text-xs text-gray-600">Envie USDC (rede Polygon) para o endereço abaixo:</p>
                                    {userAddress && (
                                        <button
                                            onClick={copyAddress}
                                            className="w-full flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2.5 hover:bg-gray-200 transition-colors"
                                        >
                                            <span className="text-xs font-mono text-gray-700 truncate mr-2">
                                                {userAddress}
                                            </span>
                                            {copied ? (
                                                <span className="text-xs text-green-600 font-medium flex-shrink-0">Copiado!</span>
                                            ) : (
                                                <Copy size={14} className="text-gray-400 flex-shrink-0" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Verificar saldo */}
                            <button
                                onClick={() => getBalance().catch(() => { })}
                                className="w-full py-3 rounded-xl text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-100 transition-all"
                            >
                                🔄 Já adicionei fundos — verificar saldo
                            </button>
                        </div>
                    )}

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
                        <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex gap-3 items-center">
                            <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                            <div className="text-sm">
                                <p className="font-semibold text-gray-900">Pagamento confirmado!</p>
                                <p className="text-gray-600 text-xs mt-0.5">O conteúdo já está disponível.</p>
                            </div>
                        </div>
                    )}

                    {/* Botão principal — só aparece quando tem saldo */}
                    {!success && hasEnoughBalance && (
                        <div className="space-y-3">
                            <button
                                onClick={handleCryptoPayment}
                                disabled={processing || !isWalletConnected}
                                className="w-full py-4 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        {buttonText()}
                                    </>
                                ) : (
                                    <>
                                        {hasEnoughBalance ? <Wallet size={18} /> : <CreditCard size={18} />}
                                        {buttonText()}
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>

                            {/* Opção secundária: saldo interno */}
                            {hasEnoughBalance && (
                                <button
                                    onClick={handleBalancePayment}
                                    disabled={processing}
                                    className="w-full py-3 rounded-xl font-medium text-sm transition-all border-2 border-gray-200 hover:border-gray-300 text-gray-700 disabled:opacity-50"
                                >
                                    Pagar com saldo da conta (${balance.toFixed(2)})
                                </button>
                            )}
                        </div>
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