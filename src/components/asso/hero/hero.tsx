"use client";
import LightRays from "@/components/effects/LightRays/LightRays";
import "./hero.css";
import Image from "next/image";
import Button from "@/atoms/button/button";
import { Code2Icon, DownloadIcon } from "lucide-react";
import { useEffect, useState } from "react";

function getOS() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return null;
  // @ts-ignore
  var uA = navigator.userAgent || navigator.vendor || (window as any).opera;
  // @ts-ignore
  if ((/iPad|iPhone|iPod/.test(uA) && !(window as any).MSStream) || (uA.includes('Mac') && 'ontouchend' in document)) return 'iOS';
  var i, os = ['Android', 'iOS'];
  for (i = 0; i < os.length; i++) if (new RegExp(os[i], 'i').test(uA)) return os[i];
  return null;
}

export default function Hero() {
  const [os, setOS] = useState<string | null>(null);
  useEffect(() => {
    setOS(getOS());
  }, []);

  return (
    <div className="hero navbar-dark-sentinel">
      <div className="light-rays-container">
        <LightRays
          raysOrigin="top-center"
          raysColor="#94296e"
          raysSpeed={1}
          lightSpread={4}
          rayLength={12}
          followMouse={true}
          mouseInfluence={0.3}
          noiseAmount={0.1}
          distortion={0.01}
          className="custom-rays"
          pulsating={false}
          fadeDistance={3}
          saturation={2}
        />
      </div>

      <div className="hero-title width">
        <Image
          src="/appicon-glass.png"
          alt="Papillon"
          width={96}
          height={96}
        />
        <h1>
          Faire équipe<br />
          pour faire mieux.
        </h1>
        <Image
          src="/people.png"
          alt=""
          width={400}
          height={67}
          style={{ height: 'auto' }}
          className="hero-people"
        />
        <p className="hero-description">
          Papillon, c'est aussi 6 étudiants passionnés qui cherchent toujours a créer l'inattendu pour fournir une expérience au delà des attentes.
        </p>
        <div className="hero-image-container">
          <Image
            src="/asso-hand.png"
            alt=""
            width={1200}
            height={1200}
            className="hero-image"
          />
        </div>
      </div>
    </div>
  )
}
