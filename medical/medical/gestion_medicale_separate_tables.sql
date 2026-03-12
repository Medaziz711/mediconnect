-- ============================================
-- GESTION MÉDICALE — BASE DE DONNÉES COMPLÈTE
-- ============================================
-- Tables SÉPARÉES : admins | patients | medecins | pharmaciens
-- + pharmacies, dossiers_medicaux, rendez_vous, consultations, ordonnances,
--   medicaments, ligne_ordonnances, stock_medicaments, paiements,
--   demandes_inscription, notifications
-- ============================================
-- Exécuter ce script dans MySQL/phpMyAdmin pour créer la base from scratch.
-- ============================================

DROP DATABASE IF EXISTS gestion_medicale;
CREATE DATABASE gestion_medicale
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE gestion_medicale;

-- ============================================
-- 1. TABLE ADMINS (standalone, login + profil)
-- ============================================
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
    niveau_acces INT DEFAULT 1
) ENGINE=InnoDB;

-- ============================================
-- 2. TABLE PATIENTS (standalone, peut s'inscrire seul → actif directement)
-- ============================================
CREATE TABLE patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    adresse TEXT,
    date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
    num_securite_sociale VARCHAR(50) UNIQUE,
    date_naissance DATE,
    groupe_sanguin VARCHAR(5),
    allergies TEXT,
    antecedents TEXT
) ENGINE=InnoDB;

-- ============================================
-- 3. TABLE MÉDECINS (standalone, inscription via admin → statut en_attente / actif / rejete)
-- ============================================
CREATE TABLE medecins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    adresse TEXT,
    date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
    statut ENUM('en_attente', 'actif', 'rejete') DEFAULT 'en_attente',
    specialite VARCHAR(100),
    numero_ordre VARCHAR(50) UNIQUE NOT NULL,
    horaires_dispo TEXT,
    jours_consultation TEXT,
    tarif_consultation FLOAT
) ENGINE=InnoDB;

-- ============================================
-- 4. TABLE PHARMACIENS (standalone, inscription via admin → statut en_attente / actif / rejete)
-- ============================================
CREATE TABLE pharmaciens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    adresse TEXT,
    date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
    statut ENUM('en_attente', 'actif', 'rejete') DEFAULT 'en_attente',
    numero_ordre VARCHAR(50) UNIQUE NOT NULL
) ENGINE=InnoDB;

