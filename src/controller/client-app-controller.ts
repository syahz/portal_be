import { Request, Response, NextFunction } from 'express'
import { createClientApp, getAllClientApps, getClientApps, getClientAppById, updateClientApp, deleteClientApp } from '../services/client-app-services'

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await createClientApp(req.body)
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
    const response = await getClientApps(page, limit, search)
    res.status(200).json({ data: response })
  } catch (e) {
    next(e)
  }
}

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await getAllClientApps()
    res.status(200).json({ data: response })
  } catch (e) {
    next(e)
  }
}

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await getClientAppById(req.params.appId)
    res.status(200).json({ data: response })
  } catch (e) {
    next(e)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await updateClientApp(req.params.appId, req.body)
    res.status(200).json({ data: response })
  } catch (e) {
    next(e)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await deleteClientApp(req.params.appId)
    res.status(200).json({ data: response })
  } catch (e) {
    next(e)
  }
}
