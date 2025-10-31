import { CalendarTheme } from './types';

export interface ThemeConfig {
  id: CalendarTheme;
  name: string;
  description: string;
  gradient: string;
  cardBackground: string;
  textColor: string;
  accentColor: string;
  preview: string;
}

export const themes: Record<CalendarTheme, ThemeConfig> = {
  default: {
    id: 'default',
    name: 'クラシッククリスマス',
    description: '伝統的な赤と緑のクリスマス',
    gradient: 'from-red-900 via-green-900 to-red-950',
    cardBackground: 'bg-red-100/20 backdrop-blur-lg',
    textColor: 'text-white',
    accentColor: 'bg-red-600',
    preview: 'linear-gradient(135deg, #7f1d1d 0%, #14532d 50%, #450a0a 100%)',
  },
  winter: {
    id: 'winter',
    name: 'ホワイトクリスマス',
    description: '雪と氷のクリスマス',
    gradient: 'from-blue-900 via-cyan-900 to-blue-950',
    cardBackground: 'bg-blue-100/20 backdrop-blur-lg',
    textColor: 'text-white',
    accentColor: 'bg-cyan-500',
    preview: 'linear-gradient(135deg, #1e3a8a 0%, #164e63 50%, #1e3a8a 100%)',
  },
  festive: {
    id: 'festive',
    name: 'ゴールドクリスマス',
    description: '華やかな金色のクリスマス',
    gradient: 'from-amber-900 via-yellow-900 to-amber-950',
    cardBackground: 'bg-amber-100/20 backdrop-blur-lg',
    textColor: 'text-white',
    accentColor: 'bg-amber-600',
    preview: 'linear-gradient(135deg, #78350f 0%, #713f12 50%, #451a03 100%)',
  },
  cozy: {
    id: 'cozy',
    name: '暖炉とココア',
    description: '暖かいクリスマスイブ',
    gradient: 'from-orange-900 via-red-900 to-amber-950',
    cardBackground: 'bg-orange-100/20 backdrop-blur-lg',
    textColor: 'text-white',
    accentColor: 'bg-orange-600',
    preview: 'linear-gradient(135deg, #7c2d12 0%, #7f1d1d 50%, #451a03 100%)',
  },
  elegant: {
    id: 'elegant',
    name: 'シルバークリスマス',
    description: 'エレガントな銀世界',
    gradient: 'from-slate-800 via-gray-800 to-slate-900',
    cardBackground: 'bg-white/15 backdrop-blur-lg',
    textColor: 'text-white',
    accentColor: 'bg-slate-500',
    preview: 'linear-gradient(135deg, #1e293b 0%, #1f2937 50%, #0f172a 100%)',
  },
  galaxy: {
    id: 'galaxy',
    name: 'オーロラクリスマス',
    description: '神秘的な北欧のクリスマス',
    gradient: 'from-emerald-900 via-teal-900 to-cyan-950',
    cardBackground: 'bg-emerald-100/20 backdrop-blur-lg',
    textColor: 'text-white',
    accentColor: 'bg-emerald-600',
    preview: 'linear-gradient(135deg, #064e3b 0%, #134e4a 50%, #164e63 100%)',
  },
};

export function getThemeConfig(theme: CalendarTheme = 'default'): ThemeConfig {
  return themes[theme] || themes.default;
}
