const mongoose = require('mongoose')
const validate = require('mongoose-validator')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const fitTypes = ['height', 'weight', 'chest', 'waist', 'hips', 'feet']

const defaultMesures = fitTypes.reduce((acc, currType) => {
  acc[currType] = 1
  return acc
}, {})

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    default: null,
  },
  type: {
    type: String,
    default: 'customer',
    enum: ['customer', 'seller'],
  },
  email: {
    type: String,
    required: [true, 'A User must have an Email'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: validate({
      validator: 'isEmail',
      message: 'Not valid email',
    }),
  },
  measurements: {
    type: {
      height: Number,
      weight: Number,
      chest: Number,
      waist: Number,
      hips: Number,
      feet: Number,
    },
    default: defaultMesures,
  },
  password: {
    type: String,
    required: [true, 'A User must have a password'],
    minLength: 4,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator(el) {
        return el === this.password
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  phoneNumber: {
    type: String,
    default: null,
  },
  profileImage: {
    type: String,
    default:
      'https://res.cloudinary.com/hadarush100/image/upload/v1627891316/user_1_pnvn87.png',
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Dont show non-active users...
userSchema.pre('find', async function (next) {
  this.find({ active: { $ne: false } })
  next()
})

// Encrypt passwords in DB...
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  this.passwordConfirm = undefined
  next()
})

// When updating the password - update the passwordChangedAt field
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next()
  this.passwordChangedAt = Date.now() - 1000
  next()
})

// A method for compare between the real password to the encrypted password in the DB
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword)
}

// A method for checking a reset password token relevance
userSchema.methods.checkTokenRelevance = function (JWTTimestamp) {
  if (!this.passwordChangedAt) return true
  const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)

  return JWTTimestamp > changedTimestamp
}

const User = mongoose.model('User', userSchema)

module.exports = User
