
/**
 * I Ching (Book of Changes) Symbol Definitions
 * 
 * The 64 hexagrams representing all possible combinations of yin and yang
 * lines in groups of six. Each hexagram encodes millennia of Chinese
 * philosophical wisdom about change, relationships, and the nature of reality.
 * 
 * Unicode range: U+4DC0 to U+4DFF (Yijing Hexagram Symbols)
 */

import { SymbolCategory } from './base.js';

const ichingHexagrams = [
  // ═══════════════════════════════════════════════════════════════════
  // THE 64 HEXAGRAMS
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'iching_01_qian',
    unicode: '䷀',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 1: Qián (乾) - The Creative/Heaven - Six unbroken yang lines representing pure creative power. The dragon rises through the clouds, embodying the active, initiating principle of the universe. This is the father, the sky, the unstoppable force of creation and initiative. Key message: Act with perseverance and integrity; the time is right for leadership and bold moves. The Superior Person acts with strength and tireless persistence.',
    culturalTags: ['iching', 'divination', 'chinese', 'yang', 'heaven', 'creative', 'leadership']
  },
  {
    id: 'iching_02_kun',
    unicode: '䷁',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 2: Kūn (坤) - The Receptive/Earth - Six broken yin lines representing pure receptive power. The mare moves with gentle strength across the earth, embodying the nurturing, responsive principle. This is the mother, the earth that receives and brings forth. Key message: Remain receptive to guidance; follow rather than lead. The Superior Person accepts fate with grace, carrying burdens without complaint.',
    culturalTags: ['iching', 'divination', 'chinese', 'yin', 'earth', 'receptive', 'devotion']
  },
  {
    id: 'iching_03_zhun',
    unicode: '䷂',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 3: Zhūn (屯) - Difficulty at the Beginning/Sprouting - Water above Thunder: the sprout pushing through frozen ground. Beginning is always difficult; the blade of grass must crack concrete to reach light. Chaos precedes order in creation. Key message: Persist through initial difficulties; seek help rather than forcing outcomes. The Superior Person brings order out of confusion by organizing helpers.',
    culturalTags: ['iching', 'divination', 'chinese', 'difficulty', 'beginning', 'growth', 'perseverance']
  },
  {
    id: 'iching_04_meng',
    unicode: '䷃',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 4: Méng (蒙) - Youthful Folly/Inexperience - Mountain above Water: the spring at the mountain\'s foot, unclear where to flow. The young student doesn\'t seek the teacher; the teacher awaits the sincere question. Ignorance is not stupidity but the opportunity for learning. Key message: Be humble in learning; don\'t ask the same question twice. The Superior Person nurtures character through clear thinking.',
    culturalTags: ['iching', 'divination', 'chinese', 'learning', 'youth', 'education', 'humility']
  },
  {
    id: 'iching_05_xu',
    unicode: '䷄',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 5: Xū (需) - Waiting/Nourishment - Water above Heaven: clouds gather, rain must come, but not yet. True waiting is not passive anxiety but active preparation and enjoyment of the present. The danger ahead requires resources gathered now. Key message: Wait with patience and confidence; strengthen yourself for what comes. The Superior Person eats, drinks, and is merry while waiting.',
    culturalTags: ['iching', 'divination', 'chinese', 'patience', 'waiting', 'preparation', 'timing']
  },
  {
    id: 'iching_06_song',
    unicode: '䷅',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 6: Sòng (訟) - Conflict/Lawsuit - Heaven above Water: movement in opposite directions, the structure of disagreement. When forces oppose, victory leaves bitter residue. Conflict expends the resources better used for creation. Key message: Avoid conflict if possible; if unavoidable, seek mediation. The Superior Person carefully considers beginning undertakings.',
    culturalTags: ['iching', 'divination', 'chinese', 'conflict', 'dispute', 'caution', 'resolution']
  },
  {
    id: 'iching_07_shi',
    unicode: '䷆',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 7: Shī (師) - The Army/Collective Force - Earth above Water: hidden force beneath the surface, like an army below ground level. Leadership of groups requires discipline, clear purpose, and moral authority. Power must serve, not dominate. Key message: Organize people under principled leadership; discipline with justice. The Superior Person increases followers by generosity.',
    culturalTags: ['iching', 'divination', 'chinese', 'army', 'leadership', 'discipline', 'organization']
  },
  {
    id: 'iching_08_bi',
    unicode: '䷇',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 8: Bǐ (比) - Holding Together/Union - Water above Earth: water on earth, finding its level, uniting in pools. Union comes from shared purpose and mutual benefit, not coercion. The right time to form alliances. Key message: Seek unity with like-minded others; examine motives for joining. The Superior Person builds relationships through reliability.',
    culturalTags: ['iching', 'divination', 'chinese', 'union', 'alliance', 'cooperation', 'trust']
  },
  {
    id: 'iching_09_xiaoxu',
    unicode: '䷈',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 9: Xiǎo Xù (小畜) - Small Taming/Restraint of the Small - Wind above Heaven: gentle wind restrains even heaven for a moment. Small forces can temporarily check large ones; patience accumulates power for later. Key message: Make gradual progress; restrain impulses with gentle persistence. The Superior Person refines cultural expression.',
    culturalTags: ['iching', 'divination', 'chinese', 'restraint', 'patience', 'accumulation', 'gentleness']
  },
  {
    id: 'iching_10_lu',
    unicode: '䷉',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 10: Lǚ (履) - Treading/Conduct - Heaven above Lake: walking on the tiger\'s tail—how you conduct yourself in dangerous situations. Proper conduct brings safety even in peril; awareness of one\'s place prevents offense. Key message: Tread carefully but confidently; maintain propriety in all dealings. The Superior Person distinguishes high and low, settling the hearts of people.',
    culturalTags: ['iching', 'divination', 'chinese', 'conduct', 'caution', 'propriety', 'danger']
  },
  {
    id: 'iching_11_tai',
    unicode: '䷊',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 11: Tài (泰) - Peace/Prosperity - Earth above Heaven: earth descending, heaven ascending, forces meeting in harmony. This is spring, new growth, abundance. Yin and yang in perfect balance create flourishing. Key message: Embrace this time of peace and growth; share prosperity generously. The Superior Person unites high and low in common enterprise.',
    culturalTags: ['iching', 'divination', 'chinese', 'peace', 'prosperity', 'harmony', 'spring']
  },
  {
    id: 'iching_12_pi',
    unicode: '䷋',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 12: Pǐ (否) - Standstill/Stagnation - Heaven above Earth: forces moving apart, communication blocked, stagnation and decline. Yet stagnation carries the seed of breakthrough; winter prepares spring. Key message: Withdraw from deteriorating conditions; preserve yourself for better times. The Superior Person avoids difficulties by restraining virtue within.',
    culturalTags: ['iching', 'divination', 'chinese', 'stagnation', 'obstruction', 'decline', 'withdrawal']
  },
  {
    id: 'iching_13_tongren',
    unicode: '䷌',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 13: Tóng Rén (同人) - Fellowship/Community - Heaven above Fire: fire rises to meet heaven, illuminating all equally. True community based on shared principles transcends personal interests. Unity comes from what we value together. Key message: Build alliances on principle, not convenience; openness brings unity. The Superior Person organizes clans and distinguishes things.',
    culturalTags: ['iching', 'divination', 'chinese', 'fellowship', 'community', 'unity', 'openness']
  },
  {
    id: 'iching_14_dayou',
    unicode: '䷍',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 14: Dà Yǒu (大有) - Great Possession/Abundance - Fire above Heaven: the sun at zenith illuminating all things. Supreme success, great power, abundant resources—but with wealth comes responsibility. Key message: Use abundance wisely and generously; avoid arrogance. The Superior Person suppresses evil and promotes good, fulfilling heaven\'s will.',
    culturalTags: ['iching', 'divination', 'chinese', 'abundance', 'success', 'responsibility', 'generosity']
  },
  {
    id: 'iching_15_qian',
    unicode: '䷎',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 15: Qiān (謙) - Modesty/Humility - Earth above Mountain: the mountain hidden beneath earth, great strength that doesn\'t display itself. Modesty is not weakness but wisdom—the full grain bows its head. Key message: Cultivate humility; let your work speak for itself. The Superior Person reduces excess and increases what is lacking, weighing things justly.',
    culturalTags: ['iching', 'divination', 'chinese', 'modesty', 'humility', 'balance', 'wisdom']
  },
  {
    id: 'iching_16_yu',
    unicode: '䷏',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 16: Yù (豫) - Enthusiasm/Delight - Thunder above Earth: thunder rising from the earth, stirring all creatures with energy. Enthusiasm moves people; joy opens possibilities. Music and celebration create harmony. Key message: Inspire through genuine enthusiasm; timing is right for action. The Superior Person makes music to honor virtue.',
    culturalTags: ['iching', 'divination', 'chinese', 'enthusiasm', 'joy', 'inspiration', 'music']
  },
  {
    id: 'iching_17_sui',
    unicode: '䷐',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 17: Suí (隨) - Following/Adaptation - Lake above Thunder: thunder resting beneath the lake, activity in repose. To lead, one must first learn to follow; to influence, one must adapt. Key message: Follow worthy leaders; know when to lead and when to follow. The Superior Person rests and recovers at nightfall.',
    culturalTags: ['iching', 'divination', 'chinese', 'following', 'adaptation', 'service', 'rest']
  },
  {
    id: 'iching_18_gu',
    unicode: '䷑',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 18: Gǔ (蠱) - Work on the Decayed/Repair - Mountain above Wind: stagnant wind beneath the mountain, decay requiring attention. What has been corrupted must be corrected; what ancestors neglected, descendants must repair. Key message: Address inherited problems; reform what has deteriorated. The Superior Person stirs up people and nourishes virtue.',
    culturalTags: ['iching', 'divination', 'chinese', 'decay', 'repair', 'reform', 'correction']
  },
  {
    id: 'iching_19_lin',
    unicode: '䷒',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 19: Lín (臨) - Approach/Advancing - Earth above Lake: earth approaching the lake, the great approaching the small. Those in power approach subjects with care; success comes from proper relationships. Key message: Approach others with sincerity; leadership requires genuine connection. The Superior Person teaches and nurtures inexhaustibly.',
    culturalTags: ['iching', 'divination', 'chinese', 'approach', 'influence', 'leadership', 'sincerity']
  },
  {
    id: 'iching_20_guan',
    unicode: '䷓',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 20: Guān (觀) - Contemplation/Observation - Wind above Earth: wind blowing over earth, seeing all. The ruler observes the people; the people observe the ruler. Clear seeing reveals truth on all levels. Key message: Observe carefully before acting; set examples worthy of observation. The Superior Person inspects all regions and observes the people.',
    culturalTags: ['iching', 'divination', 'chinese', 'contemplation', 'observation', 'insight', 'example']
  },
  {
    id: 'iching_21_shihe',
    unicode: '䷔',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 21: Shì Kè (噬嗑) - Biting Through/Decisive Action - Fire above Thunder: lightning and thunder together, decisive force. Something obstructs union; it must be bitten through. Justice requires punishment; obstacles require force. Key message: Remove obstacles decisively; apply justice firmly and fairly. The Superior Person clarifies punishments and enforces laws.',
    culturalTags: ['iching', 'divination', 'chinese', 'decisiveness', 'justice', 'obstacles', 'action']
  },
  {
    id: 'iching_22_bi',
    unicode: '䷕',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 22: Bì (賁) - Grace/Adornment - Mountain above Fire: fire at the foot of the mountain, illuminating beauty. Form enhances content; beauty reveals truth. But adornment alone is empty—substance must precede style. Key message: Cultivate both inner substance and outer grace; beauty serves deeper purpose. The Superior Person illuminates all affairs without daring to decide legal disputes.',
    culturalTags: ['iching', 'divination', 'chinese', 'grace', 'beauty', 'adornment', 'culture']
  },
  {
    id: 'iching_23_bo',
    unicode: '䷖',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 23: Bō (剝) - Splitting Apart/Erosion - Mountain above Earth: the mountain erodes from below. Dark forces undermine foundations; what seemed solid crumbles. This is autumn, the decline before winter. Key message: Accept necessary losses; preserve what matters most. The Superior Person strengthens foundations through generosity below.',
    culturalTags: ['iching', 'divination', 'chinese', 'decline', 'erosion', 'loss', 'acceptance']
  },
  {
    id: 'iching_24_fu',
    unicode: '䷗',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 24: Fù (復) - Return/Turning Point - Earth above Thunder: thunder in the earth, the first yang returning after yin\'s dominance. Winter solstice—the darkest night begins the return to light. Renewal emerges from the depths. Key message: Allow natural recovery; don\'t force what will come naturally. The Superior Person rests during the solstice, not traveling.',
    culturalTags: ['iching', 'divination', 'chinese', 'return', 'renewal', 'turning', 'solstice']
  },
  {
    id: 'iching_25_wuwang',
    unicode: '䷘',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 25: Wú Wàng (無妄) - Innocence/The Unexpected - Heaven above Thunder: thunder under heaven, energy moving naturally without ulterior motive. True innocence acts spontaneously from natural goodness. Unexpected events test and reveal character. Key message: Act from pure motives; accept what comes without trying to manipulate. The Superior Person nurtures all beings in accord with heaven.',
    culturalTags: ['iching', 'divination', 'chinese', 'innocence', 'spontaneity', 'purity', 'unexpected']
  },
  {
    id: 'iching_26_daxu',
    unicode: '䷙',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 26: Dà Xù (大畜) - Great Taming/Accumulation - Mountain above Heaven: heaven\'s energy contained by the mountain, great power held in check. Resources accumulate; restraint builds strength. Past wisdom serves present needs. Key message: Gather resources and study the past; restrain power until the right moment. The Superior Person studies words and deeds of the past.',
    culturalTags: ['iching', 'divination', 'chinese', 'accumulation', 'restraint', 'resources', 'wisdom']
  },
  {
    id: 'iching_27_yi',
    unicode: '䷚',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 27: Yí (頤) - Nourishment/Jaws - Mountain above Thunder: the mouth that nourishes—what we take in and what we put out. Physical food and spiritual food alike require discernment. You become what you consume. Key message: Be careful what you feed body and mind; speak only what nourishes. The Superior Person is careful in speech and moderate in eating.',
    culturalTags: ['iching', 'divination', 'chinese', 'nourishment', 'speech', 'consumption', 'discernment']
  },
  {
    id: 'iching_28_daguo',
    unicode: '䷛',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 28: Dà Guò (大過) - Great Exceeding/Critical Mass - Lake above Wind: the beam sagging under excessive weight, the situation about to collapse. Something must give; extraordinary measures are needed for extraordinary times. Key message: Act independently in crisis; the ordinary rules don\'t apply. The Superior Person stands alone without fear, withdraws from the world without regret.',
    culturalTags: ['iching', 'divination', 'chinese', 'excess', 'crisis', 'pressure', 'extraordinary']
  },
  {
    id: 'iching_29_kan',
    unicode: '䷜',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 29: Kǎn (坎) - The Abysmal/Water - Water doubled: danger upon danger, the pit within the pit. Like water, one must flow through danger, not fight it. Sincerity and consistency carry one through. Key message: Maintain integrity in danger; flow like water around obstacles. The Superior Person consistently practices virtue and teaches.',
    culturalTags: ['iching', 'divination', 'chinese', 'danger', 'water', 'abyss', 'sincerity']
  },
  {
    id: 'iching_30_li',
    unicode: '䷝',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 30: Lí (離) - The Clinging/Fire - Fire doubled: radiance that depends on fuel, clarity that depends on what it illuminates. Fire clings to wood; consciousness clings to its objects. Brightness requires something to shine upon. Key message: Recognize your dependencies; let clarity illuminate rather than consume. The Superior Person perpetuates brightness, illuminating the four directions.',
    culturalTags: ['iching', 'divination', 'chinese', 'fire', 'clarity', 'dependence', 'illumination']
  },
  {
    id: 'iching_31_xian',
    unicode: '䷞',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 31: Xián (咸) - Influence/Wooing - Lake above Mountain: the mountain drawing moisture upward, mutual attraction. The youngest son courts the youngest daughter; mutual influence through openness. Key message: Remain receptive to influence; genuine attraction requires vulnerability. The Superior Person accepts others with openness.',
    culturalTags: ['iching', 'divination', 'chinese', 'influence', 'attraction', 'courtship', 'receptivity']
  },
  {
    id: 'iching_32_heng',
    unicode: '䷟',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 32: Héng (恆) - Duration/Constancy - Thunder above Wind: thunder and wind reinforce each other, movement within gentleness. Enduring relationships and institutions require consistent principles, not rigid rules. Key message: Maintain constancy without stagnation; adapt means while preserving ends. The Superior Person stands firm without changing direction.',
    culturalTags: ['iching', 'divination', 'chinese', 'duration', 'constancy', 'endurance', 'marriage']
  },
  {
    id: 'iching_33_dun',
    unicode: '䷠',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 33: Dùn (遯) - Retreat/Withdrawal - Heaven above Mountain: heaven withdrawing from the mountain, strategic retreat. When dark forces advance, wisdom lies in timely withdrawal—not defeat but reposition. Key message: Retreat with dignity when necessary; preserve strength for better times. The Superior Person keeps small people distant—not with hatred but with reserve.',
    culturalTags: ['iching', 'divination', 'chinese', 'retreat', 'withdrawal', 'strategy', 'preservation']
  },
  {
    id: 'iching_34_dazhuang',
    unicode: '䷡',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 34: Dà Zhuàng (大壯) - Great Power/Strength - Thunder above Heaven: thunder in the sky, the display of great force. Power is rising; but great power requires great restraint. The ram butts against the hedge—strength without wisdom injures itself. Key message: Use power responsibly; strength restrained is strength preserved. The Superior Person avoids improper paths.',
    culturalTags: ['iching', 'divination', 'chinese', 'power', 'strength', 'restraint', 'responsibility']
  },
  {
    id: 'iching_35_jin',
    unicode: '䷢',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 35: Jìn (晉) - Progress/Advancement - Fire above Earth: the sun rising over earth, bright advance. This is the time of increasing influence and recognition; obstacles clear and opportunities appear. Key message: Advance confidently; accept recognition gracefully. The Superior Person brightens their brilliant virtue.',
    culturalTags: ['iching', 'divination', 'chinese', 'progress', 'advancement', 'sunrise', 'recognition']
  },
  {
    id: 'iching_36_mingyi',
    unicode: '䷣',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 36: Míng Yí (明夷) - Darkening of the Light - Earth above Fire: the sun sinking below earth, light obscured. In times of darkness, the wise person dims their light to survive—concealing virtue, not abandoning it. Key message: Protect yourself in dark times; hide your light but don\'t extinguish it. The Superior Person rules the masses—veiling brightness, yet still shining.',
    culturalTags: ['iching', 'divination', 'chinese', 'darkness', 'concealment', 'adversity', 'survival']
  },
  {
    id: 'iching_37_jiaren',
    unicode: '䷤',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 37: Jiā Rén (家人) - The Family/Household - Wind above Fire: wind born from fire, influence spreading outward from a central source. Order begins at home; the family is the training ground for society. Key message: Cultivate harmony at home; proper roles create proper relationships. The Superior Person speaks with substance and acts with consistency.',
    culturalTags: ['iching', 'divination', 'chinese', 'family', 'household', 'order', 'relationships']
  },
  {
    id: 'iching_38_kui',
    unicode: '䷥',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 38: Kuí (睽) - Opposition/Divergence - Fire above Lake: fire rises, water falls—natural opposition. Yet even opposing forces can cooperate for greater purposes; diversity can serve unity. Key message: Find common ground despite differences; small successes prepare great ones. The Superior Person maintains individuality within community.',
    culturalTags: ['iching', 'divination', 'chinese', 'opposition', 'diversity', 'estrangement', 'reconciliation']
  },
  {
    id: 'iching_39_jian',
    unicode: '䷦',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 39: Jiǎn (蹇) - Obstruction/Difficulty - Water above Mountain: dangerous water before, steep mountain behind—nowhere easy to go. When every path is blocked, look inward and improve yourself. Key message: When external progress is blocked, develop internal resources. The Superior Person turns inward to cultivate virtue.',
    culturalTags: ['iching', 'divination', 'chinese', 'obstruction', 'difficulty', 'introspection', 'development']
  },
  {
    id: 'iching_40_jie',
    unicode: '䷧',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 40: Jiě (解) - Deliverance/Liberation - Thunder above Water: spring thunder releases winter\'s tension, the storm clears and liberation comes. After struggle, relief; after obstruction, release. Key message: When freed, act quickly to consolidate gains; forgive and move forward. The Superior Person forgives errors and pardons crimes.',
    culturalTags: ['iching', 'divination', 'chinese', 'liberation', 'release', 'forgiveness', 'relief']
  },
  {
    id: 'iching_41_sun',
    unicode: '䷨',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 41: Sǔn (損) - Decrease/Reduction - Mountain above Lake: the mountain increases by the lake\'s decrease; resources flow to where they\'re needed. Voluntary sacrifice for higher purposes creates abundance elsewhere. Key message: Reduce excess to strengthen foundations; sacrifice brings gain. The Superior Person restrains anger and blocks desires.',
    culturalTags: ['iching', 'divination', 'chinese', 'decrease', 'sacrifice', 'simplicity', 'restraint']
  },
  {
    id: 'iching_42_yi',
    unicode: '䷩',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 42: Yì (益) - Increase/Benefit - Wind above Thunder: wind and thunder increase each other, mutual benefit. Those above benefit those below; the benefit returns magnified. This is the time to undertake great projects. Key message: Be generous when increasing; use surplus for worthy purposes. The Superior Person improves by seeing good, corrects by seeing errors.',
    culturalTags: ['iching', 'divination', 'chinese', 'increase', 'benefit', 'generosity', 'growth']
  },
  {
    id: 'iching_43_guai',
    unicode: '䷪',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 43: Guài (夬) - Breakthrough/Resolution - Lake above Heaven: waters breaking through the dam, decisive resolution. One dark line remains at the top—the final obstacle must be resolved, but carefully. Key message: Complete what\'s begun, but don\'t become what you oppose. The Superior Person distributes gifts below and dwells in virtue.',
    culturalTags: ['iching', 'divination', 'chinese', 'breakthrough', 'resolution', 'decisiveness', 'completion']
  },
  {
    id: 'iching_44_gou',
    unicode: '䷫',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 44: Gòu (姤) - Coming to Meet/Encounter - Heaven above Wind: wind beneath heaven, the unexpected meeting. One yin line enters from below—something dark approaches the light. Temptation comes disguised as opportunity. Key message: Be wary of seemingly innocent attractions; don\'t let small influences grow. The Superior Person proclaims mandates to the four quarters.',
    culturalTags: ['iching', 'divination', 'chinese', 'encounter', 'temptation', 'caution', 'awareness']
  },
  {
    id: 'iching_45_cui',
    unicode: '䷬',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 45: Cuì (萃) - Gathering/Massing - Lake above Earth: water gathering in low places, people gathering for common purpose. Great gatherings require great leadership and proper sacrifice. Key message: Unite people through shared values and rituals; prepare for what large gatherings attract. The Superior Person renews weapons to meet the unexpected.',
    culturalTags: ['iching', 'divination', 'chinese', 'gathering', 'community', 'leadership', 'ritual']
  },
  {
    id: 'iching_46_sheng',
    unicode: '䷭',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 46: Shēng (升) - Pushing Upward/Ascending - Earth above Wind: plants pushing up through earth, gentle but persistent growth. Progress through steady effort, not sudden leaps. The southern direction is favorable. Key message: Advance steadily; seek guidance from those above. The Superior Person accumulates small steps to climb high.',
    culturalTags: ['iching', 'divination', 'chinese', 'ascending', 'growth', 'persistence', 'effort']
  },
  {
    id: 'iching_47_kun',
    unicode: '䷮',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 47: Kùn (困) - Oppression/Exhaustion - Lake above Water: water draining from the lake, resources depleted. Words are not believed; silence serves better than speech. Adversity tests character and reveals depth. Key message: Maintain cheerfulness in adversity; words won\'t help—only steadfast action. The Superior Person stakes their life on following their will.',
    culturalTags: ['iching', 'divination', 'chinese', 'oppression', 'exhaustion', 'adversity', 'endurance']
  },
  {
    id: 'iching_48_jing',
    unicode: '䷯',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 48: Jǐng (井) - The Well - Water above Wind: water drawn up by wood, the unchanging well that serves all. The town may move, but the well stays; the well doesn\'t change, but ropes may be too short. Access to depth requires proper tools. Key message: Maintain access to inner resources; serve the community consistently. The Superior Person encourages people and urges mutual assistance.',
    culturalTags: ['iching', 'divination', 'chinese', 'well', 'depth', 'service', 'constancy']
  },
  {
    id: 'iching_49_ge',
    unicode: '䷰',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 49: Gé (革) - Revolution/Transformation - Lake above Fire: fire beneath the lake, evaporation and fundamental change. When the old order can no longer serve, revolution becomes necessary. But revolution requires the right time and right person. Key message: Transform only when the time is ripe; afterward, regret disappears. The Superior Person orders the calendar and clarifies the seasons.',
    culturalTags: ['iching', 'divination', 'chinese', 'revolution', 'transformation', 'change', 'timing']
  },
  {
    id: 'iching_50_ding',
    unicode: '䷱',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 50: Dǐng (鼎) - The Cauldron/Vessel - Fire above Wind: fire cooking food in a vessel, transformation through the proper medium. The cauldron is civilization itself—the vessel that transforms raw into refined. Key message: Use the right vessel for transformation; form enables content. The Superior Person solidifies fate by correcting position.',
    culturalTags: ['iching', 'divination', 'chinese', 'cauldron', 'vessel', 'culture', 'nourishment']
  },
  {
    id: 'iching_51_zhen',
    unicode: '䷲',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 51: Zhèn (震) - The Arousing/Thunder - Thunder doubled: shock upon shock, the earthquake of sudden change. Terrifying but clarifying—after the thunder, laughter and relief. Those who prepare survive what destroys the careless. Key message: Let shock awaken without destroying; use fear for vigilance. The Superior Person trembles with fear and cultivates virtue.',
    culturalTags: ['iching', 'divination', 'chinese', 'thunder', 'shock', 'awakening', 'vigilance']
  },
  {
    id: 'iching_52_gen',
    unicode: '䷳',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 52: Gèn (艮) - Keeping Still/Mountain - Mountain doubled: stillness upon stillness, meditation and rest. Movement stops at the right point; the back is kept still so the body forgets itself. Tranquility reveals truth that motion obscures. Key message: Know when to stop; stillness restores what activity depletes. The Superior Person thinks not beyond their position.',
    culturalTags: ['iching', 'divination', 'chinese', 'mountain', 'stillness', 'meditation', 'rest']
  },
  {
    id: 'iching_53_jian',
    unicode: '䷴',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 53: Jiàn (漸) - Development/Gradual Progress - Wind above Mountain: the tree growing slowly on the mountain. The wild goose approaches the shore gradually, safely. Marriage proceeds through proper stages—nothing rushed. Key message: Advance step by step; proper sequence ensures proper outcome. The Superior Person abides in dignity and virtue.',
    culturalTags: ['iching', 'divination', 'chinese', 'gradual', 'development', 'progress', 'marriage']
  },
  {
    id: 'iching_54_guimei',
    unicode: '䷵',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 54: Guī Mèi (歸妹) - The Marrying Maiden - Thunder above Lake: the younger sister marrying, following strong external movement. Subordinate position requires adaptability; second place is not defeat. Key message: Accept your current position; influence through service rather than control. The Superior Person understands decline through eternity.',
    culturalTags: ['iching', 'divination', 'chinese', 'marriage', 'subordination', 'adaptation', 'service']
  },
  {
    id: 'iching_55_feng',
    unicode: '䷶',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 55: Fēng (豐) - Abundance/Fullness - Thunder above Fire: thunder and lightning together, maximum brilliance and power. Abundance cannot last; the sun at noon begins to set. Use this time wisely—it will not come again. Key message: Act boldly at the peak; don\'t grieve when fullness naturally decreases. The Superior Person decides lawsuits and carries out punishments.',
    culturalTags: ['iching', 'divination', 'chinese', 'abundance', 'fullness', 'peak', 'impermanence']
  },
  {
    id: 'iching_56_lu',
    unicode: '䷷',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 56: Lǚ (旅) - The Wanderer/Traveling - Fire above Mountain: fire moving over the mountain, the traveler who doesn\'t stay. When away from home, propriety protects; small successes come through modesty. The stranger must adapt to local ways. Key message: Travel light; cultivate flexibility and politeness abroad. The Superior Person applies punishments with clarity and doesn\'t prolong litigation.',
    culturalTags: ['iching', 'divination', 'chinese', 'travel', 'wandering', 'stranger', 'adaptation']
  },
  {
    id: 'iching_57_xun',
    unicode: '䷸',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 57: Xùn (巽) - The Gentle/Wind - Wind doubled: penetrating influence, persistence that achieves by repetition. The gentle wind erodes mountains; constant influence changes minds that force cannot move. Key message: Gentle persistence succeeds where force fails; clarity of purpose enables yielding methods. The Superior Person announces mandates and carries out affairs.',
    culturalTags: ['iching', 'divination', 'chinese', 'wind', 'gentleness', 'penetration', 'persistence']
  },
  {
    id: 'iching_58_dui',
    unicode: '䷹',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 58: Duì (兌) - The Joyous/Lake - Lake doubled: lakes joined, friends discussing, mutual joy and exchange. True joy comes from inner strength expressed outwardly; forced gaiety exhausts. Key message: Cultivate genuine joy; share pleasures with others. The Superior Person joins with friends for discussion and practice.',
    culturalTags: ['iching', 'divination', 'chinese', 'joy', 'lake', 'friendship', 'pleasure']
  },
  {
    id: 'iching_59_huan',
    unicode: '䷺',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 59: Huàn (渙) - Dispersion/Dissolution - Wind above Water: wind scattering water, dissolving what has hardened. Religious ceremonies reunite scattered people; shared meaning overcomes separation. Key message: Dissolve rigidity through spiritual practice; use ritual to unite the scattered. The Superior Person makes offerings to the Supreme Lord and establishes temples.',
    culturalTags: ['iching', 'divination', 'chinese', 'dispersion', 'dissolution', 'unity', 'ritual']
  },
  {
    id: 'iching_60_jie',
    unicode: '䷻',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 60: Jié (節) - Limitation/Restraint - Water above Lake: water collected in the lake, limited but life-giving. Limits enable freedom; without banks, the river becomes swamp. But bitter limitation goes too far. Key message: Set appropriate limits; moderation enables accomplishment. The Superior Person creates number and measure and examines virtue and conduct.',
    culturalTags: ['iching', 'divination', 'chinese', 'limitation', 'restraint', 'moderation', 'boundaries']
  },
  {
    id: 'iching_61_zhongfu',
    unicode: '䷼',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 61: Zhōng Fú (中孚) - Inner Truth/Sincerity - Wind above Lake: wind over the lake, truth that moves hearts. The empty center of the hexagram represents openness; sincerity crosses barriers that cleverness cannot. Key message: Act from genuine inner truth; sincerity moves even pigs and fishes. The Superior Person discusses criminal cases to delay executions.',
    culturalTags: ['iching', 'divination', 'chinese', 'sincerity', 'truth', 'trust', 'influence']
  },
  {
    id: 'iching_62_xiaoguo',
    unicode: '䷽',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 62: Xiǎo Guò (小過) - Small Exceeding/Preponderance of Small - Thunder above Mountain: the bird flying low, attention to small matters. Great deeds are not the moment; focus on details, on what\'s achievable. The flying bird leaves its song. Key message: Focus on small steps; this is not the time for grand actions. The Superior Person favors reverence over luxury, grief over ceremony.',
    culturalTags: ['iching', 'divination', 'chinese', 'small', 'detail', 'modesty', 'care']
  },
  {
    id: 'iching_63_jiji',
    unicode: '䷾',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 63: Jì Jì (既濟) - After Completion/Already Crossing - Water above Fire: water and fire in their proper places, everything in order—for now. Completion is always temporary; the moment of success is the beginning of decline. Key message: Remain vigilant after success; don\'t assume completion lasts. The Superior Person reflects on troubles and prepares against them.',
    culturalTags: ['iching', 'divination', 'chinese', 'completion', 'order', 'transition', 'vigilance']
  },
  {
    id: 'iching_64_weiji',
    unicode: '䷿',
    category: SymbolCategory.ICHING_HEXAGRAMS,
    meaning: 'Hexagram 64: Wèi Jì (未濟) - Before Completion/Not Yet Crossing - Fire above Water: fire and water not in their places, nothing complete—but full of potential. Like spring before it blooms, the young fox almost across. Everything is becoming. Key message: Recognize that nothing is finished; remain hopeful and careful before the goal. The Superior Person carefully discriminates things and dwells in the proper places.',
    culturalTags: ['iching', 'divination', 'chinese', 'incompletion', 'potential', 'becoming', 'hope']
  }
];

export {
    ichingHexagrams
};