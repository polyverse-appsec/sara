import { redirect } from 'next/navigation'
import { isPreviewFeatureEnabled } from 'lib/service-utils'

import { auth } from './../../auth'
import CarouselSignIn from './carouselsignin'
import DefaultSignIn from './defaultsignin'

export default async function SignInPage() {
  const session = await auth()
  // Redirect to home if user is already logged in
  if (session?.user) {
    redirect('/')
  }
  return <CarouselSignIn />
}
