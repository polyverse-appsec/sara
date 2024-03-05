const URL_SERVICE_URI_DEV = 'https://dev.boost.polyverse.com' // SARA_STAGE=dev
const URL_SERVICE_URI_PREVIEW = 'https://preview.boost.polyverse.com' // SARA_STAGE=test
const URL_SERVICE_URI_PROD = 'https://boost.polyverse.com' // SARA_STAGE=prod

// Set the URL_BASE to the appropriate value for the env variable SARA_STAGE or default to dev
export const VERCEL_SERVICE_URI =
  process.env.SARA_STAGE?.toLowerCase() === 'preview'
    ? URL_SERVICE_URI_PREVIEW
    : process.env.SARA_STAGE?.toLowerCase() === 'prod'
      ? URL_SERVICE_URI_PROD
      : URL_SERVICE_URI_DEV
