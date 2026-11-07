'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '../../../i18n/i18n-context';
import { Button } from '../../../components/ui/Button';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HeartHandshake,
  Zap,
  Activity,
  Users,
  Award,
  CheckCircle2,
  Clock,
  Building2,
  Lock,
  Layers,
  TrendingUp,
  Stethoscope,
  Smile,
  QrCode,
} from 'lucide-react';

export default function AboutUsPage() {
  const { language } = useTranslation();

  const metrics = [
    {
      value: '450+',
      label: language === 'kh' ? 'គ្លីនិកធ្មេញដៃគូ' : 'Partner Dental Clinics',
      desc: language === 'kh' ? 'គ្លីនិកឯកទេស និងមន្ទីរពេទ្យធ្មេញទូទាំងតំបន់' : 'Private practices and multi-chair surgical hospitals',
    },
    {
      value: '99.8%',
      label: language === 'kh' ? 'ភាពអាចរកបាននៃសម្ភារ' : 'Procedure Material Uptime',
      desc: language === 'kh' ? 'កាត់បន្ថយការខ្វះសម្ភារពេលកំពុងព្យាបាល' : 'Zero chair-side disruptions or mid-treatment stockouts',
    },
    {
      value: '42%',
      label: language === 'kh' ? 'កាត់បន្ថយការខាតបង់' : 'Reduction in Expired Waste',
      desc: language === 'kh' ? 'តាមរយៈប្រព័ន្ធ FEFO និងការព្រមានមុន' : 'Achieved with automated FEFO tracking and risk alerts',
    },
    {
      value: '1.2M+',
      label: language === 'kh' ? 'ការកាត់ស្តុកតាមធ្មេញ' : 'Procedure Deductions',
      desc: language === 'kh' ? 'ភ្ជាប់ជាមួយតារាងធ្មេញ ៣២ គ្រាប់' : 'Synchronized accurately across adult odontograms',
    },
  ];

  const principles = [
    {
      icon: Zap,
      title: language === 'kh' ? 'ភាពសាមញ្ញជាចម្បង' : 'Simplicity by Design',
      desc: language === 'kh'
        ? 'បច្ចេកវិទ្យាត្រូវតែមានអារម្មណ៍ងាយស្រួល និងរលូននៅក្បែរកៅអីព្យាបាល។ ប្រសិនបើមុខងារណាមួយបន្ថែមការពិបាកដល់ជំនួយការពេទ្យ យើងនឹងរៀបចំឡើងវិញ។'
        : 'Technology should feel seamless chair-side. If a workflow adds cognitive load or friction to a clinical assistant, we redesign it until it feels effortless.',
    },
    {
      icon: HeartHandshake,
      title: language === 'kh' ? 'ការយល់ចិត្តពីដំណើរការគ្លីនិក' : 'Clinical Empathy',
      desc: language === 'kh'
        ? 'រាល់ការអភិវឌ្ឍចាប់ផ្តើមពីសំណួរមួយថា៖ "តើការផ្លាស់ប្តូរនេះមានន័យយ៉ាងណាចំពោះទន្តបណ្ឌិត ជំនួយការ និងអ្នកជំងឺនៅលើកៅអី?"'
        : 'Every engineering release begins with the same question: "What will this change mean for the dentist, the operatory assistant, and the patient in the chair?"',
    },
    {
      icon: ShieldCheck,
      title: language === 'kh' ? 'ភាពច្បាស់លាស់ និងសវនកម្មពេញលេញ' : 'Radical Traceability',
      desc: language === 'kh'
        ? 'ចាប់ពីបាច់ផលិត កាលបរិច្ឆេទផុតកំណត់ រហូតដល់លេខធ្មេញជាក់លាក់ រាល់សម្ភារទាំងអស់ត្រូវបានកត់ត្រាច្បាស់លាស់ និងអាចផ្ទៀងផ្ទាត់បាន។'
        : 'From manufacturer lot and expiry date down to the specific tooth number treated, every milliliter of clinical consumable is tracked and auditable.',
    },
    {
      icon: Users,
      title: language === 'kh' ? 'សហការផ្ទាល់ក្នុងបន្ទប់ព្យាបាល' : 'Operatory Co-Development',
      desc: language === 'kh'
        ? 'យើងមិនបង្កើតកម្មវិធីនៅក្នុងការិយាល័យដាច់ដោយឡែកនោះទេ។ រាល់មុខងារត្រូវបានសាកល្បង និងកែលម្អផ្ទាល់ជាមួយគ្លីនិកដៃគូ។'
        : 'We never build software in isolation. Every module is battle-tested in real dental operatory environments alongside practicing clinicians.',
    },
  ];

  const milestones = [
    {
      year: '2021',
      title: language === 'kh' ? 'ការចាប់ផ្តើមដំបូង' : 'The Operatory Spark',
      desc: language === 'kh'
        ? 'បង្កើតឡើងដោយទន្តបណ្ឌិត និងវិស្វករប្រព័ន្ធ ដើម្បីលុបបំបាត់ភាពច្របូកច្របល់នៃការដើររកសម្ភារតាមទូ។'
        : 'Founded by practicing dental clinicians and health-tech engineers to eliminate cupboard guesswork and manual spreadsheets.',
    },
    {
      year: '2022',
      title: language === 'kh' ? 'តារាងធ្មេញកាត់ស្តុកស្វ័យប្រវត្ត' : 'Chair-Side FDI Odontogram',
      desc: language === 'kh'
        ? 'បង្កើតប្រព័ន្ធភ្ជាប់សម្ភារទៅនឹងធ្មេញទាំង ៣២ (FDI 11–48) សម្រាប់ការកាត់ស្តុកដោយស្វ័យប្រវត្តិ។'
        : 'Launched real-time procedural consumption mapping, tying composite, endo, and surgical kits directly to tooth charts.',
    },
    {
      year: '2023',
      title: language === 'kh' ? 'ការទទួលស្គាល់ និងការពង្រីក' : 'Fast Company Recognition',
      desc: language === 'kh'
        ? 'ត្រូវបានជ្រើសរើសជាកំពូលស្តាតអាប់បច្ចេកវិទ្យាសុខាភិបាល និងពង្រីកទៅកាន់គ្លីនិកជាង ១៥០។'
        : 'Selected among top healthcare innovators and scaled to over 150 high-volume dental centers and hospital departments.',
    },
    {
      year: '2024',
      title: language === 'kh' ? 'សំណើសម្ភារឌីជីថល' : 'Digital Operatory Requests',
      desc: language === 'kh'
        ? 'ដាក់ឱ្យប្រើប្រាស់ប្រព័ន្ធស្នើសុំសម្ភារតាមបន្ទប់ និងការស្កេនបាកូដរហ័សតាមទូរស័ព្ទ។'
        : 'Introduced instant operatory replenishment queues and mobile barcode dispatch for seamless chair-to-depot coordination.',
    },
    {
      year: '2025–2026',
      title: language === 'kh' ? 'ប្រព័ន្ធ Enterprise ទំនើប' : 'Enterprise Multi-Location Cloud',
      desc: language === 'kh'
        ? 'ពង្រីកទៅជាប្រព័ន្ធគ្រប់គ្រងស្តុកពេញលេញ ជាមួយការបញ្ជាទិញដោយស្វ័យប្រវត្ត និងការវិភាគកម្រិតខ្ពស់។'
        : 'Empowering multi-location dental chains with multi-warehouse consolidation, automated purchase approvals, and predictive restocking.',
    },
  ];

  const teamMembers = [
    {
      name: 'Dr. Sokha Chen, DDS, MSc',
      role: language === 'kh' ? 'សហស្ថាបនិក & ប្រធានផ្នែកទន្តសាស្ត្រ' : 'Co-Founder & Chief Dental Officer',
      bio: language === 'kh'
        ? 'ទន្តបណ្ឌិតឯកទេសផ្នែក Restorative Dentistry ជាង ១៥ ឆ្នាំ និងជាអ្នកត្រួសត្រាយផ្លូវផ្នែក Clinical Informatics។'
        : 'Practicing restorative dental surgeon with 15+ years experience and pioneer in dental informatics workflow optimization.',
      initials: 'SC',
    },
    {
      name: 'Marcus Thorne',
      role: language === 'kh' ? 'សហស្ថាបនិក & ស្ថាបត្យករប្រព័ន្ធ' : 'Co-Founder & Head of Systems Architecture',
      bio: language === 'kh'
        ? 'អតីតប្រធានវិស្វកម្មប្រព័ន្ធ HealthTech ដែលមានបទពិសោធន៍ក្នុងការកសាងប្រព័ន្ធទិន្នន័យ PostgreSQL ដែលមានសុវត្ថិភាពខ្ពស់។'
        : 'Former lead healthcare infrastructure engineer specializing in high-throughput PostgreSQL distributed systems and HIPAA data security.',
      initials: 'MT',
    },
    {
      name: 'Dr. Arjun Chakravarti, BDS, MDS',
      role: language === 'kh' ? 'នាយកទីប្រឹក្សាគ្លីនិក & វះកាត់មាត់' : 'Director of Clinical Advisory & Oral Surgery',
      bio: language === 'kh'
        ? 'ឯកទេសវះកាត់មាត់ និងដាក់ធ្មេញសិប្បនិម្មិត ដឹកនាំការរៀបចំគំរូសម្ភារវះកាត់សម្រាប់បន្ទប់ព្យាបាល។'
        : 'Maxillofacial specialist directing surgical kit standardization and chair-side procedural bill of materials (BOM).',
      initials: 'AC',
    },
    {
      name: 'Elena Vance',
      role: language === 'kh' ? 'ប្រធានផ្នែករចនាបទ & បទពិសោធន៍អ្នកប្រើ' : 'VP of Product & Clinical UX',
      bio: language === 'kh'
        ? 'អ្នកជំនាញផ្នែករចនា UI/UX ផ្នែកវេជ្ជសាស្ត្រ ដែលផ្តោតលើការកាត់បន្ថយភាពនឿយហត់របស់បុគ្គលិកគ្លីនិក។'
        : 'Award-winning health-tech designer dedicated to eliminating cognitive clutter and creating calm, high-efficiency interfaces.',
      initials: 'EV',
    },
  ];

  return (
    <div className="flex flex-col gap-24 pb-24 text-text selection:bg-accent selection:text-white">
      {/* 1. Hero Section - Medicasimple Style Editorial & Calm Narrative */}
      <section className="relative overflow-hidden pt-14 pb-20 px-4 sm:px-6 lg:px-8 border-b border-border/60">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'kh' ? 'បេសកកម្ម & ទស្សនវិស័យ' : 'OUR MISSION & PHILOSOPHY'}</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-text leading-[1.18]">
            {language === 'kh' ? (
              <>នាំមកនូវភាពស្ងប់ស្ងាត់ និងភាពច្បាស់លាស់ <br className="hidden sm:inline" />ដល់ដំណើរការគ្លីនិកធ្មេញទំនើប</>
            ) : (
              <>Bringing calm and clarity <br className="hidden sm:inline" />to modern dental practice operations</>
            )}
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-sm sm:text-lg text-text-muted leading-relaxed">
            {language === 'kh'
              ? 'យើងជឿជាក់ថារាល់ពេលដែលត្រូវដើររកសម្ភារតាមទូ ការទស្សន៍ទាយស្តុក ឬការខ្វះសម្ភារពេលកំពុងព្យាបាល ធ្វើឱ្យបាត់បង់ការយកចិត្តទុកដាក់ចំពោះអ្នកជំងឺ។ Dental Systems ភ្ជាប់ការងារគ្លីនិកផ្ទាល់ និងការគ្រប់គ្រងស្តុកឱ្យក្លាយជាចង្វាក់តែមួយ។'
              : 'We believe every moment spent searching through cupboards, guessing stock quantities, or facing mid-treatment shortages takes away from what matters most: exceptional patient care. Dental Systems unifies chair-side dentistry and clinical supply operations into one seamless rhythm.'}
          </p>

          {/* CTA Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/pricing">
              <Button size="lg" className="rounded-full px-7 py-3 text-xs sm:text-sm font-bold bg-accent text-white hover:bg-accent-hover shadow-md">
                <span>{language === 'kh' ? 'ចាប់ផ្តើមសាកល្បងឥតគិតថ្លៃ' : 'Start 14-Day Free Trial'}</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <Link href="/features">
              <Button variant="outline" size="lg" className="rounded-full px-6 py-3 text-xs sm:text-sm font-semibold border-border bg-surface hover:bg-surface-muted text-text">
                <span>{language === 'kh' ? 'ស្វែងយល់ពីមុខងារ' : 'Explore Platform Features'}</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Impact by the Numbers Counter Bar */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-border bg-surface shadow-xs space-y-2 text-center sm:text-left transition-all hover:border-accent/40 hover:shadow-subtle"
            >
              <div className="text-3xl sm:text-4xl font-extrabold text-accent font-mono tracking-tight">
                {m.value}
              </div>
              <div className="text-sm font-bold text-text">{m.label}</div>
              <p className="text-xs text-text-muted leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. The Founding Story: "Searching in cupboards..." */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-surface border border-border shadow-sm space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent">
            <Stethoscope className="w-4 h-4" />
            <span>{language === 'kh' ? 'រឿងរ៉ាវនៃការចាប់ផ្តើម' : 'WHY WE BUILT DENTAL SYSTEMS'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight leading-snug">
            {language === 'kh'
              ? 'វាបានចាប់ផ្តើមពីភាពច្របូកច្របល់ជាក់ស្តែងនៅក្បែរកៅអីព្យាបាលធ្មេញ'
              : 'It started with the quiet chaos beside the dental chair'}
          </h2>

          <div className="space-y-4 text-xs sm:text-sm text-text-muted leading-relaxed">
            <p>
              {language === 'kh'
                ? 'ក្នុងនាមជាទន្តបណ្ឌិត និងវិស្វករបច្ចេកវិទ្យា យើងបានឃើញផ្ទាល់នូវរបៀបដែលគ្លីនិកទូទៅដំណើរការ៖ សៀវភៅបញ្ជី Excel ដាច់ដោយឡែក សារ WhatsApp ដែលបាត់បង់ និងការរត់រកសម្ភារជាបន្ទាន់នៅពេលដែលជំនួយការដឹងថាកូនថតជ័រ A2 ចុងក្រោយត្រូវបានប្រើប្រាស់កាលពីមួយម៉ោងមុន។'
                : 'As practicing clinicians and software engineers, we saw firsthand how traditional dental practices struggled: disconnected spreadsheets, post-it notes stuck on cabinetry, and the frantic scramble when an assistant realized the last A2 composite capsule was used up an hour earlier.'}
            </p>
            <p>
              {language === 'kh'
                ? 'យើងបានបង្កើត Dental Systems ដើម្បីនាំមកនូវភាពទុកចិត្ត និងភាពច្បាស់លាស់។ នៅពេលដែលទន្តបណ្ឌិតបញ្ចប់ការព្យាបាលលើធ្មេញលេខ #14 សម្ភារទាំងអស់ត្រូវបានកាត់ចេញពីឃ្លាំងដោយស្វ័យប្រវត្តិ។ ជំនួយការអាចស្នើសុំសម្ភារដោយមិនបាច់ចាកចេញពីបន្ទប់ ហើយអ្នកគ្រប់គ្រងដឹងច្បាស់ពីពេលដែលត្រូវបញ្ជាទិញឡើងវិញ។'
                : 'We set out to engineer a platform grounded in true clinical empathy. When a dentist completes a restoration on tooth #14, the resin capsule, microbrush, and etchant are deducted in real-time. Operatory staff submit replenishment requests without leaving the patient, and inventory managers receive automated reorder triggers well before stock reaches critical levels.'}
            </p>
          </div>
        </div>
      </section>

      {/* 4. The 4 Core Principles (Medicasimple Design Standard) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-accent">
            {language === 'kh' ? 'គោលការណ៍ផលិតផល' : 'PRODUCT PRINCIPLES'}
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-text tracking-tight">
            {language === 'kh' ? 'របៀបដែលយើងបង្កើត Dental Systems' : 'How we think, design, and build'}
          </h2>
          <p className="text-xs sm:text-sm text-text-muted max-w-xl mx-auto">
            {language === 'kh'
              ? 'គោលការណ៍ដែលដឹកនាំរាល់បន្ទាត់កូដ និងការរចនាចំណុចប្រទាក់នីមួយៗរបស់យើង។'
              : 'The four non-negotiable standards behind every screen, workflow, and line of code.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {principles.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={i}
                className="p-7 rounded-2xl border border-border bg-surface shadow-xs space-y-3.5 hover:border-accent/40 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-text">{p.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Company Journey Timeline */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-accent">
            {language === 'kh' ? 'ដំណើរការរីកចម្រើន' : 'OUR JOURNEY'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
            {language === 'kh' ? 'ពីគំនិតក្នុងបន្ទប់ព្យាបាល ដល់ប្រព័ន្ធកម្រិត Enterprise' : 'From operatory insight to enterprise clinical cloud'}
          </h2>
        </div>

        <div className="space-y-4 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-border/60">
          {milestones.map((m, idx) => (
            <div key={idx} className="relative flex items-start gap-5 pl-1.5 group">
              <div className="w-8 h-8 rounded-full bg-surface border-2 border-accent flex items-center justify-center text-xs font-bold text-accent shadow-xs shrink-0 z-10 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1 p-5 rounded-xl border border-border bg-surface shadow-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold font-mono text-accent">{m.year}</span>
                  <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Milestone</span>
                </div>
                <h4 className="text-sm font-bold text-text">{m.title}</h4>
                <p className="text-xs text-text-muted leading-relaxed">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Clinical Advisory & Leadership Team */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-accent">
            {language === 'kh' ? 'ក្រុមការងារ & ទីប្រឹក្សា' : 'THE PEOPLE BEHIND THE PLATFORM'}
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-text tracking-tight">
            {language === 'kh' ? 'បង្កើតឡើងដោយអ្នកជំនាញទន្តសាស្ត្រ និងបច្ចេកវិទ្យា' : 'Built by dental practitioners and systems engineers'}
          </h2>
          <p className="text-xs sm:text-sm text-text-muted max-w-xl mx-auto">
            {language === 'kh'
              ? 'ការរួមបញ្ចូលគ្នារវាងបទពិសោធន៍ព្យាបាលជាក់ស្តែង និងវិស្វកម្មទិន្នន័យដែលមានស្តង់ដារខ្ពស់។'
              : 'Uniting senior clinicians, clinical informaticians, and software architects dedicated to practice excellence.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers.map((member, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-border bg-surface shadow-xs flex flex-col justify-between space-y-4 hover:border-accent/40 transition-colors"
            >
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-accent/20 to-accent/5 border border-accent/20 text-accent font-extrabold text-lg flex items-center justify-center shadow-2xs">
                  {member.initials}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-text">{member.name}</h4>
                  <div className="text-[11px] font-semibold text-accent mt-0.5">{member.role}</div>
                </div>
                <p className="text-xs text-text-muted leading-relaxed pt-1 border-t border-border/40">
                  {member.bio}
                </p>
              </div>
              <div className="text-[10px] text-text-muted/80 font-mono">Dental Systems Core Team</div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Enterprise Security & Compliance Badges */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white shadow-xl space-y-6 text-center sm:text-left relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/15 via-transparent to-transparent pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent">ENTERPRISE COMPLIANCE</span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">Bank-Grade Security & Clinical Confidentiality</h3>
              <p className="text-xs text-slate-300 max-w-xl">
                Patient records and clinic inventory data are protected under international health-data security standards.
              </p>
            </div>
            <div className="flex items-center justify-center sm:justify-end gap-3 shrink-0">
              <div className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-2 text-xs font-bold text-slate-200">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>ISO 27001</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-2 text-xs font-bold text-slate-200">
                <ShieldCheck className="w-4 h-4 text-accent" />
                <span>HIPAA Ready</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
            <div>✓ 256-Bit TLS & At-Rest Encryption</div>
            <div>✓ Immutable Audit Log Ledger</div>
            <div>✓ Role-Based Access Controls (RBAC)</div>
            <div>✓ 99.95% High-Availability SLA</div>
          </div>
        </div>
      </section>

      {/* 8. Final Call to Action */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
        <h2 className="text-2xl sm:text-4xl font-extrabold text-text tracking-tight">
          {language === 'kh'
            ? 'ត្រៀមខ្លួនក្នុងការធ្វើទំនើបកម្មគ្លីនិកធ្មេញរបស់អ្នកហើយឬនៅ?'
            : 'Ready to bring calm and clarity to your dental practice?'}
        </h2>
        <p className="text-xs sm:text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
          {language === 'kh'
            ? 'ចូលរួមជាមួយគ្លីនិកធ្មេញឈានមុខគេ និងចាប់ផ្តើមសាកល្បងឥតគិតថ្លៃ ១៤ ថ្ងៃដោយមិនចាំបាច់បញ្ចូលកាតធនាគារឡើយ។'
            : 'Join hundreds of forward-thinking dental practices eliminating stockouts, reducing waste, and modernizing patient workflows.'}
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link href="/pricing">
            <Button size="lg" className="rounded-full px-8 py-3 text-xs font-bold bg-accent text-white hover:bg-accent-hover shadow-md">
              <span>{language === 'kh' ? 'សាកល្បងឥតគិតថ្លៃ ១៤ ថ្ងៃ' : 'Start 14-Day Free Trial'}</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
          <Link href="/catalog">
            <Button variant="outline" size="lg" className="rounded-full px-6 py-3 text-xs font-semibold border-border bg-surface hover:bg-surface-muted text-text">
              <span>{language === 'kh' ? 'មើលកាតាឡុកសម្ភារ' : 'Browse Product Catalog'}</span>
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

