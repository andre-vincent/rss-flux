/**
 * Application Principale - Lecteur RSS Flux
 * Gère l'état global, l'initialisation et la persistance des données
 */

// État global de l'application
let appState = {
    flux: [],
    fluxSelectione: null,
    articles: [],
    favoris: [],
    recherche: '',
    theme: 'light' // 'light' ou 'dark'
};

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    console.log('⏳ Initialisation de l\'application...');
    
    // Charger les données sauvegardées
    chargerDonneesSauvegardees();
    
    // Initialiser l'interface
    UI.initialiser();
    
    // Configurer les écouteurs d'événements
    configurerEvenements();
    
    // Appliquer le thème sauvegardé
    appliquerTheme();
    
    console.log('✅ Application initialisée');
});

/**
 * Charge les données sauvegardées du localStorage
 */
function chargerDonneesSauvegardees() {
    const donneesSauvegardees = localStorage.getItem('rss-flux-data');
    
    if (donneesSauvegardees) {
        try {
            const donnees = JSON.parse(donneesSauvegardees);
            appState.flux = donnees.flux || [];
            appState.favoris = donnees.favoris || [];
            appState.theme = donnees.theme || 'light';
            console.log(`📊 ${appState.flux.length} flux chargés`);
        } catch (erreur) {
            console.error('❌ Erreur lors du chargement des données:', erreur);
        }
    }
}

/**
 * Sauvegarde les données dans localStorage
 */
function sauvegarderDonnees() {
    const donnees = {
        flux: appState.flux,
        favoris: appState.favoris,
        theme: appState.theme
    };
    localStorage.setItem('rss-flux-data', JSON.stringify(donnees));
    console.log('💾 Données sauvegardées');
}

/**
 * Configure les écouteurs d'événements principaux
 */
function configurerEvenements() {
    // Boutons de la barre latérale
    document.getElementById('btnImportOPML').addEventListener('click', () => {
        document.getElementById('opmlInput').click();
    });
    
    document.getElementById('btnExportOPML').addEventListener('click', exporterFlux);
    
    // Input OPML caché
    document.getElementById('opmlInput').addEventListener('change', (e) => {
        if (e.target.files[0]) {
            importerOPML(e.target.files[0]);
            e.target.value = ''; // Réinitialiser l'input
        }
    });
    
    // Bouton thème
    document.getElementById('btnTheme').addEventListener('click', basculerTheme);
    
    // Champ de recherche
    document.getElementById('searchInput').addEventListener('input', (e) => {
        appState.recherche = e.target.value.toLowerCase();
        UI.rafraichirListeFlux();
    });
    
    // Fermeture modale
    document.getElementById('closeArticleModal').addEventListener('click', () => {
        document.getElementById('articleModal').style.display = 'none';
    });
    
    // Fermer modale au clic extérieur
    document.getElementById('articleModal').addEventListener('click', (e) => {
        if (e.target.id === 'articleModal') {
            document.getElementById('articleModal').style.display = 'none';
        }
    });
}

/**
 * Importe un fichier OPML
 * @param {File} fichier - Le fichier OPML à importer
 */
function importerOPML(fichier) {
    const lecteur = new FileReader();
    
    lecteur.onload = (e) => {
        try {
            const contenuXML = e.target.result;
            const nouveauxFlux = OPMLParser.parser(contenuXML);
            
            if (nouveauxFlux.length === 0) {
                alert('❌ Aucun flux trouvé dans ce fichier OPML');
                return;
            }
            
            // Ajouter les nouveaux flux
            const fluxExistants = appState.flux.map(f => f.url);
            const fluxAjoutes = nouveauxFlux.filter(f => !fluxExistants.includes(f.url));
            
            appState.flux.push(...fluxAjoutes);
            sauvegarderDonnees();
            UI.rafraichirListeFlux();
            
            const message = `✅ ${fluxAjoutes.length} flux importés`;
            console.log(message);
            alert(message);
        } catch (erreur) {
            console.error('❌ Erreur lors de l\'import OPML:', erreur);
            alert('❌ Erreur: le fichier OPML n\'est pas valide');
        }
    };
    
    lecteur.readAsText(fichier);
}

