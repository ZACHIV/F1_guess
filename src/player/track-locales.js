export const TRACK_NAME_ZH = {
  'Albert Park': '阿尔伯特公园赛道',
  'Autodromo Hermanos Rodriguez': '罗德里格斯兄弟赛道',
  'Bahrain International Circuit': '巴林国际赛道',
  'Baku City Circuit': '巴库城市赛道',
  'Circuit Gilles Villeneuve': '吉尔·维伦纽夫赛道',
  'Circuit de Barcelona-Catalunya': '巴塞罗那-加泰罗尼亚赛道',
  'Circuit de Monaco': '摩纳哥赛道',
  'Circuit of the Americas': '美洲赛道',
  Hungaroring: '匈牙利赛道',
  Imola: '伊莫拉赛道',
  Interlagos: '英特拉格斯赛道',
  'Jeddah Corniche Circuit': '吉达滨海赛道',
  'Las Vegas Strip Circuit': '拉斯维加斯大道赛道',
  'Lusail International Circuit': '卢赛尔国际赛道',
  'Marina Bay': '滨海湾赛道',
  'Miami International Autodrome': '迈阿密国际赛道',
  Monza: '蒙扎赛道',
  'Red Bull Ring': '红牛环赛道',
  'Shanghai International Circuit': '上海国际赛车场',
  Silverstone: '银石赛道',
  'Spa-Francorchamps': '斯帕-弗朗科尔尚赛道',
  Suzuka: '铃鹿赛道',
  'Yas Marina Circuit': '亚斯码头赛道',
  Zandvoort: '赞德沃特赛道'
};

export const COUNTRY_NAME_ZH = {
  Australia: '澳大利亚',
  Austria: '奥地利',
  Azerbaijan: '阿塞拜疆',
  Bahrain: '巴林',
  Belgium: '比利时',
  Brazil: '巴西',
  Canada: '加拿大',
  China: '中国',
  Hungary: '匈牙利',
  Italy: '意大利',
  Japan: '日本',
  Mexico: '墨西哥',
  Monaco: '摩纳哥',
  Netherlands: '荷兰',
  Qatar: '卡塔尔',
  'Saudi Arabia': '沙特阿拉伯',
  Singapore: '新加坡',
  Spain: '西班牙',
  'United Arab Emirates': '阿联酋',
  'United Kingdom': '英国',
  'United States': '美国'
};

export function getTrackNameByLocale(trackName, locale) {
  if (locale === 'zh') {
    return TRACK_NAME_ZH[trackName] || trackName;
  }

  return trackName;
}

export function getCountryNameByLocale(countryName, locale) {
  if (locale === 'zh') {
    return COUNTRY_NAME_ZH[countryName] || countryName;
  }

  return countryName;
}

