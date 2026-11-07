'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Package,
  Activity,
  History,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useTranslation } from '../../../i18n/i18n-context';

export default function FeaturesPage() {
  const { language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'barcode' | 'procedure' | 'room' | 'expiry'>('barcode');

  const featureTabs = [
    {
      id: 'barcode' as const,
      icon: QrCode,
      title: language === 'kh' ? 'ស្កេនបាកូដរហ័ស' : 'Mobile Barcode Scanning',
      subtitle: language === 'kh' ? 'បញ្ចូល ឬដកទំនិញភ្លាមៗ' : 'Instant intake & dispatch on any mobile device',
    },
    {
      id: 'procedure' as const,
      icon: Activity,
      title: language === 'kh' ? 'កាត់ស្តុកតាមការព្យាបាល' : 'Procedure Material Deduction',
      subtitle: language === 'kh' ? 'កាត់ស្តុកស្វ័យប្រវត្តិតាមការងារ' : 'Automatically consume items when clinical treatments complete',
    },
    {
      id: 'room' as const,
      icon: Layers,
      title: language === 'kh' ? 'សំណើសម្ភារតាមបន្ទប់' : 'Room & Department Requests',
      subtitle: language === 'kh' ? 'ផ្ញើសំណើរសុំសម្ភារឌីជីថល' : 'Digital replenishment queue from dental operatories to central store',
    },
    {
      id: 'expiry' as const,
      icon: Calendar,
      title: language === 'kh' ? 'តាមដានកាលបរិច្ឆេទផុតកំណត់' : 'Batch & Expiry Risk Tracking',
      subtitle: language === 'kh' ? 'ការជូនដំណឹងហានិភ័យស្តុក' : 'FEFO stock rotation & safety threshold monitoring',
    },
  ];

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Hero Banner */}
      <section className="relative overflow-hidden pt-14 pb-16 px-4 sm:px-6 lg:px-8 border-b border-border/60">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'kh' ? 'មុខងារគ្រប់គ្រងស្តុកពេទ្យធ្មេញកម្រិតវិជ្ជាជីវៈ' : 'Clinical Inventory Architecture'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text">
            {language === 'kh'
              ? 'គ្រប់គ្រងស្តុកគ្លីនិកធ្មេញឆ្លាតវៃ ដោយគ្មានការរំខាន'
              : 'Complete Inventory Management for Modern Dental Practices'}
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-text-muted leading-relaxed">
            {language === 'kh'
              ? 'រចនាឡើងយ៉ាងពិសេសសម្រាប់គ្លីនិកធ្មេញ និងមន្ទីរពេទ្យឯកទេស៖ តាមដានសម្ភារប្រើប្រាស់ ស្កេនបាកូដ បញ្ជាទិញទំនិញ និងកាត់ស្តុកស្វ័យប្រវត្តិ។'
              : 'Engineered specifically for dental clinics and healthcare providers. Track clinical consumables, automate reorders, scan barcodes, and streamline room supply workflows.'}
          </p>

          <div className="pt-4 flex items-center justify-center gap-3">
            <Link href="/pricing">
              <Button size="lg" className="text-xs font-semibold px-6 py-2.5">
                <span>{language === 'kh' ? 'មើលតម្លៃសេវា' : 'View Pricing Plans'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-xs font-semibold px-6 py-2.5">
                <span>{language === 'kh' ? 'ចូលប្រើប្រព័ន្ធ' : 'Sign In to Portal'}</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Feature Deep Dive Tabs */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {featureTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                  isActive
                    ? 'border-accent bg-accent/5 ring-1 ring-accent'
                    : 'border-border bg-surface hover:border-text-muted/40'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`p-2 rounded-lg ${
                      isActive ? 'bg-accent text-white' : 'bg-surface-muted text-text-muted'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-text">{tab.title}</span>
                </div>
                <p className="text-xs text-text-muted leading-snug">{tab.subtitle}</p>
              </button>
            );
          })}
        </div>

        {/* Feature Showcase Card */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-10 shadow-subtle">
          {activeTab === 'barcode' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Real-time Barcode Scanning</span>
                </div>
                <h3 className="text-2xl font-bold text-text">
                  {language === 'kh'
                    ? 'ស្កេនបាកូដរហ័ស កាត់បន្ថយការវាយបញ្ចូលដោយដៃ'
                    : 'Effortless Barcode Updates on Mobile and Desktop'}
                </h3>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                  {language === 'kh'
                    ? 'ប្រើប្រាស់ទូរស័ព្ទដៃ ឬម៉ាស៊ីនស្កេនដើម្បីទទួលទំនិញចូលស្តុក ឬបញ្ចេញសម្ភារទៅបន្ទប់ព្យាបាលបានភ្លាមៗ។ ប្រព័ន្ធនឹងរកឃើញ SKU ដោយស្វ័យប្រវត្តិ។'
                    : 'Equip warehouse keepers and clinic assistants with mobile barcode scanning. Instantly verify incoming deliveries, match purchase orders, and record stock dispenses with zero manual typing.'}
                </p>
                <ul className="space-y-2 text-xs text-text-muted pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <span>Supports standard UPC, EAN, Code128, and custom clinic QR codes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <span>Instant acoustic confirmation and quantity incrementing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <span>Automatic safety threshold recalculation</span>
                  </li>
                </ul>
              </div>

              {/* Mockup Preview Box */}
              <div className="bg-surface-muted/60 border border-border rounded-xl p-6 shadow-inner space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <span className="text-xs font-bold text-text">Quick Scanner Simulation</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    Scanner Ready
                  </span>
                </div>
                <div className="p-4 rounded-lg bg-surface border border-border shadow-xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-text">N95 Particulate Respirator Mask</div>
                      <div className="text-[10px] font-mono text-text-muted">SKU: SKU-MASK-N95-PRO</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/40">
                    <div>
                      <span className="text-text-muted text-[10px] block">Current On Hand</span>
                      <strong className="text-text font-bold">18 PACK</strong>
                    </div>
                    <div>
                      <span className="text-text-muted text-[10px] block">Scanned Action</span>
                      <strong className="text-accent font-bold">+10 Goods Receipt</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'procedure' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Clinical Procedure Sync</span>
                </div>
                <h3 className="text-2xl font-bold text-text">
                  {language === 'kh'
                    ? 'កាត់ស្តុកសម្ភារស្វ័យប្រវត្តិតាមការព្យាបាលជាក់ស្តែង'
                    : 'Automated Material Consumption per Dental Treatment'}
                </h3>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                  {language === 'kh'
                    ? 'ភ្ជាប់សម្ភារប្រើប្រាស់ (ដូចជា ជែលស្ពឹក ម្ជុល សឺរ៉ាំង សារធាតុកំប៉ោសិត) ទៅកាន់ប្រភេទនៃការព្យាបាល។ នៅពេលវេជ្ជបណ្ឌិតបញ្ចប់ការព្យាបាល ស្តុកនឹងកាត់ចេញភ្លាមៗ។'
                    : 'Pre-configure material bundles for treatments such as Root Canal Therapy, Composite Fillings, or Implant Surgery. When clinical staff complete an appointment, stock balances adjust automatically.'}
                </p>
                <ul className="space-y-2 text-xs text-text-muted pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <span>Eliminates tedious manual inventory issue forms</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <span>Accurately calculates real material cost per patient treatment</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <span>Full audit trail linked to procedure reference ID</span>
                  </li>
                </ul>
              </div>

              <div className="bg-surface-muted/60 border border-border rounded-xl p-6 shadow-inner space-y-3">
                <div className="text-xs font-bold text-text mb-2">Procedure Deduction Preview</div>
                <div className="p-3 bg-surface rounded-lg border border-border space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-text">Composite Restoration #14</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold">Completed</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-text-muted border-t border-border/40 pt-2">
                    <div className="flex justify-between">
                      <span>• Dental Composite Capsule A2</span>
                      <span className="font-mono text-danger">-1 EACH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Bonding Agent Adhesive</span>
                      <span className="font-mono text-danger">-0.05 ML</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Micro-applicator Tip</span>
                      <span className="font-mono text-danger">-2 EACH</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'room' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Operatory Queue</span>
                </div>
                <h3 className="text-2xl font-bold text-text">
                  {language === 'kh'
                    ? 'ប្រព័ន្ធស្នើសុំសម្ភារតាមបន្ទប់ ដំណើរការដោយគ្មានការរំខាន'
                    : 'Digital Room Requests & Central Warehouse Dispatch'}
                </h3>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                  {language === 'kh'
                    ? 'ជំនួយការពេទ្យធ្មេញអាចផ្ញើសំណើរសុំសម្ភារពីបន្ទប់វះកាត់ ឬបន្ទប់ព្យាបាលដោយផ្ទាល់។ ឃ្លាំងកណ្តាលនឹងទទួលបានបញ្ជីស្នើសុំ និងរៀបចំបញ្ជូនបានទាន់ពេលវេលា។'
                    : 'Assistants in treatment operatories request supplies with urgency flags. The stock manager receives a clean real-time fulfillment queue, eliminating hallway interruptions.'}
                </p>
                <div className="pt-2">
                  <Link href="/app/requests">
                    <Button size="sm" className="text-xs font-semibold">
                      <span>{language === 'kh' ? 'ចូលទៅកាន់ផ្ទាំង Room Requests' : 'Explore Room Requests'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="bg-surface-muted/60 border border-border rounded-xl p-6 shadow-inner space-y-3">
                <div className="text-xs font-bold text-text mb-2">Live Room Request Queue</div>
                <div className="space-y-2">
                  <div className="p-3 bg-surface rounded-lg border border-border flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-text">Room 102 - Orthodontics</div>
                      <div className="text-[10px] text-text-muted">Sterile Gauze Sponges (5 PACK)</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      HIGH URGENCY
                    </span>
                  </div>
                  <div className="p-3 bg-surface rounded-lg border border-border flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-text">Operating Suite A</div>
                      <div className="text-[10px] text-text-muted">Surgical Scalpel Blades #15 (2 BOX)</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      URGENT
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'expiry' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Quality & Compliance</span>
                </div>
                <h3 className="text-2xl font-bold text-text">
                  {language === 'kh'
                    ? 'តាមដានកាលបរិច្ឆេទផុតកំណត់ & វិលជុំស្តុកឆ្លាតវៃ'
                    : 'First-Expired-First-Out (FEFO) Expiry Risk Control'}
                </h3>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                  {language === 'kh'
                    ? 'ការពារការហួសសុពលភាពនៃថ្នាំពេទ្យធ្មេញ និងសារធាតុគីមី។ ប្រព័ន្ធជូនដំណឹងជាមុន ៣០/៦០/៩០ ថ្ងៃ ដើម្បីជួយឱ្យគ្លីនិកប្រើប្រាស់សម្ភារមុនពេលផុតកំណត់។'
                    : 'Prevent expired clinical materials from compromising patient safety or clinic finances. Intelligent early-warning alerts trigger 30, 60, and 90 days before batch expiration.'}
                </p>
                <ul className="space-y-2 text-xs text-text-muted pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <span>Compliant with healthcare accreditation standards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <span>Lot number traceability in case of manufacturer recalls</span>
                  </li>
                </ul>
              </div>

              <div className="bg-surface-muted/60 border border-border rounded-xl p-6 shadow-inner space-y-3">
                <div className="text-xs font-bold text-text mb-2">Expiry Risk Heatmap</div>
                <div className="p-3 bg-surface rounded-lg border border-border space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-text">Articaine Anesthetic 4%</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                      Expires in 28 days
                    </span>
                  </div>
                  <div className="w-full bg-surface-muted h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-4/5 rounded-full" />
                  </div>
                  <div className="flex justify-between text-[10px] text-text-muted">
                    <span>Lot: #ART-2024-X9</span>
                    <span>Safety priority: Prioritize use</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

