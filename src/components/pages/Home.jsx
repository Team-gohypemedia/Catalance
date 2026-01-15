import React from 'react';
import CatalanceHero from "@/components/sections/home/CatalanceHero";
import LogoCloud from "@/components/sections/home/logo-cloud";
import DelphiHero from "@/components/sections/home/DelphiHero";

const Home = () => {
    React.useEffect(() => {
        document.documentElement.classList.add('home-page');
        return () => {
            document.documentElement.classList.remove('home-page');
        };
    }, []);

    return (
        <div className="flex flex-col min-h-screen">
            <CatalanceHero />
            <LogoCloud />
        </div>
    );
};

export default Home;
