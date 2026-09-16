export interface AnnexureItem {
  id: number;
  category: string;
  subCategories: string[];
  primarySdg: string;
  rationale: string;
  additionalSdgs?: string;
}

export const ANNEXURE_1_DATA: AnnexureItem[] = [
  {
    id: 1,
    category: "1. Academic & Learning Enhancement",
    subCategories: [
      "Guest Lectures / Expert Sessions",
      "Faculty Development Programs (FDPs)",
      "Certificate/Add-on Courses",
      "Curriculum Review Workshops",
      "Workshops & Hands-on Training",
      "Any Other"
    ],
    primarySdg: "SDG 4: Quality Education",
    rationale: "Directly focuses on improving the quality and inclusivity of education through curriculum development, teacher training, and lifelong learning opportunities."
  },
  {
    id: 2,
    category: "2. Research & Innovation",
    subCategories: [
      "National/International Conferences",
      "PhD Symposiums",
      "Innovation & Startup Challenges",
      "Poster Presentations",
      "Patent Filing Workshops",
      "Research Methodology Sessions",
      "Any Other"
    ],
    primarySdg: "SDG 9: Industry, Innovation and Infrastructure",
    rationale: "Fosters innovation, promotes research & development, and supports technological capabilities.",
    additionalSdgs: "Additional SDGs: Specific research topics can map to others (e.g., Agri-tech to SDG 2, Health-tech to SDG 3)."
  },
  {
    id: 3,
    category: "3. Industry Interface & Employability",
    subCategories: [
      "Industry-Academia Conclaves",
      "Placement Drives",
      "Internship Fairs",
      "Live Projects / Case Study Competitions",
      "MoU Signing Ceremonies",
      "Corporate Mentorship Sessions",
      "Any Other"
    ],
    primarySdg: "SDG 8: Decent Work and Economic Growth",
    rationale: "Promotes sustained, inclusive economic growth, full and productive employment, and decent work for all by bridging the skills gap.",
    additionalSdgs: "SDG 9: Industry, Innovation and Infrastructure (for collaborations and MoUs)."
  },
  {
    id: 4,
    category: "4. Student Development & Extracurricular",
    subCategories: [
      "Cultural Festivals",
      "Technical Festivals",
      "Sports Meets & Tournaments",
      "Leadership Summits",
      "Clubs & Chapter Activities",
      "Talent Hunt & Competitions",
      "Any Other"
    ],
    primarySdg: "SDG 4: Quality Education",
    rationale: "Ensures education promotes lifelong learning opportunities and holistic development (including arts, culture, and citizenship).",
    additionalSdgs: "SDG 3: Good Health and Well-being (for sports and mental health activities)."
  },
  {
    id: 5,
    category: "5. Outreach & Social Responsibility",
    subCategories: [
      "NSS / Outreach Programs",
      "Legal Aid Camps & Lok Adalats",
      "Medical & Health Camps",
      "Agricultural Extension Activities",
      "Sustainability Initiatives & Drives",
      "Blood Donation Camps",
      "Community Awareness Camps",
      "Any Other"
    ],
    primarySdg: "Multiple SDGs based on activity: SDG 3 (Health), SDG 16 (Peace & Justice), SDG 2 (Zero Hunger), SDG 1 (No Poverty)",
    rationale: "Medical Camps: SDG 3: Good Health and Well-being • Legal Aid: SDG 16: Peace, Justice and Strong Institutions • Agricultural Outreach: SDG 2: Zero Hunger & SDG 1: No Poverty • Sustainability Drives: SDG 11: Sustainable Cities & Communities, SDG 12: Responsible Consumption, SDG 13: Climate Action • NSS (general): SDG 1, SDG 4, SDG 10."
  },
  {
    id: 6,
    category: "6. Internationalization",
    subCategories: [
      "International Guest Lectures",
      "Student/Faculty Exchange Programs",
      "International Cultural Festivals",
      "Study Abroad Workshops",
      "Global Immersion Programs",
      "Any Other"
    ],
    primarySdg: "SDG 4: Quality Education",
    rationale: "Aims to increase the number of scholarships available to developing countries and promote inclusive education.",
    additionalSdgs: "SDG 17: Partnerships for the Goals (Encourages and promotes effective public and global partnerships)."
  },
  {
    id: 7,
    category: "7. Institutional Governance & Best Practices",
    subCategories: [
      "Best Practice Sharing Sessions",
      "Alumni Meets & Interactions",
      "Orientation & Foundation Programs",
      "Staff Training & Quality Workshops",
      "Annual Convocation & Conclaves",
      "Any Other"
    ],
    primarySdg: "SDG 16: Peace, Justice and Strong Institutions",
    rationale: "Focuses on developing effective, accountable, and transparent institutions and ensuring inclusive decision-making.",
    additionalSdgs: "SDG 17: Partnerships for the Goals (through alumni and stakeholder networks)."
  }
];

export const STANDARD_BUDGET_PARTICULARS = [
  "Venue Set-Up & Sitting",
  "Stage Management",
  "Sound",
  "Decoration",
  "Branding",
  "Prizes",
  "Resource Person Honorarium",
  "Transportation",
  "Food",
  "Miscellaneous Expense"
];

export const STANDARD_PHOTO_CATEGORIES = [
  "Speaker Picture with Banner (If Applicable)",
  "Question-Answering Session Photograph (If Applicable)",
  "Participation Event Pictures",
  "Group Photograph",
  "Felicitation Photograph (If Applicable)",
  "Audience & Glimpse Photo",
  "Stage & Inauguration Photo"
];
