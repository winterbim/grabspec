'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function LegalPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Mentions legales
          </h1>

          <div className="mt-8 space-y-8 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                Editeur du site
              </h2>
              <p className="mt-3">
                Le site GrabSpec (ci-apres &laquo; le Site &raquo;) est edite
                par GrabSpec, entreprise individuelle de droit suisse.
              </p>
              <ul className="mt-3 list-disc pl-6 space-y-1">
                <li>Raison sociale : GrabSpec</li>
                <li>Forme juridique : Entreprise individuelle</li>
                <li>Siege social : Suisse</li>
                <li>
                  Contact :{' '}
                  <a
                    href="mailto:contact@grabspec.com"
                    className="text-blue-600 hover:underline"
                  >
                    contact@grabspec.com
                  </a>
                </li>
                <li>Site web : https://grabspec.com</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                Hebergement
              </h2>
              <p className="mt-3">
                Le site est heberge par Vercel Inc., 340 S Lemon Ave #4133,
                Walnut, CA 91789, Etats-Unis.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                Propriete intellectuelle
              </h2>
              <p className="mt-3">
                L&apos;ensemble du contenu du site (textes, images, logos,
                logiciels, base de donnees) est protege par le droit de la
                propriete intellectuelle. Toute reproduction, representation
                ou diffusion, en tout ou partie, du contenu de ce site sans
                autorisation prealable est interdite.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                Responsabilite
              </h2>
              <p className="mt-3">
                GrabSpec s&apos;efforce de fournir des informations exactes et
                a jour sur le site. Toutefois, GrabSpec ne peut garantir
                l&apos;exactitude, la completude ou l&apos;actualite des
                informations diffusees. L&apos;utilisation du site se fait
                sous l&apos;entiere responsabilite de l&apos;utilisateur.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">
                Droit applicable
              </h2>
              <p className="mt-3">
                Les presentes mentions legales sont soumises au droit suisse.
                En cas de litige, les tribunaux suisses seront seuls
                competents.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
