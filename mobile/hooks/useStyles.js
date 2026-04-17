import { useMemo } from 'react';
import useTheme from './useTheme';

export default function useStyles(stylesFactory) {
  const { C, S, isDark } = useTheme();
  return useMemo(() => stylesFactory(C, isDark, S), [C, isDark, S]);
}
