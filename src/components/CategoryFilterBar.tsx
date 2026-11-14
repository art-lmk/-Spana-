import React from 'react';
import { 
  Sparkles, 
  Check, 
  Star, 
  Clock, 
  ShieldCheck
} from 'lucide-react';
import { getCategoryIcon } from '../utils/categoryIcons';

export interface CategoryOption {
  id?: string;
  name?: string;
  label?: string;
  displayName?: string;
  count?: number;
}

interface CategoryFilterBarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categories?: CategoryOption[];
  verifiedOnly: boolean;
  onToggleVerifiedOnly: () => void;
  availableNowOnly: boolean;
  onToggleAvailableNowOnly: () => void;
  minRating: number;
  onMinRatingChange: (rating: number) => void;
  maxHourlyRateKes?: number;
  onMaxHourlyRateChange?: (rate: number | undefined) => void;
  totalResults: number;
  viewMode: 'split' | 'map' | 'grid';
  onViewModeChange: (mode: 'split' | 'map' | 'grid') => void;
}

const DEFAULT_CATEGORIES: CategoryOption[] = [
  { id: 'All', label: 'All Trades' },
  { id: 'Plumbing', label: 'Plumbers' },
  { id: 'Electrical', label: 'Electricians' },
  { id: 'Carpentry', label: 'Carpenters' },
  { id: 'Appliance Repair', label: 'Appliance Repair' },
  { id: 'Painting', label: 'Painters' },
  { id: 'Masonry', label: 'Masons & Tilers' },
  { id: 'Welding', label: 'Welders & Metal' },
  { id: 'Roofing', label: 'Roofers' },
  { id: 'HVAC & AC', label: 'HVAC & AC' },
  { id: 'Landscaping', label: 'Landscapers' },
];

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  categories = DEFAULT_CATEGORIES,
  verifiedOnly,
  onToggleVerifiedOnly,
  availableNowOnly,
  onToggleAvailableNowOnly,
  minRating,
  onMinRatingChange,
  totalResults,
  viewMode,
  onViewModeChange,
}) => {
  const displayCategories = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  return (
    <div className="bg-white border-b border-slate-200/80 shadow-xs py-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-3">
        
        {/* Horizontal scrolling trade categories from active dataset */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
          {displayCategories.map((cat, idx) => {
            const catId = cat.id || cat.name || `cat-${idx}`;
            const catLabel = cat.label || cat.displayName || cat.name || catId;
            const Icon = getCategoryIcon(catId);
            const isSelected = selectedCategory.toLowerCase() === catId.toLowerCase();

            return (
              <button
                key={catId}
                id={`category-btn-${catId.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => onSelectCategory(catId)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 shrink-0 ${
                  isSelected
                    ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30 ring-2 ring-orange-600/20'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 border border-slate-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span>{catLabel}</span>
                {cat.count !== undefined && cat.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
                    isSelected ? 'bg-orange-700 text-orange-100' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Second row: Quick filters, Rating, Total results and View Mode toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 text-xs">
          
          {/* Quick Filter chips */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Verified Filter */}
            <button
              id="filter-verified-only"
              onClick={onToggleVerifiedOnly}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition ${
                verifiedOnly
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Only</span>
              {verifiedOnly && <Check className="w-3 h-3 ml-0.5" />}
            </button>

            {/* Available Now Filter */}
            <button
              id="filter-available-now"
              onClick={onToggleAvailableNowOnly}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition ${
                availableNowOnly
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Available Now</span>
              {availableNowOnly && <Check className="w-3 h-3 ml-0.5" />}
            </button>

            {/* Min Rating dropdown/pills */}
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-0.5">
              {[0, 4.5, 4.8].map((rating) => (
                <button
                  key={rating}
                  onClick={() => onMinRatingChange(rating)}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-0.5 ${
                    minRating === rating
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Star className={`w-3 h-3 ${rating > 0 ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                  <span>{rating === 0 ? 'All' : `${rating}+`}</span>
                </button>
              ))}
            </div>

          </div>

          {/* Results count & Layout switch */}
          <div className="flex items-center gap-3">
            <span className="text-slate-600 font-medium">
              Found <strong className="text-slate-900 font-bold">{totalResults}</strong> skilled fundis
            </span>

            {/* View Mode buttons */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                id="view-mode-split"
                onClick={() => onViewModeChange('split')}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition ${
                  viewMode === 'split' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Available Artisans with Map at Bottom"
              >
                Artisans & Map
              </button>
              <button
                id="view-mode-grid"
                onClick={() => onViewModeChange('grid')}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Cards Only"
              >
                Cards Only
              </button>
              <button
                id="view-mode-map"
                onClick={() => onViewModeChange('map')}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition ${
                  viewMode === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Full Screen Map Explorer"
              >
                Full Map
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

