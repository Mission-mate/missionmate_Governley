import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ELEVATED_CARD } from '@/components/shared/cardStyles';
import { glowBackground, GLOW_CARD } from '@/lib/glowCard';
import { useOrgProfile } from '@/hooks/useOrgProfile';
import { useAuth } from '@/lib/AuthContext';
import { useModules } from '@/hooks/useModules';
import { orderModules } from '@/lib/modules';
import { format } from 'date-fns';

/** Per-module card styling + destination, keyed by module id in src/lib/modules.js. */
const MODULE_CARD_STYLES = {
  contacts: { color: 'bg-amber-500 text-white', glow: 'oklch(0.94 0.055 75)', path: '/contacts' },
  grants: { color: 'bg-purple-500 text-white', glow: 'oklch(0.94 0.045 300)', path: '/grants/dashboard' },
  programs: { color: 'bg-teal-500 text-white', glow: 'oklch(0.94 0.045 185)', path: '/programs/overview' },
  board: { color: 'bg-rose-500 text-white', glow: 'oklch(0.94 0.045 15)', path: '/board/meetings' },
  membership: { color: 'bg-cyan-500 text-white', glow: 'oklch(0.94 0.045 210)', path: '/membership/members' },
  strategy: { color: 'bg-indigo-500 text-white', glow: 'oklch(0.94 0.045 275)', path: '/strategy/register' },
  risk: { color: 'bg-red-500 text-white', glow: 'oklch(0.94 0.05 28)', path: '/risk/dashboard' },
  compliance: { color: 'bg-module-contacts text-white', glow: 'oklch(0.94 0.045 45)', path: '/compliance/obligations' },
};


export default function Home() {
  const { name, logoUrl } = useOrgProfile();
  const { user } = useAuth();
  const { enabledModules, moduleOrder } = useModules();
  const modules = orderModules(moduleOrder)
    // Conversations is reached from the sidebar only; it never gets a home card.
    .filter((m) => m.id !== 'conversations' && enabledModules.includes(m.id))
    .map((m) => ({
      id: m.id,
      title: m.label,
      desc: m.description,
      icon: m.icon,
      ...(MODULE_CARD_STYLES[m.id] || {}),
    }));
  const orgName = name || 'Missionmate';
  const firstName = (user?.first_name || user?.full_name?.split(' ')[0] || '').trim();
  const dayName = format(new Date(), 'EEEE');
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8 flex items-center gap-4">
        
        {logoUrl &&
        <img
          src={logoUrl}
          alt={orgName}
          className="h-14 w-auto max-w-[200px] object-contain shrink-0" />

        }
        <div>
          <h1 className="font-serif font-normal text-foreground tracking-[-0.01em] leading-[1.05] text-[42px]">
            Happy {dayName}{firstName && `, ${firstName}`}. Welcome back
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Let's make Governance, Risk and Compliance simple for {orgName}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((mod, i) =>
        <motion.div
          key={mod.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}>
          
            <Link to={mod.path}>
              <Card
              className={`group border-0 transition-all duration-300 cursor-pointer h-full hover:-translate-y-0.5 ${ELEVATED_CARD} ${GLOW_CARD}`}
              style={{ background: glowBackground(mod.glow) }}>
                <CardContent className="p-5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${mod.color}`}>
                    <mod.icon className="w-[18px] h-[18px]" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{mod.title}</h3>
                  <p className="text-xs text-muted-foreground">{mod.desc}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Open <ArrowRight className="w-3 h-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )}
      </div>
    </div>);

}