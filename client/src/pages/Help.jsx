import { useMemo, useState } from "react";
import {
  Search,
  BookOpen,
  Package,
  Boxes,
  Truck,
  ShoppingCart,
  TrendingUp,
  BrainCircuit,
  BarChart3,
  FileText,
  Users,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Mail,
  MessageCircle,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Languages,
  LayoutDashboard,
  ArrowRight,
  Lightbulb,
  X,
} from "lucide-react";

const translations = {
  en: {
    badge: "HELP & LEARNING CENTER",
    title: "How can we help you?",
    subtitle:
      "Explore platform guides, learn every module and follow interactive demonstrations.",
    search: "Search modules, guides and FAQs...",
    categories: "Explore application modules",
    categoriesSub: "Select a module to understand its features and workflow.",
    manual: "Interactive User Manual",
    manualSub:
      "Learn the platform step by step with a guided visual demonstration.",
    start: "Start Demo",
    previous: "Previous",
    next: "Next Step",
    finish: "Finish Demo",
    step: "Step",
    of: "of",
    faq: "Frequently Asked Questions",
    support: "Need more assistance?",
    supportSub:
      "Contact the platform support team for technical or account-related help.",
    contact: "Contact Support",
    noResults: "No matching guides found.",
    all: "All Modules",
    guide: "Module Guide",
    demo: "Guided Demo",
    close: "Close",
    steps: "Demo steps",
    demoNotice:
      "This is a sample walkthrough. It does not create, edit or delete real application records.",
  },
  hi: {
    badge: "सहायता और सीखने का केंद्र",
    title: "हम आपकी कैसे मदद कर सकते हैं?",
    subtitle:
      "प्लेटफ़ॉर्म गाइड देखें, सभी मॉड्यूल सीखें और इंटरैक्टिव प्रदर्शन का पालन करें।",
    search: "मॉड्यूल, गाइड और FAQ खोजें...",
    categories: "एप्लिकेशन मॉड्यूल देखें",
    categoriesSub: "सुविधाओं और कार्यप्रवाह को समझने के लिए मॉड्यूल चुनें।",
    manual: "इंटरैक्टिव यूज़र मैनुअल",
    manualSub: "चरण-दर-चरण दृश्य प्रदर्शन के साथ प्लेटफ़ॉर्म सीखें।",
    start: "डेमो शुरू करें",
    previous: "पिछला",
    next: "अगला चरण",
    finish: "डेमो समाप्त करें",
    step: "चरण",
    of: "में से",
    faq: "अक्सर पूछे जाने वाले प्रश्न",
    support: "और सहायता चाहिए?",
    supportSub:
      "तकनीकी या अकाउंट संबंधी सहायता के लिए सपोर्ट टीम से संपर्क करें।",
    contact: "सपोर्ट से संपर्क करें",
    noResults: "कोई संबंधित गाइड नहीं मिला।",
    all: "सभी मॉड्यूल",
    guide: "मॉड्यूल गाइड",
    demo: "गाइडेड डेमो",
    close: "बंद करें",
    steps: "डेमो चरण",
    demoNotice:
      "यह एक उदाहरणात्मक गाइड है। यह वास्तविक एप्लिकेशन डेटा नहीं बनाता, बदलता या हटाता है।",
  },
  or: {
    badge: "ସହାୟତା ଏବଂ ଶିକ୍ଷା କେନ୍ଦ୍ର",
    title: "ଆମେ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବୁ?",
    subtitle:
      "ପ୍ଲାଟଫର୍ମ ଗାଇଡ୍ ପଢ଼ନ୍ତୁ, ସମସ୍ତ ମଡ୍ୟୁଲ୍ ଶିଖନ୍ତୁ ଏବଂ ଇଣ୍ଟରାକ୍ଟିଭ୍ ଡେମୋ ଦେଖନ୍ତୁ।",
    search: "ମଡ୍ୟୁଲ୍, ଗାଇଡ୍ ଏବଂ FAQ ଖୋଜନ୍ତୁ...",
    categories: "ଆପ୍ଲିକେସନ୍ ମଡ୍ୟୁଲ୍ ଦେଖନ୍ତୁ",
    categoriesSub:
      "ବୈଶିଷ୍ଟ୍ୟ ଏବଂ କାର୍ଯ୍ୟପ୍ରଣାଳୀ ବୁଝିବା ପାଇଁ ଏକ ମଡ୍ୟୁଲ୍ ବାଛନ୍ତୁ।",
    manual: "ଇଣ୍ଟରାକ୍ଟିଭ୍ ୟୁଜର୍ ମାନୁଆଲ୍",
    manualSub: "ପଦକ୍ଷେପ ଅନୁସାରେ ଭିଜୁଆଲ୍ ଡେମୋ ମାଧ୍ୟମରେ ପ୍ଲାଟଫର୍ମ ଶିଖନ୍ତୁ।",
    start: "ଡେମୋ ଆରମ୍ଭ କରନ୍ତୁ",
    previous: "ପୂର୍ବବର୍ତ୍ତୀ",
    next: "ପରବର୍ତ୍ତୀ ପଦକ୍ଷେପ",
    finish: "ଡେମୋ ଶେଷ କରନ୍ତୁ",
    step: "ପଦକ୍ଷେପ",
    of: "ମଧ୍ୟରୁ",
    faq: "ସାଧାରଣ ପ୍ରଶ୍ନ",
    support: "ଆହୁରି ସହାୟତା ଆବଶ୍ୟକ କି?",
    supportSub:
      "ଟେକ୍ନିକାଲ୍ କିମ୍ବା ଆକାଉଣ୍ଟ ସହାୟତା ପାଇଁ ସପୋର୍ଟ ଟିମ୍ ସହିତ ଯୋଗାଯୋଗ କରନ୍ତୁ।",
    contact: "ସପୋର୍ଟ ସହିତ ଯୋଗାଯୋଗ",
    noResults: "କୌଣସି ଗାଇଡ୍ ମିଳିଲା ନାହିଁ।",
    all: "ସମସ୍ତ ମଡ୍ୟୁଲ୍",
    guide: "ମଡ୍ୟୁଲ୍ ଗାଇଡ୍",
    demo: "ଗାଇଡେଡ୍ ଡେମୋ",
    close: "ବନ୍ଦ କରନ୍ତୁ",
    steps: "ଡେମୋ ପଦକ୍ଷେପ",
    demoNotice:
      "ଏହା ଏକ ନମୁନା ଗାଇଡ୍। ଏହା ପ୍ରକୃତ ଆପ୍ଲିକେସନ୍ ଡାଟା ସୃଷ୍ଟି, ପରିବର୍ତ୍ତନ କିମ୍ବା ଡିଲିଟ୍ କରେ ନାହିଁ।",
  },
};

