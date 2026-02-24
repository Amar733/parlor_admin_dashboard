export interface Challenge {
  id: string;
  enabled?: boolean;
  title: string;
  description: string;
  image: string;
  order?: number;
}

export interface FrameworkFeature {
  title: string;
  description: string;
}

export interface FrameworkStep {
  id: string;
  enabled?: boolean;
  phase: string;
  tagline: string;
  youtubeUrl?: string;
  features: FrameworkFeature[];
  result: string;
  order?: number;
}

export interface HeroData {
  heading: { html: string };
  subheading: { html: string };
  cta: {
    primary: { enabled: boolean; text: string; showIcon: boolean; chooseModuleToOpen: string; url?: string };
    secondary: { enabled: boolean; text: string; showIcon: boolean; chooseModuleToOpen: string; url?: string };
    tertiary?: { enabled: boolean; text: string; showIcon: boolean; chooseModuleToOpen: string; url?: string };
  };
}

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  slug: string;
  schemaMarkup?: string;
}

export interface SectionHeader {
  heading: { html: string };
  subheading: { html: string };
}

export interface FeaturesData {
  hero: HeroData;
  challenges: Challenge[];
  framework: FrameworkStep[];
  challengesSection?: SectionHeader;
  frameworkSection?: SectionHeader;
  seo: SEOData;
  isEnable: boolean;
  updatedAt?: string;
  createdAt?: string;
}
