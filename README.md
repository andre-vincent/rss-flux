# 📡 Lecteur RSS Flux

Un lecteur RSS moderne, minimaliste et entièrement statique pour GitHub Pages et serveurs statiques. Basé sur une liste OPML, sans dépendances, avec support du mode sombre et persistance locale.

## 🎯 Caractéristiques

✅ **OPML Import/Export** - Importez vos flux depuis un fichier OPML, exportez votre collection  
✅ **Multi-Flux** - Gérez un nombre illimité de flux RSS  
✅ **Mode Sombre/Clair** - Basculez entre les thèmes (sauvegardé localement)  
✅ **Recherche et Filtrage** - Trouvez facilement vos flux  
✅ **Favoris** - Marquez les articles importants (stockage local)  
✅ **Design Réactif** - Fonctionne sur mobile, tablette et desktop  
✅ **Sans Dépendances** - HTML, CSS et JavaScript pur  
✅ **CORS-Safe** - Utilise l'API proxy `rss2json.com`  
✅ **Hébergement Statique** - Compatible avec GitHub Pages, Netlify, Vercel  
✅ **Stockage Local** - Tous les données sauvegardées dans le navigateur

## 📦 Installation

### Option 1 : GitHub Pages

1. **Clonez le dépôt**  
   ```bash  
   git clone https://github.com/andre-vincent/rss-flux.git  
   cd rss-flux  
   ```

2. **Activez GitHub Pages**  
   - Allez dans Settings → Pages  
   - Sélectionnez `main` comme source  
   - Votre lecteur sera disponible à: `https://andre-vincent.github.io/rss-flux/`

### Option 2 : Installation Locale

1. **Clonez ou téléchargez le dépôt**  
2. **Ouvrez `index.html` dans votre navigateur**  
   - Aucun serveur n'est nécessaire!

### Option 3 : Autre Hébergement Statique

- **Netlify** : Connectez le dépôt GitHub, aucune configuration supplémentaire nécessaire  
- **Vercel** : Idem  
- **Hébergement personnalisé** : Copiez tous les fichiers sur votre serveur web

## 🚀 Utilisation

### 1. Importer des Flux

#### Depuis un fichier OPML
1. Cliquez sur **➕ Importer OPML**  
2. Sélectionnez votre fichier `.opml`  
3. Les flux sont automatiquement importés

#### Format OPML Attendu
```xml
<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Mon Flux</title>
  </head>
  <body>
    <outline type="rss" text="Tech News" 
             title="Tech News" 
             xmlUrl="https://example.com/feed.rss" />
    <outline type="rss" text="Blog" 
             title="Blog" 
             xmlUrl="https://blog.example.com/feed.xml" />
  </body>
</opml>
```

### 2. Naviguer dans les Flux

- **Sélectionnez un flux** : Cliquez sur son nom dans la barre latérale  
- **Les articles s'affichent** : Voir les 20 derniers articles du flux  
- **Cliquez sur un article** : Voir le contenu complet dans une modale

### 3. Gérer les Favoris

- **Marquer comme favori** : Cliquez sur ⭐ (vide) sur une carte d'article  
- **Retirer des favoris** : Cliquez sur ⭐ (remplie) sur une carte d'article  
- **Les favoris sont sauvegardés** : Persiste dans le navigateur

### 4. Rechercher des Flux

- **Tapez dans le champ "Chercher un flux..."** dans la barre latérale  
- **Les flux se filtrent en direct**

### 5. Basculer le Thème

- **Cliquez sur 🌙/☀️** en haut à droite  
- **Le thème est sauvegardé** : Votre préférence persiste

### 6. Exporter des Flux

- **Cliquez sur ⬇️ Exporter**  
- **Un fichier `mes-flux.opml` est téléchargé**  
- **Réimportez-le n'importe quand**

## 📁 Structure du Projet

