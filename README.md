# 🏦 STB Digital Hub

![Angular](https://img.shields.io/badge/Frontend-Angular-red)
![.NET](https://img.shields.io/badge/Backend-ASP.NET%20Core-blue)
![SQL Server](https://img.shields.io/badge/Database-SQL%20Server-lightgrey)
![Status](https://img.shields.io/badge/Status-In%20Progress-yellow)
![Project](https://img.shields.io/badge/Type-Stage%20Project-green)

## 📌 Description

**STB Digital Hub** est une plateforme web bancaire destinée aux clients de la **STB Bank**.  
Elle a pour objectif de regrouper plusieurs services digitaux dans une seule interface moderne, simple et sécurisée.

La plateforme permet au client d’accéder aux principaux services liés aux cartes bancaires, à l’épargne, aux crédits et aux transferts, sans avoir besoin d’utiliser plusieurs applications séparées.

---

## 🎯 Objectif du projet

L’objectif principal de ce projet est de concevoir et développer une solution web unifiée orientée **front-office client**.

Cette plateforme permet de centraliser les services suivants :

- 💳 **DigiCarte**
- 🐷 **DigiEpargne**
- 💰 **DigiCrédit**
- 🔁 **DigiTransfert**

Le projet est réalisé dans le cadre d’un stage d’été au sein de la **STB Bank**.

---

## ✨ Fonctionnalités principales

### 💳 Module DigiCarte

- Consulter les cartes bancaires du client.
- Afficher le statut de chaque carte.
- Consulter les plafonds de paiement et de retrait.
- Demander une augmentation temporaire du plafond.
- Bloquer ou débloquer une carte avec confirmation.

---

### 🐷 Module DigiEpargne

- Consulter le solde du compte épargne.
- Consulter l’historique des opérations.
- Effectuer un virement du compte courant vers le compte épargne.
- Configurer une règle d’épargne intelligente.
- Suivre l’évolution de l’épargne.

---

### 💰 Module DigiCrédit

- Simuler un crédit selon le montant, la durée et le revenu.
- Afficher le résultat estimé de la simulation.
- Consulter les demandes de crédit.
- Suivre l’état des demandes.
- Consulter les crédits en cours et les prochaines échéances.

---

### 🔁 Module DigiTransfert

- Créer un transfert vers un bénéficiaire.
- Saisir les informations du bénéficiaire.
- Simuler les frais avant validation.
- Suivre le statut des transferts.
- Consulter l’historique des transferts.
- Télécharger un reçu PDF après validation.

---

## 🛠️ Technologies utilisées

| Partie | Technologie |
|---|---|
| Frontend | Angular |
| Backend | ASP.NET Core Web API |
| Base de données | SQL Server |
| ORM | Entity Framework Core |
| Test API | Postman |
| Versioning | Git & GitHub |

---

## 🏗️ Architecture générale

```text
Angular Frontend
        |
        v
ASP.NET Core Web API
        |
        v
Entity Framework Core
        |
        v
SQL Server Database
