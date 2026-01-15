import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

/**
 * Obter configurações do criador
 */
export const getCreatorSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar criador e usuário
    const creator = await prisma.creator.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            username: true,
            displayName: true,
            bio: true,
            avatar: true,
            genderIdentity: true,
            orientation: true,
            isVerified: true,
          },
        },
      },
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found',
      });
    }

    // Formatar resposta
    const settings = {
      profile: {
        displayName: creator.displayName || creator.user.displayName,
        username: creator.user.username,
        bio: creator.user.bio,
        location: creator.location,
        website: creator.website,
        category: creator.category,
        genderIdentity: creator.user.genderIdentity,
        orientation: creator.user.orientation,
        avatar: creator.user.avatar,
        coverImage: creator.coverImage,
        socialLinks: creator.socialLinks || {},
      },
      account: {
        email: creator.user.email,
        emailVerified: creator.user.isVerified,
        twoFactorEnabled: false, // TODO: Implementar 2FA
      },
      subscription: {
        monthlyPrice: creator.subscriptionPrice || 9.99,
        discounts: creator.discounts || {
          threeMonths: 10,
          sixMonths: 15,
          twelveMonths: 20,
        },
        promoActive: creator.promoActive || false,
        promoDiscount: creator.promoDiscount || 0,
        promoDuration: creator.promoDuration || 0,
        promoExpiry: creator.promoExpiry || '',
        trialEnabled: creator.trialEnabled || false,
        trialDays: creator.trialDays || 0,
      },
      payments: {
        withdrawMethod: creator.withdrawMethod || 'pix',
        pixType: creator.pixType || 'email',
        pixKey: creator.pixKey || '',
        cryptoWallets: creator.cryptoWallets || {},
        autoWithdraw: creator.autoWithdraw || false,
        autoWithdrawMin: creator.autoWithdrawMin || 100,
      },
      notifications: {
        email: creator.emailNotifications || {},
        push: creator.pushNotifications || {},
        marketing: creator.marketingEmails ?? true,
        newsletter: creator.newsletter ?? true,
      },
      privacy: {
        publicProfile: creator.publicProfile ?? true,
        showActivity: creator.showActivity ?? true,
        showSubscriberCount: creator.showSubscriberCount ?? true,
        messagePermission: creator.messagePermission || 'subscribers',
        allowTips: creator.allowTips ?? true,
        watermark: creator.watermark ?? true,
        disableScreenshots: creator.disableScreenshots || false,
        hideFromSearch: creator.hideFromSearch || false,
        blockedCountries: creator.blockedCountries || [],
      },
      content: {
        defaultPPV: creator.defaultPPV || false,
        autoPublish: creator.autoPublish ?? true,
        commentsEnabled: creator.commentsEnabled ?? true,
        defaultPPVPrice: creator.defaultPPVPrice || 9.99,
        imageQuality: creator.imageQuality || 'high',
        videoQuality: creator.videoQuality || '1080p',
      },
      blocking: {
        blockedUsers: creator.blockedUsers || [],
        blockedWords: creator.blockedWords || [],
      },
    };

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    logger.error('Get creator settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settings',
    });
  }
};

/**
 * Atualizar configurações do criador
 */
/**
 * PUT /api/v1/creator/settings
 * Atualizar configurações do criador
 */
