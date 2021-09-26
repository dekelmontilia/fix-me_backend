const utilService = require('../services/util.service')

module.exports = [
  {
    name: 'all',
    getFiltered(barbershops) {
      return barbershops
    },
  },
  {
    name: 'men',
    getFiltered(barbershops) {
      return _filterByHaircutType(barbershops, this.name)
    },
  },
  {
    name: 'women',
    getFiltered(barbershops) {
      return _filterByHaircutType(barbershops, this.name)
    },
  },
  {
    name: 'boys',
    getFiltered(barbershops) {
      return _filterByHaircutType(barbershops, this.name)
    },
  },
  {
    name: 'girls',
    getFiltered(barbershops) {
      return _filterByHaircutType(barbershops, this.name)
    },
  },
]

function _filterByHaircutType(barbershops, haricutType) {
  return barbershops.filter((currBarbershop) => {
    const barbershopHaircutTypes =
      utilService.getBarbershopHaircutTypes(currBarbershop)
    console.log('barbershopHaircutTypes:', barbershopHaircutTypes)
    return barbershopHaircutTypes.includes(haricutType)
  })
}
