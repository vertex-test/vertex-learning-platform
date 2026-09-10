import {
  Bell,
  Bookmark,
  ChartNoAxesColumn,
  ChevronRight,
  Clock,
  Eye,
  ExternalLink,
  FileText,
  LayoutGrid,
  Accessibility,
  Play,
  Search,
  Target,
  User,
} from "lucide-react";
import { ReactNode } from "react";
import { Badge } from "../components/ui/Badge";
import { Breadcrumbs } from "../components/ui/Breadcrumbs";
import { Button } from "../components/ui/Button";
import { CourseCard } from "../components/ui/Card/CourseCard";
import { LessonCard } from "../components/ui/Card/LessonCard";
import { ResourceCard } from "../components/ui/Card/ResourceCard";
import { Input, SearchInput } from "../components/ui/Input";
import { Logo } from "../components/ui/Logo";
import { LogoMark } from "../components/ui/Logo";
import { Nav } from "../components/ui/Nav";
import { Pagination } from "../components/ui/Pagination";
import { PlayCircleFilled } from "../components/ui/PlayCircleFilled";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Select } from "../components/ui/Select";
import { StatusIndicator } from "../components/ui/StatusIndicator";

export const metadata = {
  title: "Design System · Vertex",
};

/* ---------------------------------------------------------------- data */

const primaryColors = [
  { name: "Primary 500", hex: "#F97316", className: "bg-primary-500" },
  { name: "Primary 400", hex: "#FB923C", className: "bg-primary-400" },
  { name: "Primary 300", hex: "#FDBA74", className: "bg-primary-300" },
  { name: "Primary 200", hex: "#FED7AA", className: "bg-primary-200" },
  { name: "Primary 100", hex: "#FFEEE5", className: "bg-primary-100" },
];

const neutralColors = [
  { name: "Neutral 900", hex: "#0F172A", className: "bg-neutral-900" },
  { name: "Neutral 700", hex: "#33415C", className: "bg-neutral-700" },
  { name: "Neutral 500", hex: "#64748B", className: "bg-neutral-500" },
  { name: "Neutral 300", hex: "#CBD5E1", className: "bg-neutral-300" },
  { name: "Neutral 200", hex: "#E2E8F0", className: "bg-neutral-200" },
  { name: "Neutral 100", hex: "#F1F5F9", className: "bg-neutral-100" },
  { name: "Neutral 50", hex: "#FAFAFC", className: "bg-neutral-50" },
  { name: "White", hex: "#FFFFFF", className: "bg-white" },
];

const typeScale = [
  ["Display 1", "Playfair Display", "48 / 56", "Bold", "Page titles"],
  ["Display 2", "Playfair Display", "36 / 44", "Bold", "Section titles"],
  ["Heading 1", "Inter", "28 / 36", "Semi Bold", "Card titles"],
  ["Heading 2", "Inter", "22 / 30", "Semi Bold", "Sub section"],
  ["Heading 3", "Inter", "18 / 26", "Medium", "Small titles"],
  ["Body Large", "Inter", "16 / 24", "Regular", "Body copy"],
  ["Body", "Inter", "14 / 20", "Regular", "Supporting text"],
  ["Small", "Inter", "12 / 16", "Regular", "Captions, meta"],
];

const typeScaleClasses: Record<string, string> = {
  "Display 1": "font-display text-display-1",
  "Display 2": "font-display text-display-2",
  "Heading 1": "text-heading-1",
  "Heading 2": "text-heading-2",
  "Heading 3": "text-heading-3",
  "Body Large": "text-body-lg",
  Body: "text-body",
  Small: "text-small",
};

const spacing = [
  [4, "0.25rem"],
  [8, "0.5rem"],
  [12, "0.75rem"],
  [16, "1rem"],
  [24, "1.5rem"],
  [32, "2rem"],
  [40, "2.5rem"],
  [48, "3rem"],
  [64, "4rem"],
] as const;

const radii = [
  { label: "4px", note: "(xs)", className: "rounded-xs" },
  { label: "8px", note: "(sm)", className: "rounded-sm" },
  { label: "12px", note: "(md)", className: "rounded-md" },
  { label: "16px", note: "(lg)", className: "rounded-lg" },
  { label: "24px", note: "(xl)", className: "rounded-xl" },
  { label: "Full", note: "(circle)", className: "rounded-full" },
];

const shadows = [
  { name: "Sm", spec: "0 1px 2px 0 rgba(15, 23, 42, 0.05)", className: "shadow-sm" },
  { name: "Md", spec: "0 4px 12px -2px rgba(15, 23, 42, 0.08)", className: "shadow-md" },
  { name: "Lg", spec: "0 12px 24px -4px rgba(15, 23, 42, 0.10)", className: "shadow-lg" },
  { name: "Xl", spec: "0 20px 40px -8px rgba(15, 23, 42, 0.12)", className: "shadow-xl" },
];

