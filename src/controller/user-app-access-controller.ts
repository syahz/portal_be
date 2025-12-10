import { Request, Response, NextFunction } from 'express'
import {
  createUserAppAccess,
  getUserAppAccesses,
  getUserAppAccessById,
  updateUserAppAccess,
  deleteUserAppAccess
} from '../services/user-app-access-services'

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await createUserAppAccess(req.body)
    res.status(201).json({ data: response })
  } catch (e) {
    next(e)
  }
}

export const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const search = (req.query.search as string) || ''
    const response = await getUserAppAccesses(page, limit, search)
    res.status(200).json({ data: response })
  } catch (e) {
    next(e)
  }
}

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await getUserAppAccessById(req.params.accessId)
    res.status(200).json({ data: response })
  } catch (e) {
    next(e)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await updateUserAppAccess(req.params.accessId, req.body)
    res.status(200).json({ data: response })
  } catch (e) {
    next(e)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await deleteUserAppAccess(req.params.accessId)
    res.status(200).json({ data: response })
  } catch (e) {
    next(e)
  }
}
