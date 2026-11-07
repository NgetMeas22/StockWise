'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api-client';
import { useTranslation } from '../../i18n/i18n-context';
import { PublicCategoryDTO, PublicProductDTO } from '@stockwise/shared';
import {
  Search,
  ArrowRight,
  Layers,
  CheckCircle2,
  Shield,
  Box,
  Sparkles,
  QrCode,
  Activity,
  AlertTriangle,
  Calendar,
  Check,
  ChevronRight,
  TrendingDown,
  Building2,
  Clock,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function HomePage() {
  const router = useRouter();
  const { language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const { data: categoriesData } = useQuery({
    queryKey: ['public-categories'],
    queryFn: () => apiRequest<PublicCategoryDTO[]>('/public/categories'),
  });

  const { data: productsData } = useQuery({
    queryKey: ['public-featured-products'],
    queryFn: () => apiRequest<PublicProductDTO[]>('/public/products?pageSize=8'),
  });

  const categories = categoriesData?.data || [];
  const products = productsData?.data || [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/catalog');
    }
  };

  const clinicLogos = [
    'SEREN DENTAL',
    'dentaGROSS',
    'HOLIDENT CLINIC',
    'alpi diş',
    'denthill',
    'DentLeon',
    'DENTHOSPITAL',
  ];

  const workflowSteps = [
    {
      num: '01',
      title: language === 'kh' ? 'ប្រើប្រាស់សម្ភារ' : 'Use material',
      desc: language === 'kh' ? 'កត់ត្រាការប្រើប្រាស់ភ្លាមៗពេលកំពុងព្យាបាល' : 'Chair-side usage is logged while the work is fresh.',
    },
    {
      num: '02',
      title: language === 'kh' ? 'បច្ចុប្បន្នភាពស្តុក' : 'Stock updates',
      desc: language === 'kh' ? 'ចំនួន ទីតាំង និងកាលបរិច្ឆេទផុតកំណត់បង្ហាញជាក់ស្តែង' : 'Quantity, location, and expiry stay visible in real-time.',
    },
    {
      num: '03',
      title: language === 'kh' ? 'សញ្ញាបញ្ជាទិញឡើងវិញ' : 'Reorder signal',
      desc: language === 'kh' ? 'ការជូនដំណឹងស្តុកទាប និងហានិភ័យផុតកំណត់' : 'Low stock and expiry risks surface early before disruptions.',
    },
    {
      num: '04',
      title: language === 'kh' ? 'អនុម័តការបញ្ជាទិញ' : 'Approve order',
      desc: language === 'kh' ? 'ជ្រើសរើសអ្នកផ្គត់ផ្គង់ និងគ្រប់គ្រងការចំណាយ' : 'Supplier choice and purchase approvals stay controlled.',
    },
    {
      num: '05',
      title: language === 'kh' ? 'ទទួលទំនិញចូល' : 'Receive goods',
      desc: language === 'kh' ? 'ត្រួតពិនិត្យបាច់ទំនិញ និងប័ណ្ណដឹកជញ្ជូនរហ័ស' : 'Batch, lot, and delivery notes verified in seconds.',
    },
  ];

  const faqs = [
    {
      q: language === 'kh' ? 'តើប្រព័ន្ធកាត់ស្តុកស្វ័យប្រវត្តិតាមការព្យាបាលដំណើរការយ៉ាងដូចម្តេច?' : 'How does automatic treatment deduction work?',
      a: language === 'kh'
        ? 'អ្នកអាចភ្ជាប់សម្ភារប្រើប្រាស់ (ដូចជា Resins, Burs, Anesthetics) ទៅកាន់ប្រភេទនៃការព្យាបាល។ នៅពេលដែលវេជ្ជបណ្ឌិតបញ្ចប់ការព្យាបាល ប្រព័ន្ធនឹងកាត់ស្តុកចេញពីឃ្លាំងដោយស្វ័យប្រវត្តិ។'
        : 'You link clinical consumables to specific treatment procedures. When clinical staff mark an appointment or treatment plan as completed, those exact materials are deducted from inventory automatically.',
    },
    {
      q: language === 'kh' ? 'តើបុគ្គលិកតាមបន្ទប់ព្យាបាលស្នើសុំសម្ភារយ៉ាងដូចម្តេច?' : 'How do clinical staff request supplies from operatories?',
      a: language === 'kh'
        ? 'ជំនួយការពេទ្យអាចបើកផ្ទាំង Room Requests លើថេបប្លេត ឬទូរស័ព្ទដៃ រួចជ្រើសរើសសម្ភារ និងកម្រិតបន្ទាន់។ ឃ្លាំងកណ្តាលនឹងទទួលបានបញ្ជីស្នើសុំភ្លាមៗ។'
        : 'Staff in treatment rooms submit replenishment requests with urgency flags from any device. The inventory manager receives a live queue to fulfill and dispatch without clinic interruptions.',
    },
    {
      q: language === 'kh' ? 'តើខ្ញុំអាចចាប់ផ្តើមសាកល្បងដោយរបៀបណា?' : 'How can I get started with a free trial?',
      a: language === 'kh'
        ? 'អ្នកអាចចុចប៊ូតុង "Try the product" ឬ "Get Started" ដើម្បីសាកល្បងប្រើប្រាស់កញ្ចប់ Smart រយៈពេល ១៤ ថ្ងៃដោយមិនចាំបាច់បញ្ចូលកាតធនាគារឡើយ។'
        : 'Click "Try the product" or "Get Started" to start a full 14-day free trial with all Smart features enabled. No credit card details required.',
    },
  ];

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* 1. Hero Section - Exact Medicasimple Reference from Video */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-border/60">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6">
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>INVENTORY MANAGEMENT</span>
          </div>

          {/* Main Headline from Video */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-text leading-[1.15]">
            {language === 'kh' ? (
              <>កម្មវិធីគ្រប់គ្រងស្តុកសម្ភារពេទ្យធ្មេញ <br className="hidden sm:inline" />សម្រាប់គ្លីនិកដែលមិនអាចខ្វះសម្ភារពេលកំពុងព្យាបាល</>
            ) : (
              <>Dental inventory management software <br className="hidden sm:inline" />for clinics that cannot run out mid-treatment</>
            )}
          </h1>

          {/* Subtitle from Video */}
          <p className="max-w-3xl mx-auto text-sm sm:text-lg text-text-muted leading-relaxed">
            {language === 'kh'
              ? 'ប្រើប្រាស់ Khema Dental ជាប្រព័ន្ធគ្រប់គ្រងស្តុកពេទ្យធ្មេញ ដើម្បីតាមដានស្តុកពេលវេលាជាក់ស្តែង ស្កេនបាកូដ ស្នើសុំសម្ភារតាមបន្ទប់ គ្រប់គ្រងកាលបរិច្ឆេទផុតកំណត់ និងកាត់បន្ថយការចំណាយខ្ជះខ្ជាយ។'
              : 'Use Khema Dental as dental inventory management software to maintain real-time stock levels, barcode updates, room requests, expiry risk, and automatically linked material costs across your clinic.'}
          </p>

          {/* CTA Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/pricing">
              <Button size="lg" className="rounded-full px-7 py-3 text-xs sm:text-sm font-bold bg-accent text-white hover:bg-accent-hover shadow-md">
                <span>{language === 'kh' ? 'ចាប់ផ្តើមឥឡូវនេះ ↴' : 'Get Started ↴'}</span>
              </Button>
            </Link>

            <Link href="/features">
              <Button variant="outline" size="lg" className="rounded-full px-6 py-3 text-xs sm:text-sm font-semibold border-border bg-surface hover:bg-surface-muted text-text">
                <span>{language === 'kh' ? 'ស្វែងយល់ពីមុខងារ' : 'Explore Features'}</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>

          {/* Clinical Software Preview Card (Exact Dental Treatment Window from Video frame_001 / frame_003) */}
          <div className="mt-12 max-w-4xl mx-auto rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden text-left">
            {/* Window Header */}
            <div className="bg-surface-muted/80 px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-xs font-semibold text-text-muted ml-2">Khema Dental Clinical Workspace — Operatory 101</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent/10 text-accent border border-accent/20">
                Live Inventory Connected
              </span>
            </div>

            {/* Patient & Treatment Chart Header */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center text-sm">
                    GE
                  </div>
                  <div>
                    <div className="font-bold text-sm text-text flex items-center gap-2">
                      Grace Ellis
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-muted text-text-muted border border-border font-normal">♀ 34</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 font-bold">Epilepsy Alert</span>
                    </div>
                    <div className="text-[11px] text-text-muted">ID: #KH-98421 • Dr. Arjun Chakravarti</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-accent text-white font-semibold">Treatment Plans</span>
                  <span className="px-2.5 py-1 rounded-md bg-surface-muted text-text-muted font-medium hover:text-text">Dental Chart</span>
                  <span className="px-2.5 py-1 rounded-md bg-surface-muted text-text-muted font-medium hover:text-text">Material Usage</span>
                </div>
              </div>

              {/* Tooth Chart Representation */}
              <div className="bg-surface-muted/40 rounded-xl p-4 border border-border/80">
                <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Permanent Adult Teeth Chart</span>
                  <span className="text-accent font-semibold">Tooth #14 Composite Restoration Active</span>
                </div>
                <div className="grid grid-cols-16 gap-1 text-center py-2 border-y border-border/60">
                  {['UR8','UR7','UR6','UR5','UR4','UR3','UR2','UR1','UL1','UL2','UL3','UL4','UL5','UL6','UL7','UL8'].map((t, idx) => (
                    <div
                      key={t}
                      className={`p-1.5 rounded text-[10px] font-mono transition-colors ${
                        t === 'UL4'
                          ? 'bg-accent text-white font-bold shadow-xs scale-105'
                          : 'bg-surface border border-border text-text hover:border-accent'
                      }`}
                    >
                      🦷<br />{t}
                    </div>
                  ))}
                </div>

                {/* Auto-Deducted Materials Banner */}
                <div className="mt-4 p-3 rounded-lg bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <span className="font-bold text-text">Auto Inventory Deduction for Tooth #14:</span>
                      <span className="text-text-muted ml-1.5">Composite Capsule A2 (-1 EACH), Microbrush (-2 EACH), Etchant (-0.1 ML)</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] shrink-0">
                    Stock Deducted Automatically
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Client / Partner Dental Logos Bar (frame_006) */}
      <section className="max-w-6xl mx-auto px-4 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-6">
          {language === 'kh' ? 'គ្លីនិកធ្មេញ និងមន្ទីរពេទ្យឯកទេសដែលទុកចិត្ត' : 'Trusted by leading dental practices & multi-location clinics'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-70">
          {clinicLogos.map((logo, i) => (
            <span key={i} className="text-sm sm:text-base font-extrabold tracking-tight text-text-muted">
              {logo}
            </span>
          ))}
        </div>
      </section>

      {/* 3. 4 Interactive Feature Cards Grid (frame_006 from Video) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Barcode Scanning */}
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-subtle hover:border-accent/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-text">
              {language === 'kh' ? 'ស្កេនបាកូដរហ័ស' : 'Dental inventory software with barcode updates'}
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              {language === 'kh'
                ? 'ប្រើប្រាស់ទូរស័ព្ទដៃស្កេនបាកូដ ដើម្បីបន្ថែម ឬដកទំនិញចេញពីស្តុក កាត់បន្ថយការវាយបញ្ចូលដោយដៃ និងរក្សាកំណត់ត្រាឱ្យស្អាតជានិច្ច។'
                : 'Use mobile barcode scanning to quickly add or remove dental stock, reduce manual entry and keep clinic inventory records cleaner.'}
            </p>
          </div>

          {/* Card 2: Treatment Deduction */}
          <div className="p-6 rounded-2xl border border-accent/40 bg-accent/5 shadow-subtle transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-text">
              {language === 'kh' ? 'កាត់ស្តុកតាមការព្យាបាល' : 'Automatic Treatment Deduction'}
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              {language === 'kh'
                ? 'ភ្ជាប់សម្ភារទៅនឹងការព្យាបាល ដើម្បីឱ្យស្តុកកាត់ចេញពីឃ្លាំងធំដោយស្វ័យប្រវត្តិ នៅពេលដែលការងារព្យាបាលត្រូវបានបញ្ចប់។'
                : 'Link materials to treatments so dental inventory is deducted from the main depot automatically when clinical work is completed.'}
            </p>
          </div>

          {/* Card 3: Digital Room Requests */}
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-subtle hover:border-accent/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-text">
              {language === 'kh' ? 'សំណើសម្ភារតាមបន្ទប់' : 'Digital Room Requests'}
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              {language === 'kh'
                ? 'អនុញ្ញាតឱ្យបុគ្គលិកស្នើសុំសម្ភារពីបន្ទប់ព្យាបាលឌីជីថល ផ្តល់ឱ្យអ្នកគ្រប់គ្រងនូវជួរច្បាស់លាស់ក្នុងការរៀបចំបញ្ជូនសម្ភារ។'
                : 'Let clinical staff request stock from their rooms digitally, giving the stock manager a clearer queue for dental clinic inventory management.'}
            </p>
          </div>

          {/* Card 4: Catch Risk Early */}
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-subtle hover:border-accent/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-text">
              {language === 'kh' ? 'ទប់ស្កាត់ហានិភ័យមុន' : 'Catch Risk Early'}
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              {language === 'kh'
                ? 'កំណត់កម្រិតបរិមាណស្តុកសុវត្ថិភាព និងតាមដានកាលបរិច្ឆេទផុតកំណត់ ដើម្បីឱ្យប្រព័ន្ធព្រមានក្រុមការងារមុនពេលខ្វះខាតសម្ភារ។'
                : 'Set critical quantity limits and track expiry dates so your dental inventory software warns the team before shortages disrupt procedures.'}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Problem & Solution Editorial Section (frame_006 from Video) */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-4">
        <div className="text-[11px] font-bold text-accent uppercase tracking-widest">
          PROBLEM
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-text tracking-tight">
          {language === 'kh'
            ? 'ការដើររកសម្ភារតាមទូដាក់អីវ៉ាន់ គឺជាវិធីគ្រប់គ្រងគ្លីនិកដែលខាតបង់ថ្លៃបំផុត'
            : 'Searching in cupboards is an expensive way to run a clinic'}
        </h2>
        <p className="text-sm sm:text-base text-text-muted leading-relaxed max-w-2xl mx-auto">
          {language === 'kh'
            ? 'ការខាតបង់លាក់មុខធំបំផុតនៅក្នុងគ្លីនិក គឺសម្ភារដែលអ្នកគិតថាមាន តែការពិតអស់ស្តុក។ ការតាមដានដោយដៃ ឬផ្ញើសារ WhatsApp ធ្វើឱ្យការគ្រប់គ្រងស្តុកមានភាពច្របូកច្របល់ និងពិបាកសវនកម្ម។ Khema Dental ភ្ជាប់ការងារគ្លីនិកផ្ទាល់ទៅកាន់បញ្ជីស្តុកកណ្តាល។'
            : 'The biggest hidden cost in a clinic is materials you thought you had but actually ran out of. Manual tracking and disconnected WhatsApp messages make dental clinic inventory management reactive, expensive, and hard to audit. Khema Dental stops the guesswork by synchronizing daily operatory usage directly with your centralized stock ledger.'}
        </p>
      </section>

      {/* 5. Stock Control Rhythm 5-Step Process (frame_007 from Video) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="text-[11px] font-bold text-accent uppercase tracking-widest">
            STOCK CONTROL RHYTHM
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text">
            {language === 'kh' ? 'អ្វីដែលប្រព័ន្ធគ្រប់គ្រងស្តុកពេទ្យធ្មេញត្រូវមាន' : 'What dental inventory management software should cover'}
          </h2>
          <p className="text-xs sm:text-sm text-text-muted max-w-xl mx-auto">
            {language === 'kh'
              ? 'ស្រទាប់គ្រប់គ្រងស្តុកដែលភ្ជាប់ការប្រើប្រាស់គ្លីនិក កម្រិតបញ្ជាទិញ និងអ្នកផ្គត់ផ្គង់ ដោយមិនចាំបាច់ប្រើ Excel ស្មុគស្មាញ។'
              : 'A stock-control layer that connects clinical usage, reorder thresholds and supplier visibility without turning the team into spreadsheet owners.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {workflowSteps.map((step, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl border border-border bg-surface shadow-xs space-y-2 relative"
            >
              <span className="text-xs font-bold text-accent font-mono block">
                {step.num}
              </span>
              <h4 className="font-bold text-sm text-text">{step.title}</h4>
              <p className="text-xs text-text-muted leading-snug">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Full Traceability & Audit Section (frame_008 from Video) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-[11px] font-bold text-accent uppercase tracking-widest">
            03 FULL TRACEABILITY
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text">
            {language === 'kh' ? 'អ្នកណាស្នើសុំ អ្នកណាអនុម័ត ហើយទំនិញទៅដល់ណា?' : 'Who asked, who approved, where did it go?'}
          </h2>
          <p className="text-xs sm:text-sm text-text-muted max-w-xl mx-auto">
            {language === 'kh'
              ? 'តាមដានគ្រប់ចលនាស្តុកពេទ្យធ្មេញជាមួយកំណត់ហេតុសវនកម្មពេញលេញ ចាប់ពីបុគ្គលិកស្នើសុំ រហូតដល់អ្នកគ្រប់គ្រងបញ្ជូនទំនិញ។'
              : 'Track all dental inventory movements with a complete audit trail, from the requesting staff member to the delivering manager.'}
          </p>
        </div>

        {/* Live Requests & Traceability Table Mockup */}
        <div className="bg-surface rounded-2xl border border-border shadow-subtle overflow-hidden">
          <div className="p-4 bg-surface-muted/60 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-text">
              <Layers className="w-4 h-4 text-accent" />
              <span>Dental Operatory Replenishment Queue</span>
            </div>
            <Link href="/app/requests" className="text-xs font-semibold text-accent hover:underline flex items-center gap-1">
              <span>Open Requests Module</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted/40 text-text-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3">Location / Room</th>
                  <th className="px-4 py-3">Requested Item</th>
                  <th className="px-4 py-3">Requested By</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Audit Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 font-semibold text-text">Surgery Suite A</td>
                  <td className="px-4 py-3">Surgical Scalpel Blades #15 (2 BOX)</td>
                  <td className="px-4 py-3 text-text-muted">Dr. Sophea Chem</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Dispatched
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-text-muted font-mono text-[10px]">
                    Central Warehouse #1 • Logged
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-text">Room 102 — Ortho</td>
                  <td className="px-4 py-3">Sterile Gauze Sponges 4x4 (5 PACK)</td>
                  <td className="px-4 py-3 text-text-muted">Assistant Nary Voeun</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse">
                      Pending Dispatch
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-accent font-semibold text-[11px]">
                    <Link href="/app/requests">Ready to Fulfill →</Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 7. Catalog Quick Search Bar */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-4">
        <h3 className="text-xl font-bold text-text">
          {language === 'kh' ? 'ស្វែងរកទំនិញក្នុងកាតាឡុកគ្លីនិក' : 'Search Our Live Clinical Product Catalog'}
        </h3>
        <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto flex items-center shadow-md rounded-full overflow-hidden border border-border bg-surface">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-text-muted absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'kh' ? 'ស្វែងរកឈ្មោះទំនិញ កូដ SKU ឬម៉ាក...' : 'Search supplies, SKU codes, brands...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-transparent text-xs text-text placeholder:text-text-muted focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-accent text-white font-bold text-xs hover:bg-accent-hover transition-colors"
          >
            {language === 'kh' ? 'ស្វែងរក' : 'Search'}
          </button>
        </form>
      </section>

      {/* 8. FAQ & Final CTA Accordion */}
      <section className="max-w-4xl mx-auto px-4 space-y-6">
        <div className="text-center space-y-1">
          <h3 className="text-xl font-bold text-text">
            {language === 'kh' ? 'សំណួរដែលសួរញឹកញាប់' : 'Frequently Asked Questions'}
          </h3>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="rounded-xl border border-border bg-surface overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-text hover:bg-surface-muted/50"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-accent' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-text-muted leading-relaxed border-t border-border/40 pt-2">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Final CTA Banner */}
        <div className="mt-12 p-8 sm:p-12 rounded-3xl bg-slate-900 text-white text-center space-y-4 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-transparent pointer-events-none" />
          <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            {language === 'kh'
              ? 'ត្រៀមខ្លួនក្នុងការធ្វើទំនើបកម្មស្តុកគ្លីនិករបស់អ្នកហើយឬនៅ?'
              : 'Ready to modernize your dental practice inventory?'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            {language === 'kh'
              ? 'ចូលរួមជាមួយគ្លីនិកធ្មេញឈានមុខគេ ដើម្បីកាត់បន្ថយការខាតបង់សម្ភារ និងបង្កើនប្រសិទ្ធភាពព្យាបាល។'
              : 'Join leading dental clinics in keeping stock shortages, expired supplies, and cupboard guesswork out of patient appointments.'}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/pricing">
              <Button size="lg" className="rounded-full px-7 py-3 text-xs font-bold bg-accent text-white hover:bg-accent-hover shadow-md">
                <span>{language === 'kh' ? 'សាកល្បងឥតគិតថ្លៃ ១៤ ថ្ងៃ' : 'Start 14-Day Free Trial'}</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <Link href="/catalog">
              <Button variant="outline" size="lg" className="rounded-full px-6 py-3 text-xs font-semibold border-slate-700 bg-slate-800 text-white hover:bg-slate-700">
                <span>{language === 'kh' ? 'មើលកាតាឡុកសម្ភារ' : 'Browse Product Catalog'}</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
