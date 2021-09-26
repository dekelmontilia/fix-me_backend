const Review = require('../models/reviewModel')

exports.isAllowedToEdit = (review, userId) => {
  return review.user.toString() == userId
}
