import { Link } from 'react-router-dom';
import {
  FiImage, FiLock, FiMail, FiMessageCircle, FiHeart,
  FiClock, FiCheckCircle, FiAlertCircle, FiVideo, FiBell,
} from 'react-icons/fi';
import { formatRelativeTime } from '../../utils/formatters';
import { NOTIFICATION_TYPES } from '../../config/constants';

const NotificationItem = ({ notification, onClick }) => {
  const getIcon = (type) => {
    switch (type) {
      // Tipos do frontend (adicionados nas constants)
      case NOTIFICATION_TYPES.NEW_POST:             return <FiImage className="text-black" />;
      case NOTIFICATION_TYPES.NEW_PPV:              return <FiLock className="text-slate-600" />;
      case NOTIFICATION_TYPES.NEW_MESSAGE:          return <FiMail className="text-black" />;
      case NOTIFICATION_TYPES.COMMENT_REPLY:        return <FiMessageCircle className="text-slate-800" />;
      case NOTIFICATION_TYPES.COMMENT_LIKE:         return <FiHeart className="text-slate-900" />;
      case NOTIFICATION_TYPES.SUBSCRIPTION_RENEWAL: return <FiClock className="text-slate-600" />;
      case NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED: return <FiCheckCircle className="text-slate-800" />;
      case NOTIFICATION_TYPES.PAYMENT_FAILED:       return <FiAlertCircle className="text-red-500" />;
      case NOTIFICATION_TYPES.LIVE_STARTED:         return <FiVideo className="text-slate-400" />;

      // Tipos do backend
      case NOTIFICATION_TYPES.SUBSCRIBER:   return <FiHeart className="text-slate-900" />;
      case NOTIFICATION_TYPES.COMMENT:      return <FiMessageCircle className="text-slate-800" />;
      case NOTIFICATION_TYPES.TIP:          return <FiCheckCircle className="text-amber-500" />;
      case NOTIFICATION_TYPES.LIKE:         return <FiHeart className="text-slate-900" />;
      case NOTIFICATION_TYPES.MESSAGE:      return <FiMail className="text-black" />;
      case NOTIFICATION_TYPES.PAYMENT:      return <FiCheckCircle className="text-green-500" />;
      case NOTIFICATION_TYPES.MILESTONE:    return <FiCheckCircle className="text-slate-800" />;
      case NOTIFICATION_TYPES.WARNING:      return <FiAlertCircle className="text-amber-500" />;

      // Marketplace
      case NOTIFICATION_TYPES.NEW_ORDER:        return <FiCheckCircle className="text-black" />;
      case NOTIFICATION_TYPES.STORE_WARNING:    return <FiAlertCircle className="text-amber-500" />;
      case NOTIFICATION_TYPES.STORE_SUSPENDED:  return <FiAlertCircle className="text-red-500" />;
      case NOTIFICATION_TYPES.REVIEW_RECEIVED:  return <FiImage className="text-slate-600" />;
      case NOTIFICATION_TYPES.SHIPMENT_UPDATE:  return <FiCheckCircle className="text-slate-600" />;

      default: return <FiBell className="text-gray-600" />;
    }
  };

  return (
    <div
      onClick={() => onClick?.(notification)}
      className={`flex items-start gap-3 p-4 cursor-pointer transition-all ${
        notification.read
          ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
          : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700'
      }`}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        {getIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
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
                <span className="font-semibold">{notification.sender.name} </span>
              )}
              {notification.message}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatRelativeTime(notification.createdAt)}
            </p>
          </div>
        </div>

        {/* Preview */}
        {notification.preview && (
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

      {/* Unread dot */}
      {!notification.read && (
        <div className="flex-shrink-0 w-2 h-2 bg-black rounded-full mt-2" />
      )}
    </div>
  );
};

export default NotificationItem;