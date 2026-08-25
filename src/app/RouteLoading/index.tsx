import { useTranslation } from 'react-i18next'

export const RouteLoading = () => {
  const { t } = useTranslation()

  return (
    <main>
      <p role="status" aria-live="polite">
        {t('routes.loading')}
      </p>
    </main>
  )
}
