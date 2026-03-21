Config:
├── jwt.js                  — secret seguro em produção
├── socket.js               — room names, espaços, notifyUser helper
├── multer.js               → substituído por upload.middleware.js
└── web3.config.js          — sem alterações funcionais

Controllers (9):
├── like                    — prisma centralizado
├── paidMessage             — verificação on-chain real
├── subscription            — PENDING→ACTIVE com pagamento
├── favorite                — import não usado removido
├── messageUpload           — cloudinary centralizado
├── marketplace             — imports corrigidos
└── (notification via service)

Middleware (4):
├── auth                    — decoded.id||userId, isActive
├── upload                  — 3 variantes centralizadas
├── validation              — sem console.log em produção
└── error                   — sem alterações

Jobs + Services (8):
├── blockchain-monitor      — socket emit, userId correcto
├── notification.service    — room name correcto
├── messageSocket           — prisma, room, decoded.id
├── socket/index.js         — jwtConfig, room join
├── alchemy-webhook         — import crypto ESM
├── shippingLabel           — CommonJS → ESM
├── cloudinary.service      — sem console.log
└── tip.service             — currency USDC

Routes (12):
├── subscription            — endpoint /confirm adicionado
├── favorite                — espaço no path corrigido
├── marketplace             — authMiddleware correcto
├── shipping                — CommonJS → ESM
├── message                 — multer centralizado
├── creatorSettings         — multer centralizado
├── upload                  — multer centralizado
├── auth                    — uploadDoc para KYC
├── notification            — espaços removidos
├── post                    — optionalAuth adicionado
├── user                    — espaços removidos
└── web3auth                — saveWallet protegida

Entry points:
├── app.js                  — marketplace+shipping montados, prefixo web3auth
└── server.js               — initialize(), logger, Web3 fatal em prod