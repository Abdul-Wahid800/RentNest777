// RentNest Design System — Dark & Light Themes
export const Colors = {
  // Brand Palette
  primary:       '#7C3AED', // Vivid violet
  primaryLight:  '#A78BFA',
  primaryDark:   '#5B21B6',
  secondary:     '#06B6D4', // Cyan accent
  secondaryLight:'#67E8F9',
  accent:        '#F59E0B', // Amber for trust/highlights
  accentLight:   '#FCD34D',
  success:       '#10B981',
  warning:       '#F59E0B',
  error:         '#EF4444',
  info:          '#3B82F6',

  // Dark Theme
  dark: {
    bg:           '#0F0F1A',
    bgCard:       '#1A1A2E',
    bgElevated:   '#16213E',
    bgModal:      '#1E1E35',
    border:       '#2D2D50',
    borderLight:  '#3D3D65',
    text:         '#F0F0FF',
    textSub:      '#9999CC',
    textMuted:    '#6666AA',
    tabBar:       '#12122A',
    inputBg:      '#1E1E38',
    shimmer:      '#252545',
  },

  // Light Theme
  light: {
    bg:           '#F8F7FF',
    bgCard:       '#FFFFFF',
    bgElevated:   '#F0EEFF',
    bgModal:      '#FFFFFF',
    border:       '#E5E0FF',
    borderLight:  '#EDE8FF',
    text:         '#1A1A2E',
    textSub:      '#555580',
    textMuted:    '#9090BB',
    tabBar:       '#FFFFFF',
    inputBg:      '#F0EEFF',
    shimmer:      '#F5F3FF',
  },

  // Category colors
  categories: {
    Tools:       '#EF4444',
    Kitchen:     '#F59E0B',
    Electronics: '#3B82F6',
    Furniture:   '#8B5CF6',
    Sports:      '#10B981',
    Garden:      '#22C55E',
    Clothing:    '#EC4899',
    Books:       '#F97316',
    Toys:        '#A855F7',
    Cleaning:    '#06B6D4',
    Party:       '#E11D48',
    Other:       '#64748B',
  }
};

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium:  'System',
    bold:    'System',
  },
  size: {
    xs:   11,
    sm:   13,
    md:   15,
    lg:   17,
    xl:   20,
    xxl:  24,
    xxxl: 30,
    hero: 38,
  },
  weight: {
    normal:    '400',
    medium:    '500',
    semibold:  '600',
    bold:      '700',
    extrabold: '800',
  },
  lineHeight: {
    tight:  1.2,
    normal: 1.5,
    loose:  1.8,
  }
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 28,
  xxxl:40,
};

export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  28,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 12,
  },
  glow: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.40,
    shadowRadius: 20,
    elevation: 15,
  }
};

export const getTheme = (isDark = true) => {
  const c = isDark ? Colors.dark : Colors.light;
  return { Colors, c, Typography, Spacing, Radius, Shadow, isDark };
};

export default getTheme;
