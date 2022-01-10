const chai = require('chai')
const chaiHttp = require('chai-http')
const assert = chai.assert
const server = require('../price-server')
const expect = require('chai').expect
chai.use(chaiHttp)

// configure I2P_HOST and API_KEY first
suite('Functional Tests', () => {

  test('Get price', (done) => {
    chai.request(`http://localhost:${server.PORT}`)
      .get('/price/xmr')
      .end(function(err, res) {
        if (err) done(err)
        // MUST USE assertion with chaiHttp or it will hang!
        expect(res.body).to.have.property("BTC")
        assert.strictEqual(res.status, 200)
        done()
    })
  })

})
