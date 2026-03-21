/**
 * Linha de Transação para histórico
 * Exibe detalhes de uma transação
 */

import { useState } from 'react';
import { FiDownload, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { SiBitcoin } from 'react-icons/si';
import { FiCreditCard } from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { PAYMENT_METHODS, PAYMENT_STATUS, TRANSACTION_TYPES } from '../../config/constants';

const TransactionRow = ({ transaction }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case PAYMENT_STATUS.COMPLETED:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-300';
      case PAYMENT_STATUS.PENDING:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-400';
      case PAYMENT_STATUS.FAILED:
        return 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400';
      case PAYMENT_STATUS.REFUNDED:
        return 'bg-slate-100 text-slate-500 dark:bg-slate-800/30 dark:text-slate-500';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case PAYMENT_STATUS.COMPLETED:
        return 'Concluído';
      case PAYMENT_STATUS.PENDING:
        return 'Pendente';
      case PAYMENT_STATUS.FAILED:
        return 'Falhou';
      case PAYMENT_STATUS.REFUNDED:
        return 'Reembolsado';
      case PAYMENT_STATUS.CANCELLED:
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case TRANSACTION_TYPES.SUBSCRIPTION:
        return 'Assinatura';
      case TRANSACTION_TYPES.PPV_POST:
        return 'Post PPV';
      case TRANSACTION_TYPES.PPV_MESSAGE:
        return 'Mensagem PPV';
      case TRANSACTION_TYPES.TIP:
        return 'Gorjeta';
      default:
        return type;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case PAYMENT_METHODS.CRYPTO:
        return <SiBitcoin className="text-lg" />;
      case PAYMENT_METHODS.CREDIT_CARD:
        return <FiCreditCard className="text-lg" />;
      default:
        return null;
    }
  };

  const handleDownloadReceipt = () => {
    const date = new Date(transaction.createdAt);
    const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const amount = typeof transaction.amount === 'number' ? `$${transaction.amount.toFixed(2)}` : formatCurrency(transaction.amount);

    const receiptHTML = `
      <!DOCTYPE html>
      <html><head><title>Recibo - ${transaction._id || transaction.id}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; color: #1a1a1a; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 24px; }
        .header h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { font-size: 12px; color: #666; margin-top: 4px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .badge-ok { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .badge-pending { background: #fefce8; color: #854d0e; border: 1px solid #fde68a; }
        .badge-fail { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f1f1; font-size: 14px; }
        .row .label { color: #666; }
        .row .value { font-weight: 600; text-align: right; }
        .total { border-top: 2px solid #000; margin-top: 12px; padding-top: 12px; font-size: 18px; }
        .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #999; }
        @media print { body { padding: 20px; } }
      </style></head><body>
        <div class="header">
          <h1>FlowConnect</h1>
          <p>Recibo de Pagamento</p>
        </div>
        <div style="text-align: center; margin-bottom: 20px;">
          <span class="badge ${transaction.status === 'COMPLETED' ? 'badge-ok' : transaction.status === 'PENDING' ? 'badge-pending' : 'badge-fail'}">
            ${getStatusText(transaction.status)}
          </span>
        </div>
        <div class="row"><span class="label">ID da Transação</span><span class="value" style="font-family: monospace; font-size: 12px;">${transaction._id || transaction.id}</span></div>
        <div class="row"><span class="label">Data</span><span class="value">${formattedDate} às ${formattedTime}</span></div>
        <div class="row"><span class="label">Tipo</span><span class="value">${getTypeText(transaction.type)}</span></div>
        ${transaction.creator ? `<div class="row"><span class="label">Criador</span><span class="value">${transaction.creator.name || ''} ${transaction.creator.username ? '@' + transaction.creator.username : ''}</span></div>` : ''}
        <div class="row"><span class="label">Método</span><span class="value">${(transaction.paymentMethod || 'USDC').replace('_', ' ')}</span></div>
        ${transaction.txHash ? `<div class="row"><span class="label">Hash Blockchain</span><span class="value" style="font-family: monospace; font-size: 11px; max-width: 250px; word-break: break-all;">${transaction.txHash}</span></div>` : ''}
        <div class="row total"><span class="label">Total</span><span class="value">${amount} USDC</span></div>
        <div class="footer">
          <p>Este documento serve como comprovante de pagamento.</p>
          <p style="margin-top: 4px;">FlowConnect · Pagamentos descentralizados · Polygon Network</p>
        </div>
        <script>window.onload = () => window.print();</script>
      </body></html>
    `;

    const win = window.open('', '_blank', 'width=650,height=800');
    if (win) {
      win.document.write(receiptHTML);
      win.document.close();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Main Row */}
      <div
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1">
          {/* Date */}
          <div className="text-sm">
            <p className="font-semibold text-gray-900 dark:text-white">
              {formatDate(transaction.createdAt, 'dd/MM/yyyy')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(transaction.createdAt, 'HH:mm')}
            </p>
          </div>

          {/* Type & Description */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white truncate">
              {getTypeText(transaction.type)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {transaction.description || transaction.creator?.name}
            </p>
          </div>

          {/* Payment Method */}
          <div className="hidden md:flex items-center gap-2 text-gray-600 dark:text-gray-400">
            {getPaymentMethodIcon(transaction.paymentMethod)}
          </div>

          {/* Amount */}
          <div className="text-right">
            <p className="font-bold text-lg text-gray-900 dark:text-white">
              {formatCurrency(transaction.amount)}
            </p>
          </div>

          {/* Status */}
          <div>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                transaction.status
              )}`}
            >
              {getStatusText(transaction.status)}
            </span>
          </div>

          {/* Expand Icon */}
          <div className="text-gray-400">
            {showDetails ? <FiChevronUp /> : <FiChevronDown />}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="border-t dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-1">ID da Transação</p>
              <p className="font-mono text-gray-900 dark:text-white text-xs">
                {transaction._id}
              </p>
            </div>

            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-1">Método de Pagamento</p>
              <p className="text-gray-900 dark:text-white capitalize">
                {transaction.paymentMethod?.replace('_', ' ')}
              </p>
            </div>

            {transaction.creator && (
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">Criador</p>
                <p className="text-gray-900 dark:text-white">
                  {transaction.creator.name} (@{transaction.creator.username})
                </p>
              </div>
            )}

            {transaction.refundedAt && (
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">Data do Reembolso</p>
                <p className="text-gray-900 dark:text-white">
                  {formatDate(transaction.refundedAt)}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {transaction.status === PAYMENT_STATUS.COMPLETED && (
              <button
                onClick={handleDownloadReceipt}
                className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-black text-white rounded-lg text-sm font-semibold transition-colors"
              >
                <FiDownload />
                Baixar Recibo
              </button>
            )}

            {transaction.relatedUrl && (
              <a
                href={transaction.relatedUrl}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Ver Conteúdo
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionRow;