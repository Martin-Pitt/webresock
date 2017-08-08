/* global WebSocket */

const adaptEventName = (eventName) => eventName === 'connect' ? 'open' : eventName
const adapt = (f, connection) => (eventName, ...args) => (f(adaptEventName(eventName), ...args) || true) && connection

module.exports = {
  reconnect: require('reconnect-core')((url, protocols) => {
    const ws = new WebSocket(url, protocols)
    const wsOnce = (eventName, listener) => ws.addEventListener(eventName, function onceListener (...args) {
      ws.removeEventListener(eventName, onceListener)
      listener(...args)
    })
    const connection = {}
    connection.on = adapt(ws.addEventListener.bind(ws), connection)
    connection.once = adapt(wsOnce, connection)
    connection.removeListener = adapt(ws.removeEventListener.bind(ws), connection)
    connection.send = ws.send.bind(ws)
    return connection
  }),
  backoff: require('backoff')
}