const modules = [
  {
    title: "Dashboard",
    description: {
      en: "Monitor business performance, inventory KPIs and recent purchase orders.",
      hi: "व्यवसाय प्रदर्शन, इन्वेंटरी KPI और हाल के खरीद ऑर्डर देखें।",
      or: "ବ୍ୟବସାୟ ପ୍ରଦର୍ଶନ, ଇନଭେଣ୍ଟରୀ KPI ଏବଂ ସାମ୍ପ୍ରତିକ କ୍ରୟ ଅର୍ଡର ଦେଖନ୍ତୁ।",
    },
    icon: LayoutDashboard,
    color: "blue",
    features: {
      en: [
        "View inventory summary and KPIs",
        "Monitor recent purchase orders",
        "Review alerts and activity",
      ],
      hi: [
        "इन्वेंटरी सारांश और KPI देखें",
        "हाल के खरीद ऑर्डर देखें",
        "अलर्ट और गतिविधि देखें",
      ],
      or: [
        "ଇନଭେଣ୍ଟରୀ ସାରାଂଶ ଏବଂ KPI ଦେଖନ୍ତୁ",
        "ସାମ୍ପ୍ରତିକ କ୍ରୟ ଅର୍ଡର ଦେଖନ୍ତୁ",
        "ଆଲର୍ଟ ଏବଂ କାର୍ଯ୍ୟକଳାପ ଦେଖନ୍ତୁ",
      ],
    },
    path: "/",
  },
  {
    title: "Products & Categories",
    description: {
      en: "Maintain product details, SKU, pricing, categories and reorder information.",
      hi: "उत्पाद विवरण, SKU, मूल्य, श्रेणियाँ और रीऑर्डर जानकारी प्रबंधित करें।",
      or: "ଉତ୍ପାଦ ବିବରଣୀ, SKU, ମୂଲ୍ୟ, ବର୍ଗ ଏବଂ ପୁନଃ ଅର୍ଡର ସୂଚନା ପରିଚାଳନା କରନ୍ତୁ।",
    },
    icon: Package,
    color: "indigo",
    features: {
      en: [
        "Create and update products",
        "Maintain SKU and pricing",
        "Organize product categories",
      ],
      hi: [
        "उत्पाद जोड़ें और अपडेट करें",
        "SKU और मूल्य प्रबंधित करें",
        "उत्पाद श्रेणियाँ व्यवस्थित करें",
      ],
      or: [
        "ଉତ୍ପାଦ ଯୋଡନ୍ତୁ ଏବଂ ଅପଡେଟ୍ କରନ୍ତୁ",
        "SKU ଏବଂ ମୂଲ୍ୟ ପରିଚାଳନା କରନ୍ତୁ",
        "ଉତ୍ପାଦ ବର୍ଗ ସଜାନ୍ତୁ",
      ],
    },
    path: "/products",
  },
  {
    title: "Inventory",
    description: {
      en: "Track current, reserved and available stock. Record stock adjustments.",
      hi: "मौजूदा, आरक्षित और उपलब्ध स्टॉक ट्रैक करें। स्टॉक समायोजन दर्ज करें।",
      or: "ବର୍ତ୍ତମାନ, ସଂରକ୍ଷିତ ଏବଂ ଉପଲବ୍ଧ ଷ୍ଟକ୍ ଟ୍ରାକ୍ କରନ୍ତୁ। ଷ୍ଟକ୍ ପରିବର୍ତ୍ତନ ରେକର୍ଡ କରନ୍ତୁ।",
    },
    icon: Boxes,
    color: "emerald",
    features: {
      en: [
        "Review stock quantities",
        "Record stock in and stock out",
        "Monitor reorder levels",
      ],
      hi: [
        "स्टॉक की मात्रा देखें",
        "स्टॉक इन और स्टॉक आउट दर्ज करें",
        "रीऑर्डर स्तर देखें",
      ],
      or: [
        "ଷ୍ଟକ୍ ପରିମାଣ ଦେଖନ୍ତୁ",
        "ଷ୍ଟକ୍ ଇନ୍ ଏବଂ ଷ୍ଟକ୍ ଆଉଟ୍ ରେକର୍ଡ କରନ୍ତୁ",
        "ପୁନଃ ଅର୍ଡର ସ୍ତର ଦେଖନ୍ତୁ",
      ],
    },
    path: "/inventory",
  },
  {
    title: "Suppliers",
    description: {
      en: "Maintain supplier contacts, business details and supplier status.",
      hi: "आपूर्तिकर्ता संपर्क, व्यवसाय विवरण और स्थिति प्रबंधित करें।",
      or: "ଯୋଗାଣକାରୀ ସମ୍ପର୍କ, ବ୍ୟବସାୟ ବିବରଣୀ ଏବଂ ସ୍ଥିତି ପରିଚାଳନା କରନ୍ତୁ।",
    },
    icon: Truck,
    color: "amber",
    features: {
      en: [
        "Add supplier information",
        "Update contact details",
        "Activate or deactivate suppliers",
      ],
      hi: [
        "आपूर्तिकर्ता जानकारी जोड़ें",
        "संपर्क विवरण अपडेट करें",
        "आपूर्तिकर्ता सक्रिय या निष्क्रिय करें",
      ],
      or: [
        "ଯୋଗାଣକାରୀ ସୂଚନା ଯୋଡନ୍ତୁ",
        "ସମ୍ପର୍କ ବିବରଣୀ ଅପଡେଟ୍ କରନ୍ତୁ",
        "ଯୋଗାଣକାରୀଙ୍କୁ ସକ୍ରିୟ କିମ୍ବା ନିଷ୍କ୍ରିୟ କରନ୍ତୁ",
      ],
    },
    path: "/suppliers",
  },
  {
    title: "Purchase Orders",
    description: {
      en: "Create and monitor purchase orders, suppliers, delivery dates and order status.",
      hi: "खरीद ऑर्डर, आपूर्तिकर्ता, डिलीवरी तिथि और ऑर्डर स्थिति प्रबंधित करें।",
      or: "କ୍ରୟ ଅର୍ଡର, ଯୋଗାଣକାରୀ, ଡେଲିଭରି ତାରିଖ ଏବଂ ଅର୍ଡର ସ୍ଥିତି ପରିଚାଳନା କରନ୍ତୁ।",
    },
    icon: ShoppingCart,
    color: "violet",
    features: {
      en: [
        "Create purchase orders",
        "Track order status",
        "Review expected delivery",
      ],
      hi: [
        "खरीद ऑर्डर बनाएं",
        "ऑर्डर स्थिति ट्रैक करें",
        "अपेक्षित डिलीवरी देखें",
      ],
      or: [
        "କ୍ରୟ ଅର୍ଡର ସୃଷ୍ଟି କରନ୍ତୁ",
        "ଅର୍ଡର ସ୍ଥିତି ଟ୍ରାକ୍ କରନ୍ତୁ",
        "ଆଶାକରାଯାଇଥିବା ଡେଲିଭରି ଦେଖନ୍ତୁ",
      ],
    },
    path: "/purchase-orders",
  },
  {
    title: "Demand Management",
    description: {
      en: "Record product demand and review demand history.",
      hi: "उत्पाद की मांग दर्ज करें और मांग इतिहास देखें।",
      or: "ଉତ୍ପାଦ ଚାହିଦା ରେକର୍ଡ କରନ୍ତୁ ଏବଂ ଚାହିଦା ଇତିହାସ ଦେଖନ୍ତୁ।",
    },
    icon: TrendingUp,
    color: "rose",
    features: {
      en: [
        "Add demand records",
        "Review demand quantities",
        "Filter demand sources",
      ],
      hi: [
        "मांग रिकॉर्ड जोड़ें",
        "मांग मात्रा देखें",
        "मांग स्रोत फ़िल्टर करें",
      ],
      or: [
        "ଚାହିଦା ରେକର୍ଡ ଯୋଡନ୍ତୁ",
        "ଚାହିଦା ପରିମାଣ ଦେଖନ୍ତୁ",
        "ଚାହିଦା ଉତ୍ସ ଫିଲ୍ଟର୍ କରନ୍ତୁ",
      ],
    },
    path: "/demands",
  },
  {
    title: "Replenishment",
    description: {
      en: "Review stock risk, stock coverage and recommended replenishment quantities.",
      hi: "स्टॉक जोखिम, कवरेज और सुझाई गई रीप्लेनिशमेंट मात्रा देखें।",
      or: "ଷ୍ଟକ୍ ବିପଦ, ଷ୍ଟକ୍ କଭରେଜ୍ ଏବଂ ସୁପାରିଶ କରାଯାଇଥିବା ପରିମାଣ ଦେଖନ୍ତୁ।",
    },
    icon: RefreshIcon,
    color: "cyan",
    features: {
      en: [
        "Review risk levels",
        "Check stock coverage",
        "Open purchase orders for replenishment",
      ],
      hi: [
        "जोखिम स्तर देखें",
        "स्टॉक कवरेज जांचें",
        "रीप्लेनिशमेंट के लिए खरीद ऑर्डर खोलें",
      ],
      or: [
        "ବିପଦ ସ୍ତର ଦେଖନ୍ତୁ",
        "ଷ୍ଟକ୍ କଭରେଜ୍ ଯାଞ୍ଚ କରନ୍ତୁ",
        "ପୁନଃ ଷ୍ଟକ୍ ପାଇଁ କ୍ରୟ ଅର୍ଡର ଖୋଲନ୍ତୁ",
      ],
    },
    path: "/replenishment",
  },
  {
    title: "Analytics & AI Intelligence",
    description: {
      en: "Review inventory health, risk indicators and intelligence recommendations.",
      hi: "इन्वेंटरी स्वास्थ्य, जोखिम संकेतक और इंटेलिजेंस सुझाव देखें।",
      or: "ଇନଭେଣ୍ଟରୀ ସ୍ୱାସ୍ଥ୍ୟ, ବିପଦ ସୂଚକ ଏବଂ ଇଣ୍ଟେଲିଜେନ୍ସ ସୁପାରିଶ ଦେଖନ୍ତୁ।",
    },
    icon: BrainCircuit,
    color: "blue",
    features: {
      en: [
        "Review inventory analytics",
        "Monitor product risk",
        "Read recommendations",
      ],
      hi: ["इन्वेंटरी एनालिटिक्स देखें", "उत्पाद जोखिम देखें", "सुझाव पढ़ें"],
      or: [
        "ଇନଭେଣ୍ଟରୀ ଆନାଲିଟିକ୍ସ ଦେଖନ୍ତୁ",
        "ଉତ୍ପାଦ ବିପଦ ଦେଖନ୍ତୁ",
        "ସୁପାରିଶ ପଢନ୍ତୁ",
      ],
    },
    path: "/intelligence",
  },
  {
    title: "Reports",
    description: {
      en: "Export available inventory and purchase order reports as CSV files.",
      hi: "उपलब्ध इन्वेंटरी और खरीद ऑर्डर रिपोर्ट CSV में डाउनलोड करें।",
      or: "ଉପଲବ୍ଧ ଇନଭେଣ୍ଟରୀ ଏବଂ କ୍ରୟ ଅର୍ଡର ରିପୋର୍ଟ CSV ଭାବରେ ଡାଉନଲୋଡ୍ କରନ୍ତୁ।",
    },
    icon: FileText,
    color: "orange",
    features: {
      en: [
        "Download inventory report",
        "Download purchase order report",
        "Review report information",
      ],
      hi: [
        "इन्वेंटरी रिपोर्ट डाउनलोड करें",
        "खरीद ऑर्डर रिपोर्ट डाउनलोड करें",
        "रिपोर्ट जानकारी देखें",
      ],
      or: [
        "ଇନଭେଣ୍ଟରୀ ରିପୋର୍ଟ ଡାଉନଲୋଡ୍ କରନ୍ତୁ",
        "କ୍ରୟ ଅର୍ଡର ରିପୋର୍ଟ ଡାଉନଲୋଡ୍ କରନ୍ତୁ",
        "ରିପୋର୍ଟ ସୂଚନା ଦେଖନ୍ତୁ",
      ],
    },
    path: "/reports",
  },
  {
    title: "Employee Management",
    description: {
      en: "Admin users can create, update and deactivate employee accounts.",
      hi: "एडमिन कर्मचारी खाते बना, अपडेट और निष्क्रिय कर सकते हैं।",
      or: "ଆଡମିନ୍ କର୍ମଚାରୀ ଆକାଉଣ୍ଟ ସୃଷ୍ଟି, ଅପଡେଟ୍ ଏବଂ ନିଷ୍କ୍ରିୟ କରିପାରିବେ।",
    },
    icon: Users,
    color: "indigo",
    features: {
      en: [
        "Create employee accounts",
        "Update employee details",
        "Manage active status",
      ],
      hi: [
        "कर्मचारी खाते बनाएं",
        "कर्मचारी विवरण अपडेट करें",
        "सक्रिय स्थिति प्रबंधित करें",
      ],
      or: [
        "କର୍ମଚାରୀ ଆକାଉଣ୍ଟ ସୃଷ୍ଟି କରନ୍ତୁ",
        "କର୍ମଚାରୀ ବିବରଣୀ ଅପଡେଟ୍ କରନ୍ତୁ",
        "ସକ୍ରିୟ ସ୍ଥିତି ପରିଚାଳନା କରନ୍ତୁ",
      ],
    },
    path: "/employees",
    adminOnly: true,
  },
];

