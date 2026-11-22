import React from 'react';
import { Check } from 'lucide-react';
import { CardOwner, CardDate } from '@/components/shared/CardMeta';
import { cn } from '@/lib/utils';
import { BAND_STYLES } from '@/components/programs/ProgramCard';

export default function StrategyCard({ strategy, onView, selected = false, onSelect }) {
  const period = strategy.start_year && strategy.end_year ?
  `${strategy.start_year} – ${strategy.end_year}` :
  strategy.start_year || '';
  return (
    <div
      onClick={() => onView?.(strategy)}
      className={cn(
        'group relative w-[360px] bg-white dark:bg-card border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl',
        selected ? 'border-primary shadow-md' : 'border-[#e9eaee] dark:border-border'
      )}
      style={{ boxShadow: '0 1px 3px rgba(20,25,40,.05)' }}>
      
      {/* Top band */}
      <div className={cn('h-16', BAND_STYLES[strategy.color]
        ? cn('bg-gradient-to-br from-10%', BAND_STYLES[strategy.color])
        : 'bg-[linear-gradient(135deg,#fff_10%,#dcecfd_100%)] dark:bg-[linear-gradient(135deg,hsl(var(--card))_10%,hsl(var(--primary)/0.22)_100%)]')} />
      

      <button
        type="button"
        onClick={(e) => {e.stopPropagation();onSelect?.(strategy);}}
        className={cn(
          'absolute top-3 left-3 w-5 h-5 rounded-full border flex items-center justify-center transition-colors',
          selected ?
          'bg-primary border-primary' :
          'bg-transparent border-[#9db8d8] hover:border-primary'
        )}
        aria-label={selected ? 'Deselect strategy' : 'Select strategy'}>
        
          {selected && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
        </button>

      <div className="px-[18px] pt-4 pb-[18px]">
        {/* Title row */}
        <div className="mb-3">
          <h3 className="text-[16px] font-bold text-[#14171f] dark:text-foreground leading-snug [font-family:'Inter',_ui-sans-serif,_system-ui,_sans-serif]">{strategy.title}</h3>
        </div>

        {/* Owner row */}
        <div className="space-y-1">
          <CardOwner name={strategy.owner} />
          <CardDate>{period}</CardDate>
        </div>
      </div>
    </div>);

}