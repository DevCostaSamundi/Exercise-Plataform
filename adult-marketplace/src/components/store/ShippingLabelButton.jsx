// components/store/ShippingLabelButton.jsx
// Botão que a criadora usa para descarregar a etiqueta de envio em PDF.
// Chama o backend para obter o endereço descriptografado,
// depois gera o PDF directamente no browser com jsPDF (sem CDN externo).

import { useState } from 'react';
import api from '../../services/api';

export default function ShippingLabelButton({ orderId, orderNumber, className = '' }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleDownload() {
    setLoading(true);
    setError('');
    try {
      // 1. Obter dados da etiqueta do backend
      const res  = await api.get(`/shipping/label/${orderId}`);
      const data = res.data?.data;
      if (!data) throw new Error('Dados inválidos');

      // 2. Gerar PDF com jsPDF (carregado via CDN no index.html)
      //    Se não tiver jsPDF disponível, gera um HTML para imprimir
      if (window.jspdf?.jsPDF) {
        await generateWithJsPDF(data);
      } else {
        generatePrintableHTML(data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erro ao gerar etiqueta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${className}`}
      >
        {loading ? (
          <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd"/>
          </svg>
        )}
        {loading ? 'A gerar…' : '🏷️ Etiqueta PDF'}
      </button>
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  );
}

// ── Gerar PDF com jsPDF ───────────────────────────────────────────

async function generateWithJsPDF(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a6' }); // A6 = tamanho etiqueta

  const W = 105; // mm largura A6
  const margin = 8;

  // ── Fundo branco + borda
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, 148, 'F');
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.8);
  doc.rect(margin - 2, margin - 2, W - (margin - 2) * 2, 148 - (margin - 2) * 2, 'S');

  let y = margin + 4;

  // ── Cabeçalho — plataforma
  doc.setFillColor(15, 15, 15);
  doc.rect(margin - 2, margin - 2, W - (margin - 2) * 2, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PLATAFORMA · ETIQUETA DE ENVIO', W / 2, y + 4, { align: 'center' });

  y += 16;
  doc.setTextColor(30, 30, 30);

  // ── Código de drop anónimo — destaque máximo
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin - 2, y, W - (margin - 2) * 2, 22, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('REFERÊNCIA ANÓNIMA', W / 2, y + 5, { align: 'center' });
  doc.setFontSize(22);
  doc.setFont('courier', 'bold');
  doc.setTextColor(15, 15, 15);
  doc.text(data.anonDropCode, W / 2, y + 17, { align: 'center' });

  y += 27;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);

  // ── Separador
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, y, W - margin, y);
  y += 5;

  // ── DESTINATÁRIO
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'bold');
  doc.text('DESTINATÁRIO', margin, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 15, 15);
  doc.text(`REF: ${data.anonDropCode}`, margin, y); // sem nome real
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(data.recipient.addressLine1, margin, y); y += 4;
  if (data.recipient.addressLine2) { doc.text(data.recipient.addressLine2, margin, y); y += 4; }
  doc.text(`${data.recipient.postalCode}  ${data.recipient.city}`, margin, y); y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text(data.recipient.country, margin, y); y += 4;
  if (data.recipient.phone) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Tel: ${data.recipient.phone}`, margin, y); y += 4;
  }

  y += 2;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, W - margin, y);
  y += 5;

  // ── REMETENTE
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'bold');
  doc.text('REMETENTE', margin, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text(data.sender.storeName, margin, y); y += 4;
  doc.text(data.sender.country, margin, y); y += 4;

  y += 2;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, W - margin, y);
  y += 5;

  // ── INFO DE ENVIO
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'bold');
  doc.text('ZONA DE ENVIO', margin, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text(`${data.shipping.zoneLabel}  ·  ${data.shipping.days}`, margin, y); y += 4;
  doc.text(`Porte estimado: $${data.shipping.estimateMin}–$${data.shipping.estimateMax} USD`, margin, y); y += 4;
  if (data.shipping.trackingCode) {
    doc.setFont('courier', 'bold');
    doc.text(`Rastreio: ${data.shipping.trackingCode}`, margin, y); y += 4;
  }

  y += 2;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, W - margin, y);
  y += 4;

  // ── Nota de privacidade (rodapé)
  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Este envio foi processado através da plataforma. O nome do destinatário\nnão é partilhado com o remetente por razões de privacidade.',
    W / 2, y + 3,
    { align: 'center', maxWidth: W - margin * 2 }
  );

  // ── Download
  doc.save(`etiqueta-${data.orderNumber}-${data.anonDropCode}.pdf`);
}

// ── Fallback: janela de impressão HTML ───────────────────────────

function generatePrintableHTML(data) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Etiqueta ${data.orderNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; padding: 10mm; width: 105mm; }
    .header { background: #000; color: #fff; text-align: center; padding: 6px; font-size: 9px; font-weight: bold; margin-bottom: 8px; }
    .code-box { background: #f5f5f5; text-align: center; padding: 8px; border: 1px solid #ddd; margin-bottom: 8px; }
    .code-label { font-size: 7px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
    .code { font-size: 24px; font-weight: bold; letter-spacing: 4px; }
    .section { margin-bottom: 8px; border-top: 1px solid #ddd; padding-top: 6px; }
    .section-label { font-size: 7px; color: #888; text-transform: uppercase; font-weight: bold; margin-bottom: 3px; }
    .line { font-size: 9px; margin-bottom: 2px; }
    .bold { font-weight: bold; }
    .footer { font-size: 6px; color: #aaa; text-align: center; border-top: 1px solid #ddd; padding-top: 6px; margin-top: 8px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div class="header">PLATAFORMA · ETIQUETA DE ENVIO</div>
  <div class="code-box">
    <div class="code-label">Referência Anónima</div>
    <div class="code">${data.anonDropCode}</div>
  </div>
  <div class="section">
    <div class="section-label">Destinatário</div>
    <div class="line bold">REF: ${data.anonDropCode}</div>
    <div class="line">${data.recipient.addressLine1}</div>
    ${data.recipient.addressLine2 ? `<div class="line">${data.recipient.addressLine2}</div>` : ''}
    <div class="line">${data.recipient.postalCode} ${data.recipient.city}</div>
    <div class="line bold">${data.recipient.country}</div>
    ${data.recipient.phone ? `<div class="line">Tel: ${data.recipient.phone}</div>` : ''}
  </div>
  <div class="section">
    <div class="section-label">Remetente</div>
    <div class="line">${data.sender.storeName}</div>
    <div class="line">${data.sender.country}</div>
  </div>
  <div class="section">
    <div class="section-label">Zona de Envio</div>
    <div class="line">${data.shipping.zoneLabel} · ${data.shipping.days}</div>
    <div class="line">Porte estimado: $${data.shipping.estimateMin}–$${data.shipping.estimateMax} USD</div>
    ${data.shipping.trackingCode ? `<div class="line bold">Rastreio: ${data.shipping.trackingCode}</div>` : ''}
  </div>
  <div class="footer">
    Este envio foi processado através da plataforma.<br>
    O nome do destinatário não é partilhado com o remetente por razões de privacidade.
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=400,height=600');
  w.document.write(html);
  w.document.close();
}