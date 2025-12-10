import express from 'express'
import { create, get, getAll, getById, update, remove } from '../../controller/client-app-controller'

const clientAppRoutes = express.Router()

clientAppRoutes.get('/', get)
clientAppRoutes.get('/all', getAll)
clientAppRoutes.post('/', create)
clientAppRoutes.get('/:appId', getById)
clientAppRoutes.put('/:appId', update)
clientAppRoutes.delete('/:appId', remove)

export default clientAppRoutes
