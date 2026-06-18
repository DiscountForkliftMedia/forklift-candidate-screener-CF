import { Candidate, InterviewEvent } from "../types";

export const SEED_CANDIDATES: Candidate[] = [
  {
    id: "cooper-mark",
    fullName: "Mark Grit Cooper",
    email: "cooper.sales@gmail.com",
    phone: "(555) 432-8891",
    location: "Houston, TX",
    overallGrade: "A",
    gradeExplanation: "Phenomenal outbound B2B background with heavy industrial equipment machinery sales experience. Consistently beat quotas by over 15% and displays a massive hunger for commission-driven territory sales.",
    isQualified: true,
    keySkills: [
      "B2B Equipment Sales",
      "Cold Call Prospecting",
      "Territory Development",
      "Material Handling Machinery",
      "Quotas & Sales Operations",
      "Closing & Contract Negotiation"
    ],
    experienceSummary: "Worked 3 years as sales professional for industrial rentals and heavy warehouse machinery. Promoted twice. Averaged 80-100 outbound sales cold calls daily, creating a territory pipeline of $1.2M in annual equipment deals.",
    greenFlags: [
      "3+ Years of continuous tenure in forklift / heavy machinery sales.",
      "High-grit cold-calling stats (80-100 cold calls daily listed in metrics).",
      "Exceeded annual sales pipeline quota by 115%.",
      "Mechanically savvy: Certified in initial warehouse forklift operations."
    ],
    redFlags: [
      "Mainly dealt with regional warehouses; will need upskilling in national enterprise fleet procurement accounts."
    ],
    phoneInterviewQuestions: [
      "You mentioned making 80-100 outbound calls a day - what specific strategies did you use to get past gatekeepers in industrial warehouses?",
      "Why are you looking to leave your current heavy warehouse equipment machinery firm?"
    ],
    inPersonInterviewQuestions: [
      "Let's do a roleplay: I'm a highly skeptical warehouse warehouse operations director with an aging rental fleet of Linde forklifts. Walk me through your discovery process.",
      "Forklift sales are highly commission-driven. What was your biggest commission payout and how did you engineer that specific close?"
    ],
    status: "In-Person Scheduled",
    dateAdded: "2026-06-10T10:00:00.000Z",
    notes: "Outstanding resume. Candidate sounds very competitive."
  },
  {
    id: "jenson-brenda",
    fullName: "Brenda Jenson",
    email: "brenda.j@hotmail.com",
    phone: "(409) 831-2290",
    location: "Dallas, TX",
    overallGrade: "C-",
    gradeExplanation: "Marginally qualified. Possesses good verbal communication and friendly retail customer support background. However, she has zero outbound prospecting, zero B2B sales metrics, and serious job-hopping tendencies.",
    isQualified: false,
    keySkills: [
      "Retail Customer Care",
      "Point of Sale Systems",
      "Order Greeting",
      "Conflict Resolution"
    ],
    experienceSummary: "Spent the last 18 months working 4 different cashier and customer associate positions across various department stores and gas stations.",
    greenFlags: [
      "Outgoing personality and strong verbal communication.",
      "Handles customer inquiries gracefully under pressure."
    ],
    redFlags: [
      "Severe job hopping: 4 separate positions held in under 18 months.",
      "No proactive B2B experience or cold calling/lead generation.",
      "No familiarity with heavy machinery or industrial B2B environments."
    ],
    phoneInterviewQuestions: [
      "I noticed you've held 4 different customer roles over the last year and a half. Can you walk me through the movements and explain the quick job changes?",
      "This is an aggressive forklift outbound sales role. How do you feel about handling direct rejection 50 times a day?"
    ],
    inPersonInterviewQuestions: [
      "Equipment procurement is a complex business negotiation. How would you handle a buyer who is strictly focused on a cheaper competitive offer from a low-tier material supplier?",
      "Are you comfortable with visiting dirty industrial active construction warehouses to pitch the decision-maker directly?"
    ],
    status: "Phone Scheduled",
    dateAdded: "2026-06-11T09:00:00.000Z",
    notes: "Very friendly on paper but highly skeptical about forklift sales stamina due to job hopping."
  }
];

export const SEED_EVENTS: InterviewEvent[] = [
  {
    id: "event-1",
    candidateId: "jenson-brenda",
    candidateName: "Brenda Jenson",
    date: "2026-06-12",
    startTime: "10:00",
    durationMinutes: 30,
    stage: "Phone",
    notes: "Phone screening check for job longevity.",
    completed: false
  },
  {
    id: "event-2",
    candidateId: "cooper-mark",
    candidateName: "Mark Grit Cooper",
    date: "2026-06-15",
    startTime: "14:00",
    durationMinutes: 60,
    stage: "In-Person",
    notes: "Meet at Houston showroom. Run through forklift sales roleplay and tour our heavy machinery lot.",
    completed: false
  }
];
