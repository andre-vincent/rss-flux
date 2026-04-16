/**
 * Gestionnaire de Flux RSS
 * Récupère et cache les articles des flux RSS
 */

const FeedManager = {
    // Cache des articles pour éviter les requêtes répétées
    cache: {},
    
    // Temps d'expiration du cache (5 minutes)
    CACHE_EXPIRATION: 5 * 60 * 1000,
    
    // URL du proxy RSS2JSON (contournement CORS)
    PROXY_URL: 'https://api.rss2json.com/v1/api.json',
    
    /**
     * Obtient les articles d'un flux RSS
     * @param {string} urlFlux - L'URL du flux RSS
     * @returns {Promise<Array>} Tableau des articles
     */
    async obtenirArticles(urlFlux) {
        console.log(`🔄 Récupération des articles: ${urlFlux}`);
        
        // Vérifier le cache
        if (this.cache[urlFlux] && Date.now() - this.cache[urlFlux].timestamp < this.CACHE_EXPIRATION) {
            console.log('💾 Articles trouvés en cache');
            return this.cache[urlFlux].articles;
        }
        
        try {
            // Construire l'URL de la requête
            const url = new URL(this.PROXY_URL);
            url.searchParams.append('rss_url', urlFlux);
            url.searchParams.append('count', 20); // Récupérer les 20 derniers articles
            
            // Effectuer la requête
            const response = await fetch(url.toString());
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}`);
            }
            
            const donnees = await response.json();
            
            // Vérifier la réponse
            if (donnees.status !== 'ok' || !donnees.items) {
                throw new Error('Format de réponse invalide');
            }
            
            // Formater les articles
            const articles = donnees.items.map((item, index) => ({
                id: item.guid || item.link || index,
                titre: item.title || 'Sans titre',
                description: item.description || item.summary || 'Pas de description',
                lien: item.link,
                auteur: item.author || '',
                date: new Date(item.pubDate || item.isoDate || Date.now()),
                image: this.extraireImage(item)
            })).sort((a, b) => b.date - a.date);
            
            // Mettre en cache
            this.cache[urlFlux] = {
                articles: articles,
                timestamp: Date.now()
            };
            
            console.log(`✅ ${articles.length} articles chargés`);
            return articles;
        } catch (erreur) {
            console.error('❌ Erreur lors de la récupération des articles:', erreur);
            throw new Error(`Impossible de charger les articles: ${erreur.message}`);
        }
    },
    
    /**
     * Extrait l'image d'un article RSS
     * @param {Object} item - L'élément RSS
     * @returns {string} L'URL de l'image ou chaîne vide
     */
    extraireImage(item) {
        // Chercher l'image dans les champs courants
        if (item.image) return item.image;
        if (item.media && item.media['media:content'] && item.media['media:content'][0]) {
            return item.media['media:content'][0]['$'].url;
        }
        
        // Chercher une image dans la description HTML
        if (item.description) {
            const regex = /<img[^>]+src="([^">]+)"/;
            const match = item.description.match(regex);
            if (match) return match[1];
        }
        
        return '';
    },
    
    /**
     * Vide le cache des articles
     */
    viderCache() {
        this.cache = {};
        console.log('🗑️ Cache vidé');
    }
};
