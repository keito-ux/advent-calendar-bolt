import { CalendarTheme } from '../lib/types';
import { themes } from '../lib/themes';
import { Check } from 'lucide-react';

interface ThemeSelectorProps {
  selectedTheme: CalendarTheme;
  onSelectTheme: (theme: CalendarTheme) => void;
}

export function ThemeSelector({ selectedTheme, onSelectTheme }: ThemeSelectorProps) {
  return (
    <div>
      <label className="block text-white/90 font-medium mb-3">
        テーマを選択
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.values(themes).map((theme) => (
          <button
            key={theme.id}
            onClick={() => onSelectTheme(theme.id)}
            className={`relative rounded-lg overflow-hidden transition-all ${
              selectedTheme === theme.id
                ? 'ring-4 ring-white/50 scale-105'
                : 'hover:scale-105'
            }`}
          >
            <div
              className="h-24 w-full"
              style={{ background: theme.preview }}
            />
            <div className="bg-black/40 backdrop-blur-sm p-3">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="text-white font-semibold text-sm">{theme.name}</div>
                  <div className="text-white/60 text-xs">{theme.description}</div>
                </div>
                {selectedTheme === theme.id && (
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
