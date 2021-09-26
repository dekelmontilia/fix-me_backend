const Review = require('../models/reviewModel')
const Barbershop = require('../models/productModel')
const reviewService = require('../services/reviewService')

exports.getBarbershopReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      barbershop: req.params.barbershopId,
    }).populate('user')
    res.json(reviews)
  } catch (err) {
    res.status(500).send(err.message)
  }
}

exports.createReview = async (req, res) => {
  try {
    const { barbershopId } = req.params
    console.log('barbershopId:', barbershopId)
    const review = await Review.create({
      ...req.body,
      user: req.user._id.toString(),
      barbershop: barbershopId,
    })
    res.json(review)
  } catch (err) {
    console.log('err:', err)
    res.status(500).send(err.message)
  }
}

exports.removeReview = async (req, res) => {
  try {
    await Review.findByIdAndRemove(req.params.reviewId)
    res.send('removed')
  } catch (err) {
    res.status(500).send('couldnt remove review')
  }
}

exports.authorizeReviewEdit = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId)
    if (!review) {
      return res.status(404).send('Couldnt find review')
    }

    const isAllowedToEdit = reviewService.isAllowedToEdit(review, req.user._id)
    if (!isAllowedToEdit) {
      return res.status(403).send('You are not the owner of this review')
    }

    req.review = review
    next()
  } catch (err) {
    res.status(500).send(err.message)
  }
}
