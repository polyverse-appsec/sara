import Link from 'next/link'
import { saraProductDescription } from 'lib/productDescriptions'

import AboutPolyverse from './components/AboutPolyverse'
import DataRetention from './components/DataRetention'
import Disclaimer from './components/Disclaimer'
import FAQ from './components/FAQ'
import ServicesUsed from './components/ServicesUsed'
import Layout from './layout'

const AboutPage = () => (
  <Layout>
    <div className="px-10 overflow-y-auto max-h-screen">
      <div className="flex flex-col items-center p-10 font-bold space-y-4">
        <p className="text-2xl font-bold">
          About Sara AI by{' '}
          <Link className="hover:underline" href="https://www.polyverse.com">
            Polyverse
          </Link>
        </p>
        <div className="w-1/2 border-t-2 border-blue-600 my-2"></div>
      </div>
      {/* Scrollable container */}
      <div>
        <p>{saraProductDescription}</p>
        <div className="spacer"></div>
        <p>
          The following information covers important information about
          Sara&apos;s technology, service availability, data retention policies,
          and common questions.
        </p>
        <Disclaimer />
        <ServicesUsed />
        <DataRetention />
        <FAQ />
        <AboutPolyverse />
      </div>
      <div id="footer" className="text-center pt-24">
        <Link href="https://www.polyverse.com">
          <p>© 2024, Polyverse. All rights reserved.</p>
        </Link>
      </div>
    </div>
  </Layout>
)

export default AboutPage
