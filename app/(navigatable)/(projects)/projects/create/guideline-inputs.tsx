'use client'

import React, { useEffect, useState } from 'react'
import { Flex, TextArea } from '@radix-ui/themes'
import { Button } from 'components/ui/button'

interface ProjectGuidelinesProps {
  disableInput: boolean
  existingProjectGuidelines: string[]
  setProjectGuidelines: (guidelines: string[]) => void
}

const GuidelineInputs = ({
  disableInput,
  existingProjectGuidelines,
  setProjectGuidelines,
}: ProjectGuidelinesProps) => {
  const [guidelineValues, setGuidelineValues] = useState<string[]>(existingProjectGuidelines)

  const handleAddGuideline = () => {
    setGuidelineValues([...guidelineValues, ''])
  }

  const handleDeleteGuideline = (index: number) => {
    const newGuidelines = guidelineValues.filter((_, idx) => idx !== index)
    setGuidelineValues(newGuidelines)
    // Optionally, update the parent component's state
    setProjectGuidelines(newGuidelines)
  }

  const handleGuidelineChange = (index: number, value: string) => {
    const newGuidelines = [...guidelineValues]
    newGuidelines[index] = value
    setGuidelineValues(newGuidelines)
    // Optionally, update the parent component's state
    setProjectGuidelines(newGuidelines)
  }

  return (
    <>
      <div className="w-full flex flex-col gap-3">
        {guidelineValues.map((guideline, index) => (
          <div key={index} className="flex items-center gap-2 w-full">
            <TextArea
              className="grow" // Tailwind CSS class to make TextArea grow
              value={guideline}
              onChange={(e) => handleGuidelineChange(index, e.target.value)}
              placeholder="Type guideline here"
              disabled={disableInput}
            />
            <Button
              className="shrink-0 bg-red-500 hover:bg-red-700"
              onClick={() => handleDeleteGuideline(index)}
              disabled={disableInput}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>
      <Button type="button"
        className="mt-2 p-2 bg-blue-500 hover:bg-blue-700"
        onClick={handleAddGuideline}
        disabled={disableInput}
      >
        Add Guideline
      </Button>
    </>
  )
}

export default GuidelineInputs
