import { z } from 'zod'

export class UserAppAccessValidation {
  static readonly CREATE = z.object({
    user_id: z.string().min(1, 'User ID wajib diisi'),
    app_id: z.string().min(1, 'App ID wajib diisi')
  })

  static readonly UPDATE = z.object({
    user_id: z.string().min(1, 'User ID wajib diisi').optional(),
    app_id: z.string().min(1, 'App ID wajib diisi').optional()
  })
}
