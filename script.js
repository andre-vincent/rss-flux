const OPML_FILE = 'feeds.opml';
const RSS_TO_JSON_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

async function init() {
    try {
        const response = await fetch(OPML_FILE);
        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");
        
        const feeds = xml.querySelectorAll('outline[type="rss"]');
        const feedList = document.getElementById('feed-list');

        feeds.forEach(feed => {
            const li = document.createElement('li');
            li.textContent = feed.getAttribute('text');
            li.dataset.url = feed.getAttribute('xmlUrl');
            li.addEventListener('click', () => loadFeed(li.dataset.url));
            feedList.appendChild(li);
        });
    } catch (err) {
        console.error("Erreur lors du chargement de l'OPML :", err);
    }
}

async function loadFeed(url) {
    const container = document.getElementById('articles');
    const loader = document.getElementById('loader');
    
    loader.classList.remove('hidden');
    container.innerHTML = '';

    try {
        const res = await fetch(`${RSS_TO_JSON_API}${encodeURIComponent(url)}`);
        const data = await res.json();

        if (data.status === 'ok') {
            data.items.forEach(item => {
                const article = document.createElement('article');
                article.innerHTML = `
                    <h3><a href="${item.link}" target="_blank">${item.title}</a></h3>
                    <small>Publié le : ${new Date(item.pubDate).toLocaleDateString()}</small>
                    <p>${item.description}</p>
                `;
                container.appendChild(article);
            });
        }
    } catch (err) {
        container.innerHTML = 'Impossible de charger ce flux.';
    } finally {
        loader.classList.add('hidden');
    }
}

init();
