import { preReleaseServiceDisclaimer } from "lib/productDescriptions";

const Disclaimer = () => (
  <section className="section">
    <h2 className="text-lg font-bold mb-2 text-center">Disclaimer</h2>
    <div><p className="px-10">{preReleaseServiceDisclaimer}</p></div>
  </section>
);
  
export default Disclaimer;