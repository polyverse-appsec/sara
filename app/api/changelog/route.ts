import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { NextAuthRequest } from 'next-auth/lib'
import fs from 'fs'
import path from 'path'

export const GET = async (req: NextAuthRequest) => {
  try {
    // Path to the CHANGELOG.md file
    const filePath = path.join(process.cwd(), 'CHANGELOG.md')

    // Read the content of the CHANGELOG.md file
    const changelogContent = fs.readFileSync(filePath, 'utf8')

    // Return the content as plain text
    return new Response(changelogContent, {
      status: StatusCodes.OK,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    })
  } catch (error) {
    console.error(`Failed to read CHANGELOG.md because: ${error}`)

    return new Response(ReasonPhrases.INTERNAL_SERVER_ERROR, {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    })
  }
}