export const updateCreatorSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const files = req.files;

    // Parse settings JSON
    let settings = {};
    if (req.body.settings) {
      try {
        settings = JSON.parse(req.body.settings);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid settings JSON',
        });
      }
    }

    // Buscar criador
    const creator = await prisma.creator.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found',
      });
    }

    // Upload de imagens
    let avatarUrl = creator.user.avatar;
    let coverUrl = creator.coverImage;

    if (files?.avatar?.[0]) {
      if (creator.user.avatar) {
        await deleteFromCloudinary(creator.user.avatar);
      }
      const result = await uploadToCloudinary(
        files.avatar[0].buffer,
        `creators/${userId}/avatar`
      );
      avatarUrl = result.secure_url;
    }

    if (files?.cover?.[0]) {
      if (creator.coverImage) {
        await deleteFromCloudinary(creator.coverImage);
      }
      const result = await uploadToCloudinary(
        files.cover[0].buffer,
        `creators/${userId}/cover`
      );
      coverUrl = result.secure_url;
    }

    // Atualizar User
    if (settings.profile || avatarUrl !== creator.user.avatar) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(settings.profile?.displayName && {
            displayName: settings.profile.displayName,
          }),
          ...(settings.profile?.username && {
            username: settings.profile.username,
          }),
          ...(settings.profile?.bio !== undefined && {
            bio: settings.profile.bio,
          }),
          ...(settings.profile?.genderIdentity !== undefined && {
            genderIdentity: settings.profile.genderIdentity,
          }),
          ...(settings.profile?.orientation !== undefined && {
            orientation: settings.profile.orientation,
          }),
          ...(avatarUrl !== creator.user.avatar && { avatar: avatarUrl }),
        },
      });
    }

    // ✅ CORREÇÃO: Mesclar socialLinks ao invés de substituir
    let socialLinksToUpdate = creator.socialLinks || {};
    if (settings.profile?.socialLinks) {
      // Mesclar os links sociais existentes com os novos
      socialLinksToUpdate = {
        ...socialLinksToUpdate,
        ...settings.profile.socialLinks,
      };

      // Remover links vazios
      Object.keys(socialLinksToUpdate).forEach(key => {
        if (!socialLinksToUpdate[key] || socialLinksToUpdate[key].trim() === '') {
          delete socialLinksToUpdate[key];
        }
      });
    }

    // Atualizar Creator
    const updateData = {
      // Profile
      ...(settings.profile?.displayName && {
        displayName: settings.profile.displayName,
      }),
      ...(settings.profile?.location !== undefined && {
        location: settings.profile.location,
      }),
      ...(settings.profile?.website !== undefined && {
        website: settings.profile.website,
      }),
      ...(settings.profile?.category && {
        category: settings.profile.category,
      }),
      // ✅ USAR socialLinksToUpdate mesclado
      ...(settings.profile?.socialLinks && {
        socialLinks: socialLinksToUpdate,
      }),
      ...(coverUrl !== creator.coverImage && { coverImage: coverUrl }),

      // Subscription
      ...(settings.subscription?.monthlyPrice && {
        subscriptionPrice: settings.subscription.monthlyPrice,
      }),
      ...(settings.subscription?.discounts && {
        discounts: settings.subscription.discounts,
      }),
      ...(settings.subscription?.promoActive !== undefined && {
        promoActive: settings.subscription.promoActive,
      }),
      ...(settings.subscription?.promoDiscount !== undefined && {
        promoDiscount: settings.subscription.promoDiscount,
      }),
      ...(settings.subscription?.promoDuration !== undefined && {
        promoDuration: settings.subscription.promoDuration,
      }),
      ...(settings.subscription?.promoExpiry !== undefined && {
        promoExpiry: settings.subscription.promoExpiry,
      }),
      ...(settings.subscription?.trialEnabled !== undefined && {
        trialEnabled: settings.subscription.trialEnabled,
      }),
      ...(settings.subscription?.trialDays !== undefined && {
        trialDays: settings.subscription.trialDays,
      }),

      // Payments
      ...(settings.payments?.withdrawMethod && {
        withdrawMethod: settings.payments.withdrawMethod,
      }),
      ...(settings.payments?.pixType && {
        pixType: settings.payments.pixType,
      }),
      ...(settings.payments?.pixKey !== undefined && {
        pixKey: settings.payments.pixKey,
      }),
      ...(settings.payments?.cryptoWallets && {
        cryptoWallets: settings.payments.cryptoWallets,
      }),
      ...(settings.payments?.autoWithdraw !== undefined && {
        autoWithdraw: settings.payments.autoWithdraw,
      }),
      ...(settings.payments?.autoWithdrawMin !== undefined && {
        autoWithdrawMin: settings.payments.autoWithdrawMin,
      }),

      // Notifications
      ...(settings.notifications?.email && {
        emailNotifications: settings.notifications.email,
      }),
      ...(settings.notifications?.push && {
        pushNotifications: settings.notifications.push,
      }),
      ...(settings.notifications?.marketing !== undefined && {
        marketingEmails: settings.notifications.marketing,
      }),
      ...(settings.notifications?.newsletter !== undefined && {
        newsletter: settings.notifications.newsletter,
      }),

      // Privacy
      ...(settings.privacy?.publicProfile !== undefined && {
        publicProfile: settings.privacy.publicProfile,
      }),
      ...(settings.privacy?.showActivity !== undefined && {
        showActivity: settings.privacy.showActivity,
      }),
      ...(settings.privacy?.showSubscriberCount !== undefined && {
        showSubscriberCount: settings.privacy.showSubscriberCount,
      }),
      ...(settings.privacy?.messagePermission && {
        messagePermission: settings.privacy.messagePermission,
      }),
      ...(settings.privacy?.allowTips !== undefined && {
        allowTips: settings.privacy.allowTips,
      }),
      ...(settings.privacy?.watermark !== undefined && {
        watermark: settings.privacy.watermark,
      }),
      ...(settings.privacy?.disableScreenshots !== undefined && {
        disableScreenshots: settings.privacy.disableScreenshots,
      }),
      ...(settings.privacy?.hideFromSearch !== undefined && {
        hideFromSearch: settings.privacy.hideFromSearch,
      }),
      ...(settings.privacy?.blockedCountries && {
        blockedCountries: settings.privacy.blockedCountries,
      }),

      // Content
      ...(settings.content?.defaultPPV !== undefined && {
        defaultPPV: settings.content.defaultPPV,
      }),
      ...(settings.content?.autoPublish !== undefined && {
        autoPublish: settings.content.autoPublish,
      }),
      ...(settings.content?.commentsEnabled !== undefined && {
        commentsEnabled: settings.content.commentsEnabled,
      }),
      ...(settings.content?.defaultPPVPrice !== undefined && {
        defaultPPVPrice: settings.content.defaultPPVPrice,
      }),
      ...(settings.content?.imageQuality && {
        imageQuality: settings.content.imageQuality,
      }),
      ...(settings.content?.videoQuality && {
        videoQuality: settings.content.videoQuality,
      }),

      // Blocking
      ...(settings.blocking?.blockedUsers && {
        blockedUsers: settings.blocking.blockedUsers,
      }),
      ...(settings.blocking?.blockedWords && {
        blockedWords: settings.blocking.blockedWords,
      }),
    };

    await prisma.creator.update({
      where: { userId },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        avatarUrl,
        coverUrl,
      },
    });
  } catch (error) {
    logger.error('Update creator settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
    });
  }
};