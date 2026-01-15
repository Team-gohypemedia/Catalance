import React from 'react';
import CatalanceHero from "../CatalanceHero";
import LogoCloud from "../logo-cloud";
import DelphiHero from "../DelphiHero";

const Home = () => {
    React.useEffect(() => {
        document.documentElement.classList.add('home-page');
        return () => {
            document.documentElement.classList.remove('home-page');
        };
    }, []);

    return (
        <div className="flex flex-col min-h-screen">
            {/* <CatalanceHero /> */}
            <DelphiHero />
            <LogoCloud />
        </div>
    );
};

export default Home;
