import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Wrench, 
  Sparkles, 
  X, 
  Check, 
  Layers, 
  Tag, 
  ChevronDown,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export interface SkillItem {
  name: string;
  count: number;
  category: string;
}

interface SkillSearchSectionProps {
  selectedSkill: string;
  onSelectSkill: (skill: string) => void;
  availableSkills: SkillItem[];
  totalFundisCount: number;
  activeFundisCount: number;
  selectedCategory: string;
}

export const SkillSearchSection: React.FC<SkillSearchSectionProps> = ({
  selectedSkill,
  onSelectSkill,
  availableSkills,
  totalFundisCount,
  activeFundisCount,
  selectedCategory
}) => {
  const [inputValue, setInputValue] = useState(selectedSkill);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync external selectedSkill changes
  useEffect(() => {
    setInputValue(selectedSkill);
  }, [selectedSkill]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter skills matching the current input or category
  const filteredSkills = availableSkills.filter(s => {
    const matchesInput = !inputValue || s.name.toLowerCase().includes(inputValue.toLowerCase()) ||
      s.category.toLowerCase().includes(inputValue.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || s.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesInput && (matchesCategory || inputValue.length > 0);
  });

  // Highlight popular Kenyan artisan skills for quick tag selection
  const popularSkillTags = [
    'PPR Pipe Welding',
    'Three-Phase Wiring',
    'Geyser / Instant Shower Repair',
    'Solar Inverter Setup',
    'Drainage Unblocking',
    'Gypsum Ceiling Installation',
    'CCTV & Alarm Systems',
    'Water Tank Installation',
    'Tile Laying & Grouting',
    'Consumer Breaker Inspection'
  ];

  const handleApplySkill = (skillName: string) => {
    setInputValue(skillName);
    onSelectSkill(skillName);
    setIsOpen(false);
  };

  const handleClearSkill = () => {
    setInputValue('');
    onSelectSkill('');
    setIsOpen(false);
  };

  return (
    <section 
      id="skillset-search-container"
      className="bg-white border-b border-slate-200/90 py-4 px-4 sm:px-6 lg:px-8 shadow-xs"
    >
      <div className="max-w-7xl mx-auto space-y-3">
        
        {/* Top Header & Search Bar Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Section Title & Subtitle */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                <Wrench className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 font-['Outfit',sans-serif]">
                Search by Particular Skillset & Technical Trade
              </h2>
              {selectedSkill && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                  Filtered
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 pl-8 hidden sm:block">
              Filter registered artisans who possess specific certified techniques, specialized equipment, or niche installation skills.
            </p>
          </div>

          {/* Search Input Box */}
          <div ref={dropdownRef} className="relative w-full md:w-96">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                id="skillset-search-input"
                type="text"
                placeholder="Search skillset (e.g. PPR welding, solar, gypsum)..."
                value={inputValue}
                onFocus={() => setIsOpen(true)}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setIsOpen(true);
                  // If cleared, immediately clear parent filter
                  if (!e.target.value.trim() && selectedSkill) {
                    onSelectSkill('');
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputValue.trim()) {
                    handleApplySkill(inputValue.trim());
                  } else if (e.key === 'Escape') {
                    setIsOpen(false);
                  }
                }}
                className="w-full pl-9.5 pr-16 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-hidden transition shadow-2xs"
              />

              {/* Action buttons on the right inside input */}
              <div className="absolute right-2 flex items-center gap-1">
                {inputValue && (
                  <button
                    id="clear-skillset-btn"
                    onClick={handleClearSkill}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-md transition"
                    title="Clear skillset search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition"
                  title="Browse skillsets"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Dropdown Suggestions Menu */}
            {isOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-64 overflow-y-auto divide-y divide-slate-100">
                <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Certified Skills in Database</span>
                  <span>{filteredSkills.length} matches</span>
                </div>

                {filteredSkills.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500">
                    <p className="font-semibold">No direct skillset matches for "{inputValue}"</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Press Enter to search anyway or try another keyword.</p>
                    <button
                      onClick={() => handleApplySkill(inputValue)}
                      className="mt-2 px-3 py-1 bg-orange-50 text-orange-700 hover:bg-orange-100 font-bold rounded-lg text-xs transition"
                    >
                      Filter by "{inputValue}"
                    </button>
                  </div>
                ) : (
                  filteredSkills.map((skill) => {
                    const isSelected = selectedSkill.toLowerCase() === skill.name.toLowerCase();
                    return (
                      <button
                        key={skill.name}
                        onClick={() => handleApplySkill(skill.name)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition ${
                          isSelected
                            ? 'bg-orange-50 text-orange-950 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Tag className={`w-3.5 h-3.5 ${isSelected ? 'text-orange-600' : 'text-slate-400'}`} />
                          <div>
                            <div className="font-semibold text-slate-900">{skill.name}</div>
                            <div className="text-[10px] text-slate-400">{skill.category}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                            {skill.count} {skill.count === 1 ? 'fundi' : 'fundis'}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-orange-600" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}

          </div>

        </div>

        {/* Popular Skillset Chips / Quick Tags */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Popular Skills:</span>
          </span>

          {popularSkillTags.map((tag) => {
            const isSelected = selectedSkill.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                onClick={() => {
                  if (isSelected) {
                    handleClearSkill();
                  } else {
                    handleApplySkill(tag);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-orange-600 text-white shadow-xs ring-1 ring-orange-600'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 border border-slate-200/60'
                }`}
              >
                <span>{tag}</span>
                {isSelected ? (
                  <X className="w-3 h-3 text-white ml-0.5" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Active Skill Filter Banner if Selected */}
        {selectedSkill && (
          <div className="flex items-center justify-between bg-orange-50/80 border border-orange-200/80 rounded-xl px-3 py-2 text-xs text-orange-950 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
              <span>
                Filtering artisans with certified skillset: <strong className="font-extrabold text-orange-900">"{selectedSkill}"</strong> ({activeFundisCount} available)
              </span>
            </div>

            <button
              onClick={handleClearSkill}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-orange-100 text-orange-800 font-bold text-xs border border-orange-200 transition flex items-center gap-1 shrink-0"
            >
              <X className="w-3 h-3" />
              <span>Clear Skill Filter</span>
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
