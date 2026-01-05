import React from 'react';
import CatalanceHero from "../CatalanceHero";
import LogoCloud from "../logo-cloud";

const Home = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <CatalanceHero />
            <LogoCloud />
        </div>
    );
};

export default Home;
