import type { CertificateCreatePayload } from '~~/shared/schemas'

export function useCertificatesApi() {
  const client = useApiClient()
  const kioskApi = useKioskApi()

  return {
    create(payload: CertificateCreatePayload) {
      return client.request('/api/certificate/add', {
        body: payload,
        method: 'POST',
        successMessage: 'Сертификат создан'
      })
    },
    update(id: string, payload: Partial<CertificateCreatePayload>) {
      return client.request(`/api/certificate/${id}`, {
        body: payload,
        method: 'PATCH',
        successMessage: 'Сертификат обновлен'
      })
    },
    remove(id: string) {
      return client.request(`/api/certificate/${id}`, {
        method: 'DELETE',
        successMessage: 'Сертификат удален'
      })
    },
    listActive() {
      return client.request('/api/certificate/active')
    },
    lookup(code: string) {
      return kioskApi.certificate(code)
    }
  }
}