const icons = [Bell, Search, Play, FileText, Bookmark, ChartNoAxesColumn, Clock, User, ChevronRight];

const principles = [
  { Icon: Eye, title: "Clarity First", body: "Every element should communicate clearly." },
  { Icon: LayoutGrid, title: "Consistency", body: "Use components and patterns consistently across the platform." },
  { Icon: Target, title: "Focus & Calm", body: "Remove noise and help learners focus on what matters." },
  { Icon: Accessibility, title: "Accessible", body: "Design with accessibility and inclusivity in mind." },
];

/* ------------------------------------------------------------ building blocks */

function Section({
  number,
  title,
  children,
  className = "",
}: {
  number: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-lg border border-neutral-200 bg-white p-6 md:p-8 ${className}`}
    >
      <h2 className="mb-6 flex items-center gap-3 text-body font-bold tracking-widest uppercase text-neutral-900">
        <span className="text-primary-500">{number}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p className="mb-4 text-body text-neutral-700">{children}</p>;
}

function SpecList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-3 text-body font-semibold text-neutral-900">{title}</p>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-body text-neutral-500">
            <span aria-hidden="true">·</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Swatch({
  name,
  hex,
  className,
}: {
  name: string;
  hex: string;
  className: string;
}) {
  return (
    <div className="flex w-20 flex-col gap-2">
      <div
        className={`h-16 w-full rounded-sm border border-neutral-200 ${className}`}
      />
      <div className="text-small text-neutral-900">{name}</div>
      <div className="-mt-1 text-small text-neutral-500">{hex}</div>
    </div>
  );
}

/* Buttons are shown in default / hover / disabled rows. The hover row forces
   the hover colours statically so the sheet can be diffed at a glance. */
function ButtonRow({
  state,
  forced = "",
  disabled = false,
}: {
  state: string;
  forced?: string;
  disabled?: boolean;
}) {
  const primaryForced = forced && "bg-primary-600!";
  const liftForced = forced && "shadow-md!";
  const textForced = forced && "text-primary-600!";
  return (
    <div className="grid grid-cols-[70px_repeat(4,max-content)] items-center gap-3">
      <span className="text-body font-medium text-neutral-900">{state}</span>
      <div>
        <Button variant="primary" disabled={disabled} className={primaryForced}>
          Get Started
        </Button>
      </div>
      <div>
        <Button variant="secondary" disabled={disabled} className={liftForced}>
          Explore Courses
        </Button>
      </div>
      <div>
        <Button
          variant="tertiary"
          disabled={disabled}
          className={liftForced}
          icon={<ExternalLink className="h-4 w-4" strokeWidth={2} />}
        >
          View Lesson
        </Button>
      </div>
      <div>
        <Button
          variant="text"
          disabled={disabled}
          className={textForced}
          icon={<PlayCircleFilled className="h-5 w-5" />}
        >
          Watch Video
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- page */

export default function StyleGuidePage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Nav />

      <main className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-8">
        {/* Cover + 01 Colors */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <section className="rounded-lg border border-neutral-200 bg-white p-6 md:p-8">
            <Logo />
            <h1 className="mt-8 font-display text-display-1 text-neutral-900">
              Design System
            </h1>
            <p className="mt-4 max-w-xs text-body-lg text-neutral-500">
              A unified design language for Vertex learning platform. Clean,
              modern and focused on clarity, consistency and intuitive learning
              experiences.
            </p>
            <p className="mt-8 text-small font-medium tracking-widest uppercase text-neutral-500">
              Version 1.0 &nbsp;·&nbsp; May 2025
            </p>
          </section>

          <Section number="01" title="Colors">
            <Label>Primary</Label>
            <div className="mb-8 flex flex-wrap gap-3">
              {primaryColors.map((c) => (
                <Swatch key={c.name} {...c} />
              ))}
            </div>
            <Label>Neutral</Label>
            <div className="flex flex-wrap gap-3">
              {neutralColors.map((c) => (
                <Swatch key={c.name} {...c} />
              ))}
            </div>
          </Section>
        </div>

        {/* 02 Typography + 03 Type scale */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <Section number="02" title="Typography">
            <div className="flex flex-col gap-8">
              <div className="flex flex-wrap items-center gap-6 sm:gap-8">
                <span className="font-display text-display-1 text-neutral-900">
                  Ag
                </span>
                <div>
                  <p className="text-heading-2 text-neutral-900">
                    Playfair Display
                  </p>
                  <p className="mt-1 text-body text-neutral-500">
                    Elegant &nbsp;·&nbsp; Readable &nbsp;·&nbsp; Timeless
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-6 sm:gap-8">
                <span className="text-display-1 font-normal text-neutral-900">
                  Ag
                </span>
                <div>
                  <p className="text-heading-2 text-neutral-900">Inter</p>
                  <p className="mt-1 text-body text-neutral-500">
                    Clean &nbsp;·&nbsp; Modern &nbsp;·&nbsp; Highly legible
                  </p>
                </div>
              </div>
            </div>
          </Section>

          <Section number="03" title="Type Scale">
            <div className="overflow-x-auto">
              <table className="w-full min-w-md text-left">
                <thead>
                  <tr className="text-body text-neutral-500">
                    <th className="pb-3 font-normal">Style</th>
                    <th className="pb-3 font-normal">Font</th>
                    <th className="pb-3 font-normal">Size / Line Height</th>
                    <th className="pb-3 font-normal">Weight</th>
                    <th className="pb-3 font-normal">Use</th>
                  </tr>
                </thead>
                <tbody>
                  {typeScale.map(([style, font, size, weight, use]) => (
                    <tr key={style} className="align-baseline">
                      <td className="py-2 pr-6">
                        <span className="text-body-lg font-semibold whitespace-nowrap text-neutral-900">
                          {style}
                        </span>
                      </td>
                      <td className="py-2 pr-6 text-body whitespace-nowrap text-neutral-500">
                        {font}
                      </td>
                      <td className="py-2 pr-6 text-body whitespace-nowrap text-neutral-500">
                        {size}
                      </td>
                      <td className="py-2 pr-6 text-body whitespace-nowrap text-neutral-500">
                        {weight}
                      </td>
                      <td className="py-2 text-body whitespace-nowrap text-neutral-500">
                        {use}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-8 flex flex-col gap-2 border-t border-neutral-200 pt-6">
              {typeScale.map(([style]) => (
                <p key={style} className={`${typeScaleClasses[style]} text-neutral-900`}>
                  {style} — Learning, made searchable
                </p>
              ))}
            </div>
          </Section>
        </div>

        {/* 04 Spacing + 05 Radius & shadows */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Section number="04" title="Spacing System">
            <Label>Base unit: 4px</Label>
            <div className="flex flex-wrap items-end gap-2">
              {spacing.map(([px, rem]) => (
                <div key={px} className="flex w-12 flex-col items-center gap-3">
                  <div
                    className="rounded-xs bg-primary-200"
                    style={{ width: px, height: px }}
                  />
                  <span className="text-body text-neutral-900">{px}</span>
                  <span className="-mt-2 text-small text-neutral-500">
                    ({rem})
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section number="05" title="Radius & Shadows">
            <Label>Radius</Label>
            <div className="mb-8 flex flex-wrap gap-4">
              {radii.map((r) => (
                <div key={r.label} className="flex w-16 flex-col items-center gap-3">
                  <div
                    className={`h-14 w-14 border border-neutral-200 bg-white ${r.className}`}
                  />
                  <span className="text-body text-neutral-900">{r.label}</span>
                  <span className="-mt-2 text-small text-neutral-500">{r.note}</span>
                </div>
              ))}
            </div>
            <Label>Shadows</Label>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {shadows.map((s) => (
                <div
                  key={s.name}
                  className={`rounded-md bg-white p-4 ${s.className}`}
                >
                  <p className="text-body-lg font-medium text-neutral-900">
                    {s.name}
                  </p>
                  <p className="mt-2 text-small text-neutral-500">{s.spec}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* 06 Icons + 08 Inputs */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Section number="06" title="Icons">
            <Label>Outline Style</Label>
            <div className="mb-8 flex flex-wrap gap-4 text-neutral-900">
              {icons.map((Icon, i) => (
                <Icon key={i} className="h-6 w-6" strokeWidth={2} />
              ))}
            </div>
            <Label>Filled Style</Label>
            <div className="mb-8 flex flex-wrap gap-4 text-neutral-900">
              {icons.map((Icon, i) => (
                <Icon
                  key={i}
                  className={`h-6 w-6 ${Icon === ChevronRight ? "" : "fill-neutral-900"}`}
                  strokeWidth={2}
                />
              ))}
            </div>
            <SpecList
              title="Icon Specs"
              items={[
                "24x24px grid",
                "2px stroke width (outline)",
                "Rounded line caps",
                "Consistent optical balance",
              ]}
            />
          </Section>
          <Section number="08" title="Inputs">
            <Label>Search / Text Input</Label>
            <div className="mb-6">
              <SearchInput placeholder="Search anything..." shortcut="⌘ K" />
            </div>
            <Label>Select</Label>
            <div className="mb-6">
              <Select defaultValue="most-relevant" aria-label="Sort results">
                <option value="most-relevant">Most Relevant</option>
                <option value="newest">Newest</option>
                <option value="duration">Duration</option>
              </Select>
            </div>
            <Label>Text Input</Label>
            <div className="mb-8">
              <Input placeholder="Your name" />
            </div>
            <SpecList
              title="Field Specs"
              items={[
                "Height: 44px",
                "Radius: 12px",
                "Border: 1px solid #E2E8F0",
                "Padding: 0 16px",
                "Focus: Border color #FB923C",
              ]}
            />
          </Section>
        </div>

        {/* 07 Buttons */}
          <Section number="07" title="Buttons">
            <div className="overflow-x-auto">
              <div className="flex w-max flex-col gap-6">
                <div className="grid grid-cols-[70px_repeat(4,max-content)] gap-3 text-body text-neutral-500">
                  <span />
                  <span>Primary</span>
                  <span>Secondary</span>
                  <span>Tertiary</span>
                  <span>Text</span>
                </div>
                <ButtonRow state="Default" />
                <ButtonRow state="Hover" forced="yes" />
                <ButtonRow state="Disabled" disabled />
              </div>
            </div>
            <div className="mt-8">
              <SpecList
                title="Button Specs"
                items={[
                  "Height: 44px (default)",
                  "Padding: 0 16px (lg), 0 12px (md)",
                  "Radius: 12px",
                  "Font: Inter Medium (14–16px)",
                ]}
              />
            </div>
          </Section>

        {/* 09 Badges + 10 Status + 11 Progress */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Section number="09" title="Badges / Tags">
            <div className="flex flex-wrap gap-8">
              {(["video", "lesson", "popular"] as const).map((variant) => (
                <div key={variant} className="flex flex-col gap-3">
                  <span className="text-body text-neutral-900 capitalize">
                    {variant}
                  </span>
                  <Badge variant={variant}>{variant}</Badge>
                </div>
              ))}
            </div>
          </Section>

          <Section number="10" title="Status / Indicators">
            <div className="flex flex-wrap items-center gap-6">
              <StatusIndicator status="in-progress" />
              <StatusIndicator status="completed" />
              <StatusIndicator status="now-playing" />
              <StatusIndicator status="locked" />
            </div>
          </Section>

          <Section number="11" title="Progress Bar">
            <ProgressBar percent={35} />
          </Section>
        </div>

        {/* 12 Cards */}
        <Section number="12" title="Cards">
          <div className="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <Label>Course Card</Label>
              <CourseCard
                initial="N"
                title="Next.js for Production"
                summary="Build scalable, high-performance web applications with Next.js."
                level="Intermediate"
                duration="18h 24m"
                moduleCount={12}
              />
            </div>
            <div>
              <Label>Lesson Card (Video)</Label>
              <LessonCard
                variant="video"
                title="Data Fetching in Server Components"
                description="Learn how to fetch data on the server using async/await and Next.js best practices."
                lessonLabel="Lesson 5.1"
                timestamp="12:45"
              />
            </div>
            <div>
              <Label>Lesson Card (Lesson)</Label>
              <LessonCard
                variant="lesson"
                title="Data Fetching & Caching"
                description="Explore different data fetching methods in Next.js and how to cache and revalidate data for optimal performance."
                moduleLabel="Module 5"
              />
            </div>
            <div>
              <Label>Resource Card</Label>
              <ResourceCard
                title="Caching and Revalidation Guide"
                description="Deep dive into Next.js caching strategies."
                meta="PDF · 1.2 MB"
              />
            </div>
          </div>
        </Section>

        {/* 13 Navigation */}
        <Section number="13" title="Navigation">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="flex flex-col gap-4">
              <Label>Header</Label>
              <div className="flex flex-wrap items-center gap-8">
                <span className="inline-flex items-center gap-2">
                  <LogoMark className="h-6 w-6" />
                  <span className="text-heading-3 font-bold text-neutral-900">
                    Vertex
                  </span>
                </span>
                <span className="text-body font-medium text-primary-500">
                  Courses
                </span>
                <span className="text-body font-medium text-neutral-700">
                  My Learning
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <Label>Breadcrumbs</Label>
              <Breadcrumbs
                items={[
                  { label: "All Courses", href: "/courses" },
                  { label: "Next.js for Production", href: "/courses/nextjs" },
                  { label: "Data Fetching & Caching" },
                ]}
              />
            </div>
            <div className="flex flex-col gap-4">
              <Label>Pagination</Label>
              <Pagination currentPage={1} totalPages={8} />
            </div>
          </div>
        </Section>

        {/* 14 Principles */}
        <Section number="14" title="Principles" className="mb-8">
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {principles.map(({ Icon, title, body }) => (
              <div key={title} className="flex items-start gap-4">
                <Icon
                  className="h-6 w-6 shrink-0 text-neutral-900"
                  strokeWidth={1.5}
                />
                <div>
                  <p className="text-body-lg font-semibold text-neutral-900">
                    {title}
                  </p>
                  <p className="mt-1 text-body text-neutral-500">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </main>
    </div>
  );
}
