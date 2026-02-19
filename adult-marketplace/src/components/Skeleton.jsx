export default function Skeleton({ className = '', variant = 'rectangle' }) {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%]';
  
  const variants = {
    rectangle: 'rounded-lg',
    circle: 'rounded-full',
    text: 'rounded h-4',
    card: 'rounded-xl h-64',
    avatar: 'rounded-full w-12 h-12',
  };

  return (
    <div 
      className={`${baseClasses} ${variants[variant]} ${className}`}
      style={{
        animation: 'shimmer 2s infinite linear',
      }}
    />
  );
}

// Card skeleton for token cards
export function TokenCardSkeleton() {
  return (
    <div className="border border-gray-800 rounded-xl p-6 bg-black">
      <div className="flex items-start gap-4 mb-4">
        <Skeleton variant="circle" className="w-16 h-16" />
        <div className="flex-1">
          <Skeleton variant="text" className="w-32 mb-2" />
          <Skeleton variant="text" className="w-24 h-3" />
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <Skeleton variant="text" className="w-20 h-3" />
          <Skeleton variant="text" className="w-24" />
        </div>
        <div className="flex justify-between">
          <Skeleton variant="text" className="w-20 h-3" />
          <Skeleton variant="text" className="w-16" />
        </div>
      </div>

      <Skeleton className="w-full h-10 mt-4" />
    </div>
  );
}

// Activity feed skeleton
export function ActivitySkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-800">
      <Skeleton variant="circle" className="w-10 h-10" />
      <div className="flex-1">
        <Skeleton variant="text" className="w-48 mb-2" />
        <Skeleton variant="text" className="w-24 h-3" />
      </div>
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton() {
  return (
    <tr className="border-b border-gray-800">
      <td className="py-4"><Skeleton variant="text" className="w-8" /></td>
      <td className="py-4">
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" className="w-8 h-8" />
          <Skeleton variant="text" className="w-32" />
        </div>
      </td>
      <td className="py-4"><Skeleton variant="text" className="w-20" /></td>
      <td className="py-4"><Skeleton variant="text" className="w-24" /></td>
      <td className="py-4"><Skeleton variant="text" className="w-16" /></td>
    </tr>
  );
}
