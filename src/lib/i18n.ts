export type Language = 'en' | 'hi';

export interface TranslationSchema {
  // Brand & Meta
  appName: string;
  tagline: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;

  // Primary Actions
  findWork: string;
  manageBusiness: string;
  login: string;
  register: string;
  logout: string;
  getStarted: string;
  exploreJobs: string;
  postJob: string;
  addSale: string;
  addProduct: string;
  addCustomer: string;
  voiceEntry: string;
  quickVoiceEntry: string;
  voiceHelpText: string;
  listening: string;
  startVoice: string;
  stopVoice: string;
  voiceHint: string;
  saveChanges: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  search: string;
  searchPlaceholder: string;
  filter: string;
  all: string;
  viewAll: string;
  viewDetails: string;
  apply: string;
  applyNow: string;
  applied: string;
  callEmployer: string;
  callCustomer: string;
  sendWhatsApp: string;

  // Nav & Shell
  overview: string;
  dashboard: string;
  jobsAndApplicants: string;
  jobs: string;
  inventory: string;
  customers: string;
  udhaar: string;
  sales: string;
  notifications: string;
  settings: string;
  profile: string;
  applications: string;
  myApplications: string;
  businesses: string;
  users: string;
  moderation: string;
  adminPanel: string;

  // Role Names
  workerRole: string;
  businessRole: string;
  adminRole: string;
  merchantHub: string;
  workerSpace: string;
  adminControl: string;

  // Business Dashboard Modules
  welcomeBack: string;
  businessCategory: string;
  businessLocation: string;
  quickActions: string;
  todaysSales: string;
  totalRevenue: string;
  totalSales: string;
  totalProducts: string;
  totalCustomers: string;
  outstandingCredit: string;
  outstandingUdhaar: string;
  lowStockItems: string;
  activeJobs: string;
  recordCredit: string;
  recordRepayment: string;
  recordSale: string;
  billsToday: string;
  totalRecordedSales: string;
  acrossCustomers: string;
  itemsNeedRestock: string;
  salesPerformance: string;
  salesByPaymentMethod: string;
  cashSales: string;
  upiSales: string;
  creditSales: string;
  inventoryAlerts: string;
  threshold: string;
  inStockCount: string;
  recentTransactions: string;
  counterWalkIn: string;
  outstandingUdhaarSummary: string;
  totalMarketCredit: string;
  netBalance: string;
  recentApplications: string;
  appliedFor: string;
  noSalesYet: string;
  noSalesDesc: string;
  noApplicationsYet: string;
  noApplicationsDesc: string;
  noInventoryAlerts: string;

  // Worker Dashboard Modules
  welcomeWorker: string;
  profileCompleteness: string;
  availableForWork: string;
  currentlyBusy: string;
  availabilityStatus: string;
  totalApplied: string;
  acceptedHired: string;
  pendingReview: string;
  digitalSkillCard: string;
  verifiedTrades: string;
  workCraftVideo: string;
  videoVerified: string;
  experience: string;
  experienceYears: string;
  skills: string;
  location: string;
  recommendedJobs: string;
  lockedWageNotice: string;
  dailyWage: string;
  perDay: string;
  fixedWage: string;
  noJobsFound: string;
  noApplicationsSubmitted: string;
  startApplyingDesc: string;

  // Forms, Badges & Labels
  fullName: string;
  phoneNumber: string;
  city: string;
  locality: string;
  requiredSkills: string;
  wageAmount: string;
  jobType: string;
  description: string;
  status: string;
  open: string;
  filled: string;
  closed: string;
  pending: string;
  accepted: string;
  rejected: string;
  inStock: string;
  lowStock: string;
  outOfStock: string;
  cash: string;
  upi: string;
  credit: string;
  unitPrice: string;
  sellingPrice: string;
  quantity: string;
  customerName: string;
  amount: string;
  paymentMethod: string;
  date: string;
  notes: string;

  // Footer & Marketing
  howItWorks: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  readyToGetStarted: string;
  joinThousands: string;
  copyright: string;
}

