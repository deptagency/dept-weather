import { ConditionSize } from 'components/Card/Condition/condition-size.model';
import ConditionIcon from 'components/Card/Condition/ConditionIcon';
import ConditionLabel from 'components/Card/Condition/ConditionLabel';

import styles from './Condition.module.css';

export default function Condition({
  condition,
  size,
  isNight
}: {
  condition: string | null | undefined;
  size: ConditionSize;
  isNight?: boolean;
}) {
  return (
    <div className={styles.condition}>
      <ConditionIcon condition={condition} isNight={isNight} size={size} useEmptyDivIfNoIcon={false} />
      <ConditionLabel condition={condition} size={size} />
    </div>
  );
}