-- ============================================
-- 5. TABLE PHARMACIES (liée au pharmacien)
-- ============================================
CREATE TABLE pharmacies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pharmacien_id INT NOT NULL,
    nom VARCHAR(150),
    adresse TEXT,
    telephone VARCHAR(20),
    horaires_ouverture TEXT,
    latitude FLOAT,
    longitude FLOAT,
    ouvert_24h BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (pharmacien_id) REFERENCES pharmaciens(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- 6. TABLE DOSSIERS MÉDICAUX (patient)
-- ============================================
CREATE TABLE dossiers_medicaux (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    antecedents_medicaux TEXT,
    antecedents_familiaux TEXT,
    allergies TEXT,
    taille FLOAT,
    poids FLOAT,
    groupe_sanguin VARCHAR(5),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- 7. TABLE RENDEZ-VOUS
-- ============================================
CREATE TABLE rendez_vous (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    medecin_id INT NOT NULL,
    date_heure DATETIME NOT NULL,
    duree INT,
    motif TEXT,
    statut ENUM('confirme', 'annule', 'en_attente', 'termine') DEFAULT 'en_attente',
    salle VARCHAR(50),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (medecin_id) REFERENCES medecins(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- 8. TABLE CONSULTATIONS
-- ============================================
CREATE TABLE consultations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rendez_vous_id INT UNIQUE NOT NULL,
    dossier_medical_id INT NOT NULL,
    date_consultation DATETIME,
    motif TEXT,
    symptomes TEXT,
    diagnostic TEXT,
    notes_privees TEXT,
    recommandations TEXT,
    FOREIGN KEY (rendez_vous_id) REFERENCES rendez_vous(id) ON DELETE CASCADE,
    FOREIGN KEY (dossier_medical_id) REFERENCES dossiers_medicaux(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- 9. TABLE ORDONNANCES
-- ============================================
CREATE TABLE ordonnances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consultation_id INT NOT NULL,
    date_emission DATE,
    date_expiration DATE,
    renouvelable BOOLEAN DEFAULT FALSE,
    statut ENUM('validee', 'servie', 'annulee') DEFAULT 'validee',
    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- 10. TABLE MÉDICAMENTS
-- ============================================
CREATE TABLE medicaments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100),
    nom_commercial VARCHAR(100),
    dci VARCHAR(100),
    forme VARCHAR(50),
    dosage VARCHAR(50),
    fabricant VARCHAR(100),
    generique BOOLEAN,
    contre_indications TEXT
) ENGINE=InnoDB;

-- ============================================
-- 11. TABLE LIGNE ORDONNANCES
-- ============================================
CREATE TABLE ligne_ordonnances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ordonnance_id INT NOT NULL,
    medicament_id INT NOT NULL,
    posologie VARCHAR(255),
    duree_traitement INT,
    instructions TEXT,
    FOREIGN KEY (ordonnance_id) REFERENCES ordonnances(id) ON DELETE CASCADE,
    FOREIGN KEY (medicament_id) REFERENCES medicaments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- 12. TABLE STOCK MÉDICAMENTS (par pharmacie)
-- ============================================
CREATE TABLE stock_medicaments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pharmacie_id INT NOT NULL,
    medicament_id INT NOT NULL,
    quantite_disponible INT DEFAULT 0,
    seuil_alerte INT DEFAULT 10,
    date_peremption DATE,
    prix_unitaire FLOAT,
    emplacement VARCHAR(100),
    FOREIGN KEY (pharmacie_id) REFERENCES pharmacies(id) ON DELETE CASCADE,
    FOREIGN KEY (medicament_id) REFERENCES medicaments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- 13. TABLE PAIEMENTS
-- ============================================
CREATE TABLE paiements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consultation_id INT NOT NULL,
    montant FLOAT,
    methode_paiement VARCHAR(50),
    date_paiement DATETIME,
    statut ENUM('paye', 'en_attente') DEFAULT 'en_attente',
    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- 14. DEMANDES D'INSCRIPTION (médecins et pharmaciens — admin accepte/rejette, puis email Gmail)
-- Une ligne = une demande médecin OU pharmacien (medecin_id ou pharmacien_id renseigné)
-- ============================================
CREATE TABLE demandes_inscription (
    id INT AUTO_INCREMENT PRIMARY KEY,
    medecin_id INT NULL,
    pharmacien_id INT NULL,
    date_demande DATETIME DEFAULT CURRENT_TIMESTAMP,
    admin_id INT NULL,
    date_traitement DATETIME NULL,
    statut ENUM('en_attente', 'acceptee', 'rejetee') DEFAULT 'en_attente',
    motif_rejet TEXT NULL,
    email_acceptation_envoye BOOLEAN DEFAULT FALSE,
    date_email_envoye DATETIME NULL,
    FOREIGN KEY (medecin_id) REFERENCES medecins(id) ON DELETE CASCADE,
    FOREIGN KEY (pharmacien_id) REFERENCES pharmaciens(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================
-- 15. NOTIFICATIONS (par rôle : patient, médecin, pharmacien — admin optionnel)
-- Un seul des id est renseigné selon le destinataire.
-- ============================================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NULL,
    medecin_id INT NULL,
    pharmacien_id INT NULL,
    type VARCHAR(50),
    message TEXT,
    date_envoi DATETIME DEFAULT CURRENT_TIMESTAMP,
    lu BOOLEAN DEFAULT FALSE,
    email_envoye BOOLEAN DEFAULT FALSE,
    date_email_envoye DATETIME NULL,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (medecin_id) REFERENCES medecins(id) ON DELETE CASCADE,
    FOREIGN KEY (pharmacien_id) REFERENCES pharmaciens(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- 16. NOTIFICATIONS DEMANDE MÉDICAMENT (patient / médecin)
-- ============================================
CREATE TABLE IF NOT EXISTS medicine_request_notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    medicine_name VARCHAR(255) NOT NULL,
    patient_id INT NOT NULL,
    medecin_id INT NULL,
    message VARCHAR(1000),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (medecin_id) REFERENCES medecins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================
-- Compte ADMIN par défaut
-- Email: admin@gestion-medicale.com  |  Mot de passe: password
-- ============================================
INSERT INTO admins (nom, prenom, email, mot_de_passe, niveau_acces)
VALUES ('Admin', 'Système', 'admin@gestion-medicale.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1);
