window.SMART_MALL_PRODUCTS = [
  { id: 1, category: "器物", name: "手作粗陶马克杯", sub: "窑火留下的每一道纹理", price: 128, image: "assets/hero.svg", tag: "本周热卖", purchases: 328, publishedAt: "2024-06-18", listed: true },
  { id: 2, category: "香氛", name: "雨后松木香氛蜡烛", sub: "把森林带回家", price: 168, image: "assets/story.svg", tag: "NEW", purchases: 246, publishedAt: "2024-06-21", listed: true },
  { id: 3, category: "家居", name: "黄铜线条台灯", sub: "一盏有温度的光", price: 399, image: "assets/story.svg", tag: "", purchases: 191, publishedAt: "2024-05-30", listed: true },
  { id: 4, category: "穿搭", name: "亚麻编织手提袋", sub: "装下轻盈的周末", price: 219, image: "assets/hero.svg", tag: "少量现货", purchases: 184, publishedAt: "2024-06-08", listed: true },
  { id: 5, category: "家居", name: "云朵棉麻靠垫", sub: "给沙发一个拥抱", price: 149, image: "assets/story.svg", tag: "", purchases: 156, publishedAt: "2024-05-24", listed: true },
  { id: 6, category: "器物", name: "手工玻璃花瓶", sub: "让鲜花多停留一会儿", price: 188, image: "assets/hero.svg", tag: "", purchases: 139, publishedAt: "2024-06-12", listed: true },
  { id: 7, category: "香氛", name: "白茶与雪松扩香", sub: "清爽而安静的陪伴", price: 199, image: "assets/story.svg", tag: "", purchases: 127, publishedAt: "2024-05-17", listed: true },
  { id: 8, category: "穿搭", name: "日光织物渔夫帽", sub: "为晴天准备的帽子", price: 139, image: "assets/hero.svg", tag: "", purchases: 98, publishedAt: "2024-06-20", listed: true },
  { id: 9, category: "家居", name: "原木折叠阅读架", sub: "把喜欢的书放在手边", price: 259, image: "assets/story.svg", tag: "NEW", purchases: 82, publishedAt: "2024-06-22", listed: true },
  { id: 10, category: "器物", name: "月白釉陶瓷盘", sub: "为一餐留一点余地", price: 89, image: "assets/hero.svg", tag: "NEW", purchases: 73, publishedAt: "2024-06-19", listed: true },
  { id: 11, category: "香氛", name: "晚风薰衣草精油", sub: "睡前的柔软仪式", price: 118, image: "assets/story.svg", tag: "", purchases: 64, publishedAt: "2024-06-05", listed: true },
  { id: 12, category: "穿搭", name: "雾灰针织披肩", sub: "为微凉天气准备", price: 289, image: "assets/hero.svg", tag: "", purchases: 51, publishedAt: "2024-06-01", listed: true }
];

const extraNames = [
  ["家居", "藤编收纳篮", "把零碎日常收纳整齐", 179],
  ["穿搭", "棉麻轻薄围巾", "给风留一点温柔", 159],
  ["香氛", "橙花晨光香薰", "清晨窗边的一束光", 148],
  ["器物", "手工木柄餐勺", "每一餐都值得认真", 69],
  ["家居", "奶油色桌面时钟", "让时间慢一点", 229],
  ["穿搭", "自然褶皱衬衫", "轻松穿过整个夏天", 269],
  ["香氛", "无花果旅行香膏", "随身携带的小片绿意", 99],
  ["器物", "暖白陶土花盆", "给植物一个新家", 109]
];

window.SMART_MALL_PRODUCTS = window.SMART_MALL_PRODUCTS.concat(
  Array.from({ length: 48 }, (_, index) => {
    const template = extraNames[index % extraNames.length];
    const batch = Math.floor(index / extraNames.length) + 1;
    return {
      id: index + 13,
      category: template[0],
      name: `${template[1]} ${batch > 1 ? `· ${batch}` : ""}`.trim(),
      sub: template[2],
      price: template[3] + batch * 10,
      image: index % 2 === 0 ? "assets/hero.svg" : "assets/story.svg",
      tag: index < 4 ? "NEW" : "",
      purchases: Math.max(12, 46 - index),
      publishedAt: `2024-05-${String(29 - (index % 28)).padStart(2, "0")}`,
      listed: true
    };
  })
);