import ConditionIcon from './ConditionIcon';
import ConditionLabel from './ConditionLabel';
import { ConditionSize } from './condition-size.model';
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
      <ConditionIcon condition={condition} size={size} useEmptyDivIfNoIcon={false} isNight={isNight}></ConditionIcon>
      <ConditionLabel condition={condition} size={size}></ConditionLabel>
    </div>
  );
}
