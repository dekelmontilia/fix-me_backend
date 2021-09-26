const express = require('express')
const reviewController = require('../controllers/reviewController')
const authController = require('../controllers/authController')
const router = express.Router()

router
  .route('/:reviewId')
  .delete(
    authController.protect,
    reviewController.authorizeReviewEdit,
    reviewController.removeReview
  )

module.exports = router
