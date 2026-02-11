import Image from "next/image";
import "./secured.css";

export default function Secured() {
  return (
    <div id="secured" className="section secured ">
      <div className="section-heading">
        <h2 className="section-title">Sécurisé et respectueux de la vie privée</h2>
        <p className="section-description">
          Papillon fait très attention à la sécurité de vos données. C'est pour cela que l'application est par architecture pensée pour que vos informations sensibles <span>restent en sécurité</span>. Papillon ne garde aucun identifiant et conserve vos données sur votre téléphone sans utiliser de serveurs annexes.
        </p>
        <p className="section-small">
          C'est un peu comme si vous vous connectiez à votre boite e-mail depuis une application tierce.
        </p>
      </div>

      <div className="secured-grid">
        <div className="secured-item">
          <div className="icon">
            <Image
              src="/phone.svg"
              alt="Données stockées localement"
              fill
            />
          </div>
          <h3>Données stockées localement</h3>
          <p>
            Aucune information n'est transmise à Papillon. Tout reste sur votre téléphone en toute sécurité
          </p>
        </div>

        <div className="secured-item">
          <div className="icon">
            <Image
              src="/code.svg"
              alt="Logiciel libre et open-source"
              fill
            />
          </div>
          <h3>Logiciel libre et open-source</h3>
          <p>
            Tout le monde peut regarder le code de Papillon pour comprendre comment il fonctionne.
          </p>
        </div>

        <div className="secured-item">
          <div className="icon">
            <Image
              src="/lock.svg"
              alt="Échanges chiffrés avec l'établissement"
              fill
            />
          </div>
          <h3>Échanges chiffrés avec l'établissement</h3>
          <p>
            Les seuls transferts de données se font entre vous et votre établissement, de manière chiffrée et sécurisée
          </p>
        </div>

        <div className="secured-item">
          <div className="icon">
            <Image
              src="/walk.svg"
              alt="Aucun pistage ni collecte de données"
              width={32}
              height={32}
            />
          </div>
          <h3>Aucun pistage ni collecte de données</h3>
          <p>
            Papillon est un projet à but non lucratif qui ne fait pas appel à de la publicité, à du ciblage ou à de la collecte de données.
          </p>
        </div>
      </div>

      <div className="secured-bottom section-heading navbar-dark-sentinel">
        <h2 className="section-title section-mid">On ne connaît pas votre mot de passe.</h2>
        <p className="section-description">
          Votre mot de passe n'est jamais conservé. Papillon vous connecte sur le site officiel de votre établissement, puis ne garde <span>qu'un accès sécurisé</span>, et non vos identifiants.
        </p>
      </div>
    </div>
  );
}
