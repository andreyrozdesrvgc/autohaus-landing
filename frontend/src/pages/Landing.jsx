import React from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import SafetyProtocol from "@/components/SafetyProtocol";
import BeforeAfter from "@/components/BeforeAfter";
import Services from "@/components/Services";
import Configurator from "@/components/Configurator";
import Stats from "@/components/Stats";
import Gallery from "@/components/Gallery";
import AutoHausLive from "@/components/AutoHausLive";
import Quiz from "@/components/Quiz";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

export default function Landing() {
  return (
    <main data-testid="landing-page" className="bg-black text-white">
      <Navigation />
      <Hero />
      <SafetyProtocol />
      <Quiz />
      <BeforeAfter />
      <Services />
      <Configurator />
      <Stats />
      <Gallery />
      <AutoHausLive />
      <ContactForm />
      <Footer />
    </main>
  );
}
