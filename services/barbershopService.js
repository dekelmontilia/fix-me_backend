const Barbershop = require('../models/productModel')
const Review = require('../models/reviewModel')
const utils = require('../utils')

exports.isAllowedToEdit = function (barbershop, userId) {
  return userId.toString() == barbershop.owner.toString()
}

exports.getEditableFields = function (obj) {
  const fieldsToKeep = ['media', 'location', 'name']
  return utils.filterObj(obj, fieldsToKeep)
}

exports.fullDelete = async function (barbershopId) {
  console.log('barbershopId:', barbershopId)
  try {
    await Review.deleteMany({ barbershop: barbershopId })
    await Barbershop.findByIdAndRemove(barbershopId)
  } catch (err) {
    throw new Error(`Couldnt fully delete barbershop: ${err.message}`)
  }
}
