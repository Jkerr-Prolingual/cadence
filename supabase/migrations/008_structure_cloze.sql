-- Allow structure-based cloze flashcards alongside vocabulary cloze cards.
-- Grammar structure entries in the vocabulary manifest can generate cloze
-- cards keyed by EGP construct ID rather than a word lemma.
alter table srs_cards drop constraint if exists srs_cards_card_type_check;
alter table srs_cards add constraint srs_cards_card_type_check
  check (card_type in ('spanish', 'cloze', 'dual', 'definition', 'structure_cloze'));
