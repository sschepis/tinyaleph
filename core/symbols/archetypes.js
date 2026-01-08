
/**
 * Archetypes Symbol Definitions
 * 
 * Jungian archetypes, mythological figures, and universal human roles.
 * Each symbol includes rich, detailed descriptions capturing psychological,
 * cultural, and symbolic meanings.
 */

const { SymbolCategory } = require('./base');

const archetypeSymbols = [
  // ═══════════════════════════════════════════════════════════════════
  // JUNGIAN ARCHETYPES
  // ═══════════════════════════════════════════════════════════════════
  
  {
    id: 'hero',
    unicode: '🦸',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'The Hero - The courageous protagonist who overcomes obstacles and achieves great deeds. Represents the ego\'s journey toward individuation, facing trials that forge character. The Hero embodies willpower, determination, and the drive to prove one\'s worth through action. Their journey follows the monomyth: departure, initiation, and return with wisdom gained.',
    culturalTags: ['jungian', 'universal', 'mythology', 'journey', 'courage', 'transformation']
  },
  {
    id: 'shadow',
    unicode: '🌑',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'The Shadow - The hidden, repressed aspects of the psyche that the conscious mind refuses to acknowledge. Contains both destructive impulses and untapped potential. The Shadow appears in dreams as dark figures, monsters, or villains. Integration of the Shadow is essential for wholeness—what we resist persists, what we accept transforms.',
    culturalTags: ['jungian', 'universal', 'psychology', 'darkness', 'unconscious', 'repression']
  },
  {
    id: 'anima',
    unicode: '🌙',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'The Anima - The feminine aspect within the male psyche, representing emotion, intuition, receptivity, and connection to the unconscious. She appears in dreams as mysterious women, goddesses, or seductresses. The Anima bridges conscious and unconscious, acting as a soul-guide. Her integration enables men to access creativity, sensitivity, and relational depth.',
    culturalTags: ['jungian', 'universal', 'psychology', 'feminine', 'soul', 'unconscious']
  },
  {
    id: 'animus',
    unicode: '☀️',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'The Animus - The masculine aspect within the female psyche, representing logos, action, assertion, and analytical thinking. He appears in dreams as authoritative men, heroes, or wise figures. The Animus provides initiative and the capacity for focused thought. His integration enables women to access their power, clarity, and autonomous judgment.',
    culturalTags: ['jungian', 'universal', 'psychology', 'masculine', 'logos', 'consciousness']
  },
  {
    id: 'sage',
    unicode: '🧙',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'The Sage/Senex - The wise elder who has accumulated knowledge through experience and suffering. Represents the positive aspect of the father archetype: guidance, wisdom, and protection of tradition. The Sage has walked the path and returns to illuminate it for others. They embody patience, reflection, and the understanding that comes only with time.',
    culturalTags: ['jungian', 'universal', 'wisdom', 'mentor', 'guidance', 'experience']
  },
  {
    id: 'trickster',
    unicode: '🃏',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'The Trickster - The boundary-crosser who defies conventions and reveals hidden truths through chaos and humor. Neither good nor evil, the Trickster disrupts stagnant order to enable new possibilities. Found in every culture: Loki, Coyote, Hermes, Anansi. They teach that wisdom sometimes wears the mask of foolishness, and that transformation requires breaking rules.',
    culturalTags: ['jungian', 'universal', 'chaos', 'humor', 'liminality', 'transformation']
  },
  {
    id: 'mother',
    unicode: '👩',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'The Great Mother - The primordial source of nurture, protection, and unconditional love. Contains both the loving mother who sustains life and the devouring mother who cannot let go. Represents the womb of creation, the earth that feeds, and the embrace that heals. Her shadow is possessiveness and the prevention of growth.',
    culturalTags: ['jungian', 'universal', 'nurture', 'creation', 'feminine', 'protection']
  },
  {
    id: 'father',
    unicode: '👨',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'The Father - The archetype of authority, order, protection, and worldly guidance. Establishes boundaries and teaches the child to navigate society. The positive father empowers; the negative father dominates and crushes. Represents law, structure, and the logos principle. His blessing is essential for the child\'s confident entry into adulthood.',
    culturalTags: ['jungian', 'universal', 'authority', 'protection', 'masculine', 'structure']
  },
  {
    id: 'child',
    unicode: '👶',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'The Divine Child - Symbol of new beginnings, pure potential, and the future self waiting to be born. Represents innocence before corruption, wonder before cynicism. The Child archetype carries the possibility of transformation—in dreams, the appearance of a child often signals psychic renewal. Contains both vulnerability requiring protection and resilient hope.',
    culturalTags: ['jungian', 'universal', 'innocence', 'potential', 'renewal', 'beginnings']
  },
  {
    id: 'magician',
    unicode: '🔮',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'The Magician/Mage - Master of transformation who understands the hidden laws governing reality. Operates at the threshold between visible and invisible worlds. The Magician wields knowledge as power, turning lead into gold—both literally in alchemy and metaphorically in personal development. Warning: power without wisdom corrupts.',
    culturalTags: ['jungian', 'universal', 'magic', 'transformation', 'knowledge', 'power']
  },
  {
    id: 'warrior',
    unicode: '⚔️',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'The Warrior - Embodiment of disciplined power in service of a cause greater than oneself. The Warrior trains body and mind to overcome fear and act decisively. Represents the capacity to set boundaries, fight for values, and sacrifice for others. Without purpose, the Warrior becomes mere violence; with purpose, a guardian of civilization.',
    culturalTags: ['jungian', 'universal', 'combat', 'discipline', 'courage', 'protection']
  },
  {
    id: 'lover',
    unicode: '💕',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'The Lover - The archetype of passion, connection, beauty, and sensual experience. Seeks union—with another person, with nature, with the divine, with life itself. The Lover feels deeply, appreciates aesthetics, and lives intensely in the present moment. Shadow: addiction to pleasure, loss of self in the other, or fear of commitment.',
    culturalTags: ['jungian', 'universal', 'passion', 'connection', 'beauty', 'eros']
  },
  {
    id: 'ruler',
    unicode: '🏛️',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'The Ruler/Sovereign - Archetype of leadership, responsibility, and the ordering of society. The Ruler creates the conditions for others to thrive, establishing law and maintaining justice. True sovereignty serves the realm rather than exploiting it. The Ruler must balance power with wisdom, control with compassion, authority with humility.',
    culturalTags: ['jungian', 'universal', 'leadership', 'order', 'responsibility', 'authority']
  },
  {
    id: 'creator',
    unicode: '✨',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'The Creator - The divine spark that brings new things into existence from nothing. Channels imagination into form, vision into reality. The Creator archetype drives artists, inventors, and anyone who makes something that didn\'t exist before. Their gift is originality; their burden is that nothing ever matches the perfect vision within.',
    culturalTags: ['jungian', 'universal', 'creation', 'imagination', 'art', 'vision']
  },
  {
    id: 'destroyer',
    unicode: '💥',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'The Destroyer - The force that clears away what is obsolete to make room for new growth. Shiva dancing the world into dissolution, Kali with her necklace of skulls—destruction as necessary medicine. The Destroyer teaches that attachment causes suffering, that endings enable beginnings, that the forest must burn for new trees to sprout.',
    culturalTags: ['jungian', 'universal', 'destruction', 'transformation', 'ending', 'renewal']
  },
  {
    id: 'guardian',
    unicode: '🛡️',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'The Guardian/Protector - The archetype of vigilant defense against threats to what is precious. Stands watch at the threshold, protecting the vulnerable and preserving the sacred. The Guardian sacrifices personal comfort for the safety of others. Without guardians, civilization crumbles; without wisdom, guardianship becomes tyranny.',
    culturalTags: ['jungian', 'universal', 'protection', 'vigilance', 'sacrifice', 'defense']
  },
  {
    id: 'explorer',
    unicode: '🧭',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'The Explorer/Seeker - Driven by insatiable curiosity to venture beyond known boundaries. Cannot accept received wisdom—must discover truth firsthand. The Explorer values freedom above security, experience above comfort. Their journey is both outward into unknown lands and inward into unexplored psyche. The price is never truly belonging anywhere.',
    culturalTags: ['jungian', 'universal', 'discovery', 'freedom', 'curiosity', 'journey']
  },
  {
    id: 'rebel',
    unicode: '✊',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'The Rebel/Outlaw - Refuses to accept unjust rules and fights against corrupt authority. Sees what others normalize and names it unacceptable. The Rebel is willing to be cast out for speaking truth. Shadow: rebellion becomes identity, unable to build after destroying, or becoming what they fought against.',
    culturalTags: ['jungian', 'universal', 'revolution', 'defiance', 'freedom', 'change']
  },
  {
    id: 'caregiver',
    unicode: '🤲',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'The Caregiver/Nurturer - Finds meaning in serving others\' needs before their own. Provides sustenance, comfort, and support to those who cannot care for themselves. The Caregiver creates safe spaces where growth becomes possible. Shadow: martyrdom, enabling, or using caregiving to control others.',
    culturalTags: ['jungian', 'universal', 'service', 'compassion', 'nurture', 'healing']
  },
  {
    id: 'jester',
    unicode: '🎪',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'The Jester/Fool - Uses humor and play to reveal truth and lighten burdens. The only one who can tell the king what no one else dares say. Lives fully in the present moment, unburdened by past or future anxiety. The Jester teaches that life is a game to be enjoyed, that laughter heals, that wisdom often hides in absurdity.',
    culturalTags: ['jungian', 'universal', 'humor', 'truth', 'play', 'present']
  },
  {
    id: 'orphan',
    unicode: '😢',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'The Orphan/Wounded Child - The part of us that has been abandoned, neglected, or betrayed by those who should have protected us. Carries the wounds of childhood that persist into adulthood. The Orphan longs for belonging and safety. Healing the Orphan means acknowledging wounds without being defined by them.',
    culturalTags: ['jungian', 'universal', 'wound', 'abandonment', 'belonging', 'healing']
  },
  {
    id: 'everyman',
    unicode: '🧑',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'The Everyman/Regular Person - The unpretentious, relatable human who represents ordinary virtues. Values belonging, connection, and the dignity of common life. The Everyman reminds us that heroism exists in small daily choices—the parent who sacrifices for children, the worker who does their job with integrity. Nobility in the mundane.',
    culturalTags: ['jungian', 'universal', 'ordinary', 'belonging', 'authenticity', 'community']
  },

  // ═══════════════════════════════════════════════════════════════════
  // GREEK MYTHOLOGY
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'zeus',
    unicode: '⚡',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Zeus - King of the Olympian gods, ruler of the sky, thunder, and lightning. Represents supreme authority, cosmic order, and the power that maintains civilization. Zeus overthrew the Titans, establishing the current age of gods. He embodies both the righteous judge and the capricious patriarch—power that protects and power that dominates.',
    culturalTags: ['greek', 'mythology', 'deity', 'authority', 'sky', 'thunder', 'olympian']
  },
  {
    id: 'athena',
    unicode: '🦉',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Athena - Goddess of wisdom, strategic warfare, and crafts. Born fully armored from Zeus\'s head, she represents intellect unclouded by emotion. Patron of Athens, she values civilization over chaos, skill over brute force. Her owl sees through darkness; her olive tree feeds the city. Athena is the daughter who embodies the father\'s best qualities.',
    culturalTags: ['greek', 'mythology', 'deity', 'wisdom', 'strategy', 'craft', 'olympian']
  },
  {
    id: 'apollo',
    unicode: '☀️',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Apollo - God of the sun, music, poetry, prophecy, and healing. Represents the Apollonian principle: order, clarity, rationality, and measured beauty. His oracle at Delphi proclaimed "Know Thyself." Apollo drives the chariot of the sun across the sky—illuminating truth, but also capable of scorching those who fly too close.',
    culturalTags: ['greek', 'mythology', 'deity', 'sun', 'music', 'prophecy', 'olympian']
  },
  {
    id: 'dionysus',
    unicode: '🍇',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Dionysus - God of wine, ecstasy, theater, and ritual madness. Represents the Dionysian principle: chaos, emotion, intoxication, and boundary dissolution. Born twice—from his mother\'s womb and from Zeus\'s thigh—he is the dying and resurrecting god. Dionysus reminds us that repressing chaos creates worse violence than embracing it ritually.',
    culturalTags: ['greek', 'mythology', 'deity', 'wine', 'ecstasy', 'theater', 'olympian']
  },
  {
    id: 'aphrodite',
    unicode: '💖',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Aphrodite - Goddess of love, beauty, pleasure, and passion. Born from sea foam where Uranus\'s severed genitals fell, she embodies the irresistible power of attraction. Aphrodite reveals that beauty is a force of nature—creative and destructive, uniting and fragmenting. Her golden apples and magic girdle make resistance futile.',
    culturalTags: ['greek', 'mythology', 'deity', 'love', 'beauty', 'desire', 'olympian']
  },
  {
    id: 'ares',
    unicode: '🔴',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Ares - God of war, bloodshed, and violent conflict. Unlike Athena\'s strategic warfare, Ares represents the brutal, chaotic reality of battle—the blood, screams, and broken bodies. Even the gods dislike him, yet he is necessary. Ares teaches that some conflicts cannot be resolved through wisdom alone; sometimes only steel speaks.',
    culturalTags: ['greek', 'mythology', 'deity', 'war', 'violence', 'conflict', 'olympian']
  },
  {
    id: 'hades',
    unicode: '💀',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Hades - God of the underworld and lord of the dead. Neither evil nor cruel—simply implacable and fair. All mortals come to him eventually; he receives them without judgment. Hades represents the hidden wealth beneath the earth (plutonic riches) and the psychological depths where transformation occurs. Descent is necessary for rebirth.',
    culturalTags: ['greek', 'mythology', 'deity', 'death', 'underworld', 'wealth', 'chthonic']
  },
  {
    id: 'persephone',
    unicode: '🌸',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Persephone - Queen of the underworld and goddess of spring. Abducted by Hades, she ate pomegranate seeds that bound her to the underworld for half the year. Her descent and return mirrors the seasonal cycle, the soul\'s journey through death, and the maiden\'s transformation into queen. She rules below yet brings flowers above.',
    culturalTags: ['greek', 'mythology', 'deity', 'spring', 'underworld', 'transformation', 'cycle']
  },
  {
    id: 'hermes',
    unicode: '🪽',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Hermes - Messenger of the gods, guide of souls, patron of travelers, thieves, and boundaries. With winged sandals, he moves freely between Olympus, earth, and Hades. Hermes is the psychopomp who leads souls to the afterlife and the trickster who stole Apollo\'s cattle as an infant. Communication, commerce, and cunning are his gifts.',
    culturalTags: ['greek', 'mythology', 'deity', 'messenger', 'travel', 'boundaries', 'olympian']
  },
  {
    id: 'artemis',
    unicode: '🏹',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Artemis - Goddess of the hunt, wilderness, and the moon. Eternal virgin who roams with her nymphs, she represents feminine independence from patriarchal structures. Fiercely protective of her autonomy and her companions, she punishes those who transgress her boundaries. Artemis embodies the wildness that civilization cannot tame.',
    culturalTags: ['greek', 'mythology', 'deity', 'hunt', 'wilderness', 'moon', 'olympian']
  },
  {
    id: 'poseidon',
    unicode: '🔱',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Poseidon - God of the sea, earthquakes, and horses. His trident commands the waves; his mood determines whether sailors live or die. Poseidon represents the vast, powerful, and unpredictable forces of nature that humankind can neither control nor ignore. His realm is emotion—the depths beneath rational consciousness.',
    culturalTags: ['greek', 'mythology', 'deity', 'sea', 'earthquake', 'horses', 'olympian']
  },
  {
    id: 'hephaestus',
    unicode: '🔨',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Hephaestus - God of forge, fire, and craftsmen. Lame and ugly among beautiful Olympians, rejected by his mother Hera, he nonetheless creates objects of incomparable beauty and power. Hephaestus teaches that wounds become gifts when transformed by skill and patience. The artist\'s work redeems the artist\'s suffering.',
    culturalTags: ['greek', 'mythology', 'deity', 'craft', 'forge', 'fire', 'olympian']
  },

  // ═══════════════════════════════════════════════════════════════════
  // NORSE MYTHOLOGY
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'odin',
    unicode: '🦅',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Odin - All-Father of the Norse gods, god of wisdom, death, poetry, and magic. Sacrificed his eye at Mímir\'s well for wisdom, hung nine days on Yggdrasil to gain the runes. Odin represents the seeker who pays any price for knowledge. His ravens Huginn and Muninn (thought and memory) survey the world. He prepares warriors for Ragnarök, knowing his own doom.',
    culturalTags: ['norse', 'mythology', 'deity', 'wisdom', 'death', 'magic', 'sacrifice']
  },
  {
    id: 'thor',
    unicode: '🔨',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Thor - God of thunder, lightning, storms, and the protection of mankind. With his hammer Mjölnir, he battles the giants that threaten cosmic order. Thor is the common people\'s god—straightforward, honest, immensely strong, occasionally tricked but never defeated for long. He blesses marriages and protects farmers.',
    culturalTags: ['norse', 'mythology', 'deity', 'thunder', 'strength', 'protection', 'hammer']
  },
  {
    id: 'loki',
    unicode: '🦊',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Loki - The trickster god who is blood-brother to Odin yet destined to fight against the gods at Ragnarök. Shape-shifter, liar, catalyst of change—Loki is neither fully good nor evil but necessary. His mischief causes problems that force growth; his children are the monsters that end the world. Chaos bound, chaos waiting to be loosed.',
    culturalTags: ['norse', 'mythology', 'deity', 'trickster', 'chaos', 'transformation', 'doom']
  },
  {
    id: 'freya',
    unicode: '🐱',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Freya - Goddess of love, beauty, fertility, war, and seidr magic. Rides a chariot pulled by cats; wears the necklace Brísingamen; claims half the battle-slain for her hall Fólkvangr. Freya weeps golden tears for her lost husband Óðr. She represents the fierce feminine—passionate, magical, and not to be trifled with.',
    culturalTags: ['norse', 'mythology', 'deity', 'love', 'magic', 'fertility', 'battle']
  },
  {
    id: 'valkyrie',
    unicode: '⚔️',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Valkyrie - "Choosers of the slain," Odin\'s warrior maidens who select the worthy dead from battlefields and bring them to Valhalla. They represent fate\'s hand in war—the mysterious force that decides who lives, who dies, and who enters the hall of heroes. Fierce, beautiful, and terrible, they serve death\'s cold logic.',
    culturalTags: ['norse', 'mythology', 'warrior', 'fate', 'death', 'battle', 'feminine']
  },

  // ═══════════════════════════════════════════════════════════════════
  // EGYPTIAN MYTHOLOGY
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'ra',
    unicode: '☀️',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Ra - The supreme solar deity of ancient Egypt, creator god who brought himself into existence. Each day Ra sails his barque across the sky; each night he travels through the underworld, battling the serpent Apophis. Ra represents the cosmic cycle of creation, destruction, and renewal. His eye is the sun that gives life and can destroy.',
    culturalTags: ['egyptian', 'mythology', 'deity', 'sun', 'creation', 'king', 'cosmic']
  },
  {
    id: 'osiris',
    unicode: '👑',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Osiris - God of the afterlife, the dead, and resurrection. Murdered and dismembered by his brother Set, he was reassembled by Isis and became king of the underworld. Osiris represents the dying-and-rising god archetype—grain buried and sprouting, the soul\'s journey through death to eternal life. He judges the hearts of the dead against the feather of Ma\'at.',
    culturalTags: ['egyptian', 'mythology', 'deity', 'death', 'resurrection', 'judgment', 'king']
  },
  {
    id: 'isis',
    unicode: '🌟',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Isis - Great goddess of magic, motherhood, and protection. She reassembled Osiris, conceived Horus, and protected the vulnerable. Her wings shelter the dead; her magic restores life. Isis is the devoted wife, the fierce mother, the mistress of ten thousand names. Her worship spread throughout the ancient world—the original Great Mother.',
    culturalTags: ['egyptian', 'mythology', 'deity', 'magic', 'mother', 'protection', 'healing']
  },
  {
    id: 'horus',
    unicode: '🦅',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Horus - Falcon-headed god of the sky, son of Isis and Osiris, rightful king of Egypt. Lost his eye battling Set for his father\'s throne—the Eye of Horus became a symbol of healing and protection. Horus represents the young king who avenges his father and restores cosmic order. Every pharaoh was Horus incarnate.',
    culturalTags: ['egyptian', 'mythology', 'deity', 'sky', 'kingship', 'justice', 'protection']
  },
  {
    id: 'anubis',
    unicode: '🐺',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Anubis - Jackal-headed god of mummification, the dead, and the underworld. Guardian of tombs and guide of souls, he oversees the weighing of the heart ceremony. Anubis represents the dignified care of the dead—the rituals that honor those who have passed and ensure their safe journey. Black like fertile Nile silt, promising regeneration.',
    culturalTags: ['egyptian', 'mythology', 'deity', 'death', 'mummification', 'protection', 'guide']
  },
  {
    id: 'thoth',
    unicode: '📝',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Thoth - Ibis-headed god of wisdom, writing, magic, and the moon. Inventor of hieroglyphs, keeper of divine records, mediator between cosmic forces. Thoth records the verdict when hearts are weighed against Ma\'at\'s feather. He represents intellectual mastery and the sacred power of the written word to preserve truth across time.',
    culturalTags: ['egyptian', 'mythology', 'deity', 'wisdom', 'writing', 'magic', 'moon']
  },
  {
    id: 'bastet',
    unicode: '🐱',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Bastet - Cat goddess of home, fertility, protection, and the domestic sphere. Originally the fierce lioness Sekhmet, she transformed into the gentler cat deity. Bastet represents the protective, nurturing feminine—but like all cats, she can extend her claws. Cats were sacred in Egypt; killing one, even accidentally, was punishable by death.',
    culturalTags: ['egyptian', 'mythology', 'deity', 'cat', 'protection', 'home', 'feminine']
  },
  {
    id: 'set',
    unicode: '🔴',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Set - God of chaos, storms, deserts, and foreign lands. Murdered his brother Osiris out of jealousy and battled Horus for the throne. Yet Set also protects Ra\'s barque from the serpent Apophis each night. He represents necessary chaos—the desert that defines the fertile valley, the storm that brings rain, the enemy that strengthens.',
    culturalTags: ['egyptian', 'mythology', 'deity', 'chaos', 'desert', 'storm', 'opposition']
  },

  // ═══════════════════════════════════════════════════════════════════
  // HINDU MYTHOLOGY
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'brahma',
    unicode: '🪷',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Brahma - The Creator, first god of the Hindu Trimurti, born from the cosmic lotus that grew from Vishnu\'s navel. With four heads facing four directions, he spoke the Vedas into existence. Brahma represents the creative principle of the universe—the first stirring of consciousness from the void. Yet he is rarely worshipped, for creation is but a passing moment.',
    culturalTags: ['hindu', 'mythology', 'deity', 'creation', 'vedas', 'trimurti', 'cosmic']
  },
  {
    id: 'vishnu',
    unicode: '🔵',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Vishnu - The Preserver, maintainer of cosmic order, who incarnates as avatars (Rama, Krishna, and others) when dharma declines. Sleeping on the cosmic serpent Shesha, dreaming the universe, he awakens to restore balance. Vishnu represents stability, protection, and the love that sustains existence. His conch calls; his discus destroys evil.',
    culturalTags: ['hindu', 'mythology', 'deity', 'preservation', 'avatar', 'trimurti', 'cosmic']
  },
  {
    id: 'shiva',
    unicode: '🔱',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Shiva - The Destroyer and Transformer, third god of the Trimurti, who dances the Tandava that ends and renews the universe. Ascetic yogi and passionate lover, he sits in meditation on Mount Kailash while also embracing Shakti. Shiva represents the necessary destruction that precedes creation. His third eye burns illusion; his drum beats time.',
    culturalTags: ['hindu', 'mythology', 'deity', 'destruction', 'transformation', 'trimurti', 'yoga']
  },
  {
    id: 'ganesh',
    unicode: '🐘',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Ganesha - Elephant-headed god of beginnings, wisdom, and the removal of obstacles. Son of Shiva and Parvati, his head was replaced after Shiva unknowingly beheaded him. Ganesha is invoked before any undertaking—weddings, journeys, business ventures. His broken tusk wrote the Mahabharata. He represents the ability to overcome any barrier through wisdom.',
    culturalTags: ['hindu', 'mythology', 'deity', 'wisdom', 'beginnings', 'obstacles', 'auspicious']
  },
  {
    id: 'kali',
    unicode: '⚫',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Kali - The fierce goddess of time, death, and liberation. Black as the void before creation, wearing a necklace of skulls, standing on Shiva\'s chest, she terrifies and frees simultaneously. Kali represents the destruction of ego, the death of illusion, and the fierce compassion that cuts through spiritual delusion. She is time that devours all.',
    culturalTags: ['hindu', 'mythology', 'deity', 'death', 'time', 'liberation', 'shakti']
  },
  {
    id: 'krishna',
    unicode: '💙',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Krishna - Avatar of Vishnu, the divine cowherd, charioteer of Arjuna, speaker of the Bhagavad Gita. Blue-skinned, playing his flute, he draws all souls to divine love. Krishna teaches karma yoga, bhakti, and the transcendence of action through surrender. He is the playful child, the passionate lover, and the cosmic teacher.',
    culturalTags: ['hindu', 'mythology', 'deity', 'avatar', 'love', 'wisdom', 'gita']
  },

  // ═══════════════════════════════════════════════════════════════════
  // CHINESE/BUDDHIST FIGURES
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'buddha',
    unicode: '🙏',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Buddha - The Awakened One, Siddhartha Gautama who achieved enlightenment under the Bodhi tree. Renouncing princely life, he discovered the Middle Way between asceticism and indulgence. Buddha represents the possibility of liberation from suffering through wisdom and compassion. His smile reflects the peace of one who has seen through illusion.',
    culturalTags: ['buddhist', 'indian', 'spiritual', 'enlightenment', 'wisdom', 'compassion', 'awakening']
  },
  {
    id: 'guanyin',
    unicode: '🪷',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Guanyin/Avalokiteshvara - Bodhisattva of compassion who hears the cries of the world. She/he delayed full buddhahood to save all sentient beings. In East Asia, often depicted as feminine—the "Goddess of Mercy." Guanyin represents unconditional compassion that responds to suffering without judgment. A thousand arms to help; a thousand eyes to see need.',
    culturalTags: ['buddhist', 'chinese', 'japanese', 'spiritual', 'compassion', 'mercy', 'bodhisattva']
  },
  {
    id: 'dragon_emperor',
    unicode: '🐉',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Dragon Emperor - The Chinese dragon represents imperial power, cosmic energy, and benevolent authority. Unlike Western dragons, Eastern dragons are wise, life-giving beings associated with rain and rivers. The Emperor was the Son of Heaven, bearing the dragon\'s mandate. This symbol represents rightful power aligned with cosmic order.',
    culturalTags: ['chinese', 'mythology', 'emperor', 'dragon', 'authority', 'cosmic', 'water']
  },

  // ═══════════════════════════════════════════════════════════════════
  // JAPANESE FIGURES
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'samurai',
    unicode: '🎌',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Samurai - The warrior class of feudal Japan, bound by bushido—the way of the warrior. Loyalty unto death, honor above life, skill refined through discipline. The samurai sword was the soul made steel. This archetype represents service to something greater than self, martial excellence, and the aesthetic of death accepted gracefully.',
    culturalTags: ['japanese', 'warrior', 'honor', 'discipline', 'bushido', 'loyalty', 'sword']
  },
  {
    id: 'ninja',
    unicode: '🥷',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Ninja/Shinobi - The shadow warriors who operated outside samurai codes. Masters of espionage, assassination, and unconventional warfare. The ninja represents the shadow side of martial culture—effectiveness over honor, survival over glory. They are the hidden hand, the unseen threat, the reminder that not all power announces itself.',
    culturalTags: ['japanese', 'warrior', 'stealth', 'shadow', 'espionage', 'ninjutsu', 'hidden']
  },
  {
    id: 'amaterasu',
    unicode: '🌞',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Amaterasu - Shinto sun goddess, ancestor of the Japanese imperial line. When she hid in a cave after her brother Susanoo\'s offenses, the world fell into darkness until the gods lured her out with a mirror. Amaterasu represents solar radiance, divine femininity, and the light of consciousness that dispels cosmic darkness.',
    culturalTags: ['japanese', 'shinto', 'deity', 'sun', 'feminine', 'imperial', 'light']
  },
  {
    id: 'monk',
    unicode: '🧘',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'Monk - The one who renounces worldly attachments to pursue spiritual realization. Across traditions—Buddhist, Christian, Hindu, Taoist—the monk embodies dedication to the inner life. Through discipline, simplicity, and contemplation, the monk seeks transcendence. The empty bowl, the bare cell, the hours of meditation—all point beyond the self toward the infinite.',
    culturalTags: ['universal', 'spiritual', 'renunciation', 'discipline', 'contemplation', 'wisdom']
  },
  {
    id: 'king',
    unicode: '👑',
    category: SymbolCategory.PEOPLE_ARCHETYPES,
    meaning: 'King - The archetypal sovereign who rules with authority and responsibility. The true king serves his kingdom rather than exploiting it, maintaining order, dispensing justice, and protecting the realm. Connected to the land itself, the king\'s vitality mirrors the kingdom\'s prosperity. The crown weighs heavy—power demands wisdom.',
    culturalTags: ['universal', 'authority', 'leadership', 'responsibility', 'sovereignty', 'order']
  }
];

module.exports = {
  archetypeSymbols
};