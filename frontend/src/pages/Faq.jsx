import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Truck, 
  ShieldCheck, 
  FileText, 
  Sparkles, 
  MessageSquare, 
  Mail, 
  Phone, 
  Package, 
  RotateCcw, 
  CheckCircle2, 
  ArrowRight,
  X
} from 'lucide-react';
import SEO from '../components/SEO';
import './PolicyPages.css';
import './Faq.css';

const FAQ_DATA = [
  {
    id: 1,
    category: 'products',
    categoryName: 'Products & Ingredients',
    question: 'Are LeafOra products 100% natural, vegan, and cruelty-free?',
    answer: 'Yes, absolutely! Every LeafOra formulation is rooted in organic bio-botanical extracts, cold-pressed plant oils, and bioactive phytonutrients. We never test on animals and our formulations are completely free of harsh chemicals, synthetic parabens, sulphates (SLS/SLES), mineral oils, phthalates, and artificial colorants.'
  },
  {
    id: 2,
    category: 'safety',
    categoryName: 'Safety & Routine',
    question: 'Are LeafOra formulations suitable for sensitive or acne-prone skin?',
    answer: 'Yes. All our products—including our Salicylic Acid Face Wash, Niacinamide 10% Face Brightening Serum, and SPF 50 PA++++ Sunscreen—are dermatologically tested, non-comedogenic, and pH-balanced to respect the delicate skin barrier. If you have extremely reactive or allergy-prone skin, we recommend conducting a 24-hour patch test before full facial application.'
  },
  {
    id: 3,
    category: 'orders',
    categoryName: 'Orders & Shipping',
    question: 'What are the shipping charges and estimated delivery timelines?',
    answer: 'We provide Free Express Shipping across India on all orders above ₹999. For orders under ₹999, a nominal standard flat shipping fee applies. Orders are packed and dispatched within 24-48 hours. Metro city deliveries usually arrive within 2-4 business days, while other regions receive delivery within 4-6 business days.'
  },
  {
    id: 4,
    category: 'orders',
    categoryName: 'Orders & Shipping',
    question: 'How do I track my order once it has been dispatched?',
    answer: 'As soon as your package ships, you will receive an automated SMS and email containing your Shiprocket Tracking ID and live tracking link. You can also view real-time delivery status anytime by signing in to your LeafOra Account Dashboard under the "Orders" tab.'
  },
  {
    id: 5,
    category: 'returns',
    categoryName: 'Returns & Refunds',
    question: 'What is LeafOra\'s 30-Day Return & Money-Back Refund Policy?',
    answer: 'We stand behind the quality of our formulations with a hassle-free 30-day money-back guarantee. If you received a damaged, leaking, or incorrect product, or experienced unexpected skin irritation, please reach out to support@leaforalifescience.com within 30 days of delivery with your order ID. After quick verification, refunds are credited back to your original payment method in 5-7 business days.'
  },
  {
    id: 6,
    category: 'safety',
    categoryName: 'Safety & Routine',
    question: 'In what sequence should I use the 3-step routine (Wash, Serum, Sunscreen)?',
    answer: 'Follow the dermatologist-approved sequence (lightest to heaviest consistency):\n• Step 1 (Cleanse): Wash face with Salicylic Acid Face Wash using gentle circular motions to remove dirt and excess oil without stripping moisture.\n• Step 2 (Treat): Apply 3-4 drops of Niacinamide 10% Serum and pat gently into skin until fully absorbed to reduce dark spots and even tone.\n• Step 3 (Protect): Finish with SPF 50 PA++++ Ultra-Light Gel Sunscreen 15 minutes before sun exposure to shield skin from UVA & UVB damage.'
  },
  {
    id: 7,
    category: 'orders',
    categoryName: 'Orders & Shipping',
    question: 'What payment methods do you accept?',
    answer: 'We support all major secure payment options through our encrypted Razorpay gateway: UPI (Google Pay, PhonePe, Paytm, BHIM), Credit & Debit Cards (Visa, Mastercard, RuPay), Net Banking (across 50+ banks), and Cash on Delivery (COD) across eligible pin codes.'
  },
  {
    id: 8,
    category: 'orders',
    categoryName: 'Orders & Shipping',
    question: 'Can I cancel or modify my delivery address after placing an order?',
    answer: 'If you need to update your address or cancel an order, please message us immediately within 2 hours of placing the order via WhatsApp or email at support@leaforalifescience.com. Once an order is assigned an AWB tracking number and picked up by our courier partner, it cannot be modified while in transit.'
  },
  {
    id: 9,
    category: 'products',
    categoryName: 'Products & Ingredients',
    question: 'What is the shelf life of LeafOra skincare products?',
    answer: 'All unopened LeafOra products have a shelf life of 24 months from the manufacturing date printed on the packaging carton. Once opened, we advise using the product within 6 to 12 months for peak botanical potency and freshness.'
  },
  {
    id: 10,
    category: 'products',
    categoryName: 'Products & Ingredients',
    question: 'How should I store LeafOra botanical skincare products?',
    answer: 'Store your skincare bottles and tubes in a cool, dry place away from direct sunlight, extreme humidity, or excessive heat. Always make sure the dropper cap and bottle lids are fastened tightly after each application to preserve active botanical antioxidants.'
  },
  {
    id: 11,
    category: 'safety',
    categoryName: 'Safety & Routine',
    question: 'Does the SPF 50 Sunscreen leave a white cast or feel sticky?',
    answer: 'No! Our SPF 50 PA++++ Sunscreen features an ultra-light water gel formulation tailored specifically for tropical climates. It absorbs in seconds with zero white cast, zero heavy greasiness, and a clean matte glow suitable for all Indian skin types and undertones.'
  },
  {
    id: 12,
    category: 'returns',
    categoryName: 'Returns & Refunds',
    question: 'How do I contact customer support if I have questions?',
    answer: 'Our dedicated botanical care team is available Monday through Saturday (9:00 AM - 7:00 PM IST). You can email us at support@leaforalifescience.com, call +91 98765 43210, or fill out the direct inquiry form on our Contact Us page.'
  }
];

