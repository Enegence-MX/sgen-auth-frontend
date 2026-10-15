import { useTranslation } from 'react-i18next'
import styles from './AuthBrandPanel.module.css'

export function AuthBrandPanel() {
  const { t } = useTranslation()
  return (
    <div className={styles.panel}>
      <svg width="600" height="900" viewBox="0 0 600 900" className={styles.backgroundSvg} aria-hidden="true" preserveAspectRatio="xMidYMax slice">
        <polygon points="260,900 600,704 600,804 433,900" fill="#1F2757"></polygon>
        <polygon points="120,900 600,623 600,690 237,900" fill="#23306E"></polygon>
        <polygon points="330,560 600,404 600,470 444,560" fill="#2B3F8F" opacity="0.55"></polygon>
        <polygon points="380,650 520,570 560,592 420,672" fill="#1D7A3A" opacity="0.8"></polygon>
        <polygon points="420,672 560,592 600,614 460,694" fill="#C3D42A" opacity="0.55"></polygon>
      </svg>
      
      <div className={styles.header}>
        <div className={styles.logoBox}>
          <img src="/assets/logo-simbolo.png" alt="" className={styles.logoImage} onError={(e) => e.currentTarget.style.display = 'none'} />
        </div>
        <div className={styles.brandName}>ENEGENCE</div>
      </div>
      
      <div className={styles.content}>
        <div className={styles.title}>SGEn</div>
        <div className={styles.subtitle}>{t('auth.brandSubtitle')}</div>
        <div className={styles.features}>
          <div className={styles.featureItem}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C3D42A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>
            {t('auth.brandFeature1')}
          </div>
          <div className={styles.featureItem}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C3D42A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>
            {t('auth.brandFeature2')}
          </div>
          <div className={styles.featureItem}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C3D42A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>
            {t('auth.brandFeature3')}
          </div>
        </div>
      </div>
      
      <div className={styles.footer}>
        {t('auth.brandFooter')}
      </div>
    </div>
  )
}
