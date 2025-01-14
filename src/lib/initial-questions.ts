import { Question } from '@/lib/types';

export const initialQuestions: Question[] = [
    {
        id: 1,
        title: "AI in Healthcare",
        description: "Which area will AI impact the most in healthcare by 2025?",
        options: ["Diagnostics", "Drug Discovery", "Personalized Medicine", "Administrative Tasks"],
        votes: {
          "Diagnostics": 0,
          "Drug Discovery": 0,
          "Personalized Medicine": 0,
          "Administrative Tasks": 0
        },
        order: 1
      },
      {
        id: 2,
        title: "Autonomous Vehicles",
        description: "Will fully autonomous cars become mainstream by 2025?",
        options: ["Yes", "No", "In Specific Regions", "Only for Commercial Use"],
        votes: {
          "Yes": 0,
          "No": 0,
          "In Specific Regions": 0,
          "Only for Commercial Use": 0
        },
        order: 2
      },
      {
        id: 3,
        title: "Generative AI Tools",
        description: "Which industry will adopt generative AI tools the fastest in 2025?",
        options: ["Marketing", "Software Development", "Education", "Entertainment"],
        votes: {
          "Marketing": 0,
          "Software Development": 0,
          "Education": 0,
          "Entertainment": 0
        },
        order: 3
      },
      {
        id: 4,
        title: "Cloud Computing Evolution",
        description: "Which cloud model will dominate in 2025?",
        options: ["Public Cloud", "Private Cloud", "Hybrid Cloud", "Edge Computing"],
        votes: {
          "Public Cloud": 0,
          "Private Cloud": 0,
          "Hybrid Cloud": 0,
          "Edge Computing": 0
        },
        order: 4
      },
      {
        id: 5,
        title: "AI Ethics",
        description: "What will be the biggest ethical challenge for AI in 2025?",
        options: ["Bias", "Data Privacy", "Job Displacement", "Autonomy in Decision-Making"],
        votes: {
          "Bias": 0,
          "Data Privacy": 0,
          "Job Displacement": 0,
          "Autonomy in Decision-Making": 0
        },
        order: 5
      },
      {
        id: 6,
        title: "Wearable Technology",
        description: "What will be the most popular wearable technology in 2025?",
        options: ["Smartwatches", "Smart Glasses", "Health Trackers", "AR Devices"],
        votes: {
          "Smartwatches": 0,
          "Smart Glasses": 0,
          "Health Trackers": 0,
          "AR Devices": 0
        },
        order: 6
      }
  ];