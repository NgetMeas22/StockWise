'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
  QrCode,
  Layers,
  HelpCircle,
  PhoneCall,
  Zap,
  Clock,
  ChevronDown,
  X,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useTranslation } from '../../../i18n/i18n-context';
import { useTheme } from '../../../lib/theme-context';
import { useToast } from '../../../lib/toast-context';

export default function PricingPage() {
  const { t, language } = useTranslation();
  const { resolvedTheme } = useTheme();
  const toast = useToast();

  const [practitioners, setPractitioners] = useState<number>(3);
  const [isAnnual, setIsAnnual] = useState<boolean>(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactClinic, setContactClinic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pricing multiplier calculation
  const multiplier = Math.max(1, practitioners);
  const discountRate = isAnnual ? 0.8 : 1.0; // 20% discount on annual

  const plans = [
    {
      id: 'starter',
      name: language === 'kh' ? 'កញ្ចប់ដំបូង (Starter)' : 'Starter',
      description:
        language === 'kh'
          ? 'ស័ក្តិសមសម្រាប់គ្លីនិកឯករាជ្យ ឬឃ្លាំងស្តុកតែមួយ'
          : 'Essential inventory control for solo practitioners & small clinics',
      basePriceMonthly: 29,
      popular: false,
      features: [
        language === 'kh' ? '១ ទីតាំងឃ្លាំងកណ្តាល' : '1 Main warehouse / stockroom',
        language === 'kh' ? 'កាតាឡុកទំនិញ & កម្រិតស្តុកសុវត្ថិភាព' : 'Live catalog & safety reorder levels',
        language === 'kh' ? 'នាំចេញទិន្នន័យជា CSV/Excel' : 'CSV / Excel catalog exports',
        language === 'kh' ? 'ការជូនដំណឹងស្តុកទាប' : 'Basic low-stock visual alerts',
        language === 'kh' ? 'គាំទ្រភាសាខ្មែរ & អង់គ្លេស' : 'Bilingual Khmer & English UI',
      ],
      ctaText: language === 'kh' ? 'ចាប់ផ្តើមសាកល្បង' : 'Start Free Trial',
    },
    {
      id: 'simple',
      name: language === 'kh' ? 'កញ្ចប់សាមញ្ញ (Simple)' : 'Simple',
      description:
        language === 'kh'
          ? 'សម្រាប់គ្លីនិកកំពុងរីកចម្រើនដែលមានបន្ទប់ព្យាបាលច្រើន'
          : 'Enhanced stock tracking & purchasing for growing practices',
      basePriceMonthly: 59,
      popular: false,
      features: [
        language === 'kh' ? 'ដល់ ៣ ទីតាំងបន្ទប់ព្យាបាល' : 'Up to 3 Treatment rooms / locations',
        language === 'kh' ? 'ការបញ្ជាទិញ (Purchase Orders) & អ្នកផ្គត់ផ្គង់' : 'Purchase Orders & Supplier directory',
        language === 'kh' ? 'ប្រវត្តិចលនាស្តុក & សវនកម្មកែតម្រូវ' : 'Stock ledger & adjustment audits',
        language === 'kh' ? 'ការទទួលទំនិញចូល (Goods Receipts)' : 'Multi-line Goods Receipts',
        language === 'kh' ? 'ផ្ញើសេចក្តីជូនដំណឹងតាមអ៊ីមែល' : 'Email notification digests',
      ],
      ctaText: language === 'kh' ? 'ជ្រើសរើស Simple' : 'Choose Simple',
    },
    {
      id: 'smart',
      name: language === 'kh' ? 'កញ្ចប់ឆ្លាតវៃ (Smart)' : 'Smart',
      badge: language === 'kh' ? 'ពេញនិយមបំផុត' : 'Most Popular',
      description:
        language === 'kh'
          ? 'ប្រព័ន្ធគ្រប់គ្រងវេជ្ជសាស្ត្រពេញលេញ ស្កេនបាកូដ & ស្នើសុំសម្ភារតាមបន្ទប់'
          : 'Complete clinical inventory, barcode scanning & digital room requests',
      basePriceMonthly: 99,
      popular: true,
      features: [
        language === 'kh' ? 'ទីតាំងបន្ទប់ព្យាបាលមិនកំណត់' : 'Unlimited rooms & departments',
        language === 'kh' ? 'ស្កេនបាកូដតាមទូរស័ព្ទដៃ (Barcode Scanning)' : 'Mobile barcode scanning & quick intake',
        language === 'kh' ? 'កាត់ស្តុកស្វ័យប្រវត្តិតាមការព្យាបាល' : 'Treatment & procedure auto-deductions',
        language === 'kh' ? 'ប្រព័ន្ធស្នើសុំសម្ភារតាមបន្ទប់ (Room Requests)' : 'Live Room Requests replenishment queue',
        language === 'kh' ? 'តាមដានហានិភ័យកាលបរិច្ឆេទផុតកំណត់' : 'Batch expiry tracking & risk alerts',
        language === 'kh' ? 'របាយការណ៍វាយតម្លៃថ្លៃដើមស្តុក' : 'Advanced inventory valuation reports',
      ],
      ctaText: language === 'kh' ? 'ជ្រើសរើស Smart' : 'Choose Smart',
    },
    {
      id: 'superior',
      name: language === 'kh' ? 'កញ្ចប់កម្រិតខ្ពស់ (Superior)' : 'Superior',
      description:
        language === 'kh'
          ? 'សម្រាប់បណ្តាញគ្លីនិកធំៗ និងមន្ទីរពេទ្យឯកទេស'
          : 'Multi-location dental groups & hospital enterprise scale',
      basePriceMonthly: 199,
      popular: false,
      features: [
        language === 'kh' ? 'គ្រប់គ្រងសាខា & ផ្ទេរស្តុកអន្តរសាខា' : 'Multi-branch transfers & central warehouse',
        language === 'kh' ? 'កំណត់សិទ្ធិបុគ្គលិកល្អិតល្អន់ (RBAC Matrix)' : 'Custom RBAC permissions & role designer',
        language === 'kh' ? 'សវនកម្មសកម្មភាពតឹងរ៉ឹង (Immutable Audit Log)' : 'Tamper-evident audit trails with IP/UserAgent',
        language === 'kh' ? 'ភ្ជាប់ API & ប្រព័ន្ធគ្រប់គ្រងគ្លីនិកផ្សេងទៀត' : 'Custom REST API integrations & webhooks',
        language === 'kh' ? 'ការគាំទ្រពិសេស ២៤/៧ & អ្នកប្រឹក្សាផ្ទាល់' : 'Dedicated success architect & 24/7 SLA',
      ],
      ctaText: language === 'kh' ? 'ទាក់ទងផ្នែកលក់' : 'Talk to Sales',
    },
  ];

  const faqs = [
    {
      q: language === 'kh' ? 'តើខ្ញុំអាចផ្លាស់ប្តូរកញ្ចប់សេវាកម្មនៅពេលណាក៏បានដែរឬទេ?' : 'Can I upgrade or change my plan anytime?',
      a:
        language === 'kh'
          ? 'បាទ/ចាស! អ្នកអាចដំឡើង ឬប្តូរកញ្ចប់សេវាកម្មបានយ៉ាងងាយស្រួលពីផ្ទាំង Settings ដោយគិតគម្លាតថ្លៃតាមសមាមាត្រនៃថ្ងៃដែលនៅសល់។'
          : 'Yes. You can upgrade, downgrade, or adjust seats anytime directly from your settings. Prorated adjustments are applied automatically.',
    },
    {
      q: language === 'kh' ? 'តើការសាកល្បងឥតគិតថ្លៃ ១៤ ថ្ងៃដំណើរការយ៉ាងដូចម្តេច?' : 'How does the 14-day free trial work?',
      a:
        language === 'kh'
          ? 'អ្នកអាចចុះឈ្មោះសាកល្បងប្រើប្រាស់កញ្ចប់ Smart បានរយៈពេល ១៤ ថ្ងៃដោយមិនចាំបាច់បញ្ចូលកាតធនាគារឡើយ។'
          : 'You get full access to all Smart plan features for 14 days without entering credit card details. When ready, pick your preferred plan.',
    },
    {
      q: language === 'kh' ? 'តើប្រព័ន្ធស្កេនបាកូដ (Barcode) ដំណើរការលើទូរស័ព្ទដៃយ៉ាងដូចម្តេច?' : 'How does mobile barcode scanning work?',
      a:
        language === 'kh'
          ? 'អ្នកអាចប្រើកាមេរ៉ាទូរស័ព្ទដៃ ឬម៉ាស៊ីនស្កេនបាកូដ USB/Bluetooth ដើម្បីស្កេនកូដផលិតផល និងកត់ត្រាការនាំចូល ឬនាំចេញបានភ្លាមៗ។'
          : 'You can use any smartphone camera or standard USB/Bluetooth barcode scanner to scan products and instantly log stock movements.',
    },
    {
      q: language === 'kh' ? 'តើប្រព័ន្ធស្នើសុំសម្ភារតាមបន្ទប់ (Room Requests) ជួយគ្លីនិកដូចម្តេច?' : 'How do Room Requests streamline clinic workflow?',
      a:
        language === 'kh'
          ? 'បុគ្គលិកក្នុងបន្ទប់ព្យាបាលអាចផ្ញើសំណើរសុំសម្ភារ (ដូចជា ស្រោមដៃ សឺរ៉ាំង ថ្នាំស្ពឹក) តាមប្រព័ន្ធឌីជីថល ធ្វើឱ្យអ្នកគ្រប់គ្រងស្តុកអាចរៀបចំ និងដឹកជូនទាន់ពេលវេលា។'
          : 'Clinical staff in treatment rooms submit replenishment requests with urgency levels digitally. The inventory team gets a live queue to fulfill without clinic interruptions.',
    },
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowContactModal(false);
      toast.success(
        language === 'kh' ? 'បានផ្ញើសំណើរដោយជោគជ័យ' : 'Inquiry Submitted',
        language === 'kh' ? 'ក្រុមការងាររបស់យើងនឹងទាក់ទងទៅលោកអ្នកក្នុងពេលឆាប់ៗនេះ។' : 'Our clinical solutions team will contact you within 24 hours.'
      );
      setContactName('');
      setContactEmail('');
      setContactClinic('');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-accent selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-border/60">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'kh' ? 'តម្លៃសមរម្យ តម្លាភាព និងគ្មានការគិតថ្លៃលាក់កំបាំង' : 'Transparent Pricing for Modern Clinics'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text">
            {language === 'kh' ? 'ជ្រើសរើសកញ្ចប់ដែលសមស្របនឹងគ្លីនិករបស់អ្នក' : 'Simple, Scalable Plans for Your Practice'}
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-text-muted">
            {language === 'kh'
              ? 'គ្រប់គ្រងស្តុកសម្ភារពេទ្យធ្មេញ កត់ត្រាចលនាស្តុក ស្កេនបាកូដ និងកាត់បន្ថយការខ្ជះខ្ជាយសម្ភារប្រកបដោយប្រសិទ្ធភាពខ្ពស់។'
              : 'End-to-end dental clinic inventory management, digital room requests, barcode scanning, and multi-warehouse ledger control.'}
          </p>

          {/* Interactive Calculator Controls */}
          <div className="mt-8 max-w-xl mx-auto p-6 rounded-2xl border border-border bg-surface shadow-subtle space-y-6">
            {/* Practitioners / Chairs Slider */}
            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-accent" />
                  <span>{language === 'kh' ? 'ចំនួនគ្រូពេទ្យ / កៅអីព្យាបាល (Practitioners / Chairs)' : 'Practitioners / Active Chairs'}</span>
                </label>
                <span className="px-3 py-1 rounded-full bg-accent/10 text-accent font-extrabold text-sm tabular-nums">
                  {practitioners >= 10 ? '10+ Seats' : `${practitioners} Seat${practitioners > 1 ? 's' : ''}`}
                </span>
              </div>

              <input
                type="range"
                min={1}
                max={10}
                value={practitioners}
                onChange={(e) => setPractitioners(Number(e.target.value))}
                className="w-full h-2 bg-surface-muted rounded-lg appearance-none cursor-pointer accent-accent"
              />

              <div className="flex justify-between text-[11px] text-text-muted font-medium">
                <span>1 Solo</span>
                <span>3 Practice</span>
                <span>5 Clinic</span>
                <span>10+ Enterprise</span>
              </div>
            </div>

            {/* Monthly vs Annual Toggle */}
            <div className="pt-2 border-t border-border flex items-center justify-center gap-3">
              <span className={`text-xs font-semibold ${!isAnnual ? 'text-text' : 'text-text-muted'}`}>
                {language === 'kh' ? 'គិតថ្លៃប្រចាំខែ' : 'Billed Monthly'}
              </span>

              <button
                type="button"
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  isAnnual ? 'bg-accent' : 'bg-surface-muted border border-border'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAnnual ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>

              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold ${isAnnual ? 'text-text' : 'text-text-muted'}`}>
                  {language === 'kh' ? 'គិតថ្លៃប្រចាំឆ្នាំ' : 'Billed Annually'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {language === 'kh' ? 'សន្សំ ២០%' : 'Save 20%'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan) => {
            const calculatedPrice = Math.round(plan.basePriceMonthly * discountRate * (1 + (practitioners - 1) * 0.35));
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl flex flex-col justify-between p-6 transition-all duration-200 ${
                  plan.popular
                    ? 'bg-slate-900 text-white shadow-xl ring-2 ring-accent scale-[1.02] border-transparent'
                    : 'bg-surface border border-border shadow-subtle hover:border-accent/40'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-accent text-white text-[11px] font-bold uppercase tracking-wider shadow-sm">
                    {plan.badge || 'Most Popular'}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className={`text-lg font-bold ${plan.popular ? 'text-white' : 'text-text'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-xs mt-1 min-h-[32px] ${plan.popular ? 'text-slate-300' : 'text-text-muted'}`}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/40">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-extrabold tracking-tight ${plan.popular ? 'text-white' : 'text-text'}`}>
                        ${calculatedPrice}
                      </span>
                      <span className={`text-xs ${plan.popular ? 'text-slate-400' : 'text-text-muted'}`}>
                        / {language === 'kh' ? 'ខែ' : 'mo'}
                      </span>
                    </div>
                    <p className={`text-[11px] mt-0.5 ${plan.popular ? 'text-slate-400' : 'text-text-muted'}`}>
                      {isAnnual
                        ? language === 'kh'
                          ? `គិតថ្លៃប្រចាំឆ្នាំ ($${calculatedPrice * 12}/ឆ្នាំ)`
                          : `Billed annually ($${calculatedPrice * 12}/yr)`
                        : language === 'kh'
                        ? 'គិតថ្លៃប្រចាំខែ'
                        : 'Billed monthly'}
                    </p>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2.5 pt-4">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${plan.popular ? 'text-slate-400' : 'text-text-muted'}`}>
                      {language === 'kh' ? 'មុខងាររួមបញ្ចូល៖' : "What's Included:"}
                    </span>
                    <ul className="space-y-2 text-xs">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              plan.popular ? 'text-accent' : 'text-accent'
                            }`}
                          />
                          <span className={plan.popular ? 'text-slate-200' : 'text-text'}>
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  {plan.id === 'superior' ? (
                    <Button
                      onClick={() => setShowContactModal(true)}
                      variant={plan.popular ? 'primary' : 'outline'}
                      className="w-full text-xs font-semibold py-2.5"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{plan.ctaText}</span>
                    </Button>
                  ) : (
                    <Link href="/login" className="block w-full">
                      <Button
                        variant={plan.popular ? 'primary' : 'outline'}
                        className="w-full text-xs font-semibold py-2.5"
                      >
                        <span>{plan.ctaText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  )}
                  <p className={`text-[10px] text-center mt-2 ${plan.popular ? 'text-slate-400' : 'text-text-muted'}`}>
                    {language === 'kh' ? 'សាកល្បងឥតគិតថ្លៃ ១៤ ថ្ងៃ' : '14-day free trial • No card required'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-border/60">
        <div className="text-center space-y-2 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-muted text-text-muted text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5 text-accent" />
            <span>{language === 'kh' ? 'សំណួរដែលសួរញឹកញាប់' : 'Frequently Asked Questions'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text">
            {language === 'kh' ? 'មានចម្ងល់អំពីប្រព័ន្ធស្តុក?' : 'Everything You Need to Know'}
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-border bg-surface overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-sm text-text hover:bg-surface-muted/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-text-muted shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-accent' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-text-muted leading-relaxed border-t border-border/40">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Enterprise Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1 mb-5">
              <h3 className="text-lg font-bold text-text">
                {language === 'kh' ? 'ពិភាក្សាជាមួយក្រុមការងារគ្លីនិក' : "Let's Talk About Your Practice"}
              </h3>
              <p className="text-xs text-text-muted">
                {language === 'kh'
                  ? 'បំពេញព័ត៌មានខាងក្រោម ហើយក្រុមការងាររបស់យើងនឹងរៀបចំការបង្ហាញប្រព័ន្ធជូនលោកអ្នក។'
                  : 'Fill in your details below and our clinic solutions architect will reach out with a tailored consultation.'}
              </p>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text mb-1 block">
                  {language === 'kh' ? 'ឈ្មោះរបស់អ្នក *' : 'Your Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Sokha Meas"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full h-9 px-3 rounded-[6px] border border-border bg-surface text-text text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text mb-1 block">
                  {language === 'kh' ? 'អ៊ីមែលការងារ *' : 'Work Email *'}
                </label>
                <input
                  type="email"
                  required
                  placeholder="sokha@khemadental.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full h-9 px-3 rounded-[6px] border border-border bg-surface text-text text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text mb-1 block">
                  {language === 'kh' ? 'ឈ្មោះគ្លីនិក / មន្ទីរពេទ្យ *' : 'Clinic or Hospital Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Khema Dental Clinic"
                  value={contactClinic}
                  onChange={(e) => setContactClinic(e.target.value)}
                  className="w-full h-9 px-3 rounded-[6px] border border-border bg-surface text-text text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowContactModal(false)}
                  size="sm"
                >
                  {language === 'kh' ? 'បោះបង់' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isSubmitting}
                  loadingText={language === 'kh' ? 'កំពុងផ្ញើ...' : 'Submitting...'}
                >
                  {language === 'kh' ? 'ផ្ញើសំណើ' : 'Submit Inquiry'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

