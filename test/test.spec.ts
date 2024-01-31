import * as chaiImport from 'chai'
import chaiHttp from 'chai-http'

const serverURL = 'http://localhost:3000'

const chai = chaiImport.use(chaiHttp)

describe('Basic HTTP functionality', function () {
  it(`GET '/' should return a status code of '200'`, function (done) {
    // Increase the timeout for the initial test in the event that the server
    // was started for the first time. If this is the case then it will have to
    // dynamicaly render some pages.
    //
    // Note the norm shouldn't be to increase test timeouts - only consider
    // doing so in the event of dynamic page rendering.
    this.timeout(10000)

    chai
      .request(serverURL)
      .get('/')
      .end((err, res) => {
        chai.assert.equal(err, null, `Ensure server is running`)

        // Note that what we really get is a `307` response for a redirect to
        // log in. Yet `chai-http` follows the returned link in the `Location`
        // header so look for a `200`. The `307` comes as a result of `auth.ts`
        // re-directing us to `/sign-in`
        chai.assert.equal(res.status, 200)
        done()
      })
  })
})
