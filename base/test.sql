-- =========================
-- 1. UTILISATEURS
-- =========================
INSERT INTO glpi_users (name, password, password_last_update)
VALUES
('jean', '', NOW()),
('marc', '', NOW());

-- =========================
-- 2. ORDINATEUR
-- =========================
INSERT INTO glpi_computers (name, entities_id, is_recursive, date_mod)
VALUES ('PC-002', 0, 0, NOW());

-- =========================
-- 3. TICKET
-- =========================
INSERT INTO glpi_tickets
(name, content, status, entities_id, date_creation, date_mod)
VALUES
('Impossible d''imprimer',
'L''imprimante du bureau ne repond plus',
1, 0, NOW(), NOW());

-- =========================
-- 4. LIER DEMANDEUR (JEAN = type 1)
-- =========================
INSERT INTO glpi_tickets_users
(tickets_id, users_id, type)
VALUES
(2, 8, 1);

-- =========================
-- 5. ASSIGNER TECHNICIEN (MARC = type 3)
-- =========================
INSERT INTO glpi_tickets_users
(tickets_id, users_id, type)
VALUES
(2, 9, 3);

-- =========================
-- 6. SUIVI (FOLLOWUP)
-- =========================
INSERT INTO glpi_itilfollowups
(items_id, itemtype, users_id, content, date, date_mod)
VALUES
(2, 'Ticket', 9, 'Je vais verifier le pilote de l imprimante.', NOW(), NOW());

-- =========================
-- 7. TACHE (TASK)
-- =========================
INSERT INTO glpi_tickettasks
(tickets_id, users_id, content, actiontime, date, state)
VALUES
(2, 9, 'Reinstaller le pilote de l imprimante', 1800, NOW(), 1);

-- =========================
-- 8. SECOND SUIVI
-- =========================
INSERT INTO glpi_itilfollowups
(items_id, itemtype, users_id, content, date, date_mod)
VALUES
(2, 'Ticket', 9, 'Le pilote a ete reinstalle avec succes.', NOW(), NOW());

-- =========================
-- 9. RESOLUTION DU TICKET
-- =========================
UPDATE glpi_tickets
SET
status = 5,
solution = 'Probleme resolu apres reinstallation du pilote',
solvedate = NOW()
WHERE id = 2;

-- =========================
-- 10. CLOTURE DU TICKET
-- =========================
UPDATE glpi_tickets
SET
status = 6,
closedate = NOW()
WHERE id = 1;



---------------------------
-- =====================================================
-- 1. FOURNISSEUR
-- =====================================================
INSERT INTO glpi_suppliers (name, address)
VALUES ('Dell Madagascar', 'Antananarivo');

-- =====================================================
-- 2. CONTRAT
-- =====================================================
INSERT INTO glpi_contracts
(name, num, suppliers_id, begin_date, end_date, cost)
VALUES
('Contrat Maintenance PC', 'CT-001', 1, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 500);

-- =====================================================
-- 3. BUDGET
-- =====================================================
INSERT INTO glpi_budgets
(name, value, begin_date, end_date)
VALUES
('Budget IT 2026', 10000, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR));

-- =====================================================
-- 4. ORDINATEUR (ASSET)
-- =====================================================
INSERT INTO glpi_computers
(name, entities_id, is_recursive, date_mod)
VALUES ('PC-001', 0, 0, NOW());

-- =====================================================
-- 5. LIAISON PC ↔ CONTRAT
-- =====================================================
INSERT INTO glpi_contracts_items
(contracts_id, items_id, itemtype)
VALUES
(1, 3, 'Computer');

-- =====================================================
-- 6. LICENCE LOGICIEL
-- =====================================================
INSERT INTO glpi_softwares (name)
VALUES ('Windows 11');

INSERT INTO glpi_softwarelicenses
(softwares_id, name, number)
VALUES
(1, 'Windows 11 Licence', 1);

-- =====================================================
-- 7. UTILISATEURS
-- =====================================================
INSERT INTO glpi_users (name, password)
VALUES ('jean', ''), ('marc', '');

-- =====================================================
-- 8. AFFECTATION PC ↔ UTILISATEUR
-- =====================================================
INSERT INTO glpi_computers_users
(computers_id, users_id)
VALUES (1, 1);

-- =====================================================
-- 9. TICKET
-- =====================================================
INSERT INTO glpi_tickets
(name, content, status, entities_id, date_creation, date_mod)
VALUES
('PC en panne', 'Le PC ne demarre plus', 1, 0, NOW(), NOW());

-- =====================================================
-- 10. LIER TICKET ↔ UTILISATEUR
-- =====================================================
INSERT INTO glpi_tickets_users
(tickets_id, users_id, type)
VALUES
(1, 1, 1);

-- =====================================================
-- 11. SUIVI
-- =====================================================
INSERT INTO glpi_itilfollowups
(items_id, itemtype, users_id, content, date, date_mod)
VALUES
(1, 'Ticket', 2, 'Diagnostic en cours', NOW(), NOW());

-- =====================================================
-- 12. TACHE
-- =====================================================
INSERT INTO glpi_tickettasks
(tickets_id, users_id, content, actiontime, date, state)
VALUES
(1, 2, 'Verifier alimentation PC', 900, NOW(), 1);

-- =====================================================
-- 13. RESOLUTION
-- =====================================================
UPDATE glpi_tickets
SET status = 5,
solution = 'Alimentation remplacee',
solvedate = NOW()
WHERE id = 1;

-- =====================================================
-- 14. CLOTURE
-- =====================================================
UPDATE glpi_tickets
SET status = 6,
closedate = NOW()
WHERE id = 1;