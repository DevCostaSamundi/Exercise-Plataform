// ============================================================
// AI COMPANION CONTROLLER
// CRUD para AI Companions — criação, listagem, edição
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── POST /api/v1/ai/companions — Criar companion ─────────────

export const createCompanion = async (req, res) => {
    try {
        const userId = req.user.id;

        // Buscar ou criar Creator automaticamente (AI Creators desde o início)
        let creator = await prisma.creator.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!creator) {
            // Auto-criar Creator para utilizadores que querem criar AI companions
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { username: true, displayName: true },
            });

            creator = await prisma.creator.create({
                data: {
                    userId,
                    displayName: user?.displayName || user?.username || 'AI Creator',
                },
                select: { id: true },
            });

            // Actualizar role do user para CREATOR
            await prisma.user.update({
                where: { id: userId },
                data: { role: 'CREATOR' },
            });
        }

        const {
            name, description, personality, appearance,
            language, languages, nsfwLevel, tags,
            monthlyPrice, messageLimit, avatar, coverImage,
        } = req.body;

        if (!name || name.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Nome é obrigatório (mín. 2 caracteres).' });
        }

        if (!personality || !personality.backstory) {
            return res.status(400).json({ success: false, message: 'Personalidade com backstory é obrigatória.' });
        }

        // Gerar slug único
        const baseSlug = name.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        const slug = `${baseSlug}-${Date.now().toString(36)}`;

        const companion = await prisma.aiCompanion.create({
            data: {
                creatorId: creator.id,
                name: name.trim(),
                slug,
                description: description || null,
                avatar: avatar || null,
                coverImage: coverImage || null,
                personality,
                appearance: appearance || null,
                language: language || 'pt',
                languages: languages || ['pt', 'en'],
                nsfwLevel: nsfwLevel || 'explicit',
                tags: tags || [],
                monthlyPrice: parseFloat(monthlyPrice) || 9.99,
                messageLimit: parseInt(messageLimit) || 200,
            },
        });

        res.status(201).json({
            success: true,
            data: companion,
        });
    } catch (error) {
        console.error('[AI Companion] Erro ao criar:', error);
        res.status(500).json({ success: false, message: 'Erro ao criar AI Companion.' });
    }
};

// ── GET /api/v1/ai/companions — Catálogo público ─────────────

export const listCompanions = async (req, res) => {
    try {
        const {
            page = 1, limit = 20,
            language, tag, search,
            sortBy = 'subscriberCount', sortOrder = 'desc',
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = Math.min(parseInt(limit), 50);

        const where = {
            isPublic: true,
            isActive: true,
        };

        if (language) where.language = language;
        if (tag) where.tags = { has: tag };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [companions, total] = await Promise.all([
            prisma.aiCompanion.findMany({
                where,
                skip,
                take,
                orderBy: { [sortBy]: sortOrder },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    avatar: true,
                    description: true,
                    personality: true,
                    language: true,
                    nsfwLevel: true,
                    tags: true,
                    monthlyPrice: true,
                    subscriberCount: true,
                    messageCount: true,
                    rating: true,
                    creator: {
                        select: {
                            id: true,
                            displayName: true,
                            user: { select: { username: true } },
                        },
                    },
                },
            }),
            prisma.aiCompanion.count({ where }),
        ]);

        res.json({
            success: true,
            data: companions,
            pagination: {
                page: parseInt(page),
                limit: take,
                total,
                pages: Math.ceil(total / take),
            },
        });
    } catch (error) {
        console.error('[AI Companion] Erro ao listar:', error);
        res.status(500).json({ success: false, message: 'Erro ao carregar catálogo.' });
    }
};

// ── GET /api/v1/ai/companions/:idOrSlug — Detalhes ───────────

