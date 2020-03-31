const FIFO = require('p-fifo')

module.exports = (options) => {
  options = options || {}

  let ended, onEnd
  const fifo = new FIFO()
  let pushable = false

  if (typeof options === 'function') {
    onEnd = options
    options = {}
  } else {
    onEnd = options.onEnd
  }

  const end = error => {
    ended = true
    if (onEnd) {
      onEnd(error)
      onEnd = null
    }
    fifo.push({ done: true, error })
    return pushable
  }

  pushable = {
    [Symbol.asyncIterator] () { return this },
    next: async () => fifo.shift(),
    return: () => {
      end()
    },
    throw: error => {
      // TODO: should not call onErr?
      end(error)
    },
    push: async value => {
      if (ended) { throw new Error('Pushing past end') }
      value = options.writev ? [value] : value
      await fifo.push({ value, done: false })
    },
    end
  }
  return pushable
}
