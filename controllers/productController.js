const Product = require('../models/productModel')
const APIFeatures = require('../services/apiFeatures')
const mongoose = require('mongoose')
const utils = require('../utils')
const barberhsopService = require('../services/barbershopService')
const { json } = require('express')
const fitTypes = ['height', 'weight', 'chest', 'waist', 'hips', 'feet']
const fitDefaultValuesMap = {
  min: 0,
  max: 100000,
}
const fitsMapDefault = fitTypes.reduce((acc, currType) => {
  acc[currType] = fitDefaultValuesMap
  return acc
}, {})

module.exports = {
  getAllProducts,
  getProductsMatchToFits,
  getProduct,
  createProduct,
  updateBarbershop,
  removeBarbershop,
  aliasTopTours,
  getStats,
  getMonthlyPlan,
  authorizeBarbershopEdit,
}

function aliasTopTours(req, res, next) {
  req.query.limit = '5'
  req.query.sort = '-ratingAverage,price'
  next()
}

async function getAllProducts(req, res) {
  try {
    const features = new APIFeatures(Product.find(), req.query)
    // .search()
    // .filter()
    // .sort()
    // .fieldsLimit()
    // .paginate()
    const products = await features.query
    let filteredProducts = products

    const { query } = req
    console.log('query:', query)

    if (query.size) {
      filteredProducts = _filterBySize(filteredProducts, query.size)
    }

    if (query.category) {
      filteredProducts = _filterByCategory(filteredProducts, query.category)
    }

    if (query.color) {
      filteredProducts = _filterByColor(filteredProducts, query.color)
    }

    if (query.myMeasurements) {
      filteredProducts = _filterByMyMeasurements(
        filteredProducts,
        req.user.measurements
      )
    }

    res.json(filteredProducts)
  } catch (err) {
    res.sendStatus(500).send(err.message)
  }
}

async function getProductsMatchToFits(req, res) {
  //an object with fit types and *absolute* values. not a range
  const fitsToMatch = req.body
  console.log('fitsToMatch:', fitsToMatch)

  //get all products
  const allProducts = await Product.find()

  //filter
  const matches = []
  const filteredProducts = allProducts.filter((currProduct) => {
    Object.keys(currProduct.inventory).forEach((currSizeKey) => {
      //check if the current size is good for the fitsToMatch
      const isGood = _checkIfFitMapIsGoodForFitMap(
        currProduct.inventory[currSizeKey].fitsMap,
        fitsToMatch
      )

      //if is good, push the current size to the allowed-profucts-with-sizes array
      if (!isGood) return

      const productIndex = matches.findIndex(
        (currMatch) => currMatch.product._id === currProduct._id
      )

      if (productIndex < 0) {
        //create a new one
        matches.push({
          product: currProduct,
          sizes: [currSizeKey],
        })
      } else {
        //push the size to the sizes field
        matches[productIndex].sizes.push(currSizeKey)
      }
    })
  })
  res.json(matches)
}

function _checkIfFitMapIsGoodForFitMap(candidateFitMap, filterFitMap) {
  const filterFitMapArr = Object.keys(filterFitMap)

  const isNotValid = filterFitMapArr.some((currFilterKey) => {
    if (
      filterFitMap[currFilterKey] < candidateFitMap[currFilterKey].min ||
      filterFitMap[currFilterKey] > candidateFitMap[currFilterKey].max
    ) {
      return true
    }
    return false
  })
  return !isNotValid
}

async function getProduct(req, res) {
  try {
    const product = await Product.findById(req.params.productId)
    res.json(product)
  } catch (err) {
    res.status(500).send(err.message)
  }
}

async function createProduct(req, res) {
  try {
    const newProduct = await Product.create({
      ...req.body,
      owner: req.user._id,
    })
    res.json(newProduct)
  } catch (err) {
    res.status(500).json(err.message)
  }
}

async function updateBarbershop(req, res) {
  try {
    const { barbershop } = req
    const allowedFields = barberhsopService.getEditableFields(req.body)
    // const allowedFields = barbershop.getEditableFields(req.body)

    const updatedBarbershop = await Product.findByIdAndUpdate(
      req.params.barbershopId,
      allowedFields,
      {
        new: true,
        runValidators: true,
      }
    )
    res.json(updatedBarbershop)
  } catch (err) {
    res.status(500).send(err.message)
  }
}

async function removeBarbershop(req, res) {
  try {
    const { barbershop } = req
    await barberhsopService.fullDelete(barbershop._id)

    res.send('removed')
  } catch (err) {
    res.status(500).send(err.message)
  }
}

async function getStats(req, res) {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: null,
          avgPrice: { $avg: '$price' },
        },
      },
    ])
    res.json(stats)
  } catch (err) {
    console.log('err:', err)
    res.sendStatus(500)
  }
}

async function getMonthlyPlan(req, res) {
  try {
    const result = await Product.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          toursAmount: { $sum: 1 },
          toursName: { $push: '$name' },
        },
      },
      {
        $addFields: {
          month: '$_id',
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ])
    res.json(result)
  } catch (err) {
    console.log('err:', err)
    res.sendStatus(500)
  }
}

async function authorizeBarbershopEdit(req, res, next) {
  try {
    const barbershop = await Product.findById(req.params.barbershopId).select(
      '+owner'
    )
    if (!barbershop) {
      return res.status(404).send('Couldnt find barershop')
    }

    const isAllowedToEdit = barberhsopService.isAllowedToEdit(
      barbershop,
      req.user._id
    )
    if (!isAllowedToEdit) {
      return res.status(403).send('You are not the owner of this barbershop')
    }

    req.barbershop = barbershop
    next()
  } catch (err) {
    res.status(500).send(err.message)
  }
}

function _filterBySize(filteredProducts, size) {
  return filteredProducts.filter((currProduct) =>
    Object.keys(currProduct.inventory).includes(size)
  )
}

function _filterByCategory(filteredProducts, category) {
  return filteredProducts.filter((currProduct) =>
    currProduct.categories.includes(category)
  )
}

function _filterByColor(filteredProducts, color) {
  return filteredProducts.filter((currProduct) =>
    Object.keys(currProduct.inventory).some((currSizeKey) =>
      Object.keys(currProduct.inventory[currSizeKey].colorsMap).includes(color)
    )
  )
}

function _filterByMyMeasurements(allProducts, fitsToMatch) {
  //an object with fit types and *absolute* values. not a range
  // const fitsToMatch = req.body

  console.log('fitsToMatch:', fitsToMatch)

  //filter
  const matches = []
  const filteredProducts = allProducts.filter((currProduct) => {
    Object.keys(currProduct.inventory).forEach((currSizeKey) => {
      //check if the current size is good for the fitsToMatch
      const isGood = _checkIfFitMapIsGoodForFitMap(
        currProduct.inventory[currSizeKey].fitsMap,
        fitsToMatch
      )

      //if is good, push the current size to the allowed-profucts-with-sizes array
      if (!isGood) return

      const productIndex = matches.findIndex(
        (currMatch) => currMatch.product._id === currProduct._id
      )

      if (productIndex < 0) {
        //create a new one
        matches.push({
          product: currProduct,
          sizes: [currSizeKey],
        })
      } else {
        //push the size to the sizes field
        matches[productIndex].sizes.push(currSizeKey)
      }
    })
  })
  console.log('matches:', matches)
  return matches
}
