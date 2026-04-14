import { useRouter } from 'vue-router'

export function useGoBack() {
  const router = useRouter()

  function goBack() {
    if (window.history.length > 1)
      router.back()
    else
      router.push('/')
  }

  return { goBack }
}
