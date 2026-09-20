# Design QA — socle local Volvo

**Scope:** première tranche, shell et accueil ; les quatre autres écrans de référence ne sont pas déclarés réalisés.

**Source visual truth:** `Design/assets/screens/01-home-buyer.png` (1487 × 1058).

**Implementation evidence:** `artifacts/qa/home-desktop-raw.png`, `artifacts/qa/home-desktop.png`, `artifacts/qa/comparison.png`, `artifacts/qa/profile-mobile-raw.jpg`, `artifacts/qa/profile-mobile.png`.

**Viewports:** desktop 1487 × 1058, mobile 390 × 844 CSS px. DOM rapporte DPR 1. La capture IAB comporte un artefact de composition à demi-échelle dans le coin supérieur gauche ; les copies normalisées recadrent cette région et la remettent à l’échelle CSS. Les originaux sont conservés. Le jugement de finesse typographique au pixel reste limité par cet artefact ; aucune retouche de contenu n’a été effectuée. Capture desktop brute 1487 × 1119 ; mobile brute 390 × 902.

**State:** acheteur de démonstration, Dallas/Truck 147 sur l’accueil desktop ; Chicago/sans véhicule sur le profil mobile après changement de contexte. Noms, navigation canonique, absence de consigne de sécurité et marquage des fixtures sont des adaptations prévues dans le cadrage actif. Le contexte sans véhicule a aussi été vérifié.

## Findings and iteration history

- [P2 — corrigé] Barre de contexte mobile : débordement horizontal 411 px pour un viewport de 390 px. Remplacement du flex contraint par une grille explicite. Recontrôle DOM après correction : `scrollWidth === innerWidth === 390`. Capture du profil mobile après correction.
- [P2 — corrigé] Navigation mobile fermée : liens hors écran restaient accessibles au clavier. Ajout de `visibility: hidden` hors ouverture, focus sur le bouton de fermeture à l’ouverture, confinement du focus et Escape, contenu arrière `inert`. Snapshot après correction : navigation fermée absente ; menu ouvert exposé comme dialogue ; clic My Profile ferme le menu et affiche le bon contexte.
- Aucun P0/P1/P2 visuel restant identifié dans le périmètre du socle. L’accès VTEX réel et les fonctions des tranches suivantes ne sont pas couverts par ce résultat visuel.

## Required fidelity surfaces

- **Typography:** Inter locale, hiérarchie titre / sous-titre / tâches / informations secondaires conforme à la direction. Fallback Arial. Les informations secondaires sont volontairement plus compactes ; finesse exacte à recontrôler avec une capture sans artefact.
- **Spacing/layout:** rail gauche permanent desktop, barre de contexte, alerte horizontale et deux colonnes tâches/travail. Navigation 14 entrées selon rôle. Mobile : contenu en une colonne, navigation escamotable, contexte conservé, pas de débordement après correction.
- **Colors/tokens:** navy, bleu d’action, fonds clairs et bordures issus du pack. Alerte teintée et identifiée par texte/icône ; aucune information portée par la seule couleur.
- **Images:** wordmark fourni, camion illustratif généré, icônes Phosphor. Aucune image générée ne constitue une preuve de flotte réelle ou de fitment. Différence de cadrage du camion admise pour ce socle.
- **Copy/content:** WanderGarage remplace Acme ; véritables noms de fonctions du cadrage. Aucun faux compteur de données live, prix de devis ou succès externe. Fonctions suivantes présentées comme non implémentées.

**Full-view comparison:** source et accueil normalisé réunis dans `artifacts/qa/comparison.png`, ouverts ensemble pour la comparaison.

**Focused evidence:** contrôle spécifique barre de contexte mobile/profil, DOM et capture `profile-mobile.png`. Les éléments de la capture desktop composée restaient lisibles pour comparer alerte et panneaux ; zoom typographique exact limité par la capture IAB.

## Interactions and technical checks

- Connexion d’aperçu, navigation, consultation profil, changement Dallas → Chicago et effacement du véhicule vérifiés dans le navigateur.
- Ouverture menu mobile et navigation vers le profil vérifiées ; focus initial du bouton de fermeture constaté dans le snapshot.
- Aucun message de console error/warn relevé avant les dernières modifications visuelles.
- Tests HTTP couvrant les refus de portée/permissions, isolation des sessions et déconnexion réussis. Cela ne valide pas l’intégration VTEX.

## Follow-up polish

- [P3] Recontrôler les mesures de police et le rendu haute densité avec une capture IAB sans artefact.
- [P3] Revoir les espacements des libellés longs après enrichissement des prochaines rubriques.

## Implementation checklist

- [x] Corriger le débordement mobile et reprendre une capture.
- [x] Vérifier le menu, le contexte et le profil.
- [x] Préserver les différences demandées par le cadrage actif.
- [ ] Valider la connexion et les permissions VTEX réelles dans la tranche fonctionnelle.

final result: passed
