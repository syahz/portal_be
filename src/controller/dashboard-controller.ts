import { Request, Response, NextFunction } from 'express'
import { getDashboard } from '../services/dashboard-services'

export const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getDashboard()
    res.status(200).json({ data })
  } catch (e) {
    next(e)
  }
}
