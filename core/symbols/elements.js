
/**
 * Elements, Places, Objects, and Abstract Concepts
 * 
 * Fundamental symbols for natural elements, locations, tools,
 * and abstract ideas that form the universal vocabulary of
 * human symbolic expression.
 */

import { SymbolCategory } from './base.js';

const elementSymbols = [
  // ═══════════════════════════════════════════════════════════════════
  // NATURAL ELEMENTS
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'fire',
    unicode: '🔥',
    category: SymbolCategory.NATURAL_ELEMENTS,
    meaning: 'Fire - The transformative element that consumes and purifies. Fire represents passion, destruction, illumination, and the divine spark of consciousness. It rises upward, seeking heaven; it spreads without boundaries; it transforms everything it touches irreversibly. Fire is the first technology, the original magic that separated humans from beasts. Prometheus\'s gift and burden.',
    culturalTags: ['universal', 'element', 'transformation', 'energy', 'passion', 'destruction']
  },
  {
    id: 'water',
    unicode: '💧',
    category: SymbolCategory.NATURAL_ELEMENTS,
    meaning: 'Water - The flowing element that takes the shape of its container while wearing away the hardest stone. Water represents emotion, the unconscious, purification, and the source of all life. It falls from heaven, pools in the depths, rises as mist. Water is the blood of the earth, the tears of the sky, the cleansing force that dissolves all boundaries.',
    culturalTags: ['universal', 'element', 'emotion', 'life', 'purification', 'flow']
  },
  {
    id: 'earth_element',
    unicode: '🌍',
    category: SymbolCategory.NATURAL_ELEMENTS,
    meaning: 'Earth - The solid element that provides foundation, stability, and material manifestation. Earth represents the body, practical matters, patience, and the slow cycles of growth and decay. Everything comes from earth and returns to it; we are made of dust and to dust return. Earth is the mother that births, sustains, and receives back all things.',
    culturalTags: ['universal', 'element', 'stability', 'material', 'body', 'foundation']
  },
  {
    id: 'air',
    unicode: '💨',
    category: SymbolCategory.NATURAL_ELEMENTS,
    meaning: 'Air - The invisible element of breath, thought, and communication. Air represents mind, intellect, the word that travels between persons, and the spirit that animates the body. We swim in air without noticing; yet without it, we perish in moments. Air carries sound, scent, seeds, and souls. The pneuma, the ruach, the breath of life.',
    culturalTags: ['universal', 'element', 'thought', 'breath', 'communication', 'spirit']
  },
  {
    id: 'ether',
    unicode: '✨',
    category: SymbolCategory.NATURAL_ELEMENTS,
    meaning: 'Ether/Aether/Akasha - The fifth element, the space in which the other four manifest. Ether represents spirit, the void pregnant with possibility, the record of all that has been. In Hindu thought, akasha; in Greek philosophy, aether; in modern metaphysics, the field of consciousness itself. The nothing that contains everything.',
    culturalTags: ['universal', 'element', 'spirit', 'void', 'consciousness', 'quintessence']
  },
  {
    id: 'sun',
    unicode: '☀️',
    category: SymbolCategory.NATURAL_ELEMENTS,
    meaning: 'Sun - The source of light, warmth, and life on Earth. Across all cultures, the sun represents consciousness, truth, divine power, and the masculine principle. The sun\'s daily death and resurrection taught humanity that endings lead to beginnings. Solar deities rule pantheons: Ra, Apollo, Surya, Tonatiuh. The sun discriminates, illuminates, and reveals.',
    culturalTags: ['universal', 'celestial', 'light', 'consciousness', 'masculine', 'divine']
  },
  {
    id: 'moon',
    unicode: '🌙',
    category: SymbolCategory.NATURAL_ELEMENTS,
    meaning: 'Moon - The gentle light of reflection, ruler of tides and cycles. The moon represents the feminine principle, intuition, dreams, and the unconscious depths. Its phases taught humanity to count time; its pull moves the waters of Earth and the waters within us. Luna, Selene, Chang\'e—the moon goddess welcomes the soul\'s night journey.',
    culturalTags: ['universal', 'celestial', 'cycles', 'feminine', 'intuition', 'reflection']
  },
  {
    id: 'stars',
    unicode: '⭐',
    category: SymbolCategory.NATURAL_ELEMENTS,
    meaning: 'Stars - The eternal fires that puncture the darkness, revealing infinity beyond our world. Stars represent guidance, destiny, the souls of the dead, and the vast mystery of existence. Sailors navigated by stars; astrologers read fate in their patterns; dreamers wished upon them. Each star a sun, each sun perhaps circled by lives we\'ll never know.',
    culturalTags: ['universal', 'celestial', 'guidance', 'destiny', 'mystery', 'eternity']
  },
  {
    id: 'thunder',
    unicode: '⚡',
    category: SymbolCategory.NATURAL_ELEMENTS,
    meaning: 'Thunder/Lightning - The sky\'s explosive speech, the fire that falls from heaven. Thunder represents divine power, sudden revelation, and the force that shatters complacency. Zeus hurled thunderbolts; Thor swung Mjölnir; the Buddha\'s first teaching was the thunderbolt that shatters illusion. When the sky speaks, everything listens.',
    culturalTags: ['universal', 'celestial', 'power', 'revelation', 'divine', 'awakening']
  },
  {
    id: 'rain',
    unicode: '🌧️',
    category: SymbolCategory.NATURAL_ELEMENTS,
    meaning: 'Rain - The sky\'s gift to earth, the water that falls to make life possible. Rain represents blessing, fertility, purification, and renewal. Without rain, the land dies; with too much, it drowns. Rain dances, rain prayers, rain gods—humanity\'s oldest negotiation with nature. Each drop completes the cycle: ocean, cloud, rain, river, ocean.',
    culturalTags: ['universal', 'weather', 'blessing', 'fertility', 'renewal', 'cycle']
  },
  {
    id: 'wind',
    unicode: '🌬️',
    category: SymbolCategory.NATURAL_ELEMENTS,
    meaning: 'Wind - The invisible force that moves visible things, the breath of the world. Wind represents change, spirit, the transmission of influence across distances. The wind blows where it will; no one knows where it comes from or where it goes. It carries seeds, scatters leaves, and reminds us that the invisible shapes the visible.',
    culturalTags: ['universal', 'weather', 'change', 'spirit', 'invisible', 'movement']
  },
  {
    id: 'storm',
    unicode: '🌪️',
    category: SymbolCategory.NATURAL_ELEMENTS,
    meaning: 'Storm - The convergence of forces into chaos, the weather that humbles humanity. Storms represent crisis, transformation, the breaking down of normal order to enable new creation. The still center of the cyclone; the clarity after the tempest; the fear that sharpens attention—storms teach that destruction and creation are inseparable.',
    culturalTags: ['universal', 'weather', 'chaos', 'crisis', 'transformation', 'power']
  },
  {
    id: 'rainbow',
    unicode: '🌈',
    category: SymbolCategory.NATURAL_ELEMENTS,
    meaning: 'Rainbow - The arc of color that bridges sky and earth after the storm. The rainbow represents hope, promise, divine covenant, and the beauty born from opposition of sun and rain. In many cultures, the rainbow bridge connects worlds; in Genesis, it seals God\'s promise. The rainbow shows all colors unified—division resolved into spectrum.',
    culturalTags: ['universal', 'weather', 'hope', 'promise', 'bridge', 'unity']
  },
  {
    id: 'tree',
    unicode: '🌳',
    category: SymbolCategory.NATURAL_ELEMENTS,
    meaning: 'Tree - The axis mundi connecting underground, surface, and sky. The tree represents life, growth, connection between worlds, and the family across generations. Roots in darkness, trunk in air, branches reaching for light—the tree models the full range of existence. Yggdrasil, the Bodhi Tree, the Tree of Life, the World Tree—all embody this cosmic connector.',
    culturalTags: ['universal', 'flora', 'growth', 'connection', 'life', 'axis_mundi']
  },
  {
    id: 'flower',
    unicode: '🌺',
    category: SymbolCategory.NATURAL_ELEMENTS,
    meaning: 'Flower - The gift of transient beauty, the plant\'s reproductive offering to the world. Flowers represent beauty, impermanence, the bloom of youth, and nature\'s extravagant generosity. The lotus rises from mud; the rose has thorns; cherry blossoms fall too soon. Every flower is a teaching on the marriage of beauty and mortality.',
    culturalTags: ['universal', 'flora', 'beauty', 'impermanence', 'offering', 'growth']
  },
  {
    id: 'stone',
    unicode: '🪨',
    category: SymbolCategory.NATURAL_ELEMENTS,
    meaning: 'Stone - The mineral that endures while organic life comes and goes. Stone represents permanence, foundation, and the condensed wisdom of deep time. Standing stones mark sacred places; philosophers\' stones transform base metal to gold; stones of remembrance outlast the dead. The stone is patient; it was here before us and will remain after.',
    culturalTags: ['universal', 'mineral', 'permanence', 'foundation', 'endurance', 'sacred']
  },
  {
    id: 'gold',
    unicode: '🏅',
    category: SymbolCategory.NATURAL_ELEMENTS,
    meaning: 'Gold - The incorruptible metal that doesn\'t tarnish, the sun made solid. Gold represents purity, value, spiritual attainment, and the goal of alchemical transformation. Gold is the final product of the Great Work, the enlightened state, the treasure hard to obtain. Its beauty is eternal; its worth is agreed upon; its rarity makes it precious.',
    culturalTags: ['universal', 'mineral', 'value', 'purity', 'alchemy', 'solar']
  },
  {
    id: 'silver',
    unicode: '🥈',
    category: SymbolCategory.NATURAL_ELEMENTS,
    meaning: 'Silver - The moon\'s metal, the reflective surface that mirrors and receives. Silver represents intuition, the feminine principle, the receptive mode of consciousness. Silver mirrors show true reflection; silver bullets kill werewolves; silver linings edge dark clouds. Where gold radiates, silver reflects—lunar wisdom complementing solar truth.',
    culturalTags: ['universal', 'mineral', 'reflection', 'lunar', 'feminine', 'intuition']
  }
];

