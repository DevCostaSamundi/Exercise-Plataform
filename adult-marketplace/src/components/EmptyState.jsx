/**
 * EmptyState Component
 * Mostra mensagem quando não há dados
 */

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className = '' 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {Icon && (
        <div className="mb-4 p-4 bg-gray-800/50 rounded-full">
          <Icon size={48} className="text-gray-500" />
        </div>
      )}
      
      {title && (
        <h3 className="text-xl font-semibold text-white mb-2">
          {title}
        </h3>
      )}
      
      {description && (
        <p className="text-gray-400 text-center max-w-md mb-6">
          {description}
        </p>
      )}
      
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
