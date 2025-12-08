import { User, Unit, Role } from '@prisma/client'

export type UserLoginRequest = {
  email: string
  password: string
}

export type UserAuthorizeRequest = {
  client_id: string
  redirect_uri: string
}

export type UserTokenExchangeRequest = {
  code: string
  client_id: string
  client_secret: string
}