function RefreshIcon(props) {
  return <TrendingUp {...props} />;
}

const demoSteps = [
  {
    title: {
      en: "Welcome to your workspace",
      hi: "आपके वर्कस्पेस में आपका स्वागत है",
      or: "ଆପଣଙ୍କ ୱର୍କସ୍ପେସ୍‌କୁ ସ୍ୱାଗତ",
    },
    description: {
      en: "The Dashboard provides a quick overview of inventory, demand, purchase orders and important alerts.",
      hi: "डैशबोर्ड इन्वेंटरी, मांग, खरीद ऑर्डर और महत्वपूर्ण अलर्ट का सारांश दिखाता है।",
      or: "ଡ୍ୟାସବୋର୍ଡ ଇନଭେଣ୍ଟରୀ, ଚାହିଦା, କ୍ରୟ ଅର୍ଡର ଏବଂ ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ଆଲର୍ଟର ସାରାଂଶ ଦେଖାଏ।",
    },
    icon: LayoutDashboard,
    label: "Dashboard",
    stats: [
      ["Products", "128"],
      ["Stock Units", "4,820"],
      ["Low Stock", "08"],
    ],
  },
  {
    title: {
      en: "Manage your products",
      hi: "अपने उत्पाद प्रबंधित करें",
      or: "ଆପଣଙ୍କ ଉତ୍ପାଦ ପରିଚାଳନା କରନ୍ତୁ",
    },
    description: {
      en: "Open Products to review your catalog, search by SKU and add or update product information.",
      hi: "उत्पाद कैटलॉग देखें, SKU से खोजें और उत्पाद जानकारी जोड़ें या अपडेट करें।",
      or: "ଉତ୍ପାଦ କ୍ୟାଟାଲଗ୍ ଦେଖନ୍ତୁ, SKU ଦ୍ୱାରା ଖୋଜନ୍ତୁ ଏବଂ ଉତ୍ପାଦ ସୂଚନା ଯୋଡନ୍ତୁ କିମ୍ବା ଅପଡେଟ୍ କରନ୍ତୁ।",
    },
    icon: Package,
    label: "Products",
    stats: [
      ["Active", "120"],
      ["Categories", "12"],
      ["SKU", "128"],
    ],
  },
  {
    title: {
      en: "Monitor inventory",
      hi: "इन्वेंटरी की निगरानी करें",
      or: "ଇନଭେଣ୍ଟରୀ ଉପରେ ନଜର ରଖନ୍ତୁ",
    },
    description: {
      en: "Check current, reserved and available quantities. Use stock adjustments to record stock movements.",
      hi: "मौजूदा, आरक्षित और उपलब्ध मात्रा देखें। स्टॉक मूवमेंट दर्ज करने के लिए समायोजन का उपयोग करें।",
      or: "ବର୍ତ୍ତମାନ, ସଂରକ୍ଷିତ ଏବଂ ଉପଲବ୍ଧ ପରିମାଣ ଦେଖନ୍ତୁ। ଷ୍ଟକ୍ ଗତିବିଧି ରେକର୍ଡ କରିବାକୁ ଆଡଜଷ୍ଟମେଣ୍ଟ ବ୍ୟବହାର କରନ୍ତୁ।",
    },
    icon: Boxes,
    label: "Inventory",
    stats: [
      ["Current", "4,820"],
      ["Reserved", "320"],
      ["Available", "4,500"],
    ],
  },
  {
    title: {
      en: "Review demand and replenishment",
      hi: "मांग और रीप्लेनिशमेंट देखें",
      or: "ଚାହିଦା ଏବଂ ପୁନଃ ଷ୍ଟକ୍ ସମୀକ୍ଷା କରନ୍ତୁ",
    },
    description: {
      en: "Review demand records and stock risk. Replenishment provides recommended quantities based on the platform's current rules.",
      hi: "मांग रिकॉर्ड और स्टॉक जोखिम देखें। रीप्लेनिशमेंट प्लेटफ़ॉर्म के मौजूदा नियमों के आधार पर सुझाई गई मात्रा दिखाता है।",
      or: "ଚାହିଦା ରେକର୍ଡ ଏବଂ ଷ୍ଟକ୍ ବିପଦ ଦେଖନ୍ତୁ। ପ୍ଲାଟଫର୍ମର ବର୍ତ୍ତମାନ ନିୟମ ଆଧାରରେ ପୁନଃ ଷ୍ଟକ୍ ପରିମାଣ ସୁପାରିଶ କରାଯାଏ।",
    },
    icon: TrendingUp,
    label: "Replenishment",
    stats: [
      ["Critical", "03"],
      ["High Risk", "08"],
      ["Suggested Units", "240"],
    ],
  },
  {
    title: {
      en: "Create and track purchase orders",
      hi: "खरीद ऑर्डर बनाएं और ट्रैक करें",
      or: "କ୍ରୟ ଅର୍ଡର ସୃଷ୍ଟି ଏବଂ ଟ୍ରାକ୍ କରନ୍ତୁ",
    },
    description: {
      en: "Use Purchase Orders to create supplier orders and monitor their delivery and status.",
      hi: "आपूर्तिकर्ता ऑर्डर बनाने और डिलीवरी तथा स्थिति देखने के लिए Purchase Orders का उपयोग करें।",
      or: "ଯୋଗାଣକାରୀ ଅର୍ଡର ସୃଷ୍ଟି ଏବଂ ଡେଲିଭରି ଓ ସ୍ଥିତି ଟ୍ରାକ୍ କରିବା ପାଇଁ Purchase Orders ବ୍ୟବହାର କରନ୍ତୁ।",
    },
    icon: ShoppingCart,
    label: "Purchase Orders",
    stats: [
      ["Draft", "04"],
      ["Ordered", "12"],
      ["Received", "28"],
    ],
  },
  {
    title: {
      en: "Analyze and export reports",
      hi: "विश्लेषण करें और रिपोर्ट डाउनलोड करें",
      or: "ବିଶ୍ଳେଷଣ କରନ୍ତୁ ଏବଂ ରିପୋର୍ଟ ଡାଉନଲୋଡ୍ କରନ୍ତୁ",
    },
    description: {
      en: "Use Analytics and Reports to review stock health and export available CSV reports.",
      hi: "स्टॉक स्वास्थ्य देखने और उपलब्ध CSV रिपोर्ट डाउनलोड करने के लिए Analytics और Reports का उपयोग करें।",
      or: "ଷ୍ଟକ୍ ସ୍ୱାସ୍ଥ୍ୟ ଦେଖିବା ଏବଂ ଉପଲବ୍ଧ CSV ରିପୋର୍ଟ ଡାଉନଲୋଡ୍ କରିବା ପାଇଁ Analytics ଏବଂ Reports ବ୍ୟବହାର କରନ୍ତୁ।",
    },
    icon: BarChart3,
    label: "Analytics & Reports",
    stats: [
      ["Healthy", "110"],
      ["Low Stock", "08"],
      ["Out of Stock", "02"],
    ],
  },
];

