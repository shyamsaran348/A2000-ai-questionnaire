import { SectionDefinition } from "./hospital-seed";

export const FINANCE_QUESTIONNAIRE_SECTIONS: SectionDefinition[] = [
  {
    "number": 1,
    "key": "fn_profile",
    "title": "1. Company Profile",
    "defaultDepartment": "Executive / Management",
    "description": "Foundational details on organisation type, customer segments, geography, size, and primary revenue sources.",
    "questions": [
      {
        "key": "fn_q1_company_name",
        "label": "Company Name",
        "type": "text",
        "placeholder": "e.g., Apex Financial Services Ltd",
        "required": true
      },
      {
        "key": "fn_q1_website",
        "label": "Company Website",
        "type": "text",
        "placeholder": "e.g., https://www.apexfin.com"
      },
      {
        "key": "fn_q1_year_established",
        "label": "Year Established",
        "type": "text",
        "placeholder": "e.g., 2016"
      },
      {
        "key": "fn_q1_contact_person",
        "label": "Primary Contact Person",
        "type": "text",
        "placeholder": "e.g., Rajesh Sharma",
        "required": true
      },
      {
        "key": "fn_q1_designation",
        "label": "Designation & Department",
        "type": "text",
        "placeholder": "e.g., Chief Operating Officer, Operations",
        "required": true
      },
      {
        "key": "fn_q1_email",
        "label": "Official Email Address",
        "type": "text",
        "placeholder": "e.g., rajesh.sharma@apexfin.com",
        "required": true
      },
      {
        "key": "fn_q1_phone",
        "label": "Phone / Mobile Number",
        "type": "text",
        "placeholder": "e.g., +91 98765 43210",
        "required": true
      },
      {
        "key": "fn_q1_org_type",
        "label": "Which type of organisation best describes your business?",
        "type": "checkbox",
        "options": [
          "Bank / financial institution",
          "NBFC / lending company",
          "Fintech / financial technology platform",
          "Payments / digital wallet provider",
          "Insurance / InsurTech",
          "Investment / wealth management",
          "Accounting / audit / financial services firm",
          "Other"
        ]
      },
      {
        "key": "fn_q1_main_products",
        "label": "What are your main products or services?",
        "type": "textarea",
        "placeholder": "Describe your core offerings (e.g., MSME working capital loans, merchant UPI acquiring, automated portfolio advisory)..."
      },
      {
        "key": "fn_q1_customer_segments",
        "label": "Which customer segments do you primarily serve?",
        "type": "checkbox",
        "options": [
          "Individuals / retail customers",
          "Small and medium businesses",
          "Large enterprises",
          "Startups / merchants",
          "Institutions / government",
          "High-net-worth customers",
          "Other"
        ]
      },
      {
        "key": "fn_q1_operating_regions",
        "label": "Where does your organisation operate?",
        "type": "checkbox",
        "options": [
          "Single city / region",
          "Across India",
          "International markets",
          "India and international markets",
          "Other"
        ]
      },
      {
        "key": "fn_q1_employee_size",
        "label": "Approximate size of your organisation",
        "type": "radio",
        "options": [
          "1\u201310 employees",
          "11\u201350 employees",
          "51\u2013200 employees",
          "201\u2013500 employees",
          "More than 500 employees",
          "Other"
        ]
      },
      {
        "key": "fn_q1_revenue_sources",
        "label": "What are your primary revenue sources?",
        "type": "textarea",
        "placeholder": "e.g., Interest margins, processing fees, subscription SaaS fees, interchange commissions, advisory fees..."
      }
    ]
  },
  {
    "number": 2,
    "key": "fn_tech_data",
    "title": "2. Current Technology & Data",
    "defaultDepartment": "Technology / IT",
    "description": "Core financial software, hosting models, data assets maintained, integration level, and reporting tools.",
    "questions": [
      {
        "key": "fn_q2_systems_used",
        "label": "Which systems or tools are currently used in your organisation?",
        "type": "checkbox",
        "options": [
          "Core banking / financial software",
          "Loan / lending management system",
          "Payment / transaction platform",
          "CRM / customer management",
          "Accounting / ERP software",
          "Excel / Google Sheets",
          "Business intelligence / reporting tools",
          "Other"
        ]
      },
      {
        "key": "fn_q2_hosting_setup",
        "label": "Where are your primary business systems hosted?",
        "type": "radio",
        "options": [
          "Cloud-based",
          "On-premises",
          "Hybrid",
          "Other"
        ]
      },
      {
        "key": "fn_q2_data_types",
        "label": "Which types of data does your organisation maintain?",
        "type": "checkbox",
        "options": [
          "Customer / KYC records",
          "Transaction and payment data",
          "Loan / credit records",
          "Financial statements / accounts",
          "Insurance / claims data",
          "Investment / portfolio data",
          "Customer service / interaction records",
          "Other"
        ]
      },
      {
        "key": "fn_q2_system_connectivity",
        "label": "How are your systems and data sources connected?",
        "type": "radio",
        "options": [
          "Fully integrated",
          "Partially integrated",
          "Mostly separate systems",
          "Manual data transfers",
          "Other"
        ]
      },
      {
        "key": "fn_q2_reporting_monitoring",
        "label": "How are reports and business performance monitored?",
        "type": "checkbox",
        "options": [
          "Automated dashboards",
          "System-generated reports",
          "Excel / spreadsheets",
          "Manual compilation",
          "Combination of these",
          "Other"
        ]
      },
      {
        "key": "fn_q2_tech_challenges",
        "label": "What are your main technology or data-related challenges?",
        "type": "textarea",
        "placeholder": "e.g., Data silos across legacy platforms, manual batch reconciliation, slow API latency with bank partners, lack of unified single customer view..."
      }
    ]
  },
  {
    "number": 3,
    "key": "fn_products_delivery",
    "title": "3. Financial Products & Services",
    "defaultDepartment": "Product / Business Operations",
    "description": "Product catalogue, channel delivery mechanisms, revenue drivers, and product delivery friction points.",
    "questions": [
      {
        "key": "fn_q3_product_types",
        "label": "Which products or services does your organisation offer?",
        "type": "checkbox",
        "options": [
          "Banking / deposit services",
          "Loans / credit facilities",
          "Payments / money transfers",
          "Insurance products",
          "Investments / wealth management",
          "Accounting / tax / audit services",
          "Other financial services",
          "Other"
        ]
      },
      {
        "key": "fn_q3_delivery_channels",
        "label": "How are your products or services delivered?",
        "type": "checkbox",
        "options": [
          "Digital / online",
          "Physical branches / offices",
          "Mobile application",
          "Partner / agent network",
          "Combination of channels",
          "Other"
        ]
      },
      {
        "key": "fn_q3_top_revenue_drivers",
        "label": "Which products or services account for the highest business volume or revenue?",
        "type": "textarea",
        "placeholder": "e.g., Secured business loans contribute 60% of revenue, merchant gateway volume is 30%..."
      },
      {
        "key": "fn_q3_delivery_challenges",
        "label": "What are the main challenges in managing or delivering your products and services?",
        "type": "textarea",
        "placeholder": "e.g., Long turnaround time for loan disbursals, high drop-off during paper document handovers, cross-selling difficulty..."
      }
    ]
  },
  {
    "number": 4,
    "key": "fn_onboarding_kyc",
    "title": "4. Customer Onboarding & KYC",
    "defaultDepartment": "Onboarding / Compliance",
    "description": "Registration channels, identity & document verification steps, onboarding turnaround time, and drop-off causes.",
    "questions": [
      {
        "key": "fn_q4_application_channel",
        "label": "How do new customers typically apply or register?",
        "type": "checkbox",
        "options": [
          "Website / online portal",
          "Mobile application",
          "Branch / office",
          "Agent / partner referral",
          "Business relationship manager",
          "Third-party platform",
          "Other"
        ]
      },
      {
        "key": "fn_q4_verification_activities",
        "label": "Which customer verification activities are part of your onboarding process?",
        "type": "checkbox",
        "options": [
          "Identity and address verification",
          "Document collection and validation",
          "PAN / tax identification checks",
          "Bank account verification",
          "Business / company verification",
          "Sanctions / watchlist screening",
          "Other"
        ]
      },
      {
        "key": "fn_q4_kyc_handling_mode",
        "label": "How is KYC and customer onboarding currently handled?",
        "type": "radio",
        "options": [
          "Mostly manual",
          "Partially automated",
          "Fully automated",
          "Handled by an external provider",
          "Varies by product / customer",
          "Other"
        ]
      },
      {
        "key": "fn_q4_turnaround_time",
        "label": "What is the typical time required to complete onboarding?",
        "type": "radio",
        "options": [
          "Under 15 minutes",
          "15 minutes\u20131 hour",
          "1 business day",
          "2\u20135 business days",
          "More than 5 business days",
          "Varies significantly",
          "Other"
        ]
      },
      {
        "key": "fn_q4_onboarding_challenges",
        "label": "What challenges do you face during onboarding or verification?",
        "type": "checkbox",
        "options": [
          "Incomplete / incorrect documents",
          "Manual data entry",
          "Verification delays",
          "Duplicate customer records",
          "Customer drop-offs",
          "Compliance checks",
          "Limited visibility / tracking",
          "Other"
        ]
      }
    ]
  },
  {
    "number": 5,
    "key": "fn_lending_credit_risk",
    "title": "5. Lending, Credit & Risk Management",
    "defaultDepartment": "Credit & Risk Management",
    "description": "Credit underwriting, financial statement analysis, decision automation, collections, and NPA monitoring.",
    "questions": [
      {
        "key": "fn_q5_lending_types",
        "label": "Which credit or lending services do you provide?",
        "type": "checkbox",
        "options": [
          "Personal loans",
          "Business / SME loans",
          "Home / vehicle loans",
          "Working capital / merchant credit",
          "Microfinance / group lending",
          "Credit cards / revolving credit",
          "Not applicable",
          "Other"
        ]
      },
      {
        "key": "fn_q5_loan_intake_mode",
        "label": "How are loan or credit applications received and processed?",
        "type": "checkbox",
        "options": [
          "Online application",
          "Mobile application",
          "Branch / relationship manager",
          "Partner / agent channel",
          "Combination of channels",
          "Other"
        ]
      },
      {
        "key": "fn_q5_credit_assessment_factors",
        "label": "Which factors are considered during credit assessment?",
        "type": "checkbox",
        "options": [
          "Credit bureau score / history",
          "Income / cash flow",
          "Employment / business details",
          "Bank statements / transactions",
          "Existing liabilities",
          "Collateral / security",
          "Other"
        ]
      },
      {
        "key": "fn_q5_credit_decision_mode",
        "label": "How are credit decisions and eligibility assessments made?",
        "type": "radio",
        "options": [
          "Manual review",
          "Rule-based system",
          "Automated scoring model",
          "Combination of manual and automated review",
          "External partner / bureau assessment",
          "Other"
        ]
      },
      {
        "key": "fn_q5_collections_monitoring",
        "label": "How are repayments, overdue accounts and defaults monitored?",
        "type": "checkbox",
        "options": [
          "Manual tracking",
          "System alerts / dashboards",
          "Automated reminders",
          "Dedicated collections system",
          "Combination of methods",
          "Other"
        ]
      },
      {
        "key": "fn_q5_lending_risk_challenges",
        "label": "What are your key challenges in lending or risk management?",
        "type": "textarea",
        "placeholder": "e.g., Parsing unstructured GST and bank statements manually, early warning detection before default, collections efficiency..."
      }
    ]
  },
  {
    "number": 6,
    "key": "fn_payments_operations",
    "title": "6. Payments, Transactions & Operations",
    "defaultDepartment": "Payments & Clearing Operations",
    "description": "Transaction rails, settlement reconciliation, dispute & chargeback handling, and payment latency.",
    "questions": [
      {
        "key": "fn_q6_transaction_types",
        "label": "Which transaction types do you process?",
        "type": "checkbox",
        "options": [
          "Account transfers",
          "UPI / instant payments",
          "Card payments",
          "Wallet transactions",
          "Domestic / international remittances",
          "Merchant settlements",
          "Other"
        ]
      },
      {
        "key": "fn_q6_payment_channels",
        "label": "Which payment channels or methods do you support?",
        "type": "checkbox",
        "options": [
          "UPI / QR payments",
          "Debit / credit cards",
          "Net banking",
          "Mobile wallets",
          "Bank transfers / NEFT / RTGS / IMPS",
          "International payment methods",
          "Other"
        ]
      },
      {
        "key": "fn_q6_reconciliation_method",
        "label": "How are transactions monitored and reconciled?",
        "type": "radio",
        "options": [
          "Automated reconciliation",
          "System-assisted with manual review",
          "Manual spreadsheets",
          "External service provider",
          "Not applicable",
          "Other"
        ]
      },
      {
        "key": "fn_q6_failed_txn_handling",
        "label": "How are failed, delayed or disputed transactions handled?",
        "type": "checkbox",
        "options": [
          "Automated alerts / workflows",
          "Customer support tickets",
          "Operations team review",
          "Manual investigation",
          "Combination of methods",
          "Other"
        ]
      },
      {
        "key": "fn_q6_transaction_volume",
        "label": "What is your approximate transaction volume?",
        "type": "radio",
        "options": [
          "Below 1,000 per month",
          "1,000\u201310,000 per month",
          "10,001\u20131 lakh per month",
          "1 lakh\u201310 lakh per month",
          "Above 10 lakh per month",
          "Not applicable / varies",
          "Other"
        ]
      },
      {
        "key": "fn_q6_ops_challenges",
        "label": "What are your main operational challenges in transaction processing or settlement?",
        "type": "textarea",
        "placeholder": "e.g., T+1/T+2 reconciliation mismatches with sponsor banks, high volume of status inquiry calls, handling chargebacks..."
      }
    ]
  },
  {
    "number": 7,
    "key": "fn_compliance_fraud_security",
    "title": "7. Compliance, Fraud Prevention & Security",
    "defaultDepartment": "Legal, Compliance & Security",
    "description": "AML/CFT monitoring, regulatory filings, audit readiness, transaction surveillance, and cybersecurity.",
    "questions": [
      {
        "key": "fn_q7_regulations",
        "label": "Which compliance or regulatory requirements are relevant to your organisation?",
        "type": "checkbox",
        "options": [
          "KYC / customer due diligence",
          "AML / suspicious transaction monitoring",
          "RBI / SEBI / IRDAI requirements",
          "GST / tax and statutory reporting",
          "Internal / external audits",
          "Data protection / privacy requirements",
          "Other"
        ]
      },
      {
        "key": "fn_q7_compliance_management",
        "label": "How are compliance activities and regulatory reports managed?",
        "type": "checkbox",
        "options": [
          "Dedicated compliance team",
          "Internal software / systems",
          "Manual spreadsheets and documents",
          "External consultants / service providers",
          "Combination of methods",
          "Other"
        ]
      },
      {
        "key": "fn_q7_fraud_detection_mode",
        "label": "How are suspicious activities or potential fraud identified?",
        "type": "checkbox",
        "options": [
          "Automated rule-based alerts",
          "Machine learning / anomaly detection",
          "Manual review of reports",
          "Customer reports / complaints",
          "External partner alerts",
          "Combination of methods",
          "Other"
        ]
      },
      {
        "key": "fn_q7_security_measures",
        "label": "Which security measures are currently in place?",
        "type": "checkbox",
        "options": [
          "Two-factor authentication (2FA)",
          "Data encryption (at rest and in transit)",
          "Role-based access controls",
          "Regular security audits / VAPT",
          "Real-time fraud alerts",
          "Other"
        ]
      },
      {
        "key": "fn_q7_compliance_challenges",
        "label": "What are your main challenges related to compliance, fraud prevention or data security?",
        "type": "textarea",
        "placeholder": "e.g., High false positive alert volume in transaction monitoring, adapting quickly to circular updates, gathering audit trails across disparate systems..."
      }
    ]
  },
  {
    "number": 8,
    "key": "fn_customer_service",
    "title": "8. Customer Service & Relationship Management",
    "defaultDepartment": "Customer Support / Operations",
    "description": "Helpdesk contact touchpoints, common financial enquiry drivers, CRM ticketing, and self-service automation.",
    "questions": [
      {
        "key": "fn_q8_support_channels",
        "label": "Which channels do customers use to contact your organisation?",
        "type": "checkbox",
        "options": [
          "Phone / call center",
          "Email",
          "WhatsApp / chat",
          "Mobile app / website portal",
          "Branch visits",
          "Social media",
          "Other"
        ]
      },
      {
        "key": "fn_q8_common_queries",
        "label": "What are the most common customer queries or service requests?",
        "type": "checkbox",
        "options": [
          "Account / balance inquiries",
          "Transaction status / payment confirmation",
          "Loan eligibility / application status",
          "Statement / document requests",
          "Disputes / refund inquiries",
          "Profile / detail update requests",
          "Other"
        ]
      },
      {
        "key": "fn_q8_crm_tracking",
        "label": "How are customer queries and complaints recorded and tracked?",
        "type": "radio",
        "options": [
          "Helpdesk / CRM ticketing system",
          "Email inboxes",
          "Shared spreadsheets / Excel",
          "Manual registers",
          "Combination of tools",
          "Other"
        ]
      },
      {
        "key": "fn_q8_chatbot_usage",
        "label": "Do you currently use chatbots or automated customer support?",
        "type": "radio",
        "options": [
          "Yes, conversational AI bot",
          "Yes, rule-based / FAQ bot",
          "In trial / development",
          "No automated bot",
          "Other"
        ]
      },
      {
        "key": "fn_q8_service_improvements",
        "label": "What customer service improvements would be most valuable?",
        "type": "textarea",
        "placeholder": "e.g., 24/7 instant multilingual WhatsApp support, automated loan status updates, instant resolution for payment failures..."
      }
    ]
  },
  {
    "number": 9,
    "key": "fn_internal_finance_hr",
    "title": "9. Finance, HR & Administration",
    "defaultDepartment": "Internal Finance / HR",
    "description": "Internal accounting, vendor disbursements, payroll, hiring, and manual paperwork bottlenecks.",
    "questions": [
      {
        "key": "fn_q9_internal_activities",
        "label": "Which internal finance and administrative activities are performed regularly?",
        "type": "checkbox",
        "options": [
          "Invoice processing and vendor payments",
          "Bank account reconciliation",
          "Employee payroll and reimbursements",
          "Statutory tax filings (GST, TDS, PF)",
          "Financial MIS and monthly closing",
          "Internal budget tracking",
          "Staff attendance and leave tracking",
          "Other"
        ]
      },
      {
        "key": "fn_q9_mgmt_mode",
        "label": "How are these internal activities currently managed?",
        "type": "radio",
        "options": [
          "Enterprise ERP (SAP, Oracle, NetSuite)",
          "Accounting software (Tally, Zoho Books)",
          "Excel / Google Sheets heavily",
          "Partially automated HRMS/Payroll",
          "Manual paper processes",
          "Other"
        ]
      },
      {
        "key": "fn_q9_repetitive_tasks",
        "label": "Which activities require significant manual effort or repeated data entry?",
        "type": "textarea",
        "placeholder": "e.g., Manual vendor bill matching against purchase orders, three-way bank reconciliation, manual payroll adjustments..."
      },
      {
        "key": "fn_q9_reporting_challenges",
        "label": "What are the main challenges in internal reporting, administration or coordination?",
        "type": "textarea",
        "placeholder": "e.g., Delays in monthly closing, multiple versions of truth in spreadsheets, difficulty tracking inter-branch balances..."
      }
    ]
  },
  {
    "number": 10,
    "key": "fn_business_priorities",
    "title": "10. Business Priorities & Challenges",
    "defaultDepartment": "Executive Leadership",
    "description": "Major friction points, recurring operational bottlenecks, and top strategic organizational goals for the next 1\u20132 years.",
    "questions": [
      {
        "key": "fn_q10_operational_difficulty",
        "label": "Which areas currently create the greatest operational difficulty?",
        "type": "checkbox",
        "options": [
          "Customer onboarding and verification",
          "Loan / credit processing",
          "Payments and reconciliation",
          "Fraud detection and compliance",
          "Customer support",
          "Reporting and data analysis",
          "Internal administration",
          "Other"
        ]
      },
      {
        "key": "fn_q10_bottlenecks",
        "label": "Where do delays, errors or bottlenecks occur most frequently?",
        "type": "textarea",
        "placeholder": "Describe the biggest process pain points (e.g., underwriting turnaround, KYC rework, manual settlement dispute resolution)..."
      },
      {
        "key": "fn_q10_strategic_priorities",
        "label": "What are your organisation's top business priorities for the next 1\u20132 years?",
        "type": "checkbox",
        "options": [
          "Increase revenue / customer acquisition",
          "Improve operational efficiency",
          "Reduce costs",
          "Strengthen risk and fraud controls",
          "Improve customer experience",
          "Expand products / markets",
          "Improve reporting and decision-making",
          "Other"
        ]
      },
      {
        "key": "fn_q10_top_three_improvements",
        "label": "Identify up to three areas where you would most like to see improvement:",
        "type": "textarea",
        "placeholder": "1. Faster customer onboarding\n2. Automated credit risk underwriting\n3. Zero-touch transaction reconciliation"
      }
    ]
  },
  {
    "number": 11,
    "key": "fn_ai_readiness",
    "title": "11. AI Readiness & Expectations",
    "defaultDepartment": "Strategy & Innovation / IT",
    "description": "Current AI adoption status, high-interest AI use cases, data quality, expected ROI, and implementation concerns.",
    "questions": [
      {
        "key": "fn_q11_ai_adoption_status",
        "label": "Is your organisation currently using AI or automation?",
        "type": "radio",
        "options": [
          "Yes, across multiple functions",
          "Yes, in selected functions",
          "Currently piloting solutions",
          "Exploring / evaluating options",
          "No current usage",
          "Other"
        ]
      },
      {
        "key": "fn_q11_ai_exploration_areas",
        "label": "Which areas would you be interested in exploring for AI or automation?",
        "type": "checkbox",
        "options": [
          "Customer support and virtual assistants",
          "Document processing and data extraction",
          "Fraud detection and transaction monitoring",
          "Credit scoring and risk analysis",
          "Financial forecasting and reporting",
          "Compliance monitoring and regulatory reporting",
          "Workflow / approval automation",
          "Other"
        ]
      },
      {
        "key": "fn_q11_internal_tech_team",
        "label": "Does your organisation have an internal technology or data team?",
        "type": "radio",
        "options": [
          "Yes, dedicated team",
          "Yes, small / shared team",
          "External technology partner",
          "No dedicated team",
          "Other"
        ]
      },
      {
        "key": "fn_q11_data_quality_assessment",
        "label": "How would you describe the availability and quality of your business data?",
        "type": "radio",
        "options": [
          "Well-organised and accessible",
          "Available across multiple systems",
          "Partly digital / partly paper-based",
          "Limited or inconsistent",
          "Other"
        ]
      },
      {
        "key": "fn_q11_expected_outcomes",
        "label": "What outcomes would you expect from AI adoption?",
        "type": "checkbox",
        "options": [
          "Reduced manual workload",
          "Faster processing and turnaround",
          "Improved accuracy",
          "Better fraud / risk detection",
          "Improved customer experience",
          "Better insights and decisions",
          "Cost reduction / business growth",
          "Other"
        ]
      },
      {
        "key": "fn_q11_concerns",
        "label": "What concerns might affect AI adoption in your organisation?",
        "type": "checkbox",
        "options": [
          "Data privacy and confidentiality",
          "Regulatory / compliance requirements",
          "Cybersecurity risks",
          "Accuracy and explainability",
          "Integration with existing systems",
          "Cost and return on investment",
          "Employee readiness / change management",
          "Other"
        ]
      },
      {
        "key": "fn_q11_specific_expectations",
        "label": "Any specific AI-related expectations or use cases you would like to discuss?",
        "type": "textarea",
        "placeholder": "e.g., AI copilot for financial statement analysis, automated voice bot for EMI collection calls, automated compliance auditing..."
      }
    ]
  },
  {
    "number": 12,
    "key": "fn_additional_signoff",
    "title": "12. Additional Notes & Priority Rating",
    "defaultDepartment": "Executive / Sign-off",
    "description": "Any additional context, strategic priorities rating matrix, and questionnaire sign-off.",
    "questions": [
      {
        "key": "fn_q12_additional_notes",
        "label": "Is there any other information, business challenge or requirement you would like to share?",
        "type": "textarea",
        "placeholder": "Share any additional context or specific operational constraints..."
      },
      {
        "key": "fn_q12_priority_rating",
        "label": "Priority Rating Matrix (Rate importance from 1 = Low to 5 = Critical)",
        "type": "rating_grid",
        "gridColumns": [
          "1 (Low)",
          "2",
          "3",
          "4",
          "5 (Critical)"
        ],
        "gridRows": [
          "Operational efficiency",
          "Customer experience",
          "Risk / fraud / compliance",
          "Reporting and decision-making",
          "Growth and scalability"
        ]
      }
    ]
  }
];
