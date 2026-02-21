import './download.css';

export default function Download() {
  return (
    <div className="cardDownload">
      <div className="cardDownloadSide qr">
        <h2>Scanner le QR-code</h2>
        <p className="description">
          Ouvrez l'appareil photo de votre téléphone et scannez le QR-code pour télécharger l'application Papillon.
        </p>
        <img
          className="qrCode"
          src="/qrcode.svg"
          alt=""
        />
      </div>
      <div className="cardDownloadSide">
        <h2>Préinscription</h2>
        <p className="description">
          Pour préinscrire votre enfant, cliquez sur ce lien
        </p>

        <div className="storeButtons">
          <a href="https://preinscriptions.ecoledirecte.com/?RNE=0271187U" target="_blank" rel="noreferrer">
            <img className="storeButton" src="/appstore_svg.svg" alt="Télécharger sur l'App Store" />
          </a>
        </div>

        <h2>Réglement intérieur</h2>
        <p className="description">
          Vous pouvez également rejoindre nos programmes de test pour accéder aux dernières fonctionnalités en avant-première.
        </p>

        <a href="https://www.test.jeannedarcsaintanselme.com/images/ReglementInterieurLycees_1718.pdf" className="betaLink">
          -&gt; Règlement intérieur du Lycée
        </a>
        <a href="https://play.google.com/store/apps/details?id=xyz.getpapillon.app" className="betaLink">
          -&gt; Règlement intérieur
        </a>
      </div>
    </div>
  );
}
