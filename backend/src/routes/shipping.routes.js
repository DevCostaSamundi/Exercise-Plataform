import express from 'express';
import { authenticate, requireCreator } from '../middleware/auth.middleware.js';
import { generateShippingLabelPDF } from '../services/shippingLabel.service.js';

const router = express.Router();

/**
 * GET /api/v1/shipping/label/:orderId
 * Retorna dados da etiqueta de envio (endereço desencriptado)
 * Protegido: só a criadora do pedido consegue aceder
 */
router.get(
  '/label/:orderId',
  authenticate,
  requireCreator,
  async (req, res) => {
    try {
      const data = await generateShippingLabelPDF(
        req.params.orderId,
        req.user.creatorId || req.creator?.id,
      );
      res.json({ success: true, data });
    } catch (err) {
      const status =
        err.message === 'Sem permissão'          ? 403 :
        err.message === 'Pedido não encontrado'  ? 404 : 500;
      res.status(status).json({ success: false, message: err.message });
    }
  }
);

export default router;