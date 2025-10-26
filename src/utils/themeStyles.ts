import type { UITheme } from '../store/useGameStore';

export interface ThemeStyles {
  // Outer overlay styles
  overlayBackground: string;
  overlayBackdrop: string;

  // Card/Container styles
  cardBackground: string;
  cardBorder: string;
  cardShadow: string;

  // Text colors
  headingText: string;
  bodyText: string;
  mutedText: string;

  // Commander card specific
  commanderCardBorder: string;
  commanderCardShadow: string;
  commanderCardBackground?: string;

  // Building card specific
  buildingCardBackground: string;
  buildingCardBorder: string;
  buildingCardSelectedBorder: string;
  buildingCardSelectedBackground: string;

  // Button styles
  primaryButtonBackground: string;
  primaryButtonHover: string;
  secondaryButtonBackground: string;
  secondaryButtonHover: string;
}

export const themeStyles: Record<UITheme, ThemeStyles> = {
  'dark-blur': {
    // Full opacity dark theme with subtle blur
    overlayBackground: 'bg-gradient-to-br from-gray-900 to-gray-950',
    overlayBackdrop: 'backdrop-blur-sm',

    cardBackground: 'bg-gray-800',
    cardBorder: 'border-2 border-gray-700',
    cardShadow: 'shadow-2xl shadow-black/50',

    headingText: 'text-white',
    bodyText: 'text-gray-200',
    mutedText: 'text-gray-400',

    commanderCardBorder: 'border-2',
    commanderCardShadow: 'shadow-lg shadow-black/30',
    commanderCardBackground: 'bg-gray-800/50',

    buildingCardBackground: 'bg-gray-800',
    buildingCardBorder: 'border-2 border-gray-600',
    buildingCardSelectedBorder: 'border-2 border-blue-500',
    buildingCardSelectedBackground: 'bg-blue-900/30',

    primaryButtonBackground: 'bg-blue-600 hover:bg-blue-700',
    primaryButtonHover: 'hover:shadow-lg hover:shadow-blue-500/30',
    secondaryButtonBackground: 'bg-gray-700 hover:bg-gray-600',
    secondaryButtonHover: 'hover:shadow-md',
  },

  'frosted-glass': {
    // Semi-transparent with heavy blur and glow
    overlayBackground: 'bg-black/40',
    overlayBackdrop: 'backdrop-blur-xl',

    cardBackground: 'bg-white/10',
    cardBorder: 'border border-white/20',
    cardShadow: 'shadow-2xl shadow-blue-500/20',

    headingText: 'text-white',
    bodyText: 'text-gray-100',
    mutedText: 'text-gray-300',

    commanderCardBorder: 'border border-white/30',
    commanderCardShadow: 'shadow-xl shadow-purple-500/20',
    commanderCardBackground: 'bg-white/5',

    buildingCardBackground: 'bg-white/10',
    buildingCardBorder: 'border-2 border-white/20',
    buildingCardSelectedBorder: 'border-2 border-blue-400/80',
    buildingCardSelectedBackground: 'bg-blue-500/20',

    primaryButtonBackground: 'bg-blue-500/80 hover:bg-blue-600/90',
    primaryButtonHover: 'hover:shadow-xl hover:shadow-blue-400/40',
    secondaryButtonBackground: 'bg-white/10 hover:bg-white/20',
    secondaryButtonHover: 'hover:shadow-lg hover:shadow-white/10',
  },
};

export const getThemeStyles = (theme: UITheme): ThemeStyles => {
  return themeStyles[theme];
};
