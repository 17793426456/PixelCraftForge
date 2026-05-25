import { toast } from 'sonner'

/** 兼容 antd message API，便于逐步迁移 */
export const message = {
  success: (content) => toast.success(content),
  error: (content) => toast.error(content),
  warning: (content) => toast.warning(content),
  info: (content) => toast.info(content),
  loading: (content) => toast.loading(content),
}
