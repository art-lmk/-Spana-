import React from 'react';
import { 
  Wrench, 
  Zap, 
  Hammer, 
  Paintbrush, 
  BrickWall, 
  Cpu, 
  Flame, 
  Shield, 
  Wind, 
  Trees, 
  Sun, 
  ShieldCheck, 
  Car, 
  Layers, 
  HardHat, 
  Sparkles 
} from 'lucide-react';

export interface CategoryMeta {
  id: string;
  label: string;
  count?: number;
  icon: React.FC<{ className?: string }>;
  colorClass?: string;
  badgeClass?: string;
}

export function getCategoryIcon(categoryName: string): React.FC<{ className?: string }> {
  if (!categoryName || categoryName === 'All') return Sparkles;
  
  const c = categoryName.toLowerCase();
  if (c.includes('plumb') || c.includes('pipe') || c.includes('drain') || c.includes('water') || c.includes('pump')) return Wrench;
  if (c.includes('electr') || c.includes('wire') || c.includes('power') || c.includes('circuit')) return Zap;
  if (c.includes('carp') || c.includes('wood') || c.includes('joiner') || c.includes('timber') || c.includes('cabinet')) return Hammer;
  if (c.includes('paint') || c.includes('decorat') || c.includes('coat')) return Paintbrush;
  if (c.includes('mason') || c.includes('brick') || c.includes('tile') || c.includes('tiling') || c.includes('concrete') || c.includes('plaster')) return BrickWall;
  if (c.includes('appliance') || c.includes('fridge') || c.includes('cooker') || c.includes('machine') || c.includes('electronic')) return Cpu;
  if (c.includes('weld') || c.includes('fabricat') || c.includes('metal') || c.includes('steel') || c.includes('iron')) return Flame;
  if (c.includes('roof') || c.includes('gutter') || c.includes('mabati') || c.includes('waterproof')) return Shield;
  if (c.includes('hvac') || c.includes('air cond') || c.includes('cool') || c.includes('refrigerat') || c.includes('ac')) return Wind;
  if (c.includes('solar') || c.includes('pv') || c.includes('photovoltaic') || c.includes('inverter')) return Sun;
  if (c.includes('security') || c.includes('cctv') || c.includes('alarm') || c.includes('biometric')) return ShieldCheck;
  if (c.includes('mechanic') || c.includes('motor') || c.includes('auto') || c.includes('vehicle')) return Car;
  if (c.includes('interior') || c.includes('gypsum') || c.includes('ceiling') || c.includes('fit-out')) return Layers;
  if (c.includes('landscap') || c.includes('garden') || c.includes('lawn') || c.includes('irrigation')) return Trees;

  return HardHat;
}

export function getCategoryBadgeClass(categoryName: string): string {
  const c = categoryName.toLowerCase();
  if (c.includes('plumb') || c.includes('pipe')) return 'bg-cyan-50 text-cyan-800 border-cyan-200';
  if (c.includes('electr') || c.includes('wire')) return 'bg-amber-50 text-amber-800 border-amber-200';
  if (c.includes('carp') || c.includes('wood')) return 'bg-orange-50 text-orange-800 border-orange-200';
  if (c.includes('paint')) return 'bg-rose-50 text-rose-800 border-rose-200';
  if (c.includes('mason') || c.includes('tile')) return 'bg-stone-100 text-stone-800 border-stone-300';
  if (c.includes('appliance')) return 'bg-indigo-50 text-indigo-800 border-indigo-200';
  if (c.includes('weld') || c.includes('metal')) return 'bg-red-50 text-red-800 border-red-200';
  if (c.includes('roof')) return 'bg-blue-50 text-blue-800 border-blue-200';
  if (c.includes('hvac') || c.includes('refrigerat')) return 'bg-teal-50 text-teal-800 border-teal-200';
  if (c.includes('solar') || c.includes('pv')) return 'bg-yellow-50 text-yellow-800 border-yellow-200';
  if (c.includes('security') || c.includes('cctv')) return 'bg-purple-50 text-purple-800 border-purple-200';
  if (c.includes('mechanic') || c.includes('motor')) return 'bg-slate-100 text-slate-800 border-slate-300';
  if (c.includes('interior') || c.includes('gypsum')) return 'bg-violet-50 text-violet-800 border-violet-200';
  if (c.includes('landscap')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';

  return 'bg-slate-100 text-slate-800 border-slate-200';
}
