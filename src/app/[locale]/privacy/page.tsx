'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Politique de confidentialite
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Derniere mise a jour : mars 2026
          </p>

          <div className="mt-8 space-y-8 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                Introduction
              </h2>
              <p className="mt-3">
                GrabSpec, entreprise individuelle basee en Suisse, attache une
                grande importance a la protection de vos donnees personnelles.
                La presente politique de confidentialite decrit les donnees que
                nous collectons, comment nous les utilisons et les mesures que
                nous prenons pour les proteger.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                Donnees collectees
              </h2>
              <p className="mt-3">
                GrabSpec fonctionne sans systeme d&apos;authentification. Nous
                ne collectons ni nom, ni adresse e-mail, ni mot de passe. Les
                seules donnees traitees sont :
              </p>
              <ul className="mt-3 list-disc pl-6 space-y-1">
                <li>
                  <strong>Identifiant de session anonyme</strong> : un
                  identifiant genere aleatoirement (UUID), stocke localement
                  dans votre navigateur, utilise uniquement pour le suivi des
                  quotas et des abonnements.
                </li>
                <li>
                  <strong>Donnees de bibliotheque</strong> : vos projets,
                  produits et preferences sont stockes localement dans votre
                  navigateur (IndexedDB) et ne sont jamais transmis a nos
                  serveurs.
                </li>
                <li>
                  <strong>Donnees de paiement</strong> : les paiements sont
                  traites par Stripe. Nous ne stockons aucune information de
                  carte bancaire.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                Utilisation des donnees
              </h2>
              <p className="mt-3">
                Les donnees collectees sont utilisees exclusivement pour :
              </p>
              <ul className="mt-3 list-disc pl-6 space-y-1">
                <li>
                  Gerer les quotas de recherche (limitation a 3 recherches par
                  jour pour le plan gratuit)
                </li>
                <li>Associer un abonnement a votre session</li>
                <li>Ameliorer la qualite du service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                Stockage et securite
              </h2>
              <p className="mt-3">
                Vos donnees de bibliotheque sont stockees localement dans
                votre navigateur et ne transitent jamais par nos serveurs. Les
                fichiers convertis via le convertisseur PDF/Word sont stockes
                temporairement et automatiquement supprimes apres 1 heure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                Cookies
              </h2>
              <p className="mt-3">
                GrabSpec n&apos;utilise pas de cookies de suivi ou
                publicitaires. Seuls des cookies techniques strictement
                necessaires au fonctionnement du site peuvent etre utilises.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                Vos droits
              </h2>
              <p className="mt-3">
                Conformement a la Loi federale suisse sur la protection des
                donnees (LPD), vous disposez d&apos;un droit d&apos;acces, de
                rectification et de suppression de vos donnees. Pour exercer
                ces droits, contactez-nous a{' '}
                <a
                  href="mailto:contact@grabspec.com"
                  className="text-blue-600 hover:underline"
                >
                  contact@grabspec.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                Contact
              </h2>
              <p className="mt-3">
                Pour toute question relative a la protection de vos donnees,
                contactez-nous a{' '}
                <a
                  href="mailto:contact@grabspec.com"
                  className="text-blue-600 hover:underline"
                >
                  contact@grabspec.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
