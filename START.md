# Volvo Customer Portal — commencer ici

État documentaire consolidé le **25 septembre 2026**. Le portail est développé et déjà publié ; il ne s’agit plus d’une phase d’initialisation.

Objectif : démonstration Volvo avec le compte VTEX `volvoemea` et WanderGarage, dans un portail indépendant. Les données commerce viennent de VTEX ; la flotte et les alertes restent des fixtures. Le site emeafaststore sert de référence d’intégration, sans imposer son interface.

## Lecture recommandée

1. [CLAUDE.md](CLAUDE.md) — état de reprise, limites et prochaine action en une lecture.
2. [README.md](README.md) — démarrage, configuration, vérification et déploiement.
3. [Plan global](docs/CADRAGE_PORTAIL_VOLVO.md) — périmètre et ordre des travaux.
4. [Script de démo](docs/DEMO-VOLVO.md) — parcours à présenter et recette courte.
5. [Matrice des capacités](docs/MATRICE_CAPACITES_VOLVO.md) — réalisé, démontré, simulé, ouvert.

[Coordination](docs/COORDINATION.md), [décisions](docs/DECISIONS_PORTAIL_VOLVO.md), [sources techniques](docs/SOURCES_PARCOURS.md) et [suivi des preuves](docs/SUIVI_REALISATION.md) complètent ces documents.

## Local et production

- Local de travail : http://127.0.0.1:3001/login ; commande exacte dans README.
- Production : https://customer-portal-volvo.vercel.app/login.
- GitHub : https://github.com/Willjeanne/customer-portal-volvo.
- Dernière publication confirmée dans le suivi : `2146772`. Purchasing Insights, les nouveaux Returns & Claims, l’espacement Lists et les statuts anglais sont encore locaux. L’état distant n’a pas été réinterrogé lors de cette mise à jour documentaire.

## Règles de travail

Conserver le design convenu et l’IA du collègue CX. Travailler par lots ciblés, regrouper les contrôles utiles et laisser la recette des parcours à William. Documenter les limites sans déclarer une fonction validée sur la seule présence de code. My Organization et sa recette avancée sont reportés après la démo Volvo. Les devis restent ouverts ; le checkout Promissory a, lui, produit une commande réelle confirmée par William.

Les sources Volvo dans [docs/context](docs/context/) et le [pack Design](Design/README.md) décrivent les besoins et les références visuelles, pas la couverture livrée. Les anciens bilans sont conservés dans [les archives](docs/archive/README.md), sans faire autorité sur l’état courant. Les instructions utilisateur courantes priment.
