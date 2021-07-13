const express = require('express')
const { UsersController } = require('../controllers/users.controller')

const router = express.Router()

router.post('/register', UsersController.register)
router.post('/login', UsersController.login)
router.post('/logout', UsersController.logout)
router.post('/validate', UsersController.validateUser)
router.put('/update', UsersController.update)
router.delete('/delete', UsersController.delete)

module.exports = router
