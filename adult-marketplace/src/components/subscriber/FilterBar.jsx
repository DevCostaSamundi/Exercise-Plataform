/**
 * Barra de Filtros
 * Para Feed, Explorar, etc.
 */

import { FiImage, FiVideo, FiRadio, FiGrid } from 'react-icons/fi';
import { CONTENT_TYPES } from '../../config/constants';

const FilterBar = ({ activeFilter, onFilterChange, showAll = true }) => {
  const filters = [
    ...(showAll ?  [{ id: CONTENT_TYPES.ALL, label: 'Todos', icon: FiGrid }] : []),
    { id: CONTENT_TYPES.PHOTOS, label: 'Fotos', icon: FiImage },
    { id: CONTENT_TYPES.VIDEOS, label: 'Vídeos', icon: FiVideo },
    { id: CONTENT_TYPES.LIVES, label: 'Lives', icon: FiRadio },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;

        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
              isActive
                ?  'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Icon className="text-lg" />
            {filter.label}
          </button>
        );
      })}
    </div>
  );
};

export default FilterBar;