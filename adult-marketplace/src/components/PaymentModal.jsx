import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import paymentService from '../services/paymentService';

export default function PaymentModal({
  isOpen,
  onClose,
  paymentData,
  onSuccess
}) {
  const [step, setStep] = useState(1);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [estimate, setEstimate] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(900);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Buscar moedas disponíveis
  useEffect(() => {
    if (isOpen) {
      fetchCurrencies();
    }

    // Cleanup ao fechar
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [isOpen]);

  // Polling para verificar status do pagamento
  useEffect(() => {
    if (payment && step === 3) {
      const interval = setInterval(async () => {
        try {
          const status = await paymentService.checkPaymentStatus(payment.paymentId);

          if (status.data.status === 'COMPLETED') {
            clearInterval(interval);
            setPollingInterval(null);
            onSuccess?.(status.data);
            onClose();
          } else if (['FAILED', 'EXPIRED', 'CANCELLED'].includes(status.data.status)) {
            clearInterval(interval);
            setPollingInterval(null);
            setError('Pagamento falhou ou expirou');
            setStep(1);
          }
        } catch (err) {
          console.error('Error checking payment status:', err);
        }
      }, 5000);

      setPollingInterval(interval);

      return () => {
        clearInterval(interval);
        setPollingInterval(null);
      };
    }
  }, [payment, step, onSuccess, onClose]);

  // Countdown timer
  useEffect(() => {
    if (step === 3 && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && step === 3) {
      setError('Pagamento expirado');
      setStep(1);
    }
  }, [step, timeLeft]);

  const fetchCurrencies = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getAvailableCurrencies();
      setCurrencies(response.data || []);
    } catch (err) {
      setError('Erro ao carregar moedas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCrypto = async (crypto) => {
    setSelectedCrypto(crypto);
    setLoading(true);
    setError(null);

    try {
      const estimateResponse = await paymentService.estimatePrice(
        paymentData.amountUSD,
        crypto.code
      );
      setEstimate(estimateResponse.data);
      setStep(2);
    } catch (err) {
      setError('Erro ao estimar preço');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await paymentService.createPayment({
        ...paymentData,
        cryptoCurrency: selectedCrypto.code,
      });

      console.log('✅ Payment created:', response.data);

      setPayment(response.data);
      setStep(3);

      // Calcular tempo restante em segundos
      const expiresAt = new Date(response.data.expiresAt);
      const now = new Date();
      const secondsLeft = Math.floor((expiresAt - now) / 1000);
      setTimeLeft(secondsLeft);
    } catch (err) {
      setError(err.message || 'Erro ao criar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = () => {
    if (payment?.address) {
      navigator.clipboard.writeText(payment.address);
      alert('Endereço copiado! ');
    }
  };

  const handleCopyAmount = () => {
    if (payment?.cryptoAmount) {
      navigator.clipboard.writeText(payment.cryptoAmount);
      alert('Valor copiado!');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {step === 1 && '💰 Escolha a Criptomoeda'}
              {step === 2 && '✅ Confirmar Pagamento'}
              {step === 3 && '⏳ Aguardando Pagamento'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Valor: ${paymentData.amountUSD.toFixed(2)} USD
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Step 1: Select Cryptocurrency */}
          {step === 1 && (
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : currencies.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Nenhuma moeda disponível
                </div>
              ) : (
                currencies.map((crypto) => (
                  <button
                    key={crypto.code}
                    onClick={() => handleSelectCrypto(crypto)}
                    disabled={loading}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${crypto.recommended
                      ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-slate-200 dark: border-slate-700 bg-white dark:bg-slate-800'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">{crypto.icon}</div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-bold text-slate-900 dark: text-white">
                              {crypto.name}
                            </p>
                            {crypto.recommended && (
                              <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-semibold">
                                Recomendado
                              </span>
                            )}
                            {crypto.privacy && (
                              <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full font-semibold">
                                Privado
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 dark: text-slate-400">
                            {crypto.network} • Min: ${crypto.minAmount}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 dark: text-slate-400">
                          ⏱️ {crypto.avgConfirmTime}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Step 2: Confirm Payment */}
          {step === 2 && estimate && (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Você vai pagar:</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {estimate.estimatedAmount} {selectedCrypto.code.split('_')[0]}
                    </p>
                    <p className="text-sm text-slate-500">≈ ${estimate.amountUSD} USD</p>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark: border-slate-700 pt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-600 dark:text-slate-400">Rede:</span>
                    <span className="font-medium text-slate-900 dark: text-white">
                      {selectedCrypto.network}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Tempo estimado:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {selectedCrypto.avgConfirmTime}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8. 257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-. 213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Importante
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Envie <strong>exatamente</strong> o valor indicado para a rede{' '}
                      <strong>{selectedCrypto.network}</strong>.  Valores diferentes podem não ser processados.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-3 border border-slate-200 dark: border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-bold transition-colors flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Gerando... </span>
                    </>
                  ) : (
                    <span>Continuar</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment Details (QR Code) */}
          {step === 3 && payment && (
            <div className="space-y-6">
              {/* Timer */}
              <div className="text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Tempo restante:
                </p>
                <p className={`text-4xl font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-indigo-600'}`}>
                  {formatTime(timeLeft)}
                </p>
              </div>

              {/* QR Code */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 flex flex-col items-center">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">
                  {selectedCrypto.code === 'PIX' ? 'Escaneie o QR Code PIX' : 'Escaneie o QR Code com sua carteira'}
                </p>

                {payment.qrCode || payment.qrCodeBase64 ? (
                  <div className="bg-white p-4 rounded-lg">
                    {payment.qrCodeBase64 ? (
                      <img
                        src={`data:image/png;base64,${payment.qrCodeBase64}`}
                        alt="QR Code"
                        className="w-64 h-64"
                      />
                    ) : (
                      <QRCodeSVG
                        value={payment.qrCode}
                        size={256}
                        level="H"
                        includeMargin
                      />
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-100 dark:bg-slate-900 p-8 rounded-lg">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      QR Code será gerado em instantes...
                    </p>
                  </div>
                )}
              </div>

              {/* Address/PIX Code */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {selectedCrypto.code === 'PIX' ? 'Código PIX Copia e Cola: ' : 'Endereço de Pagamento:'}
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={payment.address || 'Gerando... '}
                      readOnly
                      className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-sm"
                    />
                    <button
                      onClick={handleCopyAddress}
                      disabled={!payment.address}
                      className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-lg font-semibold transition-colors"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                {/* ✅ MOSTRAR VALOR EM BRL PARA PIX */}
                {selectedCrypto.code === 'PIX' ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Valor em Reais (BRL):
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={`R$ ${payment.cryptoAmount || (paymentData.amountUSD * 5.5).toFixed(2)}`}
                      readOnly
                      className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-lg font-bold"
              />
                      <button
                        onClick={handleCopyAmount}
                        className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Valor Exato:
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={`${payment.cryptoAmount || '.. .'} ${selectedCrypto.code.split('_')[0]}`}
                        readOnly
                        className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-lg font-bold"
                      />
                      <button
                        onClick={handleCopyAmount}
                        className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark: border-blue-800 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                      Aguardando seu pagamento...
                    </p>
                    <p className="text-sm text-blue-700 dark: text-blue-300 mt-1">
                      {selectedCrypto.code === 'PIX'
                        ? `Pague R$ ${payment.cryptoAmount || (paymentData.amountUSD * 5.5).toFixed(2)} via PIX`
                        : `Envie ${payment.cryptoAmount} ${selectedCrypto.code.split('_')[0]} para o endereço acima`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <p className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                  📋 Instruções:
                </p>
                <ol className="list-decimal list-inside text-sm text-slate-600 dark: text-slate-400 space-y-2">
                  {selectedCrypto.code === 'PIX' ? (
                    <>
                      <li>Abra o app do seu banco</li>
                      <li>Selecione <strong>PIX &gt; Pagar com QR Code</strong> ou <strong>Copia e Cola</strong></li>
                      <li>Escaneie o QR Code ou cole o código acima</li>
                      <li>Confirme o pagamento de <strong>R$ {payment.cryptoAmount || (paymentData.amountUSD * 5.5).toFixed(2)}</strong></li>
                      <li>Aguarde a confirmação (instantâneo)</li>
                    </>
                  ) : (
                    <>
                      <li>Abra sua carteira de criptomoedas</li>
                      <li>Selecione a rede <strong>{selectedCrypto.network}</strong></li>
                      <li>Envie <strong>exatamente</strong> {payment.cryptoAmount} {selectedCrypto.code.split('_')[0]}</li>
                      <li>Aguarde a confirmação (automático)</li>
                    </>
                  )}
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}