'use client'

import { useEffect, useState } from 'react'
import { StaticImageData } from 'next/dist/shared/lib/get-img-props'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CaretDownIcon } from '@radix-ui/react-icons'
import { Flex, TextArea } from '@radix-ui/themes'
import { createResourceNoResponseBody } from 'app/saraClient'
import {
  preReleaseServiceDisclaimer,
  saraProductDescription,
} from 'lib/productDescriptions'
import { isPreviewFeatureEnabled } from 'lib/service-utils'

import { LoginButton } from '../../components/login-button'
import carousel1 from './../../public/carousel1.png'
import carousel2 from './../../public/carousel2.png'
import carousel3 from './../../public/carousel3.png'
import codeSummaryImage from './../../public/codesummary.png'
import githubReposImage from './../../public/githubrepos.png'
import goalsExplorerImage from './../../public/goalsexplorer.png'
import guidelinesImage from './../../public/guidelines.png'
import PolyverseLogo from './../../public/Polyverse logo medium.jpg'
import SaraPortrait from './../../public/Sara_Cartoon_Portrait.png'
import { PremiumPlanUIDescription } from 'components/product-descriptions'

interface CarouselItem {
  image: StaticImageData
  description: string
}

// Initialize the CarouselData array with object literals
const CarouselData: CarouselItem[] = [
  {
    image: carousel2,
    description: 'Code Editing',
  },
  {
    image: carousel1,
    description: 'Full Codebase Analysis',
  },
  {
    image: carousel3,
    description: 'Track Goals and Tasks',
  },
  // Add more objects as needed
]

