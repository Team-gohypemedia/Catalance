import React from "react";

const FreelancerIndividualProofSlide = ({ continueButton }) => {
  return (
    <section className="mx-auto flex min-h-[68vh] w-full max-w-6xl flex-col items-center justify-center px-4 text-center sm:min-h-[70vh] sm:px-6">
      <div className="space-y-5 sm:space-y-6">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-medium">
          <span className="text-primary">10,000+ </span>
          <span>freelancers are already earning on </span>
          <span>Catalance</span>
        </h1>

        {continueButton}
      </div>
    </section>
  );
};

export default FreelancerIndividualProofSlide;
