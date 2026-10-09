# xml-airstream

*[Read this documentation in English](./README.md)*

XML Airstream est un parseur, sérialiseur et ODM (Object-Document Mapper) XML asynchrone ultra-rapide et orienté flux pour TypeScript et JavaScript.  

Il permet de transformer des flux ou des fichiers XML complexes directement en instances de classes fortement typées, et inversement, grâce à un système de décorateurs moderne et performant.

## Sommaire

## Pourquoi choisi xml-airstream ?
- **Orienté Flux (Streaming)** : Conçu pour traiter des fichiers XML volumineux sans saturer la mémoire RAM.
- **Décorateurs Natifs (TS 5.0+)** : Utilise la norme moderne `Symbol.metadata` sans dépendance lourde tierce (type `reflect-metadata`).
- **Mappage Complet** : Gère les attributs, les éléments imbriqués, les tableaux, les sections CDATA, les valeurs textuelles mixtes et les types complexes (`Date`, `boolean`, `number`).
- Conversion personnalisable : Permet de définir ses propres règles de conversion (ex: booléens en français `"oui"`, formats de dates personnalisés).

## Installation

```bash
npm install @jetonpeche/xml-airstream
```
*(Assurez-vous d'utiliser TypeScript 5.0 ou supérieur avec target: "es2022" ou supérieur).*

## Démarrage rapide

```ts
import { Xml, XmlRoot, XmlElement, XmlAttribute } from 'xml-airstream';

@XmlRoot('User')
class User 
{
    @XmlAttribute('id')
    public id: number = 0;

    @XmlElement('FullName')
    public name: string = '';
}

async function run() 
{
    const xml = `<User id="42"><FullName>Jean Dupont</FullName></User>`;
    
    // Parsing (XML -> Objet)
    const user = await Xml.parse(Buffer.from(xml), User);
    console.log(user instanceof User); // true
    console.log(user.name); // "Jean Dupont"
    console.log(user.id);   // 42 (converti automatiquement en nombre)

    // Sérialisation (Objet -> XML)
    const xmlOutput = Xml.stringify(user, { format: true });
    console.log(xmlOutput);
}

run();
```

## Exemple Avancé (Cas d'usage complexes)

Cet exemple met en œuvre des structures imbriquées, des listes enveloppées (`@XmlArray`), des attributs combinés à du texte (`@XmlValue`), du code protégé (`@XmlCData`), et des exclusions (`@XmlIgnore`).

```ts
import { 
    Xml, XmlRoot, XmlElement, XmlAttribute, 
    XmlArray, XmlValue, XmlCData, XmlIgnore 
} from 'xml-airstream';

class Price {
    @XmlAttribute('currency')
    public currency: string = 'EUR';

    @XmlValue()
    public amount: number = 0;
}

class Item {
    @XmlElement('Title')
    public title: string = '';

    @XmlElement('Description')
    @XmlCData() // Protège les balises HTML ou caractères spéciaux
    public description: string = '';
}

@XmlRoot('Order')
class Order {
    @XmlAttribute('id')
    public id: number = 0;

    @XmlElement('OrderDate')
    public date: Date = new Date();

    @XmlElement('IsExpress')
    public isExpress: boolean = false;

    @XmlElement('Total')
    public total: Price = new Price();

    // Liste avec balise conteneur <Items><Product>...</Product></Items>
    @XmlArray({
        rootName: 'Items',
        itemName: 'Product',
        itemType: Item
    })
    public items: Item[] = [];

    @XmlIgnore()
    public internalId: string = 'SECRET_123'; // Ignoré à l'export/import
}

async function runAdvanced() 
{
    const xmlData = `
        <Order id="1001">
            <OrderDate>2026-06-01T12:00:00Z</OrderDate>
            <IsExpress>OUI</IsExpress>
            <Total currency="USD">149.99</Total>
            <Items>
                <Product>
                    <Name>Livre TypeScript</Name>
                    <Description><![CDATA[Livre <b>avancé</b> pour dev web.]]></Description>
                </Product>
            </Items>
        </Order>
    `;

    // Parsing avec configuration des booléens personnalisés (ex: "OUI")
    const order = await Xml.parse(Buffer.from(xmlData), Order, {
        trueValues: ['oui', 'yes', '1', 'vrai']
    });

    console.dir(order, { depth: null });

    // Sérialisation inverse
    const backToXml = Xml.stringify(order, { format: true });
    console.log(backToXml);
}

runAdvanced();
```

## Methodes

| Nom | Description |
|:--- |:--- |
| `Xml.parse(input, targetClass, options?)` | Désérialise un flux ou un buffer XML directement vers une instance de classe fortement typée. |
| `Xml.stringify(instance, options?)` | Sérialise une instance de classe décorée en chaîne de caractères XML. |
| `Xml.toJson(input, options?)` | Convertit un flux ou un buffer XML brut en un objet JSON (AST) léger. |
| `Xml.fromJson(json, rootName, options?)` | Convertit un objet JSON simple en chaîne XML en l'enveloppant dans une balise racine. |
| `Xml.saveToFile(instance, path, options?)` | Sérialise un objet en XML et l'écrit directement sur le système de fichiers local (Node.js/Bun). |
| `Xml.sendToApi(instance, endpoint, options?)` | Sérialise un objet en XML et l'envoie via une requête HTTP POST (ou personnalisée) vers une API distante. |
| `Xml.toResponse(instance, options?)` | Génère une `Response` HTTP Web standard prête à l'emploi (idéal pour Next.js, Bun, serveurs web natifs). |

## Décorateurs

| Nom | Cible | Description |
|:--- |:--- |:--- |
| `@XmlRoot(name)` | `Classe` | Définit le nom de la balise racine XML associée à la classe. |
| `@XmlElement(nameOrOptions)` | `Propriété` | Mappe une propriété à une balise enfant (accepte un nom string ou `{ name, type }`). |
| `@XmlAttribute(name)` | `Propriété` | Mappe une propriété de classe vers un attribut XML de la balise parente. |
| `@XmlArray(options)` | `Propriété` | Gère les listes de type `Tableau[]` avec option de balise parente (`rootName`) et d'élément (`itemName`). |
| `@XmlValue()` | `Propriété` | Récupère le texte brut d'une balise possédant également des attributs. |
| `@XmlCData()` | `Propriété` | Enveloppe la chaîne dans un bloc `<![CDATA[ ... ]]>` (désactive l'échappement XML).
| `@XmlIgnore()` | `Propriété` | Ignore complètement la propriété lors du parsing et de la sérialisation. |

## Options de Configuration (`xmlOptions`)

Lors de l'appel à `Xml.parse(input, TargetClass, options)` ou `Xml.stringify(instance, options)`, vous pouvez passer les options suivantes :
- `format?: boolean` : Si `true`, indente le XML généré avec des retours à la ligne (Pretty Print).
- `ignoreAttributes?: boolean` : Ignore tous les attributs XML lors du parsing.
- `trueValues?: string[]` : Tableau de chaînes de caractères reconnues comme `true` pour les propriétés de type `boolean` (par défaut : `['true', '1']`).

## Notes pour les Développeurs Expérimentés (Technique)

### 1. Implémentation sous le capot (TypeScript 5.0+ Decorators)
Contrairement aux anciennes versions de TypeScript (qui dépendaient du drapeau expérimental `experimentalDecorators` et de la librairie externe `reflect-metadata`), cette librairie s'appuie entièrement sur la Stage 3 Decorators API et la proposition ECMAScript `Symbol.metadata`.

- **Stockage décentralisé**: Les métadonnées sont injectées directement dans l'objet `context.metadata` fourni par le runtime du décorateur de classe/propriété. Cela évite les fuites de mémoire et les collisions de clés globales.

- **Typage strict** : Les signatures de décorateurs exigent le paramètre `value: undefined` pour les champs de classe (Field Decorators), conformément aux spécifications ECMAScript actuelles.

### 2. Performance du Moteur (Lexer & Stringifier)

- **Lexer à états finis (State Machine)** : Le flux XML est analysé caractère par caractère via un automate à états (`EtatLexer`), garantissant une complexité linéaire *O(n)* sans surconsommation de mémoire liée aux expressions régulières complexes.

- **Chunking de chaînes** : Le `Stringifier` n'utilise pas la concaténation de chaînes récursive basique (qui crée de nombreux objets en mémoire), mais accumule des fragments dans un tableau de chaînes (`string[]`) avant un unique appel à `.join('')`, optimisant drastiquement le Garbage Collector (GC) sous Node.js pour de gros volumes de données.