const faqs = [
  {
    q: {
      en: "How do I identify low-stock products?",
      hi: "कम स्टॉक वाले उत्पाद कैसे पहचानें?",
      or: "କମ୍ ଷ୍ଟକ୍ ଥିବା ଉତ୍ପାଦ କିପରି ଚିହ୍ନଟ କରିବେ?",
    },
    a: {
      en: "Open Inventory or Inventory Analytics and review the Low Stock and Out of Stock indicators.",
      hi: "Inventory या Inventory Analytics खोलें और Low Stock तथा Out of Stock संकेतक देखें।",
      or: "Inventory କିମ୍ବା Inventory Analytics ଖୋଲନ୍ତୁ ଏବଂ Low Stock ଓ Out of Stock ସୂଚକ ଦେଖନ୍ତୁ।",
    },
  },
  {
    q: {
      en: "Who can manage employees?",
      hi: "कर्मचारियों को कौन प्रबंधित कर सकता है?",
      or: "କର୍ମଚାରୀଙ୍କୁ କିଏ ପରିଚାଳନା କରିପାରିବେ?",
    },
    a: {
      en: "Employee Management is restricted to users with the Admin role.",
      hi: "Employee Management केवल Admin भूमिका वाले उपयोगकर्ताओं के लिए है।",
      or: "Employee Management କେବଳ Admin ଭୂମିକା ଥିବା ବ୍ୟବହାରକାରୀଙ୍କ ପାଇଁ ଉପଲବ୍ଧ।",
    },
  },
  {
    q: {
      en: "Are AI recommendations generated by a trained ML model?",
      hi: "क्या AI सुझाव प्रशिक्षित ML मॉडल से आते हैं?",
      or: "AI ସୁପାରିଶ ଏକ ଟ୍ରେନ୍ କରାଯାଇଥିବା ML ମଡେଲ୍ ଦ୍ୱାରା ତିଆରି ହୁଏ କି?",
    },
    a: {
      en: "The current replenishment and intelligence recommendations use backend rule-based calculations. A trained ML forecasting model is not currently connected.",
      hi: "वर्तमान सुझाव backend के rule-based calculations का उपयोग करते हैं। अभी प्रशिक्षित ML forecasting model कनेक्ट नहीं है।",
      or: "ବର୍ତ୍ତମାନର ସୁପାରିଶ backend ର rule-based calculations ବ୍ୟବହାର କରେ। ଏକ trained ML forecasting model ବର୍ତ୍ତମାନ ସଂଯୁକ୍ତ ନୁହେଁ।",
    },
  },
  {
    q: {
      en: "Where can I download reports?",
      hi: "रिपोर्ट कहाँ से डाउनलोड कर सकते हैं?",
      or: "ରିପୋର୍ଟ କେଉଁଠାରୁ ଡାଉନଲୋଡ୍ କରିପାରିବେ?",
    },
    a: {
      en: "Open Reports to download the inventory and purchase order CSV reports currently supported by the platform.",
      hi: "Reports खोलकर उपलब्ध Inventory और Purchase Order CSV रिपोर्ट डाउनलोड करें।",
      or: "Reports ଖୋଲି ପ୍ଲାଟଫର୍ମରେ ଉପଲବ୍ଧ Inventory ଏବଂ Purchase Order CSV ରିପୋର୍ଟ ଡାଉନଲୋଡ୍ କରନ୍ତୁ।",
    },
  },
];

