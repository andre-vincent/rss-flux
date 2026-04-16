/**
 * Parseur OPML
 * Gère l'import et l'export de fichiers OPML
 */

const OPMLParser = {
    /**
     * Parse un fichier OPML et extrait les flux RSS
     * @param {string} contenuXML - Le contenu XML du fichier OPML
     * @returns {Array} Tableau des flux trouvés
     */
    parser(contenuXML) {
        console.log('📂 Analyse du fichier OPML...');
        
        try {
            // Créer un parseur XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(contenuXML, 'application/xml');
            
            // Vérifier les erreurs de parsing
            if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
                throw new Error('Fichier XML invalide');
            }
            
            // Extraire tous les éléments <outline>
            const outlines = xmlDoc.getElementsByTagName('outline');
            const flux = [];
            
            for (let outline of outlines) {
                // Filtrer les outlines de type "rss"
                if (outline.getAttribute('type') === 'rss' || outline.getAttribute('xmlUrl')) {
                    const fluxItem = {
                        id: 'flux_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        titre: outline.getAttribute('text') || outline.getAttribute('title') || 'Sans titre',
                        url: outline.getAttribute('xmlUrl'),
                        website: outline.getAttribute('htmlUrl') || '',
                        description: outline.getAttribute('description') || ''
                    };
                    
                    // Vérifier que l'URL existe
                    if (fluxItem.url) {
                        flux.push(fluxItem);
                    }
                }
            }
            
            console.log(`✅ ${flux.length} flux extraits du fichier OPML`);
            return flux;
        } catch (erreur) {
            console.error('❌ Erreur lors du parsing OPML:', erreur);
            throw new Error('Impossible de parser le fichier OPML');
        }
    },
    
    /**
     * Génère un fichier OPML à partir d'un tableau de flux
     * @param {Array} flux - Tableau des flux
     * @returns {string} Contenu XML du fichier OPML
     */
    generer(flux) {
        console.log('📝 Génération du fichier OPML...');
        
        // Échapper les caractères XML spéciaux
        const echapperXML = (texte) => {
            if (!texte) return '';
            return String(texte)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
        };
        
        // Créer les éléments <outline>
        const outlines = flux.map(f => `    <outline type="rss" 
                text="${echapperXML(f.titre)}" 
                title="${echapperXML(f.titre)}" 
                xmlUrl="${echapperXML(f.url)}" 
                htmlUrl="${echapperXML(f.website)}" />`).join('\n');
        
        // Construire le document OPML
        const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Mon Flux RSS</title>
    <dateCreated>${new Date().toISOString()}</dateCreated>
    <docs>http://opml.org/spec2.opml</docs>
  </head>
  <body>
${outlines}
  </body>
</opml>`;
        
        console.log('✅ Fichier OPML généré');
        return opml;
    }
};
