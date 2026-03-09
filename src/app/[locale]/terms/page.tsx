'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Conditions d&apos;utilisation
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Derniere mise a jour : mars 2026
          </p>

          <div className="mt-8 space-y-8 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                1. Objet
              </h2>
              <p className="mt-3">
                Les presentes conditions generales d&apos;utilisation (CGU)
                regissent l&apos;utilisation du service GrabSpec, accessible
                a l&apos;adresse https://grabspec.com, edite par GrabSpec,
                entreprise individuelle de droit suisse.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                2. Description du service
              </h2>
              <p className="mt-3">
                GrabSpec est un service en ligne permettant de rechercher
                automatiquement des photos de produits et des fiches
                techniques PDF a partir d&apos;une liste de produits.
                Le service comprend egalement un convertisseur PDF/Word
                gratuit et une bibliotheque de produits personnelle.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                3. Acces au service
              </h2>
              <p className="mt-3">
                L&apos;acces au service ne necessite aucune inscription. Un
                identifiant de session anonyme est genere automatiquement
                lors de la premiere visite. Le plan gratuit permet 3
                recherches par jour. Les plans payants (Pro et Business)
                offrent des fonctionnalites supplementaires.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                4. Tarifs et paiement
              </h2>
              <p className="mt-3">
                Les tarifs en vigueur sont indiques sur la page Tarifs du
                site. Les paiements sont traites de maniere securisee par
                Stripe. Les abonnements peuvent etre mensuels ou annuels.
                Aucune donnee de carte bancaire n&apos;est stockee par
                GrabSpec.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                5. Propriete intellectuelle
              </h2>
              <p className="mt-3">
                Le service GrabSpec et l&apos;ensemble de ses composants
                (code, design, textes, logos) sont la propriete exclusive de
                GrabSpec. Les photos et fiches techniques recuperees par le
                service restent la propriete de leurs detenteurs respectifs.
                L&apos;utilisateur est responsable de l&apos;usage qu&apos;il
                fait des contenus telecharges.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                6. Limitation de responsabilite
              </h2>
              <p className="mt-3">
                GrabSpec fournit le service &laquo; en l&apos;etat &raquo;.
                GrabSpec ne garantit pas l&apos;exactitude, la completude ou
                la disponibilite des resultats de recherche. GrabSpec ne
                saurait etre tenu responsable des dommages directs ou
                indirects resultant de l&apos;utilisation du service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                7. Donnees personnelles
              </h2>
              <p className="mt-3">
                Le traitement des donnees personnelles est decrit dans notre{' '}
                <a
                  href="/privacy"
                  className="text-blue-600 hover:underline"
                >
                  Politique de confidentialite
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                8. Modification des CGU
              </h2>
              <p className="mt-3">
                GrabSpec se reserve le droit de modifier les presentes CGU a
                tout moment. Les modifications entrent en vigueur des leur
                publication sur le site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                9. Droit applicable
              </h2>
              <p className="mt-3">
                Les presentes CGU sont soumises au droit suisse. En cas de
                litige, les tribunaux suisses seront seuls competents.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
