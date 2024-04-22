import { StarFilledIcon } from "@radix-ui/react-icons"

export const PremiumPlanUIDescription = () => {
    return (            <div className="flex flex-col items-start">
    <div className="w-full flex items-center justify-between pb-2">
      <div className="flex items-center">
        <p className="mr-2">Premium Plan</p>
        <div
          title="Premium Plan"
          className="flex items-center justify-center mr-2 p-1 border border-yellow-500 rounded-full w-5 h-5"
        >
          <StarFilledIcon className="w-2 h-2 text-yellow-500" />
        </div>
      </div>
      <p>100$/Month (per user)</p>
    </div>
    <p>✅ Project creation to analyze GitHub repositories</p>
    <p>✅ Project Goals can be set to guide Sara analysis</p>
    <p>✅ Sara generated Task-plans to achieve Goals</p>
    <p>✅ Manual GitHub source synchronization</p>
    <p>✅ Unlimited project creation</p>
    <p>✅ Access to private repositories for projects</p>
    <p>✅ User Data never used outside your Organization</p>
    <p>✅ Priority support</p>
  </div>
)
}