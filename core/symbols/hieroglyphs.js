/**
 * Egyptian Hieroglyph Symbol Definitions
 * 
 * A selection of key Egyptian hieroglyphs representing fundamental
 * concepts in one of humanity's oldest writing systems. Each symbol
 * carries layers of meaning from 3000+ years of Egyptian civilization.
 * 
 * Unicode range: U+13000 to U+1342F (Egyptian Hieroglyphs)
 * Note: Many hieroglyphs require fonts supporting Egyptian Unicode blocks.
 * Fallback emoji equivalents are provided where possible.
 */

const { SymbolCategory } = require('./base');

const egyptianHieroglyphs = [
  // ═══════════════════════════════════════════════════════════════════
  // COSMIC & DIVINE SYMBOLS
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'hiero_ra',
    unicode: '☀️',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Ra/Sun Disc - The hieroglyph of the solar disc, representing the supreme god Ra, creator of all things, who sails his barque across the sky by day and through the underworld by night. The sun is the visible manifestation of divine power, the source of all life, and the eye that sees all. In hieroglyphic writing, this determinative indicates anything related to time, light, or divinity itself.',
    culturalTags: ['egyptian', 'hieroglyph', 'sun', 'deity', 'creation', 'light', 'cosmic']
  },
  {
    id: 'hiero_ankh',
    unicode: '☥',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Ankh - The Key of Life, perhaps the most recognizable Egyptian symbol. Combines the feminine oval (eternal waters, the womb) with the masculine T-cross (creative power, the phallus). Gods hold the ankh to pharaohs\' noses, conferring the breath of eternal life. This symbol means "life" but implies eternal life—existence that transcends death. Found in countless tomb paintings promising resurrection.',
    culturalTags: ['egyptian', 'hieroglyph', 'life', 'eternity', 'breath', 'divine', 'resurrection']
  },
  {
    id: 'hiero_djed',
    unicode: '𓊽',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Djed Pillar - The backbone of Osiris, symbol of stability, endurance, and resurrection. Originally perhaps a tree trunk or bundle of grain, it became associated with Osiris\'s spine after Set dismembered him. The Raising of the Djed ceremony at Memphis symbolized Osiris\'s resurrection and the stability of the kingdom. Four horizontal bars represent the vertebrae; vertical strength represents eternal duration.',
    culturalTags: ['egyptian', 'hieroglyph', 'stability', 'osiris', 'spine', 'endurance', 'resurrection']
  },
  {
    id: 'hiero_was',
    unicode: '𓌀',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Was Scepter - The staff of power, shaped like a canine head (perhaps Set animal) atop a long straight shaft with forked base. Gods and pharaohs carry it as symbol of dominion over chaos and desert forces. The was embodies the power to command, the authority to rule, and the strength to overcome enemies. Often paired with ankh and djed to represent complete blessing.',
    culturalTags: ['egyptian', 'hieroglyph', 'power', 'dominion', 'scepter', 'authority', 'rule']
  },
  {
    id: 'hiero_eye_of_horus',
    unicode: '👁️',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Wedjat/Eye of Horus - The restored eye lost in battle with Set, healed by Thoth\'s magic. The wedjat represents healing, protection, wholeness, and the waxing moon. Its six parts correspond to fractions (1/2, 1/4, 1/8, 1/16, 1/32, 1/64) totaling 63/64—the missing piece restored by magic. Painted on boats, coffins, and amulets for protection. The eye sees what cannot be hidden.',
    culturalTags: ['egyptian', 'hieroglyph', 'horus', 'protection', 'healing', 'moon', 'wholeness']
  },
  {
    id: 'hiero_scarab',
    unicode: '🪲',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Khepri/Scarab - The dung beetle rolling its ball evoked the god Khepri rolling the sun across the sky. Symbol of transformation, self-creation, and the rising sun. The beetle emerges from dung as if created from nothing—autogenesis, becoming through one\'s own power. Scarab amulets were placed over mummies\' hearts, inscribed with spells to prevent the heart from testifying against the deceased.',
    culturalTags: ['egyptian', 'hieroglyph', 'transformation', 'sun', 'rebirth', 'self-creation', 'khepri']
  },
  {
    id: 'hiero_shen',
    unicode: '⭕',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Shen Ring - The endless loop of rope symbolizing eternity, completeness, and divine protection. When elongated around a pharaoh\'s name, it becomes the cartouche—the protective oval encircling royal identity. The shen represents that which has no beginning and no end, the eternal cycling of existence. Often held by hovering falcons or vultures offering eternal protection.',
    culturalTags: ['egyptian', 'hieroglyph', 'eternity', 'protection', 'infinity', 'cartouche', 'divine']
  },
  {
    id: 'hiero_maat_feather',
    unicode: '🪶',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Feather of Ma\'at - The ostrich feather of the goddess Ma\'at, representing truth, justice, cosmic order, and moral righteousness. Against this feather, the heart of the deceased was weighed in the Hall of Judgment. If the heart was heavier than the feather (weighed down by wrongdoing), it was devoured by Ammit. The feather is impossibly light—only a pure heart balances it.',
    culturalTags: ['egyptian', 'hieroglyph', 'maat', 'truth', 'justice', 'judgment', 'order']
  },
  {
    id: 'hiero_uraeus',
    unicode: '🐍',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Uraeus/Cobra - The rearing cobra worn on the pharaoh\'s crown, representing the goddess Wadjet and royal authority. The uraeus spits fire at the pharaoh\'s enemies, providing divine protection. It represents the dangerous power that rulers must wield—destruction in service of order. The cobra rises from the third eye position, linking royal power to divine sight.',
    culturalTags: ['egyptian', 'hieroglyph', 'cobra', 'royalty', 'protection', 'wadjet', 'authority']
  },
  {
    id: 'hiero_lotus',
    unicode: '🪷',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Lotus/Seshen - The blue lotus rising from primordial waters at creation, symbol of rebirth, the sun, and Upper Egypt. The lotus closes at night and sinks underwater, rising again with the dawn—a daily resurrection. The god Nefertem emerged from a lotus at creation. The flower\'s intoxicating scent connected it to pleasure and transcendence. Death is merely going down; resurrection is rising again.',
    culturalTags: ['egyptian', 'hieroglyph', 'lotus', 'rebirth', 'creation', 'sun', 'upper_egypt']
  },

  // ═══════════════════════════════════════════════════════════════════
  // NATURAL WORLD
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'hiero_water',
    unicode: '〰️',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Nile/Water (Nun) - The zigzag hieroglyph representing water, specifically the waters of the Nile and the primordial ocean Nun from which all creation emerged. Three zigzag lines indicate the plural—vast waters. Egypt exists only because of the Nile; this symbol appears in "Hapi" (Nile personified) and countless words relating to purification, life, and the underworld\'s waters.',
    culturalTags: ['egyptian', 'hieroglyph', 'water', 'nile', 'creation', 'nun', 'element']
  },
  {
    id: 'hiero_horizon',
    unicode: '🌄',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Akhet/Horizon - Two mountains with the sun between them, representing the place where sun rises and sets—the threshold between worlds. The akhet is the liminal zone of transformation where Ra is reborn each dawn and dies each sunset. The Great Sphinx guards the akhet at Giza. This symbol represents transition, transformation, and the gates between realms of existence.',
    culturalTags: ['egyptian', 'hieroglyph', 'horizon', 'threshold', 'transformation', 'sun', 'liminal']
  },
  {
    id: 'hiero_papyrus',
    unicode: '🌿',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Wadj/Papyrus - The papyrus reed symbolizing Lower Egypt, youth, vigor, and flourishing growth. The scepter of the goddess Wadjet (from the same root) uses the papyrus form. "Wadj" means green and fresh—the opposite of desert death. Papyrus thickets provided materials for writing, boats, and shelter, making this humble plant essential to civilization.',
    culturalTags: ['egyptian', 'hieroglyph', 'papyrus', 'lower_egypt', 'growth', 'green', 'wadjet']
  },
  {
    id: 'hiero_sky',
    unicode: '🌌',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Pet/Sky - The flat rectangle representing the sky, often depicted as the goddess Nut arched over the earth. The sky is the ceiling of the world, the belly of Nut covered with stars that she swallows at dawn and gives birth to at dusk. This hieroglyph appears in countless divine names and words relating to the heavens, eternal realms, and celestial phenomena.',
    culturalTags: ['egyptian', 'hieroglyph', 'sky', 'nut', 'heavens', 'cosmic', 'celestial']
  },
  {
    id: 'hiero_desert',
    unicode: '🏜️',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Deshret/Desert - The three sand hills representing the "Red Land"—the desert that both threatens and protects Egypt. The desert is the realm of Set, chaos, and death, but also the barrier that keeps enemies at bay. The red desert contrasts with the "Black Land" (kemet)—the fertile Nile valley. Foreign lands and chaos are desert; order and life are the Black Land.',
    culturalTags: ['egyptian', 'hieroglyph', 'desert', 'set', 'chaos', 'foreign', 'red_land']
  },
  {
    id: 'hiero_star',
    unicode: '⭐',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Seba/Star - The five-pointed star representing celestial bodies and the concept of "time" and "teaching." The imperishable stars (circumpolar stars that never set) were destinations for the blessed dead—to become an akh among the stars was the soul\'s highest aspiration. Stars are the souls of the gods and the righteous dead, watching from eternity.',
    culturalTags: ['egyptian', 'hieroglyph', 'star', 'time', 'heaven', 'soul', 'eternal']
  },

  // ═══════════════════════════════════════════════════════════════════
  // SACRED ANIMALS
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'hiero_falcon',
    unicode: '🦅',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Horus/Falcon - The falcon hieroglyph, sacred to Horus, representing divine kingship and sky power. The falcon sees all from above; its dive is irresistible force; its cry echoes across the sky. Every pharaoh was Horus incarnate—"The Distant One" made present in flesh. The falcon hieroglyph with sun disc is Ra-Horakhty, combining sun god and sky god.',
    culturalTags: ['egyptian', 'hieroglyph', 'falcon', 'horus', 'kingship', 'sky', 'divine']
  },
  {
    id: 'hiero_ibis',
    unicode: '🦢',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Thoth/Ibis - The ibis sacred to Thoth, god of wisdom, writing, magic, and the moon. The curved beak resembles the crescent moon; the bird wades thoughtfully in waters of knowledge. Thoth invented hieroglyphs, recorded the verdict of the dead, and mediated between cosmic forces. The ibis represents contemplation, precision, and the magic of the written word.',
    culturalTags: ['egyptian', 'hieroglyph', 'ibis', 'thoth', 'wisdom', 'writing', 'moon']
  },
  {
    id: 'hiero_jackal',
    unicode: '🐺',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Anubis/Jackal - The jackal or wild dog sacred to Anubis, lord of embalming and guide of souls. Jackals haunted cemeteries at the desert\'s edge, so the Egyptians made them guardians rather than threats. The recumbent jackal atop a shrine represents both danger transformed and death tamed. Anubis prepares bodies for eternity and leads souls safely through darkness.',
    culturalTags: ['egyptian', 'hieroglyph', 'jackal', 'anubis', 'death', 'embalming', 'guide']
  },
  {
    id: 'hiero_cat',
    unicode: '🐱',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Bastet/Cat - The cat sacred to Bastet, goddess of home, fertility, and protection. Cats protected grain stores from vermin and homes from snakes and scorpions—practical guardians elevated to divine status. Killing a cat, even accidentally, was capital offense. The cat represents the domestic sphere sanctified, wild nature tamed into protective presence.',
    culturalTags: ['egyptian', 'hieroglyph', 'cat', 'bastet', 'home', 'protection', 'fertility']
  },
  {
    id: 'hiero_lion',
    unicode: '🦁',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Sekhmet/Lion - The lion sacred to Sekhmet, the "Powerful One," goddess of war, destruction, and healing. Lions guarded temple gates and pharaohs\' thrones. Sekhmet\'s wrath once nearly destroyed humanity; only beer dyed red like blood stopped her. The lion represents power that can protect or destroy—the same strength that wins wars can spread plague.',
    culturalTags: ['egyptian', 'hieroglyph', 'lion', 'sekhmet', 'power', 'war', 'healing']
  },
  {
    id: 'hiero_vulture',
    unicode: '🦅',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Nekhbet/Vulture - The vulture sacred to Nekhbet, goddess of Upper Egypt and divine motherhood. The vulture spreads protective wings over the pharaoh; her image appears on royal crowns. Vultures were believed to be only female, conceived by the wind—symbols of motherhood without male contribution. Nekhbet and Wadjet together crown the unified pharaoh.',
    culturalTags: ['egyptian', 'hieroglyph', 'vulture', 'nekhbet', 'upper_egypt', 'mother', 'protection']
  },
  {
    id: 'hiero_hippopotamus',
    unicode: '🦛',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Taweret/Hippopotamus - The female hippopotamus representing Taweret, protector of childbirth and pregnant women. The hippo\'s fierce maternal defense translated to divine protection for the vulnerable. Taweret has hippo body, lion paws, and crocodile back—a composite of dangerous creatures transformed into beneficent guardian. Her amulets protected mother and child through birth\'s dangers.',
    culturalTags: ['egyptian', 'hieroglyph', 'hippo', 'taweret', 'childbirth', 'protection', 'mother']
  },
  {
    id: 'hiero_crocodile',
    unicode: '🐊',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Sobek/Crocodile - The crocodile sacred to Sobek, god of the Nile\'s dangerous power. Crocodiles represented both feared destruction and respected strength. Sobek protects the pharaoh and ensures the Nile\'s fertility. Live crocodiles were kept in temple pools, mummified at death. The crocodile represents natural force that must be propitiated—power respected rather than opposed.',
    culturalTags: ['egyptian', 'hieroglyph', 'crocodile', 'sobek', 'nile', 'power', 'danger']
  },

  // ═══════════════════════════════════════════════════════════════════
  // HUMAN BODY PARTS
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'hiero_eye',
    unicode: '👁️',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Ir/Eye - The human eye hieroglyph representing sight, action, and creation. The eye is the instrument through which Ra created the world and through which consciousness perceives reality. "Ir" as a verb means "to do" or "to make"—seeing and doing are connected. The eye also weeps, and from Ra\'s tears came humanity. Perception is creative act.',
    culturalTags: ['egyptian', 'hieroglyph', 'eye', 'sight', 'creation', 'perception', 'action']
  },
  {
    id: 'hiero_mouth',
    unicode: '👄',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Ra/Mouth - The mouth hieroglyph representing speech, ingestion, and the Opening of the Mouth ceremony that restored senses to the mummy. Speech creates; words spoken aloud have power. The god Ptah created the world by speaking its names. The mouth also takes in sustenance—food offerings for the ka. To speak someone\'s name preserves their existence.',
    culturalTags: ['egyptian', 'hieroglyph', 'mouth', 'speech', 'creation', 'ceremony', 'power']
  },
  {
    id: 'hiero_heart',
    unicode: '❤️',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Ib/Heart - The heart-shaped vessel hieroglyph representing the seat of consciousness, memory, and moral character. The heart was left in the mummy because it was needed at the Judgment of the Dead, when it was weighed against Ma\'at\'s feather. Heart scarabs prevented the heart from testifying against its owner. The heart thinks, feels, and carries the moral record of a life.',
    culturalTags: ['egyptian', 'hieroglyph', 'heart', 'consciousness', 'judgment', 'morality', 'soul']
  },
  {
    id: 'hiero_arm',
    unicode: '💪',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'A/Arm - The arm hieroglyph representing action, strength, and offering. The arm with palm down gives; with palm up, receives. The ka hieroglyph shows two raised arms—the vital force embracing the person. Arms wielding weapons protect; arms making offerings sustain the gods. Physical capability translated into hieroglyphic language.',
    culturalTags: ['egyptian', 'hieroglyph', 'arm', 'action', 'strength', 'offering', 'ka']
  },

  // ═══════════════════════════════════════════════════════════════════
  // CONCEPTS & ABSTRACTIONS
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'hiero_ka',
    unicode: '🙌',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Ka - Two upraised arms, representing the vital force or spirit double that each person possesses from birth. The ka is the life energy that distinguishes living from dead, the aspect that requires food offerings to survive in the afterlife. The ka is born with you, remains after death, and must be sustained. It is not quite soul, not quite body—the animating principle itself.',
    culturalTags: ['egyptian', 'hieroglyph', 'ka', 'soul', 'spirit', 'vitality', 'afterlife']
  },
  {
    id: 'hiero_ba',
    unicode: '🐦',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Ba - The human-headed bird representing the mobile soul that can leave the tomb during the day, traveling between worlds. The ba is personality, the unique individual essence that flies free while the body remains preserved. At night, the ba returns to reunite with the mummy. If the body is destroyed, the ba has nowhere to return—hence mummification\'s importance.',
    culturalTags: ['egyptian', 'hieroglyph', 'ba', 'soul', 'bird', 'personality', 'mobility']
  },
  {
    id: 'hiero_akh',
    unicode: '✨',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Akh - The "shining one," the transformed, blessed dead who has successfully passed through judgment and become one with the imperishable stars. The akh is the final form of the spirit—effective, powerful, radiant with divine light. It represents complete spiritual transformation, the goal of all funerary rites. The akh can help or harm the living.',
    culturalTags: ['egyptian', 'hieroglyph', 'akh', 'spirit', 'transformation', 'blessed_dead', 'light']
  },
  {
    id: 'hiero_sekhem',
    unicode: '⚡',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Sekhem - The power/scepter hieroglyph representing vital force, divine energy, and authority. Sekhem is the power that animates all things, the force wielded by gods and channeled by priests. The sekhem scepter was carried in processions. Sekhmet\'s name means "the one who has sekhem"—ultimate concentrated power.',
    culturalTags: ['egyptian', 'hieroglyph', 'sekhem', 'power', 'energy', 'authority', 'force']
  },
  {
    id: 'hiero_heka',
    unicode: '🔮',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Heka - Magic, the primordial creative force that existed before the gods. Heka is not supernatural but a fundamental power woven into creation itself. Priests wielded heka through words, rituals, and images. The god Heka personified this force. Speaking names, wearing amulets, performing rites—all channel heka. Magic is simply knowing how reality actually works.',
    culturalTags: ['egyptian', 'hieroglyph', 'heka', 'magic', 'creation', 'power', 'ritual']
  },
  {
    id: 'hiero_ren',
    unicode: '📝',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Ren/Name - The hieroglyphs representing a person\'s true name, considered an essential part of the soul. To speak someone\'s name is to keep them alive; to erase their name is to destroy them utterly. Pharaohs\' names were protected by cartouches; enemies\' names were ritually destroyed. The ren carries the essence of identity itself—naming calls into being.',
    culturalTags: ['egyptian', 'hieroglyph', 'name', 'identity', 'soul', 'power', 'memory']
  },
  {
    id: 'hiero_shu',
    unicode: '💨',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Shu/Air - The feather representing the god Shu (air) and the concept of breath, space, and emptiness. Shu separates sky from earth, holding Nut above Geb with upraised arms. The feather is lightness itself—what makes the heart light enough to balance against Ma\'at. Air is both empty and essential; Shu represents the nothing that makes everything possible.',
    culturalTags: ['egyptian', 'hieroglyph', 'air', 'shu', 'breath', 'space', 'separation']
  },
  {
    id: 'hiero_neheh',
    unicode: '♾️',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Neheh - Cyclical eternity, the eternal recurrence of time through endless repetition. Neheh is the forever of sunrise after sunrise, flood after flood, life after life. It contrasts with djet (linear eternity). Neheh is dynamic, moving, the wheel that turns; it is the eternity of becoming rather than being. The dead exist in both eternities—cyclic and linear, moving and stable.',
    culturalTags: ['egyptian', 'hieroglyph', 'eternity', 'time', 'cycle', 'recurring', 'forever']
  },
  {
    id: 'hiero_djet',
    unicode: '🏛️',
    category: SymbolCategory.EGYPTIAN_HIEROGLYPHS,
    meaning: 'Djet - Linear, stable eternity, the unchanging permanence of a single moment stretched forever. Djet is represented by the land-sign—solid, unmoving, eternal like the earth itself. While neheh cycles, djet endures unchanged. Together they comprise complete eternity. The blessed dead experience djet—the perfected moment sustained eternally, removed from time\'s wear.',
    culturalTags: ['egyptian', 'hieroglyph', 'eternity', 'permanence', 'stability', 'unchanging', 'forever']
  }
];

module.exports = {
  egyptianHieroglyphs
};