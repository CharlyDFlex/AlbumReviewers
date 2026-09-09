import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Mentions légales — Vinylbox",
};

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales" updated="9 septembre 2026">
      <section>
        <h2>Éditeur du site</h2>
        <p>
          Le site Vinylbox est édité, à titre non professionnel et personnel, par [Nom et
          prénom à compléter] (contact : [adresse email de contact à compléter]). Conformément à
          l&apos;article 6-III de la loi n°2004-575 du 21 juin 2004 pour la confiance dans
          l&apos;économie numérique (LCEN), l&apos;éditeur étant une personne physique
          n&apos;agissant pas à titre professionnel, ses coordonnées complètes (adresse postale)
          ne sont pas publiées ici mais restent communicables à l&apos;hébergeur ou aux autorités
          compétentes qui en feraient la demande.
        </p>
      </section>

      <section>
        <h2>Directeur de la publication</h2>
        <p>[Nom et prénom à compléter], éditeur du site (contact ci-dessus).</p>
      </section>

      <section>
        <h2>Hébergement</h2>
        <p>
          Le site (application) est hébergé par Vercel Inc. — informations légales disponibles
          sur{" "}
          <a href="https://vercel.com/legal" target="_blank" rel="noreferrer">
            vercel.com/legal
          </a>
          .
        </p>
        <p>
          La base de données et l&apos;authentification des comptes sont hébergées par Supabase,
          Inc. — informations légales disponibles sur{" "}
          <a href="https://supabase.com/legal" target="_blank" rel="noreferrer">
            supabase.com/legal
          </a>
          .
        </p>
      </section>

      <section>
        <h2>Propriété intellectuelle</h2>
        <p>
          La structure du site, son design et son code sont la propriété de l&apos;éditeur, sauf
          mention contraire. Les pochettes d&apos;albums, noms d&apos;artistes, titres de morceaux
          et métadonnées associées affichés sur le site proviennent de bases de données tierces
          (iTunes, MusicBrainz notamment) et restent la propriété de leurs ayants droit
          respectifs. Les critiques, notes et contenus publiés par les utilisateurs restent la
          propriété de leurs auteurs (voir les{" "}
          <a href="/cgu">conditions générales d&apos;utilisation</a>).
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Pour toute question relative au site ou pour signaler un contenu, un contact est
          disponible dans les{" "}
          <a href="/cgu">CGU</a> et la{" "}
          <a href="/confidentialite">politique de confidentialité</a>.
        </p>
      </section>
    </LegalPage>
  );
}
