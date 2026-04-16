/**
 * Gestionnaire d'Interface Utilisateur
 * Gère l'affichage et les interactions de l'interface
 */

const UI = {
    /**
     * Initialise l'interface
     */
    initialiser() {
        console.log('🎨 Initialisation de l\'interface...');
        this.rafraichirListeFlux();
    },
    
    /**
     * Rafraîchit la liste des flux dans la barre latérale
     */
    rafraichirListeFlux() {
        const fluxList = document.getElementById('fluxList');
        const emptyState = document.getElementById('emptyState');
        
        // Filtrer les flux selon la recherche
        const fluxFiltres = appState.flux.filter(flux => 
            flux.titre.toLowerCase().includes(appState.recherche) ||
            flux.url.toLowerCase().includes(appState.recherche)
        );
        
        // Afficher le message vide si nécessaire
        if (fluxFiltres.length === 0) {
            fluxList.innerHTML = '';
            if (appState.flux.length === 0) {
                emptyState.style.display = 'block';
            } else {
                emptyState.style.display = 'none';
            }
            return;
        }
        
        emptyState.style.display = 'none';
        
        // Générer les éléments de flux
        fluxList.innerHTML = fluxFiltres.map(flux => `
            <div class="flux-item ${flux.id === appState.fluxSelectione ? 'active' : ''}" 
                 onclick="selectionnerFlux('${flux.id}')">
                <span class="flux-item-text" title="${flux.titre}">${flux.titre}</span>
                <button class="flux-item-delete" 
                        onclick="event.stopPropagation(); supprimerFlux('${flux.id}')"
                        title="Supprimer ce flux">
                    🗑️
                </button>
            </div>
        `).join('');
    },
    
    /**
     * Affiche les articles dans la grille
     * @param {Array} articles - Tableau des articles
     */
    afficherArticles(articles) {
        const gridArticles = document.getElementById('articlesGrid');
        
        if (articles.length === 0) {
            gridArticles.innerHTML = '<div class="empty-state"><p>⚠️ Aucun article trouvé</p></div>';
            return;
        }
        
        gridArticles.innerHTML = articles.map(article => `
            <div class="article-card" onclick="afficherDetailsArticle('${this.echapperHTML(article.lien)}')">
                ${article.image ? `<div class="article-image"><img src="${article.image}" alt="" onerror="this.style.display='none'"></div>` : ''}
                <div class="article-body">
                    <h3 class="article-title">${this.echapperHTML(article.titre)}</h3>
                    <p class="article-meta">${this.formatterDate(article.date)}</p>
                    <p class="article-description">${this.nettoyer(article.description).substring(0, 150)}...</p>
                </div>
                <div class="article-footer">
                    <button class="article-star" 
                            onclick="event.stopPropagation(); basculerFavoriUI('${this.echapperHTML(article.lien)}')"
                            title="${appState.favoris.includes(article.lien) ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                        ${appState.favoris.includes(article.lien) ? '⭐' : '☆'}
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    /**
     * Formate une date en format lisible
     * @param {Date} date - La date à formater
     * @returns {string} Date formatée
     */
    formatterDate(date) {
        const maintenant = new Date();
        const diffMs = maintenant - date;
        const diffJours = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffJours === 0) {
            const diffHeures = Math.floor(diffMs / (1000 * 60 * 60));
            if (diffHeures === 0) {
                return 'À l\'instant';
            }
            return `Il y a ${diffHeures}h`;
        } else if (diffJours === 1) {
            return 'Hier';
        } else if (diffJours < 7) {
            return `Il y a ${diffJours}j`;
        }
        
        // Formater en date longue
        return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    },
    
    /**
     * Nettoie le HTML d'un texte
     * @param {string} html - Le HTML à nettoyer
     * @returns {string} Texte nettoyé
     */
    nettoyer(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    },
    
    /**
     * Échappe les caractères HTML spéciaux
     * @param {string} texte - Le texte à échapper
     * @returns {string} Texte échappé
     */
    echapperHTML(texte) {
        const div = document.createElement('div');
        div.textContent = texte;
        return div.innerHTML;
    }
};

/**
 * Affiche les détails d'un article dans une modale
 * @param {string} lien - L'URL de l'article
 */
function afficherDetailsArticle(lien) {
    const article = appState.articles.find(a => a.lien === lien);
    
    if (!article) {
        console.error('❌ Article non trouvé');
        return;
    }
    
    // Remplir la modale
    document.getElementById('modalTitle').textContent = article.titre;
    document.getElementById('modalMeta').textContent = `Par ${article.auteur || 'Auteur inconnu'} • ${UI.formatterDate(article.date)}`;
    
    // Image
    const modalImage = document.getElementById('modalImage');
    if (article.image) {
        modalImage.innerHTML = `<img src="${article.image}" alt="" onerror="this.style.display='none'">`;
    } else {
        modalImage.innerHTML = '';
    }
    
    // Contenu
    document.getElementById('modalContent').innerHTML = article.description;
    
    // Lien
    document.getElementById('modalLink').href = article.lien;
    
    // Afficher la modale
    document.getElementById('articleModal').style.display = 'flex';
}

/**
 * Bascule le favori d'un article et rafraîchit l'interface
 * @param {string} lien - L'URL de l'article
 */
function basculerFavoriUI(lien) {
    basculerFavori(lien);
    UI.afficherArticles(appState.articles);
}
