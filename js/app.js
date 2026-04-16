/**
 * Application Principale - Lecteur RSS Flux
 */

let appState = {
    flux: [],
    fluxSelectione: null,
    articles: [],
    favoris: [],
    recherche: '',
    theme: 'light'
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('⏳ Initialisation...');
    chargerDonneesSauvegardees();
    UI.initialiser();
    configurerEvenements();
    appliquerTheme();
    console.log('✅ Prêt!');
});

function chargerDonneesSauvegardees() {
    const donnees = localStorage.getItem('rss-flux-data');
    if (donnees) {
        try {
            const parsed = JSON.parse(donnees);
            appState = { ...appState, ...parsed };
            console.log(`📊 ${appState.flux.length} flux chargés`);
        } catch (e) {
            console.error('❌ Erreur chargement:', e);
        }
    }
}

function sauvegarderDonnees() {
    localStorage.setItem('rss-flux-data', JSON.stringify({
        flux: appState.flux,
        favoris: appState.favoris,
        theme: appState.theme
    }));
}

function configurerEvenements() {
    document.getElementById('btnImportOPML').addEventListener('click', () => {
        document.getElementById('opmlInput').click();
    });
    
    document.getElementById('btnExportOPML').addEventListener('click', exporterFlux);
    
    document.getElementById('opmlInput').addEventListener('change', (e) => {
        if (e.target.files[0]) importerOPML(e.target.files[0]);
    });
    
    document.getElementById('btnTheme').addEventListener('click', basculerTheme);
    
    document.getElementById('searchInput').addEventListener('input', (e) => {
        appState.recherche = e.target.value.toLowerCase();
        UI.rafraichirListeFlux();
    });
    
    document.getElementById('articleModal').addEventListener('close', () => {
        console.log('Modale fermée');
    });
}

function importerOPML(fichier) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const nouveaux = OPMLParser.parser(e.target.result);
            const existants = appState.flux.map(f => f.url);
            const ajoutes = nouveaux.filter(f => !existants.includes(f.url));
            
            appState.flux.push(...ajoutes);
            sauvegarderDonnees();
            UI.rafraichirListeFlux();
            
            alert(`✅ ${ajoutes.length} flux importés`);
        } catch (err) {
            alert('❌ Fichier OPML invalide: ' + err.message);
        }
    };
    reader.readAsText(fichier);
}

function exporterFlux() {
    if (appState.flux.length === 0) {
        alert('⚠️ Aucun flux');
        return;
    }
    
    const xml = OPMLParser.generer(appState.flux);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flux-${new Date().toISOString().split('T')[0]}.opml`;
    a.click();
    URL.revokeObjectURL(url);
}

function basculerTheme() {
    appState.theme = appState.theme === 'light' ? 'dark' : 'light';
    appliquerTheme();
    sauvegarderDonnees();
}

function appliquerTheme() {
    const isDark = appState.theme === 'dark';
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    document.getElementById('btnTheme').textContent = isDark ? '☀️' : '🌙';
}

function selectionnerFlux(fluxId) {
    const flux = appState.flux.find(f => f.id === fluxId);
    if (!flux) return;
    
    appState.fluxSelectione = fluxId;
    document.getElementById('feedTitle').textContent = flux.titre;
    document.getElementById('feedDescription').textContent = flux.description || '';
    document.getElementById('feedHeader').style.display = 'block';
    
    chargerArticles(flux);
    UI.rafraichirListeFlux();
}

async function chargerArticles(flux) {
    const grid = document.getElementById('articlesGrid');
    grid.innerHTML = '<p>⏳ Chargement...</p>';
    
    try {
        const articles = await FeedManager.obtenirArticles(flux.url);
        appState.articles = articles;
        UI.afficherArticles(articles);
    } catch (err) {
        grid.innerHTML = '<p>❌ Erreur: ' + err.message + '</p>';
    }
}

function supprimerFlux(fluxId) {
    if (!confirm('Supprimer ce flux?')) return;
    
    appState.flux = appState.flux.filter(f => f.id !== fluxId);
    if (appState.fluxSelectione === fluxId) appState.fluxSelectione = null;
    
    sauvegarderDonnees();
    UI.rafraichirListeFlux();
}

function basculerFavori(url) {
    const idx = appState.favoris.indexOf(url);
    if (idx === -1) appState.favoris.push(url);
    else appState.favoris.splice(idx, 1);
    sauvegarderDonnees();
    return idx === -1;
}
