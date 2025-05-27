import styles from './style.module.scss';

const HeroText = () => {
  return (
      <div className={styles.hero}>
          <p>Enjoy Exploring Your</p>
          <h1>Third Place</h1>
          <p className={styles.barHub}>- Bar Hub -</p>
      </div>
  );
};

export default HeroText;
