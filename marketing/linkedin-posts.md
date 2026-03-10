# GrabSpec — Calendrier LinkedIn (8 posts = 1 mois, 2x/semaine)

---

## POST 1 — Lancement (Semaine 1, Mardi)
**Type : Texte + Image (screenshot de l'app)**

Vous passez combien de temps à chercher des fiches techniques produit ?

J'ai chronométré. En moyenne, un BIM Manager passe 45 minutes par jour à chercher manuellement des photos, PDFs et specs de produits de construction.

45 minutes x 220 jours = 165 heures par an. Perdues.

C'est pour ça que j'ai créé GrabSpec.

Vous collez votre liste de produits. L'IA retrouve instantanément :
→ La photo HD du fabricant
→ La fiche technique PDF officielle
→ Les spécifications complètes (dimensions, matériaux, débit, pression...)

J'ai testé sur 20 produits (Grohe, Schneider, Hansgrohe, Daikin, Velux, Hilti...) :
• 100% trouvés
• 95% avec photo HD
• 80% avec fiche technique PDF

Gratuit : 3 recherches/jour.
Pro : recherches illimitées pour CHF 9.90/mois.

Testez par vous-même → https://grabspec.vercel.app

#BIM #Construction #FicheTechnique #Architecture #IngenierieBuilding #PropTech #SaaS #Productivité

---

## POST 2 — Démonstration (Semaine 1, Vendredi)
**Type : Vidéo ou GIF (screen recording de 30 sec)**

"Schneider Electric iC60N C16"

6 secondes. C'est le temps qu'il faut à GrabSpec pour trouver :
✓ Nom complet : Acti9 iC60N - Disjoncteur 2P 16A Courbe C
✓ Photo HD officielle
✓ Fiche technique PDF (téléchargeable)
✓ Specs : 400Vca, 6000A/10kA

Le tout uploadé dans votre bibliothèque, prêt à exporter en ZIP.

Combien de temps vous mettez à faire ça manuellement ? 5 min ? 10 min ?

Multipliez par 200 produits sur un projet...

→ https://grabspec.vercel.app

#Electricité #SchneiderElectric #BIM #Construction #Automatisation

---

## POST 3 — Pain point (Semaine 2, Mardi)
**Type : Texte seul (storytelling)**

"Tu peux me retrouver la fiche technique du Grohe 33265003 ?"

Cette phrase, je l'ai entendue 1000 fois en bureau d'études.

Et à chaque fois, c'est le même rituel :
1. Ouvrir Google
2. Taper la référence
3. Naviguer sur 3-4 sites différents
4. Trouver la bonne page produit
5. Télécharger le PDF (s'il existe)
6. Chercher une photo correcte
7. Renommer le fichier selon la nomenclature du projet
8. Ranger dans le bon dossier

x 200 produits par projet.
x 10 projets par an.

Ce workflow n'a pas changé depuis 20 ans.

Jusqu'à maintenant.

GrabSpec fait les étapes 1 à 8 en une seule action.

→ https://grabspec.vercel.app

#BureauDetudes #Ingenierie #Construction #Productivité #Innovation

---

## POST 4 — Social proof / Résultats (Semaine 2, Vendredi)
**Type : Image (tableau de résultats)**

J'ai testé GrabSpec sur les 20 produits les plus courants en CVC, électricité et plomberie.

Résultats :

| Produit | Trouvé | Photo | PDF |
|---------|--------|-------|-----|
| Grohe 33265003 | ✅ | ✅ | ✅ |
| Geberit Sigma 50 | ✅ | ✅ | ✅ |
| Schneider iC60N C16 | ✅ | ✅ | ✅ |
| Daikin FTXM35R | ✅ | ❌ | ✅ |
| Velux GGL MK04 | ✅ | ✅ | ✅ |
| Hilti HIT-HY 200-A | ✅ | ✅ | ❌ |
| Sika SikaFlex 11FC | ✅ | ✅ | ✅ |
| ... | | | |

Taux de réussite global :
• 100% des produits identifiés
• 95% avec photo HD
• 80% avec fiche technique PDF

Le tout en moins de 30 secondes pour les 20 produits.

Essayez avec VOS produits → https://grabspec.vercel.app

#CVC #Plomberie #Electricité #BIM #FicheTechnique

---

## POST 5 — Feature highlight : Convertisseur (Semaine 3, Mardi)
**Type : Image (avant/après)**

Bonus gratuit dans GrabSpec : un convertisseur PDF ↔ Word.

Vous recevez une fiche technique en Word et vous avez besoin d'un PDF propre ?
Ou l'inverse ?

→ Glissez votre fichier
→ Conversion en 3 secondes
→ Qualité professionnelle (mise en page préservée)

100% gratuit. Pas de limite. Pas d'inscription.

On utilise Chromium en headless pour un rendu identique à l'impression.
Pas de conversion approximative — du vrai rendu navigateur.

→ https://grabspec.vercel.app/fr/converter

#PDF #Word #Convertisseur #Gratuit #Productivité #BTP

---

## POST 6 — Behind the scenes / Tech (Semaine 3, Vendredi)
**Type : Texte + Image (architecture diagram)**

Comment GrabSpec retrouve une fiche technique en 6 secondes ?

Voici ce qui se passe quand vous tapez "Grohe 33265003" :

1️⃣ Recherche multi-moteur (Google via Serper.dev)
   → 6 résultats web + images en parallèle

2️⃣ Scraping intelligent des pages trouvées
   → Extraction du contenu texte des 3 meilleures pages

3️⃣ IA Claude (Anthropic) analyse tout le contexte
   → Identifie : nom complet, fabricant, référence, catégorie
   → Trouve : URL photo HD + URL fiche technique PDF
   → Extrait : specs techniques (dimensions, débit, matériaux...)

4️⃣ Upload automatique sur le cloud
   → Photo + PDF sauvegardés, prêts à télécharger

Le tout en une seule requête API.

Stack : Next.js + Claude Haiku + Serper + Vercel

→ https://grabspec.vercel.app

#Tech #IA #Claude #Anthropic #NextJS #PropTech #Construction

---

## POST 7 — Use case Facility Manager (Semaine 4, Mardi)
**Type : Texte + Image**

Facility Managers : vous gérez combien de références produit ?

500 ? 1000 ? 5000 ?

Chaque produit a besoin de :
- Une photo pour l'inventaire visuel
- Une fiche technique pour la maintenance
- Les specs pour les commandes de remplacement

Avec GrabSpec, vous collez votre liste de références et vous récupérez tout en un clic.

Export en ZIP avec nomenclature personnalisable :
{BATIMENT}_{ETAGE}_{FABRICANT}_{REF}_{TYPE}

Plus besoin de parcourir 50 sites fabricants différents.

3 recherches gratuites par jour pour tester.

→ https://grabspec.vercel.app

#FacilityManagement #CAFM #Maintenance #GestionTechnique #Immobilier

---

## POST 8 — CTA / Offre (Semaine 4, Vendredi)
**Type : Image (pricing card)**

GrabSpec est en ligne. Voici les offres :

🆓 Gratuit
• 3 recherches/jour
• Convertisseur PDF/Word illimité
• Bibliothèque locale

⭐ Pro — CHF 9.90/mois
• Recherches illimitées
• Export Excel + ZIP
• Bibliothèque projets complète

🏢 Business — CHF 29.90/mois
• Tout Pro inclus
• Convertisseur prioritaire
• Support dédié

Pas de compte à créer. Pas de carte bancaire pour le gratuit.
Vous arrivez, vous cherchez, c'est fait.

→ https://grabspec.vercel.app/fr/pricing

Qui dans votre équipe perd du temps à chercher des fiches techniques ?
Taguez-le en commentaire 👇

#SaaS #Construction #BIM #Architecture #Pricing #Startup
