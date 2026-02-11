import Cards from "@/components/home/cards/cards";
import FAQ from "@/components/home/faq/faq";
import Features from "@/components/home/features/features";
import Hero from "@/components/home/hero/hero";
import HowTo from "@/components/home/howto/howto";
import Steps from "@/components/home/steps/steps";
import Secured from "@/components/home/secured/secured";
import Why from "@/components/home/why/why";
import Head from "next/head";

export default function Home() {
  return (
    <div className="app">
      <Hero />
      <Steps />
      <Secured />
      <Features />
      <FAQ />
      <Why />

      {/*
      <HowTo />
      */}
    </div>
  );
}
