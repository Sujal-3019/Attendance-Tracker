import {
    ArrowRight,
    CheckCircle2,
    MapPin,
    ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

function HeroSection() {
    return (
        <section className="relative overflow-hidden">
            <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-16 sm:px-6 md:pb-28 md:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
                {/* Copy */}
                <div className="max-w-2xl">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/50 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-md">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Smarter workforce management
                    </div>

                    <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                        Attendance that works
                        <span className="block text-muted-foreground">
                            wherever your team works.
                        </span>
                    </h1>

                    <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                        Track attendance, working hours, leaves, overtime and wages from
                        one intelligent workforce platform — built for office, remote,
                        hybrid and field teams.
                    </p>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link to="/register">
                            <Button size="lg" className="rounded-xl px-6">
                                Start managing attendance
                                <ArrowRight className="size-4" />
                            </Button>
                        </Link>

                        <Link to="/login">
                            <Button
                                size="lg"
                                variant="outline"
                                className="rounded-xl bg-background/40 px-6"
                            >
                                I already have an account
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="size-4 text-emerald-500" />
                            Location-aware attendance
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ShieldCheck className="size-4 text-emerald-500" />
                            Auditable records
                        </div>
                    </div>
                </div>

                {/* Dashboard preview */}
                <div className="relative">
                    <div className="absolute -inset-8 rounded-[3rem] bg-cyan-400/10 blur-3xl" />

                    <div className="relative rounded-3xl border border-border/60 bg-card/65 p-3 shadow-2xl shadow-black/10 backdrop-blur-xl">
                        <div className="rounded-2xl border border-border/50 bg-background/70 p-5">
                            {/* Window header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Today's attendance
                                    </p>
                                    <p className="mt-1 text-xl font-semibold">
                                        Monday, 01 October
                                    </p>
                                </div>

                                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10">
                                    <MapPin className="size-5 text-emerald-500" />
                                </div>
                            </div>

                            {/* Main status */}
                            <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Attendance status
                                        </p>

                                        <p className="mt-1 text-2xl font-semibold">
                                            Checked in
                                        </p>
                                    </div>

                                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                        On time
                                    </span>
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-background/70 p-3">
                                        <p className="text-[11px] text-muted-foreground">
                                            Check in
                                        </p>
                                        <p className="mt-1 font-medium">08:57 AM</p>
                                    </div>

                                    <div className="rounded-xl bg-background/70 p-3">
                                        <p className="text-[11px] text-muted-foreground">
                                            Location
                                        </p>
                                        <p className="mt-1 font-medium">Office verified</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="mt-3 grid grid-cols-3 gap-3">
                                <div className="rounded-xl border bg-card p-3">
                                    <p className="text-[11px] text-muted-foreground">
                                        Present
                                    </p>
                                    <p className="mt-1 text-lg font-semibold">24</p>
                                </div>

                                <div className="rounded-xl border bg-card p-3">
                                    <p className="text-[11px] text-muted-foreground">
                                        Late
                                    </p>
                                    <p className="mt-1 text-lg font-semibold">3</p>
                                </div>

                                <div className="rounded-xl border bg-card p-3">
                                    <p className="text-[11px] text-muted-foreground">
                                        Leave
                                    </p>
                                    <p className="mt-1 text-lg font-semibold">2</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default HeroSection;