import Link from 'next/link'

const ServicesUsed = () => (
  <section className="section">
    <h2 className="text-lg font-bold mb-2 text-center">
      Services Used by Sara
    </h2>
    <div className="center">
      <ul className="list-disc pl-5">
        <li>
          <Link className="hover:underline" href="https://vercel.com" passHref>
            Vercel
          </Link>{' '}
          for Sara web UI
        </li>
        <li>
          <Link
            className="hover:underline"
            href="https://aws.amazon.com"
            passHref
          >
            Amazon AWS
          </Link>{' '}
          for Sara and Boost Services
        </li>
        <li>
          <Link className="hover:underline" href="https://openai.com" passHref>
            OpenAI and GPT-4
          </Link>{' '}
          for LLM support
        </li>
        <li>
          <Link className="hover:underline" href="https://stripe.com" passHref>
            Stripe
          </Link>{' '}
          for Secure Billing
        </li>
        <li>
          <Link
            className="hover:underline"
            href="https://linkedin.com"
            passHref
          >
            LinkedIn
          </Link>{' '}
          for Profile integration
        </li>
      </ul>
    </div>
  </section>
)

export default ServicesUsed
