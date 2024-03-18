import jsonwebtoken from 'jsonwebtoken'

const { sign } = jsonwebtoken

// AWS Endpoints for our Boost ReST API (Backend)
// Legacy:  'https://pt5sl5vwfjn6lsr2k6szuvfhnq0vaxhl.lambda-url.us-west-2.on.aws/api/user_project'

// Local: 'http://localhost:8000'
const URL_SERVICE_URI_DEV =
  'https://3c27qu2ddje63mw2dmuqp6oa7u0ergex.lambda-url.us-west-2.on.aws' // SARA_STAGE=dev
const URL_SERVICE_URI_PREVIEW =
  'https://sztg3725fqtcptfts5vrvcozoe0nxcew.lambda-url.us-west-2.on.aws' // SARA_STAGE=test
const URL_SERVICE_URI_PROD =
  'https://33pdosoitl22c42c7sf46tabi40qwlae.lambda-url.us-west-2.on.aws' // SARA_STAGE=prod

// set the URL_BASE to the appropriate value for the env variable SARA_STAGE or default to dev
export const USER_SERVICE_URI =
  process.env.SARA_STAGE?.toLowerCase() === 'preview'
    ? URL_SERVICE_URI_PREVIEW
    : process.env.SARA_STAGE?.toLowerCase() === 'prod'
      ? URL_SERVICE_URI_PROD
      : URL_SERVICE_URI_DEV

interface SignedHeader {
  'x-signed-identity': string
}

export const createSignedHeader = (email: string): SignedHeader => {
  const privateSaraClientKey = process.env.SARA_CLIENT_PRIVATE_KEY
  if (!privateSaraClientKey) {
    throw new Error('SARA_CLIENT_PRIVATE_KEY is not set in the environment.')
  }
  const signedIdentityHeader = sign(
    { email },
    privateSaraClientKey as jsonwebtoken.Secret,
    { algorithm: 'RS256' },
  )

  const header: SignedHeader = {
    'x-signed-identity': signedIdentityHeader,
  }

  return header
}

interface BoostServiceResponseJsonBody {
  statusCode: number
  body: string | null
}

export const getBodyFromBoostServiceResponse = async <DeserializedType>(
  res: Response,
): Promise<DeserializedType> => {
  const boostJsonRes = (await res.json()) as BoostServiceResponseJsonBody

  if (!boostJsonRes.body) {
    throw new Error(
      `Boost service response doesn't contain 'body' in JSON response`,
    )
  }

  return JSON.parse(boostJsonRes.body) as DeserializedType
}
