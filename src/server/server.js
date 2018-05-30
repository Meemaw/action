import express from 'express'
import webpack from 'webpack' // eslint-disable-line import/no-extraneous-dependencies
import compression from 'compression'
import cors from 'cors'
import bodyParser from 'body-parser'
import jwt from 'express-jwt'
import favicon from 'serve-favicon'
import Raven from 'raven'
import createSSR from './createSSR'
import emailSSR from './emailSSR'
import {clientSecret as secretKey} from './utils/auth0Helpers'
import connectionHandler from './socketHandlers/wssConnectionHandler'
import httpGraphQLHandler, {intranetHttpGraphQLHandler} from './graphql/httpGraphQLHandler'
import stripeWebhookHandler from './billing/stripeWebhookHandler'
import getDotenv from '../universal/utils/dotenv'
import handleIntegration from './integrations/handleIntegration'
import sendICS from './sendICS'
import './polyfills'
import {GITHUB, SLACK} from '../universal/utils/constants'
import handleGitHubWebhooks from 'server/integrations/handleGitHubWebhooks'
import SharedDataLoader from 'shared-dataloader'
import {Server} from 'uws'
import http from 'http'
// import startMemwatch from 'server/utils/startMemwatch'
import packageJSON from '../../package.json'
import jwtFields from 'universal/utils/jwtFields'
import {SHARED_DATA_LOADER_TTL} from 'server/utils/serverConstants'

const {version} = packageJSON
// Import .env and expand variables:
getDotenv()

const PROD = process.env.NODE_ENV === 'production'
const {PORT = 3000} = process.env
const INTRANET_JWT_SECRET = process.env.INTRANET_JWT_SECRET || ''

const app = express()
const server = http.createServer(app)
const wss = new Server({server})
server.listen(PORT)
// This houses a per-mutation dataloader. When GraphQL is its own microservice, we can move this there.
const sharedDataLoader = new SharedDataLoader({
  PROD,
  onShare: '_share',
  ttl: SHARED_DATA_LOADER_TTL
})

// HMR
if (!PROD) {
  const config = require('../../webpack/webpack.dev.config')
  const compiler = webpack(config)
  app.use(
    require('webpack-dev-middleware')(compiler, {
      noInfo: false,
      publicPath: config.output.publicPath,
      stats: {
        chunks: false,
        colors: true
      },
      watchOptions: {
        poll: true,
        aggregateTimeout: 300
      }
    })
  )
  app.use(require('webpack-hot-middleware')(compiler))
} else {
  Raven.config(process.env.SENTRY_DSN, {
    release: version,
    environment: process.env.NODE_ENV,
    parseUser: jwtFields
  }).install()
  // sentry.io request handler capture middleware, must be first:
  app.use(Raven.requestHandler())
}

// setup middleware
app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      if (req.originalUrl.startsWith('/stripe')) {
        req.rawBody = buf.toString()
      }
    }
  })
)

app.use(cors({origin: true, credentials: true}))
app.use('/static', express.static('static'))
app.use(favicon(`${__dirname}/../../static/favicon.ico`))
app.use('/static', express.static('build'))
if (PROD) {
  app.use(compression())
}

// HTTP GraphQL endpoint
const graphQLHandler = httpGraphQLHandler(sharedDataLoader)
app.post(
  '/graphql',
  jwt({
    secret: Buffer.from(secretKey, 'base64'),
    audience: process.env.AUTH0_CLIENT_ID,
    credentialsRequired: false
  }),
  graphQLHandler
)

// HTTP Intranet GraphQL endpoint:
const intranetGraphQLHandler = intranetHttpGraphQLHandler(sharedDataLoader)
app.post(
  '/intranet-graphql',
  jwt({
    secret: Buffer.from(INTRANET_JWT_SECRET, 'base64'),
    credentialsRequired: true
  }),
  intranetGraphQLHandler
)

// server-side rendering for emails
if (!PROD) {
  app.get('/email', emailSSR)
}
app.get('/email/createics', sendICS)

// stripe webhooks
app.post('/stripe', stripeWebhookHandler(sharedDataLoader))

app.get('/auth/github', handleIntegration(GITHUB))
app.get('/auth/slack', handleIntegration(SLACK))
app.post('/webhooks/github', handleGitHubWebhooks)

// return web app

app.get('*', createSSR)

// handle sockets
wss.on('connection', connectionHandler(sharedDataLoader))

// if (process.env.MEMWATCH) {
// startMemwatch()
// }
