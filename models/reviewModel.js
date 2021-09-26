const mongoose = require('mongoose')
const Barbershop = require('./productModel')

const reviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      reuired: [true, 'A Review must have a rating'],
      min: 0,
      max: 5,
    },
    text: {
      type: String,
      deafult: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A Review must have an owner'],
      unique: true,
    },
    barbershop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Barbershop',
      required: [true, 'A Review must have a barbershop'],
      validate: {
        validator: async function (el) {
          console.log('hey')
          const barbershop = await mongoose.model('Barbershop').findById(el)
          if (!barbershop) {
            return false
          }
          return true
        },
        message: "Couldnt find the review's barbershop",
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

const Review = mongoose.model('Review', reviewSchema)

module.exports = Review
