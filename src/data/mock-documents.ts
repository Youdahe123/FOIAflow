import type { Document } from "@/types";

export const mockDocuments: Document[] = [
  // --- Completed analyses ---------------------------------------------------
  {
    id: "doc_01",
    userId: "usr_01",
    requestId: "req_05",
    requestTitle: "FDA Drug Approval Communications",
    fileName: "FDA_Accelerated_Approval_Review_Memos.pdf",
    fileType: "application/pdf",
    fileSize: 8_420_000, // ~8.4 MB
    storagePath: "/uploads/usr_01/req_05/FDA_Accelerated_Approval_Review_Memos.pdf",
    analysisStatus: "completed",
    analysisResult: {
      keyFindings: [
        "Multiple internal reviewers raised efficacy concerns about surrogate endpoint data for drug XR-4821 prior to the advisory committee vote.",
        "Email thread between CDER director and review team discusses pressure to meet the PDUFA date, with one reviewer noting 'we are being asked to make a decision before the data supports it.'",
        "Post-market study requirements were weakened in the final approval letter compared to the initial draft, removing the requirement for a randomized confirmatory trial.",
        "Advisory committee voted 8-5 in favor of approval, with three dissenting members filing a minority report citing insufficient overall survival data.",
      ],
      redactions: [
        {
          page: 3,
          description: "Reviewer personal contact information redacted",
          exemptionCode: "b(6)",
          exemptionName: "Personal Privacy",
        },
        {
          page: 14,
          description: "Trade secret clinical trial methodology details redacted",
          exemptionCode: "b(4)",
          exemptionName: "Trade Secrets",
        },
        {
          page: 22,
          description: "Pre-decisional deliberative communication between division directors",
          exemptionCode: "b(5)",
          exemptionName: "Deliberative Process Privilege",
        },
        {
          page: 38,
          description: "Draft regulatory impact analysis withheld",
          exemptionCode: "b(5)",
          exemptionName: "Deliberative Process Privilege",
        },
      ],
      entities: [
        { name: "Center for Drug Evaluation and Research", type: "organization", mentions: 47 },
        { name: "Dr. Patricia Cavazzoni", type: "person", mentions: 12 },
        { name: "Oncologic Drugs Advisory Committee", type: "organization", mentions: 28 },
        { name: "June 15, 2024", type: "date", mentions: 8 },
        { name: "Silver Spring, MD", type: "location", mentions: 5 },
      ],
      suggestedFollowUps: [
        "Request the unredacted minority report from the advisory committee dissenting members.",
        "File a request for the original draft approval letter to compare post-market requirements.",
        "Request communications between FDA and the drug manufacturer during the review period.",
      ],
    },
    redactionCount: 4,
    pageCount: 48,
    summary:
      "48-page collection of internal FDA review memoranda for accelerated oncology drug approvals. Contains significant deliberative process redactions but reveals internal disagreement about the sufficiency of surrogate endpoint data. Key finding: post-market study requirements were weakened between draft and final approval.",
    createdAt: "2025-09-02T14:30:00Z",
  },
  {
    id: "doc_02",
    userId: "usr_01",
    requestId: "req_09",
    requestTitle: "Census Bureau Data Suppression Methodology",
    fileName: "Differential_Privacy_Technical_Report.pdf",
    fileType: "application/pdf",
    fileSize: 3_150_000, // ~3.15 MB
    storagePath: "/uploads/usr_01/req_09/Differential_Privacy_Technical_Report.pdf",
    analysisStatus: "completed",
    analysisResult: {
      keyFindings: [
        "The noise injection algorithm used an epsilon value of 19.61 for the 2020 redistricting data — significantly higher than the epsilon of 12.2 originally proposed in internal deliberations.",
        "Internal analysis showed that 31% of census blocks in rural areas had population counts altered by more than 10%, raising concerns about redistricting accuracy.",
        "A cost-benefit memo recommended against differential privacy for block-level data, citing 'unacceptable error rates for communities under 500 residents.'",
        "The final methodology was approved over the objections of two senior statisticians who advocated for traditional swapping methods.",
      ],
      redactions: [
        {
          page: 7,
          description: "Specific noise parameters for sub-state geographies redacted",
          exemptionCode: "b(5)",
          exemptionName: "Deliberative Process Privilege",
        },
        {
          page: 15,
          description: "Staff names and internal org chart redacted",
          exemptionCode: "b(6)",
          exemptionName: "Personal Privacy",
        },
      ],
      entities: [
        { name: "Census Bureau", type: "organization", mentions: 89 },
        { name: "Dr. John Abowd", type: "person", mentions: 15 },
        { name: "Disclosure Avoidance System", type: "organization", mentions: 34 },
        { name: "September 2020", type: "date", mentions: 11 },
        { name: "Suitland, MD", type: "location", mentions: 3 },
      ],
      suggestedFollowUps: [
        "Request the two senior statisticians' dissenting memos referenced on page 23.",
        "File for the original cost-benefit analysis comparing differential privacy to traditional swapping.",
        "Request accuracy comparison tables for all states at the block level.",
      ],
    },
    redactionCount: 2,
    pageCount: 32,
    summary:
      "32-page technical report on the Census Bureau's differential privacy implementation for 2020 redistricting data. Reveals internal debate over epsilon values and significant accuracy concerns for rural areas. Two senior statisticians objected to the chosen methodology.",
    createdAt: "2025-11-08T09:15:00Z",
  },
  {
    id: "doc_03",
    userId: "usr_01",
    requestId: "req_01",
    requestTitle: "Police Use of Facial Recognition Technology",
    fileName: "FBI_Facial_Recognition_Vendor_Contracts.pdf",
    fileType: "application/pdf",
    fileSize: 14_800_000, // ~14.8 MB
    storagePath: "/uploads/usr_01/req_01/FBI_Facial_Recognition_Vendor_Contracts.pdf",
    analysisStatus: "completed",
    analysisResult: {
      keyFindings: [
        "FBI contracted with three private vendors for facial recognition services totaling $42.7 million over 5 years, with Clearview AI receiving the largest single contract at $18.3 million.",
        "Internal accuracy testing showed a 14.8% false positive rate for individuals with darker skin tones, compared to 2.1% for lighter skin tones — a disparity the bureau acknowledged but did not address in procurement decisions.",
        "A 2024 civil liberties impact assessment was conducted but never finalized; the draft version warns of 'substantial Fourth Amendment concerns' regarding warrantless database searches.",
        "The system was queried over 800,000 times in 2024, a 340% increase from the prior year.",
      ],
      redactions: [
        {
          page: 2,
          description: "Specific contract pricing details for ongoing negotiations",
          exemptionCode: "b(4)",
          exemptionName: "Trade Secrets",
        },
        {
          page: 8,
          description: "Names of individual agents who conducted accuracy tests",
          exemptionCode: "b(7)(C)",
          exemptionName: "Personal Information in Law Enforcement Records",
        },
        {
          page: 15,
          description: "Technical specifications of matching algorithm",
          exemptionCode: "b(7)(E)",
          exemptionName: "Law Enforcement Techniques and Procedures",
        },
        {
          page: 19,
          description: "Database architecture and access credentials",
          exemptionCode: "b(7)(E)",
          exemptionName: "Law Enforcement Techniques and Procedures",
        },
        {
          page: 31,
          description: "Names of cooperating state and local agencies",
          exemptionCode: "b(7)(A)",
          exemptionName: "Law Enforcement Proceedings",
        },
      ],
      entities: [
        { name: "Federal Bureau of Investigation", type: "organization", mentions: 102 },
        { name: "Clearview AI", type: "organization", mentions: 38 },
        { name: "NEC Corporation", type: "organization", mentions: 22 },
        { name: "Idemia", type: "organization", mentions: 17 },
        { name: "Washington, D.C.", type: "location", mentions: 14 },
        { name: "March 2024", type: "date", mentions: 9 },
      ],
      suggestedFollowUps: [
        "Request the unfinalized civil liberties impact assessment referenced in the documents.",
        "File a request for query logs showing which field offices used the system most frequently.",
        "Request the accuracy audit methodology and full results, including disaggregated demographic data.",
      ],
    },
    redactionCount: 5,
    pageCount: 42,
    summary:
      "42-page compilation of FBI facial recognition vendor contracts and internal assessments. Reveals $42.7M in contracts with three vendors, significant racial bias in accuracy rates, and an unfinalized civil liberties assessment warning of Fourth Amendment concerns. System usage increased 340% in 2024.",
    createdAt: "2025-12-20T11:00:00Z",
  },
  {
    id: "doc_04",
    userId: "usr_01",
    requestId: "req_04",
    requestTitle: "DOD Drone Strike Civilian Casualty Reports",
    fileName: "CENTCOM_CCAR_2024_Q1_Q2.pdf",
    fileType: "application/pdf",
    fileSize: 5_600_000, // ~5.6 MB
    storagePath: "/uploads/usr_01/req_04/CENTCOM_CCAR_2024_Q1_Q2.pdf",
    analysisStatus: "completed",
    analysisResult: {
      keyFindings: [
        "CENTCOM acknowledged 17 credible civilian casualty incidents from drone strikes in Q1-Q2 2024, but internal battle damage assessments initially identified 43 potential incidents — 26 were assessed as 'not credible' with minimal documentation.",
        "Ex gratia payments were approved for only 4 of the 17 acknowledged incidents, totaling $148,000. Average time from incident to payment was 14 months.",
        "One assessment report notes 'insufficient ISR coverage to make a definitive determination' for 8 of the incidents deemed not credible.",
        "Pre-strike collateral damage estimates were available for review in only 11 of the 43 total incidents.",
      ],
      redactions: [
        {
          page: 1,
          description: "Classified operational details and strike coordinates",
          exemptionCode: "b(1)",
          exemptionName: "National Security Information",
        },
        {
          page: 5,
          description: "Intelligence sources and methods",
          exemptionCode: "b(1)",
          exemptionName: "National Security Information",
        },
        {
          page: 12,
          description: "Names of intelligence analysts and targeting officers",
          exemptionCode: "b(7)(C)",
          exemptionName: "Personal Information in Law Enforcement Records",
        },
        {
          page: 18,
          description: "ISR platform capabilities and deployment patterns",
          exemptionCode: "b(1)",
          exemptionName: "National Security Information",
        },
        {
          page: 24,
          description: "Names and locations of civilian casualties",
          exemptionCode: "b(6)",
          exemptionName: "Personal Privacy",
        },
        {
          page: 30,
          description: "Partner force involvement details",
          exemptionCode: "b(1)",
          exemptionName: "National Security Information",
        },
      ],
      entities: [
        { name: "U.S. Central Command", type: "organization", mentions: 78 },
        { name: "CENTCOM", type: "organization", mentions: 56 },
        { name: "Department of Defense", type: "organization", mentions: 33 },
        { name: "Syria", type: "location", mentions: 28 },
        { name: "Somalia", type: "location", mentions: 19 },
        { name: "February 2024", type: "date", mentions: 14 },
      ],
      suggestedFollowUps: [
        "Request the full pre-strike collateral damage estimates for all 43 incidents.",
        "File for the complete ex gratia payment records and the criteria used to deny payments for 13 incidents.",
        "Request the methodology used to determine 'not credible' assessments for the 26 dismissed reports.",
      ],
    },
    redactionCount: 6,
    pageCount: 36,
    summary:
      "36-page CENTCOM civilian casualty assessment report covering Q1-Q2 2024 drone operations. Heavy national security redactions. Reveals gap between 43 potential and 17 acknowledged civilian casualty incidents. Only 4 ex gratia payments approved out of 17 acknowledged cases.",
    createdAt: "2025-10-15T08:45:00Z",
  },
  // --- Pending analyses -----------------------------------------------------
  {
    id: "doc_05",
    userId: "usr_01",
    requestId: "req_02",
    requestTitle: "EPA Water Quality Testing Records",
    fileName: "PFAS_Lab_Results_Ohio_Valley_2024.pdf",
    fileType: "application/pdf",
    fileSize: 2_340_000, // ~2.34 MB
    storagePath: "/uploads/usr_01/req_02/PFAS_Lab_Results_Ohio_Valley_2024.pdf",
    analysisStatus: "pending",
    analysisResult: null,
    redactionCount: 0,
    pageCount: 85,
    summary: null,
    createdAt: "2026-03-25T10:00:00Z",
  },
  {
    id: "doc_06",
    userId: "usr_01",
    requestId: "req_06",
    requestTitle: "Secret Service White House Visitor Logs",
    fileName: "WAVES_Records_Jan_2025_Partial.pdf",
    fileType: "application/pdf",
    fileSize: 980_000, // ~980 KB
    storagePath: "/uploads/usr_01/req_06/WAVES_Records_Jan_2025_Partial.pdf",
    analysisStatus: "pending",
    analysisResult: null,
    redactionCount: 0,
    pageCount: 124,
    summary: null,
    createdAt: "2026-03-27T14:20:00Z",
  },
  // --- Analyzing ------------------------------------------------------------
  {
    id: "doc_07",
    userId: "usr_01",
    requestId: "req_09",
    requestTitle: "Census Bureau Data Suppression Methodology",
    fileName: "Census_Block_Accuracy_Comparison_Tables.png",
    fileType: "image/png",
    fileSize: 4_700_000, // ~4.7 MB
    storagePath: "/uploads/usr_01/req_09/Census_Block_Accuracy_Comparison_Tables.png",
    analysisStatus: "analyzing",
    analysisResult: null,
    redactionCount: 0,
    pageCount: 1,
    summary: null,
    createdAt: "2026-03-28T16:00:00Z",
  },
  // --- Failed analysis ------------------------------------------------------
  {
    id: "doc_08",
    userId: "usr_01",
    requestId: "req_03",
    requestTitle: "ICE Detention Facility Inspection Reports",
    fileName: "Detention_Facility_Photos_CoreCivic_Adelanto.jpg",
    fileType: "image/jpeg",
    fileSize: 12_500_000, // ~12.5 MB
    storagePath: "/uploads/usr_01/req_03/Detention_Facility_Photos_CoreCivic_Adelanto.jpg",
    analysisStatus: "failed",
    analysisResult: null,
    redactionCount: 0,
    pageCount: 1,
    summary: null,
    createdAt: "2026-03-20T09:30:00Z",
  },
];
