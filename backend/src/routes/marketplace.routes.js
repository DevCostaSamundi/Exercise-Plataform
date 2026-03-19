// marketplace.routes.js
import express from 'express';
import { authMiddleware, creatorMiddleware } from '../middleware/auth.middleware.js';
import * as marketplace from '../controllers/marketplace.controller.js';

const router = express.Router();

// ── Públicas ────────────────────────────────────────────────
router.get('/explore',                     marketplace.exploreMarketplace);
router.get('/store/:creatorId',            marketplace.getCreatorStore);
router.get('/product/:productId',          marketplace.getProduct);
router.post('/products/:productId/reviews',authMiddleware, marketplace.createReview);

// ── Criadora (protegidas) ───────────────────────────────────
router.use(authMiddleware, creatorMiddleware);
router.get ('/creator/products',           marketplace.getMyProducts);
router.post('/creator/products',           marketplace.createProduct);
router.put ('/creator/products/:productId',marketplace.updateProduct);
router.delete('/creator/products/:productId',marketplace.deleteProduct);
router.get ('/creator/store-profile',      marketplace.getMyStoreProfile);
router.put ('/creator/store-profile',      marketplace.updateMyStoreProfile);
router.get ('/creator/reviews',            marketplace.getMyReviews);

export default router;