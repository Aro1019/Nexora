-- Recherche full-text sur les pages.
-- Crée une fonction qui calcule un tsvector à partir de :
--   - titre (poids A)
--   - extrait + descriptionMeta (poids B)
--   - texte extrait du JSON contenu (poids C)
-- Et un trigger qui met à jour la colonne `recherche` à chaque INSERT/UPDATE.
--
-- Configuration de langue : "french" pour le stemming. À adapter selon le besoin.
-- À exécuter une seule fois après `prisma db push`.

-- 1) Fonction d'extraction du texte d'un bloc JSON (récursive)
CREATE OR REPLACE FUNCTION nexora_extraire_texte_blocs(blocs jsonb)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  bloc       jsonb;
  donnees    jsonb;
  resultat   text := '';
  cle        text;
  valeur     jsonb;
BEGIN
  IF blocs IS NULL OR jsonb_typeof(blocs) <> 'array' THEN
    RETURN '';
  END IF;

  FOR bloc IN SELECT * FROM jsonb_array_elements(blocs)
  LOOP
    donnees := bloc -> 'donnees';
    IF donnees IS NOT NULL AND jsonb_typeof(donnees) = 'object' THEN
      FOR cle, valeur IN SELECT * FROM jsonb_each(donnees)
      LOOP
        IF jsonb_typeof(valeur) = 'string' THEN
          -- Strip HTML tags basiques
          resultat := resultat || ' ' || regexp_replace(valeur #>> '{}', '<[^>]+>', ' ', 'g');
        END IF;
      END LOOP;
    END IF;

    -- Récursion pour les blocs imbriqués (ex: colonnes)
    IF (bloc -> 'enfants') IS NOT NULL AND jsonb_typeof(bloc -> 'enfants') = 'array' THEN
      resultat := resultat || ' ' || nexora_extraire_texte_blocs(bloc -> 'enfants');
    END IF;
  END LOOP;

  RETURN resultat;
END;
$$;

-- 2) Fonction qui calcule le tsvector pondéré
CREATE OR REPLACE FUNCTION nexora_calculer_recherche()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  config regconfig := 'french';
BEGIN
  -- Choix de la config selon la langue de la page
  IF NEW.langue LIKE 'en%' THEN config := 'english';
  ELSIF NEW.langue LIKE 'es%' THEN config := 'spanish';
  ELSIF NEW.langue LIKE 'de%' THEN config := 'german';
  ELSIF NEW.langue LIKE 'it%' THEN config := 'italian';
  ELSIF NEW.langue LIKE 'pt%' THEN config := 'portuguese';
  END IF;

  NEW.recherche :=
      setweight(to_tsvector(config, COALESCE(NEW.titre, '')), 'A')
   || setweight(to_tsvector(config, COALESCE(NEW."extrait", '')), 'B')
   || setweight(to_tsvector(config, COALESCE(NEW."descriptionMeta", '')), 'B')
   || setweight(to_tsvector(config, nexora_extraire_texte_blocs(NEW.contenu)), 'C');

  RETURN NEW;
END;
$$;

-- 3) Trigger
DROP TRIGGER IF EXISTS trg_page_recherche ON page;
CREATE TRIGGER trg_page_recherche
BEFORE INSERT OR UPDATE OF titre, extrait, "descriptionMeta", contenu, langue
ON page
FOR EACH ROW
EXECUTE FUNCTION nexora_calculer_recherche();

-- 4) Remplir la colonne pour les pages existantes
UPDATE page SET titre = titre;
