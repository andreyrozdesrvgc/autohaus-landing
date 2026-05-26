import React from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import SafetyProtocol from "@/components/SafetyProtocol";
import BeforeAfter from "@/components/BeforeAfter";
import Services from "@/components/Services";
import Configurator from "@/components/Configurator";
import Process from "@/components/Process";
import AsmrVideo from "@/components/AsmrVideo";
import Stats from "@/components/Stats";
import Gallery from "@/components/Gallery";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

export default function Landing() {
  return (
    <main data-testid="landing-page" className="bg-black text-white overflow-x-hidden">
      <Navigation />
      <Hero />
      <SafetyProtocol />
      <BeforeAfter />
      <Services />
      <Configurator />
      <Process />
      <AsmrVideo />
      <Stats />
      <Gallery />
      <ContactForm />
      <Footer />
    </main>
  );
}
