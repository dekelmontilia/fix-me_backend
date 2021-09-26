class APIFeatures {
  constructor(query, queryObj) {
    this.query = query
    this.queryObj = queryObj
  }

  filter() {
    //1) regular filtering
    const queryObjCopy = { ...this.queryObj }
    const excludedFilters = ['page', 'sort', 'limit', 'fields', 'search']
    excludedFilters.forEach((item) => delete queryObjCopy[item])

    //1) adavanced filtering
    let queryStr = JSON.stringify(queryObjCopy)
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`)

    this.query.find(JSON.parse(queryStr))

    return this
  }

  search() {
    const searchString = this.queryObj.search || ''
    this.query.find({
      name: { $regex: `.*${searchString}.*`, $options: 'i' },
    })

    return this
  }

  sort() {
    if (this.queryObj.sort) {
      const sortBy = this.queryObj.sort.split(',').join(' ')
      this.query = this.query.sort(sortBy)
    } else {
      this.query = this.query.sort('-createdAt')
    }
    return this
  }
  fieldsLimit() {
    if (this.queryObj.fields) {
      const fields = this.queryObj.fields.split(',').join(' ')
      this.query = this.query.select(fields)
    } else {
      this.query = this.query.select('-__v')
    }
    return this
  }
  paginate() {
    const page = +this.queryObj.page || 1
    const limit = +this.queryObj.limit || 100
    const skip = (page - 1) * limit

    this.query = this.query.skip(skip).limit(limit)
    return this
  }
}

module.exports = APIFeatures
