import {Spinner} from "@nextui-org/react";
import styles from "./style.module.scss";

// ローディング
const Loading = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <Spinner className={styles.loading}/>
    </div>
  )
}

export default Loading