const placeSymbols = [
  // ═══════════════════════════════════════════════════════════════════
  // PLACES & LOCATIONS
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'mountain',
    unicode: '⛰️',
    category: SymbolCategory.PLACES_LOCATIONS,
    meaning: 'Mountain - The peak that approaches heaven, where earth aspires to touch sky. Mountains represent spiritual aspiration, challenge, transcendence, and the encounter with the divine. Moses received commandments on Sinai; the Buddha achieved enlightenment on peaks; Olympus housed the gods. The mountain is the goal that demands everything to reach.',
    culturalTags: ['universal', 'landscape', 'aspiration', 'transcendence', 'sacred', 'challenge']
  },
  {
    id: 'ocean',
    unicode: '🌊',
    category: SymbolCategory.PLACES_LOCATIONS,
    meaning: 'Ocean - The vast waters from which life emerged and to which it returns. The ocean represents the unconscious, the collective memory, infinite possibility, and the primal source. Homer\'s wine-dark sea; Jung\'s oceanic unconscious; the waters of chaos before creation. We emerged from the sea and carry it within—salt in blood and tears.',
    culturalTags: ['universal', 'landscape', 'unconscious', 'source', 'infinity', 'primal']
  },
  {
    id: 'forest',
    unicode: '🌲',
    category: SymbolCategory.PLACES_LOCATIONS,
    meaning: 'Forest - The wild place where civilization ends and mystery begins. The forest represents the unconscious, danger, transformation, and the testing ground of the hero. Red Riding Hood\'s woods; Dante\'s dark forest; the grove where initiates die to old selves. The forest is where you get lost in order to find yourself.',
    culturalTags: ['universal', 'landscape', 'wilderness', 'unconscious', 'mystery', 'initiation']
  },
  {
    id: 'desert',
    unicode: '🏜️',
    category: SymbolCategory.PLACES_LOCATIONS,
    meaning: 'Desert - The empty place where nothing hides and survival requires everything. The desert represents testing, purification, simplicity, and the stripping away of illusion. Jesus\' forty days; the Israelites\' forty years; the hermit\'s retreat. In the desert, there is only you and the absolute—no distractions, no excuses, no escape.',
    culturalTags: ['universal', 'landscape', 'testing', 'purification', 'emptiness', 'revelation']
  },
  {
    id: 'cave',
    unicode: '🕳️',
    category: SymbolCategory.PLACES_LOCATIONS,
    meaning: 'Cave - The womb of the earth, the entrance to the underworld, the place of origin and return. The cave represents the unconscious depths, initiation, rebirth, and hidden treasure. Plato\'s cave shadows; the hero\'s descent for treasure; the shaman\'s journey underground. The cave is where you go when you must die to be reborn.',
    culturalTags: ['universal', 'landscape', 'depth', 'unconscious', 'rebirth', 'initiation']
  },
  {
    id: 'river',
    unicode: '〰️',
    category: SymbolCategory.PLACES_LOCATIONS,
    meaning: 'River - The flowing boundary between territories, the path of least resistance. The river represents time, transition, purification, and the journey of life. Heraclitus\'s river you can\'t step into twice; the Ganges that washes away karma; the Styx between life and death. Rivers flow one direction—toward the sea, toward the end, toward unity.',
    culturalTags: ['universal', 'landscape', 'time', 'transition', 'flow', 'boundary']
  },
  {
    id: 'temple',
    unicode: '⛩️',
    category: SymbolCategory.PLACES_LOCATIONS,
    meaning: 'Temple - The house of the divine, the sacred space set apart from profane life. The temple represents the meeting of human and divine, formal worship, and the architecture of belief. Every temple is a model of the cosmos; to enter is to step out of ordinary time into eternal presence. The temple is where heaven and earth touch.',
    culturalTags: ['universal', 'sacred', 'divine', 'worship', 'cosmos', 'threshold']
  },
  {
    id: 'palace',
    unicode: '🏰',
    category: SymbolCategory.PLACES_LOCATIONS,
    meaning: 'Palace - The house of earthly power, where rulers dwell and fates are decided. The palace represents authority, wealth, civilization\'s pinnacle, and the responsibilities of power. Within palace walls, histories turn; from palace gates, decrees emerge. The palace is the center from which order radiates—or from which tyranny spreads.',
    culturalTags: ['universal', 'architecture', 'power', 'authority', 'wealth', 'rule']
  },
  {
    id: 'tower',
    unicode: '🗼',
    category: SymbolCategory.PLACES_LOCATIONS,
    meaning: 'Tower - The structure that reaches upward, asserting human ambition against the sky. The tower represents aspiration, isolation, imprisonment, and the hubris of overreach. Babel\'s tower confounded languages; Rapunzel\'s tower imprisoned beauty; the ivory tower separates thinker from world. Towers rise high and fall hard.',
    culturalTags: ['universal', 'architecture', 'aspiration', 'isolation', 'hubris', 'vision']
  },
  {
    id: 'bridge',
    unicode: '🌉',
    category: SymbolCategory.PLACES_LOCATIONS,
    meaning: 'Bridge - The structure that connects what was separate, spanning the abyss. The bridge represents transition, connection, mediation, and the overcoming of obstacles. The rainbow bridge to Valhalla; the bridge over troubled water; the bridge between cultures or ideas. Building bridges is humanity\'s response to division.',
    culturalTags: ['universal', 'architecture', 'connection', 'transition', 'mediation', 'crossing']
  },
  {
    id: 'crossroads',
    unicode: '✖️',
    category: SymbolCategory.PLACES_LOCATIONS,
    meaning: 'Crossroads - The point where paths intersect, where decisions must be made. The crossroads represents choice, transition, liminality, and the presence of fate. Hecate haunts the crossroads; Robert Johnson sold his soul there; travelers pause to choose their way. At the crossroads, the future branches into possibility.',
    culturalTags: ['universal', 'landscape', 'choice', 'fate', 'transition', 'liminal']
  },
  {
    id: 'labyrinth',
    unicode: '🌀',
    category: SymbolCategory.PLACES_LOCATIONS,
    meaning: 'Labyrinth - The complex path that leads inward to the center and the mystery. The labyrinth represents the journey of initiation, the complexity of the soul, and the transformative passage through confusion to clarity. Unlike a maze, the labyrinth has one path—trust the process. Theseus entered; Ariadne\'s thread led out. The goal is the center.',
    culturalTags: ['universal', 'sacred', 'journey', 'initiation', 'complexity', 'transformation']
  },
  {
    id: 'underworld',
    unicode: '☠️',
    category: SymbolCategory.PLACES_LOCATIONS,
    meaning: 'Underworld - The realm beneath, where the dead dwell and hidden treasures lie. The underworld represents the unconscious, death, transformation, and the source of renewal. Orpheus descended for Eurydice; Persephone rules half the year; the shaman journeys to retrieve lost souls. What goes down must come up, transformed.',
    culturalTags: ['universal', 'mythic', 'death', 'unconscious', 'transformation', 'descent']
  },
  {
    id: 'heaven',
    unicode: '☁️',
    category: SymbolCategory.PLACES_LOCATIONS,
    meaning: 'Heaven - The realm above, where gods dwell and blessed souls aspire to reach. Heaven represents transcendence, perfection, divine presence, and the goal of spiritual striving. Many heavens, many paths there: ascension, redemption, enlightenment, grace. Heaven is the promise that suffering ends, that good is rewarded, that love endures.',
    culturalTags: ['universal', 'mythic', 'divine', 'transcendence', 'afterlife', 'aspiration']
  },
  {
    id: 'path',
    unicode: '🛤️',
    category: SymbolCategory.PLACES_LOCATIONS,
    meaning: 'Path - The way that leads somewhere, the track worn by previous travelers. The path represents journey, direction, tradition, and the route laid down by those who came before. The Tao is literally "the Way"; Buddhist teachings offer paths to liberation; life itself is often called a path. To find your path is to find your purpose; to walk it is to live authentically.',
    culturalTags: ['universal', 'landscape', 'journey', 'direction', 'tradition', 'purpose']
  },
  {
    id: 'garden',
    unicode: '🌷',
    category: SymbolCategory.PLACES_LOCATIONS,
    meaning: 'Garden - The cultivated space where nature and human intention meet. The garden represents paradise, cultivation, the integration of wild nature with conscious design. Eden was a garden; Persian gardens modeled heaven; Zen gardens embody enlightened mind. The garden shows what grows when we tend carefully—beauty from effort, order from chaos, abundance from patience.',
    culturalTags: ['universal', 'landscape', 'cultivation', 'paradise', 'beauty', 'harmony']
  }
];

