/**
 * Seeds the database with demo departments, users, tags and documents (with version history),
 * and writes matching placeholder files into UPLOAD_DIR so downloads work.
 *
 * Re-runnable: it wipes all repository tables and the upload directory first.
 * Run with `npm run db:seed`.
 */
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../src/config/env';
import { prisma } from '../src/config/prisma';
import { MinRole, Role, Visibility } from '../src/generated/prisma/client';

const SEED_PASSWORD = '123456';

// ---------------------------------------------------------------------------
// Placeholder file builders
// ---------------------------------------------------------------------------

/** Builds a minimal, valid one-page PDF containing a heading and some text lines. */
function buildPdf(title: string, lines: string[]): Buffer {
  const escape = (s: string) => s.replace(/[\\()]/g, (c) => `\\${c}`);
  const text = [
    'BT',
    `/F1 18 Tf 72 720 Td (${escape(title)}) Tj`,
    '/F1 11 Tf',
    ...lines.map((line) => `0 -22 Td (${escape(line)}) Tj`),
    'ET',
  ].join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R ' +
      '/Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(text, 'latin1')} >>\nstream\n${text}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'latin1');
}

type FileKind = 'pdf' | 'txt';

const MIME_TYPES: Record<FileKind, string> = {
  pdf: 'application/pdf',
  txt: 'text/plain',
};

