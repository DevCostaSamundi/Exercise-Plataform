/**
 * Item de Notificação
 * Exibe uma notificação individual
 */

import { Link } from 'react-router-dom';
import {
  FiImage,
  FiLock,
  FiMail,
  FiMessageCircle,
  FiHeart,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiVideo,
} from 'react-icons/fi';
import { formatRelativeTime } from '../../utils/formatters';
import { NOTIFICATION_TYPES } from '../../config/constants';

const NotificationItem = ({ notification, onClick }) => {
  const getIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.NEW_POST:
        return <FiImage className="text-black" />;
      case NOTIFICATION_TYPES.NEW_PPV:
        return <FiLock className="text-slate-600" />;
      case NOTIFICATION_TYPES.NEW_MESSAGE:
        return <FiMail className="text-black" />;
      case NOTIFICATION_TYPES.COMMENT_REPLY:
        return <FiMessageCircle className="text-slate-800" />;
      case NOTIFICATION_TYPES.COMMENT_LIKE:
        return <FiHeart className="text-slate-900" />;
      case NOTIFICATION_TYPES.SUBSCRIPTION_RENEWAL:
        return <FiClock className="text-slate-600" />;
      case NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED:
        return <FiCheckCircle className="text-slate-800" />;
      case NOTIFICATION_TYPES.PAYMENT_FAILED:
        return <FiAlertCircle className="text-slate-900" />;
      case NOTIFICATION_TYPES.LIVE_STARTED:
        return <FiVideo className="text-slate-400" />;
      default:
        return <FiCheckCircle className="text-gray-600" />;
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(notification);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all ${
        notification.read
          ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
          : 'bg-black dark:bg-black/20 hover:bg-black dark:hover:bg-black/30'
      }`}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        {getIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Avatar + Message */}
        <div className="flex items-start gap-2">
          {notification.sender && (
            <img
              src={notification.sender.avatar || '/default-avatar.png'}
              alt={notification.sender.name}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          )}

          <div className="flex-1">
            <p className="text-sm text-gray-900 dark:text-white">
              {notification.sender && (
                <span className="font-semibold">
                  {notification.sender.name}
                </span>
              )}{' '}
              {notification.message}
            </p>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatRelativeTime(notification.createdAt)}
            </p>
          </div>
        </div>

        {/* Preview (if applicable) */}
        {notification. preview && (
          <div className="mt-2">
            {notification.preview.type === 'image' && (
              <img
                src={notification.preview.url}
                alt="Preview"
                className="w-20 h-20 rounded-lg object-cover"
              />
            )}
            {notification.preview.type === 'text' && (
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                {notification.preview.text}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Unread Indicator */}
      {!notification.read && (
        <div className="flex-shrink-0 w-2 h-2 bg-black rounded-full mt-2" />
      )}
    </div>
  );
};

export default NotificationItem;