const objectSymbols = [
  // ═══════════════════════════════════════════════════════════════════
  // OBJECTS & TOOLS
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'sword',
    unicode: '🗡️',
    category: SymbolCategory.OBJECTS_TOOLS,
    meaning: 'Sword - The weapon that discriminates, that separates with precision. The sword represents truth that cuts through illusion, justice that decides, and the power that defends. Excalibur chose kings; the sword of Damocles warned; the Buddha\'s sword of wisdom cuts ignorance. The sword is language sharpened to edge—it creates division that clarifies.',
    culturalTags: ['universal', 'weapon', 'truth', 'justice', 'discrimination', 'power']
  },
  {
    id: 'shield',
    unicode: '🛡️',
    category: SymbolCategory.OBJECTS_TOOLS,
    meaning: 'Shield - The defense that protects, that receives blows meant for the vital center. The shield represents protection, boundaries, the preservation of what is precious. Where the sword attacks, the shield defends. The shield bears identity—coats of arms, insignia, symbols. To lower the shield is to become vulnerable; to raise it, to declare readiness.',
    culturalTags: ['universal', 'weapon', 'protection', 'defense', 'identity', 'boundary']
  },
  {
    id: 'key',
    unicode: '🔑',
    category: SymbolCategory.OBJECTS_TOOLS,
    meaning: 'Key - The instrument that opens what was closed, that grants access to hidden spaces. The key represents knowledge, initiation, solution, and the power to unlock secrets. Peter holds the keys to heaven; keys unlock treasure chests; master keys open all doors. Finding the key is finding the answer; turning it is transformation.',
    culturalTags: ['universal', 'tool', 'access', 'knowledge', 'secret', 'solution']
  },
  {
    id: 'mirror',
    unicode: '🪞',
    category: SymbolCategory.OBJECTS_TOOLS,
    meaning: 'Mirror - The surface that reflects truth, that shows what is really there. The mirror represents self-knowledge, truth, vanity, and the difficult task of seeing oneself clearly. The magic mirror reveals; the lake mirror drowns Narcissus; the mirror of the mind reflects thoughts. To face the mirror honestly is the first step of transformation.',
    culturalTags: ['universal', 'tool', 'truth', 'reflection', 'self-knowledge', 'vision']
  },
  {
    id: 'book',
    unicode: '📕',
    category: SymbolCategory.OBJECTS_TOOLS,
    meaning: 'Book - The repository of knowledge, the voice that speaks across time. The book represents wisdom, tradition, authority, and the preservation of thought beyond death. The Book of Life records souls; the Book of the Dead guides them; sacred books carry divine word. To open a book is to enter another mind; to write one, to offer yours.',
    culturalTags: ['universal', 'tool', 'knowledge', 'wisdom', 'tradition', 'preservation']
  },
  {
    id: 'scroll',
    unicode: '📜',
    category: SymbolCategory.OBJECTS_TOOLS,
    meaning: 'Scroll - The rolled manuscript, ancient form of recorded knowledge. The scroll represents ancient wisdom, sacred teaching, hidden knowledge, and the authority of the written word. Scrolls were unrolled to reveal their secrets; the Dead Sea Scrolls preserved truths; Torah scrolls are venerated. The scroll connects us to what was written long ago.',
    culturalTags: ['universal', 'tool', 'wisdom', 'ancient', 'sacred', 'written']
  },
  {
    id: 'candle',
    unicode: '🕯️',
    category: SymbolCategory.OBJECTS_TOOLS,
    meaning: 'Candle - The small light that defies darkness, that consumes itself to illuminate. The candle represents hope, knowledge, spirit, and the precious fragility of consciousness. A single candle illuminates a room; a candle in the wind threatens to go out; birthday candles carry wishes. The candle reminds us that light costs—something must burn.',
    culturalTags: ['universal', 'tool', 'light', 'hope', 'spirit', 'sacrifice']
  },
  {
    id: 'chalice',
    unicode: '🍷',
    category: SymbolCategory.OBJECTS_TOOLS,
    meaning: 'Chalice - The sacred cup that holds the drink of transformation. The chalice represents communion, the divine feminine, the container of grace. The Holy Grail held Christ\'s blood; the chalice receives wine that becomes sacred; the cup of Jamshid showed all the world. The chalice is the vessel that makes ordinary drink extraordinary.',
    culturalTags: ['universal', 'tool', 'sacred', 'communion', 'feminine', 'transformation']
  },
  {
    id: 'ring',
    unicode: '💍',
    category: SymbolCategory.OBJECTS_TOOLS,
    meaning: 'Ring - The endless circle worn on the body, symbol of unbroken connection. The ring represents bond, covenant, power, and the cycles of eternity. Wedding rings bind lovers; the One Ring corrupts; Solomon\'s ring commanded spirits. The ring has no beginning and no end—wearing it is participating in infinity.',
    culturalTags: ['universal', 'tool', 'bond', 'covenant', 'power', 'eternity']
  },
  {
    id: 'crown',
    unicode: '👑',
    category: SymbolCategory.OBJECTS_TOOLS,
    meaning: 'Crown - The circlet that marks the ruler, the weight of sovereignty made visible. The crown represents authority, divine right, achievement, and the burden of leadership. Crowns are bestowed by gods or peoples; they are won through blood or birth; they are worn with pride and pain. The crown elevates the head that must now see further.',
    culturalTags: ['universal', 'tool', 'authority', 'sovereignty', 'divine_right', 'leadership']
  },
  {
    id: 'hourglass',
    unicode: '⏳',
    category: SymbolCategory.OBJECTS_TOOLS,
    meaning: 'Hourglass - The glass that measures time\'s passage, grain by grain. The hourglass represents mortality, the preciousness of time, and the inevitability of ending. Each grain is a moment falling irreversibly into the past; when the glass empties, time is up. The hourglass reminds us that what we have is limited and slipping away.',
    culturalTags: ['universal', 'tool', 'time', 'mortality', 'measurement', 'impermanence']
  },
  {
    id: 'scale',
    unicode: '⚖️',
    category: SymbolCategory.OBJECTS_TOOLS,
    meaning: 'Scale - The balance that measures equality, that weighs worth against worth. The scale represents justice, judgment, fairness, and the careful weighing of options. Libra holds the scales; Ma\'at weighs hearts; Lady Justice is blindfolded. The scale doesn\'t lie—it shows the true relative weight of things.',
    culturalTags: ['universal', 'tool', 'justice', 'balance', 'judgment', 'fairness']
  }
];