/**
 * Exporte les flux en fichier OPML
 */
function exporterFlux() {
    if (appState.flux.length === 0) {
        alert('⚠️ Aucun flux à exporter');
        return;
    }
    
    const contenuOPML = OPMLParser.generer(appState.flux);
    const blob = new Blob([contenuOPML], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = `mes-flux-${new Date().toISOString().split('T')[0]}.opml`;
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    URL.revokeObjectURL(url);
    
    console.log('⬇️ Flux exportés en OPML');
}

/**
 * Bascule entre le thème clair et sombre
 */
function basculerTheme() {
    appState.theme = appState.theme === 'light' ? 'dark' : 'light';
    appliquerTheme();
    sauvegarderDonnees();
}

/**
 * Applique le thème à l'interface
 */
function appliquerTheme() {
    const body = document.body;
    const btnTheme = document.getElementById('btnTheme');
    
    if (appState.theme === 'dark') {
        body.classList.add('dark-theme');
        btnTheme.textContent = '☀️';
        btnTheme.title = 'Passer au thème clair';
    } else {
        body.classList.remove('dark-theme');
        btnTheme.textContent = '🌙';
        btnTheme.title = 'Passer au thème sombre';
    }
}

/**
 * Sélectionne un flux et charge ses articles
 * @param {string} fluxId - L'ID du flux à sélectionner
 */
function selectionnerFlux(fluxId) {
    const flux = appState.flux.find(f => f.id === fluxId);
    
    if (!flux) {
        console.error('❌ Flux non trouvé:', fluxId);
        return;
    }
    
    appState.fluxSelectione = fluxId;
    console.log(`📰 Flux sélectionné: ${flux.titre}`);
    
    // Afficher l'en-tête du flux
    document.getElementById('feedTitle').textContent = flux.titre;
    document.getElementById('feedDescription').textContent = flux.description || '';
    document.getElementById('feedHeader').style.display = 'block';
    
    // Charger les articles
    chargerArticles(flux);
    
    // Rafraîchir l'interface
    UI.rafraichirListeFlux();
}

/**
 * Charge les articles d'un flux
 * @param {Object} flux - L'objet flux
 */
async function chargerArticles(flux) {
    const gridArticles = document.getElementById('articlesGrid');
    gridArticles.innerHTML = '<div class="empty-state"><p>⏳ Chargement des articles...</p></div>';
    
    try {
        const articles = await FeedManager.obtenirArticles(flux.url);
        appState.articles = articles;
        
        UI.afficherArticles(articles);
        console.log(`✅ ${articles.length} articles chargés`);
    } catch (erreur) {
        console.error('❌ Erreur lors du chargement des articles:', erreur);
        gridArticles.innerHTML = '<div class="empty-state"><p>❌ Erreur lors du chargement des articles</p></div>';
    }
}

/**
 * Supprime un flux
 * @param {string} fluxId - L'ID du flux à supprimer
 */
function supprimerFlux(fluxId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce flux?')) {
        return;
    }
    
    appState.flux = appState.flux.filter(f => f.id !== fluxId);
    
    if (appState.fluxSelectione === fluxId) {
        appState.fluxSelectione = null;
        document.getElementById('articlesGrid').innerHTML = '<div class="empty-state"><p>Sélectionnez un flux</p></div>';
        document.getElementById('feedHeader').style.display = 'none';
    }
    
    sauvegarderDonnees();
    UI.rafraichirListeFlux();
    
    console.log('🗑️ Flux supprimé');
}

/**
 * Ajoute/retire un article des favoris
 * @param {string} urlArticle - L'URL de l'article
 * @returns {boolean} true si ajouté aux favoris, false sinon
 */
function basculerFavori(urlArticle) {
    const index = appState.favoris.indexOf(urlArticle);
    
    if (index === -1) {
        appState.favoris.push(urlArticle);
        console.log('⭐ Article ajouté aux favoris');
        sauvegarderDonnees();
        return true;
    } else {
        appState.favoris.splice(index, 1);
        console.log('☆ Article retiré des favoris');
        sauvegarderDonnees();
        return false;
    }
}
