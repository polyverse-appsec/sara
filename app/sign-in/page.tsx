import { redirect } from 'next/navigation'
import Image from 'next/image'

import { auth } from './../../auth'
import { LoginButton } from './../../components/login-button'
import PolyverseLogo from './../../public/Polyverse logo medium.jpg'
import SaraPortrait from './../../public/Sara_Cartoon_Portrait.png'

export default async function SignInPage() {
  const session = await auth()
  // Redirect to home if user is already logged in
  if (session?.user) {
    redirect('/')
  }
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Image
        src={SaraPortrait}
        alt="Sara's Portrait"
        width={200}
        height={200}
      />
      <p className="text-4xl text-gray-600">Introducing</p>
      <p className="font-medium italic text-8xl">Sara</p>
      <p className="text-2xl text-gray-600">Your AI-powered Software Architect</p>
      <div className="flex items-center justify-center m-5">
        <p className="font-medium text-5xl mr-3">by</p>
        <Image
          src={PolyverseLogo}
          alt="Polyverse Logo"
          width={200}
          height={200}
        />
      </div>
      <LoginButton />
      <h2 className="text-xl text-blue-600 mt-8">What Superpowers Sara</h2>
      <div className="w-1/2 border-t-2 border-blue-600 my-2"></div>
      <div className="mt-4 p-4 border-2 border-blue-600 rounded-lg text-base text-center text-gray-700 w-1/2 mx-auto">
        Sara leverages advanced Polyvser Boost AI to analyze your codebase and workflows, providing real-time, customized task plans and direct assistance. Whether writing documentation, updating specs, coding, or creating tests, Sara partners with you to accelerate development and deliver high-quality features faster.

        Sara learns about you and your team - your skills, strengths and challenges - to help you deliver your best work, and accelerate your roadmap and business goals.
      </div>
    </div>
  )
}
