// backend/routes/shipping.routes.js
// Rota protegida — só a criadora pode gerar a etiqueta do seu próprio pedido.

const express  = require('express');
const router   = express.Router();
const { authMiddleware }    = require('../middleware/auth.middleware');
const { creatorMiddleware } = require('../middleware/creator.middleware');
const { generateShippingLabelPDF } = require('../services/shippingLabel.service');

/**
 * GET /shipping/label/:orderId
 * Retorna os dados da etiqueta de envio (endereço descriptografado)
 * para que o frontend gere o PDF com jsPDF.
 * Protegido: só a criadora do pedido consegue aceder.
 */
router.get(
  '/label/:orderId',
  authMiddleware,
  creatorMiddleware,
  async (req, res) => {
    try {
      const data = await generateShippingLabelPDF(
        req.params.orderId,
        req.user.creatorId,
      );
      res.json({ success: true, data });
    } catch (err) {
      const status = err.message === 'Sem permissão' ? 403
        : err.message === 'Pedido não encontrado'    ? 404
        : 500;
      res.status(status).json({ success: false, message: err.message });
    }
  }
);

module.exports = router;