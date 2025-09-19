export default function Hero() {
  return (
    <section
      className=" h-fit"
      style={{
        backgroundImage: `url('/herobg.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="max-w-7xl mt-20 mx-auto px-6 lg:px-12 py-16 lg:pt-12 flex flex-col lg:flex-row items-center justify-between">
        {/* Left Content */}
        <div className="flex flex-col items-start text-left max-w-xl">
          <h1
            className="text-5xl lg:text-7xl text-primary leading-[2.5rem] mb-6"
            style={{ lineHeight: "1.1" }}
          >
            Simplified Digital{" "}
            <span className="text-orange-500">Transactions</span>
          </h1>
          <p className="text-normal lg:text-lg w-5/6 lg:w-full text-gray-600 mb-8">
            Buy and sell crypto assets, trade gift cards, purchase airtime &
            data, subscribe to cable TV, and fund your sports betting account —
            all at amazing rates through a secure, responsive system.
          </p>
          <button className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-medium rounded-lg shadow-md transition">
            Get Started
          </button>
        </div>

        {/* Right Image */}
        <div className="mt-12 lg:mt-0 w-full lg:w-1/2 flex justify-center">
          <div
            className="w-80 h-80 lg:w-[500px] lg:h-[500px]"
            style={{
              backgroundImage: `url('/hero1.png')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          ></div>
        </div>
      </div>
    </section>
  );
}
