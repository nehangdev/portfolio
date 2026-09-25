import { CaseStudy } from './case-studies';

/** Key projects, in the résumé's order and wording. Client names are never used. */
export interface Project {
  name: string;
  summary: string;
  stack: string[];
  role: string;
  /** The case study that covers this project, if there is one. */
  caseStudy?: CaseStudy['slug'];
}

export const projectsText = {
  heading: 'Projects',
  intro: 'The main projects I have worked on. Where a case study covers one, it links there.',
  stackLabel: 'Stack',
  roleLabel: 'Role',
  caseStudyLink: 'Read the case study',
  /** Screen-reader-only continuation, e.g. "about Financial charts dashboard". */
  caseStudyAbout: 'about',
};

export const projects: Project[] = [
  {
    name: 'Insurance and agents B2B platform',
    summary:
      'Document-driven platform with hierarchical uploads and multi-level validation workflows. I designed parallel processing on Azure Service Bus so document ingestion scales and recovers from failures.',
    stack: ['.NET', 'Angular', 'Azure Service Bus', 'CQRS', 'Azure PaaS'],
    role: 'Architecture, backend and frontend development',
    caseStudy: 'event-driven',
  },
  {
    name: 'Digital marketplace and LMS',
    summary:
      'Led development of a NopCommerce marketplace with a custom plugin architecture, Azure AD B2C sign-in, and KYC and payment steps built into customer onboarding.',
    stack: ['NopCommerce', '.NET', 'Azure AD B2C', 'Payment and KYC integrations'],
    role: 'Technical lead, development',
    caseStudy: 'identity',
  },
  {
    name: 'Social platform for crypto traders',
    summary: 'A social media application for trading and crypto enthusiasts, built with agentic AI tooling and subscription payments.',
    stack: ['ASP.NET 9', 'React', 'Agentic AI', 'Microsoft Copilot', 'MCP', 'Stripe', 'Azure DevOps'],
    role: 'Project management, code reviews',
  },
  {
    name: 'Custom CMS for fintech content',
    summary: "A content management system purpose-built as a fintech firm's internal knowledge base.",
    stack: ['Umbraco CMS 13', 'AngularJS', 'SQL Server', 'Microsoft Azure'],
    role: 'Project management, development and deployment',
  },
  {
    name: 'Authentication and authorization system',
    summary: 'Centralised identity service securing service-to-service access using the OAuth 2.0 client credentials flow.',
    stack: ['ASP.NET Core', 'IdentityServer 4', 'Azure AD B2C', 'SQL Server', 'Azure services', 'Selenium'],
    role: 'Backend and frontend development, test automation',
    caseStudy: 'identity',
  },
  {
    name: 'Financial charts dashboard',
    summary: 'Real-time charting and trading-tools dashboards for crypto trading, built as reusable Web Components.',
    stack: ['Angular', '.NET microservices', 'Docker', 'Open Web Components'],
    role: 'Backend and frontend development',
    caseStudy: 'live-chart',
  },
  {
    name: 'Laboratory information management system',
    summary: 'ERP software to run medical testing laboratories of any size: sample tracking, test workflows and reporting.',
    stack: ['Angular', '.NET Web API', 'SQL Server 2014'],
    role: 'Backend and frontend feature development',
  },
  {
    name: 'Pharma warehousing system',
    summary: 'ERP software for managing large-scale warehousing of medical goods.',
    stack: ['Angular', 'WCF REST API', 'SQL Server 2012'],
    role: 'Backend and frontend feature development',
  },
  {
    name: 'Electronic document system',
    summary: 'Automates creation of Batch Manufacturing Records (BMR) and Batch Packaging Records (BPR) for medicines.',
    stack: ['AngularJS', 'WCF REST API', 'SQL Server 2012'],
    role: 'Backend and frontend feature development',
  },
];
