import { Hono } from "hono";
import { Layout } from "./components/Layout";
import { Hero } from "./pages/home";
import { AppBindings } from "../types";

const home_router = new Hono<AppBindings>();

home_router.get("/", (c) => {
  return c.html(
    <Layout>
      <Hero />
      <Depois />
    </Layout>,
  );
});

function Depois() {
  return (
    <>
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Why Choose RealBid?
        </h2>
        <div className="mt-12 grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Exclusive Listings
            </h3>
            <p className="text-gray-600">
              Access to unique properties not available on the regular market.
            </p>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Transparent Process
            </h3>
            <p className="text-gray-600">
              Clear and fair bidding system with real-time updates.
            </p>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Expert Support
            </h3>
            <p className="text-gray-600">
              Guidance from real estate professionals throughout the process.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-100">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-12">
            How RealBid Works
          </h2>
          <div className="space-y-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
                  1
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Browse Listings
                </h3>
                <p className="mt-2 text-gray-600">
                  Explore our curated selection of properties up for auction.
                </p>
              </div>
            </div>
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
                  2
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Register to Bid
                </h3>
                <p className="mt-2 text-gray-600">
                  Create an account and get verified to participate in auctions.
                </p>
              </div>
            </div>
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
                  3
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Place Your Bids
                </h3>
                <p className="mt-2 text-gray-600">
                  Bid on your desired properties during the live online auction.
                </p>
              </div>
            </div>
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
                  4
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Win and Close
                </h3>
                <p className="mt-2 text-gray-600">
                  If successful, complete the purchase with our streamlined
                  process.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to find your dream property?</span>
            <span className="block text-blue-200">
              Join RealBid today and start bidding.
            </span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <a
                href="#"
                className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-md text-lg font-semibold"
              >
                Sign Up Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export { home_router };
