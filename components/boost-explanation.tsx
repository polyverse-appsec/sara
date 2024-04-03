'use client'
// THIS CODE ISN'T USED AT THE MOMENT
import React, { useState } from 'react'

const BoostExplanation = () => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleDropdown = () => setIsOpen(!isOpen)

  return (
    <div className="flex flex-col items-center m-5">
      <button
        onClick={toggleDropdown}
        className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-300"
      >
        How we are powered
      </button>
      {isOpen && (
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
      )}
    </div>
  )
}

export default BoostExplanation
