'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Contact
          </h1>

          <div className="mt-8 space-y-8 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                Nous contacter
              </h2>
              <p className="mt-3">
                Pour toute question, suggestion ou demande concernant
                GrabSpec, n&apos;hesitez pas a nous contacter.
              </p>
            </section>

            <section>
              <div className="rounded-lg border bg-white p-6 space-y-4">
                <div>
                  <h3 className="font-medium text-slate-900">E-mail</h3>
                  <a
                    href="mailto:contact@grabspec.com"
                    className="mt-1 text-blue-600 hover:underline"
                  >
                    contact@grabspec.com
                  </a>
                </div>

                <div>
                  <h3 className="font-medium text-slate-900">
                    Editeur
                  </h3>
                  <p className="mt-1">
                    GrabSpec — Entreprise individuelle
                  </p>
                  <p>Suisse</p>
                </div>

                <div>
                  <h3 className="font-medium text-slate-900">
                    Delai de reponse
                  </h3>
                  <p className="mt-1">
                    Nous nous efforcons de repondre a toutes les demandes
                    dans un delai de 48 heures ouvrables.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                Support technique
              </h2>
              <p className="mt-3">
                Si vous rencontrez un probleme technique avec GrabSpec,
                veuillez inclure dans votre message :
              </p>
              <ul className="mt-3 list-disc pl-6 space-y-1">
                <li>Une description du probleme rencontre</li>
                <li>Le navigateur et systeme d&apos;exploitation utilises</li>
                <li>Des captures d&apos;ecran si possible</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                Abonnements et facturation
              </h2>
              <p className="mt-3">
                Pour toute question relative a votre abonnement ou a la
                facturation, contactez-nous par e-mail. Les paiements sont
                geres de maniere securisee par Stripe.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
