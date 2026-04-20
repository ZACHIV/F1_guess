const TRACK_NOTES = {
  en: {
    'Albert Park': 'A temporary park circuit that starts green and bumpy, then gets faster as rubber goes down. Its quick direction changes reward a sharp front end and a brave turn-in.',
    'Shanghai International Circuit': 'Shanghai opens with a tightening spiral of early corners and then launches into one of the longest straights on the calendar. It feels equal parts geometry lesson and slipstream trap.',
    Suzuka: 'Suzuka is a classic figure-eight driver’s circuit, full of flowing esses, commitment corners, and zero cheap lap time. If a car feels good here, it usually feels good everywhere.',
    'Bahrain International Circuit': 'Bahrain is a desert night race built on traction, braking, and temperature swings. The downhill Turn 10 and long traction zones make setup mistakes painfully obvious.',
    'Jeddah Corniche Circuit': 'Jeddah is the fastest street track in Formula 1, with huge average speed and very little breathing room. It feels like threading a car through walls at Monza pace.',
    'Miami International Autodrome': 'Miami mixes big-speed stadium spectacle with a fiddly technical middle sector. It is wide enough to race hard, but awkward enough to punish lazy placement.',
    Imola: 'Imola is narrow, old-school, and unforgiving in the best possible way. The lap flows over kerbs and elevation changes, and a small mistake usually grows teeth quickly.',
    'Circuit de Monaco': 'Monaco is all precision and no spare space. The lap is slow on paper, but mentally it is one of the fastest places to run out of margin.',
    'Circuit de Barcelona-Catalunya': 'Barcelona is a balanced all-rounder with long loaded corners and a bit of everything else. It has spent years being the track teams use to find out whether the car is actually honest.',
    'Circuit Gilles Villeneuve': 'Canada is a stop-start, low-downforce favourite built around hard braking and quick exits. One wall even has a permanent record of champions getting too greedy.',
    'Red Bull Ring': 'The Red Bull Ring is short, punchy, and built around three uphill blasts before a downhill rush through fast corners. It packs a lot of overtaking energy into a very small lap.',
    Silverstone: 'Silverstone is a high-speed classic where rhythm and aero confidence matter more than comfort. Sequences like Maggotts and Becketts feel closer to flying than steering.',
    'Spa-Francorchamps': 'Spa combines giant straights, fast compressions, and weather that can change by sector. A lap here always feels one step away from becoming a story.',
    Hungaroring: 'The Hungaroring is a tight rhythm circuit with barely any time to relax. It rewards a tidy chassis and punishes anyone who loses the sequence halfway through.',
    Zandvoort: 'Zandvoort rolls through the dunes like a coaster, complete with banking and constant elevation change. It is modernised, but still feels wonderfully old-school.',
    Monza: 'Monza is the Temple of Speed: huge full-throttle sections, giant braking zones, and almost no patience for drag. Every lap is basically a negotiation between courage and brake temperature.',
    'Baku City Circuit': 'Baku swings between one of the longest straights in F1 and a medieval old-town bottleneck. Teams spend the whole weekend choosing which half of the lap they want to suffer less in.',
    'Marina Bay': 'Marina Bay is hot, humid, and physically draining even before the walls enter the conversation. The night backdrop is glamorous, the lap itself is a serious workout.',
    'Circuit of the Americas': 'COTA is a greatest-hits remix with a giant uphill Turn 1 and an esses section inspired by other classics. It feels familiar, but the Texas scale gives everything more swagger.',
    'Autodromo Hermanos Rodriguez': 'Mexico’s high altitude makes the air thin, the braking strange, and the top speeds huge. The lap then dives into a stadium section that feels more like theatre than racetrack.',
    Interlagos: 'Interlagos is short, anti-clockwise, and always seems to exaggerate the drama. Elevation, camber, and the Senna S give it the feeling of a lap that is always in a hurry.',
    'Las Vegas Strip Circuit': 'Las Vegas is all long straights, late-night chill, and high-speed braking on the Strip itself. It looks like a show circuit and still manages to generate real racing problems.',
    'Lusail International Circuit': 'Lusail is a fast, flowing layout borrowed from the language of bike racing. Medium- and high-speed corners dominate, but the long main straight still leaves room to attack.',
    'Yas Marina Circuit': 'Yas Marina trades old-school chaos for clean, modern precision under the lights. It is defined by traction zones, hard braking points, and a polished twilight backdrop.'
  },
  zh: {
    'Albert Park': '阿尔伯特公园是一条临时街区赛道，周末初期通常偏滑又偏颠，随着橡胶铺开才会越来越快。它很吃前轴响应，方向变换要干净利落。',
    'Shanghai International Circuit': '上赛最有辨识度的是越收越紧的前两弯，以及后面那条超长直道。前段考线路，后段考尾速和刹车胆量。',
    Suzuka: '铃鹿是典型的车手赛道，S 弯、Degner、130R 连在一起，几乎没有“白送”的圈速。车在这里好开，通常说明整台车真的做对了。',
    'Bahrain International Circuit': '巴林是一条很看牵引和重刹车稳定性的沙漠夜赛道。下坡外倾的 T10 尤其挑人，设定不对会立刻暴露。',
    'Jeddah Corniche Circuit': '吉达是 F1 里最快的街道赛之一，平均速度高得离谱，墙也离得很近。它像是在蒙扎的速度里，硬塞进一整圈街道赛弯角。',
    'Miami International Autodrome': '迈阿密把体育场式的大开大合和中段技术区揉在了一起。够宽，能拼；也够别扭，稍微放松就会错节奏。',
    Imola: '伊莫拉狭窄、老派，而且对失误一点也不宽容。赛道靠路肩、起伏和连贯节奏吃饭，小错很容易滚成大错。',
    'Circuit de Monaco': '摩纳哥几乎没有多余空间，整圈都在考极限贴墙和手上精度。纸面速度不高，但精神压力永远是顶格的。',
    'Circuit de Barcelona-Catalunya': '巴塞罗那是一条非常均衡的综合型赛道，高中低速弯都有，所以长期被拿来当“赛车诚实度检测器”。',
    'Circuit Gilles Villeneuve': '加拿大站是典型的低下压力、重刹、强牵引赛道。它节奏停停走走，但墙会把每次贪心都记得很清楚。',
    'Red Bull Ring': '红牛环赛道圈很短，但能量很密。前半段连续上坡冲刺，后半段则是一串下坡高速弯，超车机会和节奏感都很强。',
    Silverstone: '银石是高速传统名场面集合地，像 Maggotts-Becketts 这样的连续高速变向非常考验空气动力学信心。开好一圈会有点像低空飞行。',
    'Spa-Francorchamps': '斯帕把超长直道、超高速弯和神出鬼没的天气全塞进了一圈里。你很难在这里跑出一圈完全“平静”的单圈。',
    Hungaroring: '亨格罗林常被说像卡丁车赛道，直线短、节奏紧，几乎没时间喘口气。这里更奖励底盘平衡和连弯节奏，而不是马力。',
    Zandvoort: '赞德沃特沿着沙丘起伏前进，带着过山车一样的节奏和大倾角弯。它经过现代化改造，但骨子里还是非常 old-school。',
    Monza: '蒙扎是“速度圣殿”，长时间全油门和几个大重刹区定义了一整圈。这里比的不是谁会磨时间，而是谁敢把速度一直留到刹车点。',
    'Baku City Circuit': '巴库一圈像两条赛道拼在一起：一边是超长主直道，一边是老城区的狭窄慢弯。调校永远在“要直道还是要弯道”之间拉扯。',
    'Marina Bay': '滨海湾又热又湿，街道赛路面还特别折腾人，体能消耗一直是重点。夜景很华丽，但方向盘背后的工作量一点都不轻松。',
    'Circuit of the Americas': '美洲赛道像一条“经典赛道元素混剪”，有夸张上坡的 T1，也有向银石和铃鹿致敬的连续弯。熟悉，但尺度很德州。',
    'Autodromo Hermanos Rodriguez': '墨西哥站的海拔很高，空气稀薄、尾速很夸张，刹车和下压力感受都会变得很特别。最后钻进体育场那一段，更像演出现场。',
    Interlagos: '英特拉格斯圈短、逆时针，而且总能把比赛戏剧性放大。高低起伏、外倾路面和 Senna S 让它整圈都像在催你快一点。',
    'Las Vegas Strip Circuit': '拉斯维加斯把巨长直道、夜晚低温和大道重刹车摆在同一张桌子上。看起来像秀场，跑起来却是实打实的竞速难题。',
    'Lusail International Circuit': '卢塞尔本来就带着摩托车赛道的基因，整体快速而流畅，中高速弯很多。主直道又足够长，所以进 T1 依然很有攻击性。',
    'Yas Marina Circuit': '亚斯码头是一条很现代、很干净的黄昏赛道，重点在牵引、重刹和出弯效率。它没有太多野性，但节奏和观感都很精致。'
  }
};

export function getTrackNote(trackName, locale = 'en') {
  return TRACK_NOTES[locale]?.[trackName] ?? TRACK_NOTES.en[trackName] ?? '';
}
