import styles from './style.module.scss';

const HeroText = () => {
  return (
      <div className={styles.hero}>
          <h1>サードプレイスがあると全てがうまくまわりだす</h1>
          <p className={styles.barHub}>「行きつけのBar」を見つけ、家・職場に次ぐ第3の場所を手に入れよう</p>
      </div>
  );
};

export default HeroText;
