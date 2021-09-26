const express = require('express')
const userController = require('../controllers/userController')
const authController = require('../controllers/authController')
const router = express.Router()

router.post('/signup', authController.signup)
router.post('/login', authController.login)

router.patch(
  '/update-password',
  authController.protect,
  authController.updatePassword
)
router.patch(
  '/save-my-measurements',
  authController.protect,
  userController.saveMyMeasurements
)
router.patch('/update-me', authController.protect, userController.updateMe)
router.delete('/delete-me', authController.protect, userController.deleteMe)

router.route('').get(authController.protect, userController.getAllUsers)

module.exports = router
