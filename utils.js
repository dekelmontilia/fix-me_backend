exports.filterObj = (obj, fieldsToKeep) => {
  return fieldsToKeep.reduce((acc, curr) => {
    if (obj[curr]) {
      acc[curr] = obj[curr]
    }
    return acc
  }, {})
}
