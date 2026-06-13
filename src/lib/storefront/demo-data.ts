export const demoProducts = [
  {
    id: "demo-chatgpt-plus",
    title: "Codex 验证码接收【特惠促销】美国号码",
    description: "自动发货，付款后立即显示卡密",
    price: 3.8,
    originalPrice: null,
    stock: 86,
    icon: "sparkles",
    categoryId: "demo-chatgpt",
    categoryName: "ChatGPT"
  },
  {
    id: "demo-codex-valid",
    title: "Codex 有效期内可无限次接码【资源稀缺】美国号码",
    description: "有效期25天以上，期间可多次接收验证码",
    price: 20.88,
    originalPrice: 28.8,
    stock: 12,
    icon: "bot",
    categoryId: "demo-chatgpt",
    categoryName: "ChatGPT"
  },
  {
    id: "demo-perplexity-pro",
    title: "Perplexity Pro 体验卡",
    description: "自动发货，付款后查看账号信息",
    price: 9.9,
    originalPrice: 15.9,
    stock: 3,
    icon: "search",
    categoryId: "demo-perplexity",
    categoryName: "Perplexity"
  },
  {
    id: "demo-google-gemini",
    title: "Google Gemini Sample Card",
    description: "本地预览用示例商品",
    price: 6.9,
    originalPrice: 12.9,
    stock: 3,
    icon: "badge",
    categoryId: "demo-google",
    categoryName: "Google"
  }
];

export const demoCategories = [
  { id: "demo-chatgpt", name: "ChatGPT" },
  { id: "demo-claude", name: "Claude" },
  { id: "demo-perplexity", name: "Perplexity" },
  { id: "demo-google", name: "Google" },
  { id: "demo-other", name: "其他热门应用" }
];

export const demoSettings = {
  shopName: "xbrain商城",
  announcement: "商品只能用于单一服务，请不要拍错；付款后自动显示卡密。",
  supportText: "提交订单号和联系方式，客服会尽快处理。"
};

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
