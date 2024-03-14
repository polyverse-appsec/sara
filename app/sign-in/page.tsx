import { redirect } from 'next/navigation'
import BoostExplanation from 'components/boost-explanation'

import { auth } from './../../auth'
import { LoginButton } from './../../components/login-button'
import PolyverseLogo from './../../public/Polyverse logo medium.jpg'
import SaraPortrait from './../../public/Sara_Cartoon_Portrait.png'

export default async function SignInPage() {
  const session = await auth()
  // redirect to home if user is already logged in
  if (session?.user) {
    redirect('/')
  }
  return (
    <div className="flex flex-col items-center justify-center p-4 ">
      <img
        src={SaraPortrait.src} // Adjust the path to your image
        alt="Sara's Portrait"
        width={200} // Adjust the width as needed
        height={200} // Adjust the height as needed
      />
      <p className="font-medium italic text-8xl">Sara</p>
      <div className="flex items-center justify-center m-5">
        <p className="font-medium text-5xl mr-3">by</p>
        <img
          src={PolyverseLogo.src} // Adjust the path to your image
          alt="Sara's Portrait"
          width={200} // Adjust the width as needed
          height={200} // Adjust the height as needed
        />
      </div>
      <LoginButton />
      <BoostExplanation />
    </div>
  )
}