const abstractSymbols = [
  // ═══════════════════════════════════════════════════════════════════
  // ABSTRACT CONCEPTS
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'love',
    unicode: '❤️',
    category: SymbolCategory.ABSTRACT_CONCEPTS,
    meaning: 'Love - The force that binds, that sees the other as precious, that transcends self-interest. Love represents connection, devotion, the foundation of meaning, and the fire that warms without burning. Eros, philia, agape, storge—love takes many forms. Without love, existence is possible but life is not. Love is the yes to another\'s being.',
    culturalTags: ['universal', 'emotion', 'connection', 'devotion', 'meaning', 'relationship']
  },
  {
    id: 'death',
    unicode: '💀',
    category: SymbolCategory.ABSTRACT_CONCEPTS,
    meaning: 'Death - The end that gives life its shape, the limit that creates meaning. Death represents transformation, the unknown, release, and the ultimate teacher. Memento mori—remember you must die. Death is not the opposite of life but part of it; to accept death is to embrace life fully. Every ending enables a beginning.',
    culturalTags: ['universal', 'process', 'transformation', 'ending', 'mystery', 'teacher']
  },
  {
    id: 'transformation',
    unicode: '🦋',
    category: SymbolCategory.ABSTRACT_CONCEPTS,
    meaning: 'Transformation - The radical change from one form to another, the death that leads to rebirth. The butterfly represents transformation: caterpillar dissolves to goo, then emerges as winged beauty. Transformation requires the courage to surrender the known form for unknown possibility. What you become is unrecognizable from what you were.',
    culturalTags: ['universal', 'process', 'change', 'metamorphosis', 'rebirth', 'courage']
  },
  {
    id: 'unity',
    unicode: '☯️',
    category: SymbolCategory.ABSTRACT_CONCEPTS,
    meaning: 'Unity/Yin-Yang - The harmony of opposites that creates wholeness. The yin-yang symbol shows dark containing light and light containing dark—neither exists without the other. Unity represents integration, balance, the transcendence of duality, and the truth that apparent opposites are aspects of one reality. Opposition is relationship.',
    culturalTags: ['universal', 'taoist', 'chinese', 'balance', 'harmony', 'wholeness', 'duality']
  },
  {
    id: 'infinity',
    unicode: '∞',
    category: SymbolCategory.ABSTRACT_CONCEPTS,
    meaning: 'Infinity - The unbounded, the endless, the inconceivable that mathematics nonetheless works with. Infinity represents eternity, unlimited possibility, the beyond that defies imagination. The lemniscate (figure-8) suggests endless cycling; mathematical infinity breaks ordinary intuition. We are finite beings contemplating the infinite—and somehow, we can.',
    culturalTags: ['universal', 'mathematical', 'eternity', 'boundless', 'possibility', 'cosmic']
  },
  {
    id: 'time',
    unicode: '⏰',
    category: SymbolCategory.ABSTRACT_CONCEPTS,
    meaning: 'Time - The stream in which we swim, the dimension we cannot escape. Time represents change, mortality, opportunity, and the arrow pointing from birth to death. Chronos devours his children; Kairos offers the fleeting moment. We never have time—time has us. To spend it wisely is the fundamental human challenge.',
    culturalTags: ['universal', 'fundamental', 'change', 'mortality', 'opportunity', 'dimension']
  },
  {
    id: 'wisdom',
    unicode: '🦉',
    category: SymbolCategory.ABSTRACT_CONCEPTS,
    meaning: 'Wisdom - The understanding that comes from integrating knowledge with experience. The owl represents wisdom: it sees in darkness and turns its head to look behind. Wisdom differs from cleverness—it knows what matters, what lasts, what heals. Wisdom cannot be taught directly; it must be earned through living.',
    culturalTags: ['universal', 'virtue', 'knowledge', 'understanding', 'experience', 'discernment']
  },
  {
    id: 'truth',
    unicode: '✓',
    category: SymbolCategory.ABSTRACT_CONCEPTS,
    meaning: 'Truth - What corresponds to reality, what can be relied upon, what doesn\'t change to suit convenience. Truth represents integrity, reality, the foundation of trust. "The truth shall set you free"—but first it might hurt. Truth is both discovered and revealed; seeking it requires courage because it doesn\'t flatter.',
    culturalTags: ['universal', 'virtue', 'reality', 'integrity', 'foundation', 'revelation']
  },
  {
    id: 'freedom',
    unicode: '🕊️',
    category: SymbolCategory.ABSTRACT_CONCEPTS,
    meaning: 'Freedom - The capacity to choose, to determine one\'s own path, to be unbound by unjust constraint. Freedom represents autonomy, possibility, the human birthright of self-determination. The dove flies where it will; the prisoner dreams of sky. Freedom carries responsibility—what you do with it defines who you are.',
    culturalTags: ['universal', 'value', 'autonomy', 'choice', 'liberation', 'responsibility']
  },
  {
    id: 'courage',
    unicode: '🦁',
    category: SymbolCategory.ABSTRACT_CONCEPTS,
    meaning: 'Courage - The virtue that enables action despite fear, that steps forward when every instinct says retreat. The lion represents courage: heart in the face of danger. Courage is not the absence of fear but the judgment that something else is more important. Every hero\'s journey begins with the courage to leave home.',
    culturalTags: ['universal', 'virtue', 'bravery', 'action', 'fear', 'strength']
  },
  {
    id: 'justice',
    unicode: '⚖️',
    category: SymbolCategory.ABSTRACT_CONCEPTS,
    meaning: 'Justice - The virtue that gives each their due, that restores balance when it has been disturbed. Justice represents fairness, rectification, and the moral order that makes community possible. The scales weigh; the sword decides; the blindfold ensures impartiality. Without justice, society is merely organized force.',
    culturalTags: ['universal', 'virtue', 'fairness', 'balance', 'law', 'morality']
  },
  {
    id: 'chaos',
    unicode: '🌀',
    category: SymbolCategory.ABSTRACT_CONCEPTS,
    meaning: 'Chaos - The primordial state before order, the potential from which all form emerges. Chaos represents disorder, creativity, the breakdown of stagnant structure, and the raw material of new creation. From chaos came cosmos; into chaos, order eventually dissolves. Chaos is not evil—it is the soil in which order grows.',
    culturalTags: ['universal', 'primordial', 'disorder', 'potential', 'creation', 'transformation']
  },
  {
    id: 'order',
    unicode: '📐',
    category: SymbolCategory.ABSTRACT_CONCEPTS,
    meaning: 'Order - The arrangement that makes sense, the pattern that enables function. Order represents structure, predictability, law, and the cosmos (literally "ordered universe"). Order enables cooperation; too much becomes tyranny; too little becomes chaos. The dynamic balance of order and chaos is the dance of existence.',
    culturalTags: ['universal', 'structure', 'pattern', 'law', 'cosmos', 'stability']
  },
  {
    id: 'creation',
    unicode: '✨',
    category: SymbolCategory.ABSTRACT_CONCEPTS,
    meaning: 'Creation - The bringing into being of what did not exist before. Creation represents origination, imagination made manifest, the divine act repeated at every scale. Gods create worlds; artists create works; parents create children; each moment creates the next. To create is to participate in the fundamental nature of reality.',
    culturalTags: ['universal', 'process', 'origination', 'divine', 'imagination', 'birth']
  },
  {
    id: 'destruction',
    unicode: '💥',
    category: SymbolCategory.ABSTRACT_CONCEPTS,
    meaning: 'Destruction - The unmaking of what was, the clearing that precedes new growth. Destruction represents ending, release, transformation through breaking down. Shiva destroys so Brahma can create; forest fires enable new growth; old cells die so new ones can live. Destruction is creation\'s inseparable partner.',
    culturalTags: ['universal', 'process', 'ending', 'clearing', 'transformation', 'release']
  },
  {
    id: 'balance',
    unicode: '⚖️',
    category: SymbolCategory.ABSTRACT_CONCEPTS,
    meaning: 'Balance - The equilibrium between opposing forces, the middle way between extremes. Balance represents harmony, moderation, and the wisdom to avoid excess. The tightrope walker, the ecosystem, the body\'s homeostasis—all demonstrate balance as dynamic stability. Balance is not stillness but constant, subtle adjustment.',
    culturalTags: ['universal', 'state', 'equilibrium', 'harmony', 'moderation', 'wisdom']
  },
  {
    id: 'journey',
    unicode: '🚶',
    category: SymbolCategory.ABSTRACT_CONCEPTS,
    meaning: 'Journey - The movement from one state to another, the process of transformation through space and time. The journey represents growth, adventure, pilgrimage, and the narrative arc of life itself. Every story is a journey; every life is a journey; the soul journeys through existence. The destination matters less than who you become along the way.',
    culturalTags: ['universal', 'process', 'growth', 'transformation', 'adventure', 'narrative']
  }
];

// Named export for allElementSymbols (used by index.js)
export const allElementSymbols = [...elementSymbols, ...placeSymbols, ...objectSymbols, ...abstractSymbols];

export default {
  elementSymbols,
  placeSymbols,
  objectSymbols,
  abstractSymbols,
  allElementSymbols
};