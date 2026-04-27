/**
 * CONFIGURATION
 * OPML_PATH : Chemin vers votre fichier de liste de flux.
 * API_PROXY : Service tiers pour convertir le XML en JSON et contourner les restrictions CORS.
 */
const OPML_PATH = 'feeds.opml';
const API_PROXY = 'https://api.rss2json.com/v1/api.json?rss_url=';

// Sélection des éléments du DOM
const feedMenu = document.getElementById('feed-menu');
const articlesContainer = document.getElementById('articles-container');
const feedTitle = document.getElementById('feed-title');

/**
 * INITIALISATION
 * Charge le fichier OPML, génère le menu latéral et lance le premier flux.
 */
async function init() {
    try {
        // Récupération du fichier OPML
        const response = await fetch(OPML_PATH);
        const xmlText = await response.text();
        
        // Analyse du texte XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        
        // Extraction de tous les flux RSS (balises <outline> avec un type="rss")
        const outlines = xmlDoc.querySelectorAll('outline[type="rss"]');
        feedMenu.innerHTML = ''; 

        // Création des boutons pour chaque flux trouvé
        outlines.forEach(outline => {
            const btn = document.createElement('button');
            btn.textContent = outline.getAttribute('text');
            // Au clic, on charge le flux via son URL xmlUrl
            btn.onclick = () => loadRSS(outline.getAttribute('xmlUrl'), btn.textContent);
            feedMenu.appendChild(btn);
        });

        // Chargement automatique du premier flux de la liste au démarrage
        if (outlines.length > 0) {
            const firstFeed = outlines[0];
            loadRSS(firstFeed.getAttribute('xmlUrl'), firstFeed.getAttribute('text'));
        }

    } catch (error) {
        console.error("Erreur d’initialisation :", error);
        feedMenu.innerHTML = '<p class="error">Erreur de chargement du fichier OPML .</p>';
    }
}

/**
 * CHARGEMENT DU FLUX RSS
 * @param {string} url - L'adresse URL du flux RSS.
 * @param {string} title - Le nom du flux pour l'affichage.
 */
async function loadRSS(url, title) {
    // Mise à jour de l'interface (titre et indicateur de chargement)
    feedTitle.textContent = `Chargement : ${title}…`;
    articlesContainer.innerHTML = '<div class="loader"></div>';

    try {
        // Appel de l'API de conversion (RSS vers JSON)
        const res = await fetch(API_PROXY + encodeURIComponent(url));
        const data = await res.json();

        if (data.status === 'ok') {
            feedTitle.textContent = title;
            
            // Génération du HTML pour chaque article
            articlesContainer.innerHTML = data.items.map(item => {
                // On nettoie la description pour supprimer les images indésirables
                const cleanDescription = stripImages(item.description);
                
                return `
                    <article class="feed-item">
                        <h3><a href="${item.link}" target="_blank">${item.title}</a></h3>
                        <div class="meta">
                            Par ${item.author || 'Anonyme'} — 
                            ${new Date(item.pubDate).toLocaleDateString('fr-FR')}
                        </div>
                        <div class="description">${cleanDescription}</div>
                    </article>
                `;
            }).join('');
        } else {
            throw new Error("Réponse API invalide");
        }
    } catch (error) {
        console.error("Erreur de chargement du flux :", error);
        articlesContainer.innerHTML = '<p class="error">Impossible de lire ce flux RSS .</p>';
    }
}

/**
 * NETTOYAGE DU CONTENU
 * Supprime les balises <img> et <figure> pour un affichage purement textuel.
 * @param {string} htmlContent - Le contenu HTML brut du flux.
 * @returns {string} - Le contenu HTML sans images.
 */
function stripImages(htmlContent) {
    // Création d'un élément temporaire pour manipuler le DOM sans l'afficher
    const div = document.createElement('div');
    div.innerHTML = htmlContent;
    
    // Suppression récursive des balises <img>
    const images = div.getElementsByTagName('img');
    while (images.length > 0) {
        images[0].parentNode.removeChild(images[0]);
    }
    
    // Suppression récursive des balises <figure> (souvent utilisées pour les médias)
    const figures = div.getElementsByTagName('figure');
    while (figures.length > 0) {
        figures[0].parentNode.removeChild(figures[0]);
    }

    // Retourne le HTML nettoyé sous forme de chaîne de caractères
    return div.innerHTML;
}

// Lancement de l'application
init();
