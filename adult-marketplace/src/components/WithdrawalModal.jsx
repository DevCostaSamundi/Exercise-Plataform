import { useState, useEffect } from 'react';
import paymentService from '../services/paymentService';
import withdrawalService from '../services/withdrawalService';

export default function WithdrawalModal({ isOpen, onClose, availableBalance, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Amount, 2: Select crypto, 3: Address, 4: Confirm
  const [amount, setAmount] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [address, setAddress] = useState('');
  const [currencies, setCurrencies] = useState([]);
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const minWithdrawal = 10;
  const platformFee = 2;

  useEffect(() => {
    if (isOpen) {
      fetchCurrencies();
    }
  }, [isOpen]);

  const fetchCurrencies = async () => {
    try {
      const response = await paymentService.getAvailableCurrencies();
      const cryptoOnly = response.data.filter(c => !c.fiat);
      setCurrencies(cryptoOnly);
    } catch (err) {
      setError('Erro ao carregar moedas');
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const handleContinueAmount = () => {
    const amountNum = parseFloat(amount);

    if (!amountNum || amountNum < minWithdrawal) {
      setError(`Valor mínimo de saque: $${minWithdrawal}`);
      return;
    }

    if (amountNum > availableBalance) {
      setError(`Saldo insuficiente.  Disponível: $${availableBalance.toFixed(2)}`);
      return;
    }

    setStep(2);
  };

  const handleSelectCrypto = async (crypto) => {
    setSelectedCrypto(crypto);
    setLoading(true);
    setError(null);

    try {
      const netAmount = parseFloat(amount) - platformFee;
      const estimateResponse = await paymentService.estimatePrice(netAmount, crypto.code);
      setEstimate(estimateResponse.data);
      setStep(3);
    } catch (err) {
      setError('Erro ao estimar valor em cripto');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAddress = () => {
    if (!address || address.trim().length < 20) {
      setError('Endereço inválido');
      return;
    }

    setStep(4);
  };

  const handleConfirmWithdrawal = async () => {
    setLoading(true);
    setError(null);

    try {
      await withdrawalService.requestWithdrawal({
        amountUSD: parseFloat(amount),
        cryptoCurrency: selectedCrypto.code,
        destinationAddress: address.trim(),
      });

      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Erro ao solicitar saque');
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {step === 1 && '💸 Sacar Ganhos'}
              {step === 2 && '💰 Escolha a Criptomoeda'}
              {step === 3 && '📍 Endereço da Carteira'}
              {step === 4 && '✅ Confirmar Saque'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Saldo disponível: {formatCurrency(availableBalance)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4. 293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111. 414 1.414L11. 414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11. 414l-4.293 4. 293a1 1 0 01-1.414-1. 414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-slate-900 dark:bg-slate-900/20 border border-red-200 dark:border-red-800 text-slate-900 dark:text-slate-900 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Step 1: Enter Amount */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Valor do Saque
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">$</span>
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-slate-500">Mínimo: ${minWithdrawal}</p>
                  <button
                    onClick={() => setAmount(availableBalance.toFixed(2))}
                    className="text-sm text-black dark:text-black hover:underline font-medium"
                  >
                    Usar saldo total
                  </button>
                </div>
              </div>

              {/* Quick amounts */}
              <div className="grid grid-cols-4 gap-2">
                {[20, 50, 100, 200].map((value) => (
                  <button
                    key={value}
                    onClick={() => setAmount(value.toString())}
                    disabled={value > availableBalance}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold hover:bg-black dark:hover:bg-black/20 hover:border-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ${value}
                  </button>
                ))}
              </div>

              {/* Fee breakdown */}
              {amount && parseFloat(amount) >= minWithdrawal && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Valor solicitado:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {formatCurrency(parseFloat(amount))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Taxa da plataforma:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-900">
                      -{formatCurrency(platformFee)}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">Você receberá:</span>
                    <span className="font-bold text-xl text-slate-800 dark:text-slate-800">
                      {formatCurrency(parseFloat(amount) - platformFee)}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleContinueAmount}
                disabled={!amount || parseFloat(amount) < minWithdrawal}
                className="w-full px-6 py-4 bg-black hover:bg-black disabled:bg-slate-400 text-white rounded-lg font-bold transition-colors"
              >
                Continuar
              </button>
            </div>
          )}

          {/* Step 2: Select Cryptocurrency */}
          {step === 2 && (
            <div className="space-y-3">
              {currencies.map((crypto) => (
                <button
                  key={crypto.code}
                  onClick={() => handleSelectCrypto(crypto)}
                  disabled={loading}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left hover:border-black dark:hover:border-black hover:shadow-lg ${crypto.recommended
                      ? 'border-black dark:border-white bg-black dark:bg-black/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{crypto.icon}</div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {crypto.name}
                          </p>
                          {crypto.recommended && (
                            <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full font-semibold">
                              Recomendado
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {crypto.network}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              <button
                onClick={() => setStep(1)}
                className="w-full px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Voltar
              </button>
            </div>
          )}

          {/* Step 3: Enter Address */}
          {step === 3 && estimate && (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Você receberá:</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {estimate.estimatedAmount} {selectedCrypto.code.split('_')[0]}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  ≈ {formatCurrency(estimate.amountUSD)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Endereço da Carteira ({selectedCrypto.network})
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={`Digite seu endereço ${selectedCrypto.code.split('_')[0]}`}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
                <p className="text-xs text-slate-500 mt-2">
                  ⚠️ Certifique-se de que o endereço está correto.  Transações de cripto não podem ser revertidas.
                </p>
              </div>

              <div className="bg-slate-600 dark:bg-slate-600/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600 dark:text-slate-600 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8. 257 3.099c.765-1. 36 2.722-1. 36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-600">
                      Importante
                    </p>
                    <ul className="text-sm text-slate-600 dark:text-slate-600 mt-1 space-y-1">
                      <li>• Verifique que o endereço é da rede <strong>{selectedCrypto.network}</strong></li>
                      <li>• Envios para rede incorreta resultam em perda permanente</li>
                      <li>• O saque será processado em até 24 horas úteis</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleContinueAddress}
                  className="flex-1 px-6 py-3 bg-black hover:bg-black text-white rounded-lg font-bold transition-colors"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && estimate && (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Você receberá:</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {estimate.estimatedAmount} {selectedCrypto.code.split('_')[0]}
                    </p>
                    <p className="text-sm text-slate-500">≈ {formatCurrency(estimate.amountUSD)}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Criptomoeda:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {selectedCrypto.name} ({selectedCrypto.network})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Endereço:</span>
                    <span className="font-mono text-xs text-slate-900 dark:text-white">
                      {address.substring(0, 15)}...{address.substring(address.length - 10)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">Valor total:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {formatCurrency(parseFloat(amount))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Taxa:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-900">
                      -{formatCurrency(platformFee)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 dark:bg-slate-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-900 dark:text-slate-900 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101. 414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1. 414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8. 707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-900">
                      Atenção
                    </p>
                    <p className="text-sm text-slate-900 dark:text-slate-900 mt-1">
                      Verifique cuidadosamente todas as informações.  Transações de criptomoedas não podem ser canceladas ou revertidas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(3)}
                  disabled={loading}
                  className="flex-1 px-6 py-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleConfirmWithdrawal}
                  disabled={loading}
                  className="flex-1 px-6 py-4 bg-slate-900 hover:bg-slate-900 disabled:bg-slate-900 text-white rounded-lg font-bold transition-colors flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processando...</span>
                    </>
                  ) : (
                    <span>Confirmar Saque</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}