import { redirect } from 'next/navigation'

import { auth } from './../../auth'
import DefaultSignIn from './defaultsignin'
import CarouselSignIn from './carouselsignin'
import { isPreviewFeatureEnabled } from 'lib/utils' 

export default async function SignInPage() {
  const session = await auth()
  // Redirect to home if user is already logged in
  if (session?.user) {
    redirect('/')
  }
  return (
    isPreviewFeatureEnabled('CarouselLoginPage') ? <CarouselSignIn /> : <DefaultSignIn />
  )
}