function Carousel({ items }: { items: CarouselItem[] }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % items.length)
    }, 15000)

    return () => clearInterval(interval) // Clear the interval when the component unmounts
  }, [items.length])

  return (
    <div>
      {items.map((item, index) => (
        <div key={index} className="absolute left-4 top-40">
          <div
            className={`transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="text-center text-white dark:text-white">
              <p>{item.description}</p>
            </div>
            <Image
              src={item.image}
              alt={`Image ${index + 1}`}
              width={1000}
              height={1000}
              className="rounded-lg overflow-hidden"
            />
          </div>
        </div>
      ))}
    </div>
  )
}

const CarouselSignIn = () => {
  const router = useRouter()
  const [color, setColor] = useState(false)

  const [email, setEmail] = useState('')
  const [emailSubmitButtonOpen, setEmailSubmitButtonOpen] = useState(true)
  const [displayEmailEntrySuccess, setDisplayEmailEntrySuccess] =
    useState(false)

  const displayEmailEntrySuccessMessage = () => {
    setDisplayEmailEntrySuccess(true)

    setTimeout(() => {
      setDisplayEmailEntrySuccess(false)
    }, 5000)
  }

  useEffect(() => {
    // This function will change the navbar color based on scroll position.
    const changeColor = () => {
      if (window.scrollY >= 500) {
        setColor(true)
      } else {
        setColor(false)
      }
    }

    // Add scroll event listener when component mounts
    window.addEventListener('scroll', changeColor)

    // Cleanup function to remove the event listener when component unmounts
    return () => window.removeEventListener('scroll', changeColor)
  }, [router]) // Dependency array includes router to react to changes in routing

  const navigateToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId)
    const navbarHeight = document.getElementById('navbar')?.offsetHeight

    if (section && navbarHeight) {
      const sectionTop = section.offsetTop - navbarHeight
      window.scrollTo({
        top: sectionTop,
        behavior: 'smooth',
      })
    }
  }

  return (
    <>
      <div
        id="navbar"
        className={`fixed w-full top-0 z-50 shadow transition duration-300 ease-in-out ${
          color ? 'bg-orange-500' : 'bg-transparent'
        }`}
      >
        <div className="flex justify-between items-center p-4">
          <div className="font-bold text-blue-800 text-2xl italic ml-4">
            Sara AI by Polyverse
          </div>
          <div>
            <button
              onClick={() => navigateToSection('about')}
              className="mx-2 px-4 py-2 text-white text-lg hover:underline"
            >
              About
            </button>
            <button
              onClick={() => navigateToSection('pricing')}
              className="mx-2 px-4 py-2 text-white text-lg hover:underline"
            >
              Pricing
            </button>
          </div>
        </div>
      </div>
      <div className="w-full flex justify-between bg-gradient-to-tr from-orange-400 to-blue-500 min-h-screen">
        <div className="w-1/3 flex flex-col items-center justify-center mt-16">
          <Image
            src={SaraPortrait}
            alt="Sara AI Assistant"
            title="Sara AI Assistant"
            width={300}
            height={300}
          />
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
              height={200}
            />
          </div>
          <LoginButton />
        </div>
        <div
          id="introimages"
          className="w-2/3 relative flex items-center justify-content mr-10"
        >
          <Carousel items={CarouselData} />
          {/*<div className="rounded-lg overflow-auto">
            <Image
              src={auth1}
              alt="temp image"
              title="temp image"
              width={700}
              height={700}
            />
          </div>*/}
        </div>
        <div className="w-full absolute bottom-0 flex justify-center pb-4">
          <button
            onClick={() => navigateToSection('about')}
            className="mx-2 px-4 text-white text-lg hover:underline"
          >
            <div className="flex items-center">
              <p>Learn More</p>
              <CaretDownIcon className="text-white w-6 h-6" />
            </div>
          </button>
        </div>
      </div>
      <div id="about" className="flex flex-col items-center">
        <h2 className="text-4xl font-bold text-blue-600 mt-8">
          What Superpowers Sara
        </h2>
        <div className="w-1/2 border-t-2 border-blue-600 my-2"></div>
        <div className="mt-4 p-2 text-2xl font-semibold text-center w-3/4 mx-auto preserve-line-breaks">
          {saraProductDescription}
        </div>
      </div>
      <div className="px-16">
        <div id="projectanalysis" className="flex items-center mt-8">
          <div className="w-1/2 flex flex-col items-center justify-evenly">
            <div className="flex flex-col">
              <h2 className="text-4xl font-bold text-orange-600">
                Complete Project Analysis
              </h2>
              <div className="w-full border-t-2 border-orange-600 my-2"></div>
              <ul className="list-disc list-inside text-2xl font-semibold space-y-4">
                <li>Answers scoped for entire codebase</li>
                <li>Generate code/test cases</li>
                <li>Explain architecture of your project</li>
                <li>Summarize project features</li>
              </ul>
            </div>
          </div>
          <div className="w-1/2 flex flex-col items-center">
            <div className="rounded-lg overflow-hidden">
              <Image
                src={codeSummaryImage}
                alt="Code Editing Summary"
                title="Code Editing Summary"
                width={500}
                height={500}
              />
            </div>
          </div>
        </div>
        <div id="customizableassitant" className="flex items-center mt-8">
          <div className="w-1/2 flex flex-col items-center">
            <div className="rounded-lg overflow-hidden">
              <Image
                src={guidelinesImage}
                alt="Advanced Analysis Customization"
                title="Advanced Analysis Customization"
                width={500}
                height={500}
              />
            </div>
          </div>
          <div className="w-1/2 flex flex-col items-center justify-evenly">
            <div className="flex flex-col">
              <h2 className="text-4xl text-end font-bold text-blue-600">
                Fully Customizable Assistant
              </h2>
              <div className="w-full border-t-2 border-blue-600 my-2"></div>
              <ul className="list-disc list-inside text-2xl font-semibold space-y-4">
                <li>Customizable project analysis guidelines</li>
                <li>Train assistant answers through feedback</li>
                <li>User inputted goals shape Sara analysis</li>
                <li>Tailored responses based on LinkedIn profile</li>
              </ul>
            </div>
          </div>
        </div>
        <div id="goalsandtasks" className="flex items-center mt-8">
          <div className="w-1/2 flex flex-col items-center justify-evenly">
            <div className="flex flex-col">
              <h2 className="text-4xl font-bold text-orange-600">
                Task Driven Productivity
              </h2>
              <div className="w-full border-t-2 border-orange-600 my-2"></div>
              <ul className="list-disc list-inside text-2xl font-semibold space-y-4">
                <li>Generates tasks to achieve your project goals</li>
                <li>Provide code changes according to tasks</li>
                <li>Sara chats are contextualized with user goals in mind</li>
              </ul>
            </div>
          </div>
          <div className="w-1/2 flex flex-col items-center">
            <div className="rounded-lg overflow-hidden">
              <Image
                src={goalsExplorerImage}
                alt="Achieve Your Project Goals"
                title="Achieve Your Project Goals"
                width={500}
                height={500}
              />
            </div>
          </div>
        </div>
        <div id="githubintegration" className="flex items-center mt-8">
          <div className="w-1/2 flex flex-col items-center">
            <div className="rounded-lg overflow-hidden">
              <Image
                src={githubReposImage}
                alt="GitHub.com Integration"
                title="GitHub.com Integration"
                width={500}
                height={500}
              />
            </div>
          </div>
          <div className="w-1/2 flex flex-col items-center justify-evenly">
            <div className="flex flex-col">
              <h2 className="text-4xl text-end font-bold text-blue-600">
                GitHub Integration
              </h2>
              <div className="w-full border-t-2 border-blue-600 my-2"></div>
              <ul className="list-disc list-inside text-2xl font-semibold space-y-4">
                <li>Projects are linked to GitHub Repos</li>
                <li>Manual repo source synchronization</li>
                <li>Projects can reference external libraries and repos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div id="pricing" className="flex flex-col items-center my-24">
        <p className="text-4xl font-bold text-orange-600">Pricing Plan</p>
        <div className="w-1/2 border-t-2 border-orange-600 my-2"></div>
        <div className="flex items-center justify-evenly w-4/5 mt-6">
          {isPreviewFeatureEnabled('FreePlanEnabled') && (
            <div className="bg-background shadow-md rounded-lg p-6 border mb-4">
              <div className="flex flex-col items-start">
                <p className="text-2xl font-semibold">Free Plan</p>
                <div className="text-xl mt-2">
                  <p>✅ Project creation to analyze GitHub repositories</p>
                  <p>✅ Project Goals can be set to guide Sara analysis</p>
                  <p>✅ Sara generated Task-plans to achieve Goals</p>
                  <p>✅ Manual GitHub source synchronization</p>
                  <p>❌ Project creation limit</p>
                  <p>❌ Only public respositories for projects</p>
                </div>
              </div>
            </div>
          )}
          <PremiumPlanUIDescription />
        </div>
        <br />
        <div className="py-1 px-2 rounded-lg text-center text-amber-800 bg-amber-600">
          {preReleaseServiceDisclaimer}
        </div>
      </div>

      <div id="emailsubmit" className="flex flex-col items-center my-24">
        <h2 className="text-4xl font-bold text-blue-600 mt-8">
          Subscribe to Polyverse and Sara Product Updates!
        </h2>
        <div className="w-1/2 border-t-2 border-blue-600 my-2"></div>
        <form
          className="mt-16"
          onSubmit={async (e) => {
            const reqBody = {
              email,
            }

            createResourceNoResponseBody(`/waitlist`, reqBody)
              .then(() => {
                setEmailSubmitButtonOpen(false)
                setEmail('')
                displayEmailEntrySuccessMessage()
                console.log(`SUCCESSFULLY SET THE EMAIL IN CLIENT CODE`)
              })
              .catch(() => {
                setEmailSubmitButtonOpen(false)
                setEmail('')
              })
            e.preventDefault()
          }}
        >
          <div className="flex items-center justify-center space-x-4">
                <TextArea
                  placeholder="Enter your email…"
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!emailSubmitButtonOpen}
                />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-700 rounded-lg"
              disabled={!emailSubmitButtonOpen}
            >
              Submit
            </button>
          </div>
        </form>
        {displayEmailEntrySuccess && (
          <div className="px-3 py-2 bg-green-200 text-green-500 rounded-lg">
            SUBMITTED EMAIL
          </div>
        )}
      </div>

      <div
        id="footer"
        className="h-44 bg-gradient-to-tr from-orange-400 to-blue-500 min-h-44"
      >
        <div className="text-center pt-24">
          <Link href="https://www.polyverse.com">
            <p>© 2024, Polyverse. All rights reserved.</p>
          </Link>
        </div>
      </div>
    </>
  )
}

export default CarouselSignIn
