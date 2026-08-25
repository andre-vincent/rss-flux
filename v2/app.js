/**
 * NetNewsWire Web Reader
 * @version v1.0
 * @description Lecteur RSS autonome avec cache RAM, raccourcis macOS et conversion rss2json.
 */

const OPML_FILE = "https://andre-vincent.github.io/rss-flux/feeds.opml";
const API_PROXY = "https://api.rss2json.com/v1/api.json?rss_url=";

// Gestion de l'état global et du cache temporaire en mémoire vive (RAM)
let articlesEnCours = [];
let indexArticleSelectionne = -1;
const cacheFluxRSS = {}; // Format : { "http://url-du-flux": [...] }

document.addEventListener('DOMContentLoaded', () => {
    initNetNewsWire();
    initThemeToggle();
    initRaccourcisClavier();
});

async function initNetNewsWire() {
    const menuContainer = document.getElementById('categories-menu');
    if (!menuContainer) return;

    try {
        const response = await fetch(OPML_FILE);
        const opmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(opmlText, "text/xml");
        
        menuContainer.innerHTML = '';
        const categories = xmlDoc.querySelectorAll('body > outline, opml > body > outline');

        if (categories.length === 0) {
            menuContainer.innerHTML = '<li class="status-msg">Aucune catégorie trouvée dans l\'OPML.</li>';
            return;
        }

        categories.forEach((cat, index) => {
            const catTitle = cat.getAttribute('text') || cat.getAttribute('title') || 'Sans catégorie';
            const feeds = cat.querySelectorAll('outline[xmlUrl]');
            if (feeds.length === 0) return;

            const liGroup = document.createElement('li');
            liGroup.className = 'menu-group';

            const details = document.createElement('details');
            if (index === 0) details.open = true;

            const summary = document.createElement('summary');
            summary.innerHTML = `
                <svg class="caret-icon" viewBox="0 0 16 16" width="10" height="10">
                    <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                </svg>
                <span>${catTitle}</span>
            `;

            const subUl = document.createElement('ul');
            subUl.className = 'menu-sublist';

            feeds.forEach(feed => {
                const feedTitle = feed.getAttribute('text') || feed.getAttribute('title');
                let xmlUrl = feed.getAttribute('xmlUrl');

                // Nettoyage des entités HTML pour décoder les esperluettes (&amp;)
                const txtNode = document.createElement('textarea');
                txtNode.innerHTML = xmlUrl;
                xmlUrl = txtNode.value;

                const subLi = document.createElement('li');
                const btn = document.createElement('button');
                btn.className = 'flux-btn';
                btn.textContent = feedTitle;
                btn.classList.add('flux-btn-rss');


                btn.addEventListener('click', () => {
                    document.querySelectorAll('.flux-btn').forEach(b => b.classList.remove('is-active'));
                    btn.classList.add('is-active');
                    chargerFluxDansTimeline(xmlUrl, feedTitle);
                });

                subLi.appendChild(btn);
                subUl.appendChild(subLi);
            });

            details.appendChild(summary);
            details.appendChild(subUl);
            liGroup.appendChild(details);
            menuContainer.appendChild(liGroup);
        });

    } catch (e) {
        console.error(e);
        menuContainer.innerHTML = '<li class="status-msg">Erreur de lecture de l\'OPML.</li>';
    }
}