const colorMap = {
  blue: "bg-blue-50 text-blue-600",
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
  rose: "bg-rose-50 text-rose-600",
  cyan: "bg-cyan-50 text-cyan-600",
  orange: "bg-orange-50 text-orange-600",
};

function DemoWindow({ step, language }) {
  const Icon = step.icon;
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Platform Preview
        </span>
      </div>
      <div className="grid min-h-[235px] grid-cols-[58px_1fr] sm:grid-cols-[76px_1fr]">
        <div className="space-y-3 bg-slate-950 p-3">
          {[LayoutDashboard, Package, Boxes, ShoppingCart, BarChart3].map(
            (Item, i) => (
              <div
                key={i}
                className={`flex h-9 items-center justify-center rounded-lg ${i === Math.min(step.index, 4) ? "bg-blue-600 text-white" : "text-slate-500"}`}
              >
                <Item size={17} />
              </div>
            ),
          )}
        </div>
        <div className="min-w-0 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <Icon size={21} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900">
                {step.label}
              </p>
              <p className="text-[10px] text-slate-400">
                Illustrative workspace
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {step.stats.map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-100 bg-slate-50 p-2.5"
              >
                <p className="text-[9px] font-semibold text-slate-400">
                  {label}
                </p>
                <p className="mt-1 text-lg font-black text-slate-800">
                  {value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-blue-800">
              <CheckCircle2 size={14} />{" "}
              {language === "en"
                ? "Workflow preview"
                : language === "hi"
                  ? "कार्यप्रवाह पूर्वावलोकन"
                  : "କାର୍ଯ୍ୟପ୍ରଣାଳୀ ପୂର୍ବଦୃଶ୍ୟ"}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-blue-100">
              <div className="h-full w-2/3 rounded-full bg-blue-500" />
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              Sample values for learning only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Help() {
  const [language, setLanguage] = useState("en");
  const [search, setSearch] = useState("");
  const [activeModule, setActiveModule] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);

  const t = translations[language];

  const visibleModules = useMemo(
    () =>
      modules.filter((module) => {
        const content = [
          module.title,
          module.description[language],
          ...module.features[language],
        ]
          .join(" ")
          .toLowerCase();
        return content.includes(search.toLowerCase());
      }),
    [search, language],
  );

  const selectedModule = modules.find((item) => item.title === activeModule);
  const currentStep = {
    ...demoSteps[demoIndex],
    index: demoIndex,
  };

  const startDemo = () => {
    setDemoIndex(0);
    setDemoOpen(true);
  };

  return (
    <div className="mx-auto min-h-full max-w-[1600px] space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-5 py-7 text-white shadow-xl sm:px-8 sm:py-10">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold tracking-wider text-blue-100">
              <BookOpen size={14} /> {t.badge}
            </span>
            <label className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white">
              <Languages size={16} />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="cursor-pointer bg-transparent outline-none [&>option]:text-slate-900"
                aria-label="Help language"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="or">ଓଡ଼ିଆ</option>
              </select>
            </label>
          </div>
          <h1 className="mt-6 max-w-2xl text-2xl font-black tracking-tight sm:text-4xl">
            {t.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/80 sm:text-base">
            {t.subtitle}
          </p>
          <div className="mt-6 flex max-w-2xl items-center gap-3 rounded-2xl border border-white/15 bg-white px-4 py-3 shadow-lg">
            <Search className="shrink-0 text-slate-400" size={20} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.search}
              className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={17} />
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
              <Play size={21} />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900">{t.manual}</h2>
              <p className="mt-1 text-xs text-slate-500">{t.manualSub}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {demoSteps.map((step, index) => (
              <span
                key={step.label}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold ${index === 0 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}
              >
                {index + 1}
              </span>
            ))}
          </div>
          <button
            onClick={startDemo}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
          >
            <Play size={16} /> {t.start} <ArrowRight size={16} />
          </button>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 sm:p-6">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <Lightbulb size={22} />
            </div>
            <h3 className="mt-4 font-extrabold text-slate-900">{t.guide}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {language === "en"
                ? "Choose a module below to view its functions and common tasks."
                : language === "hi"
                  ? "किसी मॉड्यूल की सुविधाएँ और सामान्य कार्य देखने के लिए नीचे चुनें।"
                  : "ଏହାର ବୈଶିଷ୍ଟ୍ୟ ଏବଂ ସାଧାରଣ କାର୍ଯ୍ୟ ଦେଖିବା ପାଇଁ ନିମ୍ନରୁ ଏକ ମଡ୍ୟୁଲ୍ ବାଛନ୍ତୁ।"}
            </p>
          </div>
          <p className="mt-4 text-xs font-semibold text-blue-700">
            {modules.length} application modules documented
          </p>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-extrabold text-slate-900">
            {t.categories}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{t.categoriesSub}</p>
        </div>
        {visibleModules.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleModules.map((module) => {
              const Icon = module.icon;
              return (
                <button
                  key={module.title}
                  onClick={() => setActiveModule(module.title)}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${colorMap[module.color]}`}
                    >
                      <Icon size={21} />
                    </div>
                    <ChevronRight
                      size={17}
                      className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600"
                    />
                  </div>
                  <h3 className="mt-4 text-sm font-extrabold text-slate-900">
                    {module.title}
                  </h3>
                  <p className="mt-2 min-h-[48px] text-xs leading-5 text-slate-500">
                    {module.description[language]}
                  </p>
                  <p className="mt-3 text-xs font-bold text-blue-600">
                    {t.guide} <ArrowRight className="ml-1 inline" size={13} />
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-slate-500">
            {t.noResults}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
            <Lightbulb size={20} />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900">{t.faq}</h2>
            <p className="mt-1 text-xs text-slate-500">
              Quick answers for common workflows
            </p>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {faqs.map((faq, index) => (
            <div key={index} className="py-3">
              <button
                onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <span className="text-sm font-bold text-slate-800">
                  {faq.q[language]}
                </span>
                <ChevronDown
                  size={17}
                  className={`shrink-0 text-slate-400 transition ${openFaq === index ? "rotate-180" : ""}`}
                />
              </button>
              {openFaq === index && (
                <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-500">
                  {faq.a[language]}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col justify-between gap-5 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 p-6 text-white shadow-lg sm:flex-row sm:items-center sm:p-7">
        <div>
          <h2 className="text-xl font-extrabold">{t.support}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
            {t.supportSub}
          </p>
        </div>
        <a
          href="mailto:codepilot.devteam@gmail.com?subject=AI%20Inventory%20Platform%20Support"
          className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
        >
          <Mail size={17} /> {t.contact}
        </a>
      </section>

      {selectedModule && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setActiveModule(null)}
        >
          <div
            className="max-h-[88dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-xl p-3 ${colorMap[selectedModule.color]}`}
                >
                  <selectedModule.icon size={23} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {selectedModule.title}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">{t.guide}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModule(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-600">
              {selectedModule.description[language]}
            </p>
            <h3 className="mt-6 text-sm font-extrabold text-slate-900">
              {language === "en"
                ? "Available functions"
                : language === "hi"
                  ? "उपलब्ध सुविधाएँ"
                  : "ଉପଲବ୍ଧ ବୈଶିଷ୍ଟ୍ୟ"}
            </h3>
            <div className="mt-3 space-y-3">
              {selectedModule.features[language].map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-2 text-sm text-slate-600"
                >
                  <CheckCircle2
                    size={17}
                    className="mt-0.5 shrink-0 text-emerald-500"
                  />
                  {feature}
                </div>
              ))}
            </div>
            <p className="mt-5 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800">
              {language === "en"
                ? "Access this module from the application sidebar. Your available actions depend on your assigned role."
                : language === "hi"
                  ? "इस मॉड्यूल को एप्लिकेशन साइडबार से खोलें। उपलब्ध कार्य आपकी भूमिका पर निर्भर करते हैं।"
                  : "ଆପ୍ଲିକେସନ୍ ସାଇଡବାର୍ ରୁ ଏହି ମଡ୍ୟୁଲ୍ ଖୋଲନ୍ତୁ। ଉପଲବ୍ଧ କାର୍ଯ୍ୟ ଆପଣଙ୍କ ଭୂମିକା ଉପରେ ନିର୍ଭର କରେ।"}
            </p>
            <button
              onClick={() => setActiveModule(null)}
              className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {demoOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[94dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600">
                  {t.demo}
                </span>
                <h2 className="mt-1 text-lg font-black text-slate-900">
                  {t.step} {demoIndex + 1} {t.of} {demoSteps.length}
                </h2>
              </div>
              <button
                onClick={() => setDemoOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                aria-label={t.close}
              >
                <X size={20} />
              </button>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                style={{
                  width: `${((demoIndex + 1) / demoSteps.length) * 100}%`,
                }}
              />
            </div>
            <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr] lg:items-center">
              <div>
                <h3 className="text-xl font-black leading-tight text-slate-900">
                  {currentStep.title[language]}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {currentStep.description[language]}
                </p>
                <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                  {t.demoNotice}
                </div>
              </div>
              <DemoWindow step={currentStep} language={language} />
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <button
                disabled={demoIndex === 0}
                onClick={() => setDemoIndex((i) => i - 1)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                {t.previous}
              </button>
              {demoIndex < demoSteps.length - 1 ? (
                <button
                  onClick={() => setDemoIndex((i) => i + 1)}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                >
                  {t.next}
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={() => setDemoOpen(false)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 size={16} />
                  {t.finish}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