```
rss-flux/
├── index.html              # Page HTML principale
├── css/
│   └── styles.css          # Feuille de styles complète
├── js/
│   ├── app.js              # Contrôleur principal
│   ├── opml-parser.js      # Parseur OPML
│   ├── feed-manager.js     # Gestionnaire de flux RSS
│   └── ui.js               # Gestionnaire d'interface
├── sample.opml             # Exemple de fichier OPML
├── README.md               # Ce fichier
└── .gitignore             # Configuration Git
```

## 🔧 Architecture

### `app.js`
- Initialise l'application
- Gère l'état global
- Persiste les données dans `localStorage`
- Bascule le thème sombre/clair

### `opml-parser.js`
- Parse les fichiers OPML
- Extrait les flux RSS et leurs URLs
- Exporte les flux actuels en OPML
- Échappe les caractères XML spéciaux

### `feed-manager.js`
- Récupère les articles via l'API proxy `rss2json.com`
- Met en cache les articles pour éviter les requêtes répétées
- Formate et trie les articles par date
- Extrait les images des articles

### `ui.js`
- Gère l'affichage de l'interface
- Gère les événements utilisateur
- Formate les dates et le texte
- Ouvre/ferme les modales

## 🔐 Sécurité & Confidentialité

- ✅ **Aucun serveur backend** - Pas de données envoyées à nos serveurs
- ✅ **Proxy RSS2JSON** - Service tiers pour contourner CORS (consultez leur [politique de confidentialité](https://rss2json.com))
- ✅ **Stockage local** - Toutes vos données restent dans votre navigateur
- ✅ **Code source public** - Auditez le code JavaScript
- ✅ **HTTPS requis** - Pour GitHub Pages et la plupart des hébergeurs

## 🎨 Personnalisation

### Changer les Couleurs

Éditez `css/styles.css` et modifiez les variables CSS:

```css
:root {
    --bg-primary: #ffffff;
    --text-primary: #333333;
    --accent-color: #ff6b6b;
    /* ... */
}
```

### Changer la Police

Dans `css/styles.css`:

```css
body {
    font-family: 'Votre Police', sans-serif;
}
```

### Ajouter Plus de Flux par Défaut

Éditez `js/app.js` et modifiez `appState.flux`:

```javascript
appState.flux = [
    {
        id: 'flux_default_1',
        titre: 'Mon Flux',
        url: 'https://example.com/feed.rss',
        website: 'https://example.com',
        description: ''
    }
];
```

## 🐛 Troubleshooting

### "Les articles ne se chargent pas"
- Vérifiez que le flux RSS est accessible
- Certains flux CORS peuvent ne pas fonctionner avec le proxy
- Consultez la console navigateur (F12) pour les erreurs

### "Le fichier OPML n'est pas valide"
- Assurez-vous que le fichier est en format XML/OPML valide
- Testez avec `sample.opml` en premier

### "Les données ne sont pas sauvegardées"
- Vérifiez que le stockage local est activé dans votre navigateur
- Les données privées/incognito ne sont pas persistées

### "Le mode sombre ne change rien"
- Videz le cache du navigateur
- Rechargez la page (Ctrl+Shift+R)

## 📚 Ressources

- [Format OPML - Spec officielle](http://opml.org/)
- [RSS 2.0 - Spec officielle](https://www.rssboard.org/rss-specification)
- [API RSS2JSON](https://rss2json.com/docs)
- [GitHub Pages - Documentation](https://pages.github.com/)

## 📝 Licence

MIT - Libre d'utilisation, de modification et de distribution

## 🤝 Contributions

Les contributions sont bienvenues! N'hésitez pas à:
- Reporter des bugs via les Issues
- Suggérer des améliorations
- Créer des Pull Requests

## 📧 Support

Pour des questions ou problèmes:
1. Consultez les Issues existantes
2. Créez une nouvelle Issue
3. Vérifiez la console navigateur (F12) pour les détails

---

**Fabriqué avec ❤️ pour les amateurs de RSS**