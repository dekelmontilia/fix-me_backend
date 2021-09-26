const express = require('express')
const productController = require('../controllers/productController')
const reviewController = require('../controllers/reviewController')
const authController = require('../controllers/authController')
const router = express.Router()

// router.get('/stats', barbershopController.getStats)
// router.get('/monthly-plan/:year', barbershopController.getMonthlyPlan)

// router.get(
//   '/top-5-cheap',
//   barbershopController.aliasTopTours,
//   barbershopController.getAllBarbershops
// )

// router
//   .route('/:barbershopId/review')
//   .get(reviewController.getBarbershopReviews)
//   .post(authController.protect, reviewController.createReview)

router.post('/match-to-fits', productController.getProductsMatchToFits)
router.route('/:productId').get(productController.getProduct)
// .patch(
//   authController.protect,
//   authController.restrictTo('barber'),
//   barbershopController.authorizeBarbershopEdit,
//   barbershopController.updateBarbershop
// )
// .delete(
//   authController.protect,
//   authController.restrictTo('barber'),
//   barbershopController.authorizeBarbershopEdit,
//   barbershopController.removeBarbershop
// )

router
  .route('')
  .post(
    authController.protect,
    authController.restrictTo('seller'),
    productController.createProduct
  )
  .get(authController.protect, productController.getAllProducts)

module.exports = router
