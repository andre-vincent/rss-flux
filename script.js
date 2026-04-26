// Configuration
const OPML_PATH = 'feeds.opml';
const API_PROXY = 'https://api.rss2json.com/v1/api.json?rss_url=';

const feedMenu = document.getElementById('feed-menu');
const articlesContainer = document.getElementById('articles-container');
const feedTitle = document.getElementById('feed-title');

// 1. Initialisation : Chargement de l’OPML
async function init() {
    try {
        const response = await fetch(OPML_PATH);
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        
        const outlines = xmlDoc.querySelectorAll('outline[type="rss"]');
        feedMenu.innerHTML = ''; 

        outlines.forEach(outline => {
            const btn = document.createElement('button');
            btn.textContent = outline.getAttribute('text');
            btn.onclick = () => loadRSS(outline.getAttribute('xmlUrl'), btn.textContent);
            feedMenu.appendChild(btn);
        });

        // --- NOUVEAUTÉ : Chargement du premier flux par défaut ---
        if (outlines.length > 0) {
            const firstFeed = outlines[0];
            loadRSS(firstFeed.getAttribute('xmlUrl'), firstFeed.getAttribute('text'));
        }
        // ---------------------------------------------------------

    } catch (error) {
        feedMenu.innerHTML = '<p class="error">Erreur de chargement du fichier OPML&#8239;.</p>';
    }
}

// 2. Chargement d’un flux spécifique
async function loadRSS(url, title) {
    feedTitle.textContent = `Chargement&#8239;: ${title}…`;
    articlesContainer.innerHTML = '<div class="loader"></div>';

    try {
        const res = await fetch(API_PROXY + encodeURIComponent(url));
        const data = await res.json();

        if (data.status === 'ok') {
            feedTitle.textContent = title;
            articlesContainer.innerHTML = data.items.map(item => `
                <article class="feed-item">
                    <h3><a href="${item.link}" target="_blank">${item.title}</a></h3>
                    <div class="meta">Par ${item.author || 'Anonyme'} — ${new Date(item.pubDate).toLocaleDateString('fr-FR')}</div>
                    <div class="description">${item.description}</div>
                </article>
            `).join('');
        } else {
            throw new Error();
        }
    } catch (error) {
        articlesContainer.innerHTML = '<p class="error">Impossible de lire ce flux RSS (problème de source ou de proxy)&#8239;.</p>';
    }
}

init();
