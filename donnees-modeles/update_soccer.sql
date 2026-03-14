UPDATE public.models
SET
  description = 'Variante du SCORE qui remplace la notion de cause par deux types de conditions (initiales et de maintien), passant d''un paradigme de causalité linéaire à un paradigme systémique autopoïétique. Réorganise l''ordre des lettres dans un sens naturel pour les interventions.',
  tags = ARRAY['SCORE', 'systémique', 'conditions', 'Bateson', 'autopoïèse', 'changement'],
  complexity = 'avancé',
  sections = '{
    "structure": "Le SOCCER remplace le C (Cause) du SCORE par deux types de conditions :\n\n• Conditions Initiales (Ci) : ce qui amène le système dans l''état problème\n• Conditions de Maintien (Cm) : ce qui permet au système de s''y maintenir (homéostasie)\n\nLes Ci et Cm sont souvent différentes. Si les conditions de maintien disparaissent, le système ne reste pas dans l''état problème. Si les conditions initiales ne sont pas remplies, le système n''y entre pas.\n\nCe passage de la cause aux conditions opère un changement de paradigme : de la causalité linéaire (niveau d''apprentissage 1 de Bateson) vers un paradigme systémique autopoïétique (niveau 2) qui ramène la capacité de changement au sein du système lui-même.",
    "protocol": "L''ordre des lettres suit une progression naturelle pour l''intervention :\n\n1. S — Symptôme : Quel est le problème ? Où ça fait mal ?\n2. O — Objectif : Que voulez-vous à la place ? (direction du changement)\n3. C — Conditions Initiales : Quelles conditions ont amené ce problème ?\n4. C — Conditions de Maintien : Qu''est-ce qui maintient le système dans cet état ?\n5. E — Effets : Quels effets le changement produira-t-il ?\n6. R — Ressources : De quoi avez-vous besoin pour changer ?\n\nContrairement au SCORE, on embraye immédiatement sur l''objectif après le symptôme plutôt que de creuser dans le négatif.",
    "prerequisites": "Connaissance du modèle SCORE. Notions de systémique et d''homéostasie. Familiarité avec les niveaux d''apprentissage de Gregory Bateson."
  }'::jsonb
WHERE id = 'b4506532-0f8d-45b3-9b14-785aa5753a1b';