export const getCompanion = async (req, res) => {
    try {
        const { idOrSlug } = req.params;
        const userId = req.user?.id;

        const companion = await prisma.aiCompanion.findFirst({
            where: {
                OR: [{ id: idOrSlug }, { slug: idOrSlug }],
                isActive: true,
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        displayName: true,
                        user: { select: { username: true, avatar: true } },
                    },
                },
            },
        });

        if (!companion) {
            return res.status(404).json({ success: false, message: 'AI Companion não encontrado.' });
        }

        // Verificar se o user tem subscrição activa
        let subscription = null;
        if (userId) {
            subscription = await prisma.aiSubscription.findUnique({
                where: {
                    userId_companionId: { userId, companionId: companion.id },
                },
                select: { id: true, plan: true, status: true, dailyMsgsUsed: true, dailyMsgLimit: true, expiresAt: true },
            });
        }

        res.json({
            success: true,
            data: {
                ...companion,
                userSubscription: subscription,
            },
        });
    } catch (error) {
        console.error('[AI Companion] Erro ao buscar:', error);
        res.status(500).json({ success: false, message: 'Erro ao carregar companion.' });
    }
};

// ── PATCH /api/v1/ai/companions/:id — Editar (criador) ───────

export const updateCompanion = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const creator = await prisma.creator.findUnique({ where: { userId } });
        if (!creator) {
            return res.status(403).json({ success: false, message: 'Não autorizado.' });
        }

        const companion = await prisma.aiCompanion.findFirst({
            where: { id, creatorId: creator.id },
        });

        if (!companion) {
            return res.status(404).json({ success: false, message: 'Companion não encontrado.' });
        }

        const {
            name, description, personality, appearance,
            language, languages, nsfwLevel, tags,
            monthlyPrice, messageLimit, avatar, coverImage,
            isPublic, isActive,
        } = req.body;

        const updated = await prisma.aiCompanion.update({
            where: { id },
            data: {
                ...(name && { name: name.trim() }),
                ...(description !== undefined && { description }),
                ...(personality && { personality }),
                ...(appearance !== undefined && { appearance }),
                ...(language && { language }),
                ...(languages && { languages }),
                ...(nsfwLevel && { nsfwLevel }),
                ...(tags && { tags }),
                ...(monthlyPrice !== undefined && { monthlyPrice: parseFloat(monthlyPrice) }),
                ...(messageLimit !== undefined && { messageLimit: parseInt(messageLimit) }),
                ...(avatar !== undefined && { avatar }),
                ...(coverImage !== undefined && { coverImage }),
                ...(isPublic !== undefined && { isPublic }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('[AI Companion] Erro ao editar:', error);
        res.status(500).json({ success: false, message: 'Erro ao editar companion.' });
    }
};

// ── DELETE /api/v1/ai/companions/:id — Desactivar ────────────

export const deleteCompanion = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const creator = await prisma.creator.findUnique({ where: { userId } });
        if (!creator) {
            return res.status(403).json({ success: false, message: 'Não autorizado.' });
        }

        const companion = await prisma.aiCompanion.findFirst({
            where: { id, creatorId: creator.id },
        });

        if (!companion) {
            return res.status(404).json({ success: false, message: 'Companion não encontrado.' });
        }

        await prisma.aiCompanion.update({
            where: { id },
            data: { isActive: false, isPublic: false },
        });

        res.json({ success: true, message: 'Companion desactivado.' });
    } catch (error) {
        console.error('[AI Companion] Erro ao eliminar:', error);
        res.status(500).json({ success: false, message: 'Erro ao eliminar companion.' });
    }
};

// ── GET /api/v1/ai/companions/my — Companions do criador ─────

export const myCompanions = async (req, res) => {
    try {
        const userId = req.user.id;

        const creator = await prisma.creator.findUnique({ where: { userId } });
        if (!creator) {
            return res.status(403).json({ success: false, message: 'Não autorizado.' });
        }

        const companions = await prisma.aiCompanion.findMany({
            where: { creatorId: creator.id },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                slug: true,
                avatar: true,
                description: true,
                isPublic: true,
                isActive: true,
                monthlyPrice: true,
                subscriberCount: true,
                messageCount: true,
                rating: true,
                createdAt: true,
            },
        });

        res.json({ success: true, data: companions });
    } catch (error) {
        console.error('[AI Companion] Erro ao listar meus companions:', error);
        res.status(500).json({ success: false, message: 'Erro ao carregar companions.' });
    }
};
