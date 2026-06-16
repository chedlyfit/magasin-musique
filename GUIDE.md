# 🎵 Musique Magasin — Guide (100 % local, sur ton PC)

Application pour le magasin : **musique non-stop + annonce de fermeture
automatique**, et **annonces au micro** via une petite app dédiée.

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
     `http://192.168.2.17:8080` → **laisse cette fenêtre ouverte** (c'est le
     serveur).

> 💡 Demande à ton fournisseur internet (ou règle dans le routeur) une **IP fixe
> pour le PC**, pour que l'adresse ne change jamais.

---

## B) Préparer l'iPad (une seule fois)

1. Sur l'iPad, ouvre **Safari** → tape l'adresse affichée par le serveur :
   **`http://<ip-du-PC>:8080`** (ex. `http://192.168.2.17:8080`). La page
   s'ouvre **directement** — aucun certificat, aucun avertissement.
2. Bouton **Partager → « Sur l'écran d'accueil »** → icône comme une vraie app.

### 🎤 Pour parler au micro
Le micro **à l'intérieur d'une page web** est bloqué par Apple sur iPad. Pour les
annonces en direct, installe l'app gratuite **« Good Mic »** (App Store) : tu
l'ouvres, tu parles (la voix sort dans l'ampli), puis tu reviens sur l'app
musique. *(L'annonce de fermeture programmée, elle, fonctionne dans l'app sans
rien installer.)*

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
- 🎤 **Parler (annonce en direct)** : ouvre l'app **« Good Mic »**, parle, puis
  reviens sur l'app musique.
- 🕐 **Annonce de fermeture** : réglée à **20:45** par défaut. Change l'heure /
  le texte dans l'app, bouton « Tester l'annonce » pour l'entendre.

---

## D) Le son vers les haut-parleurs
L'iPad sort le son par **câble** (USB-C → ampli/enceinte) ou **Bluetooth**.
Mets les haut-parleurs **loin de l'iPad** pour éviter le sifflement (effet
Larsen) quand tu parles.

---

## En cas de souci
- **Parler au micro** : utilise l'app « Good Mic » (le micro dans la page n'est
  pas disponible en local — limite imposée par Apple).
- **L'iPad ne trouve pas l'adresse** : PC et iPad doivent être sur le **même
  Wi-Fi** ; la fenêtre noire du serveur doit rester ouverte.
- **L'adresse a changé** : l'IP du PC a bougé → relance `DEMARRER-WINDOWS.bat`,
  note la nouvelle adresse (et pense à l'IP fixe).
