import { CSSProperties } from 'react';
import { Color } from 'models/color.enum';

export interface WithCustomizableFillColor {
  fillColor?: Color;
}

export const iconStyle = (fillColor: Color = Color.FOREGROUND) =>
  ({
    '--icon-fill-color': `var(--${fillColor})`
  }) as CSSProperties;
