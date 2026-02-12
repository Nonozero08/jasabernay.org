import './steps.css';

export default function Steps() {
  return (
    <div id="connexion" className="section steps width">
      <div className="section-heading">
        <h2 className="section-title">Conçu avec soin et attention au détail</h2>
        <p className="section-description">
          Papillon est né de la volonté de donner une expérience utilisateur digne de ce nom aux services scolaires que l’on connaît, et cela passe par nos fonctionnalités.
        </p>
      </div>

      <div className="steps-list">
        <div className="step">
          <h3 className="step-title">
            À jour, toujours
          </h3>
          <p className="step-description">
            Papillon se synchronise avec vos services scolaires comme Pronote ou ÉcoleDirecte et affiche les informations pertinentes en temps réel au cours de la journée.
          </p>
          <video src="/steps/step_updates.webm" autoPlay muted loop playsInline />
        </div>

        <div className="step">
          <h3 className="step-title">
            Organisé pour vous
          </h3>
          <p className="step-description">
            Grâce aux fonctionnalités d’organisation et d’interaction avec l’établissement, ne manquez plus un seul devoir. Tout est fluide, clair et facile à accomplir.
          </p>
          <video src="/steps/step_task.webm" autoPlay muted loop playsInline />

        </div>

        <div className="step">
          <h3 className="step-title">
            Super-intelligent
          </h3>
          <p className="step-description">
            Ne perdez plus de temps à tout calculer. L’interface Papillon affiche vos résultats clairement, et vous permet même de naviguer dans votre moyenne générale.
          </p>
          <video src="/steps/step_graph2.webm" autoPlay muted loop playsInline />

        </div>
      </div>
    </div>
  );
}
