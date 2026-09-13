import { useContext } from 'react'
import { ToastContext, type ToastApi } from '../components/common/toastContext'

export function useToast(): ToastApi {
  return useContext(ToastContext)
}
