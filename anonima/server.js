'use strict'
require('dotenv').config()
const express     = require('express')
const apiRoutes   = require('./routes/api.js')
const runner      = require('./test-runner')
const app         = express()

app.use('/public', express.static(process.cwd() + '/public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//Sample front-end
app.route('/xmr/:board/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/board.html')
  })
app.route('/xmr/:board/:threadid')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/thread.html')
  })

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html')
  })

//Routing for API 
apiRoutes(app)

//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found')
})

//Start our server and tests!
const listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port)
  if(process.env.NODE_ENV==='test') {
    console.log('Running Tests...')
    setTimeout(function () {
      try {
        runner.run()
      } catch(e) {
        console.log('Tests are not valid:')
        console.error(e)
      }
    }, 1500)
  }
})

module.exports = listener //for testing
