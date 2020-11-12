export const isObject = (value) => typeof value === 'object' && value !== null
export const isString = (value) => typeof value === 'string'
export const isNumber = (value) => typeof value === 'number'
export const isText = (v) => isString(v) || isNumber(v)
export const isArray = Array.isArray