export const translations: Record<Language, TranslationSchema> = {
  en: {
    // Brand & Meta
    appName: 'KaamSetu',
    tagline: 'Connecting Opportunities. Empowering Local Businesses.',
    heroBadge: 'Local Labor & Small Business Operating Platform',
    heroTitle: 'Opportunities for Workers. Simplicity for Businesses.',
    heroSubtitle:
      'KaamSetu connects skilled local workers with verified employment and helps small shopkeepers manage inventory, daily sales, and customer credit (Udhaar) in one simple, unified platform.',

    // Primary Actions
    findWork: 'Find Work',
    manageBusiness: 'Manage Business',
    login: 'Login',
    register: 'Create Account',
    logout: 'Logout',
    getStarted: 'Get Started Free',
    exploreJobs: 'Explore Jobs',
    postJob: 'Post New Job',
    addSale: 'New Bill (Sale)',
    addProduct: 'Add Product',
    addCustomer: 'Add Customer',
    voiceEntry: 'Voice Assistant',
    quickVoiceEntry: 'Voice Assistant ("Bol Kar Likho")',
    voiceHelpText: 'Speak in Hindi or English. E.g.: "Ramesh ko 500 rupay udhaar likho"',
    listening: 'Listening...',
    startVoice: 'Speak Command',
    stopVoice: 'Stop',
    voiceHint: 'Speak in Hindi or English',
    saveChanges: 'Save Changes',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search',
    searchPlaceholder: 'Search jobs, customers, products...',
    filter: 'Filter',
    all: 'All',
    viewAll: 'View All',
    viewDetails: 'View Details',
    apply: 'Apply Now',
    applyNow: 'Apply Now',
    applied: 'Applied',
    callEmployer: 'Call Employer',
    callCustomer: 'Call Customer',
    sendWhatsApp: 'Send WhatsApp Reminder',

    // Nav & Shell
    overview: 'Overview',
    dashboard: 'Dashboard',
    jobsAndApplicants: 'Jobs & Applicants',
    jobs: 'Jobs',
    inventory: 'Inventory',
    customers: 'Customers',
    udhaar: 'Udhaar Ledger',
    sales: 'Sales & POS',
    notifications: 'Notifications',
    settings: 'Settings',
    profile: 'My Profile',
    applications: 'Applications',
    myApplications: 'My Applications',
    businesses: 'Businesses',
    users: 'Users',
    moderation: 'Moderation',
    adminPanel: 'Admin Panel',

    // Role Names
    workerRole: 'Worker (Skilled Craftsman)',
    businessRole: 'Business Owner (Merchant)',
    adminRole: 'Administrator',
    merchantHub: 'Merchant Hub',
    workerSpace: 'Worker Space',
    adminControl: 'Admin Control Panel',

    // Business Dashboard Modules
    welcomeBack: 'Welcome back',
    businessCategory: 'Category',
    businessLocation: 'Location',
    quickActions: 'Quick Actions',
    todaysSales: "Today's Sales",
    totalRevenue: 'Total Revenue',
    totalSales: 'Total Sales',
    totalProducts: 'Total Products',
    totalCustomers: 'Total Customers',
    outstandingCredit: 'Total Outstanding Udhaar',
    outstandingUdhaar: 'Outstanding Udhaar',
    lowStockItems: 'Low Stock Alerts',
    activeJobs: 'Active Job Listings',
    recordCredit: 'Give Udhaar (Credit)',
    recordRepayment: 'Record Repayment (Jama)',
    recordSale: 'New Sale',
    billsToday: 'bills today',
    totalRecordedSales: 'sales recorded',
    acrossCustomers: 'across customers',
    itemsNeedRestock: 'items need reorder',
    salesPerformance: 'Sales Performance Breakdown',
    salesByPaymentMethod: 'Sales by Payment Method',
    cashSales: 'Cash',
    upiSales: 'UPI / Online',
    creditSales: 'Udhaar (Credit)',
    inventoryAlerts: 'Inventory Alerts & Restock',
    threshold: 'Threshold',
    inStockCount: 'in stock',
    recentTransactions: 'Recent Counter Bills',
    counterWalkIn: 'Counter Walk-in',
    outstandingUdhaarSummary: 'Outstanding Udhaar Ledger',
    totalMarketCredit: 'Total Market Credit',
    netBalance: 'Net Balance',
    recentApplications: 'Recent Worker Applications',
    appliedFor: 'Applied for',
    noSalesYet: 'No sales recorded yet',
    noSalesDesc: 'Open the counter POS to generate your first bill.',
    noApplicationsYet: 'No worker applications yet',
    noApplicationsDesc: 'Post a job opening and local workers will apply.',
    noInventoryAlerts: 'All products are safely stocked above thresholds.',

    // Worker Dashboard Modules
    welcomeWorker: 'Welcome back',
    profileCompleteness: 'Profile Completeness',
    availableForWork: 'Available for New Work',
    currentlyBusy: 'Currently Busy / Unavailable',
    availabilityStatus: 'Availability Status',
    totalApplied: 'Total Applied',
    acceptedHired: 'Accepted / Hired',
    pendingReview: 'Pending Review',
    digitalSkillCard: 'Digital Skill Identity',
    verifiedTrades: 'Registered Trades & Skills',
    workCraftVideo: '15-Second Work Craftsmanship Video',
    videoVerified: 'Skill Verified via Video',
    experience: 'Experience',
    experienceYears: 'Years of Experience',
    skills: 'Skills',
    location: 'Location',
    recommendedJobs: 'Recommended Openings Near You',
    lockedWageNotice: 'Wage Locked & Guaranteed',
    dailyWage: 'Daily Wage',
    perDay: '/ day',
    fixedWage: 'fixed total',
    noJobsFound: 'No jobs match your filters right now.',
    noApplicationsSubmitted: 'You have not applied for any jobs yet.',
    startApplyingDesc: 'Browse open listings nearby and apply in 1-click.',

    // Forms, Badges & Labels
    fullName: 'Full Name',
    phoneNumber: 'Mobile Phone',
    city: 'City',
    locality: 'Locality / Area',
    requiredSkills: 'Required Trades',
    wageAmount: 'Offered Wage (₹)',
    jobType: 'Job Type',
    description: 'Description',
    status: 'Status',
    open: 'Open',
    filled: 'Filled',
    closed: 'Closed',
    pending: 'Pending',
    accepted: 'Accepted',
    rejected: 'Rejected',
    inStock: 'In Stock',
    lowStock: 'Low Stock',
    outOfStock: 'Out of Stock',
    cash: 'Cash',
    upi: 'UPI',
    credit: 'Udhaar (Credit)',
    unitPrice: 'Unit Price',
    sellingPrice: 'Selling Price',
    quantity: 'Quantity',
    customerName: 'Customer Name',
    amount: 'Amount (₹)',
    paymentMethod: 'Payment Method',
    date: 'Date',
    notes: 'Notes / Remarks',

    // Footer & Marketing
    howItWorks: 'How KaamSetu Works in 3 Steps',
    step1Title: 'Sign Up in 30 Seconds',
    step1Desc: 'Enter your phone number and choose your role. No complex paperwork required.',
    step2Title: 'Connect or Manage',
    step2Desc: 'Workers discover local daily work; merchants log sales and manage customer credit.',
    step3Title: 'Grow Local Trust',
    step3Desc: 'Zero calculation losses, clear worker wages, and strong local community commerce.',
    readyToGetStarted: 'Ready to modernize your daily work or local business?',
    joinThousands: 'Join thousands of workers and shopkeepers across Gujarat.',
    copyright: '© 2026 KaamSetu. Empowering Local Employment & Commerce. All rights reserved.',
  },

  hi: {
    // Brand & Meta
    appName: 'कामसेतु',
    tagline: 'अवसरों को जोड़ना। स्थानीय व्यापार को सशक्त बनाना।',
    heroBadge: 'स्थानीय रोज़गार और छोटे व्यापार का डिजिटल मंच',
    heroTitle: 'कारीगरों के लिए रोज़गार। व्यापारियों के लिए सरलता।',
    heroSubtitle:
      'कामसेतु कुशल कारीगरों को सुरक्षित रोज़गार से जोड़ता है और छोटे दुकानदारों को इन्वेंट्री, दैनिक बिक्री और ग्राहक उधार खाता (बहीखाता) एक ही सरल मंच पर संभालने में मदद करता है।',

    // Primary Actions
    findWork: 'काम ढूंढें',
    manageBusiness: 'दुकान संभालें',
    login: 'लॉग इन करें',
    register: 'नया खाता बनाएं',
    logout: 'लॉग आउट',
    getStarted: 'निःशुल्क शुरू करें',
    exploreJobs: 'नौकरियां खोजें',
    postJob: 'नई भर्ती निकालें',
    addSale: 'नया बिल (बिक्री)',
    addProduct: 'नया सामान जोड़ें',
    addCustomer: 'नया ग्राहक जोड़ें',
    voiceEntry: 'बोलकर लिखें',
    quickVoiceEntry: 'बोलकर लिखें (वॉइस असिस्टेंट)',
    voiceHelpText: 'हिंदी या अंग्रेजी में बोलें। जैसे: "रमेश को 500 रुपये उधार लिखो"',
    listening: 'सुन रहा है...',
    startVoice: 'आवाज शुरू करें',
    stopVoice: 'रोकें',
    voiceHint: 'हिंदी या अंग्रेजी में बोलें',
    saveChanges: 'बदलाव सहेजें',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    search: 'खोजें',
    searchPlaceholder: 'नौकरी, ग्राहक, सामान खोजें...',
    filter: 'फ़िल्टर',
    all: 'सभी',
    viewAll: 'सभी देखें',
    viewDetails: 'विवरण देखें',
    apply: 'आवेदन करें',
    applyNow: 'आवेदन करें',
    applied: 'आवेदन किया गया',
    callEmployer: 'मालिक को कॉल करें',
    callCustomer: 'ग्राहक को कॉल करें',
    sendWhatsApp: 'व्हाट्सएप पर तगादा भेजें',

    // Nav & Shell
    overview: 'डैशबोर्ड अवलोकन',
    dashboard: 'डैशबोर्ड',
    jobsAndApplicants: 'नौकरियां व आवेदक',
    jobs: 'नौकरियां',
    inventory: 'स्टॉक / इन्वेंट्री',
    customers: 'ग्राहक सूची',
    udhaar: 'उधार बहीखाता',
    sales: 'बिक्री और बिलिंग',
    notifications: 'सूचनाएं',
    settings: 'सेटिंग्स',
    profile: 'मेरी प्रोफ़ाइल',
    applications: 'मेरे आवेदन',
    myApplications: 'मेरे आवेदन',
    businesses: 'दुकानें / प्रतिष्ठान',
    users: 'उपयोगकर्ता',
    moderation: 'समीक्षा / नियंत्रण',
    adminPanel: 'एडमिन पैनल',

    // Role Names
    workerRole: 'कारीगर / श्रमिक (काम की तलाश)',
    businessRole: 'व्यापारी / दुकानदार (मालिक)',
    adminRole: 'प्रशासक (एडमिन)',
    merchantHub: 'व्यापार केंद्र (दुकानदार)',
    workerSpace: 'कारीगर मंच (श्रमिक)',
    adminControl: 'एडमिन नियंत्रण कक्ष',

    // Business Dashboard Modules
    welcomeBack: 'वापसी पर स्वागत है',
    businessCategory: 'व्यापार श्रेणी',
    businessLocation: 'स्थान',
    quickActions: 'त्वरित कार्य',
    todaysSales: 'आज की कुल बिक्री',
    totalRevenue: 'कुल दर्ज बिक्री',
    totalSales: 'कुल दर्ज बिक्री',
    totalProducts: 'कुल उत्पाद संख्या',
    totalCustomers: 'कुल ग्राहक संख्या',
    outstandingCredit: 'बाजार का कुल उधार',
    outstandingUdhaar: 'बाजार का कुल उधार',
    lowStockItems: 'कम स्टॉक चेतावनी',
    activeJobs: 'सक्रिय नौकरियां',
    recordCredit: 'उधार दें (क्रेडिट)',
    recordRepayment: 'जमा लें (जमा)',
    recordSale: 'नई बिक्री',
    billsToday: 'बिल आज कटे',
    totalRecordedSales: 'कुल बिक्री रिकॉर्ड',
    acrossCustomers: 'ग्राहकों पर बकाया',
    itemsNeedRestock: 'सामान मंगाना जरूरी',
    salesPerformance: 'बिक्री माध्यम विश्लेषण',
    salesByPaymentMethod: 'भुगतान के साधन अनुसार बिक्री',
    cashSales: 'नकद (Cash)',
    upiSales: 'यूपीआई / ऑनलाइन',
    creditSales: 'उधार (Udhaar)',
    inventoryAlerts: 'स्टॉक चेतावनी और पुनः ऑर्डर',
    threshold: 'न्यूनतम सीमा',
    inStockCount: 'बचा हुआ स्टॉक',
    recentTransactions: 'हाल के बिक्री बिल',
    counterWalkIn: 'दुकान ग्राहक (काउंटर)',
    outstandingUdhaarSummary: 'उधार बहीखाता सारांश',
    totalMarketCredit: 'कुल दिया गया उधार',
    netBalance: 'शुद्ध बकाया राशि',
    recentApplications: 'कारीगरों के हालिया आवेदन',
    appliedFor: 'के लिए आवेदन किया',
    noSalesYet: 'अभी तक कोई बिक्री दर्ज नहीं हुई है',
    noSalesDesc: 'पहला बिल बनाने के लिए बिलिंग काउंटर खोलें।',
    noApplicationsYet: 'अभी कोई नया आवेदन नहीं आया है',
    noApplicationsDesc: 'नौकरी पोस्ट करें, आसपास के कारीगर आवेदन करेंगे।',
    noInventoryAlerts: 'सभी सामान पर्याप्त मात्रा में स्टॉक में उपलब्ध हैं।',

    // Worker Dashboard Modules
    welcomeWorker: 'स्वागत है',
    profileCompleteness: 'प्रोफ़ाइल पूर्णता',
    availableForWork: 'नए काम के लिए उपलब्ध',
    currentlyBusy: 'वर्तमान में व्यस्त / अनुपलब्ध',
    availabilityStatus: 'उपलब्धता स्थिति',
    totalApplied: 'कुल आवेदन किए गए',
    acceptedHired: 'चयनित / काम मिला',
    pendingReview: 'समीक्षाधीन (प्रतीक्षा)',
    digitalSkillCard: 'डिजिटल कारीगर पहचान-पत्र',
    verifiedTrades: 'पंजीकृत हुनर व काम',
    workCraftVideo: '15-सेकंड काम का वीडियो प्रमाण',
    videoVerified: 'वीडियो द्वारा हुनर सत्यापित',
    experience: 'कार्य अनुभव',
    experienceYears: 'कार्य अनुभव (वर्ष)',
    skills: 'हुनर व कौशल',
    location: 'स्थान',
    recommendedJobs: 'आपके लिए उपयुक्त नौकरियां',
    lockedWageNotice: 'मजदूरी सुरक्षित व निर्धारित',
    dailyWage: 'दैनिक मजदूरी',
    perDay: '/ दिन',
    fixedWage: 'निश्चित कुल भुगतान',
    noJobsFound: 'इस समय कोई उपयुक्त नौकरी उपलब्ध नहीं है।',
    noApplicationsSubmitted: 'आपने अभी तक किसी काम के लिए आवेदन नहीं किया है।',
    startApplyingDesc: 'आस-पास उपलब्ध काम देखें और 1-क्लिक में आवेदन करें।',

    // Forms, Badges & Labels
    fullName: 'पूरा नाम',
    phoneNumber: 'मोबाइल नंबर',
    city: 'शहर',
    locality: 'इलाका / मोहल्ला',
    requiredSkills: 'आवश्यक हुनर / काम',
    wageAmount: 'प्रस्तावित मजदूरी (₹)',
    jobType: 'काम का प्रकार',
    description: 'काम का विवरण',
    status: 'स्थिति',
    open: 'सक्रिय / चालू',
    filled: 'पूर्ण',
    closed: 'बंद / पूर्ण',
    pending: 'लंबित',
    accepted: 'स्वीकृत',
    rejected: 'अस्वीकृत',
    inStock: 'उपलब्ध',
    lowStock: 'कम स्टॉक',
    outOfStock: 'खत्म हो गया',
    cash: 'नकद',
    upi: 'यूपीआई',
    credit: 'उधार (क्रेडिट)',
    unitPrice: 'खरीद मूल्य',
    sellingPrice: 'बिक्री मूल्य',
    quantity: 'मात्रा',
    customerName: 'ग्राहक का नाम',
    amount: 'रकम (₹)',
    paymentMethod: 'भुगतान माध्यम',
    date: 'तारीख',
    notes: 'टिप्पणी / विवरण',

    // Footer & Marketing
    howItWorks: 'कामसेतु 3 आसान चरणों में कैसे काम करता है',
    step1Title: '30 सेकंड में खाता बनाएं',
    step1Desc: 'अपना मोबाइल नंबर दर्ज करें और अपनी भूमिका चुनें। कोई जटिल कागजी कार्रवाई नहीं।',
    step2Title: 'काम खोजें या व्यापार संभालें',
    step2Desc: 'कारीगर दैनिक काम ढूंढते हैं; दुकानदार बिल बनाते हैं और ग्राहक का उधार दर्ज करते हैं।',
    step3Title: 'स्थानीय विश्वास और तरक्की',
    step3Desc: 'हिसाब में शून्य गलती, कारीगरों को समय पर पक्की मजदूरी, और बढ़ता हुआ स्थानीय व्यापार।',
    readyToGetStarted: 'क्या आप अपने दैनिक काम या दुकान को आधुनिक बनाने के लिए तैयार हैं?',
    joinThousands: 'गुजरात भर के हजारों कारीगरों और व्यापारियों के साथ जुड़ें।',
    copyright: '© 2026 कामसेतु। स्थानीय रोज़गार और व्यापार सशक्तिकरण मंच। सर्वाधिकार सुरक्षित।',
  },
};
