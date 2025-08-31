import styles from './page.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>250830 POC 프로젝트</h1>
          <p className={styles.description}>
            React와 Next.js로 구성된 프로젝트입니다.
          </p>
          <p className={styles.description}>
            <code className={styles.code}>app/page.js</code> 파일을 수정하여 시작하세요.
          </p>
        </header>
        
        <div className={styles.grid}>
          <a href="/api" className={styles.card}>
            <h2>API Routes &rarr;</h2>
            <p>Next.js API Routes를 사용한 백엔드 기능</p>
          </a>

          <a href="https://nextjs.org/docs" className={styles.card} target="_blank" rel="noopener noreferrer">
            <h2>Documentation &rarr;</h2>
            <p>Next.js 공식 문서를 확인하세요</p>
          </a>

          <a href="https://nextjs.org/learn" className={styles.card} target="_blank" rel="noopener noreferrer">
            <h2>Learn &rarr;</h2>
            <p>Next.js 튜토리얼로 학습하세요</p>
          </a>

          <a href="https://vercel.com/new" className={styles.card} target="_blank" rel="noopener noreferrer">
            <h2>Deploy &rarr;</h2>
            <p>Vercel로 즉시 배포하세요</p>
          </a>
        </div>
      </main>
    </div>
  )
}
