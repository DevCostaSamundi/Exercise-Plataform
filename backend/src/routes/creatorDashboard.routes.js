import express from 'express';

const router = express.Router();

// Middleware de autenticação (adicione sua lógica real)
const requireAuth = (req, res, next) => {
  // Exemplo: verifique se existe um token válido
  // if (!req.user) return res.status(401).json({ message: 'Não autorizado' });
  next();
};

/**
 * @route   GET /api/v1/creator-dashboard
 * @desc    Dados do dashboard do criador
 * @access  Protegido
 */
router.get('/creator-dashboard', requireAuth, (req, res) => {
  res.json({
    status: 'success',
    data: {
      earnings: 1234.56,
      subscribers: 42,
      posts: 17,
      lastPayment: '2024-06-01',
      notifications: [
        { id: 1, message: 'Novo assinante: @fan123' },
        { id: 2, message: 'Pagamento recebido: R$ 99,90' }
      ]
    }
  });
});

export default router;
