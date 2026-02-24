// // types/about.ts
// export interface NewAboutPageData {
//   page: string;
//   section: string;
//   data: {
//     isEnable: boolean;
//     hero: {
//       heading: { html: string };
//       subheading: { html: string };
//       cta: {
//         primary: { enabled: boolean; text: string; showIcon: boolean; chooseModuleToOpen?: string };
//         secondary: { enabled: boolean; text: string; showIcon: boolean; chooseModuleToOpen?: string };
//         tertiary?: { enabled: boolean; text: string; showIcon: boolean; chooseModuleToOpen?: string };
//       };
//     };
//     about: {
//       heading: { html: string };
//       description: string;
//       image: string;
//     };
//     whatWeDo: {
//       heading: { html: string };
//       subheading: { html: string };
//       services: Array<{
//         title: string;
//         description: string;
//         icon: string;
//       }>;
//     };
//     teams: {
//       heading: { html: string };
//       list: Array<{
//         image: string;
//         title: string;
//         description: string;
//       }>;
//     };
//     missionVision: {
//       mission: { title: string; description: string };
//       vision: { title: string; description: string };
//     };
//     coreValues: {
//       heading: { html: string };
//       list: Array<{
//         icon: string;
//         title: string;
//         description: string;
//         image: string;
//       }>;
//     };
//     cta: {
//       heading: string;
//       subheading: string;
//       buttons: {
//         primary: { text: string; module: string };
//         secondary: { text: string; module: string };
//       };
//     };
//     stats: {
//       clients: string;
//       clientsText: string;
//     };
//     seo: {
//       title: string;
//       description: string;
//       keywords: string[];
//       slug: string;
//     };
//   };
// }



export interface HTMLContent {
  html: string;
}

export interface ButtonConfig {
  enabled: boolean;
  text: string;
  showIcon: boolean;
  chooseModuleToOpen?: string;
}

export interface HeroCTA {
  primary: ButtonConfig;
  secondary: ButtonConfig;
  tertiary?: ButtonConfig;
}

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  slug: string;
  schemaMarkup: string;
}

export interface HeroSection {
  heading: HTMLContent;
  subheading: HTMLContent;
  cta: HeroCTA;
}

export interface AboutSection {
  heading: HTMLContent;
  description: HTMLContent;
  image: string;
}

export interface Service {
  title: HTMLContent;
  description: HTMLContent;
  icon: string;
}

export interface WhatWeDoSection {
  heading: HTMLContent;
  subheading: HTMLContent;
  services: Service[];
}

export interface TeamMember {
  image: string;
  title: HTMLContent;
  description: HTMLContent;
}

export interface TeamsSection {
  heading: HTMLContent;
  list: TeamMember[];
}

export interface MissionVisionItem {
  title: HTMLContent;
  description: HTMLContent;
}

export interface MissionVisionSection {
  mission: MissionVisionItem;
  vision: MissionVisionItem;
}

export interface CoreValue {
  icon: string;
  title: HTMLContent;
  description: HTMLContent;
  image: string;
}

export interface CoreValuesSection {
  heading: HTMLContent;
  list: CoreValue[];
}

export interface CTASection {
  heading: HTMLContent;
  subheading: HTMLContent;
  buttons: HeroCTA;
}

export interface StatsSection {
  clients: HTMLContent;
  clientsText: HTMLContent;
}

export interface NewAboutPageData {
  page: string;
  section: string;
  data: {
    isEnable: boolean;
    hero: HeroSection;
    about: AboutSection;
    whatWeDo: WhatWeDoSection;
    teams: TeamsSection;
    missionVision: MissionVisionSection;
    coreValues: CoreValuesSection;
    cta: CTASection;
    stats: StatsSection;
    seo: SEOData;
  };
}