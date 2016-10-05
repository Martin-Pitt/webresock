const selenium = (() => {
  const selenium = require('selenium-standalone')
  return {
    install: (options = {}) => new Promise((resolve, reject) => selenium.install(options, (err) => err ? reject(err) : resolve())),
    start: (options = {}) => new Promise((resolve, reject) => selenium.start(options, (err, child) => err ? reject(err) : resolve(child)))
  }
})()

const drivers = {
  chrome: {
    version: '2.24',
    arch: process.arch,
    baseURL: 'http://chromedriver.storage.googleapis.com'
  }
}

const application = (() => {
  const path = require('path')
  const express = require('express')
  const app = express()
  let http
  let wss

  app.use(require('body-parser').text({ type: 'text/*' }))
  app.use('/webresock', express.static(path.normalize(path.join(__dirname, '..'))))
  app.get('/', (req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html'})
    res.end(`
      <!doctype HTML>
      <html>
        <head>
          <title>TEST</title>
        </head>
        <body>
          <div></div>
          <script src="/webresock/webresock.js"></script>
          <script>
            let counter = 0
            webresock.reconnect({
              strategy: new webresock.backoff.Backoff({
                next: () => 50,
                reset: () => undefined
              })
            })
            .on('connect', (ws) => {
              ws.on('message', (message) => {
                const div = document.querySelector('div')
                div.textContent = message.data
              })
              .send('SOCKTEST'+(++counter))
            })
            .connect('ws://localhost:${http.address().port}/')
          </script>
        </body>
      </html>
    `)
  })

  return {
    listen: () => new Promise((resolve, reject) => (http = app.listen(0, (err) => err ? reject(err) : resolve(http.address().port)))),
    close: () => new Promise((resolve, reject) => http.close((err) => err ? reject(err) : resolve())),
    wsStart: () => (wss = new (require('ws').Server)({ server: http }).on('connection', (ws) => ws.on('message', (message) => ws.send(message))))
    ? Promise.resolve()
    : Promise.reject('unable to create the websocket server'),
    wsStop: () => new Promise((resolve, reject) => wss.close((err) => err ? reject(err) : resolve()))
  }
})()

selenium.install({
  version: '2.53.1',
  baseURL: 'http://selenium-release.storage.googleapis.com',
  drivers
})
  .then(() => Promise.all([
    selenium.start({ spawnOptions: { stdio: 'ignore' }, drivers }),
    application.listen()
  ]))
  .then(([child, port]) => {
    const test = require('tape')
    const webdriverio = require('webdriverio')
    const wait = (ms) => (r) => new Promise((resolve) => setTimeout(() => resolve(r), ms))

    test('basic functionality', (t) => {
      const client = webdriverio.remote({ desiredCapabilities: { browserName: 'chrome' } })
      t.plan(4)
      t.timeoutAfter(10e3)
      client
        .init()
        .then(application.wsStart)
        .url(`http://localhost:${port}/`)
        .getTitle()
        .then((title) => t.equal(title, 'TEST', 'title is TEST'))
        .getText('div')
        .then((text) => t.equal(text, 'SOCKTEST1', 'div content is SOCKTEST1'))
        .then(application.wsStop)
        .then(application.wsStart)
        .then(wait(100))
        .getText('div')
        .then((text) => t.equal(text, 'SOCKTEST2', 'div content is SOCKTEST2'))
        .then(application.wsStop)
        .then(application.wsStart)
        .then(wait(100))
        .getText('div')
        .then((text) => t.equal(text, 'SOCKTEST3', 'div content is SOCKTEST3'))
        .end()
    })

    return new Promise((resolve) => test.onFinish(() => resolve(child.kill())))
  })
  .then(() => application.close())
  .catch(console.err)
