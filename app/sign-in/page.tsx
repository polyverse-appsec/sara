import { redirect } from 'next/navigation'

import { auth } from './../../auth'
import CarouselSignIn from './carouselsignin'

export default async function SignInPage() {
  const session = await auth()
  // Redirect to home if user is already logged in
  if (session?.user) {
    redirect('/')
  }
  return (
    <CarouselSignIn />
  )
}
