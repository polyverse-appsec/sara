'use client'

import Image from 'next/image'
import { redirect, useRouter } from 'next/navigation'

import { auth } from '../../auth'
import { LoginButton } from '../../components/login-button'
import PolyverseLogo from './../../public/Polyverse logo medium.jpg'
import SaraPortrait from './../../public/Sara_Cartoon_Portrait.png'
import auth1 from './../../public/auth1.png'
import auth2 from './../../public/auth2.png'
import auth3 from './../../public/auth3.png'
import { Key, useEffect, useState } from 'react'
import { StaticImageData, StaticImport } from 'next/dist/shared/lib/get-img-props'

function Carousel({ images }: { images: StaticImageData[] }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleMouseEnter = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
    >
      {images.map((imageSrc: string | StaticImport, index: number) => (
        <div
          key={index}
          className={`rounded-lg overflow-hidden absolute left-56 top-56 transition-opacity duration-500 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
        >
          <Image src={imageSrc} alt={`Image ${index + 1}`} width={600} height={600}/>
        </div>
      ))}
    </div>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const [color, setColor] = useState(false)
  
  useEffect(() => {
    // TRIED TO ADAPT THE OLD await auth() code to client side code but it doesn't work
    // const checkSession = async () => {
    //   const currentSession = await auth();
    //   // Redirect to home if user is already logged in
    //   if (currentSession?.user) {
    //     router.push('/');
    //     return; // Early return to avoid adding scroll listener if user is redirected
    //   }
    // };

    // checkSession();

    // This function will change the navbar color based on scroll position.
    const changeColor = () => {
      if (window.scrollY >= 500) {
        setColor(true)
      } else {
        setColor(false)
      }
    };

    // Add scroll event listener when component mounts
    window.addEventListener('scroll', changeColor);

    // Cleanup function to remove the event listener when component unmounts
    return () => window.removeEventListener('scroll', changeColor);
  }, [router]); // Dependency array includes router to react to changes in routing

  // THIS IS FROM THE OLD CODE, WONT WORK WITH 'use client'
  // const session = await auth()
  // // Redirect to home if user is already logged in
  // if (session?.user) {
  //   redirect('/')
  // }

  const navigateToSection = (sectionId : string) => {
    const section = document.getElementById(sectionId);
    const navbarHeight = document.getElementById('navbar')?.offsetHeight;

    if (section && navbarHeight) {
      const sectionTop = section.offsetTop - navbarHeight;
      window.scrollTo({
        top: sectionTop,
        behavior: 'smooth',
      });
    }
  };

  return (
    <>
    <div id="navbar" className={`fixed w-full top-0 z-50 shadow transition duration-300 ease-in-out ${color ? 'bg-orange-500' : 'bg-transparent'}`}>
      <div className="flex justify-between items-center p-4">
        <div className="font-bold text-blue-800 text-2xl italic ml-4">Sara</div>
        <div>
          <button onClick={() => navigateToSection('about')} className="mx-2 px-4 py-2 text-white text-lg hover:underline">About</button>
          <button onClick={() => navigateToSection('pricing')} className="mx-2 px-4 py-2 text-white text-lg hover:underline">Pricing</button>
        </div>
      </div>
    </div>
    <div className="flex justify-between p-4 bg-gradient-to-tr from-orange-400 to-blue-500 min-h-screen">
      <div className="w-1/3 flex flex-col items-center justify-center mt-16">
        <Image
          src={SaraPortrait}
          alt="Sara AI Assistant"
          title="Sara AI Assistant"
          width={300}
          height={300} />
        <p className="text-4xl text-gray-600">Introducing</p>
        <p className="font-medium italic text-8xl">Sara</p>
        <p className="text-2xl text-gray-600">
          Your AI-powered Software Architect
        </p>
        <div className="flex items-center justify-center m-5">
          <p className="font-medium text-5xl mr-3">by</p>
          <Image
            src={PolyverseLogo}
            alt="Polyverse Logo"
            title="Polyverse"
            width={200}
            height={200} />
        </div>
        <LoginButton />
      </div>
      <div id="introimages" className="w-2/3 relative flex items-center justify-content pl-40">
        {/* <Carousel images={[auth1, auth2, auth3]} /> */}
        <div className="rounded-lg overflow-auto">
          <Image
            src={auth1}
            alt="temp image"
            title="temp image"
            width={700}
            height={700} />
        </div>
      </div>
    </div>
    <div id="about" className="flex flex-col items-center">
      <h2 className="text-4xl font-bold text-blue-600 mt-8">What Superpowers Sara</h2>
      <div className="w-1/2 border-t-2 border-blue-600 my-2"></div>
      <div className="mt-4 p-2 text-2xl font-semibold text-center w-3/4 mx-auto preserve-line-breaks">
        Sara partners with you and your team - your skills, strengths and
        challenges - to help you deliver your best work, and accelerate your
        roadmap and business goals. Sara leverages the advanced Polyverse Boost
        AI Services to analyze your codebase and workflows, providing real-time,
        customized task plans and direct assistance writing documentation,
        updating specs, coding, or creating tests.
      </div>
    </div>
    <div id="features" className="flex items-center mt-8">
      <div className="w-1/2 flex flex-col items-center justify-evenly">
        <div className="flex flex-col">
          <h2 className="text-4xl font-bold text-orange-600">Features</h2>
          <div className="w-full border-t-2 border-orange-600 my-2"></div>
          <ul className="list-disc list-inside text-2xl font-semibold space-y-4">
            <li>[insert feature here]</li>
            <li>[insert another feature here]</li>
            <li>[insert feature here]</li>
          </ul>
            </div>
      </div>
      <div className="w-1/2 flex flex-col items-center">
        <div className="rounded-lg overflow-hidden">
          <Image
            src={auth2}
            alt="temp image"
            title="temp image"
            width={500}
            height={500} />
          </div>
      </div>
    </div>
    <div id="morefeatures" className="flex items-center mt-8">
      <div className="w-1/2 flex flex-col items-center">
        <div className="rounded-lg overflow-hidden">
          <Image
            src={auth2}
            alt="temp image"
            title="temp image"
            width={500}
            height={500} />
          </div>
      </div>
      <div className="w-1/2 flex flex-col items-center justify-evenly">
        <div className="flex flex-col">
          <h2 className="text-4xl text-end font-bold text-blue-600">More Features</h2>
          <div className="w-full border-t-2 border-blue-600 my-2"></div>
          <ul className="list-disc list-inside text-2xl font-semibold space-y-4">
            <li>[insert feature here]</li>
            <li>[insert another feature here]</li>
            <li>[insert feature here]</li>
          </ul>
            </div>
      </div>
    </div>
    <div id="pricing" className="flex flex-col items-center my-24">
      <p className="text-4xl font-bold text-orange-600">Pricing Plan</p>
      <div className="w-1/2 border-t-2 border-orange-600 my-2"></div>
      <div className="flex items-center justify-evenly w-4/5 mt-6">
        <div className="bg-background shadow-md rounded-lg p-6 border mb-4">
          <div className="flex flex-col items-start">
            <p className="text-2xl font-semibold">Free Plan</p>
            <div className="text-xl mt-2">
              <p>❌ Project creation limit</p>
              <p>❌ Only public respositories for projects</p>
            </div>
          </div>
        </div>
        <div className="bg-background shadow-md rounded-lg p-6 border mb-4">
          <div className="flex flex-col items-start">
            <p className="text-2xl font-semibold">Premium Plan</p>
            <div className="text-xl mt-2">
              <p>✅ Unlimited project creation</p>
              <p>✅ Access to private repositories for projects</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div id="footer" className="h-44 bg-gradient-to-tr from-orange-400 to-blue-500 min-h-44">

    </div>
    </>
  )
}