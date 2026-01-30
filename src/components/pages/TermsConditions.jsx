import React from 'react';

const TermsConditions = () => {
    return (
        <div className="min-h-screen bg-black text-white pt-32 pb-24 px-6 md:px-12">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-primary to-primary/60">
                        Terms & Conditions
                    </h1>
                    <p className="text-white/60 text-lg">
                        Agreement for Freelancers engaged by Catalance
                    </p>
                </div>

                {/* Introduction */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
                    <p className="text-white/80 leading-relaxed">
                        These Terms & Conditions (“Agreement”) apply to all freelancers (“Freelancer”) engaged by Catalance (“Company”) for projects, assignments, or services. By accepting work from Catalance, the Freelancer agrees to the following:
                    </p>
                </div>

                {/* Terms List */}
                <div className="space-y-8">
                    {/* 1. Project Completion */}
                    <section className="space-y-4">
                        <h2 className="text-xl md:text-2xl font-semibold text-primary">1. Project Completion</h2>
                        <div className="pl-4 border-l-2 border-white/10 space-y-2">
                            <p className="text-white/80 leading-relaxed">
                                Payment will only be made upon successful completion and delivery of the assigned project as per the agreed scope, timeline, and quality standards.
                            </p>
                            <p className="text-white/80 leading-relaxed">
                                If a Freelancer fails to complete the project, misses deadlines without approval, or delivers incomplete/unsatisfactory work, Catalance is not liable to make any payment (partial or full).
                            </p>
                        </div>
                    </section>

                    {/* 2. Ownership of Work */}
                    <section className="space-y-4">
                        <h2 className="text-xl md:text-2xl font-semibold text-primary">2. Ownership of Work</h2>
                        <div className="pl-4 border-l-2 border-white/10 space-y-2">
                            <p className="text-white/80 leading-relaxed">
                                All completed and paid-for work will be the sole property of Catalance.
                            </p>
                            <p className="text-white/80 leading-relaxed">
                                Unfinished or unpaid work will not be used by the Company.
                            </p>
                        </div>
                    </section>

                    {/* 3. Quality Standards */}
                    <section className="space-y-4">
                        <h2 className="text-xl md:text-2xl font-semibold text-primary">3. Quality Standards</h2>
                        <div className="pl-4 border-l-2 border-white/10 space-y-2">
                            <p className="text-white/80 leading-relaxed">
                                The Freelancer must adhere to the brief, brand guidelines, and instructions provided.
                            </p>
                            <p className="text-white/80 leading-relaxed">
                                Revisions may be requested to ensure the project meets required standards.
                            </p>
                        </div>
                    </section>

                    {/* 4. Communication & Deadlines */}
                    <section className="space-y-4">
                        <h2 className="text-xl md:text-2xl font-semibold text-primary">4. Communication & Deadlines</h2>
                        <div className="pl-4 border-l-2 border-white/10 space-y-2">
                            <p className="text-white/80 leading-relaxed">
                                The Freelancer must maintain timely communication regarding project status.
                            </p>
                            <p className="text-white/80 leading-relaxed">
                                Any delay must be communicated in advance. Approval of deadline extensions will be at the sole discretion of Catalance.
                            </p>
                        </div>
                    </section>

                    {/* 5. No Advance Payments */}
                    <section className="space-y-4">
                        <h2 className="text-xl md:text-2xl font-semibold text-primary">5. No Advance Payments</h2>
                        <div className="pl-4 border-l-2 border-white/10 space-y-2">
                            <p className="text-white/80 leading-relaxed">
                                Catalance does not provide advance or upfront payments.
                            </p>
                            <p className="text-white/80 leading-relaxed">
                                Payment will only be processed after final approval of the completed project.
                            </p>
                        </div>
                    </section>

                    {/* 6. Confidentiality */}
                    <section className="space-y-4">
                        <h2 className="text-xl md:text-2xl font-semibold text-primary">6. Confidentiality</h2>
                        <div className="pl-4 border-l-2 border-white/10 space-y-2">
                            <p className="text-white/80 leading-relaxed">
                                The Freelancer agrees to keep all project-related information confidential and not share it with third parties.
                            </p>
                        </div>
                    </section>

                    {/* 7. Termination */}
                    <section className="space-y-4">
                        <h2 className="text-xl md:text-2xl font-semibold text-primary">7. Termination</h2>
                        <div className="pl-4 border-l-2 border-white/10 space-y-2">
                            <p className="text-white/80 leading-relaxed">
                                Catalance reserves the right to terminate a project if the Freelancer fails to meet requirements.
                            </p>
                            <p className="text-white/80 leading-relaxed">
                                In such cases, no payment will be due.
                            </p>
                        </div>
                    </section>

                    {/* 8. Agreement */}
                    <section className="space-y-4">
                        <h2 className="text-xl md:text-2xl font-semibold text-primary">8. Agreement</h2>
                        <div className="pl-4 border-l-2 border-white/10 space-y-2">
                            <p className="text-white/80 leading-relaxed">
                                By accepting work from Catalance, the Freelancer confirms that they have read, understood, and agreed to these Terms & Conditions.
                            </p>
                        </div>
                    </section>
                </div>

                {/* Footer Note */}
                <div className="text-center pt-8 border-t border-white/10">
                    <p className="text-white/40 text-sm">
                        © {new Date().getFullYear()} Catalance. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TermsConditions;