async function chargerFluxDansTimeline(url, feedTitle) {
    const timeline = document.getElementById('timeline-container');
    const timelineTitle = document.getElementById('timeline-title');
    const viewer = document.getElementById('viewer-container');
    
    timelineTitle.textContent = feedTitle;
    viewer.innerHTML = '<div class="empty-viewer"><p>Aucun article sélectionné</p></div>';
    document.getElementById('article-external-link').classList.add('hidden');
    indexArticleSelectionne = -1;

    // Récupération instantanée si le flux est déjà en mémoire (RAM Cache)
    if (cacheFluxRSS[url]) {
        articlesEnCours = cacheFluxRSS[url];
        genererTimelineHTML(timeline, feedTitle);
        return;
    }

    timeline.innerHTML = '<p class="status-msg">Mise à jour en direct...</p>';

    try {
        // CORRECTION : Appel direct de votre proxy rss2json fonctionnel
        const response = await fetch(`${API_PROXY}${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error('Erreur proxy');
        
        const data = await response.json();
        
        if (data.status !== "ok" || !data.items || data.items.length === 0) {
            timeline.innerHTML = '<p class="status-msg">Aucun article trouvé dans ce flux.</p>';
            return;
        }

        articlesEnCours = [];

        // Adaptation de la structure aux données JSON fournies par rss2json
        data.items.forEach(item => {
            articlesEnCours.push({
                title: item.title || 'Sans titre',
                link: item.link || '#',
                content: item.description || item.content || '',
                author: item.author || 'Anonyme',
                pubDate: item.pubDate ? new Date(item.pubDate).toLocaleDateString("fr-CA") : ''
            });
        });

        // Stockage dans le cache local de la session
        cacheFluxRSS[url] = articlesEnCours;
        genererTimelineHTML(timeline, feedTitle);

    } catch (e) {
        console.error(e);
        timeline.innerHTML = `<p class="status-msg" style="color:var(--accent);">Erreur de connexion au flux.<br><small style="font-size:0.75rem;display:block;margin-top:5px;color:var(--text-muted);">Le service RSS2JSON rencontre des difficultés avec ce lien.</small></p>`;
    }
}

function genererTimelineHTML(container, feedTitle) {
    container.innerHTML = '';
    articlesEnCours.forEach((article, index) => {
        // Extraction d'un extrait textuel court sans les balises graphiques
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = article.content;
        const snippetText = tempDiv.textContent.trim().substring(0, 80);

        const itemDiv = document.createElement('div');
        itemDiv.className = 'timeline-item';
        itemDiv.setAttribute('data-index', index);
        itemDiv.innerHTML = `
            <div class="feed-source">${feedTitle}</div>
            <h4>${article.title}</h4>
            <div class="snippet">${snippetText ? snippetText + '...' : 'Lire l\'article'}</div>
        `;

        itemDiv.addEventListener('click', () => {
            selectionnerArticle(index, feedTitle);
        });

        container.appendChild(itemDiv);
    });
}

function selectionnerArticle(index, feedTitle) {
    if (index < 0 || index >= articlesEnCours.length) return;
    
    indexArticleSelectionne = index;

    document.querySelectorAll('.timeline-item').forEach(i => i.classList.remove('is-active'));
    const itemSelectionne = document.querySelector(`.timeline-item[data-index="${index}"]`);
    if (itemSelectionne) {
        itemSelectionne.classList.add('is-active');
        itemSelectionne.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    const viewer = document.getElementById('viewer-container');
    const badge = document.getElementById('article-site-source');
    const linkBtn = document.getElementById('article-external-link');
    const article = articlesEnCours[index];

    badge.textContent = feedTitle;
    linkBtn.href = article.link;
    linkBtn.classList.remove('hidden');

    // Inclusion optionnelle des métadonnées (auteur, date) dans la liseuse
    const metaHTML = article.pubDate ? `<div class="article-meta" style="font-size:0.85rem;color:var(--text-muted);margin-bottom:15px;">Par ${article.author} — ${article.pubDate}</div>` : '';

    viewer.innerHTML = `
        <h1 class="article-view-title">${article.title}</h1>
        ${metaHTML}
        <hr style="border: 0; border-top: 1px solid var(--border-color); margin-bottom: 20px;">
        <div class="article-view-content">${article.content}</div>
    `;
    
    viewer.scrollTop = 0;
}

function initRaccourcisClavier() {
    window.addEventListener('keydown', (e) => {
        if (articlesEnCours.length === 0) return;

        const touche = e.key.toLowerCase();
        const currentFeedTitle = document.getElementById('timeline-title').textContent;

        if (touche === 'arrowdown' || touche === 'j') {
            e.preventDefault();
            const nouvelIndex = indexArticleSelectionne + 1;
            if (nouvelIndex < articlesEnCours.length) {
                selectionnerArticle(nouvelIndex, currentFeedTitle);
            }
        } 
        else if (touche === 'arrowup' || touche === 'k') {
            e.preventDefault();
            const nouvelIndex = indexArticleSelectionne - 1;
            if (nouvelIndex >= 0) {
                selectionnerArticle(nouvelIndex, currentFeedTitle);
            }
        } 
        else if (e.key === ' ' || e.code === 'Space') {
            const viewer = document.getElementById('viewer-container');
            if (viewer && indexArticleSelectionne !== -1) {
                e.preventDefault();
                viewer.scrollBy({ top: window.innerHeight * 0.6, behavior: 'smooth' });
            }
        }
    });
}

function initThemeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (!themeToggleBtn) return;

    themeToggleBtn.addEventListener('click', () => {
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (document.body.classList.contains('theme-dark')) {
            document.body.classList.remove('theme-dark');
            document.body.classList.add('theme-light');
        } else if (document.body.classList.contains('theme-light')) {
            document.body.classList.remove('theme-light');
            document.body.classList.add('theme-dark');
        } else {
            if (isSystemDark) {
                document.body.classList.add('theme-light');
            } else {
                document.body.classList.add('theme-dark');
            }
        }
    });
}
