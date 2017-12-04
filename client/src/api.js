// Mock api

export const checkSession = () => new Promise((resolve, reject) => {
  setTimeout(() => resolve('fake user'), 250)
})

export const login = token => new Promise((resolve, reject) => {
  setTimeout(() => resolve(), 2000)
})
