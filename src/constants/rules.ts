export interface RuleItem {
  _id?: string;
  order: number;
  badge: string;
  title: string;
  highlight?: string;
  description: string;
  points?: string[];
  iconName?: string;
  accentColor?: string;
  isEnabled?: boolean;
}

export const DEFAULT_RULES: RuleItem[] = [
  {
    order: 1,
    badge: "RULE 1",
    title: "DOMAIN RESTRICTION",
    highlight: "@klu.ac.in REQUIRED",
    description: "Only official KLU student emails ending with @klu.ac.in are authorized to register.",
    points: [],
    iconName: "ShieldCheck",
    accentColor: "rose",
    isEnabled: true,
  },
  {
    order: 2,
    badge: "RULE 2",
    title: "STRICTLY 4 MEMBERS",
    highlight: "EXACTLY 4 MEMBERS",
    description: "Every team must register exactly 4 members. Partial team entries or individual entries will not be accepted.",
    points: [],
    iconName: "Users",
    accentColor: "cyan",
    isEnabled: true,
  },
  {
    order: 3,
    badge: "RULE 3",
    title: "5-MIN PAYMENT SLOT",
    highlight: "5-MINUTE TIMER LOCK",
    description: "Upon starting registration, a 5-minute temporary seat reservation is locked while payment verification is completed.",
    points: [],
    iconName: "CreditCard",
    accentColor: "amber",
    isEnabled: true,
  },
];
