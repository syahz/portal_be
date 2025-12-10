import express from 'express'
import { create, get, getById, update, remove } from '../../controller/user-app-access-controller'

const userAppAccessRoutes = express.Router()

userAppAccessRoutes.get('/', get)
userAppAccessRoutes.post('/', create)
userAppAccessRoutes.get('/:accessId', getById)
userAppAccessRoutes.put('/:accessId', update)
userAppAccessRoutes.delete('/:accessId', remove)

export default userAppAccessRoutes
