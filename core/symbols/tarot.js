/**
 * Tarot Symbol Definitions
 * 
 * The 22 Major Arcana cards representing the Fool's Journey through life,
 * plus key Minor Arcana cards. Each card carries centuries of accumulated
 * symbolic meaning from Kabbalistic, astrological, and esoteric traditions.
 */

import { SymbolCategory } from './base.js';

const tarotMajorArcana = [
  // ═══════════════════════════════════════════════════════════════════
  // THE MAJOR ARCANA - THE FOOL'S JOURNEY
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'tarot_fool',
    unicode: '🃏',
    category: SymbolCategory.TAROT_MAJOR_ARCANA,
    meaning: 'The Fool (0) - The eternal beginner stepping off the cliff into the unknown, trusting the universe to catch them. Numbered zero, the Fool exists outside the sequence—both beginning and end, everything and nothing. Carrying only a small pack of experience, accompanied by a small dog (instinct), they represent pure potential before manifestation. The Fool is divine madness, holy innocence, and the courage to leap without knowing where you\'ll land. Reversed: recklessness, naivety, or fear of taking necessary risks.',
    culturalTags: ['tarot', 'divination', 'major_arcana', 'beginning', 'potential', 'innocence', 'leap']
  },
  {
    id: 'tarot_magician',
    unicode: '🎩',
    category: SymbolCategory.TAROT_MAJOR_ARCANA,
    meaning: 'The Magician (I) - "As above, so below"—one hand pointing to heaven, one to earth, channeling cosmic energy into manifestation. Before the Magician are the four tools of the Minor Arcana: wand, cup, sword, pentacle—representing will, emotion, thought, and form. The infinity symbol above his head signals mastery over the material and spiritual. The Magician is focused will made real, the power to create your reality. Reversed: manipulation, untapped potential, or illusion without substance.',
    culturalTags: ['tarot', 'divination', 'major_arcana', 'manifestation', 'will', 'skill', 'power']
  },
  {
    id: 'tarot_high_priestess',
    unicode: '🌙',
    category: SymbolCategory.TAROT_MAJOR_ARCANA,
    meaning: 'The High Priestess (II) - Guardian of the threshold between conscious and unconscious, she sits before the veil concealing the mysteries. The pillars Boaz and Jachin from Solomon\'s Temple flank her—darkness and light, severity and mercy. The scroll of Torah in her lap is partially hidden; some wisdom cannot be spoken, only experienced. The High Priestess represents intuition, hidden knowledge, and the feminine mysteries of moon and water. Reversed: secrets, disconnection from intuition, or superficiality.',
    culturalTags: ['tarot', 'divination', 'major_arcana', 'intuition', 'mystery', 'feminine', 'moon']
  },
  {
    id: 'tarot_empress',
    unicode: '👑',
    category: SymbolCategory.TAROT_MAJOR_ARCANA,
    meaning: 'The Empress (III) - The Great Mother enthroned in a lush garden, pregnant with all life. Venus personified, she is sensuality, fertility, creativity, and nature\'s abundance. Her crown of twelve stars represents the zodiac; the wheat at her feet, the harvest of nurture. Where the High Priestess conceals, the Empress reveals—embodied wisdom, love expressed through touch. She represents creative expression, abundance, motherhood, and the senses. Reversed: creative blocks, dependence, or smothering.',
    culturalTags: ['tarot', 'divination', 'major_arcana', 'fertility', 'abundance', 'mother', 'venus']
  },
  {
    id: 'tarot_emperor',
    unicode: '🏛️',
    category: SymbolCategory.TAROT_MAJOR_ARCANA,
    meaning: 'The Emperor (IV) - The archetypal Father, stern and protective, seated on his stone throne of authority. Ram heads adorn his chair—Aries, the warrior sign. He holds the ankh of life and the orb of dominion. Where the Empress creates through love, the Emperor creates through structure, law, and will. He represents authority, stability, order, and paternal protection. Without the Empress, he becomes rigid tyranny; balanced, he is civilization itself. Reversed: domination, inflexibility, or authority issues.',
    culturalTags: ['tarot', 'divination', 'major_arcana', 'authority', 'structure', 'father', 'order']
  },
  {
    id: 'tarot_hierophant',
    unicode: '⛪',
    category: SymbolCategory.TAROT_MAJOR_ARCANA,
    meaning: 'The Hierophant (V) - The Pope, the Teacher, the bridge between human and divine. Seated between two pillars like the High Priestess, but his mysteries are exoteric—formal religion, established tradition, orthodox teaching. His triple crown represents mastery of body, mind, and spirit; the crossed keys unlock heaven and earth. He represents tradition, conventional wisdom, spiritual authority, and rites of passage. Reversed: unconventional approaches, rebellion against tradition, or spiritual restriction.',
    culturalTags: ['tarot', 'divination', 'major_arcana', 'tradition', 'teaching', 'religion', 'orthodoxy']
  },
  {
    id: 'tarot_lovers',
    unicode: '💑',
    category: SymbolCategory.TAROT_MAJOR_ARCANA,
    meaning: 'The Lovers (VI) - Beyond romance, this card depicts choice, union, and moral evolution. In the Rider-Waite image, Adam and Eve stand before the angel Raphael, the Tree of Knowledge and Tree of Life behind them. The serpent and apple signal the choice that makes us human—to know good and evil. The Lovers represents relationships, choices, alignment of values, and the integration of opposites within. Reversed: disharmony, imbalance, or misalignment of values.',
    culturalTags: ['tarot', 'divination', 'major_arcana', 'choice', 'love', 'union', 'values']
  },
  {
    id: 'tarot_chariot',
    unicode: '🏎️',
    category: SymbolCategory.TAROT_MAJOR_ARCANA,
    meaning: 'The Chariot (VII) - The warrior-king drives a chariot pulled by sphinxes—one black, one white, representing opposing forces that must be controlled. There are no reins; direction comes through will alone. The starry canopy above represents celestial guidance. The Chariot represents triumph through discipline, directed will, and the conquest of internal and external obstacles. Momentum, determination, and focused drive. Reversed: loss of control, scattered energy, or lack of direction.',
    culturalTags: ['tarot', 'divination', 'major_arcana', 'willpower', 'victory', 'control', 'determination']
  },
  {
    id: 'tarot_strength',
    unicode: '🦁',
    category: SymbolCategory.TAROT_MAJOR_ARCANA,
    meaning: 'Strength (VIII) - A woman calmly closes the jaws of a lion—not through force, but through gentle, patient courage. The infinity symbol above her head echoes the Magician, but here power is inner rather than outer. The lion represents our animal nature, primal fears and desires. Strength teaches that true power comes from mastering ourselves through compassion rather than suppression. Represents courage, patience, inner strength, and self-compassion. Reversed: self-doubt, weakness, or raw emotion.',
    culturalTags: ['tarot', 'divination', 'major_arcana', 'courage', 'patience', 'inner_strength', 'compassion']
  },
  {
    id: 'tarot_hermit',
    unicode: '🏔️',
    category: SymbolCategory.TAROT_MAJOR_ARCANA,
    meaning: 'The Hermit (IX) - The solitary seeker stands atop a mountain, holding a lantern containing a six-pointed star—the light of truth that guides the way. He has withdrawn from the world not to escape, but to find wisdom that only silence reveals. The staff represents the work of the past; the lantern, the wisdom gained. The Hermit represents introspection, solitude, inner guidance, and the quest for truth. Sometimes you must be alone to find yourself. Reversed: isolation, loneliness, or withdrawal from growth.',
    culturalTags: ['tarot', 'divination', 'major_arcana', 'solitude', 'wisdom', 'introspection', 'guidance']
  },
  {
    id: 'tarot_wheel',
    unicode: '☸️',
    category: SymbolCategory.TAROT_MAJOR_ARCANA,
    meaning: 'The Wheel of Fortune (X) - The great wheel turns, with figures rising and falling on its rim—the only constant is change. In the corners sit the four fixed signs of the zodiac; at the center, the sphinx poses the eternal riddle. The Hebrew letters spell YHVH and TARO intertwined—God and fate dance together. The Wheel represents cycles, destiny, turning points, and the understanding that what rises must fall, and what falls may rise again. Reversed: resistance to change, bad luck, or external forces beyond control.',
    culturalTags: ['tarot', 'divination', 'major_arcana', 'fate', 'cycles', 'change', 'destiny']
  },
  {
    id: 'tarot_justice',
    unicode: '⚖️',
    category: SymbolCategory.TAROT_MAJOR_ARCANA,
    meaning: 'Justice (XI) - The figure sits between two pillars, holding the scales of balance and the sword of decision. Unlike blind Justice, she sees clearly—truth cannot be hidden from her. Every action has consequences; Justice ensures they arrive. She represents karma made conscious, the law of cause and effect understood. Justice calls for fair decisions, accountability, truth, and the courage to act rightly despite personal cost. Reversed: dishonesty, unfairness, or lack of accountability.',
    culturalTags: ['tarot', 'divination', 'major_arcana', 'karma', 'balance', 'truth', 'accountability']
  },
  {
    id: 'tarot_hanged_man',
    unicode: '🙃',
    category: SymbolCategory.TAROT_MAJOR_ARCANA,
    meaning: 'The Hanged Man (XII) - Suspended upside down from a living tree, bound by one foot, yet his face shows serenity, and a halo glows around his head. The Hanged Man has chosen to see differently—surrender that becomes wisdom, sacrifice that becomes liberation. Like Odin hanging on Yggdrasil to gain the runes. This card represents pause, surrender, new perspectives, and the profound insight that comes from letting go. Reversed: stalling, unnecessary sacrifice, or fear of surrender.',
    culturalTags: ['tarot', 'divination', 'major_arcana', 'surrender', 'sacrifice', 'perspective', 'wisdom']
  },
  {
    id: 'tarot_death',
    unicode: '💀',
    category: SymbolCategory.TAROT_MAJOR_ARCANA,
    meaning: 'Death (XIII) - The skeleton knight rides a white horse, carrying a black banner with a white rose—transformation through ending. Before him, king and child alike must yield; no one is exempt from change. Yet the sun rises between two towers in the background—after every ending, a new beginning. Death represents transformation, endings, transitions, and the liberation that comes from releasing what no longer serves. Reversed: resistance to change, stagnation, or fear of endings.',
    culturalTags: ['tarot', 'divination', 'major_arcana', 'transformation', 'ending', 'transition', 'rebirth']
  },
  {
    id: 'tarot_temperance',
    unicode: '⚗️',
    category: SymbolCategory.TAROT_MAJOR_ARCANA,
    meaning: 'Temperance (XIV) - An angel with one foot in water, one on land, pours liquid between two cups in an impossible flow. This is the alchemical Great Work—the union of opposites into something greater. The path behind leads to a crown in the mountains—the goal of balanced integration. Temperance represents moderation, balance, patience, and the art of mixing apparently contradictory elements into harmony. Reversed: imbalance, excess, or lack of long-term vision.',
    culturalTags: ['tarot', 'divination', 'major_arcana', 'balance', 'alchemy', 'moderation', 'integration']
  },
  {
    id: 'tarot_devil',
    unicode: '😈',
    category: SymbolCategory.TAROT_MAJOR_ARCANA,
    meaning: 'The Devil (XV) - Baphomet enthroned, with a man and woman chained before him—but the chains are loose. They could leave. The Devil reveals our bondage to material obsession, addiction, shadow, and self-imposed limitation. His inverted torch burns wastefully downward. Yet he teaches: knowing your darkness is the first step to freedom. Represents shadow work, bondage, temptation, and the call to examine what truly chains us. Reversed: breaking free, reclaiming power, or avoiding shadow work.',
    culturalTags: ['tarot', 'divination', 'major_arcana', 'shadow', 'bondage', 'materialism', 'liberation']
  },
  {
    id: 'tarot_tower',
    unicode: '🗼',
    category: SymbolCategory.TAROT_MAJOR_ARCANA,
    meaning: 'The Tower (XVI) - Lightning strikes a tower built on false foundations; figures fall as flames burst forth. The crown at the top—ego, false certainty—is blown off by divine fire. The Tower represents the destruction of illusion, sudden upheaval, revelation that shatters comfortable lies. Painful but necessary: what falls was never secure. From the rubble, truth can be rebuilt. Liberation through breakdown. Reversed: avoiding disaster, fear of change, or prolonged crisis.',
    culturalTags: ['tarot', 'divination', 'major_arcana', 'upheaval', 'revelation', 'destruction', 'liberation']
  },
  {
    id: 'tarot_star',
    unicode: '⭐',
    category: SymbolCategory.TAROT_MAJOR_ARCANA,
    meaning: 'The Star (XVII) - After the Tower\'s destruction, hope returns. A naked woman kneels by water, pouring from two jugs—one into the pool of the unconscious, one onto land. Eight stars shine above, the largest a symbol of Venus. The Star represents hope, inspiration, renewal, and serenity after crisis. The soul, stripped of pretense, connects directly with the divine source. Reversed: despair, disconnection, or lack of faith.',
    culturalTags: ['tarot', 'divination', 'major_arcana', 'hope', 'inspiration', 'renewal', 'healing']
  },
  {
    id: 'tarot_moon',
    unicode: '🌕',
    category: SymbolCategory.TAROT_MAJOR_ARCANA,
    meaning: 'The Moon (XVIII) - A full moon shines on a strange landscape: a path between two towers, a dog and wolf howling, a crayfish emerging from a pool. This is the territory of dreams, fears, illusions, and the unconscious. The Moon represents the journey through darkness, confronting fears, intuition, and the deceptive light that reveals as much as it hides. Trust yourself but verify. Reversed: confusion, repressed emotions, or clarity emerging.',
    culturalTags: ['tarot', 'divination', 'major_arcana', 'illusion', 'unconscious', 'fear', 'intuition']
  },
  {
    id: 'tarot_sun',
    unicode: '☀️',
    category: SymbolCategory.TAROT_MAJOR_ARCANA,
    meaning: 'The Sun (XIX) - The child rides a white horse under a blazing sun, arms open to joy. Sunflowers turn toward the light; a red banner of vitality waves. After the Moon\'s confusion, clarity returns. The Sun represents success, vitality, joy, and the innocent happiness of a child. Everything is illuminated; nothing is hidden. Life says yes. Reversed: temporary setbacks, dampened enthusiasm, or inner child blocked.',
    culturalTags: ['tarot', 'divination', 'major_arcana', 'joy', 'success', 'vitality', 'clarity']
  },
  {
    id: 'tarot_judgement',
    unicode: '📯',
    category: SymbolCategory.TAROT_MAJOR_ARCANA,
    meaning: 'Judgement (XX) - The archangel Gabriel blows his trumpet; the dead rise from their coffins, arms upraised. This is the Last Judgment, but also the moment of self-evaluation—answering the call to become who you truly are. Judgement represents resurrection, inner calling, absolution, and the moment of reckoning with one\'s life purpose. The past is released; rebirth awaits. Reversed: self-doubt, inability to forgive, or ignoring the call.',
    culturalTags: ['tarot', 'divination', 'major_arcana', 'calling', 'rebirth', 'judgement', 'purpose']
  },
  {
    id: 'tarot_world',
    unicode: '🌍',
    category: SymbolCategory.TAROT_MAJOR_ARCANA,
    meaning: 'The World (XXI) - A dancing figure enclosed in a laurel wreath, the four living creatures in the corners. The Fool\'s journey is complete—wholeness achieved, integration accomplished. Yet the circle implies another beginning. The World represents completion, integration, accomplishment, and the understanding that ending is beginning. The cosmic dance continues. You contain multitudes. Reversed: seeking closure, delays, or incomplete cycles.',
    culturalTags: ['tarot', 'divination', 'major_arcana', 'completion', 'wholeness', 'integration', 'accomplishment']
  }
];

