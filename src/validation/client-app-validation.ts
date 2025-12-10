import { z } from 'zod'

export class ClientAppValidation {
  static readonly CREATE = z.object({
    name: z.string().min(1, 'Nama aplikasi tidak boleh kosong').max(100, 'Nama aplikasi maksimal 100 karakter'),
    description: z.string().max(255, 'Deskripsi maksimal 255 karakter'),
    client_id: z.string().min(3, 'Client ID minimal 3 karakter').max(50, 'Client ID maksimal 50 karakter'),
    client_secret: z.string().min(8, 'Client Secret minimal 8 karakter').max(100, 'Client Secret maksimal 100 karakter'),
    redirect_uri: z.url('Redirect URI harus berupa URL yang valid'),
    dashboard_url: z.url('Dashboard URL harus berupa URL yang valid')
  })

  static readonly UPDATE = z.object({
    name: z.string().min(1, 'Nama aplikasi tidak boleh kosong').max(100, 'Nama aplikasi maksimal 100 karakter').optional(),
    description: z.string().max(255, 'Deskripsi maksimal 255 karakter').optional(),
    client_id: z.string().min(3, 'Client ID minimal 3 karakter').max(50, 'Client ID maksimal 50 karakter').optional(),
    client_secret: z.string().min(8, 'Client Secret minimal 8 karakter').max(100, 'Client Secret maksimal 100 karakter').optional(),
    redirect_uri: z.url('Redirect URI harus berupa URL yang valid').optional(),
    dashboard_url: z.url('Dashboard URL harus berupa URL yang valid').optional()
  })
}
