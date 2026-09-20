# Volvo Customer Portal — commencer ici

Mis à jour le 20 septembre 2026 après la revue de code et l’ajustement de méthode.

**Phase actuelle : démarrage de la réalisation locale autorisé par William le 18 septembre 2026.** Initialisation, code et vérifications locales sont autorisés. GitHub cible : `Willjeanne/customer-portal-volvo`. Déploiement Vercel prévu après les validations locales ; aucune publication réalisée. Les anciennes mentions « documentation uniquement » décrivent la phase précédente et sont remplacées par cette autorisation. Les changements métier/configuration du compte VTEX restent hors de ce démarrage.

Lire [CLAUDE.md](CLAUDE.md) pour comprendre en une lecture l’avancement, les difficultés et la prochaine reprise ; [README.md](README.md) pour lancer le portail ; [le suivi de réalisation](docs/SUIVI_REALISATION.md) pour les preuves techniques détaillées.

L’objectif est de démontrer les use cases Volvo avec VTEX et du code custom dans une interface Volvo indépendante du site existant. Compte : `volvoemea`. Organisation de démonstration : WanderGarage. Le site existant reste une référence en lecture seule et conserve le parcours anonyme avec guest checkout. Le checkout est une dépendance partagée : ne pas reprendre son diagnostic.

## Documents actifs

1. [Cadrage et plan de réalisation](docs/CADRAGE_PORTAIL_VOLVO.md) : périmètre, architecture, navigation canonique, parcours et tranches.
2. [Matrice des capacités](docs/MATRICE_CAPACITES_VOLVO.md) : fonctions My Account et Volvo, services, preuves et points à vérifier au fil de la réalisation.
3. [Registre des décisions](docs/DECISIONS_PORTAIL_VOLVO.md) : décisions confirmées, direction technique et limites de l’autorisation actuelle.

## Références

- [Démarrage historique](docs/VOLVO_CUSTOMER_PORTAL_START.md) : provenance, structure et identifiants WanderGarage, relevés datés. Ne pas interpréter ces relevés comme l’état courant du compte.
- [Besoins Volvo](docs/context/VOLVO_USE_CASES_AS_REQUESTED.md) et [scope source](docs/context/Volvo_Customer_Portal_Demo_Feature_Scope.md).
- [Pack design](Design/README.md) : visuels et tokens provisoires. Sa copie du scope est un snapshot ; le cadrage actif résout les différences de navigation, noms, montants et comportements.

Les instructions courantes de William priment, puis les documents actifs pour les décisions projet. Préserver les sources historiques sans entretenir plusieurs spécifications concurrentes.

## Règles pour la suite

La section 6 du cadrage décrit l’ordre opérationnel actualisé : confirmer les sources du prochain lot, terminer préparation/panier, puis commandes/devis, entreprise, Volvo et publication. William assure la recette manuelle ; l’agent regroupe les contrôles automatiques et limite le navigateur aux diagnostics ciblés.

- Aucune fonction My Account prévue n’est retirée : commandes, reordering, quick order/import, listes, devis, organisation, droits, adresses, paiements, budgets, approbations, comptabilité et profil.
- Réutiliser les services VTEX ; compléter par une extension custom ciblée si nécessaire. Ne pas réduire automatiquement une fonction à un storyboard faute d’API native.
- Direction privilégiée : Next.js/React/TypeScript avec BFF ; Vercel proposé. La première vérification technique portera sur session, contexte et permissions, après autorisation de réalisation.
- Conserver les preuves réelles et les fixtures distinctes, sans exiger une qualification exhaustive avant chaque progrès.
- Ni date d’atelier ni matrice exhaustive des questions Volvo ne bloquent le démarrage. Traiter les choix courants et corrections visuelles dans leur tranche.
- Soumettre à William seulement les retraits ou réductions nommés, changements de périmètre et blocages concrets nécessitant une décision.
- Appliquer les skills William et VTEX pertinents. Aucun secret dans la documentation, le code ou les fixtures.
