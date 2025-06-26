import { Switch } from "@nextui-org/react";
import { Eye, EyeOff } from "lucide-react";
import styles from "./style.module.scss";

interface SwitchVisibilityProps {
  isSelected: boolean;
  onValueChange: (value: boolean) => void;
}

const SwitchVisibility = ({ isSelected, onValueChange }: SwitchVisibilityProps) => {
  return (
    <div className={styles.switchVisibilityContainer}>
      {isSelected ? (
        <Eye size={16} strokeWidth={1} className={styles.iconVisible} />
      ) : (
        <EyeOff size={16} strokeWidth={1} className={styles.iconHidden} />
      )}
      <Switch
        size="sm"
        isSelected={isSelected}
        onValueChange={onValueChange}
        classNames={{
          wrapper: isSelected ? styles.switchWrapper : styles.switchWrapperOff,
          thumb: styles.switchThumb,
        }}
      />
    </div>
    
  );
};

export default SwitchVisibility;