const tarotMinorSuits = [
  // ═══════════════════════════════════════════════════════════════════
  // MINOR ARCANA - SUIT SYMBOLS
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'tarot_wands',
    unicode: '🪄',
    category: SymbolCategory.TAROT_MINOR_ARCANA,
    meaning: 'Suit of Wands - The element of Fire, representing will, creativity, passion, and spiritual energy. Wands are the spark of inspiration, the drive to create and achieve. Associated with the fire signs (Aries, Leo, Sagittarius) and the realm of career, enterprise, and personal power. When wands appear, look to matters of ambition, growth, and creative expression.',
    culturalTags: ['tarot', 'divination', 'minor_arcana', 'fire', 'will', 'creativity', 'passion']
  },
  {
    id: 'tarot_cups',
    unicode: '🏆',
    category: SymbolCategory.TAROT_MINOR_ARCANA,
    meaning: 'Suit of Cups - The element of Water, representing emotion, intuition, relationships, and the unconscious. Cups hold our feelings—love, grief, joy, desire. Associated with water signs (Cancer, Scorpio, Pisces) and matters of heart and soul. When cups appear, examine your emotional life, relationships, and creative flow.',
    culturalTags: ['tarot', 'divination', 'minor_arcana', 'water', 'emotion', 'intuition', 'relationships']
  },
  {
    id: 'tarot_swords',
    unicode: '🗡️',
    category: SymbolCategory.TAROT_MINOR_ARCANA,
    meaning: 'Suit of Swords - The element of Air, representing thought, conflict, truth, and communication. Swords cut through illusion but can also wound; the mind is both weapon and tool. Associated with air signs (Gemini, Libra, Aquarius) and matters of intellect and strife. When swords appear, mental challenges, decisions, and communications are highlighted.',
    culturalTags: ['tarot', 'divination', 'minor_arcana', 'air', 'thought', 'conflict', 'truth']
  },
  {
    id: 'tarot_pentacles',
    unicode: '⭐',
    category: SymbolCategory.TAROT_MINOR_ARCANA,
    meaning: 'Suit of Pentacles - The element of Earth, representing material reality, work, health, and practical matters. Pentacles (also called Coins or Disks) deal with what can be touched and measured. Associated with earth signs (Taurus, Virgo, Capricorn) and matters of finance, work, and physical well-being. When pentacles appear, ground your focus in practical reality.',
    culturalTags: ['tarot', 'divination', 'minor_arcana', 'earth', 'material', 'work', 'health']
  }
];

// Named export for tarotSymbols (used by index.js)
export const tarotSymbols = [...tarotMajorArcana, ...tarotMinorSuits];

export default {
  tarotMajorArcana,
  tarotMinorSuits,
  tarotSymbols
};