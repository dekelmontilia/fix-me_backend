const crypto = require('crypto')
const { promisify } = require('util')
const User = require('../models/userModel')
const jwt = require('jsonwebtoken')

module.exports = {
  signup,
  login,
  protect,
  restrictTo,
  updatePassword,
}

async function signup(req, res) {
  try {
    const { name, email, type, password, passwordConfirm, passwordChangedAt } =
      req.body
    const newUser = await User.create({
      name,
      email,
      type,
      password,
      passwordConfirm,
      passwordChangedAt,
    })

    const token = _getSignToken(newUser._id)

    const selectedUser = _getWithoutRestrictedFields(
      newUser.toObject({ useProjection: true })
    )

    res.status(201).json({ token, user: selectedUser })
  } catch (err) {
    console.log('err:', err)
    res.status(500).send(err.message)
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).send('Please provide email and password')
    }

    const user = await User.findOne({ email }).select('+password')
    const isCorrect = await user?.correctPassword(password, user.password)
    if (!user || !isCorrect)
      return res.status(401).send('Incorrect email or password')

    const token = _getSignToken(user._id)
    const selectedUser = _getWithoutRestrictedFields(
      user.toObject({ useProjection: true })
    )
    res.json({
      user: selectedUser,
      token,
    })
  } catch (err) {
    res.status(500).send(err.message)
  }
}

async function protect(req, res, next) {
  try {
    let token
    // 1) Getting token and check of its there
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).send('You are not logged in. Please log in')
    }

    // 2) Check if the token is valid
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

    // 3) Check if the user is exist
    const currUser = await User.findById(decoded.id)
    if (!currUser) throw new Error('User not exist')

    // 4) Check if this token created only after the last password updated
    const isTokenRelevant = currUser.checkTokenRelevance(decoded.iat)
    if (!isTokenRelevant) {
      throw new Error('Token isnt relevant')
    }

    req.user = currUser
    next()
  } catch (err) {
    console.log('err:', err)
    res.status(500).send(err.message)
    // res.status(500).send('hey')
  }
}

function restrictTo(...types) {
  return function (req, res, next) {
    if (!types.includes(req.user.type)) {
      return res
        .status(403)
        .send('You dont have permission to perdorm this action')
    }
    next()
  }
}

async function updatePassword(req, res, next) {
  try {
    // 1) Get user from collection
    const user = await User.findById(req.user._id).select('+password')

    // 2) Check if POSTed current password is correct
    const { lastPassword, password, passwordConfirm } = req.body
    if (!lastPassword)
      return res.status(401).send('You need to give your last password')
    if (!(await user?.correctPassword(lastPassword, user.password))) {
      return res.status(401).send('Password is wrong')
    }

    // 3) If so - update password
    user.password = password
    user.passwordConfirm = passwordConfirm
    await user.save()

    // 4) Log user in, sign JWT
    const token = _getSignToken(user._id)

    res.json(token)
  } catch (err) {
    res.status(500).send(err.message)
  }
}

function _getSignToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  })
}

function _getWithoutRestrictedFields(userObj) {
  const restrictedFields = ['active', 'password', '__v', 'passwordChangedAt']
  return restrictedFields.reduce(
    (acc, curr) => {
      delete acc[curr]
      return acc
    },
    { ...userObj }
  )
}
