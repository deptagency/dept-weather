import { useEffect, useState } from 'react';
import { UI_ANIMATION_DURATION } from 'constants/client';

// For keeping elements in the DOM until a UI animation completes
export const useShouldContinueRendering = (isExpanded: boolean) => {
  const [shouldContinueRendering, setShouldContinueRendering] = useState<boolean>(false);
  useEffect(() => {
    isExpanded
      ? setShouldContinueRendering(true)
      : setTimeout(() => setShouldContinueRendering(false), UI_ANIMATION_DURATION + 50);
  }, [isExpanded]);
  return shouldContinueRendering;
};
