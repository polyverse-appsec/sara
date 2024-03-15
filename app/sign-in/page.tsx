import { redirect } from 'next/navigation'

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
      <h2 className="text-xl text-blue-600 mt-8">How we are powered</h2>
      <div className="w-1/2 border-t-2 border-blue-600 my-2"></div> 
      <p className="mt-4 text-base text-center text-gray-700">
          Boost from Polyverse is a set of AI-supercharged cloud services that
          enables you to accelerate development, significantly improve
          coordination across your organization, and deliver the high-quality
          critical features to your customers. Boost analyzes and models your
          software architecture, codebase, team specs and docs, development
          workflows, and tasks... to learn how YOUR code works, how YOUR
          organization delivers work, and how YOUR engineers can release
          features faster.
          <br />
          <br />
          Anyone in your organization can directly chat with Sara, your
          personalized AI-supercharged Architect, to leverage the best of Boost
          in real-time. Sara can build customized task plans based on your
          personal or team or project goals. Finally, Sara will partner directly
          with you and your team to deliver each task by writing the docs,
          updating your architecture and specs, writing code, creating tests,
          and even explaining complex technical requirements and algorithms to
          team members and customers.
        </p>
    </div>
  )
}
