'use client';

import Image from "next/image";

import './steps.css';

export default function Steps() {
  return (
    <div id="connexion" className="section steps width">
      <div className="section-heading">
        <h2 className="section-title">Conçue avec soin et attention au détail</h2>
        <p className="section-description">
          Papillon n'est pas juste un client de vie scolaire comme les autres. C'est une application pensée de fond en combre pour rendre l'école agréable et fluide.
        </p>
      </div>

      <div className="steps-list">
        <div className="step">
          <img
            src="/steps/step1.png"
            alt="Step 1"
            width={400}
            height={200}
            className="step-image"
          />
          <h3 className="step-title">
            L'essentiel au même endroit
          </h3>
          <p className="step-description">
            Chaque composant est pensé pour apporter l'information essentielle au bon moment. Tout apparaît lorsque vous en avez besoin.
          </p>
        </div>

        <div className="step">
          <img
            src="/steps/step2.png"
            alt="Step 1"
            width={400}
            height={200}
            className="step-image"
          />
          <h3 className="step-title">
            Organisé pour vous
          </h3>
          <p className="step-description">
            Vous n'avez plus besoin de penser à où chercher. Tout est centralisé, organisé et accessible en un seul endroit.
          </p>
        </div>

        <div className="step">
          <img
            src="/steps/step3.png"
            alt="Step 1"
            width={400}
            height={200}
            className="step-image"
          />
          <h3 className="step-title">
            Intégré à votre écosystème
          </h3>
          <p className="step-description">
            L'interface Papillon est développée autour de Liquid Glass et des composants natifs pour s'intégrer parfaitement à votre environnement.
          </p>
        </div>
      </div>
    </div>
  );
}
