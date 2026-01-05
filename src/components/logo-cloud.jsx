import Marquee from "./Marquee";

export default function LogoCloud() {
    return (
        <section className="bg-black py-16">
            <div className="mx-auto max-w-5xl px-6">
                <h2 className="text-center text-lg font-medium text-white/50 mb-12">Trusted by innovative teams worldwide</h2>
                <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg bg-black py-4 md:shadow-xl">
                    <Marquee pauseOnHover className="[--duration:20s]">
                        <img
                            className="h-8 w-auto px-8 invert"
                            src="https://html.tailus.io/blocks/customers/nvidia.svg"
                            alt="Nvidia"
                        />
                        <img
                            className="h-8 w-auto px-8 invert"
                            src="https://html.tailus.io/blocks/customers/column.svg"
                            alt="Column"
                        />
                        <img
                            className="h-8 w-auto px-8 invert"
                            src="https://html.tailus.io/blocks/customers/github.svg"
                            alt="GitHub"
                        />
                        <img
                            className="h-8 w-auto px-8 invert"
                            src="https://html.tailus.io/blocks/customers/nike.svg"
                            alt="Nike"
                        />
                        <img
                            className="h-8 w-auto px-8 invert"
                            src="https://html.tailus.io/blocks/customers/laravel.svg"
                            alt="Laravel"
                        />
                        <img
                            className="h-8 w-auto px-8 invert"
                            src="https://html.tailus.io/blocks/customers/lilly.svg"
                            alt="Lilly"
                        />
                        <img
                            className="h-8 w-auto px-8 invert"
                            src="https://html.tailus.io/blocks/customers/lemonsqueezy.svg"
                            alt="Lemon Squeezy"
                        />
                        <img
                            className="h-8 w-auto px-8 invert"
                            src="https://html.tailus.io/blocks/customers/openai.svg"
                            alt="OpenAI"
                        />
                        <img
                            className="h-8 w-auto px-8 invert"
                            src="https://html.tailus.io/blocks/customers/tailwindcss.svg"
                            alt="Tailwind CSS"
                        />
                        <img
                            className="h-8 w-auto px-8 invert"
                            src="https://html.tailus.io/blocks/customers/vercel.svg"
                            alt="Vercel"
                        />
                        <img
                            className="h-8 w-auto px-8 invert"
                            src="https://html.tailus.io/blocks/customers/zapier.svg"
                            alt="Zapier"
                        />
                    </Marquee>
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-black"></div>
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-linear-to-l from-black"></div>
                </div>
            </div>
        </section>
    );
}