const CATEGORIES = [
  { key: 'all', label: 'All Questions' },
  { key: 'products', label: 'Products & Ingredients' },
  { key: 'orders', label: 'Orders & Shipping' },
  { key: 'returns', label: 'Returns & Refunds' },
  { key: 'safety', label: 'Safety & Daily Routine' }
];

export default function Faq() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIds, setOpenIds] = useState([1, 2, 3]); // First 3 open by default

  const toggleItem = (id) => {
    setOpenIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExpandAll = () => {
    setOpenIds(filteredFaqs.map(f => f.id));
  };

  const handleCollapseAll = () => {
    setOpenIds([]);
  };

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter(faq => {
      const matchCat = selectedCategory === 'all' || faq.category === selectedCategory;
      if (!matchCat) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchQ = faq.question.toLowerCase().includes(q);
        const matchA = faq.answer.toLowerCase().includes(q);
        const matchCatName = faq.categoryName.toLowerCase().includes(q);
        return matchQ || matchA || matchCatName;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="policy-page-wrapper faq-page-wrapper">
      <SEO 
        title="Frequently Asked Questions (FAQ) | LeafOra Life Sciences"
        description="Got questions about LeafOra skincare? Find answers about our organic ingredients, dermatological safety, 3-step routine, express delivery and return policy."
        canonicalUrl="https://leaforalifescience.com/faq"
      />

      {/* Hero Banner */}
      <section className="policy-hero-banner faq-hero-banner">
        <div className="policy-hero-badge">
          <HelpCircle size={14} /> Knowledge Base & Support
        </div>
        <h1 className="policy-hero-title">Frequently Asked Questions</h1>
        <p className="policy-hero-subtitle">
          Find instant answers to common questions about our clean botanical formulations, dermatological standards, order delivery, and daily routines.
        </p>

        {/* Search Bar inside Hero */}
        <div className="faq-hero-search-wrapper">
          <Search size={18} className="faq-search-icon" />
          <input 
            type="text"
            className="faq-hero-search-input"
            placeholder="Search questions (e.g. shipping, ingredients, sunscreen, returns)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              type="button" 
              className="faq-search-clear-btn" 
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </section>

      {/* Policy Navigation Tabs */}
      <div className="policy-tabs-bar">
        <Link to="/faq" className="policy-tab-link active">
          <HelpCircle size={15} /> Frequently Asked Questions
        </Link>
        <Link to="/shipping-policy" className="policy-tab-link">
          <Truck size={15} /> Shipping & Delivery
        </Link>
        <Link to="/terms-and-conditions" className="policy-tab-link">
          <FileText size={15} /> Terms & Conditions
        </Link>
        <Link to="/privacy-policy" className="policy-tab-link">
          <ShieldCheck size={15} /> Privacy Policy
        </Link>
      </div>

      {/* Main FAQ Content Container */}
      <div className="policy-content-container faq-content-container">
        
        {/* Category Pills & Action Bar */}
        <div className="faq-controls-bar">
          <div className="faq-category-pills">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                type="button"
                className={`faq-pill-btn ${selectedCategory === cat.key ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="faq-toggle-actions">
            <button type="button" className="faq-action-link" onClick={handleExpandAll}>
              Expand All
            </button>
            <span className="faq-action-dot">•</span>
            <button type="button" className="faq-action-link" onClick={handleCollapseAll}>
              Collapse All
            </button>
          </div>
        </div>

        {/* Results Counter */}
        <div className="faq-results-info">
          Showing <strong>{filteredFaqs.length}</strong> {filteredFaqs.length === 1 ? 'answer' : 'answers'}
          {searchQuery && <span> for &ldquo;{searchQuery}&rdquo;</span>}
        </div>

        {/* Accordion List */}
        {filteredFaqs.length > 0 ? (
          <div className="faq-accordion-list">
            {filteredFaqs.map(faq => {
              const isOpen = openIds.includes(faq.id);
              return (
                <div key={faq.id} className={`faq-accordion-item ${isOpen ? 'open' : ''}`}>
                  <button 
                    type="button" 
                    className="faq-question-trigger"
                    onClick={() => toggleItem(faq.id)}
                    aria-expanded={isOpen}
                  >
                    <span className="faq-q-text">
                      <span className="faq-category-tag">{faq.categoryName}</span>
                      {faq.question}
                    </span>
                    <span className="faq-chevron-wrap">
                      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="faq-answer-pane">
                      <p className="faq-answer-text">
                        {faq.answer.split('\n').map((line, idx) => (
                          <React.Fragment key={idx}>
                            {line}
                            {idx < faq.answer.split('\n').length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="faq-no-results">
            <HelpCircle size={44} color="#C58A2A" />
            <h3>No matching questions found</h3>
            <p>We couldn't find any results matching &ldquo;{searchQuery}&rdquo;. Try another keyword or browse all questions.</p>
            <button 
              type="button" 
              className="faq-reset-btn" 
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Still Have Questions Concierge Card */}
        <div className="faq-concierge-card">
          <div className="faq-concierge-left">
            <span className="faq-concierge-tag">STILL HAVE QUESTIONS?</span>
            <h3 className="faq-concierge-title">Can&apos;t find the answer you are looking for?</h3>
            <p className="faq-concierge-desc">
              Our botanical skincare specialists and customer support team are available to guide you with formulations, active order statuses, and custom recommendations.
            </p>
          </div>
          <div className="faq-concierge-right">
            <Link to="/contact" className="faq-contact-btn-primary">
              <MessageSquare size={16} /> Contact Support <ArrowRight size={15} />
            </Link>
            <a 
              href="mailto:support@leaforalifescience.com" 
              className="faq-contact-btn-secondary"
            >
              <Mail size={16} /> Email Support
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}

