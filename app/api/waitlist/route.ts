import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import createEmail from 'lib/polyverse/db/create-email'

export interface CreateEmailRequestBody {
  email: string
}

export const POST = async (req: Request) => {
  try {
    // Your logic here to createEmail
    // Validate that at least we have a title and description
    const reqBody = (await req.json()) as CreateEmailRequestBody

    let reqEmail = reqBody.email ? reqBody.email.trim() : ''
    await createEmail(reqEmail)
    console.log(`HAVE JUST CREATED EMAIL: ${reqEmail}`)

    // log client's IP address for malicious activity detection
    const clientIp =
      req.headers.get('x-forwarded-for') || req.headers.get('X-Real-IP')
    console.log(`Request received from IP: ${clientIp}`)

    return new Response(ReasonPhrases.CREATED, {
      status: StatusCodes.CREATED,
    })
  } catch (error) {
    console.error(`Failed submitting email because: ${error}`)

    return new Response('Failed to fetch project health', {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    })
  }
}
