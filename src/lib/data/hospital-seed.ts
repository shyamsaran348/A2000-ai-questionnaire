export interface QuestionOption {
  value: string;
  label: string;
}

export interface QuestionDefinition {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "radio" | "checkbox" | "rating_grid" | "number";
  placeholder?: string;
  options?: QuestionOption[] | string[];
  gridColumns?: string[];
  gridRows?: string[];
  helpText?: string;
  required?: boolean;
}

export interface SectionDefinition {
  number: number;
  key: string;
  title: string;
  defaultDepartment: string;
  description: string;
  questions: QuestionDefinition[];
}

export const HOSPITAL_QUESTIONNAIRE_SECTIONS: SectionDefinition[] = [
  {
    number: 1,
    key: "profile",
    title: "1. Hospital Profile & General Information",
    defaultDepartment: "Management/IT",
    description: "Foundational details on scale, specialties, accreditation, and operational volume.",
    questions: [
      {
        key: "q1_1_hospital_name",
        label: "Hospital / Healthcare Facility Name",
        type: "text",
        placeholder: "e.g., Apollo Speciality Hospitals",
        required: true,
      },
      {
        key: "q1_2_facility_type",
        label: "Facility Classification & Model",
        type: "radio",
        options: [
          "Single-specialty Hospital",
          "Multi-specialty Tertiary Care",
          "Quaternary Care / Academic Medical Center",
          "Daycare / Ambulatory Surgical Center",
          "Hospital Network / Group",
        ],
      },
      {
        key: "q1_3_bed_capacity",
        label: "Operational Bed Capacity",
        type: "radio",
        options: [
          "Under 100 beds",
          "100 – 250 beds",
          "250 – 500 beds",
          "500+ beds",
        ],
      },
      {
        key: "q1_4_accreditations",
        label: "Current Accreditations Held",
        type: "checkbox",
        options: [
          "NABH (National Accreditation Board for Hospitals)",
          "NABL (Laboratories)",
          "JCI (Joint Commission International)",
          "ISO Certifications",
          "In Progress / Planning",
        ],
      },
      {
        key: "q1_5_daily_footfall",
        label: "Average Daily Patient Footfall (OPD & IPD)",
        type: "text",
        placeholder: "e.g., 650 OPD visits/day, 85% IPD occupancy",
      },
    ],
  },
  {
    number: 2,
    key: "technology",
    title: "2. Current Technology Infrastructure & Systems",
    defaultDepartment: "Management/IT",
    description: "Core digital systems, EMR maturity, integrations, and data readiness.",
    questions: [
      {
        key: "q2_1_his_emr_system",
        label: "Core Hospital Information System (HIS / EMR)",
        type: "text",
        placeholder: "e.g., Epic, Cerner, Akhil Systems, KareXpert, In-house custom build",
      },
      {
        key: "q2_2_system_deployment",
        label: "Hosting & Infrastructure Architecture",
        type: "radio",
        options: [
          "100% On-Premise Servers",
          "Hybrid (Core on-prem, select modules in Cloud)",
          "Fully Cloud-Hosted (AWS, Azure, GCP)",
        ],
      },
      {
        key: "q2_3_integration_interfaces",
        label: "Standard Interfaces & Interoperability Active",
        type: "checkbox",
        options: [
          "HL7 v2 / v3",
          "FHIR APIs (ABDM / Ayushman Bharat Digital Mission compliant)",
          "DICOM (Imaging / PACS)",
          "Direct Database / REST APIs",
          "Manual export / CSV imports",
        ],
      },
      {
        key: "q2_4_it_team_size",
        label: "Internal IT & Digital Transformation Team Size",
        type: "text",
        placeholder: "e.g., 8 full-time IT staff, 1 dedicated systems lead",
      },
    ],
  },
  {
    number: 3,
    key: "front_office",
    title: "3. Front Office, Registration & Patient Access",
    defaultDepartment: "Front Office & Registration",
    description: "Appointment booking, admission workflow, queue management, and front-desk friction points.",
    questions: [
      {
        key: "q3_1_booking_channels",
        label: "Primary Appointment Booking Channels",
        type: "checkbox",
        options: [
          "Walk-in on arrival",
          "Telephone / Call center",
          "WhatsApp bot / Website portal",
          "Third-party aggregators (Practo, etc.)",
          "Mobile App",
        ],
      },
      {
        key: "q3_2_avg_wait_time",
        label: "Average Wait Time at OPD Registration / Triage",
        type: "radio",
        options: [
          "Under 10 minutes",
          "10 – 25 minutes",
          "25 – 45 minutes",
          "Over 45 minutes during peak hours",
        ],
      },
      {
        key: "q3_3_no_show_rate",
        label: "Estimated Appointment No-Show Rate (%)",
        type: "text",
        placeholder: "e.g., 22% overall, higher in general medicine",
      },
      {
        key: "q3_4_front_desk_bottlenecks",
        label: "Main Front Office Bottlenecks & Repetitive Enquiries",
        type: "textarea",
        placeholder: "Describe doctor schedule changes, insurance verification queues, bill estimation queries...",
      },
      {
        key: "q3_5_automation_interest",
        label: "Readiness for AI Automated Triage / Multilingual Voice & WhatsApp Agent",
        type: "rating_grid",
        gridColumns: ["1 (Low)", "2", "3", "4", "5 (High)"],
        gridRows: [
          "Automated 24/7 multilingual appointment scheduling",
          "Smart queue prediction & live SMS/WhatsApp updates",
          "Pre-registration & digital consent collection",
          "AI symptom intake for smart specialty routing",
        ],
      },
    ],
  },
  {
    number: 4,
    key: "clinical",
    title: "4. Clinical Documentation & Medical Records",
    defaultDepartment: "Clinical & Medical Records",
    description: "Doctor consultation documentation, discharge summaries, transcription, and coding.",
    questions: [
      {
        key: "q4_1_consultation_entry_mode",
        label: "Doctor Clinical Documentation Method",
        type: "checkbox",
        options: [
          "Handwritten paper charts (scanned later)",
          "Direct typing into EMR templates",
          "Dictation / Human medical transcriptionists",
          "Hybrid paper & basic electronic prescription",
        ],
      },
      {
        key: "q4_2_discharge_summary_turnaround",
        label: "Time Required to Complete IPD Discharge Summary",
        type: "radio",
        options: [
          "Under 2 hours",
          "2 – 6 hours",
          "Same day (6 – 12 hours)",
          "Next day / Delayed after patient leaves",
        ],
      },
      {
        key: "q4_3_clinical_documentation_challenges",
        label: "Physician & Nursing Documentation Pain Points",
        type: "textarea",
        placeholder: "Highlight physician burnout, delayed discharge summaries, missing lab correlations...",
      },
      {
        key: "q4_4_ai_clinical_priorities",
        label: "Interest in AI Clinical Support Modules",
        type: "rating_grid",
        gridColumns: ["1 (Low)", "2", "3", "4", "5 (High)"],
        gridRows: [
          "Ambient AI clinical voice scribe (listening to consultation)",
          "Instant automated discharge summary generator from EMR",
          "Automated ICD-10 & SNOMED clinical coding",
          "Drug-drug interaction & allergy warning copilot",
        ],
      },
    ],
  },
  {
    number: 5,
    key: "diagnostics",
    title: "5. Diagnostics: Laboratory & Radiology Services",
    defaultDepartment: "Diagnostics (Lab/Radiology)",
    description: "LIMS/PACS workflows, report generation turnaround, critical alert reporting, and backlog management.",
    questions: [
      {
        key: "q5_1_diagnostics_volume",
        label: "Daily Diagnostics Volume",
        type: "text",
        placeholder: "e.g., 1,200 lab tests/day, 120 X-ray/CT/MRI scans/day",
      },
      {
        key: "q5_2_radiology_reporting_turnaround",
        label: "Average Radiology Reporting Turnaround Time",
        type: "radio",
        options: [
          "Under 2 hours (in-house 24/7)",
          "2 – 6 hours",
          "12 – 24 hours (teleradiology night coverage)",
          "Over 24 hours for complex sub-specialties",
        ],
      },
      {
        key: "q5_3_critical_alerts_dispatch",
        label: "How are Critical / Panic Lab Values Escalated to Doctors?",
        type: "checkbox",
        options: [
          "Manual telephone calls by lab technicians",
          "Automated SMS / WhatsApp alerts from LIMS",
          "Pop-up flags inside the EMR",
          "Paper notification slipped into chart",
        ],
      },
      {
        key: "q5_4_diagnostics_ai_opportunities",
        label: "Valued Diagnostic AI Capabilities",
        type: "rating_grid",
        gridColumns: ["1 (Low)", "2", "3", "4", "5 (High)"],
        gridRows: [
          "Preliminary automated chest X-ray / CT triage",
          "Automated critical value alert phone calls to physicians",
          "Lab abnormal trend detection & longitudinal flagging",
          "Drafting standard normal radiology impressions",
        ],
      },
    ],
  },
  {
    number: 6,
    key: "pharmacy",
    title: "6. Pharmacy & Inventory Management",
    defaultDepartment: "Pharmacy & Inventory",
    description: "Drug dispensing, stock reconciliation, expiry control, and medication reconciliation.",
    questions: [
      {
        key: "q6_1_pharmacy_dispensing_method",
        label: "IPD & OPD Medication Dispensing Workflow",
        type: "radio",
        options: [
          "Electronic prescription sent directly to pharmacy",
          "Physical paper slips brought to pharmacy counter",
          "Central pharmacy sends bulk ward stock",
          "Automated medication dispensing cabinets (Pyxis/Omnicell)",
        ],
      },
      {
        key: "q6_2_stockout_and_expiry_frequency",
        label: "Frequency of Medicine Stock-outs or Expiry Wastage",
        type: "radio",
        options: [
          "Rare (well-controlled automated reorder levels)",
          "Occasional (monthly localized stockouts or expired stock)",
          "Frequent (manual reconciliation struggles)",
        ],
      },
      {
        key: "q6_3_inventory_tracking_system",
        label: "Pharmacy Inventory ERP / Software in Use",
        type: "text",
        placeholder: "e.g., SAP, Marg, MedPlus in-house, Tally, Integrated HIS",
      },
      {
        key: "q6_4_pharmacy_ai_priorities",
        label: "Target Areas for AI in Pharmacy",
        type: "rating_grid",
        gridColumns: ["1 (Low)", "2", "3", "4", "5 (High)"],
        gridRows: [
          "Predictive medicine demand forecasting (seasonality & census)",
          "Automated near-expiry stock redistribution alert",
          "Prescription handwriting parsing & verification",
          "Look-Alike Sound-Alike (LASA) dispensing mistake warning",
        ],
      },
    ],
  },
  {
    number: 7,
    key: "billing",
    title: "7. Billing, TPA & Insurance Pre-Authorization",
    defaultDepartment: "Billing & Insurance",
    description: "Cashless insurance processing, query management, claim settlement, and billing reconciliation.",
    questions: [
      {
        key: "q7_1_insured_patient_percentage",
        label: "Percentage of Patients Using Health Insurance / TPA / Ayushman",
        type: "radio",
        options: [
          "Under 25%",
          "25% – 50%",
          "50% – 75%",
          "Over 75%",
        ],
      },
      {
        key: "q7_2_pre_auth_turnaround",
        label: "Average Initial Pre-Authorization Approval Time",
        type: "radio",
        options: [
          "Under 2 hours",
          "2 – 6 hours",
          "Over 6 hours (frequent queries/re-submissions)",
        ],
      },
      {
        key: "q7_3_claim_query_denial_rate",
        label: "Estimated Claim Denial or Initial Query Rate (%)",
        type: "text",
        placeholder: "e.g., 28% query rate, 4% ultimate denial rate",
      },
      {
        key: "q7_4_discharge_billing_delay",
        label: "Average Delay in Patient Discharge Due to Final Insurance Settlement",
        type: "radio",
        options: [
          "Under 1 hour",
          "1 – 3 hours",
          "3 – 6 hours (significant patient dissatisfaction)",
          "Next day",
        ],
      },
      {
        key: "q7_5_insurance_ai_priorities",
        label: "Priority Use Cases for AI in TPA & Billing",
        type: "rating_grid",
        gridColumns: ["1 (Low)", "2", "3", "4", "5 (High)"],
        gridRows: [
          "Automated pre-auth documentation packaging & verification",
          "AI claim scrub / error detection prior to portal submission",
          "Automated TPA query response draft generation",
          "Real-time patient out-of-pocket copay estimator",
        ],
      },
    ],
  },
  {
    number: 8,
    key: "hr_admin",
    title: "8. Human Resources, Nursing & Facility Administration",
    defaultDepartment: "HR & Administration",
    description: "Staff rostering, nurse-patient ratios, attrition, credentialing, and support tickets.",
    questions: [
      {
        key: "q8_1_total_headcount",
        label: "Total Staff Headcount (Doctors, Nurses, Allied, Admin)",
        type: "text",
        placeholder: "e.g., 85 doctors, 240 nurses, 180 support/admin staff",
      },
      {
        key: "q8_2_rostering_mechanism",
        label: "Shift Scheduling & Duty Rostering Method",
        type: "radio",
        options: [
          "Excel sheets / manual whiteboards",
          "Standard HR software (manual rules)",
          "Automated smart workforce management platform",
        ],
      },
      {
        key: "q8_3_nursing_turnover",
        label: "Annual Nursing & Clinical Staff Turnover Rate",
        type: "radio",
        options: [
          "Low (< 10%)",
          "Moderate (10% – 25%)",
          "High (> 25% leading to constant onboarding)",
        ],
      },
      {
        key: "q8_4_hr_ai_interest",
        label: "Interest in AI HR / Admin Assistance",
        type: "rating_grid",
        gridColumns: ["1 (Low)", "2", "3", "4", "5 (High)"],
        gridRows: [
          "Demand-based dynamic nurse shift rostering",
          "Internal staff policy & benefits conversational bot",
          "Automated clinical credentialing & CME tracking",
          "Biomedical asset maintenance prediction & fault ticketing",
        ],
      },
    ],
  },
  {
    number: 9,
    key: "quality",
    title: "9. Quality, Clinical Governance & Patient Experience",
    defaultDepartment: "Quality & Patient Experience",
    description: "NABH audit compliance, incident reporting, patient NPS/feedback, and infection control tracking.",
    questions: [
      {
        key: "q9_1_patient_feedback_collection",
        label: "How is Patient Feedback & NPS Captured?",
        type: "checkbox",
        options: [
          "Physical paper feedback forms at discharge",
          "Tablet / Kiosk at front lobby",
          "Post-discharge SMS / WhatsApp link",
          "Outbound telephonic feedback team",
        ],
      },
      {
        key: "q9_2_feedback_analysis_frequency",
        label: "Frequency of Actionable Feedback Review",
        type: "radio",
        options: [
          "Real-time / Same day alert on negative ratings",
          "Weekly aggregated review",
          "Monthly / Quarterly audit only",
        ],
      },
      {
        key: "q9_3_clinical_incident_reporting",
        label: "Mechanism for Adverse Event / Near-Miss Reporting",
        type: "radio",
        options: [
          "Physical incident logbook",
          "Internal Intranet / Quality Portal",
          "Informal verbal escalation",
        ],
      },
      {
        key: "q9_4_quality_ai_priorities",
        label: "AI Priorities for Quality & Patient Satisfaction",
        type: "rating_grid",
        gridColumns: ["1 (Low)", "2", "3", "4", "5 (High)"],
        gridRows: [
          "Sentiment analysis on multilingual patient feedback",
          "Instant alert to Patient Relations head on angry reviews",
          "Hospital Acquired Infection (HAI) early warning indicators",
          "Automated NABH audit compliance checklist readiness",
        ],
      },
    ],
  },
  {
    number: 10,
    key: "priorities",
    title: "10. Strategic Priorities, ROI Expectations & Budget",
    defaultDepartment: "Management/IT",
    description: "Executive vision, desired outcomes, financial horizons, and measurable success criteria.",
    questions: [
      {
        key: "q10_1_primary_ai_objective",
        label: "Primary Objective for AI Enablement at Your Facility",
        type: "checkbox",
        options: [
          "Revenue leakage reduction & faster cash flow (TPA/Billing)",
          "Enhancing patient experience & cutting wait times",
          "Reducing clinician burnout & documentation burden",
          "Operational cost reduction & inventory optimization",
          "Clinical diagnostic precision & speed",
        ],
      },
      {
        key: "q10_2_expected_roi_timeframe",
        label: "Expected ROI / Payback Horizon for Automation Initiatives",
        type: "radio",
        options: [
          "Quick wins (3 – 6 months)",
          "6 – 12 months",
          "12 – 24 months",
          "Strategic long-term transformational play",
        ],
      },
      {
        key: "q10_3_budget_allocation",
        label: "Anticipated Digital / AI Transformation Budget Horizon",
        type: "radio",
        options: [
          "Under Rs. 10 Lakhs (pilot / exploratory)",
          "Rs. 10 Lakhs – Rs. 35 Lakhs",
          "Rs. 35 Lakhs – Rs. 1 Crore",
          "Rs. 1 Crore+ (enterprise-wide multi-year program)",
        ],
      },
      {
        key: "q10_4_decision_making_process",
        label: "Key Stakeholders Involved in Project Approval",
        type: "textarea",
        placeholder: "e.g., Managing Director, Medical Director, Head of IT, Chief Financial Officer",
      },
    ],
  },
  {
    number: 11,
    key: "ai_readiness",
    title: "11. Data Governance, Security & AI Readiness",
    defaultDepartment: "Management/IT",
    description: "Patient data privacy compliance, DPDP Act alignment, and cloud governance policies.",
    questions: [
      {
        key: "q11_1_dpdp_compliance",
        label: "Data Protection & Patient Privacy Framework Status",
        type: "radio",
        options: [
          "Formal DPDP / HIPAA compliance policy implemented",
          "Basic security policy exists, undergoing review",
          "Requires guidance & compliance structuring",
        ],
      },
      {
        key: "q11_2_data_residency_requirement",
        label: "Data Residency & Server Location Mandate",
        type: "radio",
        options: [
          "Strictly within India (local data center / AWS Mumbai, Azure Pune)",
          "On-Premises inside hospital server room only",
          "Flexible with global ISO-certified clouds",
        ],
      },
      {
        key: "q11_3_telephony_integration_access",
        label: "Availability of APIs for Phone PBX / WhatsApp Business Gateway",
        type: "radio",
        options: [
          "Ready with API access (e.g. Exotel, Tata Tele, Karix, Gupshup)",
          "Supported by telecom vendor but needs setup",
          "Traditional analog / PRI lines (needs telephony upgrade)",
        ],
      },
    ],
  },
  {
    number: 12,
    key: "sign_off",
    title: "12. Executive Sign-Off & Discovery Handover",
    defaultDepartment: "Management/IT",
    description: "Authorization, contact person for discovery workshop, and preferred schedule.",
    questions: [
      {
        key: "q12_1_authorized_representative_name",
        label: "Authorized Representative Name & Designation",
        type: "text",
        placeholder: "e.g., Dr. Rajesh Kumar, Chief Operating Officer",
        required: true,
      },
      {
        key: "q12_2_authorized_email_phone",
        label: "Official Contact Email & Phone Number",
        type: "text",
        placeholder: "e.g., rkumar@hospital.com | +91 98765 43210",
        required: true,
      },
      {
        key: "q12_3_process_walkthrough_open",
        label: "Would you be open to a process walkthrough, if relevant?",
        type: "radio",
        options: [
          "Yes",
          "No",
        ],
      },
      {
        key: "q12_4_additional_notes",
        label: "Additional Context or High-Priority Problem Areas to Note",
        type: "textarea",
        placeholder: "Any special projects, past vendor challenges, or urgent executive mandates...",
      },
    ],
  },
];

