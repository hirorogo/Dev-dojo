import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  emoji: string;
  description: ReactNode;
  link: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'プログラミング基礎',
    emoji: '💻',
    link: '/docs/object',
    description: (
      <>
        オブジェクト指向、SOLID原則、Reactコンポーネント設計など、
        実践で使える基礎知識をまとめています。
      </>
    ),
  },
  {
    title: '開発ツール',
    emoji: '🔧',
    link: '/docs/How to use git',
    description: (
      <>
        Git/GitHubの使い方、ブランチ戦略、コンフリクト解決など、
        チーム開発に必要なスキルを解説。
      </>
    ),
  },
  {
    title: 'スマホ改造ガイド',
    emoji: '📱',
    link: '/docs/category/スマホ改造ガイド',
    description: (
      <>
        Sony Xperiaのブートローダーアンロック、root化、DRM解析まで。
        文鎮化からの復旧記録も収録。
      </>
    ),
  },
];

function Feature({title, emoji, description, link}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <Link to={link} className={styles.featureLink}>
        <div className={styles.featureCard}>
          <div className="text--center">
            <div className={styles.featureEmoji}>{emoji}</div>
          </div>
          <div className="text--center padding-horiz--md">
            <Heading as="h3">{title}</Heading>
            <p>{description}</p>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
