const OPML_FILE = 'feeds.opml';
const CORS_PROXY = 'https://allorigins.win';

// Stockage de l'état de l'application
let articlesEnCours = [];
let indexArticleSelectionne = -1;

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
        const categories = xmlDoc.querySelectorAll('body > outline');

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
                const xmlUrl = feed.getAttribute('xmlUrl');

                const subLi = document.createElement('li');
                const btn = document.createElement('button');
                btn.className = 'flux-btn';
                btn.textContent = `📰 ${feedTitle}`;

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
        menuContainer.innerHTML = '<li class="status-msg">Erreur de chargement OPML.</li>';
    }
}

async function chargerFluxDansTimeline(url, feedTitle) {
    const timeline = document.getElementById('timeline-container');
    const timelineTitle = document.getElementById('timeline-title');
    const viewer = document.getElementById('viewer-container');
    
    timelineTitle.textContent = feedTitle;
    timeline.innerHTML = '<p class="status-msg">Mise à jour...</p>';
    viewer.innerHTML = '<div class="empty-viewer"><p>Aucun article sélectionné</p></div>';
    document.getElementById('article-external-link').classList.add('hidden');

    // Réinitialisation de l'état de sélection
    indexArticleSelectionne = -1;

    try {
        const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
        const data = await response.json();
        const xmlDoc = new DOMParser().parseFromString(data.contents, "text/xml");
        const items = xmlDoc.querySelectorAll('item, entry');

        timeline.innerHTML = '';
        articlesEnCours = [];

        if (items.length === 0) {
            timeline.innerHTML = '<p class="status-msg">Aucun article.</p>';
            return;
        }

        items.forEach((item, index) => {
            const title = item.querySelector('title')?.textContent || 'Sans titre';
            let link = item.querySelector('link')?.textContent || '#';
            if (item.querySelector('link')?.getAttribute('href')) {
                link = item.querySelector('link').getAttribute('href');
            }
            const rawDescription = item.querySelector('description, summary')?.textContent || '';

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = rawDescription;
            const snippetText = tempDiv.textContent.trim().substring(0, 80);

            articlesEnCours.push({ title, link, content: rawDescription });

            const itemDiv = document.createElement('div');
            itemDiv.className = 'timeline-item';
            itemDiv.setAttribute('data-index', index); // Utile pour cibler l'élément via les touches
            itemDiv.innerHTML = `
                <div class="feed-source">${feedTitle}</div>
                <h4>${title}</h4>
                <div class="snippet">${snippetText}...</div>
            `;

            itemDiv.addEventListener('click', () => {
                selectionnerArticle(index, feedTitle);
            });

            timeline.appendChild(itemDiv);
        });

    } catch (e) {
        timeline.innerHTML = '<p class="status-msg">Erreur de flux.</p>';
    }
}

function selectionnerArticle(index, feedTitle) {
    if (index < 0 || index >= articlesEnCours.length) return;
    
    indexArticleSelectionne = index;

    // Mise à jour visuelle de la sélection dans la timeline
    document.querySelectorAll('.timeline-item').forEach(i => i.classList.remove('is-active'));
    const itemSelectionne = document.querySelector(`.timeline-item[data-index="${index}"]`);
    if (itemSelectionne) {
        itemSelectionne.classList.add('is-active');
        // Fait défiler la timeline automatiquement si l'élément sort de l'écran avec les touches
        itemSelectionne.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    afficherArticleDansViewer(index, feedTitle);
}

function afficherArticleDansViewer(index, feedTitle) {
    const viewer = document.getElementById('viewer-container');
    const badge = document.getElementById('article-site-source');
    const linkBtn = document.getElementById('article-external-link');
    
    const article = articlesEnCours[index];
    if (!article) return;

    badge.textContent = feedTitle;
    linkBtn.href = article.link;
    linkBtn.classList.remove('hidden');

    viewer.innerHTML = `
        <h1 class="article-view-title">${article.title}</h1>
        <hr style="border: 0; border-top: 1px solid var(--border-color); margin-bottom: 20px;">
        <div class="article-view-content">${article.content}</div>
    `;
    
    // Remonte le défilement de la liseuse en haut à chaque nouvel article
    viewer.scrollTop = 0;
}

function initRaccourcisClavier() {
    window.addEventListener('keydown', (e) => {
        // Si l'utilisateur n'a chargé aucun article, les raccourcis ne font rien
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
            // La touche Espace fait descendre la liseuse (Viewer) d'une hauteur d'écran
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
