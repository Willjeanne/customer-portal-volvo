/**
 * ⚠️  ÉCRIT PAR CLAUDE — lot « find parts », 20/09/2026.
 *     À RELIRE AVANT INTÉGRATION. Voir docs/HANDOFF-FLOTTE.md.
 *
 * Porté depuis faststore-volvoemea/src/utils/volvoModels.ts, commentaires
 * d'origine conservés : ils documentent des défauts de données réels, mesurés
 * sur le catalogue, et il serait dommage de les perdre au passage.
 */

/** Les séparateurs qui trahissent une étiquette composée. */
const COMPOUND = /[/\\,()]/;

/**
 * Le champ `Application` mêle de vrais modèles et des **étiquettes composées** —
 * « FH13 / FM11 / FM13 », « FH13 \ FM13 », « FH 16, FH 420, FH 460 » — résidus de
 * l'import : 35 entrées sur 80, plus une valeur de test (« Teste ») et deux
 * doublons `FH/FM`. Elles ne désignent aucun modèle sélectionnable.
 *
 * On les masque **à l'affichage** plutôt que de réécrire le catalogue. Le coût est
 * le même dans les deux cas et il est assumé : environ 112 produits (6 %) restent
 * hors du chemin guidé — ils restent atteignables par la recherche texte.
 */
export function isPresentableModel(label: string): boolean {
  return label.trim() !== "" && !COMPOUND.test(label);
}

/**
 * Famille d'affichage déduite du **nom du modèle**, jamais de la catégorie.
 *
 * 175 produits portent une catégorie qui contredit leurs modèles déclarés — des
 * pièces rangées sous Trucks dont l'unique modèle est un autobus. Filtrer sur
 * `category-1` donnerait donc de mauvaises réponses. Le nom du modèle, lui, ne
 * ment pas : on s'en sert pour **regrouper** la liste, jamais pour filtrer.
 */
export function modelFamily(label: string): "Trucks" | "Buses" {
  return /^B\d/.test(label.trim()) ? "Buses" : "Trucks";
}
