import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Politique de confidentialité — Vinylbox",
};

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité" updated="9 septembre 2026">
      <section>
        <h2>Responsable du traitement</h2>
        <p>
          [Nom et prénom à compléter], éditeur du site, joignable à [adresse email de contact à
          compléter].
        </p>
      </section>

      <section>
        <h2>Données collectées</h2>
        <ul>
          <li>
            <strong>Compte :</strong> adresse email, nom d&apos;utilisateur, mot de passe (haché
            et géré par le fournisseur d&apos;authentification, jamais stocké en clair), bio et
            avatar si renseignés.
          </li>
          <li>
            <strong>Activité sur le site :</strong> notes, critiques, journal d&apos;écoute,
            liste « à écouter », playlists ajoutées.
          </li>
          <li>
            <strong>Connexion Spotify (optionnelle) :</strong> identifiant Spotify et jetons
            d&apos;accès/de rafraîchissement OAuth, uniquement si tu choisis de connecter ton
            compte pour importer tes playlists.
          </li>
        </ul>
      </section>

      <section>
        <h2>Finalités du traitement</h2>
        <ul>
          <li>Créer et gérer ton compte, et fournir les fonctionnalités du site (notes, critiques, journal, listes).</li>
          <li>Permettre, si tu l&apos;actives, l&apos;import de tes playlists Spotify.</li>
          <li>Assurer la sécurité du service et prévenir les abus.</li>
        </ul>
      </section>

      <section>
        <h2>Base légale</h2>
        <p>
          L&apos;exécution du contrat (fourniture du service demandé) pour la création de compte
          et les fonctionnalités du site ; ton consentement, révocable à tout moment, pour la
          connexion optionnelle à Spotify.
        </p>
      </section>

      <section>
        <h2>Destinataires des données</h2>
        <p>Tes données sont traitées par les prestataires techniques suivants :</p>
        <ul>
          <li>Supabase, Inc. — hébergement de la base de données et de l&apos;authentification.</li>
          <li>Vercel Inc. — hébergement de l&apos;application.</li>
          <li>Spotify — uniquement si tu connectes ton compte, dans le cadre de l&apos;échange OAuth.</li>
        </ul>
        <p>
          Ces prestataires peuvent traiter des données en dehors de l&apos;Union européenne
          (notamment aux États-Unis). Ils s&apos;appuient sur les garanties prévues par le RGPD
          pour ces transferts (clauses contractuelles types).
        </p>
      </section>

      <section>
        <h2>Durée de conservation</h2>
        <p>
          Tes données sont conservées tant que ton compte est actif. En cas de suppression de
          compte, elles sont supprimées ou anonymisées dans un délai raisonnable, sous réserve
          des obligations légales de conservation qui s&apos;imposeraient à l&apos;éditeur.
        </p>
      </section>

      <section>
        <h2>Sécurité</h2>
        <p>
          Des mesures raisonnables sont mises en œuvre pour protéger tes données : accès à la
          base de données restreints par utilisateur (Row Level Security), transport chiffré via
          HTTPS, et chiffrement (AES-256) des jetons d&apos;accès et de rafraîchissement Spotify
          avant leur stockage. Aucun système n&apos;étant infaillible, contacte-nous sans délai
          si tu identifies une faille de sécurité.
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          Le site utilise uniquement les cookies strictement nécessaires à son fonctionnement
          (maintien de ta session de connexion). Aucun cookie de mesure d&apos;audience ou
          publicitaire n&apos;est utilisé à ce jour ; si cela change, un bandeau de consentement
          sera ajouté.
        </p>
      </section>

      <section>
        <h2>Tes droits</h2>
        <p>
          Conformément au Règlement Général sur la Protection des Données (RGPD), tu disposes
          d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation,
          d&apos;opposition et de portabilité sur tes données. Tu peux exercer ces droits en nous
          contactant à [adresse email de contact à compléter], ou supprimer ton compte et ses
          données directement depuis ton profil. Tu peux également introduire une réclamation
          auprès de la{" "}
          <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">
            CNIL
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