function buildFile(kind: FileKind, title: string, lines: string[]): Buffer {
  return kind === 'pdf'
    ? buildPdf(title, lines)
    : Buffer.from(`${title}\n${'='.repeat(title.length)}\n\n${lines.join('\n')}\n`, 'utf8');
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const DEPARTMENTS = ['HR', 'Engineering', 'Legal', 'Finance'] as const;
type DepartmentName = (typeof DEPARTMENTS)[number];

const USERS: { name: string; role: Role; department: DepartmentName | null }[] = [
  { name: 'admin', role: Role.ADMIN, department: null },
  { name: 'manager1', role: Role.MANAGER, department: 'HR' },
  { name: 'manager2', role: Role.MANAGER, department: 'Engineering' },
  { name: 'employee1', role: Role.EMPLOYEE, department: 'HR' },
  { name: 'employee2', role: Role.EMPLOYEE, department: 'Engineering' },
  { name: 'employee3', role: Role.EMPLOYEE, department: 'Legal' },
  { name: 'employee4', role: Role.EMPLOYEE, department: 'Finance' },
];
type UserName = (typeof USERS)[number]['name'];

const TAGS = ['policy', 'hr', 'finance', 'legal', 'report', 'technical', 'onboarding'] as const;

interface SeedVersion {
  uploader: UserName;
  changeNote?: string;
  daysAgo: number;
  lines: string[];
}

interface SeedDocument {
  title: string;
  description?: string;
  fileBaseName: string;
  kind: FileKind;
  ownerDepartment: DepartmentName;
  visibility: Visibility;
  /** Allowed departments for a RESTRICTED document. */
  allowedDepartments?: DepartmentName[];
  minRole: MinRole;
  tags: (typeof TAGS)[number][];
  /** Oldest first; the first entry's uploader is the document uploader, the last is current. */
  versions: SeedVersion[];
}

const DOCUMENTS: SeedDocument[] = [
  {
    title: 'Company Code of Conduct',
    description: 'Expected behaviour, ethics and workplace standards for all employees.',
    fileBaseName: 'company-code-of-conduct',
    kind: 'pdf',
    ownerDepartment: 'HR',
    visibility: Visibility.PUBLIC,
    minRole: MinRole.EMPLOYEE,
    tags: ['policy', 'hr'],
    versions: [
      {
        uploader: 'manager1',
        daysAgo: 90,
        lines: [
          'Treat colleagues with respect.',
          'Report conflicts of interest to your manager.',
          'Protect confidential company information.',
        ],
      },
    ],
  },
  {
    title: 'Engineering Onboarding Guide',
    description: 'Everything a new engineer needs in their first two weeks.',
    fileBaseName: 'engineering-onboarding-guide',
    kind: 'pdf',
    ownerDepartment: 'Engineering',
    visibility: Visibility.PUBLIC,
    minRole: MinRole.EMPLOYEE,
    tags: ['technical', 'onboarding'],
    versions: [
      {
        uploader: 'employee2',
        changeNote: 'Initial version.',
        daysAgo: 60,
        lines: [
          'Version 1',
          'Day 1: laptop setup and accounts.',
          'Week 1: read the architecture docs.',
        ],
      },
      {
        uploader: 'employee2',
        changeNote: 'Added local development setup steps.',
        daysAgo: 30,
        lines: [
          'Version 2',
          'Day 1: laptop setup and accounts.',
          'Day 2: clone the repos and run docker compose up.',
          'Week 1: read the architecture docs.',
        ],
      },
      {
        uploader: 'manager2',
        changeNote: 'Manager review: added code review and on-call expectations.',
        daysAgo: 5,
        lines: [
          'Version 3',
          'Day 1: laptop setup and accounts.',
          'Day 2: clone the repos and run docker compose up.',
          'Week 1: read the architecture docs.',
          'Week 2: first code review and on-call shadowing.',
        ],
      },
    ],
  },
  {
    title: 'Q3 Financial Report',
    description: 'Quarterly revenue, expenses and forecast.',
    fileBaseName: 'q3-financial-report',
    kind: 'pdf',
    ownerDepartment: 'Finance',
    visibility: Visibility.RESTRICTED,
    allowedDepartments: ['Finance'],
    minRole: MinRole.EMPLOYEE,
    tags: ['finance', 'report'],
    versions: [
      {
        uploader: 'employee4',
        daysAgo: 14,
        lines: ['Revenue: 4.2M', 'Expenses: 2.9M', 'Q4 forecast: 4.6M'],
      },
    ],
  },
  {
    title: 'Vendor Contract Template',
    description: 'Standard contract template for new vendors.',
    fileBaseName: 'vendor-contract-template',
    kind: 'txt',
    ownerDepartment: 'Legal',
    visibility: Visibility.RESTRICTED,
    allowedDepartments: ['Legal', 'Finance'],
    minRole: MinRole.EMPLOYEE,
    tags: ['legal', 'finance'],
    versions: [
      {
        uploader: 'employee3',
        daysAgo: 45,
        lines: ['1. Parties', '2. Scope of services', '3. Payment terms', '4. Termination'],
      },
    ],
  },
  {
    title: 'Salary Bands 2026',
    description: 'Compensation bands per role level. Managers only.',
    fileBaseName: 'salary-bands-2026',
    kind: 'pdf',
    ownerDepartment: 'HR',
    visibility: Visibility.RESTRICTED,
    allowedDepartments: ['HR'],
    minRole: MinRole.MANAGER,
    tags: ['hr', 'finance', 'policy'],
    versions: [
      {
        uploader: 'manager1',
        changeNote: 'Initial bands.',
        daysAgo: 20,
        lines: ['Level 1: 40k - 55k', 'Level 2: 55k - 75k', 'Level 3: 75k - 100k'],
      },
      {
        uploader: 'manager1',
        changeNote: 'Adjusted for inflation and added Level 4.',
        daysAgo: 2,
        lines: [
          'Level 1: 42k - 58k',
          'Level 2: 58k - 78k',
          'Level 3: 78k - 105k',
          'Level 4: 105k - 140k',
        ],
      },
    ],
  },
  {
    title: 'System Architecture Overview',
    description: 'High-level architecture of the internal platform. Managers only.',
    fileBaseName: 'system-architecture-overview',
    kind: 'txt',
    ownerDepartment: 'Engineering',
    visibility: Visibility.PUBLIC,
    minRole: MinRole.MANAGER,
    tags: ['technical'],
    versions: [
      {
        uploader: 'manager2',
        daysAgo: 10,
        lines: [
          'REST API (Node.js) behind a reverse proxy.',
          'PostgreSQL for persistence, Redis for caching.',
          'Files stored on a mounted volume.',
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

function resetUploadDir() {
  const dir = config.uploadDir;
  // Guard against a misconfigured UPLOAD_DIR wiping something important.
  if (dir === path.parse(dir).root || dir === process.cwd()) {
    throw new Error(`Refusing to clear UPLOAD_DIR=${dir}`);
  }
  fs.mkdirSync(dir, { recursive: true });
  for (const entry of fs.readdirSync(dir)) {
    fs.rmSync(path.join(dir, entry), { recursive: true, force: true });
  }
}

async function main() {
  console.log('Clearing existing data...');
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE document_permissions, document_tags, document_versions, documents, tags, users, departments CASCADE',
  );
  resetUploadDir();

  const departments = new Map<string, string>();
  for (const name of DEPARTMENTS) {
    const dept = await prisma.department.create({ data: { name } });
    departments.set(name, dept.id);
  }

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const users = new Map<string, string>();
  for (const u of USERS) {
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: `${u.name}@gmail.com`,
        passwordHash,
        role: u.role,
        departmentId: u.department ? departments.get(u.department)! : null,
      },
    });
    users.set(u.name, user.id);
  }

  const tags = new Map<string, string>();
  for (const name of TAGS) {
    const tag = await prisma.tag.create({ data: { name } });
    tags.set(name, tag.id);
  }

  for (const doc of DOCUMENTS) {
    const first = doc.versions[0];
    const last = doc.versions[doc.versions.length - 1];

    await prisma.$transaction(async (tx) => {
      const document = await tx.document.create({
        data: {
          title: doc.title,
          description: doc.description,
          visibility: doc.visibility,
          minRole: doc.minRole,
          uploaderId: users.get(first.uploader)!,
          ownerDepartmentId: departments.get(doc.ownerDepartment)!,
          createdAt: daysAgo(first.daysAgo),
          tags: { create: doc.tags.map((t) => ({ tagId: tags.get(t)! })) },
          permissions: {
            create: (doc.allowedDepartments ?? []).map((d) => ({
              departmentId: departments.get(d)!,
            })),
          },
        },
      });

      let currentVersionId = '';
      for (const [i, v] of doc.versions.entries()) {
        const versionNumber = i + 1;
        const relativePath = path.posix.join(document.id, `v${versionNumber}.${doc.kind}`);
        const content = buildFile(doc.kind, doc.title, v.lines);

        fs.mkdirSync(path.join(config.uploadDir, document.id), { recursive: true });
        fs.writeFileSync(path.join(config.uploadDir, relativePath), content);

        const version = await tx.documentVersion.create({
          data: {
            documentId: document.id,
            versionNumber,
            filePath: relativePath,
            originalFilename: `${doc.fileBaseName}.${doc.kind}`,
            mimeType: MIME_TYPES[doc.kind],
            sizeBytes: content.length,
            uploadedById: users.get(v.uploader)!,
            changeNote: v.changeNote,
            createdAt: daysAgo(v.daysAgo),
          },
        });
        currentVersionId = version.id;
      }

      // Point the document at its latest version; older versions remain as history.
      await tx.document.update({
        where: { id: document.id },
        data: { currentVersionId, updatedAt: daysAgo(last.daysAgo) },
      });
    });

    console.log(
      `  + ${doc.title} (${doc.visibility}, min ${doc.minRole}, ${doc.versions.length} version(s))`,
    );
  }

  console.log(
    `Seeded ${DEPARTMENTS.length} departments, ${USERS.length} users, ${TAGS.length} tags, ` +
      `${DOCUMENTS.length} documents. Files written to ${config.uploadDir}`,
  );
  console.log(`All users log in with password "${SEED_PASSWORD}".`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
