# SQLite CLI - Guide Rapide

## Ouvrir une base de données

```bash
sqlite3 glpi.db
```

## Afficher l'aide

```sql
.help
```

## Afficher les bases de données

```sql
.databases
```

## Lister les tables

```sql
.tables
```

## Afficher la structure d'une table

```sql
.schema nom_table
```

Exemple :

```sql
.schema glpi_users
```

Ou :

```sql
PRAGMA table_info(glpi_users);
```

## Afficher les données

Afficher toutes les lignes :

```sql
SELECT * FROM glpi_users;
```

Afficher les 10 premières lignes :

```sql
SELECT * FROM glpi_users LIMIT 10;
```

## Compter les enregistrements

```sql
SELECT COUNT(*) FROM glpi_users;
```

## Rechercher des données

Recherche exacte :

```sql
SELECT * FROM glpi_users
WHERE name = 'glpi';
```

Recherche partielle :

```sql
SELECT * FROM glpi_users
WHERE name LIKE '%glpi%';
```

## Trier les résultats

Ordre croissant :

```sql
SELECT * FROM glpi_users
ORDER BY id ASC;
```

Ordre décroissant :

```sql
SELECT * FROM glpi_users
ORDER BY id DESC;
```

## Insérer des données

```sql
INSERT INTO glpi_users (name)
VALUES ('test');
```

## Modifier des données

```sql
UPDATE glpi_users
SET name = 'nouveau_nom'
WHERE id = 1;
```

## Supprimer des données

```sql
DELETE FROM glpi_users
WHERE id = 1;
```

## Créer une table

```sql
CREATE TABLE utilisateur (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT
);
```

## Affichage formaté

Afficher les colonnes :

```sql
.mode column
.headers on
```

Exemple :

```sql
.mode column
.headers on
SELECT * FROM glpi_users LIMIT 5;
```

## Exporter vers un CSV

```sql
.mode csv
.output utilisateurs.csv
SELECT * FROM glpi_users;
.output stdout
```

## Importer un CSV

```sql
.mode csv
.import utilisateurs.csv glpi_users
```

## Quitter SQLite

```sql
.quit
```

ou

```sql
.exit
```

## Commandes utiles pour explorer une base GLPI

```sql
.tables
.schema glpi_users
SELECT COUNT(*) FROM glpi_users;
SELECT * FROM glpi_users LIMIT 10;
```
