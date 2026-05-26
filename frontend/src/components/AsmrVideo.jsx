import React, { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Play, Pause } from "lucide-react";

const VIDEO = "https://assets.mixkit.co/videos/32957/32957-720.mp4";
const POSTER = "https://images.pexels.com/photos/10126661/pexels-photo-10126661.jpeg?auto=compress&cs=tinysrgb&w=1800";

export default function AsmrVideo() {
  const ref = useRef(null);
  const videoRef = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <section
      id="asmr"
      ref={ref}
      data-testid="asmr-section"
      className="relative w-full bg-black py-24 md:py-36 border-t border-white/5"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-end mb-12 md:mb-16">
          <div className="md:col-span-7">
            <span className="text-[11px] tracking-[0.4em] uppercase text-white/50">
              006 — ASMR
            </span>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 text-4xl md:text-6xl lg:text-7xl tracking-tighter font-medium leading-[0.95]"
            >
              Звук <span className="text-[#BDBDBD]">точности.</span><br />
              Cinematic detailing.
            </motion.h2>
          </div>
          <p className="md:col-span-5 text-[#BDBDBD] text-base md:text-lg leading-relaxed">
            Плёнка. Фен. Ракель. Капли воды. Включите звук — услышите, как
            рождается идеальная поверхность.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="relative w-full aspect-[21/9] overflow-hidden bg-[#0A0A0A] border border-white/10 group cursor-pointer"
          onClick={toggle}
          data-testid="asmr-video-container"
        >
          <video
            ref={videoRef}
            poster={POSTER}
            loop
            muted={muted}
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={VIDEO} type="video/mp4" />
          </video>

          {/* Overlay */}
          <div className={`absolute inset-0 transition-opacity duration-700 ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 grain pointer-events-none" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggle(); }}
                data-testid="asmr-play-toggle"
                className="w-20 h-20 md:w-24 md:h-24 rounded-full border border-white/30 backdrop-blur-md bg-black/30 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-500 group/btn"
                aria-label="Play"
              >
                {playing ? <Pause size={26} strokeWidth={1.5} /> : <Play size={26} strokeWidth={1.5} className="ml-1" />}
              </button>
              <div className="text-[11px] tracking-[0.4em] uppercase text-white/70">
                {playing ? "Пауза" : "Смотреть"} · 02:14
              </div>
            </div>
          </div>

          {/* Mute toggle */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
            data-testid="asmr-mute-toggle"
            className="absolute top-6 right-6 px-4 py-2 border border-white/20 backdrop-blur-md bg-black/40 text-[10px] tracking-[0.3em] uppercase hover:bg-white hover:text-black transition-all duration-300"
          >
            {muted ? "Звук — выкл" : "Звук — вкл"}
          </button>
        </motion.div>
      </div>
    </section>
  );
}
