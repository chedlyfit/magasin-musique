# 🎵 Musique Magasin — Guide (100 % local, sur ton PC)

Application pour le magasin : **musique non-stop + annonce de fermeture
automatique + micro « parler »** par-dessus la musique.

- Le **PC** (Windows) fait tourner le serveur et **contient la musique**.
- L'**iPad** à la caisse ouvre l'interface par le **Wi-Fi du magasin** et sert
  d'écran + micro.
- **Rien en ligne.** Le code est juste sauvegardé sur GitHub.

---

## A) Installation sur le PC Windows (une seule fois)

1. **Installer Node.js** : va sur https://nodejs.org → télécharge la version
   **LTS** → installe (Suivant, Suivant, Terminer).
2. **Récupérer le code** depuis GitHub :
   - soit télécharge le ZIP du dépôt (bouton vert **Code → Download ZIP**) et
     décompresse-le, par ex. dans `C:\magasin-musique`,
   - soit `git clone <lien du dépôt>`.
3. **Mettre la musique** : soit double-clique **`TELECHARGER-MUSIQUE.bat`** pour
   obtenir **13 h de musique entraînante libre de droits** (gratuite, légale en
   magasin) ; soit copie tes propres `.mp3` dans le dossier **`music`** (ou les
   deux).
4. **Démarrer** : double-clique sur **`DEMARRER-WINDOWS.bat`**.
   - La 1re fois, Windows demande d'**autoriser l'accès réseau** → clique
     **Autoriser**.
   - Une fenêtre noire s'ouvre et affiche l'adresse, par ex. :
     `https://192.168.2.17:8443` → **laisse cette fenêtre ouverte** (c'est le
     serveur).

> 💡 Demande à ton fournisseur internet (ou règle dans le routeur) une **IP fixe
> pour le PC**, pour que l'adresse ne change jamais.

---

## B) Préparer l'iPad (une seule fois)

Le micro de l'iPad n'est autorisé que sur une connexion sécurisée → il faut
installer le **certificat** une fois.

1. Sur le PC, prends le fichier **`iPad-certificat.crt`** (créé au 1er
   démarrage) et envoie-le à l'iPad (AirDrop, courriel, clé USB…).
2. Sur l'iPad : ouvre le fichier → **Réglages** affiche « Profil téléchargé » →
   **Installer** (entre ton code).
3. **Activer la confiance** : Réglages → **Général → Informations → Réglages
   de confiance des certificats** → active l'interrupteur du certificat.
4. Ouvre **Safari** et va à l'adresse affichée par le serveur
   (ex. `https://192.168.2.17:8443`).
5. Bouton **Partager → « Sur l'écran d'accueil »** → tu obtiens une icône comme
   une vraie app.
6. À la 1re utilisation du micro, Safari demande l'autorisation → **Autoriser**.

### Pour que la musique ne s'arrête jamais
- iPad **branché au courant**.
- Réglages → **Écran et luminosité → Verrouillage auto → Jamais**.
- (Option) Réglages → **Accessibilité → Accès guidé** : verrouille l'iPad sur
  l'app.

---

## C) Au quotidien

- ▶️ **Musique** : se lance toute seule, en boucle aléatoire.
  - Ajouter/enlever des chansons = glisse des `.mp3` dans le dossier `music` du
    PC, puis recharge la page sur l'iPad.
- 🎤 **Parler** : garde le doigt appuyé sur le gros bouton rouge → la musique
  baisse, tu parles, tu relâches.
- 🕐 **Annonce de fermeture** : réglée à **20:45** par défaut. Change l'heure /
  le texte dans l'app, bouton « Tester l'annonce » pour l'entendre.

---

## D) Le son vers les haut-parleurs
L'iPad sort le son par **câble** (USB-C → ampli/enceinte) ou **Bluetooth**.
Mets les haut-parleurs **loin de l'iPad** pour éviter le sifflement (effet
Larsen) quand tu parles.

---

## En cas de souci
- **Le micro ne marche pas** : le certificat n'est pas « de confiance » (étape
  B-3) ou la page n'est pas ouverte en `https://`.
- **L'iPad ne trouve pas l'adresse** : PC et iPad doivent être sur le **même
  Wi-Fi** ; la fenêtre noire du serveur doit rester ouverte.
- **L'adresse a changé** : l'IP du PC a bougé → relance `DEMARRER-WINDOWS.bat`,
  note la nouvelle adresse (et pense à l'IP fixe).
