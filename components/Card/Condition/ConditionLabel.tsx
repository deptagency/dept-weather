import { ConditionSize } from './condition-size.model';
import styles from './Condition.module.css';

const MAXIMUM_CONDITION_TEXT_LENGTH = 20;
export default function ConditionLabel({
  condition,
  size
}: {
  condition: string | null | undefined;
  size: ConditionSize;
}) {
  return (
    <p className={`${styles.condition__label} ${styles[`condition__label--${size}`]}`}>
      {condition ? (condition.length > MAXIMUM_CONDITION_TEXT_LENGTH ? condition.split(' and ')[0] : condition) : '–'}
    </p>
  );
}
