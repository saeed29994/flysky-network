// Landing page constants
export const LANDING_CONSTANTS = {
  SCROLL_THRESHOLD: 10,
  TYPING_SPEED: {
    MOBILE: 150,
    DESKTOP: 100
  }
};

export const MENU_ITEMS = [
  { id: 'about', label: 'About' },
  { id: 'features', label: 'Features' },
  { id: 'plans', label: 'Plans' },
  { id: 'how-it-works', label: 'How it Works' },
];

export const FEATURES = [
  {
    title: "DAILY MINING",
    description: "Earn crypto every day through automated mining processes",
    icon: "mining",
    size: 'default' as const
  },
  {
    title: "MEMBERSHIP PLANS",
    description: "Choose from Economy, Business, or First Class plans",
    icon: "membership",
    size: 'large' as const
  },
  {
    title: "STAKING REWARDS",
    description: "Stake your tokens and earn passive income with high APY",
    icon: "staking",
    size: 'default' as const
  },
  {
    title: "REFERRAL PROGRAM",
    description: "Invite friends and earn commission from their activities",
    icon: "referral",
    size: 'default' as const
  },
  {
    title: "WATCH TO EARN",
    description: "Watch advertisements and earn rewards for your time",
    icon: "watchToEarn",
    size: 'large' as const
  },
  {
    title: "PLAY TO EARN",
    description: "Play mini-games and complete in game challenges to earn FSN tokens",
    icon: "playToEarn",
    size: 'default' as const
  }
];

export const MEMBERSHIP_PLANS = [
  {
    title: "Business Class",
    price: "15",
    description: "All business class features to boost your FSN rewards with FlySky Network",
    features: ["Bonus 100,000 FSN", "Advanced mining", "Priority support", "Staking access"],
    popular: false,
    buttonText: "Choose Business Class"
  },
  {
    title: "First Class",
    price: "120",
    description: "All first class features to boost your FSN rewards with FlySky Network",
    features: ["Bonus 1,000,000 FSN", "All business features", "Faster mining", "Event access"],
    popular: true,
    buttonText: "Choose First Class"
  },
  {
    title: "First class (Lifetime)",
    price: "199",
    description: "All first class (lifetime) features to boost your FSN rewards with FlySky Network",
    features: ["Bonus 1,500,000 FSN", "Highest mining", "Lifetime access", "Access to premium features"],
    popular: false,
    buttonText: "Choose First-Lifetime"
  }
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Register",
    description: "Create your account and verify your identity to start your earning journey",
    iconSvg: "how-it-works-1",
    btnText: "Sign Up",
    btnIcon: "arrow-right"
  },
  {
    step: "02", 
    title: "Start Mining",
    description: "Begin the automated mining process",
    iconSvg: "how-it-works-2",
    btnText: "Start Mining",
    btnIcon: "play"
  },
  {
    step: "03",
    title: "CLAIM REWARDS",
    description: "Withdraw earned crypto rewards directly to your wallet",
    iconSvg: "how-it-works-3",
    btnText: "Claim Now",
    btnIcon: "wallet"
  },
];

export const SOCIAL_LINKS = [
  {
    name: 'Twitter',
    href: 'https://twitter.com/flyskynetwork',
    icon: 'Twitter',
    ariaLabel: 'Follow us on Twitter'
  },
  {
    name: 'Telegram',
    href: 'https://t.me/flyskynetwork',
    icon: 'MessageCircle',
    ariaLabel: 'Join our Telegram channel'
  },
  {
    name: 'Discord',
    href: 'https://discord.gg/flyskynetwork',
    icon: 'MessageSquare',
    ariaLabel: 'Join our Discord server'
  }
];

export const FOOTER_LINKS = [
  { name: 'Terms', href: '/terms', action: 'scroll-top' as const },
  { name: 'Privacy', href: '/privacy-policy' },
  { name: 'Contact', href: '/contact', action: 'scroll-contact' as const }
]; 