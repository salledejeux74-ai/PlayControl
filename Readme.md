PlayControl – Cahier des charges 
 
1.	Vision du projet 
PlayControl est une plateforme professionnelle de gestion de salles de jeux vidéo conçue pour automatiser les opérations quotidiennes, sécuriser les revenus et offrir une expérience moderne aux clients. 
Le système permet également au propriétaire du logiciel de superviser, contrôler et commercialiser la solution auprès de plusieurs établissements via une architecture centralisée, sécurisée et évolutive. 
 
2.	Architecture générale du système 
PlayControl repose sur une architecture multi-salles où chaque établissement est totalement isolé tout en étant supervisé par un Super Administrateur central. 
Le système inclut : 
•	Une application desktop (poste de gestion) 
•	Un backend central sécurisé 
•	Une base de données multi-tenant 
•	Une interface de supervision distante 
•	Une gestion avancée des licences 
 
3.	Acteurs du système et responsabilités 
3.1	Super Administrateur (Propriétaire du logiciel) 
Le Super Administrateur est l’acteur central du système avec un contrôle global sur toutes les salles. 
Fonctionnalités : 
•	Accès à toutes les salles enregistrées 
•	Supervision en temps réel des revenus de chaque salle 
•	Consultation des statistiques globales 
•	Gestion des licences logicielles 
•	Activation et désactivation des salles 
•	Création et suppression des administrateurs de salle 
•	Consultation des journaux d’activité 
Accès distant sécurisé 
•	Gestion des mises à jour du système 
•	Suivi des performances globales (revenus, sessions, activité) 
 
3.2	Administrateur de salle 
Chaque salle de jeux dispose de son propre administrateur. 
Fonctionnalités : 
•	Gestion des employés de la salle 
•	Gestion des postes de jeux 
•	Configuration des tarifs 
•	Gestion des comptes clients (generation identifiant de connexion)
•	Consultation des revenus de la salle 
•	Accès aux rapports locaux 
•	Gestion opérationnelle quotidienne 
Restrictions : 
•	Aucun accès aux autres salles 
•	Aucun accès aux paramètres du Super Administrateur 
 
3.3	Employé / Caissier 
Acteur opérationnel chargé de l’exécution des tâches quotidiennes. 
Fonctionnalités : 
•	Création des sessions de jeu 
•	Encaissement des paiements 
•	Attribution des postes aux clients 
•	Gestion des comptes clients (generation identifiant de connexion)
Restrictions : 
•	Aucun accès aux rapports globaux 
•	Aucun accès aux paramètres système 
•	Accès limité aux données financières 
 
4.	Fonctionnalités communes du système 
Ces fonctionnalités sont utilisées par plusieurs acteurs selon leurs permissions. 
Gestion des comptes clients : 
•	Création de compte client 
•	Identifiant unique 
•	Mot de passe temporaire ou personnalisé 
•	Numéro de téléphone (optionnel) 
•	Email (optionnel) 
Expérience client : 
•	Connexion sécurisée 
•	Accès uniquement au poste attribué 
•	Consultation du temps restant 
•	Historique des sessions (optionnel) 
 
5.	Gestion des postes de jeux 
Fonctionnement : 
•	Attribution d’un poste par employé 
•	Association client ↔ poste 
•	Authentification obligatoire 
•	Lancement automatique de la session 
Règles : 
•	Un client = un seul poste actif 
•	Interdiction de connexion simultanée sur plusieurs postes 
 
6.	Gestion des abonnements clients 
Types de comptes : 
•	Compte standard (paiement à la session) 
•	Compte abonnement 
Formules : 
•	Journalier 
•	Hebdomadaire 
•	Mensuel 
•	VIP 
Automatisation : 
Déduction automatique du temps 
•	Blocage à expiration 
•	Contrôle des accès en temps réel 
 
7.	Gestion multi-salles 
Chaque salle est indépendante mais supervisée globalement. 
Données par salle : 
•	Nom de la salle 
•	Adresse 
•	Téléphone 
•	Propriétaire 
•	Nombre de postes 
•	Types de postes 
Caractéristiques : 
•	Isolation complète des données 
•	Administration indépendante 
•	Supervision centralisée 
 
8.	Tableau de bord propriétaire (Super Admin) 
Interface globale accessible à distance. 
Indicateurs : 
•	Nombre total de salles 
•	Chiffre d’affaires global 
•	Revenus par salle 
•	Nombre de sessions 
•	Clients actifs 
•	Taux d’occupation des postes 
•	Revenus journaliers et mensuels 
•	Sessions actives 
•	Temps moyen de jeu 
•	Activité des employés 
•	Alertes système 
•	État des licences 
 
9.	Gestion des licences logicielles 
Fonctionnalités : 
•	Génération de clé unique par salle 
•	Activation en ligne 
•	Date d’expiration configurable 
•	Suspension automatique 
•	Renouvellement des licences 
Objectif : 
Protéger le logiciel contre la copie illégale et contrôler la distribution commerciale. 
 
10.	Sécurité du système 
Mesures intégrées : 
•	Chiffrement des mots de passe 
•	Authentification sécurisée 
•	Journalisation des actions sensibles 
•	Sauvegardes automatiques 
•	Protection contre connexions frauduleuses 
•	Déconnexion automatique après inactivité 
 
11.	Notifications et alertes 
Système d’alerte en temps réel : 
•	Licence expirée ou proche expiration 
•	Poste hors service 
•	Connexion suspecte 
•	Échec de sauvegarde 
•	Anomalies de revenus 
 
12.	Sauvegarde et restauration 
Fonctionnalités : 
•	Sauvegarde automatique 
•	Sauvegarde manuelle 
•	Historique des sauvegardes 
Restauration complète du système 
 
13.	Rapports et exportation 
Formats disponibles : 
•	PDF 
•	Excel 
•	CSV 
Contenu : 
•	Revenus détaillés 
•	Activité des salles 
•	Comparaison multi-salles 
•	Statistiques globales 
 
14.	Supervision opérationnelle 
Vue technique globale du système : 
•	État des salles en temps réel 
•	Activité des postes 
•	Disponibilité réseau 
•	Consommation globale du système 
 
15.	Technologies recommandées 
Backend : 
•	Supabase Frontend : 
•	Electron + React 
Infrastructure : 
•	Docker 
•	CI/CD 
Sécurité : 
•	JWT + Refresh Token 
 
16.	Conclusion 
PlayControl est une plateforme évolutive conçue pour devenir une solution de référence dans la gestion des salles de jeux vidéo. Elle combine automatisation, sécurité, supervision centralisée et optimisation des revenus dans un système professionnel prêt pour une commercialisation multi-établissements. 
 
