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
  merchantHub: string;
  workerSpace: string;
  adminControl: string;
  users: string;
  businesses: string;
  moderation: string;

  // Advanced Modules
  workAssignments: string;
  attendance: string;
  checkIn: string;
  checkOut: string;
  hoursWorked: string;
  wagesAndEarnings: string;
  earnings: string;
  totalEarned: string;
  pendingWages: string;
  paidWages: string;
  recordPayment: string;
  suppliers: string;
  purchases: string;
  expenses: string;
  profitAndLoss: string;
  grossProfit: string;
  netOperatingResult: string;
  disputes: string;
  fileDispute: string;
  verification: string;
  verified: string;
  ratingsAndReviews: string;
  rateAndReview: string;
  savedJobs: string;
  assignWork: string;
  scheduleWork: string;
  directAssignWorker: string;
  assignFromApplicants: string;
  selectJob: string;
  selectWorker: string;
  agreedWage: string;
  startDate: string;
  endDate: string;
  workAssignedSuccess: string;
  workAlreadyAssigned: string;

  // Roles & Panels
  workerRole: string;
  businessRole: string;
  adminRole: string;
  adminPanel: string;
  totalMarketCredit: string;
  businessCategory: string;
  businessLocation: string;

  // Dashboard & Metrics
  todaySales: string;
  monthlyRevenue: string;
  inventoryAlerts: string;
  totalCustomers: string;
  totalUdhaar: string;
  activeJobs: string;
  totalApplied: string;
  acceptedHired: string;
  pendingReview: string;
  profileCompleteness: string;
  availableForWork: string;
  currentlyBusy: string;
  welcomeWorker: string;
  welcomeMerchant: string;

  // Additional Dashboard & Analytics Keys
  welcomeBack: string;
  quickActions: string;
  todaysSales: string;
  totalRevenue: string;
  totalSales: string;
  totalProducts: string;
  outstandingCredit: string;
  outstandingUdhaar: string;
  lowStockItems: string;
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
  threshold: string;
  inStockCount: string;
  recentTransactions: string;
  counterWalkIn: string;
  outstandingUdhaarSummary: string;
  netBalance: string;
  recentApplications: string;
  appliedFor: string;
  noSalesYet: string;
  noSalesDesc: string;
  noApplicationsYet: string;
  noApplicationsDesc: string;
  noInventoryAlerts: string;
  availabilityStatus: string;
  digitalSkillCard: string;
  verifiedTrades: string;
  workCraftVideo: string;

  // Marketplace & Jobs
  digitalSkillProfile: string;
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
    appName: 'KaamSetu',
    tagline: 'Bridging Daily Wage Labor & Empowering Local Small Businesses Across India',
    heroBadge: 'Track 1 — Daily Workers & Local Retail Operations',
    heroTitle: 'Fair Wages for Daily Workers. Frictionless Ledgers for Local Shops.',
    heroSubtitle:
      'A unified digital platform connecting daily-wage tradespeople with verified employers nearby, while giving small shopkeepers voice-driven Udhaar ledgers and atomic inventory billing.',

    findWork: 'Find Work Nearby',
    manageBusiness: 'Manage My Shop',
    login: 'Sign In',
    register: 'Create Free Account',
    logout: 'Log Out',
    getStarted: 'Get Started Now',
    exploreJobs: 'Explore Jobs',
    postJob: 'Post a Job Opening',
    addSale: 'Record New Sale',
    addProduct: 'Add Product Item',
    addCustomer: 'Add Customer',
    voiceEntry: 'Voice Entry',
    quickVoiceEntry: 'Quick Voice Bill & Udhaar',
    voiceHelpText: 'Speak naturally in Hindi or English (e.g. "Ramesh ko 500 rupay udhaar likho")',
    listening: 'Listening to your command...',
    startVoice: 'Tap to Speak',
    stopVoice: 'Stop Recording',
    voiceHint: 'Say: "Ramesh ko 500 rupay udhaar likho" or "Suresh 200 jama kiye"',
    saveChanges: 'Save Changes',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search',
    searchPlaceholder: 'Search by trade, product, phone or name...',
    filter: 'Filter',
    all: 'All',
    viewAll: 'View All',
    viewDetails: 'View Details',
    apply: 'Apply',
    applyNow: 'Apply in 1-Click',
    applied: 'Applied',
    callEmployer: 'Call Employer',
    callCustomer: 'Call Customer',
    sendWhatsApp: 'Send WhatsApp Reminder',

    overview: 'Overview',
    dashboard: 'Dashboard',
    jobsAndApplicants: 'Jobs & Hiring',
    jobs: 'Jobs',
    inventory: 'Inventory & Stock',
    customers: 'Customer Ledger',
    udhaar: 'Smart Udhaar (Credit)',
    sales: 'Point of Sale (POS)',
    notifications: 'Notifications',
    settings: 'Settings',
    profile: 'Profile',
    applications: 'Applications',
    myApplications: 'My Applications',
    merchantHub: 'Merchant Operations Hub',
    workerSpace: 'Worker Skill Workspace',
    adminControl: 'Platform Administration',
    users: 'Users',
    businesses: 'Businesses',
    moderation: 'Moderation',

    workAssignments: 'Work Assignments',
    attendance: 'Digital Attendance',
    checkIn: 'Check In',
    checkOut: 'Check Out',
    hoursWorked: 'Hours Worked',
    wagesAndEarnings: 'Wages & Earnings',
    earnings: 'Earnings',
    totalEarned: 'Total Earned',
    pendingWages: 'Pending Wages',
    paidWages: 'Paid Wages',
    recordPayment: 'Record Payment',
    suppliers: 'Suppliers',
    purchases: 'Purchases & Stock In',
    expenses: 'Business Expenses',
    profitAndLoss: 'Profit & Loss',
    grossProfit: 'Gross Profit',
    netOperatingResult: 'Net Operating Result',
    disputes: 'Disputes & Safety',
    fileDispute: 'Report Issue / Dispute',
    verification: 'Trust & Verification',
    verified: 'Verified',
    ratingsAndReviews: 'Ratings & Reviews',
    rateAndReview: 'Rate & Review',
    savedJobs: 'Saved Jobs',
    assignWork: 'Assign Work',
    scheduleWork: 'Schedule Work Assignment',
    directAssignWorker: 'Direct Worker Assignment (Quick Hire)',
    assignFromApplicants: 'Assign from Job Applicants',
    selectJob: 'Select Job Listing',
    selectWorker: 'Select Worker',
    agreedWage: 'Agreed Wage (₹)',
    startDate: 'Work Start Date',
    endDate: 'Expected End Date (Optional)',
    workAssignedSuccess: 'Work assigned successfully! Worker notified.',
    workAlreadyAssigned: 'Work already assigned',

    workerRole: 'Daily Wage Workers',
    businessRole: 'Local Businesses',
    adminRole: 'System Administrator',
    adminPanel: 'Admin Panel',
    totalMarketCredit: 'Total Market Credit',
    businessCategory: 'Business Category',
    businessLocation: 'Business Location',

    todaySales: "Today's Sales",
    monthlyRevenue: 'Monthly Revenue',
    inventoryAlerts: 'Low Stock Alerts',
    totalCustomers: 'Active Customers',
    totalUdhaar: 'Outstanding Udhaar',
    activeJobs: 'Active Job Openings',
    totalApplied: 'Total Jobs Applied',
    acceptedHired: 'Accepted / Hired',
    pendingReview: 'Under Review',
    profileCompleteness: 'Profile Completeness',
    availableForWork: 'Available for Immediate Work',
    currentlyBusy: 'Currently Working / Busy',
    welcomeWorker: 'Welcome back',
    welcomeMerchant: 'Store Dashboard',

    welcomeBack: 'Welcome back',
    quickActions: 'Quick Actions',
    todaysSales: "Today's Sales",
    totalRevenue: 'Total Revenue',
    totalSales: 'Total Sales',
    totalProducts: 'Products',
    outstandingCredit: 'Outstanding Credit',
    outstandingUdhaar: 'Outstanding Udhaar',
    lowStockItems: 'Low Stock Items',
    recordCredit: 'Record Udhaar',
    recordRepayment: 'Record Repayment',
    recordSale: 'New Bill / Sale',
    billsToday: 'Bills Today',
    totalRecordedSales: 'All-time sales recorded',
    acrossCustomers: 'Across all active credit accounts',
    itemsNeedRestock: 'Items needing replenishment',
    salesPerformance: 'Sales Performance',
    salesByPaymentMethod: 'Breakdown by tender type',
    cashSales: 'Cash Receipts',
    upiSales: 'UPI & Digital',
    creditSales: 'Udhaar / Store Credit',
    threshold: 'Threshold',
    inStockCount: 'units in stock',
    recentTransactions: 'Recent Transactions',
    counterWalkIn: 'Counter Walk-in',
    outstandingUdhaarSummary: 'Outstanding Udhaar Summary',
    netBalance: 'Net Balance',
    recentApplications: 'Recent Job Applicants',
    appliedFor: 'Applied for',
    noSalesYet: 'No sales recorded yet',
    noSalesDesc: 'Record your first sale using quick voice entry or POS billing.',
    noApplicationsYet: 'No applications yet',
    noApplicationsDesc: 'Applicants will appear here once candidates apply to your jobs.',
    noInventoryAlerts: 'All inventory items are well-stocked above thresholds.',
    availabilityStatus: 'Availability Status',
    digitalSkillCard: 'Digital Skill Passport',
    verifiedTrades: 'Verified Trade Skills',
    workCraftVideo: 'Video Demonstration of Work',

    digitalSkillProfile: 'Digital Skill Passport',
    videoVerified: 'Skill Verified via Video Proof',
    experience: 'Experience',
    experienceYears: 'Years Experience',
    skills: 'Registered Skills',
    location: 'Location',
    recommendedJobs: 'Recommended Opportunities',
    lockedWageNotice: 'Locked Daily Wage Guarantee',
    dailyWage: 'Daily Wage',
    perDay: '/ day',
    fixedWage: 'Fixed Payment',
    noJobsFound: 'No jobs match your filter criteria.',
    noApplicationsSubmitted: 'You have not submitted any applications yet.',
    startApplyingDesc: 'Explore active job openings nearby and apply in 1-click.',

    fullName: 'Full Legal Name',
    phoneNumber: 'Mobile Phone Number',
    city: 'City',
    locality: 'Locality / Area',
    requiredSkills: 'Required Skills & Trade',
    wageAmount: 'Offered Wage (₹)',
    jobType: 'Job Arrangement',
    description: 'Work Description',
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
    upi: 'UPI / QR',
    credit: 'Udhaar (Credit)',
    unitPrice: 'Unit Price',
    sellingPrice: 'Selling Price',
    quantity: 'Quantity',
    customerName: 'Customer Name',
    amount: 'Amount (₹)',
    paymentMethod: 'Payment Method',
    date: 'Date',
    notes: 'Notes & Remarks',

    howItWorks: 'How KaamSetu Works in 3 Simple Steps',
    step1Title: 'Create Account in 30 Seconds',
    step1Desc: 'Enter your mobile number and select your role as a Worker or Business Owner. No complex paperwork.',
    step2Title: 'Find Work or Run Your Shop',
    step2Desc: 'Workers discover local verified jobs with wage locks; shopkeepers bill POS orders and track Udhaar.',
    step3Title: 'Grow Local Trust & Dignity',
    step3Desc: 'Zero calculation errors, on-time daily wages, WhatsApp payment reminders, and thriving local commerce.',
    readyToGetStarted: 'Ready to modernize your daily trade or small business?',
    joinThousands: 'Join thousands of skilled workers and shopkeepers across Gujarat and India.',
    copyright: '© 2026 KaamSetu. Local Employment & Small Business Empowerment. All rights reserved.',
  },

  hi: {
    appName: 'कामसेतु',
    tagline: 'दैनिक श्रमिकों को सम्मानजनक रोज़गार और स्थानीय व्यापारियों को डिजिटल सशक्तिकरण',
    heroBadge: 'ट्रैक 1 — दैनिक श्रमिक, रेहड़ी-पटरी व छोटे दुकानदार',
    heroTitle: 'कारीगरों को पक्की मजदूरी। दुकानदारों को आसान डिजिटल हिसाब।',
    heroSubtitle:
      'दैनिक कारीगरों को आस-पास के सत्यापित काम से जोड़ने और छोटे दुकानदारों को बोलकर उधार लिखने व स्टॉक प्रबंधन की आधुनिक सुविधा देने वाला भारत का भरोसेमंद मंच।',

    findWork: 'आस-पास काम खोजें',
    manageBusiness: 'मेरी दुकान संभालें',
    login: 'लॉग इन करें',
    register: 'नया खाता बनाएं',
    logout: 'लॉग आउट',
    getStarted: 'अभी शुरू करें',
    exploreJobs: 'नौकरियां देखें',
    postJob: 'नया काम पोस्ट करें',
    addSale: 'बिक्री दर्ज करें',
    addProduct: 'सामान जोड़ें',
    addCustomer: 'ग्राहक जोड़ें',
    voiceEntry: 'बोलकर लिखें',
    quickVoiceEntry: 'बोलकर बिल व उधार दर्ज करें',
    voiceHelpText: 'सीधे हिंदी में बोलें: "रमेश को 500 रुपये उधार लिखो" या "सुरेश 200 जमा किए"',
    listening: 'आपकी आवाज़ सुन रहे हैं...',
    startVoice: 'बोलने के लिए दबाएं',
    stopVoice: 'रोकें',
    voiceHint: 'उदाहरण: "रमेश को 500 रुपये उधार लिखो" या "सुरेश ने 200 रुपये जमा किए"',
    saveChanges: 'बदलाव सुरक्षित करें',
    save: 'सुरक्षित करें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    search: 'खोजें',
    searchPlaceholder: 'हुनर, सामान, मोबाइल या नाम से खोजें...',
    filter: 'फ़िल्टर',
    all: 'सभी',
    viewAll: 'सभी देखें',
    viewDetails: 'विवरण देखें',
    apply: 'आवेदन करें',
    applyNow: '1-क्लिक में आवेदन करें',
    applied: 'आवेदन किया गया',
    callEmployer: 'मालिक को कॉल करें',
    callCustomer: 'ग्राहक को कॉल करें',
    sendWhatsApp: 'व्हाट्सएप पर तगादा भेजें',

    overview: 'विवरण',
    dashboard: 'डैशबोर्ड',
    jobsAndApplicants: 'काम और कारीगर',
    jobs: 'नौकरियां',
    inventory: 'स्टॉक व सामान',
    customers: 'ग्राहक बही-खाता',
    udhaar: 'स्मार्ट उधार खाता',
    sales: 'दुकान बिलिंग (POS)',
    notifications: 'सूचनाएं',
    settings: 'सेटिंग्स',
    profile: 'प्रोफ़ाइल',
    applications: 'आवेदन',
    myApplications: 'मेरे आवेदन',
    merchantHub: 'दुकानदार केंद्र',
    workerSpace: 'कारीगर केंद्र',
    adminControl: 'प्रशासन नियंत्रण',
    users: 'उपयोगकर्ता',
    businesses: 'दुकानें व व्यापार',
    moderation: 'समीक्षा व नियंत्रण',

    workAssignments: 'कार्य आवंटन',
    attendance: 'डिजिटल हाजिरी',
    checkIn: 'चेक इन',
    checkOut: 'चेक आउट',
    hoursWorked: 'काम के घंटे',
    wagesAndEarnings: 'मजदूरी व कमाई',
    earnings: 'कुल कमाई',
    totalEarned: 'कुल अर्जित मजदूरी',
    pendingWages: 'बाकी मजदूरी',
    paidWages: 'प्राप्त मजदूरी',
    recordPayment: 'भुगतान दर्ज करें',
    suppliers: 'सप्लायर / थोक व्यापारी',
    purchases: 'खरीद व नया स्टॉक',
    expenses: 'दुकान के खर्चे',
    profitAndLoss: 'लाभ व हानि',
    grossProfit: 'सकल लाभ (Gross Profit)',
    netOperatingResult: 'शुद्ध परिणाम (Net Operating)',
    disputes: 'विवाद व सुरक्षा',
    fileDispute: 'शिकायत / विवाद दर्ज करें',
    verification: 'विश्वास व सत्यापन',
    verified: 'सत्यापित',
    ratingsAndReviews: 'रेटिंग व समीक्षा',
    rateAndReview: 'रेटिंग दें',
    savedJobs: 'सेव की गई नौकरियां',
    assignWork: 'काम सौंपें (असाइन करें)',
    scheduleWork: 'कार्य आवंटन शेड्यूल करें',
    directAssignWorker: 'सीधा कारीगर आवंटन (त्वरित भर्ती)',
    assignFromApplicants: 'आवेदक सूची से काम सौंपें',
    selectJob: 'नौकरी का चयन करें',
    selectWorker: 'कारीगर का चयन करें',
    agreedWage: 'तय मजदूरी (₹)',
    startDate: 'काम शुरू होने की तारीख',
    endDate: 'समाप्ति की संभावित तारीख (वैकल्पिक)',
    workAssignedSuccess: 'काम सफलतापूर्वक सौंपा गया! कारीगर को सूचना भेज दी गई है।',
    workAlreadyAssigned: 'काम पहले से सौंपा गया है',

    workerRole: 'दैनिक कामगार / कारीगर',
    businessRole: 'स्थानीय व्यापार / दुकानदार',
    adminRole: 'सिस्टम प्रशासक',
    adminPanel: 'एडमिन पैनल',
    totalMarketCredit: 'कुल बाज़ार उधारी',
    businessCategory: 'व्यापार श्रेणी',
    businessLocation: 'दुकान का पता',

    todaySales: 'आज की कुल बिक्री',
    monthlyRevenue: 'मासिक आमदनी',
    inventoryAlerts: 'कम स्टॉक चेतावनी',
    totalCustomers: 'सक्रिय ग्राहक',
    totalUdhaar: 'मार्केट में कुल बाकी उधार',
    activeJobs: 'सक्रिय काम की रिक्तियां',
    totalApplied: 'कुल आवेदन',
    acceptedHired: 'स्वीकृत / काम मिला',
    pendingReview: 'समीक्षाधीन',
    profileCompleteness: 'प्रोफ़ाइल पूर्णता',
    availableForWork: 'तुरंत काम के लिए उपलब्ध',
    currentlyBusy: 'अभी काम पर व्यस्त',
    welcomeWorker: 'स्वागत है',
    welcomeMerchant: 'दुकान डैशबोर्ड',

    welcomeBack: 'वापसी पर स्वागत है',
    quickActions: 'त्वरित कार्य',
    todaysSales: 'आज की बिक्री',
    totalRevenue: 'कुल आमदनी',
    totalSales: 'कुल बिक्री',
    totalProducts: 'सामान',
    outstandingCredit: 'बाकी उधार',
    outstandingUdhaar: 'बाकी उधार',
    lowStockItems: 'कम स्टॉक सामान',
    recordCredit: 'उधार दर्ज करें',
    recordRepayment: 'जमा दर्ज करें',
    recordSale: 'नया बिल / बिक्री',
    billsToday: 'आज के बिल',
    totalRecordedSales: 'अब तक दर्ज कुल बिक्री',
    acrossCustomers: 'सभी खाताधारकों में',
    itemsNeedRestock: 'सामान जिसे दोबारा मंगाना है',
    salesPerformance: 'बिक्री का प्रदर्शन',
    salesByPaymentMethod: 'भुगतान के माध्यम अनुसार',
    cashSales: 'नकद बिक्री',
    upiSales: 'यूपीआई व डिजिटल',
    creditSales: 'उधार बिक्री',
    threshold: 'सीमा',
    inStockCount: 'यूनिट स्टॉक में',
    recentTransactions: 'हाल के लेन-देन',
    counterWalkIn: 'काउंटर ग्राहक',
    outstandingUdhaarSummary: 'बाकी उधार विवरण',
    netBalance: 'कुल शेष',
    recentApplications: 'हाल के आवेदक',
    appliedFor: 'के लिए आवेदन किया',
    noSalesYet: 'अभी कोई बिक्री दर्ज नहीं है',
    noSalesDesc: 'अपनी पहली बिक्री दर्ज करने के लिए बोलकर या पीओएस का उपयोग करें।',
    noApplicationsYet: 'कोई आवेदन नहीं',
    noApplicationsDesc: 'जैसे ही कारीगर आवेदन करेंगे, वे यहां दिखेंगे।',
    noInventoryAlerts: 'सभी सामान पर्याप्त स्टॉक में हैं।',
    availabilityStatus: 'उपलब्धता स्थिति',
    digitalSkillCard: 'डिजिटल हुनर पहचान-पत्र',
    verifiedTrades: 'सत्यापित हुनर',
    workCraftVideo: 'काम का वीडियो प्रमाण',

    digitalSkillProfile: 'डिजिटल हुनर पहचान-पत्र',
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
