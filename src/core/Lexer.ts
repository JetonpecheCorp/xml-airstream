import { XmlToken } from "../types/lexer.js";


// Les différents états possibles de notre machine lors de la lecture caractère par caractère.
enum EtatLexer
{
    TEXTE,
    BALISE_OUVERTE,
    NOM_BALISE,
    NOM_ATTRIBUT,
    RECHERCHE_EGAL,
    VALEUR_ATTRIBUT,
    BALISE_FERMANTE,
    COMMENTAIRE_OU_DECLARATION,
    CDATA
}

export class Lexer
{
    // État actuel de la machine
    private etatCourant: EtatLexer = EtatLexer.TEXTE;

    // Tampon (Buffer) pour accumuler les caractères en cours de lecture
    private tamponTexte: string = '';

    // Variables pour stocker les données de la balise en cours d'analyse
    private nomBaliseCourante: string = '';
    private attributsCourants: Record<string, string> = {};
    private nomAttributCourant: string = '';
    private guillemetAttribut: string = '';
    private estAutoFermante: boolean = false;

    /**
     * Processes a chunk of XML data and returns the extracted tokens.
     * State is preserved between chunks, making it ideal for streaming.
     * 
     * @param chunk - A string chunk of XML data.
     * @returns An array of parsed XML tokens.
     */
    public tokenize(chunk: string): XmlToken[]
    {
        const jetons: XmlToken[] = [];

        for (let i = 0; i < chunk.length; i++)
        {
            const caractere = chunk[i];

            switch (this.etatCourant)
            {

                case EtatLexer.TEXTE:
                    if (caractere === '<')
                    {
                        // On a fini de lire du texte, on émet le jeton Texte s'il n'est pas vide
                        if (this.tamponTexte.trim().length > 0)
                        {
                            jetons.push({ type: 'Text', value: this.tamponTexte.trim() });
                        }
                        this.tamponTexte = '';
                        this.etatCourant = EtatLexer.BALISE_OUVERTE;
                    } 
                    else
                    {
                        this.tamponTexte += caractere;
                    }
                    break;

                case EtatLexer.BALISE_OUVERTE:
                    if (caractere === '/')
                    {
                        this.etatCourant = EtatLexer.BALISE_FERMANTE;
                        this.nomBaliseCourante = '';
                    } 
                    else if (caractere === '?' || caractere === '!')
                    {
                        this.etatCourant = EtatLexer.COMMENTAIRE_OU_DECLARATION;
                        this.tamponTexte = caractere;
                    } 
                    else
                    {
                        this.etatCourant = EtatLexer.NOM_BALISE;
                        this.nomBaliseCourante = caractere;
                        this.attributsCourants = {};
                        this.estAutoFermante = false;
                    }
                    break;

                case EtatLexer.NOM_BALISE:
                    if (caractere === ' ' || caractere === '\n' || caractere === '\t')
                    {
                        this.etatCourant = EtatLexer.NOM_ATTRIBUT;
                        this.nomAttributCourant = '';
                    } 
                    else if (caractere === '/')
                    {
                        this.estAutoFermante = true;
                    } 
                    else if (caractere === '>')
                    {
                        jetons.push(this.creerJetonOuverture());
                        this.etatCourant = EtatLexer.TEXTE;
                        this.tamponTexte = '';
                    } 
                    else
                    {
                        this.nomBaliseCourante += caractere;
                    }
                    break;

                case EtatLexer.NOM_ATTRIBUT:
                    if (caractere === '=')
                    {
                        this.etatCourant = EtatLexer.RECHERCHE_EGAL;
                    } 
                    else if (caractere === '/')
                    {
                        this.estAutoFermante = true;
                    } 
                    else if (caractere === '>')
                    {
                        jetons.push(this.creerJetonOuverture());
                        this.etatCourant = EtatLexer.TEXTE;
                        this.tamponTexte = '';
                    } 
                    else if (caractere !== ' ' && caractere !== '\n' && caractere !== '\t')
                    {
                        this.nomAttributCourant += caractere;
                    }
                    break;

                case EtatLexer.RECHERCHE_EGAL:
                    if (caractere === '"' || caractere === "'")
                    {
                        this.guillemetAttribut = caractere;
                        this.etatCourant = EtatLexer.VALEUR_ATTRIBUT;
                        this.tamponTexte = ''; // On réutilise le tampon pour la valeur
                    }
                    break;

                case EtatLexer.VALEUR_ATTRIBUT:
                    if (caractere === this.guillemetAttribut)
                    {
                        this.attributsCourants[this.nomAttributCourant] = this.tamponTexte;
                        this.nomAttributCourant = '';
                        this.tamponTexte = '';
                        this.etatCourant = EtatLexer.NOM_ATTRIBUT;
                    } 
                    else
                    {
                        this.tamponTexte += caractere;
                    }
                    break;

                case EtatLexer.BALISE_FERMANTE:
                    if (caractere === '>')
                    {
                        jetons.push({ type: 'CloseTag', name: this.nomBaliseCourante });
                        this.nomBaliseCourante = '';
                        this.etatCourant = EtatLexer.TEXTE;
                    } 
                    else if (caractere !== ' ')
                    {
                        this.nomBaliseCourante += caractere;
                    }
                    break;

                case EtatLexer.COMMENTAIRE_OU_DECLARATION:
                    this.tamponTexte += caractere;
                    
                    // 1. Détection de l'ouverture d'un bloc CDATA
                    if (this.tamponTexte === '![CDATA[')
                    {
                        this.etatCourant = EtatLexer.CDATA;
                        this.tamponTexte = '';
                    }
                    // 2. Détection de la fin d'un commentaire <!-- ... -->
                    else if (this.tamponTexte.startsWith('!--') && this.tamponTexte.endsWith('-->'))
                    {
                        this.etatCourant = EtatLexer.TEXTE;
                        this.tamponTexte = '';
                    }
                    // 3. Détection de la fin d'une déclaration <?xml ... ?>
                    else if (this.tamponTexte.startsWith('?') && this.tamponTexte.endsWith('?>'))
                    {
                        this.etatCourant = EtatLexer.TEXTE;
                        this.tamponTexte = '';
                    }
                    // 4. Détection de la fin d'un DOCTYPE <!DOCTYPE ... >
                    else if (caractere === '>' && !this.tamponTexte.startsWith('!--') && !this.tamponTexte.startsWith('!['))
                    {
                        this.etatCourant = EtatLexer.TEXTE;
                        this.tamponTexte = '';
                    }
                    break;

                case EtatLexer.CDATA:
                    this.tamponTexte += caractere;
                    
                    // On attend la séquence de fermeture stricte du CDATA
                    if (this.tamponTexte.endsWith(']]>'))
                    {
                        // On extrait tout sauf les 3 derniers caractères (]]>)
                        const contenuCData = this.tamponTexte.slice(0, -3);
                        
                        // On émet un jeton Texte, comme si c'était du texte classique
                        if (contenuCData.length > 0)
                            jetons.push({ type: 'Text', value: contenuCData });
                        
                        this.etatCourant = EtatLexer.TEXTE;
                        this.tamponTexte = '';
                    }
                    break;
            }
        }

        return jetons;
    }

    /**
     * Fonction utilitaire pour générer le jeton final de balise ouvrante.
     */
    private creerJetonOuverture(): XmlToken
    {
        const jeton: XmlToken = {
            type: 'OpenTag',
            name: this.nomBaliseCourante,
            attributes: { ...this.attributsCourants },
            isSelfClosing: this.estAutoFermante
        };
        // Si la balise est auto-fermante (<Tag/>), le parser aura besoin de savoir
        // qu'il ne doit pas chercher d'enfants pour cette balise.
        return jeton;
    }
}