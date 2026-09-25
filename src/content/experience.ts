export interface TimelineEntry {
  period: string;
  /** Machine-readable start, for <time datetime>. */
  start: string;
  title: string;
  org?: string;
  lines: string[];
}

/** Oldest first: it reads as a sequence. */
export const timeline: TimelineEntry[] = [
  {
    period: 'May 2018 – Jun 2020',
    start: '2018-05',
    title: 'Junior Software Developer',
    org: 'Soham ERP Solutions',
    lines: [
      'Full-stack ERP modules for HR, inventory and reporting on .NET Framework Web API and Angular v1.4 to v5, including an electronic document system for batch manufacturing records.',
      'Complex SQL Server queries, views and stored procedures behind the ERP reporting modules.',
    ],
  },
  {
    period: 'Jul 2020 – Apr 2021',
    start: '2020-07',
    title: 'Software Developer',
    org: 'Sufalam Solutions',
    lines: [
      'REST APIs in ASP.NET Core with Angular front ends, and work on moving applications to Azure.',
      'SQL Server design for a laboratory information management system: sample tracking, test workflows and report generation.',
    ],
  },
  {
    period: 'May 2021 – Oct 2021',
    start: '2021-05',
    title: 'Career break',
    lines: [],
  },
  {
    period: 'Nov 2021 – present',
    start: '2021-11',
    title: 'Senior Software Engineer',
    org: 'Veloxcore Pvt. Ltd.',
    lines: [
      'I architect and lead delivery of B2B platforms for insurance and digital-marketplace clients on .NET 6–9, Angular 14–16, Blazor and Azure.',
      'I lead a sub-team of three and own the Azure DevOps CI/CD pipelines.',
      'Selenium regression suites, and C# console utilities for data migration and batch-processing jobs.',
    ],
  },
];

export const education = [
  { degree: 'M.Sc. Information Technology', year: '2019', school: 'Sardar Patel University' },
  { degree: 'B.Sc. Computer Science', year: '2017', school: 'Sardar Patel University' },
];
