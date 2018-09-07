'use strict'

// Initialize a queue
module.exports = ({ max = 10 }) => {
  let queue = []
  let running = 0

  const unqueue = () => {
    if (running < max && queue.length > 0) {
      // Unqueue now
      const { job, resolve, reject } = queue.shift()
      running++
      const end = next => value => {
        running--
        unqueue()
        next(value)
      }
      job().then(end(resolve), end(reject))
    }
    // Otherwise: not ready to unqueue
    // Do nothing, next finished job will call "unqueue" itself
    // This is done this way so we can guarantee a fixed number of promises in memory
  }

  const queued = job =>
    new Promise((resolve, reject) => {
      // Resolved or rejected once queue is ready
      queue.push({ job, resolve, reject })
    })

  const add = job => {
    const promise = queued(job)
    unqueue()
    return promise
  }

  return add
}
