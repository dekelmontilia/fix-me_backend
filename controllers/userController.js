const { filterObj } = require('../utils')
const User = require('../models/userModel')

module.exports = {
  getAllUsers,
  updateMe,
  deleteMe,
  saveMyMeasurements,
}

async function getAllUsers(req, res) {
  try {
    const users = await User.find()
    res.json(users)
  } catch (err) {
    console.log('err:', err)
    res.status(500).send(err)
  }
}

async function updateMe(req, res, next) {
  try {
    // 1) Delete not updatable fields
    const filteredBody = filterObj(req.body, ['name', 'email'])

    // 2) Update
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      }
    )

    res.json(updatedUser)
  } catch (err) {
    res.status(500).send(err.message)
  }
}

async function deleteMe(req, res) {
  try {
    await User.findByIdAndUpdate(req.user._id.toString(), { active: false })

    res.status(204).send('deleted')
  } catch (err) {
    res.status(500).send(err.message)
  }
}

async function saveMyMeasurements(req, res) {
  const { measurements } = req.body
  if (!measurements) {
    return res.status(403).send('missing measurements')
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { measurements },
      {
        new: true,
        runValidators: true,
      }
    )

    res.json(updatedUser)
  } catch (err) {
    res.status(500).send(err.message)
  }
}
