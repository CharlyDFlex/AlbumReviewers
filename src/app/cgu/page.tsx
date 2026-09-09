import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Conditions générales d'utilisation — Vinylbox",
};

export default function CguPage() {
  return (
    <LegalPage title="Conditions générales d'utilisation" updated="9 septembre 2026">
      <section>
        <h2>Objet</h2>
        <p>
          Vinylbox est un service permettant de noter et critiquer des albums et des morceaux,
          de tenir un journal d&apos;écoute, de constituer une liste d&apos;albums à écouter, et
          de connecter en option un compte Spotify pour importer ses playlists. L&apos;utilisation
          du site implique l&apos;acceptation pleine et entière des présentes conditions
          générales d&apos;utilisation (CGU).
        </p>
      </section>

      <section>
        <h2>Compte utilisateur</h2>
        <p>
          La création d&apos;un compte nécessite une adresse email, un nom d&apos;utilisateur et
          un mot de passe. Tu t&apos;engages à fournir des informations exactes et à conserver la
          confidentialité de ton mot de passe. Un compte est strictement personnel. Le service
          est accessible aux personnes âgées d&apos;au moins 15 ans ; en dessous de cet âge,
          l&apos;inscription requiert l&apos;autorisation d&apos;un titulaire de l&apos;autorité
          parentale.
        </p>
      </section>

      <section>
        <h2>Contenus publiés par les utilisateurs</h2>
        <p>
          Tu restes propriétaire des critiques et notes que tu publies. En les publiant, tu
          accordes à Vinylbox une licence non exclusive et gratuite d&apos;affichage de ces
          contenus sur le site, pour la durée de leur publication. Tu t&apos;engages à ne pas
          publier de contenu illicite, diffamatoire, injurieux, ou portant atteinte aux droits
          d&apos;un tiers (droit d&apos;auteur, droit à l&apos;image, vie privée, etc.).
        </p>
      </section>

      <section>
        <h2>Modération et signalement</h2>
        <p>
          Tout contenu estimé illicite ou contraire aux présentes CGU peut être signalé à
          [adresse email de contact à compléter]. L&apos;éditeur se réserve le droit de retirer
          tout contenu manifestement illicite ou contraire aux présentes CGU, et de suspendre ou
          supprimer un compte en cas de manquement.
        </p>
      </section>

      <section>
        <h2>Connexion à des services tiers</h2>
        <p>
          La connexion optionnelle à un compte Spotify est soumise aux conditions
          d&apos;utilisation propres à Spotify. Vinylbox ne peut être tenu responsable
          d&apos;une indisponibilité ou d&apos;une modification de l&apos;API Spotify
          indépendante de sa volonté. Les pochettes d&apos;albums, informations sur les artistes
          et morceaux affichées sur le site proviennent de bases de données tierces et restent la
          propriété de leurs ayants droit respectifs.
        </p>
      </section>

      <section>
        <h2>Disponibilité du service</h2>
        <p>
          Vinylbox est un projet en développement, fourni « en l&apos;état », sans garantie de
          disponibilité continue ni d&apos;absence d&apos;erreurs. Des interruptions ou
          modifications du service peuvent intervenir sans préavis.
        </p>
      </section>

      <section>
        <h2>Responsabilité</h2>
        <p>
          L&apos;éditeur ne saurait être tenu responsable des dommages directs ou indirects
          résultant de l&apos;utilisation du site, de contenus publiés par des tiers, ou d&apos;une
          indisponibilité du service.
        </p>
      </section>

      <section>
        <h2>Modification des CGU</h2>
        <p>
          Les présentes CGU peuvent être modifiées à tout moment. Les utilisateurs seront
          informés de toute modification substantielle via le site.
        </p>
      </section>

      <section>
        <h2>Droit applicable</h2>
        <p>
          Les présentes CGU sont soumises au droit français. À défaut de résolution amiable
          d&apos;un litige, les tribunaux français compétents en seront saisis.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>Pour toute question relative aux présentes CGU : [adresse email de contact à compléter].</p>
      </section>
    </LegalPage>
  );
}
