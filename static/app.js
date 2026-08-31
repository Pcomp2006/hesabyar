
// ═══ Color themes ═══
let appTheme = (function(){
  try {
    var t = localStorage.getItem('cludari_theme');
    if (t && ['teal','blue','purple','green','orange','rose','slate'].indexOf(t) >= 0) return t;
  } catch(e) {}
  return 'teal';
})();

function setColorTheme(name) {
  if (!name) name = 'teal';
  appTheme = name;
  try { localStorage.setItem('cludari_theme', name); } catch(e) {}
  document.documentElement.setAttribute('data-theme', name);
  document.body.setAttribute('data-theme', name);
  document.querySelectorAll('.theme-swatch').forEach(function(el) {
    el.classList.toggle('active', el.getAttribute('data-t') === name);
  });
  try { playUiSound('click'); } catch(e) {}
}
function applyColorTheme() {
  setColorTheme(appTheme);
}


function showAppLoading(msg) {
  var el = document.getElementById('appLoadingOverlay');
  var tx = document.getElementById('appLoadingText');
  if (tx) tx.textContent = msg || (appLang==='fa' ? 'لطفاً صبر کنید...' : 'Please wait...');
  if (el) el.classList.add('show');
}
function hideAppLoading() {
  var el = document.getElementById('appLoadingOverlay');
  if (el) el.classList.remove('show');
}

function statusLabel(st) {
  st = (st || '').toLowerCase();
  if (st === 'active') return t('status_active');
  if (st === 'paid') return t('status_paid');
  if (st === 'pending' || st === 'unpaid') return t('status_pending');
  if (st === 'partial') return appLang==='fa' ? 'ناقص' : 'partial';
  return st || '—';
}


// ═══ Mahak classic UI helpers ═══
function toggleMahakMenu(btn) {
  var item = btn.closest('.menu-item');
  if (!item) return;
  var wasOpen = item.classList.contains('open');
  closeAllMahakMenus();
  if (!wasOpen) item.classList.add('open');
}
function closeAllMahakMenus() {
  document.querySelectorAll('#mahakMenu .menu-item.open').forEach(function(el) {
    el.classList.remove('open');
  });
}
function ensureMahakChrome() {
  try { var mu = document.getElementById('mhUser'); if (mu) mu.textContent = currentUsername || '—'; } catch(e) {}

  try {
    var shell = document.getElementById('appShell');
    if (!shell) return;
    if (!document.getElementById('mahakStatusBar')) {
      var sb = document.createElement('div');
      sb.id = 'mahakStatusBar';
      sb.className = 'status-bar';
      sb.innerHTML = '<span class="sb-item sb-brand">حساب‌یار محک</span><span class="sb-sep"></span><span class="sb-item" id="sbUser">کاربر: —</span><span class="sb-sep"></span><span class="sb-item" id="sbClock">—</span><span class="sb-sep"></span><span class="sb-item">آماده</span>';
      shell.appendChild(sb);
    }
    // keep brand text
    var brand = document.querySelector('.topbar .brand span');
    if (brand) brand.textContent = 'حساب‌یار محک';
    var u = document.getElementById('sbUser');
    if (u) u.textContent = 'کاربر: ' + (currentUsername || '—');
  } catch(e) { console.warn(e); }
}
document.addEventListener('click', function(e) {
  if (!e.target.closest('#mahakMenu')) closeAllMahakMenus();
});
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeAllMahakMenus();
});

// ═══ Soft UI sounds (WebAudio beeps, no external files) ═══
let _audioCtx = null;
function _getAudio() {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    return _audioCtx;
  } catch (e) { return null; }
}
function playUiSound(kind) {
  /* sound disabled by user request */
  return;
}


// ═══ Auth / i18n / clock ═══
let authToken = localStorage.getItem('cludari_token') || '';
let currentUsername = localStorage.getItem('cludari_user') || '';
let showTrash = false;
let appLang = (function(){
  try { var a = localStorage.getItem('cludari_lang'); if (a==='fa'||a==='en') return a; } catch(e){}
  try { var b = sessionStorage.getItem('cludari_lang'); if (b==='fa'||b==='en') return b; } catch(e){}
  try { var m = document.cookie.match(/(?:^|; )cludari_lang=([^;]*)/); if (m&&(m[1]==='fa'||m[1]==='en')) return m[1]; } catch(e){}
  return 'fa';
})();
if (appLang !== 'fa' && appLang !== 'en') appLang = 'fa';

const I18N = {
  en: {
    login_sub: 'Personal Accounting',
    login_tab: 'Login',
    register_tab: 'New account',
    username: 'Username',
    password: 'Password',
    btn_login: 'Sign in',
    btn_register: 'Create empty account',
    register_hint: 'New accounts start empty (no invoices). The root account keeps all saved data.',
    root_hint: 'Main account: root / root',
    logout: 'Logout',
    backup: 'Backup',
    dark: 'Dark mode',
    light: 'Light mode',
    lang_btn: 'فارسی',
    nav_db: 'Database',
    db_title: 'Database Management',
    db_sub: 'Advanced tools for backup, restore, optimize and inspect',
    refresh: 'Refresh',
    db_info: 'Database info',
    db_actions: 'Actions',
    optimize: 'Optimize (VACUUM)',
    integrity: 'Integrity check',
    reset_db: 'Reset data',
    db_tables: 'Tables',
    db_backups: 'Backup files',
    loading: 'Loading...',
    login_fail: 'Invalid username or password',
    reg_ok: 'Account created',
    reg_fail: 'Could not create account',
    nav_dashboard: 'Dashboard',
    nav_budgets: 'Monthly budget',
    nav_budgets_sub: 'Spending cap',
    nav_goals: 'Savings goals',
    nav_goals_sub: 'Progress',
    env_deposit_enter: 'Depositing',
    env_deposit_sub: 'Rial / FX',
    nav_fx_currencies: 'My currencies',
    btn_add_currency: 'New currency',
    col_code: 'Code',
    col_category: 'Category',
    col_limit: 'Limit',
    col_month: 'Month',
    col_title: 'Title',
    col_target: 'Target',
    col_current: 'Current',
    col_progress: 'Progress',
    col_deadline: 'Deadline',
    btn_add_budget: 'New budget',
    btn_add_goal: 'New goal',
    nav_purchases: 'My Purchases',
    nav_products: 'Product Database',
    nav_sellers: 'Sellers & Partners',
    nav_categories: 'Categories',
    nav_customers: 'Customers',
    nav_documents: 'Documents',
    nav_licenses: 'Licenses',
    nav_reminders: 'Reminders',
    nav_subscriptions: 'Subscriptions',
    nav_bills: 'Bills',
    nav_checks: 'Checks',
    nav_accounts: 'Accounts',
    nav_settings: 'Settings',
    title_dashboard: 'Dashboard',
    title_purchases: 'Purchase ledger',
    title_products: 'Product Database',
    title_sellers: 'Sellers & Partners',
    title_categories: 'Categories',
    title_customers: 'Customers',
    title_documents: 'Documents',
    title_licenses: 'Licenses',
    title_reminders: 'Reminders',
    title_subscriptions: 'Subscriptions',
    title_bills: 'Bills',
    title_checks: 'Checks',
    title_accounts: 'Accounts',
    title_settings: 'Settings',
    btn_new_purchase: 'New purchase',
    btn_new_sale: 'New sale',
    nav_sales: 'My sales',
    col_customer: 'Customer',
    recent_purchases: 'Recent purchases',
    financial_overview: 'Financial overview & recent vouchers',
    stat_vouchers: 'Vouchers',
    stat_turnover: 'Total turnover',
    stat_month: 'Period (month)',
    stat_partners: 'Counterparties',
    col_date: 'Date',
    col_seller: 'Seller',
    col_location: 'Location',
    col_items: 'Items',
    col_amount: 'Amount',
    col_actions: 'Actions',
    col_code: 'Code',
    col_product: 'Product name',
    col_brand: 'Brand',
    col_model: 'Model',
    col_category: 'Category',
    col_name: 'Name',
    col_count: 'Count',
    col_total: 'Total',
    col_last: 'Last purchase',
    col_table: 'Table',
    col_rows: 'Rows',
    col_size: 'Size',
    col_integrity: 'Integrity',
    col_title: 'Title',
    col_description: 'Description',
    col_filetype: 'File type',
    col_status: 'Status',
    col_card: 'Card number',
    col_bank: 'Bank',
    col_type: 'Type',
    col_file: 'File',
    col_qty: 'Qty',
    col_unit_price: 'Unit price',
    btn_search: 'Search',
    btn_export: 'Export Excel',
    btn_add_product: 'Add product',
    btn_add_contact: 'Add contact',
    btn_delete: 'Delete',
    btn_clear: 'Clear',
    btn_view: 'View',
    btn_edit: 'Edit',
    btn_print: 'Print',
    tab_sellers: 'Sellers',
    tab_locations: 'Locations',
    all_categories: 'All categories',
    ph_search: 'Search...',
    ph_search_products: 'Search products...',
    ph_product: 'Product name',
    save: 'Save',
    cancel: 'Cancel',
    main: 'Main',
    parties: 'Parties',
    records: 'Records',
    system: 'System',
    user_info: 'User info',
    export_backup: 'Export & backup',
    settings_sub: 'Profile and app settings',
    lbl_name: 'Name',
    lbl_company: 'Company / store',
    lbl_phone: 'Phone',
    lbl_email: 'Email',
    lbl_address: 'Address',
    lbl_currency: 'Currency',
    lbl_auto_backup: 'Auto backup on exit',
    lbl_date: 'Date',
    lbl_seller: 'Seller',
    lbl_location: 'Location',
    lbl_items: 'Items',
    lbl_code: 'Code',
    lbl_product_name: 'Product name',
    lbl_brand: 'Brand',
    lbl_model: 'Model',
    lbl_category: 'Category',
    lbl_title: 'Title',
    lbl_description: 'Description',
    lbl_type: 'Type',
    lbl_status: 'Status',
    lbl_bank: 'Bank',
    lbl_grand_total: 'Grand total',
    btn_save_settings: 'Save settings',
    btn_db_backup: 'Database backup',
    btn_export_purchases: 'Export purchases (Excel)',
    btn_export_products: 'Export products (Excel)',
    btn_export_sellers: 'Export sellers (Excel)',
    btn_new_document: 'New document',
    btn_new_account: 'New account',
    btn_add_row: 'Row +',
    opt_no: 'No',
    opt_yes: 'Yes',
    count_products: 'Count: {n} products',
    failed_db: 'Failed to load database info',
    tables: 'Tables',
    rows: 'Rows',
    size: 'Size',
    user: 'User',
    file: 'File',
    path: 'Path',
    pages: 'Pages',
    lbl_discount: 'Discount',
    lbl_more_info: 'More information',
    ph_more_info: 'Notes, purchase details...',
    lbl_theme: 'Color theme',
    col_due_date: 'Due date',
    col_expiry: 'Expiry',
    status_pending: 'pending',
    db_integrity: 'Integrity',
    db_rows: 'Rows',
    db_tables: 'Tables',
    db_size: 'Size',
    db_refresh: 'Refresh',

    col_parent: 'Parent',
    col_children: 'Children',
    col_phone: 'Phone',
    col_address: 'Address',
    col_plan: 'Plan',
    col_yearly_price: 'Yearly price',
    col_status: 'Status',
    col_code: 'Code',
    col_name: 'Name',
    col_ops: 'Actions',
    ph_new_category: 'New category name',
    ph_search: 'Search...',
    btn_add: 'Add',
    btn_add_customer: 'New customer',
    btn_add_subscription: 'New subscription',
    status_active: 'active',

    export_hint: 'CSV files open in Excel/Google Sheets. Backups are saved in the backups folder',
    subtotal: 'Subtotal',
    lbl_pay_status: 'Payment',
    lbl_paid_amount: 'Paid amount',
    lbl_due_date: 'Due date',
    lbl_tags: 'Tags',
    audit_title: 'Change history',
    btn_version: 'Version',
    rates_title: 'Exchange rates (to Toman)',
    rates_hint: '1 unit of currency = ? Toman',
    lbl_subtotal: 'Subtotal',
    lbl_total_after_discount: 'Total after discount',
    btn_new_customer: 'New customer',
    btn_new_license: 'New license',
    btn_new_reminder: 'New reminder',
    btn_new_subscription: 'New subscription',
    btn_new_bill: 'New bill',
    btn_new_check: 'New check',
    btn_add: 'Add',
    settings_saved: 'Settings saved',
    settings_error: 'Error saving settings',
    ph_tag: 'Tag',
    ph_min: 'Min',
    ph_max: 'Max',
    home_banner: 'Personal accounting · module shortcuts',
  },
    lbl_license_key: 'License key',
    lbl_yearly_price: 'Yearly price',
    lbl_monthly_price: 'Monthly price',
    lbl_current_balance: 'Current balance',
    lbl_initial_balance: 'Initial balance',
    lbl_meter_number: 'Meter number',
    lbl_bill_number: 'Bill number',
    lbl_amount: 'Amount',
    lbl_color: 'Color',
    lbl_time: 'Time',
    lbl_repeat: 'Repeat',
    lbl_username: 'Username',
    lbl_password: 'Password',
    lbl_expiry: 'Expiry date',
    lbl_card_number: 'Card number',
    lbl_iban: 'IBAN',
    lbl_currency: 'Currency',
    lbl_plan: 'Plan',
    lbl_start: 'Start',
    lbl_renewal: 'Renewal',
    lbl_auto_renew: 'Auto renew',
    edit_account: 'Edit account',
    edit_license: 'Edit license',
    edit_reminder: 'Edit reminder',
    edit_subscription: 'Edit subscription',
    edit_bill: 'Edit bill',
    edit_customer: 'Edit customer',
    edit_document: 'Edit document',
    edit_sale: 'Edit sale',
    new_license: 'New license',
    new_reminder: 'New reminder',
    new_subscription: 'New subscription',
    new_bill: 'New bill',
    new_customer: 'New customer',
    title_sales: 'My sales',

    nav_admissions: 'Admissions',
    btn_new_admission: 'New admission',
    ph_adm_location: 'Ward / clinic',
    ph_adm_patient: 'Patient name',
    ph_adm_nurse: 'Nurse name',
    ph_adm_doctor: 'Doctor name',
    ph_adm_notes: 'Notes, admission remarks...',
    lbl_location: 'Location',
    lbl_date: 'Date',
    lbl_paid_amount: 'Paid amount',
    lbl_more_info: 'More information',
    lbl_items: 'Items',
    lbl_grand_total: 'Grand total',
    btn_add_row: 'Row +',
    save: 'Save',
    cancel: 'Cancel',
    col_qty: 'Qty',
    col_unit_price: 'Unit price',
    col_total: 'Total',

    lbl_work: 'Work',
    col_product: 'Work',
    edit_admission: 'Edit admission',
    lbl_patient_name: 'Full name',
    lbl_nurse: 'Nurse name',
    lbl_doctor: 'Doctor name',
    lbl_stated_amount: 'Stated amount',
    title_admissions: 'Admissions',

    nav_doctors: 'Doctors',
    btn_new_doctor: 'New doctor',
    edit_doctor: 'Edit doctor',
    lbl_specialty: 'Specialty',
    title_doctors: 'Doctors',

    env_clinic_enter: 'Clinic env',
    env_clinic_tag: 'Clinic',
    env_clinic_home: 'Clinic home',
    env_clinic_title: 'Clinic environment',
    env_clinic_sub: 'Admissions only — separate from accounting',
    env_back_accounting: 'Back to accounting',

    env_tile_new_adm: 'Register patient',
    env_tile_adm_list: 'Records',
    env_tile_leave: 'Leave this environment',
    env_clinic_tag: 'Clinic',
    env_clinic_home: 'Clinic home',
    env_clinic_title: 'Clinic environment',
    env_clinic_sub: 'Admissions only — separate from accounting',
    env_back_accounting: 'Back to accounting',
    env_clinic_enter: 'Clinic env',
    user_label: 'User',

  fa: {
    nav_budgets: 'بودجه ماهانه',
    nav_budgets_sub: 'سقف خرج',
    nav_goals: 'اهداف پس‌انداز',
    nav_goals_sub: 'پیشرفت',
    env_deposit_enter: 'سپرده‌گذاری',
    env_deposit_sub: 'ریالی / ارزی',
    nav_fx_currencies: 'ارزهای من',
    btn_add_currency: 'ارز جدید',
    col_code: 'کد',
    col_category: 'دسته',
    col_limit: 'سقف',
    col_month: 'ماه',
    col_title: 'عنوان',
    col_target: 'هدف',
    col_current: 'موجود',
    col_progress: 'پیشرفت',
    col_deadline: 'مهلت',
    btn_add_budget: 'بودجه جدید',
    btn_add_goal: 'هدف جدید',
    login_sub: 'حسابداری شخصی',
    login_tab: 'ورود',
    register_tab: 'حساب جدید',
    username: 'نام کاربری',
    password: 'رمز عبور',
    btn_login: 'ورود',
    btn_register: 'ساخت حساب خالی',
    register_hint: 'حساب جدید بدون فاکتور باز می‌شود. حساب root اطلاعات را نگه می‌دارد.',
    root_hint: 'حساب اصلی: root / root',
    logout: 'خروج',
    backup: 'بکاپ',
    dark: 'حالت شب',
    light: 'حالت روز',
    lang_btn: 'English',
    nav_db: 'پایگاه داده',
    db_title: 'مدیریت پایگاه داده',
    db_sub: 'بکاپ، بازگردانی، بهینه‌سازی و مشاهده جداول',
    refresh: 'بروزرسانی',
    db_info: 'اطلاعات دیتابیس',
    db_actions: 'عملیات',
    optimize: 'بهینه‌سازی (VACUUM)',
    integrity: 'بررسی سلامت',
    reset_db: 'پاک‌سازی داده',
    db_tables: 'جداول',
    db_backups: 'فایل‌های بکاپ',
    loading: 'در حال بارگذاری...',
    login_fail: 'نام کاربری یا رمز اشتباه است',
    reg_ok: 'حساب ساخته شد',
    reg_fail: 'ساخت حساب ناموفق بود',
    nav_dashboard: 'داشبورد',
    nav_purchases: 'خریدهای من',
    nav_products: 'پایگاه کالا',
    nav_sellers: 'فروشندگان',
    nav_categories: 'دسته‌ها',
    nav_customers: 'مشتریان',
    nav_documents: 'اسناد',
    nav_licenses: 'لایسنس‌ها',
    nav_reminders: 'یادآورها',
    nav_subscriptions: 'اشتراک‌ها',
    nav_bills: 'قبوض',
    nav_checks: 'چک‌ها',
    nav_accounts: 'حساب‌ها',
    nav_settings: 'تنظیمات',
    title_dashboard: 'داشبورد',
    title_purchases: 'دفتر خرید',
    title_products: 'پایگاه کالا',
    title_sellers: 'فروشندگان و طرف‌حساب',
    title_categories: 'دسته‌بندی‌ها',
    title_customers: 'مشتریان',
    title_documents: 'اسناد',
    title_licenses: 'لایسنس‌ها',
    title_reminders: 'یادآورها',
    title_subscriptions: 'اشتراک‌ها',
    title_bills: 'قبوض',
    title_checks: 'مدیریت چک‌ها',
    title_accounts: 'حساب‌ها',
    title_settings: 'تنظیمات',
    btn_new_purchase: 'خرید جدید',
    btn_new_sale: 'فروش جدید',
    nav_sales: 'فروش‌های من',
    col_customer: 'مشتری',
    recent_purchases: 'خریدهای اخیر',
    financial_overview: 'نمای کلی مالی و اسناد اخیر',
    stat_vouchers: 'اسناد',
    stat_turnover: 'جمع مبلغ',
    stat_month: 'این ماه',
    stat_partners: 'طرف‌حساب‌ها',
    col_date: 'تاریخ',
    col_seller: 'فروشنده',
    col_location: 'محل',
    col_items: 'اقلام',
    col_amount: 'مبلغ',
    col_actions: 'عملیات',
    col_code: 'کد',
    col_product: 'نام کالا',
    col_brand: 'برند',
    col_model: 'مدل',
    col_category: 'دسته',
    col_name: 'نام',
    col_count: 'تعداد',
    col_total: 'جمع',
    col_last: 'آخرین خرید',
    col_table: 'جدول',
    col_rows: 'ردیف',
    col_size: 'حجم',
    col_integrity: 'سلامت',
    col_title: 'عنوان',
    col_description: 'توضیحات',
    col_filetype: 'نوع فایل',
    col_status: 'وضعیت',
    col_card: 'شماره کارت',
    col_bank: 'بانک',
    col_type: 'نوع',
    col_file: 'فایل',
    col_qty: 'تعداد',
    col_unit_price: 'قیمت واحد',
    btn_search: 'جستجو',
    btn_export: 'خروجی اکسل',
    btn_add_product: 'افزودن کالا',
    btn_add_contact: 'افزودن مخاطب',
    btn_delete: 'حذف',
    btn_clear: 'خالی کردن',
    btn_view: 'مشاهده',
    btn_edit: 'ویرایش',
    btn_print: 'چاپ',
    tab_sellers: 'فروشندگان',
    tab_locations: 'محل‌ها',
    all_categories: 'همه دسته‌ها',
    ph_search: 'جستجو...',
    ph_search_products: 'جستجوی کالا...',
    ph_product: 'نام کالا',
    save: 'ذخیره',
    cancel: 'انصراف',
    main: 'اصلی',
    parties: 'طرف‌حساب',
    records: 'سوابق',
    system: 'سیستم',
    user_info: 'اطلاعات کاربر',
    export_backup: 'خروجی و بکاپ',
    settings_sub: 'پروفایل و تنظیمات برنامه',
    lbl_name: 'نام',
    lbl_company: 'شرکت / فروشگاه',
    lbl_phone: 'تلفن',
    lbl_email: 'ایمیل',
    lbl_address: 'آدرس',
    lbl_currency: 'واحد پول',
    lbl_auto_backup: 'بکاپ خودکار هنگام خروج',
    lbl_date: 'تاریخ',
    lbl_seller: 'فروشنده',
    lbl_location: 'محل',
    lbl_items: 'اقلام',
    lbl_code: 'کد',
    lbl_product_name: 'نام کالا',
    lbl_brand: 'برند',
    lbl_model: 'مدل',
    lbl_category: 'دسته',
    lbl_title: 'عنوان',
    lbl_description: 'توضیحات',
    lbl_type: 'نوع',
    lbl_status: 'وضعیت',
    lbl_bank: 'بانک',
    lbl_grand_total: 'جمع کل',
    btn_save_settings: 'ذخیره تنظیمات',
    btn_db_backup: 'بکاپ دیتابیس',
    btn_export_purchases: 'خروجی خریدها (اکسل)',
    btn_export_products: 'خروجی کالاها (اکسل)',
    btn_export_sellers: 'خروجی فروشندگان (اکسل)',
    btn_new_document: 'سند جدید',
    btn_new_account: 'حساب جدید',
    btn_add_row: 'ردیف +',
    opt_no: 'خیر',
    opt_yes: 'بله',
    count_products: 'تعداد: {n} کالا',
    failed_db: 'بارگذاری اطلاعات دیتابیس ناموفق بود',
    tables: 'جداول',
    rows: 'ردیف',
    size: 'حجم',
    user: 'کاربر',
    file: 'فایل',
    path: 'مسیر',
    pages: 'صفحات',
    lbl_discount: 'تخفیف',
    lbl_more_info: 'اطلاعات بیشتر',
    ph_more_info: 'توضیحات، جزئیات خرید، یادداشت...',
    lbl_theme: 'تم رنگی',
    col_due_date: 'سررسید',
    col_expiry: 'انقضا',
    status_pending: 'در انتظار',
    status_paid: 'پرداخت‌شده',
    db_integrity: 'یکپارچگی',
    db_rows: 'ردیف',
    db_tables: 'جداول',
    db_size: 'حجم',
    db_refresh: 'بروزرسانی',
    db_info: 'اطلاعات دیتابیس',
    db_ops: 'عملیات',
    db_vacuum: 'بهینه‌سازی',
    db_check: 'بررسی سلامت',
    db_clear: 'پاکسازی داده',
    db_table: 'جدول',

    col_parent: 'والد',
    col_children: 'زیرشاخه',
    col_phone: 'تلفن',
    col_address: 'آدرس',
    col_plan: 'پلن',
    col_yearly_price: 'قیمت سالانه',
    col_status: 'وضعیت',
    col_code: 'کد',
    col_name: 'نام',
    col_ops: 'عملیات',
    ph_new_category: 'نام دسته جدید',
    ph_search: 'جستجو...',
    btn_add: 'افزودن',
    btn_add_customer: 'مشتری جدید',
    btn_add_subscription: 'اشتراک جدید',
    status_active: 'فعال',

    export_hint: 'فایل\u200cهای CSV در اکسل باز می\u200cشوند. بکاپ\u200cها در پوشه backups ذخیره می\u200cشوند',
    subtotal: 'جمع جزء',
    lbl_pay_status: 'وضعیت پرداخت',
    lbl_paid_amount: 'مبلغ پرداخت\u200cشده',
    lbl_due_date: 'سررسید',
    lbl_tags: 'برچسب',
    audit_title: 'تاریخچه تغییرات',
    btn_version: 'نسخه',
    rates_title: 'نرخ ارز (به تومان)',
    rates_hint: 'هر ۱ واحد ارز = چند تومان. بعد از تغییر ذخیره کنید.',
    lbl_subtotal: 'جمع کل',
    lbl_total_after_discount: 'جمع کل با احتساب تخفیف',
    btn_new_customer: 'مشتری جدید',
    btn_new_license: 'لایسنس جدید',
    btn_new_reminder: 'یادآور جدید',
    btn_new_subscription: 'اشتراک جدید',
    btn_new_bill: 'قبض جدید',
    btn_new_check: 'ثبت چک',
    btn_add: 'افزودن',
    settings_saved: 'تنظیمات ذخیره شد',
    settings_error: 'خطا در ذخیره تنظیمات',
    ph_tag: 'برچسب',
    ph_min: 'حداقل',
    ph_max: 'حداکثر',

    lbl_license_key: 'کلید لایسنس',
    lbl_yearly_price: 'قیمت سالانه',
    lbl_monthly_price: 'قیمت ماهانه',
    lbl_current_balance: 'موجودی فعلی',
    lbl_initial_balance: 'موجودی اولیه',
    lbl_meter_number: 'شماره کنتور',
    lbl_bill_number: 'شماره قبض',
    lbl_amount: 'مبلغ',
    lbl_color: 'رنگ',
    lbl_time: 'ساعت',
    lbl_repeat: 'تکرار',
    lbl_username: 'نام کاربری',
    lbl_password: 'رمز عبور',
    lbl_expiry: 'تاریخ انقضا',
    lbl_card_number: 'شماره کارت',
    lbl_iban: 'شبا',
    lbl_currency: 'واحد پول',
    lbl_plan: 'پلن',
    lbl_start: 'شروع',
    lbl_renewal: 'تمدید',
    lbl_auto_renew: 'تمدید خودکار',
    edit_account: 'ویرایش حساب',
    edit_license: 'ویرایش لایسنس',
    edit_reminder: 'ویرایش یادآور',
    edit_subscription: 'ویرایش اشتراک',
    edit_bill: 'ویرایش قبض',
    edit_customer: 'ویرایش مشتری',
    edit_document: 'ویرایش سند',
    edit_sale: 'ویرایش فروش',
    new_license: 'لایسنس جدید',
    new_reminder: 'یادآور جدید',
    new_subscription: 'اشتراک جدید',
    new_bill: 'قبض جدید',
    new_customer: 'مشتری جدید',
    opt_active: 'فعال',
    opt_pending: 'در انتظار',
    opt_unpaid: 'پرداخت‌نشده',
    opt_none: 'هیچ',
    title_sales: 'فروش‌های من',

    nav_admissions: 'پذیرش',
    nav_doctors: 'پزشک',
    env_clinic_enter: 'محیط درمانگاه',
    env_tile_new_adm: 'ثبت بیمار',
    env_tile_adm_list: 'سوابق',
    env_tile_leave: 'خروج از این محیط',
    user_label: 'کاربر',

    env_clinic_tag: 'محیط درمانگاه',
    env_clinic_home: 'خانه درمانگاه',
    env_clinic_title: 'محیط درمانگاه',
    env_clinic_sub: 'اینجا فقط پذیرش است — جدا از حسابداری',
    env_back_accounting: 'بازگشت به حسابداری',

    btn_new_doctor: 'پزشک جدید',
    edit_doctor: 'ویرایش پزشک',
    lbl_specialty: 'تخصص',
    title_doctors: 'پزشکان',

    btn_new_admission: 'پذیرش جدید',
    ph_adm_location: 'بخش / کلینیک',
    ph_adm_patient: 'نام بیمار',
    ph_adm_nurse: 'نام پرستار',
    ph_adm_doctor: 'نام پزشک',
    ph_adm_notes: 'توضیحات، یادداشت پذیرش...',

    lbl_work: 'کار',
    edit_admission: 'ویرایش پذیرش',
    lbl_patient_name: 'نام و نام خانوادگی',
    lbl_nurse: 'نام پرستار',
    lbl_doctor: 'نام پزشک',
    lbl_stated_amount: 'مبلغ ذکر شده',
    title_admissions: 'پذیرش',
    home_banner: 'حسابداری شخصی · میانبر ماژول\u200cها',
  }
};

function t(key) {
  return (I18N[appLang] && I18N[appLang][key]) || (I18N.en[key] || key);
}

function applyLanguage() {
  setTimeout(function(){ try{ updateUserLabels(); }catch(e){} }, 0);
  document.documentElement.lang = appLang;
  document.documentElement.dir = appLang === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    if (I18N[appLang] && I18N[appLang][k]) el.textContent = I18N[appLang][k];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const k = el.getAttribute('data-i18n-placeholder');
    if (I18N[appLang] && I18N[appLang][k]) el.placeholder = I18N[appLang][k];
  });
  // nav section labels
  document.querySelectorAll('.nav-section').forEach(el => {
    const t0 = (el.textContent || '').trim().toLowerCase();
    if (t0 === 'main' || t0 === 'اصلی') el.textContent = t('main');
    else if (t0 === 'parties' || t0 === 'طرف‌حساب') el.textContent = t('parties');
    else if (t0 === 'records' || t0 === 'سوابق') el.textContent = t('records');
    else if (t0 === 'system' || t0 === 'سیستم') el.textContent = t('system');
  });
  const langText = document.getElementById('langText');
  if (langText) langText.textContent = t('lang_btn');
  const logoutText = document.getElementById('logoutText');
  if (logoutText) logoutText.textContent = t('logout');
  const backupText = document.getElementById('backupText');
  if (backupText) backupText.textContent = t('backup');
  const darkText = document.getElementById('darkModeText');
  if (darkText) darkText.textContent = isDarkMode ? t('light') : t('dark');
  const sub = document.getElementById('appSubtitle');
  if (sub) sub.textContent = t('login_sub');
  try { localStorage.setItem('cludari_lang', appLang); } catch(e) {}
  try { document.cookie = 'cludari_lang=' + appLang + ';path=/;max-age=31536000'; } catch(e) {}
  try { sessionStorage.setItem('cludari_lang', appLang); } catch(e) {}
  updateClock();
  // refresh visible page so dates reformat (without full navigate recursion)
  try {
    if (currentPage === 'dashboard' && typeof loadDashboard === 'function') loadDashboard();
    else if (currentPage === 'purchases' && typeof loadPurchases === 'function') loadPurchases();
    else if (currentPage === 'database' && typeof loadDatabase === 'function') loadDatabase();
    else if (currentPage === 'sellers' && typeof loadSellers === 'function') loadSellers();
  } catch (e) {}
}

function toggleLanguage() {
  setTimeout(function(){ try{ updateUserLabels(); applyLanguage(appLang); }catch(e){} }, 0);
  appLang = appLang === 'en' ? 'fa' : 'en';
  applyLanguage();
}

function authHeaders(extra) {
  const h = {};
  if (extra && typeof extra === 'object') {
    if (typeof Headers !== 'undefined' && extra instanceof Headers) {
      extra.forEach(function(v, k) { h[k] = v; });
    } else {
      Object.keys(extra).forEach(function(k) { h[k] = extra[k]; });
    }
  }
  if (!h['Content-Type'] && !h['content-type']) h['Content-Type'] = 'application/json';
  if (authToken) h['Authorization'] = 'Bearer ' + authToken;
  return h;
}

// Patch fetch to always send token for /api/
const _origFetch = window.fetch.bind(window);
window.fetch = function(input, init) {
  init = init || {};
  const url = typeof input === 'string' ? input : (input && input.url) || '';
  if (url.indexOf('/api/') !== -1) {
    init.headers = authHeaders(init.headers || {});
  }
  return _origFetch(input, init);
};

function showLoginTab(which) {
  document.getElementById('loginForm').style.display = which === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = which === 'register' ? 'block' : 'none';
  document.getElementById('tabLogin').classList.toggle('active', which === 'login');
  document.getElementById('tabRegister').classList.toggle('active', which === 'register');
  document.getElementById('loginError').textContent = '';
}

async function doLogin() {
  var err = document.getElementById('loginError');
  var btn = document.getElementById('loginSubmitBtn');
  try { if (err) err.textContent = ''; } catch (e) {}
  var username = '';
  var password = '';
  try {
    username = String((document.getElementById('loginUser') || {}).value || '').trim();
    password = String((document.getElementById('loginPass') || {}).value || '');
  } catch (e) {}
  if (!username || !password) {
    if (err) err.textContent = appLang === 'fa' ? 'نام کاربری و رمز را وارد کنید' : 'Enter username and password';
    try { hideAppLoading(); } catch (e0) {}
    return;
  }
  try { showAppLoading(appLang === 'fa' ? 'در حال ورود...' : 'Signing in...'); } catch (e1) {}
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  // safety: never leave overlay forever
  var safety = setTimeout(function () { try { hideAppLoading(); } catch (e) {} }, 15000);
  try {
    var fetchFn = (typeof _origFetch === 'function') ? _origFetch : fetch;
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var to = ctrl ? setTimeout(function(){ try{ctrl.abort();}catch(e){} }, 12000) : null;
    var res = await fetchFn(API + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username, password: password }),
      signal: ctrl ? ctrl.signal : undefined
    });
    if (to) clearTimeout(to);
    var data = {};
    try { data = await res.json(); } catch (e2) {}
    if (!res.ok) {
      var msg = (data && data.detail) ? String(data.detail) : '';
      if (/invalid/i.test(msg)) msg = appLang==='fa' ? 'نام کاربری یا رمز اشتباه است' : 'Invalid username or password';
      if (!msg) msg = appLang==='fa' ? 'ورود ناموفق — root / root را امتحان کنید' : 'Login failed — try root / root';
      if (err) err.textContent = msg;
      return;
    }
    authToken = data.token || '';
    currentUsername = data.username || username;
    try {
      localStorage.setItem('cludari_token', authToken);
      localStorage.setItem('cludari_user', currentUsername);
    } catch (e3) {}
    if (typeof enterApp === 'function') enterApp();
    else {
      var screen = document.getElementById('loginScreen');
      if (screen) screen.classList.add('hidden');
    }
  } catch (e) {
    if (err) err.textContent = appLang === 'fa' ? ('خطای ارتباط: ' + (e.message || e)) : ('Server error: ' + (e.message || e));
    console.error(e);
  } finally {
    clearTimeout(safety);
    if (btn) {
      btn.disabled = false;
      btn.textContent = appLang === 'fa' ? 'ورود' : 'Sign in';
    }
    try { hideAppLoading(); } catch (e4) {}
  }
}

async function doRegister() {
  const username = String((document.getElementById('regUser') || {}).value || '').trim();
  const password = String((document.getElementById('regPass') || {}).value || '');
  const err = document.getElementById('registerError') || document.getElementById('loginError');
  if (err) err.textContent = '';
  if (!username || !password) {
    if (err) err.textContent = appLang === 'fa' ? 'نام کاربری و رمز را وارد کنید' : 'Enter username and password';
    return;
  }
  try {
    const res = await _origFetch(API + '/api/auth/register', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username: username, password: password})
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      var msg = data.detail;
      if (typeof msg === 'object' && msg) msg = msg.msg || JSON.stringify(msg);
      msg = String(msg || '');
      if (/already exists/i.test(msg)) msg = (appLang==='fa' ? 'این نام کاربری قبلاً ثبت شده — از تب ورود استفاده کنید' : 'Username already exists — use Login tab');
      if (err) err.textContent = msg || (appLang==='fa' ? 'ساخت حساب ناموفق بود' : 'Register failed');
      return;
    }
    authToken = data.token || '';
    currentUsername = data.username || username;
    try {
      localStorage.setItem('cludari_token', authToken);
      localStorage.setItem('cludari_user', currentUsername);
    } catch (e1) {}
    try { applyLanguage(); } catch (e2) {}
    if (typeof enterApp === 'function') enterApp();
  } catch (e) {
    if (err) err.textContent = t('reg_fail');
    console.error(e);
  }
}

function enterApp() {
  try { document.body.classList.remove('login-open'); } catch(e){}
  try { loadNotifications(false);  } catch(e) {}
  try { setInterval(function(){ loadNotifications(false); }, 60000); } catch(e) {}
  try { loadSysInfo(); updateUserLabels(); } catch(e) {}
  const screen = document.getElementById('loginScreen');
  if (screen) screen.classList.add('hidden');
  try {
    var shell = document.getElementById('appShell');
    if (shell) { shell.style.display = ''; shell.style.visibility = 'visible'; }
  } catch(e){}
  const badge = document.getElementById('currentUserBadge');
  if (badge) badge.textContent = '👤 ' + (currentUsername || '');
  const su = document.getElementById('sideUserName');
  if (su) su.textContent = (appLang === 'fa' ? 'کاربر: ' : 'User: ') + (currentUsername || '—');
  const bl = document.getElementById('sideBrandLabel');
  if (bl) bl.textContent = appLang === 'fa' ? 'حسابداری شخصی' : 'Personal Accounting';
  const tu = document.getElementById('topbarUser');
  if (tu) tu.textContent = (appLang==='fa'?'حساب: ':'Account: ') + (currentUsername || '');
  const ts = document.getElementById('topbarStatus');
  if (ts) ts.textContent = appLang==='fa' ? 'CluDari · آنلاین' : 'CluDari Accounting System · Online';
  applyLanguage();
  if (typeof loadCurrencyRates === 'function') loadCurrencyRates();
  if (typeof loadDashboard === 'function') loadDashboard();
  if (typeof loadPurchases === 'function') loadPurchases();
  if (typeof loadNotifications === 'function') loadNotifications();
}

function doLogout() {
  showAppLoading(appLang==='fa' ? 'در حال خروج...' : 'Signing out...');
  try{playUiSound('close');}catch(e){}
  _origFetch(`${API}/api/auth/logout`, {method: 'POST', headers: authHeaders()}).catch(() => {});
  authToken = '';
  currentUsername = '';
  localStorage.removeItem('cludari_token');
  localStorage.removeItem('cludari_user');
  setTimeout(function(){ hideAppLoading(); }, 500);
  const screen = document.getElementById('loginScreen');
  if (screen) screen.classList.remove('hidden');
  try { document.body.classList.add('login-open'); } catch(e){}
  try {
    var shell = document.getElementById('appShell');
    if (shell) { shell.style.display = 'none'; }
  } catch(e){}
  const badge = document.getElementById('currentUserBadge');
  if (badge) badge.textContent = '';
}


async function tryAutoLogin() {
  if (!authToken) return false;
  try {
    const res = await _origFetch(`${API}/api/auth/me`, {headers: authHeaders()});
    if (!res.ok) {
      doLogout();
      return false;
    }
    const data = await res.json();
    currentUsername = data.username;
    enterApp();
    return true;
  } catch (e) {
    return false;
  }
}

function updateClock() {
  const now = new Date();
  // Time always 24h latin digits (unchanged by language)
  let hh = String(now.getHours()).padStart(2, '0');
  let mm = String(now.getMinutes()).padStart(2, '0');
  let ss = String(now.getSeconds()).padStart(2, '0');
  let timeStr = hh + ':' + mm + ':' + ss;
  if (appLang === 'fa' && typeof toPersianDigits === 'function') {
    timeStr = toPersianDigits(timeStr);
  }

  let dateStr;
  if (appLang === 'fa') {
    // Jalali (Shamsi) date only
    try {
      dateStr = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
        weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(now);
    } catch (e) {
      try {
        dateStr = new Intl.DateTimeFormat('fa-IR', {
          weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(now);
      } catch (e2) {
        dateStr = now.toLocaleDateString('fa-IR');
      }
    }
  } else {
    // Gregorian date
    dateStr = now.toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: '2-digit'
    });
  }

  const fullStr = dateStr + '  |  ' + timeStr;
  const live = document.getElementById('liveClock');
  if (live) live.textContent = fullStr;
  const td = document.getElementById('topDate');
  const tt = document.getElementById('topTime');
  if (td) td.textContent = dateStr;
  if (tt) tt.textContent = timeStr;

  // side clock hidden — do not write (prevents duplicate time)
}
setInterval(updateClock, 1000);


/* loading-early */
function showLoading(on) {
    var el = document.getElementById('globalLoading');
    if (!el) {
        el = document.createElement('div');
        el.id = 'globalLoading';
        el.innerHTML = '<div class="loader-ring"></div><div class="loader-text">' + (typeof t==='function'?t('loading'):'Loading...') + '</div>';
        el.addEventListener('click', function() {
            window.__loadCount = 0;
            el.classList.remove('active');
        });
        document.body.appendChild(el);
    }
    if (typeof window.__loadCount !== 'number') window.__loadCount = 0;
    if (on) {
        window.__loadCount++;
        el.classList.add('active');
        clearTimeout(window.__loadTimer);
        // max 1.5s safety timeout
        window.__loadTimer = setTimeout(function() {
            window.__loadCount = 0;
            el.classList.remove('active');
        }, 1500);
    } else {
        window.__loadCount = Math.max(0, (window.__loadCount || 1) - 1);
        if (window.__loadCount <= 0) {
            window.__loadCount = 0;
            el.classList.remove('active');
            clearTimeout(window.__loadTimer);
        }
    }
}

function hideLoadingForce() {
    window.__loadCount = 0;
    var el = document.getElementById('globalLoading');
    if (el) el.classList.remove('active');
    clearTimeout(window.__loadTimer);
}

// ═══════════════════════════════════════════════════════════════
// ═══ CluDari - Personal Accounting ═══
// ═══════════════════════════════════════════════════════════════

const API = '';
let currentPage = 'dashboard';
let currentSellerTab = 'sellers';
let products = [];
let itemRows = [];
let editingId = null;
let cacheProducts = [];
let cacheDocuments = [];
let cacheLicenses = [];
let cacheReminders = [];
let cacheSubscriptions = [];
let cacheBills = [];
let cacheChecks = [];
let cacheAccounts = [];
let cacheCustomers = [];
let cacheContacts = [];
let cacheCategories = [];
let cachePurchases = [];

// ═══════════════════════════════════════════════════════════════
// ═══ Navigation ═══
// ═══════════════════════════════════════════════════════════════

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page;
        navigateTo(page);
    });
});

function navigateToLegacy(page) {
    hideLoadingForce();
    currentPage = page;
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const activeEl = document.querySelector(`[data-page="${page}"]`);
    if (activeEl) activeEl.classList.add('active');

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) targetPage.classList.add('active');

    switch(page) {
        case 'dashboard': loadDashboard(); break;
        case 'preinvoices': loadPreinvoices(); break;
        case 'returns': loadReturns(window._returnType); break;
        case 'kardex': loadKardex(); break;
        case 'treasury': loadTreasury(); break;
        case 'coa': loadCOA(); break;
        case 'journals': loadJournals(); break;
        case 'trial': loadTrialBalance(); break;
        case 'pl': loadPL(); break;
        case 'bs': loadBS(); break;
        case 'warehouses': loadWarehouses(); break;
        case 'transfers': loadTransfers(); break;
        case 'credit': loadCreditPage(); break;
        case 'prices': loadPricesPage(); break;
        case 'purchases': loadPurchases(); break;
        case 'database': loadDatabase(); break;
        case 'sellers': loadSellers(); break;
        case 'database-admin': loadDbAdmin(); break;
        case 'sales': loadSales(); break;
        case 'admissions': loadAdmissions(); break;
        case 'settings': loadSettings(); break;
        case 'categories': loadCategories(); break;
        case 'customers-page': loadCustomers(); break;
        case 'documents-page': loadDocuments(); break;
        case 'licenses-page': loadLicenses(); break;
        case 'reminders-page': loadReminders(); break;
        case 'subscriptions-page': loadSubscriptions(); break;
        case 'bills-page': loadBills(); break;
        case 'checks-page': loadChecks(); break;
        case 'accounts-page': loadAccounts(); break;
    }
}

// ═══════════════════════════════════════════════════════════════
// ═══ Dashboard ═══
// ═══════════════════════════════════════════════════════════════

async function loadDashboard() {
    try{ document.body.classList.add('on-dashboard'); mkUpdateClock(); }catch(e){}

    if (window.__dashLoading) return;
    window.__dashLoading = true;
    try {
        const res = await fetch(API + '/api/dashboard');
        const data = await res.json();
        var sc = document.getElementById('statCount');
        var st = document.getElementById('statTotal');
        var sm = document.getElementById('statMonth');
        var ss = document.getElementById('statSellers');
        if (sc) sc.textContent = formatNumber(data.count || 0);
        if (st) st.textContent = formatNumber(data.total || 0);
        if (sm) sm.textContent = formatNumber(data.month || 0);
        if (ss) ss.textContent = formatNumber(data.sellers || 0);
        const tbody = document.getElementById('dashboardTable');
        if (tbody) {
            if (data.recent && data.recent.length > 0) {
                tbody.innerHTML = data.recent.map(function(r) {
                    return '<tr><td>' + toJalali(r.date) + '</td><td>' + (r.seller || '—') + '</td><td>' + (r.location || '—') + '</td><td class="money">' + formatNumber(r.total) + '</td></tr>';
                }).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);">No purchases yet</td></tr>';
            }
        }
    } catch (e) {
        console.error('Dashboard error:', e);
    } finally {
        window.__dashLoading = false;
    }
}

// ═══════════════════════════════════════════════════════════════
// ═══ Purchases ═══
// ═══════════════════════════════════════════════════════════════

async function loadPurchases() {
    try {
        const q = new URLSearchParams();
        const search = (document.getElementById('purchaseSearch') || {}).value || '';
        if (search) q.set('search', search);
        const df = (document.getElementById('filterDateFrom') || {}).value || '';
        const dt = (document.getElementById('filterDateTo') || {}).value || '';
        if (df) q.set('date_from', df);
        if (dt) q.set('date_to', dt);
        const amin = (document.getElementById('filterAmtMin') || {}).value;
        const amax = (document.getElementById('filterAmtMax') || {}).value;
        if (amin !== undefined && amin !== '' && !isNaN(parseFloat(amin))) q.set('amount_min', parseFloat(amin));
        if (amax !== undefined && amax !== '' && !isNaN(parseFloat(amax))) q.set('amount_max', parseFloat(amax));
        const ps = (document.getElementById('filterPayStatus') || {}).value || '';
        if (ps) q.set('payment_status', ps);
        const tag = (document.getElementById('filterTag') || {}).value || '';
        if (tag) q.set('tag', tag);
        if (showTrash) q.set('trash', '1');
        let res = await fetch(`${API}/api/purchases?` + q.toString());
        if (!res.ok) {
          console.warn('purchases filter failed', res.status, 'retry plain');
          res = await fetch(`${API}/api/purchases`);
        }
        if (!res.ok) {
          const tbody0 = document.getElementById('purchasesTable');
          if (tbody0) tbody0.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#ef4444">' + (appLang==='fa'?'خطا در بارگذاری خریدها':'Failed to load') + ' ('+res.status+')</td></tr>';
          return;
        }
        let data = await res.json();
        if (!Array.isArray(data)) data = data.items || data.purchases || [];
        cachePurchases = data || [];
        const tbody = document.getElementById('purchasesTable');
        if (!tbody) return;
        if (data.length > 0) {
            tbody.innerHTML = data.map(r => {
                const st = r.payment_status || 'paid';
                const badge = st === 'paid' ? '🟢' : (st === 'partial' ? '🟡' : '🔴');
                const tags = (r.tags || '') ? `<span style="font-size:11px;opacity:.7">${r.tags}</span>` : '';
                const actions = showTrash
                  ? `<button class="btn btn-primary" style="padding:6px 10px;font-size:12px" onclick="restorePurchase(${r.id})">♻</button>
                     <button class="btn btn-danger" style="padding:6px 10px;font-size:12px" onclick="hardDeletePurchase(${r.id})">${t('btn_delete')}</button>`
                  : `<button class="btn btn-secondary" style="padding:6px 10px;font-size:12px" onclick="editPurchase(${r.id})">✏️</button>
                     <button class="btn btn-primary" style="padding:6px 10px;font-size:12px" onclick="printPurchase(${r.id})">🖨️</button>
                     <button class="btn btn-danger" style="padding:6px 10px;font-size:12px" onclick="deletePurchase(${r.id})">${t('btn_delete')}</button>`;
                const desc = (r.description || r.notes || r.more_info || '').toString().trim();
                const descShort = desc.length > 80 ? desc.slice(0, 80) + '…' : desc;
                return `<tr>
                    <td>${toJalali(r.date)}${r.invoice_no ? '<br><small style="opacity:.6">'+r.invoice_no+'</small>' : ''}</td>
                    <td>${r.seller || '—'}</td>
                    <td>${r.location || '—'}</td>
                    <td>${formatNumber(r.item_count || 0)}</td>
                    <td class="money">${formatMoney(r.total, r.currency)} ${badge}</td>
                    <td title="${desc.replace(/"/g, '&quot;')}" style="max-width:220px;font-size:12.5px;opacity:${desc ? '1' : '.45'}">${descShort || '—'}</td>
                    <td style="white-space:nowrap">${actions}<div>${tags}</div></td>
                </tr>`;
            }).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-secondary)">—</td></tr>';
        }
    } catch (e) {
        console.error(e);
    }
}

function toggleTrash() {
    showTrash = !showTrash;
    const b = document.getElementById('btnTrash');
    if (b) b.style.outline = showTrash ? '2px solid #ef4444' : '';
    loadPurchases();
}

async function restorePurchase(id) {
    await fetch(`${API}/api/purchases/${id}/restore`, { method: 'POST' });
    loadPurchases();
}

async function hardDeletePurchase(id) {
    if (!confirm(appLang==='fa'?'حذف دائمی؟':'Permanently delete?')) return;
    await fetch(`${API}/api/purchases/${id}?hard=1`, { method: 'DELETE' });
    loadPurchases();
}

async function deletePurchase(id) {
    if (!confirm(appLang==='fa'?'به سطل زباله منتقل شود؟':'Move to trash?')) return;
    await fetch(`${API}/api/purchases/${id}`, { method: 'DELETE' });
    loadPurchases();
}



// ═══════════════════════════════════════════════════════════════
// ═══ Database ═══
// ═══════════════════════════════════════════════════════════════

async function loadDatabase() {
    try {
        const search = (document.getElementById('dbSearch') || {}).value || '';
        const category = (document.getElementById('dbCategory') || {}).value || '';

        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (category) params.append('category', category);

        const res = await fetch(`${API}/api/products?${params}`);
        const data = await res.json();

        products = data.items || [];
        cacheProducts = products;
        const catSelect = document.getElementById('dbCategory');

        if (data.categories && catSelect) {
            const currentCat = catSelect.value;
            catSelect.innerHTML = '<option value="">All categories</option>' +
                data.categories.map(c => `<option value="${c}" ${c === currentCat ? 'selected' : ''}>${c}</option>`).join('');
        }

        const tbody = document.getElementById('databaseTable');
        if (!tbody) return;
        if (products.length > 0) {
            tbody.innerHTML = products.map(p => `
                <tr>
                    <td>${p.code}</td>
                    <td>${p.name}</td>
                    <td>${p.brand || ''}</td>
                    <td>${p.model || ''}</td>
                    <td>${p.category || ''}</td>
                    <td style="white-space:nowrap">
                        <button class="btn btn-secondary" style="padding:4px 8px;font-size:12px;margin-left:4px" title="Edit" onclick="editProduct(${p.id})">✏️</button>
                        <button class="btn btn-danger" style="padding:4px 10px;font-size:12px;" onclick="deleteProduct(${p.id})">${t('btn_delete')}</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">No products found</td></tr>';
        }

        const dbCount = document.getElementById('dbCount');
        if (dbCount) dbCount.textContent = appLang==='fa' ? (`تعداد: ` + formatNumber(data.count || 0) + ` کالا`) : (`Count: ` + formatNumber(data.count || 0) + ` products`);
    } catch(e) {
        console.error('Database error:', e);
    }
}

async function addProduct() {
    const code = document.getElementById('prodCode').value.trim();
    const name = document.getElementById('prodName').value.trim();
    if (!code || !name) return alert('Code and name are required');
    const body = {
        code, name,
        brand: document.getElementById('prodBrand').value,
        model: document.getElementById('prodModel').value,
        category: document.getElementById('prodCategory').value
    };
    try {
        const url = editingId ? `${API}/api/products/${editingId}` : `${API}/api/products`;
        const method = editingId ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
        if (!res.ok) { const err = await res.json().catch(()=>({})); return alert(err.detail || 'Error saving product'); }
        document.getElementById('prodCode').value = '';
        document.getElementById('prodName').value = '';
        document.getElementById('prodBrand').value = '';
        document.getElementById('prodModel').value = '';
        document.getElementById('prodCategory').value = '';
        document.getElementById('productModal').classList.remove('active');
        editingId = null;
        setModalTitle('productModal', t('btn_add_product'));
        loadDatabase();
    } catch(e) {
        alert('Error saving product');
    }
}

async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    try {
        await fetch(`${API}/api/products/${id}`, {method: 'DELETE'});
        loadDatabase();
    } catch(e) {
        alert('Error deleting product');
    }
}

// ═══════════════════════════════════════════════════════════════
// ═══ Sellers ═══
// ═══════════════════════════════════════════════════════════════

async function loadSellers(tab) {
    currentSellerTab = tab || currentSellerTab;
    try {
        const res = await fetch(`${API}/api/sellers?tab=${currentSellerTab}`);
        const data = await res.json();

        const tbody = document.getElementById('sellersTable');
        if (!tbody) return;
        if (data.length > 0) {
            tbody.innerHTML = data.map((r, idx) => `
                <tr>
                    <td>${r.name}</td>
                    <td>${r.count}</td>
                    <td>${formatNumber(r.total_sum)} ${appLang==='fa'?'تومان':'Toman'}</td>
                    <td>${toJalali(r.last_date)}</td>
                    <td style="white-space:nowrap">
                        <button class="btn btn-secondary" style="padding:4px 8px;font-size:12px;margin-left:4px" title="Rename" onclick="editSellerName(decodeURIComponent('${encodeURIComponent(r.name || '')}'))">✏️</button>
                        <button class="btn btn-primary" style="padding:4px 8px;font-size:12px;margin-left:4px" title="View purchases" onclick="filterPurchasesBySeller(decodeURIComponent('${encodeURIComponent(r.name || '')}'))">🛒</button>
                    </td>
                </tr>`).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No data found</td></tr>';
        }

        const tabSellers = document.getElementById('tabSellers');
        const tabLocations = document.getElementById('tabLocations');
        if (tabSellers) tabSellers.className = currentSellerTab === 'sellers' ? 'btn btn-primary' : 'btn btn-secondary';
        if (tabLocations) tabLocations.className = currentSellerTab === 'locations' ? 'btn btn-primary' : 'btn btn-secondary';
    } catch(e) {
        console.error('Sellers error:', e);
        toast('Error loading sellers', 'error');
    }
}

async function editSellerName(oldName) {
    const field = currentSellerTab === 'locations' ? 'location' : 'seller';
    const label = field === 'location' ? 'location' : 'seller';
    const newName = prompt('New name ' + label + ':', oldName);
    if (newName === null) return;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    try {
        const res = await fetch(`${API}/api/sellers/rename`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ old_name: oldName, new_name: trimmed, field })
        });
        if (!res.ok) { toast('Edit failed', 'error'); return; }
        toast('Name updated');
        loadSellers();
        loadDashboard();
    } catch(e) {
        toast('Server connection error', 'error');
    } finally {
        showLoading(false);
    }
}

function filterPurchasesBySeller(name) {
    navigateTo('purchases');
    setTimeout(() => {
        const input = document.getElementById('purchaseSearch');
        if (input) {
            input.value = name;
            loadPurchases();
        }
    }, 50);
}

function openAddSeller() {
    editingId = null;
    setModalTitle('contactModal', t('btn_add_contact'));
    document.getElementById('contactName').value = '';
    document.getElementById('contactCategory').value = currentSellerTab === 'locations' ? 'Shop' : 'Purchase';
    document.getElementById('contactPhone').value = '';
    document.getElementById('contactEmail').value = '';
    document.getElementById('contactAddress').value = '';
    document.getElementById('contactCompany').value = '';
    document.getElementById('contactDesc').value = '';
    const contactModal = document.getElementById('contactModal');
    if (contactModal) {
        // Child dialogs must live on document.body so they are not trapped
        // under the MDI layer stacking context.
        if (contactModal.parentElement !== document.body) document.body.appendChild(contactModal);
        contactModal.classList.add('child-dialog','active');
        var z = (typeof mkNextZ === 'function') ? mkNextZ() : 70001;
        contactModal.style.setProperty('z-index', String(z), 'important');
        if (typeof mkWinEnable === 'function') mkWinEnable(contactModal);
        // mkWinEnable may re-center; force z again above MDI (60000)
        contactModal.style.setProperty('z-index', String(window.mdiZ || z), 'important');
        contactModal.focus && contactModal.focus();
    }
}

// ═══════════════════════════════════════════════════════════════
// ═══ Settings ═══
// ═══════════════════════════════════════════════════════════════

async function loadSettings() {
    try {
        const res = await fetch(`${API}/api/settings`);
        const data = await res.json();
        const set = (id, key, def) => {
            const el = document.getElementById(id);
            if (el) el.value = data[key] != null ? data[key] : (def || '');
        };
        set('settingName', 'name');
        set('settingPhone', 'phone');
        set('settingAddress', 'address');
        set('settingCurrency', 'currency', 'Toman');
        set('settingCompany', 'company');
        set('settingEmail', 'email');
        // Do not force theme from settings — keep current light/dark choice
        const chk = document.getElementById('settingAutoBackup');
        if (chk) chk.value = (data.auto_backup === '1' || data.auto_backup === 'true') ? '1' : '0';
    } catch(e) {
        console.error('Settings error:', e);
    }
}

async function saveSettings() {
    try {
        const data = {
            name: (document.getElementById('settingName') || {}).value || '',
            phone: (document.getElementById('settingPhone') || {}).value || '',
            address: (document.getElementById('settingAddress') || {}).value || '',
            company: (document.getElementById('settingCompany') || {}).value || '',
            email: (document.getElementById('settingEmail') || {}).value || '',
            currency: (document.getElementById('settingCurrency') || {}).value || 'Toman',
            dark_mode: isDarkMode ? '1' : '0',
            auto_backup: (document.getElementById('settingAutoBackup') ? document.getElementById('settingAutoBackup').value : '0')
        };
        const res = await fetch(`${API}/api/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) toast(t('settings_saved'));
        else toast(t('settings_error'), 'error');
    } catch(e) {
        toast(t('settings_error'), 'error');
    }
}

// ═══════════════════════════════════════════════════════════════
// ═══ Backup ═══
// ═══════════════════════════════════════════════════════════════

async function createBackup() {
    try {
        showLoading(true);
        const res = await fetch(`${API}/api/backup`, { method: 'POST' });
        const data = await res.json();
        toast((data.message || 'Backup saved') + (data.file ? ' ('+data.file+')' : ''), 'success');
        if (typeof loadDbAdmin === 'function' && currentPage === 'database-admin') loadDbAdmin();
    } catch(e) {
        toast('Backup failed', 'error');
    } finally {
        showLoading(false);
    }
}

// ═══════════════════════════════════════════════════════════════
// ═══ New Purchase Modal ═══
// ═══════════════════════════════════════════════════════════════

async function openNewPurchase() {
  try{playUiSound("open");}catch(e){}
  editingId = null;
  try { setModalTitle('newPurchaseModal', typeof t==='function'?t('btn_new_purchase'):'فاکتور خرید'); } catch(e){}
  try {
    const res = await fetch(API + '/api/products');
    products = (await res.json()).items || [];
  } catch(e) { products = []; }
  try {
    var el;
    el=document.getElementById('purchaseDate'); if(el) el.value=new Date().toISOString().split('T')[0];
    el=document.getElementById('purchaseSeller'); if(el) el.value='';
    el=document.getElementById('purchaseLocation'); if(el) el.value='';
    el=document.getElementById('purchaseNotes'); if(el) el.value='';
    el=document.getElementById('purchaseDiscount'); if(el) el.value='0';
    el=document.getElementById('purchasePayStatus'); if(el) el.value='paid';
    el=document.getElementById('purchasePaidAmount'); if(el) el.value='0';
  } catch(e){}
  try {
    itemRows = [];
    var body = document.getElementById('itemsBody');
    if (body) body.innerHTML = '';
    if (typeof addItemRow==='function'){ addItemRow(); addItemRow(); }
    if (typeof calcTotal==='function') calcTotal();
  } catch(e){}
  openInvoiceFloating('newPurchaseModal');
  try{applyLanguage();}catch(e){}
}

function updatePurchaseJalaliHint() {
    const el = document.getElementById('purchaseJalaliHint');
    const d = document.getElementById('purchaseDate');
    if (!el || !d) return;
    if (appLang !== 'fa' || !d.value) { el.textContent = ''; return; }
    try {
        el.textContent = '📅 ' + toJalali(d.value);
    } catch (e) {
        el.textContent = '';
    }
}

function closeModal(id) {
    const ids = id ? [id] : ['newPurchaseModal', 'newSaleModal', 'admissionModal', 'nurseModal', 'doctorModal', 'budgetModal', 'goalModal', 'fxTxModal', 'fxCurrencyModal', 'contactModal', 'productModal', 'checkModal'];
    ids.forEach(function(mid) {
        const el = document.getElementById(mid);
        if (el) el.classList.remove('active');
    });
    // if sale was moved into MDI, restore and remove window
    try {
        const mdiSale = document.querySelector('.mdi-window[data-page="newSaleModal"]');
        if (mdiSale) {
            const page = document.getElementById('newSaleModal');
            const scroll = document.getElementById('mainScroll') || document.body;
            if (page) {
                page.classList.remove('active');
                page.style.display = '';
                scroll.appendChild(page);
            }
            mdiSale.remove();
        }
    } catch (e) {}
    editingId = null;
}

function renderPurchaseItemRows() {
    const tbody = document.getElementById('itemsBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    itemRows.forEach((item, rowId) => {
        const tr = document.createElement('tr');
        tr.dataset.rowId = String(rowId);
        const ph = (typeof t === 'function' ? t('ph_product') : 'Product name');
        const total = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
        tr.innerHTML = `
            <td style="text-align:center;font-weight:700;color:#1a3050">${rowId + 1}</td>
            <td><input type="text" placeholder="کد" value="${String(item.code || '').replace(/"/g, '&quot;')}"
                       onchange="if(itemRows[${rowId}])itemRows[${rowId}].code=this.value"></td>
            <td>
                <input type="text" list="productsList" placeholder="${ph}"
                       value="${String(item.name || '').replace(/"/g, '&quot;')}"
                       onchange="updateItemName(${rowId}, this.value)"
                       oninput="filterProducts(this, ${rowId})">
            </td>
            <td><input type="number" value="${item.quantity ?? 1}" min="0" step="any" onchange="updateItemQty(${rowId}, this.value)" oninput="updateItemQty(${rowId}, this.value)"></td>
            <td><input type="number" value="${item.unit_price ?? 0}" min="0" step="any" onchange="updateItemPrice(${rowId}, this.value)" oninput="updateItemPrice(${rowId}, this.value)"></td>
            <td style="text-align:center;font-weight:700;white-space:nowrap"><span id="itemTotal${rowId}">${formatNumber(total)}</span></td>
            <td style="text-align:center"><button type="button" class="row-del-btn" onclick="removeItemRow(${rowId}, this)" title="حذف">🗑</button></td>
        `;
        tbody.appendChild(tr);
    });

    if (!document.getElementById('productsList')) {
        const datalist = document.createElement('datalist');
        datalist.id = 'productsList';
        products.forEach(pr => {
            const option = document.createElement('option');
            option.value = pr.name;
            option.label = `[${pr.code || ''}] ${pr.name} (${pr.brand || ''})`;
            datalist.appendChild(option);
        });
        document.body.appendChild(datalist);
    }
}

function addItemRow() {
    itemRows.push({ name: '', code: '', quantity: 1, unit_price: 0 });
    renderPurchaseItemRows();
    calcTotal();
}

function removeLastItemRow() {
    if (itemRows.length <= 1) {
        alert(appLang === 'fa' ? 'حداقل یک سطر باید باقی بماند' : 'At least one row is required');
        return;
    }
    itemRows.pop();
    renderPurchaseItemRows();
    calcTotal();
}

function updateItemName(rowId, value) {
    if (rowId < itemRows.length) {
        itemRows[rowId].name = value;
        const product = products.find(p => p.name === value);
        if (product && product.buy_price) {
            itemRows[rowId].unit_price = product.buy_price;
            const rows = document.getElementById('itemsBody').rows;
            if (rows[rowId] && rows[rowId].cells[4]) {
                var pin = rows[rowId].cells[4].querySelector('input');
                if (pin) pin.value = product.buy_price;
            }
        }
        calcTotal();
    }
}

function updateItemQty(rowId, value) {
    if (rowId < itemRows.length) {
        itemRows[rowId].quantity = parseFloat(value) || 0;
        calcItemTotal(rowId);
        calcTotal();
    }
}

function updateItemPrice(rowId, value) {
    if (rowId < itemRows.length) {
        itemRows[rowId].unit_price = parseFloat(value) || 0;
        calcItemTotal(rowId);
        calcTotal();
    }
}

function calcItemTotal(rowId) {
    const total = itemRows[rowId].quantity * itemRows[rowId].unit_price;
    document.getElementById(`itemTotal${rowId}`).textContent = formatNumber(total);
}

function calcTotal() {
    const subtotal = itemRows.reduce((sum, item) => {
        const q = parseFloat(item.quantity) || 0;
        const p = parseFloat(item.unit_price) || 0;
        return sum + (q * p);
    }, 0);
    const discEl = document.getElementById('purchaseDiscount');
    let discount = discEl ? (parseFloat(discEl.value) || 0) : 0;
    if (discount < 0) discount = 0;
    if (discount > subtotal) discount = subtotal;
    const total = Math.max(0, subtotal - discount);
    const curCode = (document.getElementById('purchaseCurrency')||{}).value || 'IRT';
    const cur = currencyLabel(curCode);
    const el = document.getElementById('purchaseTotal');
    if (!el) return;
    if (discount > 0) {
        el.textContent = formatNumber(total) + ' ' + cur
            + '  (' + (appLang==='fa'?'جمع':'Sub') + ': ' + formatNumber(subtotal)
            + ' − ' + (appLang==='fa'?'تخفیف':'Disc') + ': ' + formatNumber(discount) + ')';
    } else {
        el.textContent = formatNumber(total) + ' ' + cur;
    }
}

function removeItemRow(rowId, btn) {
    if (itemRows.length <= 1) {
        alert(appLang === 'fa' ? 'حداقل یک سطر باید باقی بماند' : 'At least one row is required');
        return;
    }

    // Always resolve the index from the current DOM row. After a deletion,
    // rebuilding the rows keeps every button/input bound to the correct item.
    const tr = btn && btn.closest ? btn.closest('tr') : null;
    const currentIndex = tr && tr.dataset.rowId != null
        ? parseInt(tr.dataset.rowId, 10)
        : rowId;
    if (!Number.isInteger(currentIndex) || currentIndex < 0 || currentIndex >= itemRows.length) return;

    itemRows.splice(currentIndex, 1);
    renderPurchaseItemRows();
    calcTotal();
}

function filterProducts(input, rowId) {}

async function savePurchase() {
    const date = document.getElementById('purchaseDate').value;
    const seller = document.getElementById('purchaseSeller').value;
    const location = document.getElementById('purchaseLocation').value;
    const discount = parseFloat((document.getElementById('purchaseDiscount')||{}).value) || 0;

    const rows = document.getElementById('itemsBody').rows;
    const items = [];
    for (let i = 0; i < rows.length; i++) {
        const name = rows[i].cells[2].querySelector('input').value;
        const qty = parseFloat(rows[i].cells[3].querySelector('input').value) || 1;
        const price = parseFloat(rows[i].cells[4].querySelector('input').value) || 0;
        if (name) {
            items.push({ name, quantity: qty, unit_price: price });
        }
    }

    if (items.length === 0) {
        alert('Enter at least one product name');
        return;
    }

    try {
        const url = editingId ? `${API}/api/purchases/${editingId}` : `${API}/api/purchases`;
        const method = editingId ? 'PUT' : 'POST';
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
        date, seller, location, items, discount,
        payment_status: (document.getElementById('purchasePayStatus')||{}).value || 'paid',
        paid_amount: parseFloat((document.getElementById('purchasePaidAmount')||{}).value) || 0,
        due_date: (document.getElementById('purchaseDueDate')||{}).value || '',
        tags: (document.getElementById('purchaseTags')||{}).value || '',
        currency: (document.getElementById('purchaseCurrency')||{}).value || 'IRT',
        description: (document.getElementById('purchaseNotes')||{}).value || '',
        total: Math.max(0, items.reduce((s,i)=>s+(i.quantity*i.unit_price),0)-discount)
      })
        });

        if (res.ok) {
            editingId = null;
            setModalTitle('newPurchaseModal', t('btn_new_purchase'));
            closeModal();
            loadPurchases();
            loadDashboard();
            alert(appLang==='fa' ? (method==='PUT'?'خرید به‌روز شد':'خرید ذخیره شد') : (method==='PUT'?'Purchase updated':'Purchase saved'));
        } else {
            let msg = appLang==='fa'?'خطا در ذخیره خرید':'Error saving purchase';
            try {
              const err = await res.json();
              if (err && err.detail) msg += '\n' + (typeof err.detail==='string'?err.detail:JSON.stringify(err.detail));
            } catch(e2) {}
            alert(msg);
        }
    } catch(e) {
        alert((appLang==='fa'?'خطای ارتباط با سرور':'Server connection error') + '\n' + (e && e.message ? e.message : ''));
    }
}

// ═══════════════════════════════════════════════════════════════
// ═══ Dark Mode ═══
// ═══════════════════════════════════════════════════════════════

let isDarkMode = false;

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark', isDarkMode);
    document.body.classList.toggle('dark-mode', isDarkMode);
    try { localStorage.setItem('cludari_dark', isDarkMode ? '1' : '0'); } catch(e) {}
    var icon = document.getElementById('darkModeIcon');
    if (icon) icon.textContent = isDarkMode ? '☀️' : '🌙';
    var txt = document.getElementById('darkModeText');
    if (txt) txt.textContent = isDarkMode ? t('light') : t('dark');
    // topbar moon button feedback
    document.querySelectorAll('[onclick*="toggleDarkMode"]').forEach(function(b){
      if (b.tagName === 'BUTTON') b.textContent = isDarkMode ? '☀️' : '🌙';
    });
}
function applySavedTheme() {
    try {
      isDarkMode = localStorage.getItem('cludari_dark') === '1';
    } catch(e) { isDarkMode = false; }
    document.body.classList.toggle('dark', isDarkMode);
    document.body.classList.toggle('dark-mode', isDarkMode);
    document.querySelectorAll('[onclick*="toggleDarkMode"]').forEach(function(b){
      if (b.tagName === 'BUTTON') b.textContent = isDarkMode ? '☀️' : '🌙';
    });
}


// ═══════════════════════════════════════════════════════════════
// ═══ Helpers ═══
// ═══════════════════════════════════════════════════════════════

function toPersianDigits(str) {
    const map = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    return String(str).replace(/[0-9]/g, d => map[+d]);
}
function toLatinDigits(str) {
    const map = {'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9',
                 '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
    return String(str).replace(/[۰-۹٠-٩]/g, d => map[d] || d);
}
function formatNumber(n) {
  var num = Number(n);
  if (!isFinite(num)) num = 0;
  try {
    if (appLang === 'fa') {
      return new Intl.NumberFormat('fa-IR').format(num);
    }
    return new Intl.NumberFormat('en-US').format(num);
  } catch (e) {
    return String(num);
  }
}

function toJalali(dateStr) {
  if (!dateStr) return '';
  if (appLang !== 'fa') {
    return String(dateStr).replace(/-/g, '/');
  }
  try {
    const s = String(dateStr).replace(/\//g, '-');
    const parts = s.split(/[ T]/)[0].split('-');
    if (parts.length !== 3) return toPersianDigits(dateStr);
    let y = parseInt(parts[0], 10), m = parseInt(parts[1], 10), d = parseInt(parts[2], 10);
    if (y > 1200 && y < 1500) {
      return toPersianDigits(y + '/' + String(m).padStart(2,'0') + '/' + String(d).padStart(2,'0'));
    }
    const g = new Date(y, m - 1, d);
    const formatted = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(g);
    return toPersianDigits(formatted);
  } catch (e) {
    return toPersianDigits(dateStr);
  }
}

// ═══════════════════════════════════════════════════════════════
// ═══ Categories ═══
// ═══════════════════════════════════════════════════════════════

async function loadCategories() {
    try {
        const res = await fetch(`${API}/api/categories`);
        const data = await res.json();
        cacheCategories = data || [];
        const tbody = document.getElementById('categoriesTable');
        if (!tbody) return;
        if (data.length > 0) {
            tbody.innerHTML = data.map(c => `
                <tr>
                    <td>${c.name}</td>
                    <td>${c.parent_id === 0 ? '—' : (data.find(p => p.id === c.parent_id) || {}).name || '—'}</td>
                    <td>${c.children_count || 0}</td>
                    <td style="white-space:nowrap">
                        <button class="btn btn-secondary" style="padding:4px 8px;font-size:12px;margin-left:4px" title="Edit" onclick="editCategory(${c.id})">✏️</button>
                        <button class="btn btn-danger" style="padding:4px 10px;font-size:12px;" onclick="deleteCategory(${c.id})">${t('btn_delete')}</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);">No categories found</td></tr>';
        }
    } catch(e) {
        console.error('Categories error:', e);
    }
}

async function addCategory() {
    const name = document.getElementById('categoryName').value.trim();
    if (!name) return alert('Enter category name');
    try {
        await fetch(`${API}/api/categories`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, parent_id: 0, icon: '📁'})
        });
        document.getElementById('categoryName').value = '';
        loadCategories();
    } catch(e) {
        alert('Error saving category');
    }
}

async function deleteCategory(id) {
    if (!confirm('Delete this category?')) return;
    try {
        await fetch(`${API}/api/categories/${id}`, {method: 'DELETE'});
        loadCategories();
    } catch(e) {
        alert('Error deleting');
    }
}

// ═══════════════════════════════════════════════════════════════
// ═══ Contacts ═══
// ═══════════════════════════════════════════════════════════════

async function loadContacts() {
    try {
        const res = await fetch(`${API}/api/contacts`);
        const data = await res.json();
        cacheContacts = data || [];
        const tbody = document.getElementById('contactsTable');
        if (!tbody) return;
        if (data && data.length > 0) {
            tbody.innerHTML = data.map(c => `
                <tr>
                    <td>${c.name}</td>
                    <td>${c.category || ''}</td>
                    <td>${c.phone || ''}</td>
                    <td>${c.email || ''}</td>
                    <td>${c.company || ''}</td>
                    <td style="white-space:nowrap">
                        <button class="btn btn-secondary" style="padding:4px 8px;font-size:12px;margin-left:4px" title="Edit" onclick="editContact(${c.id})">✏️</button>
                        <button class="btn btn-danger" style="padding:4px 10px;font-size:12px;" onclick="deleteContact(${c.id})">${t('btn_delete')}</button>
                    </td>
                </tr>
            `).join('');
        } else {
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);">No contacts found</td></tr>';
        }
    } catch(e) {
        console.error('Contacts error:', e);
    }
}

async function addContact(event) {
    if (event) event.preventDefault();

    const nameInput = document.getElementById('contactName');
    const categoryInput = document.getElementById('contactCategory');
    const phoneInput = document.getElementById('contactPhone');
    const emailInput = document.getElementById('contactEmail');
    const addressInput = document.getElementById('contactAddress');
    const companyInput = document.getElementById('contactCompany');
    const descInput = document.getElementById('contactDesc');

    const name = nameInput.value.trim();
    if (!name) {
        alert('Please enter contact name');
        return;
    }

    const contactData = {
        name: name,
        category: categoryInput.value,
        phone: phoneInput.value,
        email: emailInput.value,
        address: addressInput.value,
        company: companyInput.value,
        description: descInput.value
    };

    try {
        const res = await fetch(editingId ? `${API}/api/contacts/${editingId}` : `${API}/api/contacts`, {
            method: editingId ? 'PUT' : 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(contactData)
        });

        if (res.ok) {
            const contactModal = document.getElementById('contactModal');
            contactModal.classList.remove('active');
            contactModal.style.zIndex = '';
            nameInput.value = '';
            phoneInput.value = '';
            emailInput.value = '';
            addressInput.value = '';
            companyInput.value = '';
            descInput.value = '';
            editingId = null;
            setModalTitle('contactModal', t('btn_add_contact'));

            if (currentPage === 'contacts') loadContacts();
            if (currentPage === 'sellers') loadSellers();

            alert('Contact saved');
        } else {
            const errData = await res.json();
            alert('Save error: ' + (errData.detail || 'Unknown error'));
        }
    } catch(e) {
        console.error('Add contact error:', e);
        alert('Server connection error');
    }
}

async function deleteContact(id) {
    if (!confirm('Delete this contact?')) return;
    try {
        await fetch(`${API}/api/contacts/${id}`, {method: 'DELETE'});
        loadContacts();
    } catch(e) {
        alert('Error deleting');
    }
}

// ═══════════════════════════════════════════════════════════════
// ═══ Customers ═══
// ═══════════════════════════════════════════════════════════════

async function loadCustomers() {
    try {
        const searchEl = document.getElementById('customerSearch');
        const search = searchEl ? searchEl.value : '';
        const res = await fetch(`${API}/api/customers?search=${encodeURIComponent(search)}`);
        const data = await res.json();
        cacheCustomers = data || [];
        const tbody = document.getElementById('customersTable');
        if (!tbody) return;
        if (data.length > 0) {
            tbody.innerHTML = data.map(c => `
                <tr>
                    <td>${c.code}</td>
                    <td>${c.name}</td>
                    <td>${c.phone || ''}</td>
                    <td>${c.address || ''}</td>
                    <td style="white-space:nowrap">
                        <button class="btn btn-secondary" style="padding:4px 8px;font-size:12px;margin-left:4px" title="Edit" onclick="editCustomer(${c.id})">✏️</button>
                        <button class="btn btn-danger" style="padding:4px 10px;font-size:12px;" onclick="deleteCustomer(${c.id})">${t('btn_delete')}</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);">No customers found</td></tr>';
        }
    } catch(e) {
        console.error('Customers error:', e);
    }

}

async function addCustomer() {
    const name = document.getElementById('customerName').value.trim();
    if (!name) return alert('Enter customer name');
    try {
        await fetch(editingId ? `${API}/api/customers/${editingId}` : `${API}/api/customers`, {
            method: editingId ? 'PUT' : 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                code: document.getElementById('customerCode').value,
                name,
                phone: document.getElementById('customerPhone').value,
                address: document.getElementById('customerAddress').value,
                description: document.getElementById('customerDesc').value
            })
        });
        document.getElementById('customerName').value = '';
        document.getElementById('customerModal').classList.remove('active');
        editingId = null;
        setModalTitle('customerModal', t('new_customer'));
        loadCustomers();
    } catch(e) {
        alert('Error saving customer');
    }
}

async function deleteCustomer(id) {
    if (!confirm('Delete this customer?')) return;
    try {
        await fetch(`${API}/api/customers/${id}`, {method: 'DELETE'});
        loadCustomers();
    } catch(e) {
        alert('Error deleting');
    }
}

// ═══════════════════════════════════════════════════════════════
// ═══ Documents ═══
// ═══════════════════════════════════════════════════════════════

async function loadDocuments() {
    try {
        const res = await fetch(`${API}/api/documents`);
        const data = await res.json();
        cacheDocuments = data || [];
        const tbody = document.getElementById('documentsTable');
        if (!tbody) return;
        if (data.length > 0) {
            tbody.innerHTML = data.map(d => `
                <tr>
                    <td>${d.title}</td>
                    <td>${d.category || ''}</td>
                    <td>${d.file_type || ''}</td>
                    <td>${d.description || ''}</td>
                    <td style="white-space:nowrap">
                        <button class="btn btn-secondary" style="padding:4px 8px;font-size:12px;margin-left:4px" title="Edit" onclick="editDocument(${d.id})">✏️</button>
                        <button class="btn btn-danger" style="padding:4px 10px;font-size:12px;" onclick="deleteDocument(${d.id})">${t('btn_delete')}</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);">No documents found</td></tr>';
        }
    } catch(e) {
        console.error('Documents error:', e);
    }

}

async function addDocument() {
    const title = document.getElementById('docTitle').value.trim();
    if (!title) return alert('Enter document title');
    try {
        const body = {
            title, category: document.getElementById('docCategory').value,
            file_path: document.getElementById('docPath').value,
            file_type: document.getElementById('docType').value,
            description: document.getElementById('docDesc').value
        };
        const res = await fetch(editingId ? `${API}/api/documents/${editingId}` : `${API}/api/documents`, {
            method: editingId ? 'PUT' : 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body)
        });
        if (!res.ok) return alert('Error saving document');
        document.getElementById('docTitle').value = '';
        document.getElementById('docCategory').value = '';
        document.getElementById('docPath').value = '';
        document.getElementById('docType').value = '';
        document.getElementById('docDesc').value = '';
        document.getElementById('docModal').classList.remove('active');
        editingId = null;
        setModalTitle('docModal', t('btn_new_document'));
        loadDocuments();
    } catch(e) {
        alert('Error saving document');
    }
}

async function deleteDocument(id) {
    if (!confirm('Delete this document?')) return;
    try {
        await fetch(`${API}/api/documents/${id}`, {method: 'DELETE'});
        loadDocuments();
    } catch(e) {
        alert('Error deleting');
    }
}

// ═══════════════════════════════════════════════════════════════
// ═══ Licenses ═══
// ═══════════════════════════════════════════════════════════════

async function loadLicenses() {
    try {
        const res = await fetch(`${API}/api/licenses`);
        const data = await res.json();
        cacheLicenses = data || [];
        const tbody = document.getElementById('licensesTable');
        if (!tbody) return;
        if (data.length > 0) {
            tbody.innerHTML = data.map(l => `
                <tr>
                    <td>${l.name}</td>
                    <td>${l.category || ''}</td>
                    <td>${statusLabel(l.status)}</td>
                    <td>${l.expiry_date || ''}</td>
                    <td style="white-space:nowrap">
                        <button class="btn btn-secondary" style="padding:4px 8px;font-size:12px;margin-left:4px" title="Edit" onclick="editLicense(${l.id})">✏️</button>
                        <button class="btn btn-danger" style="padding:4px 10px;font-size:12px;" onclick="deleteLicense(${l.id})">${t('btn_delete')}</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);">No licenses found</td></tr>';
        }
    } catch(e) {
        console.error('Licenses error:', e);
    }

}

async function addLicense() {
    const name = document.getElementById('licenseName').value.trim();
    if (!name) return alert('Enter license name');
    try {
        const body = {
            name, category: document.getElementById('licenseCategory').value,
            license_key: document.getElementById('licenseKey').value,
            username: document.getElementById('licenseUser').value,
            password: document.getElementById('licensePass').value,
            expiry_date: document.getElementById('licenseExpiry').value,
            status: document.getElementById('licenseStatus').value,
            description: document.getElementById('licenseDesc').value
        };
        const res = await fetch(editingId ? `${API}/api/licenses/${editingId}` : `${API}/api/licenses`, {
            method: editingId ? 'PUT' : 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body)
        });
        if (!res.ok) return alert('Error saving license');
        document.getElementById('licenseName').value = '';
        document.getElementById('licenseModal').classList.remove('active');
        editingId = null;
        setModalTitle('licenseModal', t('new_license'));
        loadLicenses();
    } catch(e) {
        alert('Error saving license');
    }
}

async function deleteLicense(id) {
    if (!confirm('Delete this license?')) return;
    try {
        await fetch(`${API}/api/licenses/${id}`, {method: 'DELETE'});
        loadLicenses();
    } catch(e) {
        alert('Error deleting');
    }
}

// ═══════════════════════════════════════════════════════════════
// ═══ Reminders ═══
// ═══════════════════════════════════════════════════════════════

async function loadReminders() {
    try {
        const res = await fetch(`${API}/api/reminders`);
        const data = await res.json();
        cacheReminders = data || [];
        const tbody = document.getElementById('remindersTable');
        if (!tbody) return;
        if (data.length > 0) {
            tbody.innerHTML = data.map(r => `
                <tr>
                    <td>${r.title}</td>
                    <td>${r.category || ''}</td>
                    <td>${r.remind_date || ''}</td>
                    <td>${statusLabel(r.status)}</td>
                    <td style="white-space:nowrap">
                        <button class="btn btn-secondary" style="padding:4px 8px;font-size:12px;margin-left:4px" title="Edit" onclick="editReminder(${r.id})">✏️</button>
                        <button class="btn btn-danger" style="padding:4px 10px;font-size:12px;" onclick="deleteReminder(${r.id})">${t('btn_delete')}</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);">No reminders found</td></tr>';
        }
    } catch(e) {
        console.error('Reminders error:', e);
    }

}

async function addReminder() {
    const title = document.getElementById('reminderTitle').value.trim();
    if (!title) return alert('Enter reminder title');
    try {
        const body = {
            title, category: document.getElementById('reminderCategory').value,
            remind_date: document.getElementById('reminderDate').value,
            remind_time: document.getElementById('reminderTime').value,
            repeat_type: document.getElementById('reminderRepeat').value,
            status: document.getElementById('reminderStatus').value,
            description: document.getElementById('reminderDesc').value
        };
        const res = await fetch(editingId ? `${API}/api/reminders/${editingId}` : `${API}/api/reminders`, {
            method: editingId ? 'PUT' : 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body)
        });
        if (!res.ok) return alert('Error saving reminder');
        document.getElementById('reminderTitle').value = '';
        document.getElementById('reminderModal').classList.remove('active');
        editingId = null;
        setModalTitle('reminderModal', t('new_reminder'));
        loadReminders();
    } catch(e) {
        alert('Error saving reminder');
    }
}

async function deleteReminder(id) {
    if (!confirm('Delete this reminder?')) return;
    try {
        await fetch(`${API}/api/reminders/${id}`, {method: 'DELETE'});
        loadReminders();
    } catch(e) {
        alert('Error deleting');
    }
}

// ═══════════════════════════════════════════════════════════════
// ═══ Subscriptions ═══
// ═══════════════════════════════════════════════════════════════

async function loadSubscriptions() {
    try {
        const res = await fetch(`${API}/api/subscriptions`);
        const data = await res.json();
        cacheSubscriptions = data || [];
        const tbody = document.getElementById('subscriptionsTable');
        if (!tbody) return;
        if (data.length > 0) {
            tbody.innerHTML = data.map(s => `
                <tr>
                    <td>${s.name}</td>
                    <td>${s.category || ''}</td>
                    <td>${s.plan || ''}</td>
                    <td>${formatNumber(s.yearly_price || 0)} ${appLang==='fa'?'تومان':'Toman'}</td>
                    <td>${s.status || ''}</td>
                    <td style="white-space:nowrap">
                        <button class="btn btn-secondary" style="padding:4px 8px;font-size:12px;margin-left:4px" title="Edit" onclick="editSubscription(${s.id})">✏️</button>
                        <button class="btn btn-danger" style="padding:4px 10px;font-size:12px;" onclick="deleteSubscription(${s.id})">${t('btn_delete')}</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);">No subscriptions found</td></tr>';
        }
    } catch(e) {
        console.error('Subscriptions error:', e);
    }

}

async function addSubscription() {
    const name = document.getElementById('subName').value.trim();
    if (!name) return alert('Enter subscription name');
    try {
        await fetch(editingId ? `${API}/api/subscriptions/${editingId}` : `${API}/api/subscriptions`, {
            method: editingId ? 'PUT' : 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name, category: document.getElementById('subCategory').value,
                plan: document.getElementById('subPlan').value,
                monthly_price: document.getElementById('subMonthly').value,
                yearly_price: document.getElementById('subYearly').value,
                start_date: document.getElementById('subStart').value,
                renewal_date: document.getElementById('subRenewal').value,
                status: document.getElementById('subStatus').value,
                auto_renew: (document.getElementById('subAutoRenew').type === 'checkbox' ? (document.getElementById('subAutoRenew').checked ? 1 : 0) : parseInt(document.getElementById('subAutoRenew').value || '1')),
                description: document.getElementById('subDesc').value
            })
        });
        document.getElementById('subName').value = '';
        document.getElementById('subModal').classList.remove('active');
        editingId = null;
        setModalTitle('subModal', t('new_subscription'));
        loadSubscriptions();
    } catch(e) {
        alert('Error saving subscription');
    }
}

async function deleteSubscription(id) {
    if (!confirm('Delete this subscription?')) return;
    try {
        await fetch(`${API}/api/subscriptions/${id}`, {method: 'DELETE'});
        loadSubscriptions();
    } catch(e) {
        alert('Error deleting');
    }
}

// ═══════════════════════════════════════════════════════════════
// ═══ Bills ═══
// ═══════════════════════════════════════════════════════════════

async function loadBills() {
    try {
        const res = await fetch(`${API}/api/bills`);
        const data = await res.json();
        cacheBills = data || [];
        const tbody = document.getElementById('billsTable');
        if (!tbody) return;
        if (data.length > 0) {
            tbody.innerHTML = data.map(b => `
                <tr>
                    <td>${b.name}</td>
                    <td>${b.category || ''}</td>
                    <td>${formatNumber(b.amount || 0)} ${appLang==='fa'?'تومان':'Toman'}</td>
                    <td>${b.due_date || '—'}</td>
                    <td>${statusLabel(b.status)}</td>
                    <td style="white-space:nowrap">
                        <button class="btn btn-secondary" style="padding:4px 8px;font-size:12px;margin-left:4px" title="Edit" onclick="editBill(${b.id})">✏️</button>
                        <button class="btn btn-danger" style="padding:4px 10px;font-size:12px;" onclick="deleteBill(${b.id})">${t('btn_delete')}</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);">No bills found</td></tr>';
        }
    } catch(e) {
        console.error('Bills error:', e);
    }

}

async function addBill() {
    const name = document.getElementById('billName').value.trim();
    if (!name) return alert('Enter bill name');
    try {
        await fetch(editingId ? `${API}/api/bills/${editingId}` : `${API}/api/bills`, {
            method: editingId ? 'PUT' : 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name, category: document.getElementById('billCategory').value,
                amount: document.getElementById('billAmount').value,
                due_date: document.getElementById('billDueDate').value,
                status: document.getElementById('billStatus').value,
                bill_number: document.getElementById('billNumber').value,
                meter_number: document.getElementById('billMeter').value,
                description: document.getElementById('billDesc').value
            })
        });
        document.getElementById('billName').value = '';
        document.getElementById('billModal').classList.remove('active');
        editingId = null;
        setModalTitle('billModal', t('new_bill'));
        loadBills();
    } catch(e) {
        alert('Error saving bill');
    }
}

async function deleteBill(id) {
    if (!confirm('Delete this bill?')) return;
    try {
        await fetch(`${API}/api/bills/${id}`, {method: 'DELETE'});
        loadBills();
    } catch(e) {
        alert('Error deleting');
    }
}

// ═══════════════════════════════════════════════════════════════
// ═══ Checks / Cheques ═══
// ═══════════════════════════════════════════════════════════════

var checkEditingId = null;

async function openCheckModal(id) {
    checkEditingId = id ? Number(id) : null;
    var set = function(i,v){ var el=document.getElementById(i); if(el) el.value = (v == null ? '' : v); };
    ['checkNumber','checkSayadId','checkSerial','checkSeries','checkParty','checkBank',
     'checkBranch','checkAccount','checkOwner','checkOwnerNationalId','checkAmount',
     'checkDate','checkDueDate','checkDesc','checkReason'].forEach(function(fid){ set(fid, ''); });
    set('checkType', 'received');
    set('checkStatus', 'pending');
    set('checkAmount', '0');
    set('checkDate', new Date().toISOString().slice(0,10));

    var c = null;
    if (checkEditingId) {
      // prefer fresh from server
      try {
        var res = await fetch((typeof API!=='undefined'?API:'') + '/api/checks/' + checkEditingId);
        if (res.ok) c = await res.json();
      } catch (e) { console.warn(e); }
      if (!c && Array.isArray(cacheChecks)) {
        c = cacheChecks.find(function(x){ return Number(x.id) === Number(checkEditingId); }) || null;
      }
    }

    if (c) {
      set('checkNumber', c.check_number || '');
      set('checkType', c.check_type || 'received');
      set('checkParty', c.party || '');
      set('checkBank', c.bank || '');
      set('checkAmount', (c.amount != null ? c.amount : 0));
      set('checkDate', c.check_date || new Date().toISOString().slice(0,10));
      set('checkDueDate', c.due_date || '');
      set('checkStatus', c.status || 'pending');
      set('checkAccount', c.account || '');
      set('checkDesc', c.description || '');
      set('checkSayadId', c.sayad_id || '');
      set('checkSerial', c.serial || '');
      set('checkSeries', c.series || '');
      set('checkBranch', c.branch || '');
      set('checkOwner', c.owner || '');
      set('checkOwnerNationalId', c.owner_national_id || '');
      set('checkReason', c.reason || '');
    }

    try { setModalTitle('checkModal', checkEditingId ? 'ویرایش چک' : (typeof t==='function'?t('btn_new_check'):'چک جدید')); } catch(e){}
    var m = document.getElementById('checkModal');
    if (m) {
      m.classList.add('active');
      m.style.display = 'flex';
    }
    try { if (typeof openModal === 'function') openModal('checkModal'); } catch(e){}
}
window.openCheckModal = openCheckModal;



function checkStatusLabel(status) {
    const fa = {pending:'در انتظار', deposited:'وصول/واریز شده', cleared:'تسویه شده', returned:'برگشتی', cancelled:'باطل شده'};
    const en = {pending:'Pending', deposited:'Deposited/Cashed', cleared:'Cleared', returned:'Returned', cancelled:'Cancelled'};
    return (appLang === 'fa' ? fa : en)[status] || status || '—';
}

async function loadChecks() {
    try {
        const res = await fetch(`${API}/api/checks`);
        const data = await res.json();
        cacheChecks = Array.isArray(data) ? data : [];
        const tbody = document.getElementById('checksTable');
        if (!tbody) return;
        if (!cacheChecks.length) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-secondary)">هنوز چکی ثبت نشده است</td></tr>';
            return;
        }
        tbody.innerHTML = cacheChecks.map(function(c) {
          var amt = Number(c.amount);
          if (!isFinite(amt)) amt = 0;
          var due = c.due_date || c.check_date || '—';
          var party = c.party || c.owner || '—';
          var bank = c.bank || '—';
          return '<tr data-id="'+c.id+'">' +
            '<td>' + (c.check_number || '—') + '</td>' +
            '<td>' + (c.check_type === 'issued' ? 'پرداختی' : 'دریافتی') + '</td>' +
            '<td>' + party + '</td>' +
            '<td>' + bank + '</td>' +
            '<td style="white-space:nowrap;font-weight:600">' + formatNumber(amt) + (appLang==='fa'?' تومان':'') + '</td>' +
            '<td style="white-space:nowrap">' + due + '</td>' +
            '<td>' + checkStatusLabel(c.status) + '</td>' +
            '<td style="white-space:nowrap">' +
              '<button type="button" class="btn btn-secondary" style="padding:2px 6px;font-size:11px" onclick="openCheckModal('+c.id+')">✏️</button> ' +
              '<button type="button" class="btn btn-secondary" style="padding:2px 6px;font-size:11px" onclick="checkAction('+c.id+',\'deposit\')">واگذاری</button> ' +
              '<button type="button" class="btn btn-secondary" style="padding:2px 6px;font-size:11px" onclick="checkAction('+c.id+',\'clear\')">وصول</button> ' +
              '<button type="button" class="btn btn-secondary" style="padding:2px 6px;font-size:11px" onclick="checkAction('+c.id+',\'return\')">برگشت</button> ' +
              '<button type="button" class="btn btn-secondary" style="padding:2px 6px;font-size:11px" onclick="checkAction('+c.id+',\'cancel\')">خرج</button> ' +
              '<button type="button" class="btn btn-danger" style="padding:2px 6px;font-size:11px" onclick="deleteCheck('+c.id+')">حذف</button>' +
            '</td></tr>';
        }).join('');
    } catch (e) {
        console.error(e);
        toast(appLang==='fa' ? 'خطا در بارگذاری چک‌ها' : 'Failed to load checks', 'error');
    }
}
window.loadChecks = loadChecks;


async function saveCheck() {
    const number = document.getElementById('checkNumber').value.trim();
    if (!number) return alert(appLang==='fa' ? 'شماره چک را وارد کنید' : 'Enter check number');
    const gv = function(id){ var e=document.getElementById(id); return e ? e.value.trim() : ''; };
    const payload = {
        check_number: number,
        check_type: (document.getElementById('checkType')||{}).value || 'received',
        party: gv('checkParty'),
        bank: gv('checkBank'),
        amount: (function(){ var v=String((document.getElementById('checkAmount')||{}).value||'0'); v=v.replace(/[\u06F0-\u06F9]/g,function(d){return String(d.charCodeAt(0)-0x06F0);}).replace(/,/g,'').replace(/،/g,''); return parseFloat(v)||0; })(),
        check_date: gv('checkDate'),
        due_date: gv('checkDueDate'),
        status: (document.getElementById('checkStatus')||{}).value || 'pending',
        account: gv('checkAccount'),
        description: gv('checkDesc'),
        sayad_id: gv('checkSayadId'),
        serial: gv('checkSerial'),
        series: gv('checkSeries'),
        branch: gv('checkBranch'),
        owner: gv('checkOwner'),
        owner_national_id: gv('checkOwnerNationalId'),
        reason: gv('checkReason')
    };
    try {
        const isEdit = !!checkEditingId;
        const url = isEdit ? `${API}/api/checks/${checkEditingId}` : `${API}/api/checks`;
        const res = await fetch(url, {method: isEdit ? 'PUT' : 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)});
        if (!res.ok) {
            var errTxt = await res.text();
            try { var ej = JSON.parse(errTxt); errTxt = ej.detail || errTxt; } catch(e){}
            throw new Error(errTxt || ('HTTP ' + res.status));
        }
        closeModal('checkModal');
        checkEditingId = null;
        try { await loadChecks(); } catch(e){}

        setModalTitle('checkModal', t('btn_new_check'));
        await loadChecks();
        toast(appLang==='fa' ? 'چک ذخیره شد' : 'Check saved', 'success');
    } catch(e) {
        console.error(e);
        toast(appLang==='fa' ? 'خطا در ذخیره چک' : 'Error saving check', 'error');
    }
}

async function deleteCheck(id) {
    if (!confirm(appLang==='fa' ? 'این چک حذف شود؟' : 'Delete this check?')) return;
    try {
        const res = await fetch(`${API}/api/checks/${id}`, {method:'DELETE'});
        if (!res.ok) throw new Error(await res.text());
        loadChecks();
    } catch(e) {
        toast(appLang==='fa' ? 'خطا در حذف چک' : 'Error deleting check', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════
// ═══ Accounts ═══
// ═══════════════════════════════════════════════════════════════

async function loadAccounts() {
    try {
        const res = await fetch(`${API}/api/accounts`);
        const data = await res.json();
        cacheAccounts = data || [];
        const tbody = document.getElementById('accountsTable');
        if (!tbody) return;
        if (data.length > 0) {
            tbody.innerHTML = data.map(a => `
                <tr>
                    <td>${a.name}</td>
                    <td>${a.type || ''}</td>
                    <td>${a.bank || ''}</td>
                    <td>${a.card_number || ''}</td>
                    <td>${a.status || ''}</td>
                    <td style="white-space:nowrap">
                        <button class="btn btn-secondary" style="padding:4px 8px;font-size:12px;margin-left:4px" title="Edit" onclick="editAccount(${a.id})">✏️</button>
                        <button class="btn btn-danger" style="padding:4px 10px;font-size:12px;" onclick="deleteAccount(${a.id})">${t('btn_delete')}</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);">No accounts found</td></tr>';
        }
    } catch(e) {
        console.error('Accounts error:', e);
    }

}

async function addAccount() {
    const name = document.getElementById('accountName').value.trim();
    if (!name) return alert('Enter account name');
    try {
        await fetch(editingId ? `${API}/api/accounts/${editingId}` : `${API}/api/accounts`, {
            method: editingId ? 'PUT' : 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name, type: document.getElementById('accountType').value,
                bank: document.getElementById('accountBank').value,
                card_number: document.getElementById('accountCard').value,
                iban: document.getElementById('accountIban').value,
                currency: document.getElementById('accountCurrency').value,
                initial_balance: document.getElementById('accountInitBalance').value,
                current_balance: document.getElementById('accountBalance').value,
                color: document.getElementById('accountColor').value,
                status: document.getElementById('accountStatus').value
            })
        });
        document.getElementById('accountName').value = '';
        document.getElementById('accountModal').classList.remove('active');
        editingId = null;
        setModalTitle('accountModal', t('btn_new_account'));
        loadAccounts();
    } catch(e) {
        alert('Error saving account');
    }
}

async function deleteAccount(id) {
    if (!confirm('Delete this account?')) return;
    try {
        await fetch(`${API}/api/accounts/${id}`, {method: 'DELETE'});
        loadAccounts();
    } catch(e) {
        alert('Error deleting');
    }
}

// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// ═══ Edit helpers ═══
// ═══════════════════════════════════════════════════════════════

function setModalTitle(modalId, title) {
    const el = document.querySelector('#' + modalId + ' .modal-title');
    if (el) el.textContent = title;
}

function editProduct(id) {
    const p = cacheProducts.find(x => x.id === id);
    if (!p) return alert('Product not found');
    editingId = id;
    document.getElementById('prodCode').value = p.code || '';
    document.getElementById('prodName').value = p.name || '';
    document.getElementById('prodBrand').value = p.brand || '';
    document.getElementById('prodModel').value = p.model || '';
    document.getElementById('prodCategory').value = p.category || '';
    setModalTitle('productModal', appLang==='fa'?'ویرایش کالا':'Edit product');
    document.getElementById('productModal').classList.add('active');
}

function editDocument(id) {
    const d = cacheDocuments.find(x => x.id === id);
    if (!d) return alert('Document not found');
    editingId = id;
    document.getElementById('docTitle').value = d.title || '';
    document.getElementById('docCategory').value = d.category || '';
    document.getElementById('docPath').value = d.file_path || '';
    document.getElementById('docType').value = d.file_type || '';
    document.getElementById('docDesc').value = d.description || '';
    setModalTitle('docModal', t('edit_document'));
    document.getElementById('docModal').classList.add('active');
}

function editLicense(id) {
    const l = cacheLicenses.find(x => x.id === id);
    if (!l) return alert('License not found');
    editingId = id;
    document.getElementById('licenseName').value = l.name || '';
    document.getElementById('licenseCategory').value = l.category || '';
    document.getElementById('licenseKey').value = l.license_key || '';
    document.getElementById('licenseUser').value = l.username || '';
    document.getElementById('licensePass').value = l.password || '';
    document.getElementById('licenseExpiry').value = l.expiry_date || '';
    document.getElementById('licenseStatus').value = l.status || 'active';
    document.getElementById('licenseDesc').value = l.description || '';
    setModalTitle('licenseModal', t('edit_license'));
    document.getElementById('licenseModal').classList.add('active');
}

function editReminder(id) {
    const r = cacheReminders.find(x => x.id === id);
    if (!r) return alert('No reminders found');
    editingId = id;
    document.getElementById('reminderTitle').value = r.title || '';
    document.getElementById('reminderCategory').value = r.category || '';
    document.getElementById('reminderDate').value = r.remind_date || '';
    document.getElementById('reminderTime').value = r.remind_time || '';
    document.getElementById('reminderRepeat').value = r.repeat_type || 'none';
    document.getElementById('reminderStatus').value = r.status || t('status_pending');
    document.getElementById('reminderDesc').value = r.description || '';
    setModalTitle('reminderModal', t('edit_reminder'));
    document.getElementById('reminderModal').classList.add('active');
}

function editSubscription(id) {
    const s = cacheSubscriptions.find(x => x.id === id);
    if (!s) return alert('Subscription not found');
    editingId = id;
    document.getElementById('subName').value = s.name || '';
    document.getElementById('subCategory').value = s.category || '';
    document.getElementById('subPlan').value = s.plan || '';
    document.getElementById('subMonthly').value = s.monthly_price || 0;
    document.getElementById('subYearly').value = s.yearly_price || 0;
    document.getElementById('subStart').value = s.start_date || '';
    document.getElementById('subRenewal').value = s.renewal_date || '';
    document.getElementById('subStatus').value = s.status || 'active';
    document.getElementById('subAutoRenew').value = String(s.auto_renew != null ? s.auto_renew : 1);
    document.getElementById('subDesc').value = s.description || '';
    setModalTitle('subModal', t('edit_subscription'));
    document.getElementById('subModal').classList.add('active');
}

function editBill(id) {
    const b = cacheBills.find(x => x.id === id);
    if (!b) return alert('Bill not found');
    editingId = id;
    document.getElementById('billName').value = b.name || '';
    document.getElementById('billCategory').value = b.category || '';
    document.getElementById('billAmount').value = b.amount || 0;
    document.getElementById('billDueDate').value = b.due_date || '';
    document.getElementById('billStatus').value = b.status || t('status_pending');
    document.getElementById('billNumber').value = b.bill_number || '';
    document.getElementById('billMeter').value = b.meter_number || '';
    document.getElementById('billDesc').value = b.description || '';
    setModalTitle('billModal', t('edit_bill'));
    document.getElementById('billModal').classList.add('active');
}

function editAccount(id) {
    const a = cacheAccounts.find(x => x.id === id);
    if (!a) return alert('Account not found');
    editingId = id;
    document.getElementById('accountName').value = a.name || '';
    document.getElementById('accountType').value = a.type || 'bank';
    document.getElementById('accountBank').value = a.bank || '';
    document.getElementById('accountCard').value = a.card_number || '';
    document.getElementById('accountIban').value = a.iban || '';
    document.getElementById('accountCurrency').value = a.currency || 'IRR';
    document.getElementById('accountInitBalance').value = a.initial_balance || 0;
    document.getElementById('accountBalance').value = a.current_balance || 0;
    document.getElementById('accountColor').value = a.color || '#4F46E5';
    document.getElementById('accountStatus').value = a.status || 'active';
    setModalTitle('accountModal', t('edit_account'));
    document.getElementById('accountModal').classList.add('active');
}

function editCustomer(id) {
    const c = cacheCustomers.find(x => x.id === id);
    if (!c) return alert('No customers found');
    editingId = id;
    document.getElementById('customerCode').value = c.code || '';
    document.getElementById('customerName').value = c.name || '';
    document.getElementById('customerPhone').value = c.phone || '';
    document.getElementById('customerAddress').value = c.address || '';
    document.getElementById('customerDesc').value = c.description || '';
    setModalTitle('customerModal', t('edit_customer'));
    document.getElementById('customerModal').classList.add('active');
}

function editContact(id) {
    const c = cacheContacts.find(x => x.id === id);
    if (!c) return alert('Contact not found');
    editingId = id;
    document.getElementById('contactName').value = c.name || '';
    document.getElementById('contactCategory').value = c.category || '';
    document.getElementById('contactPhone').value = c.phone || '';
    document.getElementById('contactEmail').value = c.email || '';
    document.getElementById('contactAddress').value = c.address || '';
    document.getElementById('contactCompany').value = c.company || '';
    document.getElementById('contactDesc').value = c.description || '';
    setModalTitle('contactModal', 'Edit contact');
    var cm = document.getElementById('contactModal');
    if (cm) {
      if (cm.parentElement !== document.body) document.body.appendChild(cm);
      cm.classList.add('child-dialog','active');
      if (typeof mkWinEnable === 'function') mkWinEnable(cm);
      cm.style.setProperty('z-index', String((typeof mkNextZ==='function'?mkNextZ():70001)), 'important');
    }
}

function editCategory(id) {
    const c = cacheCategories.find(x => x.id === id);
    if (!c) return alert('No categories found');
    const name = prompt('New category name:', c.name || '');
    if (name === null || !name.trim()) return;
    fetch(`${API}/api/categories/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: name.trim(), parent_id: c.parent_id || 0, icon: c.icon || '📁'})
    }).then(r => {
        if (r.ok) loadCategories();
        else alert('Edit failed');
    }).catch(() => alert('Connection error'));
}

async function editPurchase(id) {
    try {
        const res = await fetch(`${API}/api/purchases/${id}`);
        if (!res.ok) return alert('Purchase not found');
        const p = await res.json();
        editingId = id;
        try {
            const pr = await fetch(`${API}/api/products`);
            const pd = await pr.json();
            products = pd.items || [];
            cacheProducts = products;
        } catch(e) { products = []; }

        (function(){
          var d = p.date || '';
          var el = document.getElementById('purchaseDate');
          if (!el) return;
          // HTML date input needs Gregorian YYYY-MM-DD (year 1900-2100)
          if (/^(19|20)\d{2}-\d{2}-\d{2}$/.test(d)) el.value = d;
          else el.value = new Date().toISOString().split('T')[0];
        })();
        document.getElementById('purchaseSeller').value = p.seller || '';
        document.getElementById('purchaseLocation').value = p.location || '';
        var _notes = document.getElementById('purchaseNotes');
        if (_notes) _notes.value = p.description || p.notes || '';
        const _disc = document.getElementById('purchaseDiscount');
        if (_disc) _disc.value = p.discount != null ? p.discount : 0;
        const _ps = document.getElementById('purchasePayStatus'); if (_ps) _ps.value = p.payment_status || 'paid';
        const _pa = document.getElementById('purchasePaidAmount'); if (_pa) _pa.value = p.paid_amount != null ? p.paid_amount : 0;
        const _dd = document.getElementById('purchaseDueDate'); if (_dd) _dd.value = p.due_date || '';
        const _tg = document.getElementById('purchaseTags'); if (_tg) _tg.value = p.tags || '';
        const _cur = document.getElementById('purchaseCurrency'); if (_cur) _cur.value = p.currency || 'IRT';
        itemRows = [];
        document.getElementById('itemsBody').innerHTML = '';
        const items = p.items || [];
        if (items.length === 0) {
            addItemRow();
        } else {
            itemRows = items.map((it) => ({
                name: it.name || '',
                code: it.code || it.product_code || '',
                quantity: it.quantity || 1,
                unit_price: it.unit_price || 0
            }));
            renderPurchaseItemRows();
        }
        calcTotal();
        updatePurchaseJalaliHint();
        setModalTitle('newPurchaseModal', appLang==='fa' ? 'ویرایش خرید' : 'Edit Purchase');
        document.getElementById('newPurchaseModal').classList.add('active');
        applyLanguage();
    } catch(e) {
        alert('Error loading purchase');
    }
}


// ═══ Init ═══
// ═══════════════════════════════════════════════════════════════



async function printPurchase(id) {
    try {
        let p = null;
        try {
            const res = await fetch(`${API}/api/purchases/${id}`);
            if (res.ok) p = await res.json();
        } catch (fetchErr) {
            console.warn('API print fetch failed', fetchErr);
        }
        if (!p) {
            p = (cachePurchases || []).find(x => x.id === id);
            if (p && !p.items) p.items = [];
        }
        if (!p) { alert(appLang === 'fa' ? 'خرید پیدا نشد' : 'Purchase not found'); return; }

        let settings = {};
        try {
            const sr = await fetch(`${API}/api/settings`);
            if (sr.ok) settings = await sr.json();
        } catch (e) {}

        const fa = appLang === 'fa' || true; // invoice always Persian formal style
        const shop = settings.company || settings.name || 'CluDari';
        const shopAddr = settings.address || '';
        const shopPhone = settings.phone || '';
        const invNo = p.invoice_no || ('INV-' + id);
        const dateFa = (typeof toJalali === 'function' ? toJalali(p.date) : p.date) || p.date || '';
        const seller = p.seller || '—';
        const location = p.location || '';
        const notes = p.description || '';
        const items = p.items || [];
        const discount = Number(p.discount || 0);
        let subtotal = 0;
        items.forEach(function(it) {
            subtotal += Number(it.quantity || 1) * Number(it.unit_price || 0);
        });
        if (!subtotal && p.total) subtotal = Number(p.total) + discount;
        const grand = Math.max(0, subtotal - discount);
        const cur = (p.currency === 'IRT' || !p.currency) ? 'ریال' : (p.currency || 'ریال');
        // display in rial-style numbers like sample (user may store toman — show as-is with label)
        const money = function(n) {
            try { return Number(n || 0).toLocaleString('fa-IR'); } catch(e) { return String(n||0); }
        };
        const numFa = function(n) {
            try { return String(n).replace(/\d/g, function(d){ return '۰۱۲۳۴۵۶۷۸۹'[d]; }); } catch(e) { return n; }
        };

        let rowsHtml = '';
        if (items.length === 0) {
            rowsHtml = '<tr><td colspan="6" style="text-align:center;padding:16px">بدون قلم</td></tr>';
        } else {
            items.forEach(function(it, idx) {
                const line = Number(it.quantity || 1) * Number(it.unit_price || 0);
                rowsHtml += '<tr>'
                    + '<td class="c">' + numFa(idx + 1) + '</td>'
                    + '<td class="r">' + (it.name || '') + (it.description ? '<div class="muted">' + it.description + '</div>' : '') + '</td>'
                    + '<td class="c">عدد</td>'
                    + '<td class="c">' + money(it.quantity || 1) + '</td>'
                    + '<td class="c">' + money(it.unit_price || 0) + '</td>'
                    + '<td class="c">' + money(line) + '</td>'
                    + '</tr>';
            });
        }

        // no empty padding rows — only real line items

        const barcode = invNo.replace(/[^0-9A-Za-z\-]/g, '');

        const html = '<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8">'
            + '<title>فاکتور ' + invNo + '</title>'
            + '<style>'
            + '*{box-sizing:border-box;margin:0;padding:0}'
            + 'body{font-family:Tahoma,"Segoe UI",sans-serif;background:#fff;color:#111;padding:12px}'
            + '.sheet{max-width:800px;margin:0 auto;border:2px solid #222;padding:10px 12px}'
            + '.top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px}'
            + '.brand{text-align:right;flex:1}'
            + '.brand h1{font-size:22px;font-weight:800;letter-spacing:-.5px}'
            + '.brand .sub{font-size:11px;color:#333;line-height:1.7;margin-top:4px}'
            + '.meta{text-align:left;font-size:12px;min-width:160px}'
            + '.meta .barcode{font-family:monospace;font-size:14px;letter-spacing:2px;border:1px solid #333;padding:4px 8px;display:inline-block;margin-bottom:6px}'
            + '.title-row{display:flex;align-items:center;justify-content:center;gap:10px;margin:8px 0 10px}'
            + '.title-badge{border:2px solid #222;border-radius:20px;padding:4px 18px;font-weight:800;font-size:14px;background:#f3f3f3}'
            + '.info{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;font-size:12px;border:1px solid #333;padding:8px 10px;margin-bottom:8px}'
            + '.info b{font-weight:700}'
            + 'table{width:100%;border-collapse:collapse;font-size:12px}'
            + 'th,td{border:1px solid #333;padding:6px 5px;vertical-align:middle}'
            + 'th{background:#e8e8e8;font-weight:700;text-align:center}'
            + 'td.c{text-align:center}'
            + 'td.r{text-align:right}'
            + 'tr.empty td{height:22px}'
            + '.muted{font-size:10px;color:#555;margin-top:2px}'
            + '.totals{display:grid;grid-template-columns:1.2fr .8fr;gap:8px;margin-top:8px}'
            + '.tot-box{border:1px solid #333}'
            + '.tot-box table{border:none}'
            + '.tot-box td{border:1px solid #333}'
            + '.sign{display:flex;justify-content:space-between;margin-top:28px;padding:0 8px}'
            + '.sign .box{width:42%;text-align:center;font-size:12px}'
            + '.sign .line{margin-top:48px;border-top:1px dashed #666;padding-top:6px}'
            + '.foot{margin-top:12px;font-size:10px;color:#444;text-align:center}'
            + '@media print{body{padding:0}.no-print{display:none!important}.sheet{border-width:1.5px}}'
            + '</style></head><body><div class="sheet">'
            + '<div class="top">'
            + '<div class="brand"><h1>' + shop + '</h1>'
            + '<div class="sub">' + (shopAddr ? shopAddr + '<br>' : '') + (shopPhone ? ('تلفن: ' + shopPhone) : 'نرم‌افزار حسابداری شخصی CluDari') + '</div></div>'
            + '<div class="meta"><div class="barcode">*|' + barcode + '|*'+'</div>'
            + '<div>شماره فاکتور: <b>' + invNo + '</b></div>'
            + '<div>تاریخ: <b>' + dateFa + '</b></div></div></div>'
            + '<div class="title-row"><span class="title-badge">مشخصات فاکتور</span></div>'
            + '<div class="info">'
            + '<div><b>فروشنده / طرف‌حساب:</b> ' + seller + '</div>'
            + '<div><b>محل:</b> ' + (location || '—') + '</div>'
            + (notes ? ('<div style="grid-column:1/-1"><b>توضیحات:</b> ' + notes + '</div>') : '')
            + '</div>'
            + '<table><thead><tr>'
            + '<th style="width:40px">ردیف</th>'
            + '<th>شرح کالا / خدمات</th>'
            + '<th style="width:50px">واحد</th>'
            + '<th style="width:60px">تعداد</th>'
            + '<th style="width:100px">مبلغ واحد</th>'
            + '<th style="width:110px">مبلغ کل</th>'
            + '</tr></thead><tbody>' + rowsHtml + '</tbody></table>'
            + '<div class="totals">'
            + '<div class="tot-box"><table>'
            + '<tr><td>توضیحات تکمیلی</td></tr>'
            + '<tr><td style="height:52px;text-align:right;vertical-align:top;font-size:11px">' + (notes || '') + '</td></tr>'
            + '</table></div>'
            + '<div class="tot-box"><table>'
            + '<tr><td>جمع کل</td><td class="c">' + money(subtotal) + '</td></tr>'
            + '<tr><td>تخفیف</td><td class="c">' + money(discount) + '</td></tr>'
            + '<tr><td><b>مبلغ قابل پرداخت</b></td><td class="c"><b>' + money(grand) + '</b></td></tr>'
            + '<tr><td colspan="2" class="c" style="font-size:11px">مبالغ به ' + cur + ' / تومان</td></tr>'
            + '</table></div></div>'
            + '<div class="sign">'
            + '<div class="box"><div class="line">مهر و امضای فروشنده</div></div>'
            + '<div class="box"><div class="line">امضای خریدار</div></div>'
            + '</div>'
            + '<div class="foot">صادر شده توسط CluDari — صفحه ۱ از ۱</div>'
            + '</div></body></html>';

        const old = document.getElementById('printFrame');
        if (old) old.remove();
        const iframe = document.createElement('iframe');
        iframe.id = 'printFrame';
        iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none';
        document.body.appendChild(iframe);
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();
        setTimeout(function() {
            try {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            } catch (e) {
                if (typeof showPrintPreview === 'function') showPrintPreview(html);
                else alert(fa ? 'چاپ انجام نشد' : 'Print failed');
            }
        }, 280);
    } catch(e) {
        console.error(e);
        alert(appLang === 'fa' ? 'خطا در چاپ' : 'Print error');
    }
}


function showPrintPreview(html) {
    let overlay = document.getElementById('printPreviewOverlay');
    if (overlay) overlay.remove();
    overlay = document.createElement('div');
    overlay.id = 'printPreviewOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
    overlay.innerHTML = '<div style="background:#fff;width:100%;max-width:800px;max-height:90vh;border-radius:12px;overflow:hidden;display:flex;flex-direction:column">'
        + '<div class="no-print" style="padding:12px 16px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center">'
        + '<strong>Invoice preview</strong>'
        + '<div><button id="printPreviewBtn" style="margin-left:8px;padding:8px 14px;border:none;border-radius:8px;background:#6366f1;color:#fff;cursor:pointer">🖨️ Print</button>'
        + '<button id="printCloseBtn" style="padding:8px 14px;border:none;border-radius:8px;background:#e2e8f0;cursor:pointer">Close</button></div></div>'
        + '<iframe id="printPreviewFrame" style="flex:1;width:100%;min-height:60vh;border:0"></iframe></div>';
    document.body.appendChild(overlay);
    const frame = document.getElementById('printPreviewFrame');
    const fdoc = frame.contentDocument || frame.contentWindow.document;
    fdoc.open();
    fdoc.write(html);
    fdoc.close();
    document.getElementById('printCloseBtn').onclick = function() { overlay.remove(); };
    document.getElementById('printPreviewBtn').onclick = function() {
        try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch(e) { alert('Cannot print'); }
    };
}


// ═══════════════════════════════════════════════════════════════
// ═══ UI Utils: Loading / Toast / Export ═══
// ═══════════════════════════════════════════════════════════════



function hideLoading() {
    _loadingCount = 0;
    const el = document.getElementById('globalLoading');
    if (el) el.classList.remove('active');
    if (_loadingTimer) { clearTimeout(_loadingTimer); _loadingTimer = null; }
}

function toast(msg, type) {
    type = type || 'success';
    let box = document.getElementById('toastBox');
    if (!box) {
        box = document.createElement('div');
        box.id = 'toastBox';
        document.body.appendChild(box);
    }
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => {
        t.classList.remove('show');
        setTimeout(() => t.remove(), 300);
    }, 2800);
}

async function exportFile(path, filename) {
    showLoading(true);
    fetch(`${API}${path}`)
        .then(async r => {
            if (!r.ok) {
              const t = await r.text().catch(()=>'');
              throw new Error('export failed ' + r.status + ' ' + t);
            }
            // server may return JSON with saved_path for desktop
            const ct = (r.headers.get('content-type') || '');
            if (ct.indexOf('application/json') !== -1) {
              const data = await r.json();
              toast((appLang==='fa'?'ذخیره شد: ':'Saved: ') + (data.saved_path || data.path || filename));
              return null;
            }
            const disc = r.headers.get('X-Saved-Path');
            const blob = await r.blob();
            return { blob, disc };
        })
        .then(pack => {
            if (!pack) return;
            const url = URL.createObjectURL(pack.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || 'export.csv';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1500);
            const msg = pack.disc
              ? ((appLang==='fa'?'فایل ذخیره شد:\n':'Saved to:\n') + pack.disc)
              : (appLang==='fa'?'خروجی آماده شد (پوشه exports)':'Export ready (exports folder)');
            toast(msg);
        })
        .catch((e) => {
          console.error(e);
          toast(appLang==='fa'?'خروجی ناموفق':'Export failed', 'error');
        })
        .finally(() => showLoading(false));
}

function exportPurchasesExcel() { exportFile('/api/export/purchases', 'purchases.csv'); }
function exportProductsExcel() { exportFile('/api/export/products', 'products.csv'); }
function exportSellersExcel() { exportFile('/api/export/sellers', 'sellers.csv'); }


document.addEventListener('DOMContentLoaded', () => {
    if (!authToken) { return; }
    loadDashboard().finally(function() {
        showLoading(false);
        var el = document.getElementById('globalLoading');
        if (el) el.classList.remove('active');
    });
    // absolute safety net
    setTimeout(function() {
        showLoading(false);
        var el = document.getElementById('globalLoading');
        if (el) el.classList.remove('active');
    }, 3000);
});



// ═══ Advanced Database Management ═══
let dbBrowseTableName = null;
let dbBrowseOffset = 0;
const DB_BROWSE_LIMIT = 50;

async function loadDbAdmin() {
    try {
        showLoading(true);
        const res = await fetch(API + '/api/db/info');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const info = await res.json();
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('dbStatSize', (info.size_mb != null ? info.size_mb : 0) + ' MB');
        set('dbStatTables', info.table_count || 0);
        set('dbStatRows', (info.total_rows || 0).toLocaleString());
        set('dbStatIntegrity', info.integrity === 'ok' ? 'OK' : (info.integrity || '—'));
        const box = document.getElementById('dbInfoBox');
        if (box) {
          box.innerHTML =
            '<div><b>کاربر:</b> ' + (info.username || '—') + '</div>' +
            '<div><b>فایل:</b> ' + (info.filename || '—') + '</div>' +
            '<div><b>مسیر:</b> <code style="font-size:11px">' + (info.path || '—') + '</code></div>' +
            '<div><b>صفحات:</b> ' + (info.page_count || 0) + ' × ' + (info.page_size || 0) + ' · freelist: ' + (info.freelist || 0) + '</div>';
        }
        const tb = document.getElementById('dbTablesBody');
        if (tb && Array.isArray(info.tables)) {
          tb.innerHTML = info.tables.map(t =>
            '<tr><td>' + (t.name||'') + '</td><td>' + (t.rows||0) + '</td><td></td></tr>'
          ).join('') || '<tr><td colspan="3">—</td></tr>';
        }
    } catch (e) {
        console.error(e);
        toast(appLang==='fa' ? 'بارگذاری اطلاعات دیتابیس ناموفق بود' : 'DB info failed', 'error');
    } finally {
        showLoading(false);
    }
}

async function dbVacuum() {
    try {
        showLoading(true);
        const res = await fetch(`${API}/api/db/vacuum`, {method: 'POST'});
        const data = await res.json();
        toast(`Optimized. Saved ${Math.round((data.saved_bytes||0)/1024)} KB`, 'success');
        loadDbAdmin();
    } catch (e) {
        toast('Optimize failed', 'error');
    } finally {
        showLoading(false);
    }
}

async function dbCheckIntegrity() {
    try {
        const data = await (await fetch(`${API}/api/db/integrity`, {method: 'POST'})).json();
        if (data.ok) toast('Integrity OK', 'success');
        else toast('Integrity issue: ' + data.result, 'error');
        loadDbAdmin();
    } catch (e) {
        toast('Check failed', 'error');
    }
}

async function dbBrowseTable(name, offset) {
    dbBrowseTableName = name;
    dbBrowseOffset = offset || 0;
    try {
        const data = await (await fetch(`${API}/api/db/table/${name}?limit=${DB_BROWSE_LIMIT}&offset=${dbBrowseOffset}`)).json();
        document.getElementById('dbBrowseCard').style.display = 'block';
        document.getElementById('dbBrowseTitle').textContent = 'Table: ' + name;
        const head = document.getElementById('dbBrowseHead');
        head.innerHTML = '<tr>' + (data.columns||[]).map(c => `<th>${c}</th>`).join('') + '</tr>';
        const body = document.getElementById('dbBrowseBody');
        if (!data.rows || !data.rows.length) {
            body.innerHTML = `<tr><td colspan="${(data.columns||[]).length}">Empty</td></tr>`;
        } else {
            body.innerHTML = data.rows.map(r =>
                '<tr>' + data.columns.map(c => {
                    let v = r[c];
                    if (v === null || v === undefined) v = '';
                    const s = String(v);
                    return `<td title="${s.replace(/"/g,'&quot;')}">${s.length > 80 ? s.slice(0,80)+'…' : s}</td>`;
                }).join('') + '</tr>'
            ).join('');
        }
        document.getElementById('dbBrowseMeta').textContent =
            `Showing ${data.offset + 1}–${Math.min(data.offset + data.limit, data.total)} of ${data.total}`;
    } catch (e) {
        toast('Browse failed', 'error');
    }
}

function dbBrowsePrev() {
    if (!dbBrowseTableName) return;
    dbBrowseTable(dbBrowseTableName, Math.max(0, dbBrowseOffset - DB_BROWSE_LIMIT));
}
function dbBrowseNext() {
    if (!dbBrowseTableName) return;
    dbBrowseTable(dbBrowseTableName, dbBrowseOffset + DB_BROWSE_LIMIT);
}

async function dbClearTable(name) {
    if (!confirm('Delete ALL rows from table "' + name + '"?')) return;
    try {
        const res = await fetch(`${API}/api/db/clear-table`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({table: name})
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'fail');
        toast('Deleted ' + (data.deleted||0) + ' rows', 'success');
        loadDbAdmin();
    } catch (e) {
        toast(String(e.message || e), 'error');
    }
}

async function dbRestore(filename) {
    if (!confirm('Restore from "' + filename + '"?\nCurrent data will be replaced (a safety backup is created).')) return;
    try {
        showLoading(true);
        const res = await fetch(`${API}/api/db/restore`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({file: filename})
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'fail');
        toast('Restored. Safety: ' + (data.safety_backup || ''), 'success');
        loadDbAdmin();
        if (typeof loadDashboard === 'function') loadDashboard();
    } catch (e) {
        toast(String(e.message || e), 'error');
    } finally {
        showLoading(false);
    }
}

async function dbReset() {
    if (!confirm('RESET all business data for this account?\nA safety backup will be created.')) return;
    const word = prompt('Type RESET to confirm:');
    if (word !== 'RESET') return toast('Cancelled', 'error');
    try {
        showLoading(true);
        const res = await fetch(`${API}/api/db/reset`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({confirm: 'RESET'})
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'fail');
        toast('Database reset. Safety: ' + (data.safety_backup || ''), 'success');
        loadDbAdmin();
    } catch (e) {
        toast(String(e.message || e), 'error');
    } finally {
        showLoading(false);
    }
}



// Enter key submits login
document.addEventListener('DOMContentLoaded', function() {
  ['loginUser','loginPass','regUser','regPass'].forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (id.indexOf('reg') === 0) doRegister();
        else doLogin();
      }
    });
  });
});


function openProductModal() {
  return openAddProduct();
}
function openAddProduct() {
  editingId = null;
  try {
    setModalTitle('productModal', t('btn_add_product'));
  } catch(e) {}
  ['prodCode','prodName','prodBrand','prodModel','prodCategory'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  var m = document.getElementById('productModal');
  if (m) { m.classList.add('active'); applyLanguage(); }
}


// ── Notifications ──
async function loadNotifications() {
  try {
    const res = await fetch(API + '/api/notifications');
    const data = await res.json();
    const count = data.count || (data.items || []).length;
    const badge = document.getElementById('notifCount');
    if (badge) {
      if (count > 0) { badge.style.display = 'inline'; badge.textContent = count; }
      else badge.style.display = 'none';
    }
    window.__notifications = data.items || [];
  } catch (e) {}
}
function toggleNotifPanel() {
  const p = document.getElementById('notifPanel');
  if (!p) return;
  if (p.style.display === 'block') { p.style.display = 'none'; return; }
  const items = window.__notifications || [];
  p.innerHTML = items.length ? items.map(n =>
    `<div style="padding:10px;border-bottom:1px solid var(--border);font-size:13px">
      <b>${n.title||''}</b><div style="opacity:.7;margin-top:4px">${n.detail||''}</div>
    </div>`
  ).join('') : `<div style="padding:16px;text-align:center;opacity:.6">${appLang==='fa'?'اعلانی نیست':'No notifications'}</div>`;
  p.style.display = 'block';
}
document.addEventListener('click', function(e) {
  const p = document.getElementById('notifPanel');
  const b = document.getElementById('notifBell');
  if (p && p.style.display === 'block' && !p.contains(e.target) && b && !b.contains(e.target)) {
    p.style.display = 'none';
  }
});

// ── Keyboard shortcuts (F1–F12 always work) ──
document.addEventListener('keydown', function(e) {
  const key = e.key || '';
  const tag = ((e.target && e.target.tagName) || '').toUpperCase();
  const inField = (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable));

  // Function keys — always active
  const fkeys = {
    'F1': function() { navigateTo('purchases'); },
    'F2': function() { openNewPurchase(); },
    'F3': function() { openNewSale(); },
    'F4': function() { navigateTo('sales'); },
    'F5': function() { navigateTo('database'); },
    'F6': function() { navigateTo('sellers'); },
    'F7': function() { navigateTo('accounts-page'); },
    'F8': function() { navigateTo('categories'); },
    'F9': function() { if (typeof createBackup === 'function') createBackup(); else navigateTo('backup'); },
    'F10': function() { navigateTo('bills-page'); },
    'F11': function() { navigateTo('settings'); },
    'F12': function() { navigateTo('database-admin'); }
  };
  if (fkeys[key]) {
    e.preventDefault();
    e.stopPropagation();
    try { fkeys[key](); } catch (err) { console.error('hotkey', key, err); }
    return;
  }

  if (key === 'Escape' || e.keyCode === 27) {
    if (typeof clinicHandleEscape === 'function' && (depositHandleEscape() || clinicHandleEscape())) return;
    try { closeModal(); } catch (err) {}
    document.querySelectorAll('.modal.active, .modal-overlay.active').forEach(function(m) {
      m.classList.remove('active');
    });
    return;
  }

  if (inField) return;

  if (e.ctrlKey && (key === 'n' || key === 'N')) {
    e.preventDefault();
    openNewPurchase();
  }
  if (e.ctrlKey && (key === 's' || key === 'S')) {
    const modal = document.getElementById('newPurchaseModal');
    if (modal && modal.classList.contains('active')) {
      e.preventDefault();
      savePurchase();
    }
  }
});


// ── Audit + version ──
async function loadAuditLog() {
  try {
    const res = await fetch(API + '/api/audit?limit=80');
    const data = await res.json();
    const tb = document.getElementById('auditTable');
    if (!tb) return;
    tb.innerHTML = (data || []).map(r =>
      `<tr><td>${r.created_at||''}</td><td>${r.username||''}</td><td>${r.action||''}</td><td>${r.detail||''}</td></tr>`
    ).join('') || '<tr><td colspan="4">—</td></tr>';
  } catch (e) { console.error(e); }
}
async function checkVersion() {
  try {
    const res = await fetch(API + '/api/version');
    const data = await res.json();
    alert((appLang==='fa'?'نسخه فعلی: ':'Version: ') + (data.version || '?') + '\\nCluDari');
  } catch (e) {
    alert('2.1.0');
  }
}

// load notifications after login-ish
setInterval(function(){ if (typeof loadNotifications==='function') loadNotifications(); }, 60000);
setTimeout(function(){ try { loadNotifications(); } catch(e){} }, 2000);


// ── Multi-currency ──
async function loadCurrencyRates() {
  try {
    const res = await fetch(API + '/api/currencies');
    const data = await res.json();
    currencyRates = {};
    (data || []).forEach(r => { currencyRates[r.code] = r; });
    renderRatesTable(data || []);
  } catch (e) { console.warn(e); }
}
function currencyLabel(code) {
  const r = currencyRates[code];
  if (!r) return code || 'IRT';
  return (appLang === 'fa' ? (r.name_fa || r.code) : (r.name_en || r.code));
}
function formatMoney(amount, code) {
  code = code || 'IRT';
  const n = formatNumber(amount || 0);
  const r = currencyRates[code];
  const sym = r ? (r.symbol || code) : code;
  return n + ' ' + sym;
}
function toToman(amount, code) {
  code = code || 'IRT';
  const r = currencyRates[code];
  const rate = r ? (parseFloat(r.rate_to_toman) || 1) : 1;
  return (parseFloat(amount) || 0) * rate;
}
function renderRatesTable(rows) {
  const tb = document.getElementById('ratesTable');
  if (!tb) return;
  tb.innerHTML = (rows || []).map(r =>
    `<tr>
      <td><b>${r.code}</b></td>
      <td>${appLang==='fa'?(r.name_fa||''):(r.name_en||'')}</td>
      <td>${r.country||''}</td>
      <td><input type="number" class="form-control" id="rate_${r.code}" value="${r.rate_to_toman}" step="any" style="max-width:140px"></td>
      <td><button class="btn btn-secondary" style="padding:6px 10px" onclick="saveRate('${r.code}')">💾</button></td>
    </tr>`
  ).join('');
}
async function saveRate(code) {
  const el = document.getElementById('rate_' + code);
  if (!el) return;
  const rate = parseFloat(el.value) || 0;
  await fetch(API + '/api/currencies/' + code, {
    method: 'PUT',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({rate_to_toman: rate})
  });
  await loadCurrencyRates();
  alert(appLang==='fa'?'نرخ ذخیره شد':'Rate saved');
}

// Boot: apply language on login screen immediately
document.addEventListener('DOMContentLoaded', function() {
  try { applyLanguage(); } catch(e) {}
  try {
    var tok = localStorage.getItem('cludari_token');
    if (tok) {
      authToken = tok;
      currentUsername = localStorage.getItem('cludari_user') || '';
    }
  } catch(e) {}
});




// ═══ MDI window manager ═══
let mdiZ = 100;
let mdiCascade = 0;

/*
 * MDI/modal stacking fix:
 * A page opened from an active modal (for example, the Sellers page
 * opened from the Purchase window) must appear above that modal.
 * We temporarily lower only the active modal while an MDI window exists.
 * Regular child modals such as "Add contact" keep their normal high z-index.
 */
function suspendActiveModalsForMdi() {
  document.querySelectorAll('.modal.active').forEach(function(modal) {
    if (!modal.dataset.mdiSuspended) {
      modal.dataset.mdiSuspended = '1';
      modal.dataset.mdiPreviousZ = modal.style.zIndex || '';
      modal.style.setProperty('z-index', '1000', 'important');
      modal.classList.add('mdi-parent-suspended');
    }
  });
  // Critical: backdrop would freeze all MDI interaction
  var bd = null && document.getElementById('mkWinBackdrop');
  if (bd) { bd.classList.remove('on'); bd.style.pointerEvents = 'none'; }
  var layer = document.getElementById('mdiLayer');
  if (layer) layer.style.setProperty('z-index', '50000', 'important');
}

function restoreSuspendedModals() {
  document.querySelectorAll('.modal[data-mdi-suspended="1"]').forEach(function(modal) {
    modal.classList.remove('mdi-parent-suspended');
    const prev = modal.dataset.mdiPreviousZ || '';
    if (prev) modal.style.setProperty('z-index', prev, 'important');
    else modal.style.removeProperty('z-index');
    delete modal.dataset.mdiSuspended;
    delete modal.dataset.mdiPreviousZ;
  });
}

function restoreSuspendedModalsIfNoMdi() {
  if (!document.querySelector('.mdi-window')) restoreSuspendedModals();
}

function ensureMdiLayerRoot() {
  let layer = document.getElementById('mdiLayer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'mdiLayer';
    layer.className = 'mdi-layer';
  }
  // IMPORTANT: the MDI layer must live directly under <body>.
  // If it stays inside .main-wrap, that ancestor creates a stacking context
  // and every MDI window can end up behind fixed modals regardless of z-index.
  if (layer.parentElement !== document.body) document.body.appendChild(layer);
  return layer;
}


function syncMdiOpenClass() {
  try {
    var n = document.querySelectorAll('.mdi-window:not(.minimized)').length;
    document.body.classList.toggle('mdi-open', n > 0);
  } catch (e) {}
}

function openMdiWindow(pageId, title) {
  // If this page is being opened from a modal, put the new MDI window above it.
  suspendActiveModalsForMdi();
  // show home under windows
  const home = document.getElementById('homeWorkspace');
  // find page element
  let page = document.getElementById('page-' + pageId);
  if (!page) page = document.getElementById(pageId);
  if (!page) {
    // fallback navigate old way
    if (typeof navigateToLegacy === 'function') return navigateToLegacy(pageId);
    return;
  }
  // if window already open for this page, focus it
  const existing = document.querySelector('.mdi-window[data-page="' + pageId + '"]');
  if (existing) {
    existing.classList.remove('minimized');
    existing.style.zIndex = ++mdiZ;
    syncMdiOpenClass();
    return existing;
  }
  const layer = ensureMdiLayerRoot();
  if (!layer) return;

  const win = document.createElement('div');
  win.className = 'mdi-window';
  win.dataset.page = pageId;
  const offset = (mdiCascade % 6) * 28;
  mdiCascade++;
  win.style.top = (40 + offset) + 'px';
  win.style.left = (40 + offset) + 'px';
  win.style.zIndex = ++mdiZ;

  const bar = document.createElement('div');
  bar.className = 'mdi-titlebar';
  bar.innerHTML = '<span class="mdi-title"></span>'
    + '<button type="button" class="close-btn" title="بستن" data-act="close">✕</button>'
    + '<button type="button" title="تمام‌صفحه" data-act="max">▢</button>'
    + '<button type="button" title="کوچک" data-act="min">—</button>';
  bar.querySelector('.mdi-title').textContent = title || pageId;

  const body = document.createElement('div');
  body.className = 'mdi-body';

  // move page into window (keep in DOM)
  page.classList.add('active');
  page.style.display = 'block';
  body.appendChild(page);

  win.appendChild(bar);
  win.appendChild(body);
  layer.appendChild(win);

  // resize handles (edges + corners)
  ['n','s','e','w','ne','nw','se','sw'].forEach(function(dir) {
    var h = document.createElement('div');
    h.className = 'resize-handle rh-' + dir;
    h.dataset.dir = dir;
    win.appendChild(h);
    h.addEventListener('mousedown', function(e) {
      if (win.classList.contains('maximized') || win.classList.contains('minimized')) return;
      e.preventDefault();
      e.stopPropagation();
      win.classList.add('mdi-dragging');
      win.style.zIndex = ++mdiZ;
      var dir = h.dataset.dir;
      var startX = e.clientX, startY = e.clientY;
      var startL = win.offsetLeft, startT = win.offsetTop;
      var startW = win.offsetWidth, startH = win.offsetHeight;
      var layer = document.getElementById('mdiLayer') || win.parentElement;
      function onMove(ev) {
        var dx = ev.clientX - startX, dy = ev.clientY - startY;
        var l = startL, t = startT, w = startW, hgt = startH;
        if (dir.indexOf('e') >= 0) w = startW + dx;
        if (dir.indexOf('s') >= 0) hgt = startH + dy;
        if (dir.indexOf('w') >= 0) { w = startW - dx; l = startL + dx; }
        if (dir.indexOf('n') >= 0) { hgt = startH - dy; t = startT + dy; }
        if (w < 320) { if (dir.indexOf('w') >= 0) l = startL + startW - 320; w = 320; }
        if (hgt < 200) { if (dir.indexOf('n') >= 0) t = startT + startH - 200; hgt = 200; }
        var maxW = layer.clientWidth || window.innerWidth;
        var maxH = layer.clientHeight || window.innerHeight;
        if (l < 0) { w += l; l = 0; }
        if (t < 0) { hgt += t; t = 0; }
        if (l + w > maxW) w = maxW - l;
        if (t + hgt > maxH) hgt = maxH - t;
        win.style.left = l + 'px';
        win.style.top = t + 'px';
        win.style.width = w + 'px';
        win.style.height = hgt + 'px';
        win.style.right = 'auto';
        win.style.bottom = 'auto';
      }
      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        win.classList.remove('mdi-dragging');
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  });

  requestAnimationFrame(function(){ win.classList.add('mdi-enter'); }); try{playUiSound('open');}catch(e){}
  try{ if(typeof applyLanguage==='function') applyLanguage(); }catch(e){}
  setTimeout(function(){ try{ win.classList.remove('mdi-enter'); }catch(e){} }, 320);

  bar.addEventListener('click', function(e) {
    const act = e.target && e.target.getAttribute('data-act');
    if (act === 'close') {
      try{playUiSound('close');}catch(e){} win.classList.add('mdi-leaving');
      setTimeout(function(){
        const scroll = document.getElementById('mainScroll');
        page.classList.remove('active');
        page.style.display = 'none';
        if (scroll) scroll.appendChild(page);
        win.remove(); try{syncMdiOpenClass();}catch(e){} 
        restoreSuspendedModalsIfNoMdi();
      }, 200);
      return;
    }
    if (act === 'min') {
      win.classList.toggle('minimized');
      win.classList.remove('maximized');
      return;
    }
    if (act === 'max') {
      win.classList.toggle('maximized');
      win.classList.remove('minimized');
      return;
    }
    win.style.zIndex = ++mdiZ;
  });

  // simple drag
  let dragging = false, sx=0, sy=0, ox=0, oy=0;
  bar.addEventListener('mousedown', function(e) {
    if (e.target.tagName === 'BUTTON') return;
    if (win.classList.contains('maximized')) return;
    dragging = true;
    win.classList.add('mdi-dragging');
    sx = e.clientX; sy = e.clientY;
    ox = win.offsetLeft; oy = win.offsetTop;
    win.style.zIndex = ++mdiZ;
    e.preventDefault();
  });
  document.addEventListener('mousemove', function(e) {
    if (!dragging) return;
    var layer = document.getElementById('mdiLayer') || win.parentElement;
    var maxL = Math.max(0, (layer.clientWidth || window.innerWidth) - win.offsetWidth);
    var maxT = Math.max(0, (layer.clientHeight || window.innerHeight) - 40);
    var nl = ox + e.clientX - sx;
    var nt = oy + e.clientY - sy;
    if (nl < 0) nl = 0;
    if (nt < 0) nt = 0;
    if (nl > maxL) nl = maxL;
    if (nt > maxT) nt = maxT;
    win.style.left = nl + 'px';
    win.style.top = nt + 'px';
  });
  document.addEventListener('mouseup', function() { dragging = false; try{ document.querySelectorAll('.mdi-dragging').forEach(function(w){ w.classList.remove('mdi-dragging'); }); }catch(e){} });

  // load data for page
  try {
    const p = pageId;
    if (p === 'purchases' && typeof loadPurchases === 'function') loadPurchases();
    else if (p === 'database' && typeof loadDatabase === 'function') loadDatabase();
    else if (p === 'sellers' && typeof loadSellers === 'function') loadSellers();
    else if (p === 'sales' && typeof loadSales === 'function') loadSales();
    else if (p === 'admissions' && typeof loadAdmissions === 'function') loadAdmissions();
    else if (p === 'settings' && typeof loadSettings === 'function') loadSettings();
    else if (p === 'categories' && typeof loadCategories === 'function') loadCategories();
    else if (p === 'customers-page' && typeof loadCustomers === 'function') loadCustomers();
    else if (p === 'documents-page' && typeof loadDocuments === 'function') loadDocuments();
    else if (p === 'licenses-page' && typeof loadLicenses === 'function') loadLicenses();
    else if (p === 'reminders-page' && typeof loadReminders === 'function') loadReminders();
    else if (p === 'subscriptions-page' && typeof loadSubscriptions === 'function') loadSubscriptions();
    else if (p === 'bills-page' && typeof loadBills === 'function') loadBills();
    else if (p === 'checks-page' && typeof loadChecks === 'function') loadChecks();
    else if (p === 'accounts-page' && typeof loadAccounts === 'function') loadAccounts();
    else if (p === 'database-admin' && typeof loadDbAdmin === 'function') loadDbAdmin();
  } catch (err) { console.warn(err); }

  return win;
}

const PAGE_TITLES = {
  dashboard: 'داشبورد',
  purchases: 'خریدهای من',
  sales: 'فروش‌های من',
  admissions: 'پذیرش',
  database: 'پایگاه کالا',
  sellers: 'فروشندگان',
  categories: 'دسته‌ها',
  'customers-page': 'مشتریان',
  'documents-page': 'اسناد',
  'licenses-page': 'لایسنس‌ها',
  'reminders-page': 'یادآورها',
  'subscriptions-page': 'اشتراک‌ها',
  'bills-page': 'قبوض',
  'checks-page': 'چک‌ها',
  'accounts-page': 'حساب‌ها',
  'database-admin': 'پایگاه داده',
  settings: 'تنظیمات'
};

// ═══ Mahak-style classic dropdown menu ═══
function toggleMahakMenu(btn) {
  var item = btn.closest('.menu-item');
  if (!item) return;
  var wasOpen = item.classList.contains('open');
  closeAllMahakMenus();
  if (!wasOpen) item.classList.add('open');
}
function closeAllMahakMenus() {
  document.querySelectorAll('#mahakMenu .menu-item.open').forEach(function(el) {
    el.classList.remove('open');
  });
}
document.addEventListener('click', function(e) {
  if (!e.target.closest('#mahakMenu')) closeAllMahakMenus();
});
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeAllMahakMenus();
});

// wrap navigateTo
const _navOriginal = typeof navigateTo === 'function' ? navigateTo : null;
function navigateTo_mkwrap(page){ try{ document.body.classList.toggle('on-dashboard', page==='dashboard'); }catch(e){} }
function navigateTo(page) {
  closeAllMahakMenus();
  if (page === 'budgets') { try { loadBudgets(); } catch(e){} }
  if (page === 'goals') { try { loadGoals(); } catch(e){} }

  if (page === 'dashboard') {
    currentPage = 'dashboard';
    try {
      document.querySelectorAll('.mdi-window').forEach(function(w){
        var pid = w.getAttribute('data-page');
        var pageEl = document.getElementById('page-' + pid) || document.getElementById(pid);
        var scroll = document.getElementById('mainScroll');
        if (pageEl && scroll) {
          pageEl.classList.remove('active');
          pageEl.style.display = 'none';
          scroll.appendChild(pageEl);
        }
        w.remove(); try{syncMdiOpenClass();}catch(e){} 
      });
    } catch(e) {}
    try { closeModal(); } catch(e) {}
    document.querySelectorAll('.modal.active').forEach(function(m){ m.classList.remove('active'); });
    try { mhShow('all'); } catch(e) {}
    document.querySelectorAll('.mk-tab').forEach(function(t){ t.classList.remove('active'); });
    var homeTab = document.querySelector('.mk-tab[onclick*="dashboard"]');
    if (homeTab) homeTab.classList.add('active');
    if (typeof mkWinBackdropSync === 'function') mkWinBackdropSync();
    if (typeof loadDashboard === 'function') loadDashboard();
    return;
  }
  const title = PAGE_TITLES[page] || page;
  openMdiWindow(page, title);
  currentPage = page;
}

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.modal').forEach(function(m){ m.classList.remove('active'); m.style.display=''; });
});



function updateUserLabels() {
  const su = document.getElementById('sideUserName');
  if (su) su.textContent = (appLang === 'fa' ? 'کاربر: ' : 'User: ') + (currentUsername || '—');
  const bl = document.getElementById('sideBrandLabel');
  if (bl) bl.textContent = appLang === 'fa' ? 'حسابداری شخصی' : 'Personal Accounting';
  const tu = document.getElementById('topbarUser');
  if (tu) tu.textContent = (appLang === 'fa' ? 'کاربر: ' : 'User: ') + (currentUsername || '');
}

async function loadSysInfo() {
  const box = document.getElementById('sysInfoBox');
  if (!box) return;
  try {
    const res = await fetch(API + '/api/system/info');
    if (!res.ok) throw new Error('fail');
    const d = await res.json();
    const fa = appLang === 'fa';
    const lines = [];
    lines.push((fa ? 'سیستم‌عامل: ' : 'OS: ') + (d.os_name || '—'));
    if (d.os_version) lines.push((fa ? 'بیلد: ' : 'Build: ') + d.os_version);
    lines.push((fa ? 'پایتون: ' : 'Python: ') + (d.python || '—'));
    lines.push((fa ? 'برنامه: ' : 'App: ') + 'CluDari ' + (d.app_version || ''));
    box.innerHTML = lines.join('<br>');
  } catch (e) {
    box.textContent = navigator.platform || '—';
  }
}

document.addEventListener('click', function(e) {
  var t = e.target.closest('.mahak-tile, .top-menu button, .tb-btn');
  if (t) { try { playUiSound('click'); } catch (err) {} }
}, true);

document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape' && e.keyCode !== 27) return;
  e.preventDefault();
  e.stopPropagation();
  if (typeof clinicHandleEscape === 'function' && (depositHandleEscape() || clinicHandleEscape())) {
    try { playUiSound('close'); } catch (err) {}
    return;
  }
  var modals = Array.from(document.querySelectorAll('.modal.active'));
  if (modals.length) {
    var m = modals[modals.length - 1];
    m.classList.remove('active');
    m.style.display = '';
    try { if (typeof closeModal === 'function') closeModal(m.id); } catch (err) {}
    try { playUiSound('close'); } catch (err) {}
    return;
  }
  var wins = Array.from(document.querySelectorAll('.mdi-window'));
  if (!wins.length) return;
  wins.sort(function(a, b) {
    return (parseInt(b.style.zIndex, 10) || 0) - (parseInt(a.style.zIndex, 10) || 0);
  });
  var w = wins[0];
  var btn = w.querySelector('[data-act="close"]');
  if (btn) btn.click();
  else w.remove(); try{syncMdiOpenClass();}catch(e){} 
  try { playUiSound('close'); } catch (err) {}
}, true);

document.addEventListener('pointerdown', function audioUnlock() {
  try { var c = _getAudio(); if (c && c.state === 'suspended') c.resume(); } catch (e) {}
}, true);


function toggleNotifPanel() {
  var p = document.getElementById('notifPanel');
  if (!p) return;
  p.classList.toggle('show');
  if (p.classList.contains('show')) loadNotifications(true);
}
async function loadNotifications(renderPanel) {
  try {
    var res = await fetch(API + '/api/notifications');
    var data = await res.json();
    var items = data.items || [];
    var badge = document.getElementById('notifBadge');
    if (badge) {
      var n = items.filter(function(x){ return x.level === 'warn' || x.level === 'danger'; }).length || items.length;
      if (n > 0) { badge.style.display = 'flex'; badge.textContent = n > 99 ? '99+' : String(n); }
      else { badge.style.display = 'none'; }
    }
    if (renderPanel) {
      var p = document.getElementById('notifPanel');
      if (!p) return;
      if (!items.length) {
        p.innerHTML = '<div style="padding:12px;text-align:center;color:var(--text2)">' + (appLang==='fa'?'اعلانی نیست':'No notifications') + '</div>';
        return;
      }
      p.innerHTML = items.map(function(it){
        return '<div class="notif-item ' + (it.level||'') + '"><div class="nt">' + (it.title||'') + '</div><div class="nd">' + (it.detail||'') + '</div></div>';
      }).join('');
    }
  } catch (e) {}
}

// register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').catch(function(){});
  });
}

document.addEventListener('click', function(e) {
  var p = document.getElementById('notifPanel');
  var b = document.getElementById('notifBell');
  if (!p || !p.classList.contains('show')) return;
  if (p.contains(e.target) || (b && b.contains(e.target))) return;
  p.classList.remove('show');
});


// ═══ Sales (فروش) ═══
let saleItems = [];
let editingSaleId = null;;
let cacheSales = [];


function openNewSale() {
  try { ensureProductsCache(); } catch(e) {}
  return openNewSale_inner();
}
function openNewSale_inner() {
    try { if (typeof playUiSound === 'function') playUiSound('open'); } catch (e) {}
    try {
    editingSaleId = null;
    saleItems = [];
    const d = new Date();
    const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const el = function (id) { return document.getElementById(id); };
    if (el('saleDate')) el('saleDate').value = iso;
    if (el('saleCustomer')) el('saleCustomer').value = '';
    if (el('saleLocation')) el('saleLocation').value = '';
    if (el('saleDiscount')) el('saleDiscount').value = '0';
    if (el('saleNotes')) el('saleNotes').value = '';
    if (el('saleItemName')) el('saleItemName').value = '';
    if (el('saleItemQty')) el('saleItemQty').value = '1';
    if (el('saleItemPrice')) el('saleItemPrice').value = '';
    if (el('salePaidAmount')) el('salePaidAmount').value = '0';
    if (typeof renderSaleItems === 'function') renderSaleItems();
    if (typeof bindSaleLiveTotal === 'function') bindSaleLiveTotal();
    if (typeof updateSaleTotalLabel === 'function') updateSaleTotalLabel();
    const m = el('newSaleModal');
    if (m) {
        try {
          if (m.parentElement && m.parentElement.classList && m.parentElement.classList.contains('mdi-body')) {
              (document.getElementById('mainScroll') || document.body).appendChild(m);
          }
        } catch(e) {}
        document.querySelectorAll('.mdi-window[data-page="newSaleModal"]').forEach(function (w) { try{w.remove(); try{syncMdiOpenClass();}catch(e){} }catch(e){} });
        var already = m.classList.contains('active');
        m.classList.remove('mk-min','mk-max','mk-dragging');
        if (!already) {
          m.style.display = '';
          m.classList.add('active');
        } else {
          // already open: only reset form, do not re-run heavy window chrome
          m.dataset.mkWinReady = '1';
        }
        if (typeof mkWinEnable === 'function' && !already) {
          try { mkWinEnable(m); } catch(e) {}
        } else {
          if (typeof mkMakeDraggable === 'function') mkMakeDraggable(m);
          if (typeof mkAddResizeHandles === 'function') mkAddResizeHandles(m);
        }
        if (already && typeof mkAddResizeHandles === 'function') mkAddResizeHandles(m);
    }
    setTimeout(function () {
        const n = el('saleItemName') || el('saleCustomer');
        if (n) try { n.focus(); } catch(e) {}
    }, 80);
    } catch (err) { console.error('openNewSale', err); }
}

function bindSaleLiveTotal() {
    ['saleItemQty', 'saleItemPrice', 'saleDiscount'].forEach(function (id) {
        const node = document.getElementById(id);
        if (!node || node.dataset.saleBound === '1') return;
        node.dataset.saleBound = '1';
        node.addEventListener('input', updateSaleTotalLabel);
        node.addEventListener('change', updateSaleTotalLabel);
    });
    ['saleItemName', 'saleItemQty', 'saleItemPrice'].forEach(function (id) {
        const node = document.getElementById(id);
        if (!node || node.dataset.saleEnter === '1') return;
        node.dataset.saleEnter = '1';
        node.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addSaleItem();
            }
        });
    });
}

function updateSaleTotalLabel() {
    let sub = 0;
    (saleItems || []).forEach(function (it) {
        sub += Number(it.quantity || 0) * Number(it.unit_price || 0);
    });
    // include current line being typed (not yet added)
    const name = ((document.getElementById('saleItemName') || {}).value || '').trim();
    const qty = parseFloat((document.getElementById('saleItemQty') || {}).value || 0) || 0;
    const price = parseFloat((document.getElementById('saleItemPrice') || {}).value || 0) || 0;
    if (name && (qty > 0 || price > 0)) {
        sub += qty * price;
    }
    const disc = parseFloat((document.getElementById('saleDiscount') || {}).value || 0) || 0;
    const tot = Math.max(0, sub - disc);
    const lab = document.getElementById('saleTotalLabel');
    if (lab) {
        const fmt = (function (n) {
            try { return Number(n).toLocaleString(appLang === 'fa' ? 'fa-IR' : 'en-US'); }
            catch (e) { return String(n); }
        })(tot);
        lab.textContent = (appLang === 'fa' ? 'جمع: ' : 'Total: ') + fmt;
        lab.style.fontWeight = '800';
        lab.style.fontSize = '16px';
    }
}


async function ensureProductsCache() {
  try {
    if (typeof products !== 'undefined' && Array.isArray(products) && products.length) return products;
    if (typeof cacheProducts !== 'undefined' && Array.isArray(cacheProducts) && cacheProducts.length) {
      products = cacheProducts;
      return products;
    }
    var res = await fetch((typeof API!=='undefined'?API:'') + '/api/products?limit=500');
    var data = await res.json();
    products = data.items || data || [];
    cacheProducts = products;
    return products;
  } catch (e) { return []; }
}

async function addSaleItem() {
    var nameEl = document.getElementById('saleItemName');
    var codeEl = document.getElementById('saleItemCode');
    var qtyEl = document.getElementById('saleItemQty');
    var priceEl = document.getElementById('saleItemPrice');
    var name = ((nameEl || {}).value || '').trim();
    var code = ((codeEl || {}).value || '').trim();
    var qty = parseFloat((qtyEl || {}).value || 1) || 1;
    var price = parseFloat((priceEl || {}).value || 0) || 0;

    async function resolveProduct() {
      var list = [];
      try {
        if (typeof products !== 'undefined' && Array.isArray(products) && products.length) list = products;
        else if (typeof cacheProducts !== 'undefined' && Array.isArray(cacheProducts) && cacheProducts.length) list = cacheProducts;
      } catch (e) {}

      function findIn(list) {
        if (!list || !list.length) return null;
        if (code) {
          var c = String(code).toLowerCase();
          for (var i = 0; i < list.length; i++) {
            if (String(list[i].code || '').toLowerCase() === c) return list[i];
          }
        }
        if (name) {
          var n = String(name).toLowerCase();
          for (var j = 0; j < list.length; j++) {
            var pn = String(list[j].name || '').toLowerCase();
            if (pn === n || pn.indexOf(n) >= 0) return list[j];
          }
        }
        return null;
      }

      var found = findIn(list);
      if (found) return found;

      // fetch from server by code or name
      var q = code || name;
      if (!q) return null;
      try {
        var res = await fetch((typeof API !== 'undefined' ? API : '') + '/api/products?search=' + encodeURIComponent(q));
        var data = await res.json();
        var items = data.items || data || [];
        if (typeof products === 'undefined' || !products || !products.length) {
          try { products = items; cacheProducts = items; } catch (e) {}
        }
        // exact code match first
        if (code) {
          var c2 = String(code).toLowerCase();
          for (var k = 0; k < items.length; k++) {
            if (String(items[k].code || '').toLowerCase() === c2) return items[k];
          }
        }
        if (items.length) return items[0];
      } catch (e) { console.warn('product lookup', e); }
      return null;
    }

    var prod = await resolveProduct();
    if (prod) {
      if (!code) code = String(prod.code || '');
      if (!name) name = String(prod.name || '');
      var sp = prod.sell_price != null ? prod.sell_price : (prod.price != null ? prod.price : null);
      if ((!price || price === 0) && sp != null) price = Number(sp) || 0;
      // show filled values in inputs briefly
      if (codeEl) codeEl.value = code;
      if (nameEl) nameEl.value = name;
      if (priceEl && price) priceEl.value = price;
    }

    if (!name && !code) {
      alert(appLang === 'fa' ? 'کد یا نام کالا لازم است' : 'Code or name required');
      return;
    }
    if (!name) {
      alert(appLang === 'fa' ? 'کالایی با این کد پیدا نشد' : 'Product not found for this code');
      return;
    }

    saleItems.push({ code: code, name: name, quantity: qty, unit_price: price, total: qty * price });
    if (codeEl) codeEl.value = '';
    if (nameEl) nameEl.value = '';
    if (qtyEl) qtyEl.value = '1';
    if (priceEl) priceEl.value = '';
    renderSaleItems();
    if (codeEl) codeEl.focus();
    else if (nameEl) nameEl.focus();
}
window.addSaleItem = addSaleItem;


function removeSaleItem(i) {
    saleItems.splice(i, 1);
    renderSaleItems();
}

function renderSaleItems() {
    const body = document.getElementById('saleItemsBody');
    if (!body) return;
    body.innerHTML = (saleItems || []).map(function (it, i) {
        const line = Number(it.quantity || 0) * Number(it.unit_price || 0);
        const fmt = function (n) {
            try { return Number(n).toLocaleString(appLang === 'fa' ? 'fa-IR' : 'en-US'); }
            catch (e) { return String(n); }
        };
        const code = (it.code != null && it.code !== '') ? String(it.code) : '';
        const name = String(it.name || '').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        return '<tr>' +
            '<td class="c">' + (i + 1) + '</td>' +
            '<td class="c">' + code.replace(/</g,'&lt;') + '</td>' +
            '<td>' + name + '</td>' +
            '<td class="c">' + fmt(it.quantity) + '</td>' +
            '<td class="c">' + fmt(it.unit_price) + '</td>' +
            '<td class="c" style="font-weight:700">' + fmt(line) + '</td>' +
            '<td class="c"><button type="button" class="btn row-del-btn" onclick="removeSaleItem(' + i + ')" title="حذف">🗑</button></td>' +
            '</tr>';
    }).join('');
    updateSaleTotalLabel();
    try{
      var h=document.getElementById('saleEmptyHint');
      if(h) h.style.display=(saleItems&&saleItems.length)?'none':'flex';
      var st=document.getElementById('saleTotal');
      if(st){
        var sub=0;(saleItems||[]).forEach(function(it){sub+=Number(it.quantity||0)*Number(it.unit_price||0)});
        var disc=parseFloat((document.getElementById('saleDiscount')||{}).value||0)||0;
        st.textContent=Math.max(0,sub-disc).toLocaleString('fa-IR');
      }
    }catch(e){}

}

async function saveSale() {
    // Build items from table + optional current input line (no need to press +)
    const items = (saleItems || []).map(function (it) {
        return {
            code: it.code || '',
            name: it.name,
            quantity: Number(it.quantity || 1),
            unit_price: Number(it.unit_price || 0),
            total: Number(it.quantity || 1) * Number(it.unit_price || 0)
        };
    });
    const pendingName = ((document.getElementById('saleItemName') || {}).value || '').trim();
    if (pendingName) {
        const qty = parseFloat((document.getElementById('saleItemQty') || {}).value || 1) || 1;
        const price = parseFloat((document.getElementById('saleItemPrice') || {}).value || 0) || 0;
        items.push({ name: pendingName, quantity: qty, unit_price: price, total: qty * price });
    }
    if (!items.length) {
        alert(appLang === 'fa'
            ? 'نام کالا و قیمت را پر کنید، سپس ذخیره فروش را بزنید'
            : 'Fill product name and price, then save');
        return;
    }
    const payload = {
        date: (document.getElementById('saleDate') || {}).value || '',
        customer: (document.getElementById('saleCustomer') || {}).value || '',
        location: (document.getElementById('saleLocation') || {}).value || '',
        description: (document.getElementById('saleNotes') || {}).value || '',
        discount: parseFloat((document.getElementById('saleDiscount') || {}).value || 0) || 0,
        payment_status: 'paid',
        items: items
    };
    try {
        const isEdit = !!editingSaleId;
        const res = await fetch(API + (isEdit ? ('/api/sales/' + editingSaleId) : '/api/sales'), {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            let err = await res.text();
            try { err = JSON.parse(err).detail || err; } catch (e) {}
            throw new Error(err || ('HTTP ' + res.status));
        }
        const data = await res.json().catch(function () { return {}; });
        saleItems = [];
        editingSaleId = null;
        closeModal('newSaleModal');
        if (typeof toast === 'function') {
            toast(appLang === 'fa' ? (editingSaleId ? 'فروش ویرایش شد' : 'فروش ثبت شد') : (editingSaleId ? 'Sale updated' : 'Sale saved'), 'success');
        } else {
            alert(appLang === 'fa' ? (editingSaleId ? 'فروش ویرایش شد' : 'فروش ثبت شد') : (editingSaleId ? 'Sale updated' : 'Sale saved'));
        }
        if (typeof loadSales === 'function') loadSales();
        if (typeof loadDashboard === 'function') loadDashboard();
    } catch (e) {
        console.error(e);
        alert((appLang === 'fa' ? 'خطا در ذخیره فروش: ' : 'Save error: ') + (e.message || e));
    }
}

async function loadSales() {
    try {
        const q = (document.getElementById('saleSearch') || {}).value || '';
        const res = await fetch(API + '/api/sales?search=' + encodeURIComponent(q));
        if (!res.ok) throw new Error('fail');
        cacheSales = await res.json();
        const body = document.getElementById('salesBody');
        if (!body) return;
        body.innerHTML = (cacheSales || []).map(r => {
            const dateShow = (typeof toJalali === 'function' ? toJalali(r.date) : r.date) || r.date;
            return '<tr>'
                + '<td><button class="btn btn-primary" style="padding:4px 8px;font-size:12px" onclick="printSale(' + r.id + ')" title="print">🖨️</button> '
                + '<button class="btn btn-secondary" style="padding:4px 8px;font-size:12px" onclick="editSale(' + r.id + ')" title="edit">✏️</button> '
                + '<button class="btn" style="padding:4px 8px;font-size:12px" onclick="deleteSale(' + r.id + ')" title="delete">🗑</button></td>'
                + '<td>' + (dateShow || '') + (r.invoice_no ? '<br><small>' + r.invoice_no + '</small>' : '') + '</td>'
                + '<td>' + (r.customer || '') + '</td>'
                + '<td>' + (r.location || '') + '</td>'
                + '<td>' + Number(r.total || 0).toLocaleString() + '</td>'
                + '<td>' + (r.description || '') + '</td>'
                + '</tr>';
        }).join('') || '<tr><td colspan="6" style="text-align:center;opacity:.6">' + (appLang==='fa'?'فروشی ثبت نشده':'No sales') + '</td></tr>';
    } catch (e) {
        console.error(e);
    }
}


async function editSale(id) {
    try {
        const res = await fetch(API + '/api/sales/' + id);
        if (!res.ok) throw new Error('load fail');
        const p = await res.json();
        editingSaleId = id;
        saleItems = (p.items || []).map(function (it) {
            return {
                code: it.code || '',
                name: it.name || '',
                quantity: Number(it.quantity || 1),
                unit_price: Number(it.unit_price || 0),
                total: Number(it.quantity || 1) * Number(it.unit_price || 0)
            };
        });
        const el = function (i) { return document.getElementById(i); };
        if (el('saleDate')) el('saleDate').value = (p.date || '').slice(0, 10);
        if (el('saleCustomer')) el('saleCustomer').value = p.customer || '';
        if (el('saleLocation')) el('saleLocation').value = p.location || '';
        if (el('saleDiscount')) el('saleDiscount').value = p.discount || 0;
        if (el('saleNotes')) el('saleNotes').value = p.description || '';
        if (el('saleItemName')) el('saleItemName').value = '';
        if (el('saleItemQty')) el('saleItemQty').value = '1';
        if (el('saleItemPrice')) el('saleItemPrice').value = '';
        renderSaleItems();
        bindSaleLiveTotal();
        const m = el('newSaleModal');
        if (m) {
            if (m.parentElement && m.parentElement.classList && m.parentElement.classList.contains('mdi-body')) {
                (document.getElementById('mainScroll') || document.body).appendChild(m);
            }
            document.querySelectorAll('.mdi-window[data-page="newSaleModal"]').forEach(function (w) { w.remove(); });
            m.style.display = '';
            m.classList.add('active');
            setModalTitle('newSaleModal', t('edit_sale'));
        }
    } catch (e) {
        console.error(e);
        alert(appLang === 'fa' ? 'خطا در بارگذاری فروش' : 'Failed to load sale');
    }
}

async function deleteSale(id) {
    if (!confirm(appLang==='fa'?'حذف شود؟':'Delete?')) return;
    await fetch(API + '/api/sales/' + id, { method: 'DELETE' });
    loadSales();
}

async function printSale(id) {
    try {
        let p = null;
        const res = await fetch(API + '/api/sales/' + id);
        if (res.ok) p = await res.json();
        if (!p) { alert('not found'); return; }
        // adapt to printPurchase shape
        const adapted = {
            id: p.id,
            date: p.date,
            seller: p.customer,
            location: p.location,
            description: p.description,
            total: p.total,
            discount: p.discount,
            currency: p.currency,
            invoice_no: p.invoice_no || ('SALE-' + p.id),
            items: p.items || []
        };
        // reuse print layout by temp override
        const prev = (cachePurchases || []).slice();
        window._printSaleOnce = adapted;
        await printSaleDocument(adapted);
    } catch (e) {
        console.error(e);
        alert(e.message || 'print error');
    }
}

async function printSaleDocument(p) {
    let settings = {};
    try {
        const sr = await fetch(API + '/api/settings');
        if (sr.ok) settings = await sr.json();
    } catch (e) {}
    const shop = settings.company || settings.name || 'CluDari';
    const shopAddr = settings.address || '';
    const shopPhone = settings.phone || '';
    const invNo = p.invoice_no || ('SALE-' + p.id);
    const dateFa = (typeof toJalali === 'function' ? toJalali(p.date) : p.date) || p.date || '';
    const customer = p.seller || p.customer || '—';
    const location = p.location || '';
    const notes = p.description || '';
    const items = p.items || [];
    const discount = Number(p.discount || 0);
    let subtotal = 0;
    items.forEach(function(it) { subtotal += Number(it.quantity || 1) * Number(it.unit_price || 0); });
    if (!subtotal && p.total) subtotal = Number(p.total) + discount;
    const grand = Math.max(0, subtotal - discount);
    const money = function(n) { try { return Number(n || 0).toLocaleString('fa-IR'); } catch(e) { return String(n||0); } };
    const numFa = function(n) { try { return String(n).replace(/\d/g, function(d){ return '۰۱۲۳۴۵۶۷۸۹'[d]; }); } catch(e) { return n; } };
    let rowsHtml = '';
    if (!items.length) rowsHtml = '<tr><td colspan="6" style="text-align:center">بدون قلم</td></tr>';
    else items.forEach(function(it, idx) {
        const line = Number(it.quantity || 1) * Number(it.unit_price || 0);
        rowsHtml += '<tr><td class="c">' + numFa(idx+1) + '</td><td class="r">' + (it.name||'') + '</td><td class="c">عدد</td><td class="c">' + money(it.quantity||1) + '</td><td class="c">' + money(it.unit_price||0) + '</td><td class="c">' + money(line) + '</td></tr>';
    });
    const html = '<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>فاکتور فروش ' + invNo + '</title>'
        + '<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Tahoma,sans-serif;padding:12px}'
        + '.sheet{max-width:800px;margin:0 auto;border:2px solid #222;padding:12px}'
        + 'table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #333;padding:6px}'
        + 'th{background:#e8e8e8}.c{text-align:center}.r{text-align:right}'
        + '.title{text-align:center;margin:10px 0;font-weight:800}'
        + '@media print{body{padding:0}}</style></head><body><div class="sheet">'
        + '<div style="display:flex;justify-content:space-between"><div><b style="font-size:18px">' + shop + '</b><div style="font-size:11px">' + shopAddr + ' ' + shopPhone + '</div></div>'
        + '<div style="font-size:12px">شماره: <b>' + invNo + '</b><br>تاریخ: <b>' + dateFa + '</b></div></div>'
        + '<div class="title">فاکتور فروش</div>'
        + '<div style="border:1px solid #333;padding:8px;font-size:12px;margin-bottom:8px">مشتری: <b>' + customer + '</b> — محل: ' + (location||'—') + (notes?(' — ' + notes):'') + '</div>'
        + '<table><thead><tr><th>ردیف</th><th>شرح</th><th>واحد</th><th>تعداد</th><th>مبلغ واحد</th><th>مبلغ کل</th></tr></thead><tbody>' + rowsHtml + '</tbody></table>'
        + '<table style="margin-top:8px;width:50%;margin-right:0;margin-left:auto"><tr><td>جمع کل</td><td class="c">' + money(subtotal) + '</td></tr>'
        + '<tr><td>تخفیف</td><td class="c">' + money(discount) + '</td></tr>'
        + '<tr><td><b>قابل پرداخت</b></td><td class="c"><b>' + money(grand) + '</b></td></tr></table>'
        + '<div style="display:flex;justify-content:space-between;margin-top:40px;font-size:12px"><div>مهر فروشنده</div><div>امضای خریدار</div></div>'
        + '</div></body></html>';
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:0';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    doc.open(); doc.write(html); doc.close();
    setTimeout(function(){ try { iframe.contentWindow.print(); } catch(e) {} }, 250);
}


(function bindLoginButtons() {
  function wire() {
    try { hideAppLoading(); } catch (e) {}
    var b = document.getElementById('loginSubmitBtn');
    if (b && !b.dataset.wired) {
      b.dataset.wired = '1';
      b.addEventListener('click', function (ev) {
        ev.preventDefault();
        doLogin();
      });
    }
    var r = document.getElementById('registerSubmitBtn');
    if (r && !r.dataset.wired) {
      r.dataset.wired = '1';
      r.addEventListener('click', function (ev) {
        ev.preventDefault();
        doRegister();
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
  setTimeout(wire, 500);
})();


// ═══ Admissions (پذیرش) ═══
let cacheAdmissions = [];
let editingAdmissionId = null;
let admissionItems = [];

function updateAdmissionTotal() {
  let sum = 0;
  (admissionItems || []).forEach(function (it) {
    sum += (Number(it.quantity) || 0) * (Number(it.unit_price) || 0);
  });
  const body = document.getElementById('admItemsBody');
  if (body) {
    body.querySelectorAll('tr').forEach(function (tr, idx) {
      if (!admissionItems[idx]) return;
      const q = tr.querySelector('.adm-qty');
      const p = tr.querySelector('.adm-price');
      const qty = q ? parseFloat(q.value) || 0 : 0;
      const price = p ? parseFloat(p.value) || 0 : 0;
      admissionItems[idx].quantity = qty;
      admissionItems[idx].unit_price = price;
      const tot = tr.querySelector('.adm-line-total');
      if (tot) tot.textContent = (qty * price).toLocaleString();
    });
    sum = admissionItems.reduce(function (a, it) {
      return a + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0);
    }, 0);
  }
  const stated = 0;
  const show = sum > 0 ? sum : stated;
  const lab = document.getElementById('admTotalLabel');
  if (lab) lab.textContent = show.toLocaleString() + (appLang === 'fa' ? ' تومان' : '');
}

function renderAdmissionItems() {
  const body = document.getElementById('admItemsBody');
  if (!body) return;
  if (!admissionItems.length) {
    admissionItems = [{ name: '', quantity: 1, unit_price: 0 }];
  }
  body.innerHTML = admissionItems.map(function (it, i) {
    return '<tr>'
      + '<td>' + (i + 1) + '</td>'
      + '<td><input class="form-control adm-name" value="' + String(it.name || '').replace(/"/g, '&quot;') + '" placeholder="' + (appLang==='fa'?'کار':'Work') + '" oninput="admissionItems[' + i + '].name=this.value"></td>'
      + '<td><input type="number" class="form-control adm-qty" value="' + (it.quantity || 1) + '" min="0" step="any" oninput="updateAdmissionTotal()"></td>'
      + '<td><input type="number" class="form-control adm-price" value="' + (it.unit_price || 0) + '" min="0" step="any" oninput="updateAdmissionTotal()"></td>'
      + '<td class="adm-line-total">' + ((Number(it.quantity)||0)*(Number(it.unit_price)||0)).toLocaleString() + '</td>'
      + '<td><button type="button" class="row-del-btn" onclick="removeAdmissionItem(' + i + ')" title="del">🗑</button></td>'
      + '</tr>';
  }).join('');
  updateAdmissionTotal();
}

function addAdmissionItemRow() {
  admissionItems.push({ name: '', quantity: 1, unit_price: 0 });
  renderAdmissionItems();
}

function removeAdmissionItem(i) {
  admissionItems.splice(i, 1);
  if (!admissionItems.length) admissionItems = [{ name: '', quantity: 1, unit_price: 0 }];
  renderAdmissionItems();
}

function openNewAdmission() {
  editingAdmissionId = null;
  admissionItems = [{ name: '', quantity: 1, unit_price: 0 }];
  const d = new Date();
  const iso = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  const el = function(id){ return document.getElementById(id); };
  if (el('admDate')) el('admDate').value = iso;
  if (el('admLocation')) el('admLocation').value = '';
  if (el('admPatient')) el('admPatient').value = '';
  if (el('admNurse')) el('admNurse').value = '';
  if (el('admDoctor')) el('admDoctor').value = '';
  if (el('admPaid')) el('admPaid').value = '0';
  if (el('admNotes')) el('admNotes').value = '';
  const title = el('admissionModalTitle');
  if (title) {
    var tv = (appLang === 'fa') ? 'پذیرش جدید' : 'New admission';
    try {
      var tr = (typeof t === 'function') ? t('btn_new_admission') : '';
      if (tr && tr !== 'btn_new_admission') tv = tr;
    } catch (e) {}
    var span = title.querySelector('[data-i18n]') || title;
    span.textContent = tv;
  }
  const m = el('admissionModal');
  if (m) {
    m.style.display = '';
    m.classList.add('active');
  }
  try { if (typeof applyLanguage === 'function') applyLanguage(); clinicForceLang(); } catch (e) {}
  try { loadNurses(); loadDoctors(); } catch(e){}
  renderAdmissionItems();
  updateAdmissionTotal();
}

async function editAdmission(id) {
  try {
    const res = await fetch(API + '/api/admissions/' + id);
    if (!res.ok) throw new Error('load');
    const p = await res.json();
    editingAdmissionId = id;
    admissionItems = (p.items && p.items.length) ? p.items.map(function(it){
      return { name: it.name||'', quantity: Number(it.quantity||1), unit_price: Number(it.unit_price||0) };
    }) : [{ name: '', quantity: 1, unit_price: 0 }];
    const el = function(id){ return document.getElementById(id); };
    if (el('admDate')) el('admDate').value = (p.date||'').slice(0,10);
    if (el('admLocation')) el('admLocation').value = p.location || '';
    if (el('admPatient')) el('admPatient').value = p.patient_name || '';
    if (el('admNurse')) el('admNurse').value = p.nurse_name || '';
    if (el('admDoctor')) el('admDoctor').value = p.doctor_name || '';
    if (el('admPaid')) el('admPaid').value = p.paid_amount || 0;
    if (el('admNotes')) el('admNotes').value = p.description || '';
    renderAdmissionItems();
    const title = el('admissionModalTitle');
    if (title) title.textContent = (typeof t === 'function' ? t('edit_admission') : (appLang==='fa'?'ویرایش پذیرش':'Edit admission'));
    const m = el('admissionModal');
    if (m) { m.style.display=''; m.classList.add('active'); }
  } catch (e) {
    console.error(e);
    alert(appLang==='fa' ? 'خطا در بارگذاری' : 'Load failed');
  }
}

async function saveAdmission() {
  // sync items from DOM
  const body = document.getElementById('admItemsBody');
  if (body) {
    body.querySelectorAll('tr').forEach(function(tr, idx) {
      if (!admissionItems[idx]) admissionItems[idx] = { name:'', quantity:1, unit_price:0 };
      const n = tr.querySelector('.adm-name');
      const q = tr.querySelector('.adm-qty');
      const p = tr.querySelector('.adm-price');
      if (n) admissionItems[idx].name = n.value;
      if (q) admissionItems[idx].quantity = parseFloat(q.value)||0;
      if (p) admissionItems[idx].unit_price = parseFloat(p.value)||0;
    });
  }
  const items = (admissionItems || []).filter(function(it){ return String(it.name||'').trim(); }).map(function(it){
    return { name: String(it.name).trim(), quantity: Number(it.quantity)||1, unit_price: Number(it.unit_price)||0, total: (Number(it.quantity)||1)*(Number(it.unit_price)||0) };
  });
  const patient = ((document.getElementById('admPatient')||{}).value||'').trim();
  if (!patient) {
    alert(appLang==='fa' ? 'نام و نام خانوادگی را وارد کنید' : 'Enter patient name');
    return;
  }
  const payload = {
    date: (document.getElementById('admDate')||{}).value || '',
    location: (document.getElementById('admLocation')||{}).value || '',
    patient_name: patient,
    nurse_name: (document.getElementById('admNurse')||{}).value || '',
    doctor_name: (document.getElementById('admDoctor')||{}).value || '',
    stated_amount: 0,
    paid_amount: parseFloat((document.getElementById('admPaid')||{}).value||0)||0,
    description: (document.getElementById('admNotes')||{}).value || '',
    items: items
  };
  try {
    const isEdit = !!editingAdmissionId;
    const res = await fetch(API + (isEdit ? ('/api/admissions/'+editingAdmissionId) : '/api/admissions'), {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      let err = await res.text();
      try { err = JSON.parse(err).detail || err; } catch(e){}
      throw new Error(err || ('HTTP '+res.status));
    }
    editingAdmissionId = null;
    closeModal('admissionModal');
    if (typeof toast === 'function') toast(appLang==='fa'?'ذخیره شد':'Saved', 'success');
    else alert(appLang==='fa'?'ذخیره شد':'Saved');
    if (currentEnv === 'clinic') clinicGo('admissions');
    else loadAdmissions();
  } catch (e) {
    console.error(e);
    alert(e.message || 'error');
  }
}

async function loadAdmissions() {
  try {
    const q = ((document.getElementById('admissionSearch')||{}).value||'').trim();
    const url = API + '/api/admissions' + (q ? ('?search='+encodeURIComponent(q)) : '');
    const res = await fetch(url);
    if (!res.ok) throw new Error('fail');
    cacheAdmissions = await res.json();
    const body = document.getElementById('admissionsBody');
    if (!body) return;
    body.innerHTML = (cacheAdmissions||[]).map(function(r){
      const dateShow = (typeof toJalali==='function' ? toJalali(r.date) : r.date) || r.date;
      return '<tr>'
        + '<td style="white-space:nowrap">'
        + '<button class="btn btn-secondary" style="padding:4px 8px;font-size:12px" onclick="editAdmission('+r.id+')" title="edit">✏️</button> '
        + '<button class="btn btn-secondary" style="padding:4px 8px;font-size:12px" onclick="printAdmission('+r.id+')" title="print">🖨</button> '
        + '<button class="btn" style="padding:4px 8px;font-size:12px" onclick="deleteAdmission('+r.id+')" title="del">🗑</button></td>'
        + '<td>'+(dateShow||'')+'</td>'
        + '<td>'+(r.patient_name||'')+'</td>'
        + '<td>'+(r.nurse_name||'')+'</td>'
        + '<td>'+(r.doctor_name||'')+'</td>'
        + '<td>'+(r.location||'')+'</td>'
                + '<td>'+Number(r.paid_amount||0).toLocaleString()+'</td>'
        + '</tr>';
    }).join('') || '<tr><td colspan="7" style="text-align:center;opacity:.6">'+(appLang==='fa'?'پذیرشی ثبت نشده':'No admissions')+'</td></tr>';
  } catch (e) {
    console.error(e);
  }
}

async function deleteAdmission(id) {
  if (!confirm(appLang==='fa'?'حذف شود؟':'Delete?')) return;
  await fetch(API + '/api/admissions/' + id, { method: 'DELETE' });
  loadAdmissions();
}





function printAdmission(id) {
  var list = cacheAdmissions || [];
  var r = null;
  for (var i = 0; i < list.length; i++) {
    if (String(list[i].id) === String(id)) { r = list[i]; break; }
  }
  function doPrint(rec) {
    if (!rec) { alert(appLang==='fa'?'یافت نشد':'Not found'); return; }
    var items = rec.items || [];
    var dateShow = (typeof toJalali === 'function' && appLang==='fa') ? (toJalali(rec.date) || rec.date) : (rec.date || '');
    var rows = '';
    var sum = 0;
    if (!items.length) {
      rows = '<tr><td colspan="5" style="text-align:center">—</td></tr>';
    } else {
      items.forEach(function (it, idx) {
        var line = (Number(it.quantity)||0) * (Number(it.unit_price)||0);
        sum += line;
        rows += '<tr>'
          + '<td style="text-align:center">' + (idx+1) + '</td>'
          + '<td>' + (it.name||'') + '</td>'
          + '<td style="text-align:center">' + (it.quantity||0) + '</td>'
          + '<td style="text-align:left">' + Number(it.unit_price||0).toLocaleString() + '</td>'
          + '<td style="text-align:left">' + line.toLocaleString() + '</td>'
          + '</tr>';
      });
    }
    if (!sum) sum = Number(rec.paid_amount||0) || Number(rec.stated_amount||0) || 0;
    var paid = Number(rec.paid_amount||0);
    var isFa = appLang === 'fa';
    var L = {
      title: isFa ? 'قبض پذیرش — کلینیک' : 'Admission Invoice — Clinic',
      brand: 'CluDari Clinic',
      inv: isFa ? 'شماره' : 'No.',
      date: isFa ? 'تاریخ' : 'Date',
      patient: isFa ? 'نام بیمار' : 'Patient',
      nurse: isFa ? 'پرستار' : 'Nurse',
      doctor: isFa ? 'پزشک' : 'Doctor',
      loc: isFa ? 'محل' : 'Location',
      notes: isFa ? 'توضیحات' : 'Notes',
      work: isFa ? 'شرح خدمت / کار' : 'Service / Work',
      qty: isFa ? 'تعداد' : 'Qty',
      unit: isFa ? 'قیمت واحد' : 'Unit price',
      total: isFa ? 'جمع' : 'Total',
      grand: isFa ? 'جمع کل' : 'Grand total',
      paid: isFa ? 'مبلغ پرداخت‌شده' : 'Paid amount',
      remain: isFa ? 'مانده' : 'Balance',
      thanks: isFa ? 'از اعتماد شما سپاسگزاریم.' : 'Thank you for your trust.',
      row: isFa ? 'ردیف' : '#'
    };
    var remain = Math.max(0, sum - paid);
    var html = '<!DOCTYPE html><html lang="'+(isFa?'fa':'en')+'" dir="'+(isFa?'rtl':'ltr')+'"><head><meta charset="utf-8"><title>'+L.title+'</title>'
      + '<style>'
      + 'body{font-family:Tahoma,Arial,sans-serif;color:#1a1a1a;padding:24px;max-width:800px;margin:0 auto}'
      + '.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #c9a227;padding-bottom:12px;margin-bottom:16px}'
      + '.brand{font-size:22px;font-weight:800;color:#6b5420}'
      + '.brand small{display:block;font-size:12px;font-weight:600;color:#888;margin-top:4px}'
      + '.meta{font-size:13px;text-align:'+(isFa?'left':'right')+'}'
      + '.info{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:13px}'
      + '.info td{border:1px solid #ddd;padding:8px 10px}'
      + '.info td.k{background:#f7f3e8;font-weight:700;width:18%}'
      + 'table.items{width:100%;border-collapse:collapse;font-size:13px}'
      + 'table.items th{background:#6b5420;color:#fff;padding:8px;border:1px solid #5a4618}'
      + 'table.items td{border:1px solid #ddd;padding:8px}'
      + '.totals{margin-top:12px;width:100%;border-collapse:collapse;font-size:13px}'
      + '.totals td{padding:8px;border:1px solid #ddd}'
      + '.totals .lab{background:#f7f3e8;font-weight:700}'
      + '.foot{margin-top:28px;font-size:12px;color:#666;text-align:center;border-top:1px dashed #ccc;padding-top:12px}'
      + '@media print{body{padding:0} .noprint{display:none}}'
      + '</style></head><body>'
      + '<div class="head"><div class="brand">'+L.brand+'<small>'+L.title+'</small></div>'
      + '<div class="meta">'+L.inv+': '+(rec.id||'')+'<br>'+L.date+': '+dateShow+'</div></div>'
      + '<table class="info"><tr>'
      + '<td class="k">'+L.patient+'</td><td>'+(rec.patient_name||'')+'</td>'
      + '<td class="k">'+L.doctor+'</td><td>'+(rec.doctor_name||'')+'</td></tr><tr>'
      + '<td class="k">'+L.nurse+'</td><td>'+(rec.nurse_name||'')+'</td>'
      + '<td class="k">'+L.loc+'</td><td>'+(rec.location||'')+'</td></tr>'
      + (rec.description ? ('<tr><td class="k">'+L.notes+'</td><td colspan="3">'+(rec.description||'')+'</td></tr>') : '')
      + '</table>'
      + '<table class="items"><thead><tr><th>'+L.row+'</th><th>'+L.work+'</th><th>'+L.qty+'</th><th>'+L.unit+'</th><th>'+L.total+'</th></tr></thead>'
      + '<tbody>'+rows+'</tbody></table>'
      + '<table class="totals"><tr><td class="lab">'+L.grand+'</td><td style="text-align:left;font-weight:800">'+sum.toLocaleString()+'</td></tr>'
      + '<tr><td class="lab">'+L.paid+'</td><td style="text-align:left">'+paid.toLocaleString()+'</td></tr>'
      + '<tr><td class="lab">'+L.remain+'</td><td style="text-align:left">'+remain.toLocaleString()+'</td></tr></table>'
      + '<div class="foot">'+L.thanks+' · CluDari Clinic</div>'
      + '<script>window.onload=function(){setTimeout(function(){window.print();},200);}<\\/script>'
      + '</body></html>';
    try {
      // pywebview cannot open blob:/about: URLs — print via hidden iframe only
      var ifr = document.getElementById('clinicPrintFrame');
      if (!ifr) {
        ifr = document.createElement('iframe');
        ifr.id = 'clinicPrintFrame';
        ifr.setAttribute('title', 'print');
        ifr.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;height:1100px;border:0;opacity:0;pointer-events:none;';
        document.body.appendChild(ifr);
      }
      var doc = ifr.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(function () {
        try {
          ifr.contentWindow.focus();
          ifr.contentWindow.print();
        } catch (e1) {
          // last resort: temporary visible area in same document
          try {
            var box = document.getElementById('clinicPrintBox');
            if (!box) {
              box = document.createElement('div');
              box.id = 'clinicPrintBox';
              document.body.appendChild(box);
            }
            box.innerHTML = html.replace(/<script[\s\S]*?<\/script>/gi, '');
            box.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#fff;overflow:auto;padding:24px';
            var closeB = document.createElement('button');
            closeB.textContent = appLang==='fa'?'بستن / چاپ':'Close / Print';
            closeB.style.cssText = 'position:sticky;top:8px;margin:8px;padding:8px 16px;z-index:2';
            closeB.onclick = function(){ try{window.print();}catch(e){}; box.style.display='none'; box.innerHTML=''; };
            box.insertBefore(closeB, box.firstChild);
            box.style.display = 'block';
            setTimeout(function(){ try{window.print();}catch(e){} }, 300);
          } catch (e2) {
            alert(appLang==='fa'?'خطا در چاپ':'Print error');
          }
        }
      }, 250);
    } catch (err) {
      console.error(err);
      alert(appLang==='fa'?'خطا در چاپ':'Print error');
    }
  }
  if (r && r.items) { doPrint(r); return; }
  fetch(API + '/api/admissions/' + id).then(function(res){ return res.json(); }).then(doPrint).catch(function(){
    alert(appLang==='fa'?'خطا':'Error');
  });
}


let editingNurseId = null;
let editingDoctorId = null;
let cacheNurses = [];
let cacheDoctorsList = [];

function openNurseModal(id) {
  editingNurseId = id || null;
  document.getElementById('nurseName').value = '';
  document.getElementById('nursePhone').value = '';
  document.getElementById('nurseNotes').value = '';
  var tEl = document.getElementById('nurseModalTitle');
  if (tEl) tEl.textContent = appLang==='fa' ? (id ? 'ویرایش پرستار' : 'پرستار جدید') : (id ? 'Edit nurse' : 'New nurse');
  if (id) {
    var r = (cacheNurses||[]).find(function(x){ return x.id==id; });
    if (r) {
      document.getElementById('nurseName').value = r.name||'';
      document.getElementById('nursePhone').value = r.phone||'';
      document.getElementById('nurseNotes').value = r.description||'';
    }
  }
  var m = document.getElementById('nurseModal');
  if (m) { m.style.display=''; m.classList.add('active'); }
}

async function saveNurse() {
  var name = (document.getElementById('nurseName').value||'').trim();
  if (!name) { alert(appLang==='fa'?'نام را وارد کنید':'Enter name'); return; }
  var payload = { name: name, phone: document.getElementById('nursePhone').value||'', description: document.getElementById('nurseNotes').value||'' };
  var isEdit = !!editingNurseId;
  var res = await fetch(API + (isEdit ? '/api/nurses/'+editingNurseId : '/api/nurses'), {
    method: isEdit ? 'PUT' : 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
  });
  if (!res.ok) { alert('Error'); return; }
  closeModal('nurseModal');
  if (typeof toast==='function') toast(appLang==='fa'?'ذخیره شد':'Saved','success');
  loadNurses();
}

async function loadNurses() {
  try {
    var res = await fetch(API + '/api/nurses');
    cacheNurses = await res.json();
    var body = document.getElementById('nursesBody');
    if (body) {
      body.innerHTML = (cacheNurses||[]).map(function(r){
        return '<tr><td><button class="btn btn-secondary" style="padding:4px 8px" onclick="openNurseModal('+r.id+')">✏️</button> '
          +'<button class="btn" style="padding:4px 8px" onclick="deleteNurse('+r.id+')">🗑</button></td>'
          +'<td>'+(r.name||'')+'</td><td>'+(r.phone||'')+'</td><td>'+(r.description||'')+'</td></tr>';
      }).join('') || '<tr><td colspan="4" style="text-align:center;opacity:.6">'+(appLang==='fa'?'خالی':'Empty')+'</td></tr>';
    }
    var dl = document.getElementById('nurseDatalist');
    if (dl) dl.innerHTML = (cacheNurses||[]).map(function(r){ return '<option value="'+String(r.name||'').replace(/"/g,'&quot;')+'">'; }).join('');
  } catch(e) { console.error(e); }
}

async function deleteNurse(id) {
  if (!confirm(appLang==='fa'?'حذف؟':'Delete?')) return;
  await fetch(API+'/api/nurses/'+id,{method:'DELETE'});
  loadNurses();
}

function openDoctorModal(id) {
  editingDoctorId = id || null;
  document.getElementById('docName').value = '';
  document.getElementById('docSpecialty').value = '';
  document.getElementById('docPhone').value = '';
  document.getElementById('docNotes').value = '';
  var tEl = document.getElementById('doctorModalTitle');
  if (tEl) tEl.textContent = appLang==='fa' ? (id ? 'ویرایش پزشک' : 'پزشک جدید') : (id ? 'Edit doctor' : 'New doctor');
  if (id) {
    var r = (cacheDoctorsList||[]).find(function(x){ return x.id==id; });
    if (r) {
      document.getElementById('docName').value = r.name||'';
      document.getElementById('docSpecialty').value = r.specialty||'';
      document.getElementById('docPhone').value = r.phone||'';
      document.getElementById('docNotes').value = r.description||'';
    }
  }
  var m = document.getElementById('doctorModal');
  if (m) { m.style.display=''; m.classList.add('active'); }
}

async function saveDoctor() {
  var name = (document.getElementById('docName').value||'').trim();
  if (!name) { alert(appLang==='fa'?'نام را وارد کنید':'Enter name'); return; }
  var payload = { name: name, specialty: document.getElementById('docSpecialty').value||'', phone: document.getElementById('docPhone').value||'', description: document.getElementById('docNotes').value||'', status:'active' };
  var isEdit = !!editingDoctorId;
  var res = await fetch(API + (isEdit ? '/api/doctors/'+editingDoctorId : '/api/doctors'), {
    method: isEdit ? 'PUT' : 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
  });
  if (!res.ok) { alert('Error'); return; }
  closeModal('doctorModal');
  if (typeof toast==='function') toast(appLang==='fa'?'ذخیره شد':'Saved','success');
  loadDoctors();
}

async function loadDoctors() {
  try {
    var res = await fetch(API + '/api/doctors');
    cacheDoctorsList = await res.json();
    var body = document.getElementById('doctorsBody');
    if (body) {
      body.innerHTML = (cacheDoctorsList||[]).map(function(r){
        return '<tr><td><button class="btn btn-secondary" style="padding:4px 8px" onclick="openDoctorModal('+r.id+')">✏️</button> '
          +'<button class="btn" style="padding:4px 8px" onclick="deleteDoctor('+r.id+')">🗑</button></td>'
          +'<td>'+(r.name||'')+'</td><td>'+(r.specialty||'')+'</td><td>'+(r.phone||'')+'</td><td>'+(r.description||'')+'</td></tr>';
      }).join('') || '<tr><td colspan="5" style="text-align:center;opacity:.6">'+(appLang==='fa'?'خالی':'Empty')+'</td></tr>';
    }
    var dl = document.getElementById('doctorDatalist');
    if (dl) dl.innerHTML = (cacheDoctorsList||[]).map(function(r){ return '<option value="'+String(r.name||'').replace(/"/g,'&quot;')+'">'; }).join('');
  } catch(e) { console.error(e); }
}

async function deleteDoctor(id) {
  if (!confirm(appLang==='fa'?'حذف؟':'Delete?')) return;
  await fetch(API+'/api/doctors/'+id,{method:'DELETE'});
  loadDoctors();
}



// ═══ Clinic environment shell (must exist for enterClinicEnv) ═══
let currentEnv = 'accounting';
let _clinicClockTimer = null;

function clinicForceLang() {
  var fa = (appLang === 'fa');
  var map = {
    env_clinic_home: fa ? 'خانه درمانگاه' : 'Clinic home',
    btn_new_admission: fa ? 'پذیرش جدید' : 'New admission',
    nav_admissions: fa ? 'پذیرش‌ها' : 'Admissions',
    env_back_accounting: fa ? 'بازگشت به حسابداری' : 'Back to accounting',
    env_clinic_tag: fa ? 'محیط درمانگاه' : 'Clinic',
    env_clinic_title: fa ? 'محیط درمانگاه' : 'Clinic environment',
    env_clinic_enter: fa ? 'محیط درمانگاه' : 'Clinic env',
    env_tile_new_adm: fa ? 'ثبت بیمار' : 'Register patient',
    env_tile_adm_list: fa ? 'سوابق' : 'Records',
    env_tile_leave: fa ? 'خروج از این محیط' : 'Leave this environment',
    nav_nurses: fa ? 'پرستاران' : 'Nurses',
    nav_doctors: fa ? 'پزشکان' : 'Doctors',
    btn_new_nurse: fa ? 'پرستار جدید' : 'New nurse',
    btn_new_doctor: fa ? 'پزشک جدید' : 'New doctor',
    env_tile_nurses: fa ? 'اسامی پرستاران' : 'Nurse names',
    env_tile_doctors: fa ? 'اسامی پزشکان' : 'Doctor names',
    lbl_patient_name: fa ? 'نام و نام خانوادگی' : 'Full name',
    lbl_nurse: fa ? 'نام پرستار' : 'Nurse name',
    lbl_doctor: fa ? 'نام پزشک' : 'Doctor name',
    lbl_location: fa ? 'محل' : 'Location',
    lbl_date: fa ? 'تاریخ' : 'Date',
    lbl_paid_amount: fa ? 'مبلغ پرداخت‌شده' : 'Paid amount',
    lbl_more_info: fa ? 'اطلاعات بیشتر' : 'More information',
    lbl_items: fa ? 'اقلام' : 'Items',
    lbl_work: fa ? 'کار' : 'Work',
    lbl_grand_total: fa ? 'جمع کل' : 'Grand total',
    btn_add_row: fa ? 'ردیف +' : 'Row +',
    save: fa ? 'ذخیره' : 'Save',
    cancel: fa ? 'انصراف' : 'Cancel',
    col_qty: fa ? 'تعداد' : 'Qty',
    col_unit_price: fa ? 'قیمت واحد' : 'Unit price',
    col_total: fa ? 'جمع' : 'Total',
    col_actions: fa ? 'عملیات' : 'Actions',
    col_date: fa ? 'تاریخ' : 'Date',
    col_name: fa ? 'نام' : 'Name',
    col_phone: fa ? 'تلفن' : 'Phone',
    col_notes: fa ? 'توضیح' : 'Notes',
    lbl_specialty: fa ? 'تخصص' : 'Specialty',
    ph_search: fa ? 'جستجو...' : 'Search...',
    ph_adm_location: fa ? 'بخش / کلینیک' : 'Ward / clinic',
    ph_adm_patient: fa ? 'نام بیمار' : 'Patient name',
    ph_adm_nurse: fa ? 'نام پرستار' : 'Nurse name',
    ph_adm_doctor: fa ? 'نام پزشک' : 'Doctor name',
    ph_adm_notes: fa ? 'توضیحات، یادداشت پذیرش...' : 'Notes, admission remarks...'
  };
  document.querySelectorAll('#clinicEnv [data-i18n], #admissionModal [data-i18n], #page-admissions [data-i18n], #page-nurses [data-i18n], #page-doctors [data-i18n], #nurseModal [data-i18n], #doctorModal [data-i18n]').forEach(function(el){
    var k = el.getAttribute('data-i18n');
    if (k && map[k]) el.textContent = map[k];
  });
  document.querySelectorAll('#clinicEnv [data-i18n-placeholder], #admissionModal [data-i18n-placeholder], #page-admissions [data-i18n-placeholder]').forEach(function(el){
    var k = el.getAttribute('data-i18n-placeholder');
    if (k && map[k]) el.placeholder = map[k];
  });
}

function clinicSyncChrome() {
  var u = document.getElementById('clinicUserLabel');
  if (u) {
    var name = (typeof currentUsername !== 'undefined' && currentUsername) ? currentUsername : (localStorage.getItem('cludari_user') || '—');
    var lab = appLang === 'fa' ? 'کاربر' : 'User';
    u.innerHTML = '<span class="cu-label">' + lab + '</span> <span class="cu-name">' + name + '</span>';
  }
  var langBtn = document.getElementById('clinicLangBtn');
  if (langBtn) langBtn.textContent = appLang === 'fa' ? '🌐 FA' : '🌐 EN';
  try { clinicForceLang(); } catch (e) {}
}

function clinicToggleLang() {
  appLang = (appLang === 'fa') ? 'en' : 'fa';
  try {
    localStorage.setItem('cludari_lang', appLang);
    sessionStorage.setItem('cludari_lang', appLang);
  } catch (e) {}
  try { document.documentElement.lang = appLang; } catch (e) {}
  try { document.documentElement.dir = (appLang === 'fa') ? 'rtl' : 'ltr'; } catch (e) {}
  try { if (typeof applyLanguage === 'function') applyLanguage(); } catch (e) {}
  try { clinicForceLang(); } catch (e) {}
  try { if (typeof renderAdmissionItems === 'function') renderAdmissionItems(); } catch (e) {}
  clinicSyncChrome();
  clinicTickClock();
}

function clinicTickClock() {
  var tEl = document.getElementById('clinicClockTime');
  var dEl = document.getElementById('clinicClockDate');
  if (!tEl && !dEl) return;
  var now = new Date();
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var h = pad(now.getHours()), mi = pad(now.getMinutes()), s = pad(now.getSeconds());
  var m = pad(now.getMonth() + 1), day = pad(now.getDate());
  if (tEl) tEl.textContent = h + ':' + mi + ':' + s;
  if (dEl) {
    if (appLang === 'fa' && typeof toJalali === 'function') {
      try {
        var j = toJalali(now.getFullYear() + '-' + m + '-' + day);
        dEl.textContent = j || (now.getFullYear() + '/' + m + '/' + day);
      } catch (e) {
        dEl.textContent = now.getFullYear() + '/' + m + '/' + day;
      }
    } else {
      dEl.textContent = now.getFullYear() + '/' + m + '/' + day;
    }
  }
}

function clinicStartClock() {
  clinicTickClock();
  if (_clinicClockTimer) clearInterval(_clinicClockTimer);
  _clinicClockTimer = setInterval(clinicTickClock, 1000);
}

function clinicStopClock() {
  if (_clinicClockTimer) { clearInterval(_clinicClockTimer); _clinicClockTimer = null; }
}

function clinicReturnPages() {
  var panel = document.getElementById('clinicPanel');
  var main = document.getElementById('mainScroll') || document.body;
  if (!panel) return;
  panel.querySelectorAll('.page').forEach(function (p) {
    p.style.display = 'none';
    p.classList.remove('active');
    main.appendChild(p);
  });
  panel.classList.remove('active');
  panel.innerHTML = '';
}

function enterClinicEnv() {
  currentEnv = 'clinic';
  var env = document.getElementById('clinicEnv');
  if (!env) {
    alert(appLang === 'fa' ? 'محیط درمانگاه پیدا نشد' : 'Clinic environment not found');
    return;
  }
  env.classList.add('active');
  env.setAttribute('aria-hidden', 'false');
  document.body.classList.add('clinic-mode');
  try { env.classList.remove('clinic-light'); } catch (e) {}
  clinicGo('home');
  try { if (typeof applyLanguage === 'function') applyLanguage(); } catch (e) {}
  clinicSyncChrome();
  clinicStartClock();
  try { if (typeof loadNurses === 'function') loadNurses(); } catch (e) {}
  try { if (typeof loadDoctors === 'function') loadDoctors(); } catch (e) {}
}

function leaveClinicEnv() {
  currentEnv = 'accounting';
  clinicStopClock();
  try { closeModal('admissionModal'); } catch (e) {}
  try { closeModal('nurseModal'); } catch (e) {}
  try { closeModal('doctorModal'); } catch (e) {}
  document.querySelectorAll('#admissionModal.active, #nurseModal.active, #doctorModal.active').forEach(function (m) {
    m.classList.remove('active'); m.style.display = '';
  });
  var env = document.getElementById('clinicEnv');
  if (env) {
    env.classList.remove('active');
    env.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('clinic-mode');
  clinicReturnPages();
  var home = document.getElementById('clinicHome');
  if (home) home.style.display = '';
}

function clinicGo(section) {
  var home = document.getElementById('clinicHome');
  var panel = document.getElementById('clinicPanel');
  if (!panel) return;

  clinicReturnPages();

  if (section === 'home') {
    if (home) home.style.display = '';
    try { closeModal('admissionModal'); } catch (e) {}
    document.querySelectorAll('#admissionModal.active').forEach(function (m) {
      m.classList.remove('active'); m.style.display = '';
    });
    return;
  }

  if (section === 'admission-new') {
    if (home) home.style.display = '';
    if (typeof openNewAdmission === 'function') openNewAdmission();
    return;
  }

  if (home) home.style.display = 'none';

  var pageId = null;
  if (section === 'admissions') pageId = 'page-admissions';
  if (section === 'nurses') pageId = 'page-nurses';
  if (section === 'doctors') pageId = 'page-doctors';
  if (!pageId) {
    if (home) home.style.display = '';
    return;
  }

  var page = document.getElementById(pageId);
  if (!page) {
    if (home) home.style.display = '';
    return;
  }
  page.style.display = 'block';
  page.classList.add('active');
  var closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'ce-panel-close';
  closeBtn.title = appLang === 'fa' ? 'بستن' : 'Close';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = function () { clinicGo('home'); };
  panel.appendChild(page);
  panel.appendChild(closeBtn);
  panel.classList.add('active');

  if (section === 'admissions' && typeof loadAdmissions === 'function') loadAdmissions();
  if (section === 'nurses' && typeof loadNurses === 'function') loadNurses();
  if (section === 'doctors' && typeof loadDoctors === 'function') loadDoctors();
}

function depositHandleEscape() {
  if (!document.body.classList.contains('deposit-mode')) return false;
  var closed = false;
  ['fxTxModal','fxCurrencyModal','budgetModal','goalModal'].forEach(function(id){
    var m = document.getElementById(id);
    if (m && (m.classList.contains('active') || m.style.display === 'flex' || m.style.display === 'block')) {
      m.classList.remove('active');
      m.style.display = 'none';
      closed = true;
    }
  });
  if (closed) return true;
  var panel = document.getElementById('depositPanel');
  if (panel && panel.classList.contains('active')) {
    depositShowHomeOnly();
    return true;
  }
  // second Esc from deposit home -> accounting
  leaveDepositEnv();
  return true;
}
function depositShowHomeOnly() {
  depositReturnPages();
  var home = document.getElementById('depositHome');
  var panel = document.getElementById('depositPanel');
  if (panel) {
    panel.classList.remove('active');
    panel.style.display = 'none';
    panel.innerHTML = '';
  }
  if (home) {
    home.style.display = '';
    home.style.visibility = 'visible';
    home.hidden = false;
  }
}

function clinicHandleEscape() {
  if (currentEnv !== 'clinic' && !document.body.classList.contains('clinic-mode')) return false;
  var closed = false;
  var adm = document.getElementById('admissionModal');
  if (adm && (adm.classList.contains('active') || adm.style.display === 'flex' || adm.style.display === 'block')) {
    adm.classList.remove('active');
    adm.style.display = 'none';
    try { clinicGo('home'); } catch (e) {}
    return true;
  }
  ['nurseModal', 'doctorModal'].forEach(function (id) {
    var m = document.getElementById(id);
    if (m && (m.classList.contains('active') || m.style.display === 'flex' || m.style.display === 'block')) {
      m.classList.remove('active');
      m.style.display = 'none';
      closed = true;
    }
  });
  if (closed) return true;
  var panel = document.getElementById('clinicPanel');
  if (panel && panel.classList.contains('active')) {
    try { clinicGo('home'); } catch (e) {}
    return true;
  }
  // second Esc from clinic home -> accounting
  try { leaveClinicEnv(); } catch (e) {}
  return true;
}

// expose globally for inline onclick
window.enterClinicEnv = enterClinicEnv;
window.leaveClinicEnv = leaveClinicEnv;
window.clinicGo = clinicGo;
window.clinicToggleLang = clinicToggleLang;
window.clinicForceLang = clinicForceLang;
window.clinicHandleEscape = clinicHandleEscape;



// ═══ Personal insights / budget / goals / deposit env ═══
let editingGoalId = null;

function fmtMoney(n) {
  try { return Number(n || 0).toLocaleString(appLang === 'fa' ? 'fa-IR' : undefined); }
  catch (e) { return String(n || 0); }
}
/** Exact FX quantity — no rounding; keeps user-entered decimals */
function fmtFx(n) {
  if (n === null || n === undefined || n === '') return '0';
  var s = String(n).trim();
  if (!s) return '0';
  // already a clean decimal string from DB
  if (/^-?\d+(\.\d+)?$/.test(s)) {
    // strip only trailing zeros after decimal? user asked exact — keep as stored
    // but avoid scientific notation
    var num = Number(s);
    if (!isFinite(num)) return s;
    // use enough precision then trim trailing zeros carefully without changing value
    var t = num.toFixed(12).replace(/\.?0+$/, '');
    // if original had more meaningful digits in string form, prefer string path
    if (s.indexOf('.') >= 0) {
      // preserve original string representation when possible
      return s.replace(/^(-?)0+(?=\d)/, '$1').replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '') || '0';
    }
    return t || '0';
  }
  var num = Number(n);
  if (!isFinite(num)) return String(n);
  return num.toFixed(12).replace(/\.?0+$/, '') || '0';
}


async function loadPersonalInsights() {
  try {
    const res = await fetch(API + '/api/personal/summary');
    if (!res.ok) return;
    const d = await res.json();
    const el = function(id){ return document.getElementById(id); };
    if (el('piThisMonth')) el('piThisMonth').textContent = fmtMoney(d.this_month);
    if (el('piMonthSub')) el('piMonthSub').textContent = (d.month_key || '') + (appLang==='fa' ? ' · جمع خریدها' : ' · purchases');
    var ch = Number(d.change_pct || 0);
    if (el('piChange')) {
      el('piChange').textContent = (ch > 0 ? '+' : '') + ch + '%';
      var card = el('piChange').closest('.pi-card');
      if (card) { card.classList.toggle('warn', ch > 10); card.classList.toggle('ok', ch < 0); }
    }
    if (el('piChangeSub')) {
      el('piChangeSub').textContent = (appLang==='fa' ? 'ماه قبل: ' : 'Last month: ') + fmtMoney(d.last_month);
    }
    var g = d.nearest_goal;
    if (el('piGoal')) {
      if (g && g.title) {
        el('piGoal').textContent = g.title;
        if (el('piGoalSub')) el('piGoalSub').textContent = (appLang==='fa'?'مانده: ':'Left: ') + fmtMoney(g.remain) + ' (' + (g.pct||0) + '%)';
      } else {
        el('piGoal').textContent = appLang==='fa' ? 'هنوز هدفی نیست' : 'No goal';
        if (el('piGoalSub')) el('piGoalSub').textContent = '';
      }
    }
  } catch (e) { console.error(e); }
}

function openBudgetModal() {
  var now = new Date();
  var m = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
  document.getElementById('budCategory').value = '';
  document.getElementById('budLimit').value = '0';
  document.getElementById('budMonth').value = m;
  document.getElementById('budNote').value = '';
  var modal = document.getElementById('budgetModal');
  if (modal) { modal.style.display=''; modal.classList.add('active'); }
}

async function saveBudget() {
  var payload = {
    category: (document.getElementById('budCategory').value||'').trim(),
    limit_amount: parseFloat(document.getElementById('budLimit').value||0)||0,
    month: (document.getElementById('budMonth').value||'').trim(),
    note: document.getElementById('budNote').value||''
  };
  if (!payload.category) { alert(appLang==='fa'?'دسته را وارد کنید':'Enter category'); return; }
  var res = await fetch(API + '/api/budgets', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  if (!res.ok) { alert('Error'); return; }
  closeModal('budgetModal');
  if (typeof toast==='function') toast(appLang==='fa'?'ذخیره شد':'Saved','success');
  loadBudgets();
  loadPersonalInsights();
}

async function loadBudgets() {
  try {
    var res = await fetch(API + '/api/budgets');
    var rows = await res.json();
    var body = document.getElementById('budgetsBody');
    if (!body) return;
    body.innerHTML = (rows||[]).map(function(r){
      return '<tr><td><button class="btn" style="padding:4px 8px" onclick="deleteBudget('+r.id+')">🗑</button></td>'
        +'<td>'+(r.category||'')+'</td><td>'+fmtMoney(r.limit_amount)+'</td><td>'+(r.month||'')+'</td><td>'+(r.note||'')+'</td></tr>';
    }).join('') || '<tr><td colspan="5" style="text-align:center;opacity:.6">'+(appLang==='fa'?'خالی':'Empty')+'</td></tr>';
  } catch(e){ console.error(e); }
}

async function deleteBudget(id) {
  if (!confirm(appLang==='fa'?'حذف؟':'Delete?')) return;
  await fetch(API+'/api/budgets/'+id,{method:'DELETE'});
  loadBudgets();
}

function openGoalModal(id) {
  editingGoalId = id || null;
  document.getElementById('goalTitle').value = '';
  document.getElementById('goalTarget').value = '0';
  document.getElementById('goalCurrent').value = '0';
  document.getElementById('goalDeadline').value = '';
  document.getElementById('goalNote').value = '';
  document.getElementById('goalModalTitle').textContent = id ? (appLang==='fa'?'ویرایش هدف':'Edit goal') : (appLang==='fa'?'هدف جدید':'New goal');
  if (id && window._goalsCache) {
    var g = window._goalsCache.find(function(x){ return x.id==id; });
    if (g) {
      document.getElementById('goalTitle').value = g.title||'';
      document.getElementById('goalTarget').value = g.target_amount||0;
      document.getElementById('goalCurrent').value = g.current_amount||0;
      document.getElementById('goalDeadline').value = g.deadline||'';
      document.getElementById('goalNote').value = g.note||'';
    }
  }
  var modal = document.getElementById('goalModal');
  if (modal) { modal.style.display=''; modal.classList.add('active'); }
}

async function saveGoal() {
  var payload = {
    title: (document.getElementById('goalTitle').value||'').trim(),
    target_amount: parseFloat(document.getElementById('goalTarget').value||0)||0,
    current_amount: parseFloat(document.getElementById('goalCurrent').value||0)||0,
    deadline: document.getElementById('goalDeadline').value||'',
    note: document.getElementById('goalNote').value||''
  };
  if (!payload.title) { alert(appLang==='fa'?'عنوان را وارد کنید':'Enter title'); return; }
  var isEdit = !!editingGoalId;
  var res = await fetch(API + (isEdit ? '/api/goals/'+editingGoalId : '/api/goals'), {
    method: isEdit ? 'PUT' : 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
  });
  if (!res.ok) { alert('Error'); return; }
  closeModal('goalModal');
  if (typeof toast==='function') toast(appLang==='fa'?'ذخیره شد':'Saved','success');
  loadGoals();
  loadPersonalInsights();
}

async function loadGoals() {
  try {
    var res = await fetch(API + '/api/goals');
    var rows = await res.json();
    window._goalsCache = rows;
    var body = document.getElementById('goalsBody');
    if (!body) return;
    body.innerHTML = (rows||[]).map(function(r){
      var pct = Math.min(100, Number(r.pct||0));
      return '<tr><td><button class="btn btn-secondary" style="padding:4px 8px" onclick="openGoalModal('+r.id+')">✏️</button> '
        +'<button class="btn" style="padding:4px 8px" onclick="deleteGoal('+r.id+')">🗑</button></td>'
        +'<td>'+(r.title||'')+'</td><td>'+fmtMoney(r.target_amount)+'</td><td>'+fmtMoney(r.current_amount)+'</td>'
        +'<td><div class="progress-bar"><span style="width:'+pct+'%"></span></div><small>'+pct+'%</small></td>'
        +'<td>'+(r.deadline||'')+'</td></tr>';
    }).join('') || '<tr><td colspan="6" style="text-align:center;opacity:.6">'+(appLang==='fa'?'خالی':'Empty')+'</td></tr>';
  } catch(e){ console.error(e); }
}

async function deleteGoal(id) {
  if (!confirm(appLang==='fa'?'حذف؟':'Delete?')) return;
  await fetch(API+'/api/goals/'+id,{method:'DELETE'});
  loadGoals();
  loadPersonalInsights();
}

var editingFxTxId = null;
function openFxTxModal(id) {
  try { loadFxCurrencies(); } catch(e){}
  editingFxTxId = id || null;
  var now = new Date();
  document.getElementById('fxDate').value = now.toISOString().slice(0,10);
  document.getElementById('fxKind').value = 'buy';
  document.getElementById('fxCurrency').value = 'USD';
  document.getElementById('fxAmount').value = '0';
  document.getElementById('fxRate').value = '0';
  document.getElementById('fxRial').value = '0';
  document.getElementById('fxTitle').value = '';
  document.getElementById('fxNote').value = '';
  var titleEl = document.querySelector('#fxTxModal .modal-title');
  if (titleEl) titleEl.textContent = id ? (appLang==='fa'?'ویرایش تراکنش':'Edit transaction') : (appLang==='fa'?'ثبت تراکنش ارزی / تومانی':'New FX / Toman transaction');
  if (id && window._fxTxCache) {
    var r = window._fxTxCache.find(function(x){ return Number(x.id)===Number(id); });
    if (r) {
      document.getElementById('fxDate').value = r.date || '';
      document.getElementById('fxKind').value = r.kind || 'buy';
      document.getElementById('fxCurrency').value = r.currency || 'USD';
      document.getElementById('fxAmount').value = r.amount_fx || 0;
      document.getElementById('fxRate').value = r.rate || 0;
      document.getElementById('fxRial').value = r.amount_rial || 0;
      document.getElementById('fxTitle').value = r.title || '';
      document.getElementById('fxNote').value = r.note || '';
    }
  }
  var modal = document.getElementById('fxTxModal');
  if (modal) { modal.style.display=''; modal.classList.add('active'); }
}
function editFxTx(id) { openFxTxModal(id); }


async function saveFxTx() {
  var amountRaw = (document.getElementById('fxAmount').value||'0').toString().trim().replace(/,/g,''); var amount = amountRaw === '' ? 0 : Number(amountRaw);
  var rate = parseFloat(document.getElementById('fxRate').value||0)||0;
  var rial = parseFloat(document.getElementById('fxRial').value||0)||0;
  if (!rial && amount && rate) rial = amount * rate;
  var payload = {
    date: document.getElementById('fxDate').value||'',
    kind: document.getElementById('fxKind').value||'buy',
    currency: (document.getElementById('fxCurrency').value||'USD').toString().trim().toUpperCase(),
    amount_fx: amount,
    rate: rate,
    amount_rial: rial,
    title: (document.getElementById('fxTitle').value||'').trim(),
    note: document.getElementById('fxNote').value||''
  };
  var isEdit = !!editingFxTxId;
  var url = API + (isEdit ? '/api/fx/transactions/'+editingFxTxId : '/api/fx/transactions');
  var res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  if (!res.ok) { alert('Error'); return; }
  editingFxTxId = null;
  closeModal('fxTxModal');
  if (typeof toast==='function') toast(appLang==='fa'?'ذخیره شد':'Saved','success');
  loadFxTx();
  loadFxHoldings();
}

async function loadFxTx() {
  try {
    var res = await fetch(API + '/api/fx/transactions');
    var rows = await res.json();
    window._fxTxCache = rows || [];
    var body = document.getElementById('fxTxBody');
    if (!body) return;
    var kindMap = {buy:'خرید ارز',sell:'فروش ارز',deposit:'واریز',withdraw:'برداشت'};
    body.innerHTML = (rows||[]).map(function(r){
      return '<tr><td style="white-space:nowrap">'
        +'<button type="button" class="btn btn-secondary" style="padding:4px 8px" onclick="editFxTx('+r.id+')" title="ویرایش">✏️</button> '
        +'<button type="button" class="btn" style="padding:4px 8px" onclick="deleteFxTx('+r.id+')" title="حذف">🗑</button></td>'
        +'<td>'+(r.date||'')+'</td><td>'+(kindMap[r.kind]||r.kind)+'</td><td>'+(r.currency||'')+'</td>'
        +'<td>'+fmtFx(r.amount_fx)+'</td><td>'+fmtMoney(r.amount_rial)+'</td>'
        +'<td>'+(r.title||'')+'</td></tr>';
    }).join('') || '<tr><td colspan="7" style="text-align:center;opacity:.6">خالی</td></tr>';
  } catch(e){ console.error(e); }
}

async function deleteFxTx(id) {
  if (!confirm(appLang==='fa'?'حذف؟':'Delete?')) return;
  await fetch(API+'/api/fx/transactions/'+id,{method:'DELETE'});
  loadFxTx();
  loadFxHoldings();
}

async function loadFxHoldings() {
  try {
    var res = await fetch(API + '/api/fx/transactions');
    var rows = await res.json();
    window._fxTxCache = rows || [];
    var body = document.getElementById('fxHoldBody');
    var foot = document.getElementById('fxHoldFoot');
    var sumBox = document.getElementById('fxHoldSummary');
    if (!body) return;
    var kindMap = {buy:'خرید ارز',sell:'فروش ارز',deposit:'واریز',withdraw:'برداشت'};
    if (!(rows||[]).length) {
      body.innerHTML = '<tr><td colspan="7" style="text-align:center;opacity:.6">'+(appLang==='fa'?'خالی — اول تراکنش ثبت کنید':'Empty')+'</td></tr>';
      if (foot) foot.innerHTML = '';
      if (sumBox) sumBox.innerHTML = '';
      return;
    }
    body.innerHTML = rows.map(function(r){
      return '<tr><td style="white-space:nowrap">'
        +'<button type="button" class="btn btn-secondary" style="padding:4px 8px" onclick="editFxTx('+r.id+')" title="ویرایش">✏️</button> '
        +'<button type="button" class="btn" style="padding:4px 8px" onclick="deleteFxTx('+r.id+')" title="حذف">🗑</button></td>'
        +'<td>'+(r.date||'')+'</td><td>'+(kindMap[r.kind]||r.kind)+'</td><td><b>'+(r.currency||'')+'</b></td>'
        +'<td>'+fmtFx(r.amount_fx)+'</td><td>'+fmtMoney(r.amount_rial)+'</td>'
        +'<td>'+(r.title||'')+'</td></tr>';
    }).join('');

    // totals by currency
    var by = {};
    var grandToman = 0;
    rows.forEach(function(t){
      var cur = (t.currency||'—').toString().toUpperCase();
      var k = t.kind || 'buy';
      var af = Number(t.amount_fx||0);
      var ar = Number(t.amount_rial||0);
      if (!by[cur]) by[cur] = {fx:0, toman:0};
      if (k === 'buy' || k === 'deposit') { by[cur].fx += af; by[cur].toman += ar; grandToman += ar; }
      else if (k === 'sell' || k === 'withdraw') { by[cur].fx -= af; by[cur].toman -= ar; grandToman -= ar; }
      else { by[cur].fx += af; by[cur].toman += ar; grandToman += ar; }
    });
    var keys = Object.keys(by).sort();
    if (foot) {
      foot.innerHTML = keys.map(function(cur){
        return '<tr style="background:#f0fdfa;font-weight:800">'
          +'<td colspan="3" style="text-align:left">'+(appLang==='fa'?'جمع ':'Total ')+cur+'</td>'
          +'<td><b>'+cur+'</b></td>'
          +'<td>'+fmtFx(by[cur].fx)+'</td>'
          +'<td>'+fmtMoney(by[cur].toman)+'</td>'
          +'<td></td></tr>';
      }).join('');
    }
    if (sumBox) {
      sumBox.innerHTML = keys.map(function(cur){
        return '<div style="flex:1;min-width:140px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;padding:10px 12px">'
          +'<div style="font-size:11px;opacity:.7">'+(appLang==='fa'?'جمع ':'Total ')+cur+'</div>'
          +'<div style="font-size:16px;font-weight:800;margin-top:4px">'+fmtFx(by[cur].fx)+' <span style="font-size:12px">'+cur+'</span></div>'
          +'<div style="font-size:13px;font-weight:700;color:#0f766e;margin-top:2px">'+fmtMoney(by[cur].toman)+' '+(appLang==='fa'?'تومان':'Toman')+'</div></div>';
      }).join('') + '<div style="flex:1;min-width:160px;background:linear-gradient(135deg,#0d9488,#14b8a6);color:#fff;border-radius:12px;padding:10px 12px">'
          +'<div style="font-size:11px;opacity:.9">'+(appLang==='fa'?'جمع کل':'Grand total')+'</div>'
          +'<div style="font-size:18px;font-weight:900;margin-top:4px">'+fmtMoney(grandToman)+'</div>'
          +'<div style="font-size:12px;opacity:.9">'+(appLang==='fa'?'تومان':'Toman')+'</div></div>';
    }
  } catch(e){ console.error(e); }
}


function enterDepositEnv() {
  try { if (typeof leaveClinicEnv === 'function') leaveClinicEnv(); } catch(e){}
  var env = document.getElementById('depositEnv');
  if (!env) { alert('محیط سپرده‌گذاری پیدا نشد'); return; }
  env.classList.add('active');
  env.setAttribute('aria-hidden','false');
  document.body.classList.add('deposit-mode');
  depositGo('home');
  try { loadFxCurrencies(); } catch(e){}
}
function leaveDepositEnv() {
  try { closeModal('fxTxModal'); } catch(e){}
  try { closeModal('fxCurrencyModal'); } catch(e){}
  document.querySelectorAll('#fxCurrencyModal.active, #fxTxModal.active').forEach(function(m){
    m.classList.remove('active'); m.style.display='none';
  });
  depositShowHomeOnly();
  var env = document.getElementById('depositEnv');
  if (env) { env.classList.remove('active'); env.setAttribute('aria-hidden','true'); }
  document.body.classList.remove('deposit-mode');
}
function depositReturnPages() {
  var panel = document.getElementById('depositPanel');
  var main = document.getElementById('mainScroll') || document.body;
  if (!panel) return;
  panel.querySelectorAll('.page').forEach(function(p){
    p.style.display='none'; p.classList.remove('active'); main.appendChild(p);
  });
  panel.classList.remove('active');
  panel.innerHTML = '';
}
function depositGo(section) {
  var home = document.getElementById('depositHome');
  var panel = document.getElementById('depositPanel');
  if (!panel) return;
  depositReturnPages();
  if (section === 'home') {
    depositShowHomeOnly();
    return;
  }
  if (section === 'fx-new') {
    if (home) home.style.display = '';
    openFxTxModal();
    return;
  }
  if (home) home.style.display = 'none';
  var pageId = null;
  if (section === 'fx-tx') pageId = 'page-fx-tx';
  if (section === 'fx-hold') pageId = 'page-fx-holdings';
  if (section === 'fx-cur') pageId = 'page-fx-currencies';
  if (!pageId) { if (home) home.style.display=''; return; }
  var page = document.getElementById(pageId);
  if (!page) { if (home) home.style.display=''; return; }
  page.style.display = 'block';
  page.classList.add('active');
  var closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'de-panel-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = function(){ depositShowHomeOnly(); };
  panel.style.display = 'block';
  panel.appendChild(page);
  panel.appendChild(closeBtn);
  panel.classList.add('active');
  // keep header + button from colliding with X
  var hdr = page.querySelector('.page-header');
  if (hdr) hdr.style.paddingLeft = '48px';
  if (section === 'fx-tx') loadFxTx();
  if (section === 'fx-hold') loadFxHoldings();
  if (section === 'fx-cur') loadFxCurrencies();
}

window.enterDepositEnv = enterDepositEnv;
window.leaveDepositEnv = leaveDepositEnv;
window.depositGo = depositGo;
window.depositShowHomeOnly = depositShowHomeOnly;
window.openBudgetModal = openBudgetModal;
window.saveBudget = saveBudget;
window.loadBudgets = loadBudgets;
window.deleteBudget = deleteBudget;
window.openGoalModal = openGoalModal;
window.saveGoal = saveGoal;
window.loadGoals = loadGoals;
window.deleteGoal = deleteGoal;
window.openFxTxModal = openFxTxModal;
window.saveFxTx = saveFxTx;
window.loadFxTx = loadFxTx;
window.deleteFxTx = deleteFxTx;
window.loadFxHoldings = loadFxHoldings;
window.loadPersonalInsights = loadPersonalInsights;



async function loadFxCurrencies() {
  try {
    var res = await fetch(API + '/api/fx/currencies');
    var rows = await res.json();
    window._fxCurrencies = rows || [];
    var body = document.getElementById('fxCurBody');
    if (body) {
      body.innerHTML = (rows||[]).map(function(r){
        return '<tr><td style="white-space:nowrap">'
          +'<button type="button" class="btn btn-secondary" style="padding:4px 8px" onclick="editFxCurrency('+r.id+')" title="ویرایش">✏️</button> '
          +'<button type="button" class="btn" style="padding:4px 8px" onclick="deleteFxCurrency('+r.id+')" title="حذف">🗑</button></td>'
          +'<td>'+(r.code||'')+'</td><td>'+(r.name||'')+'</td><td>'+(r.note||'')+'</td></tr>';
      }).join('') || '<tr><td colspan="4" style="text-align:center;opacity:.6">'+(appLang==='fa'?'هنوز ارزی اضافه نشده':'No custom currencies')+'</td></tr>';
    }
    var dl = document.getElementById('fxCurrencyList');
    if (dl) {
      var defaults = ['USD','EUR','GBP','TRY','AED','CNY','IRR','USDT'];
      var codes = defaults.slice();
      (rows||[]).forEach(function(r){ if (r.code && codes.indexOf(r.code)<0) codes.push(r.code); });
      dl.innerHTML = codes.map(function(c){ return '<option value="'+c+'">'; }).join('');
    }
  } catch(e){ console.error(e); }
}
var editingFxCurId = null;
function openFxCurrencyModal(id) {
  editingFxCurId = id || null;
  document.getElementById('fxCurCode').value = '';
  document.getElementById('fxCurName').value = '';
  document.getElementById('fxCurNote').value = '';
  var titleEl = document.querySelector('#fxCurrencyModal .modal-title');
  if (titleEl) titleEl.textContent = id ? (appLang==='fa'?'ویرایش ارز':'Edit currency') : (appLang==='fa'?'ارز جدید':'New currency');
  if (id && window._fxCurrencies) {
    var r = window._fxCurrencies.find(function(x){ return Number(x.id)===Number(id); });
    if (r) {
      document.getElementById('fxCurCode').value = r.code || '';
      document.getElementById('fxCurName').value = r.name || '';
      document.getElementById('fxCurNote').value = r.note || '';
    }
  }
  var m = document.getElementById('fxCurrencyModal');
  if (m) { m.style.display=''; m.classList.add('active'); }
}
function editFxCurrency(id) { openFxCurrencyModal(id); }
async function saveFxCurrency() {
  var code = (document.getElementById('fxCurCode').value||'').trim().toUpperCase();
  if (!code) { alert(appLang==='fa'?'کد ارز را وارد کنید':'Enter currency code'); return; }
  var payload = { code: code, name: document.getElementById('fxCurName').value||'', note: document.getElementById('fxCurNote').value||'' };
  var isEdit = !!editingFxCurId;
  var url = API + (isEdit ? '/api/fx/currencies/'+editingFxCurId : '/api/fx/currencies');
  var res = await fetch(url,{method: isEdit ? 'PUT' : 'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  if (!res.ok) { alert('Error'); return; }
  editingFxCurId = null;
  closeModal('fxCurrencyModal');
  if (typeof toast==='function') toast(appLang==='fa'?'ذخیره شد':'Saved','success');
  loadFxCurrencies();
}
async function deleteFxCurrency(id) {
  if (!confirm(appLang==='fa'?'حذف؟':'Delete?')) return;
  await fetch(API+'/api/fx/currencies/'+id,{method:'DELETE'});
  loadFxCurrencies();
}

window.loadFxCurrencies=loadFxCurrencies;window.openFxCurrencyModal=openFxCurrencyModal;window.editFxCurrency=editFxCurrency;window.saveFxCurrency=saveFxCurrency;window.deleteFxCurrency=deleteFxCurrency;window.editFxTx=editFxTx;

function filterDashTable(){
  var q = ((document.getElementById('dashSearch')||{}).value||'').trim().toLowerCase();
  var rows = document.querySelectorAll('#dashboardTable tr');
  rows.forEach(function(tr){
    if(!q){ tr.style.display=''; return; }
    tr.style.display = (tr.textContent||'').toLowerCase().indexOf(q)>=0 ? '' : 'none';
  });
}

function mhSwitchTab(btn, id){
  document.querySelectorAll('.mh-tab').forEach(function(t){ t.classList.remove('active'); });
  document.querySelectorAll('.mh-panel').forEach(function(p){ p.classList.remove('active'); });
  if(btn) btn.classList.add('active');
  var panel = document.getElementById('mh-' + id);
  if(panel) panel.classList.add('active');
}

function mhShow(group){
  document.querySelectorAll('.mk-tab').forEach(function(t){ t.classList.remove('active'); });
  if(window.event && window.event.target && window.event.target.classList.contains('mk-tab')) {
    window.event.target.classList.add('active');
  }
  var icons = document.querySelectorAll('#mkIconGrid .mk-icon');
  icons.forEach(function(ic){
    if(!group || group==='all'){ ic.style.display=''; return; }
    ic.style.display = (ic.getAttribute('data-g')===group) ? '' : 'none';
  });
}
function mkUpdateClock(){
  try{
    var now = new Date();
    var el = document.getElementById('mkDateLine');
    if(el){
      var days=['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'];
      el.innerHTML = days[now.getDay()] + '<br>' + now.toLocaleTimeString('fa-IR');
    }
    var u = document.getElementById('mkRealUser');
    if(u && typeof currentUsername!=='undefined') u.textContent = currentUsername || 'root';
  }catch(e){}
}
setInterval(mkUpdateClock, 1000);



function mkWinBackdropSync(){
  var bd = null && document.getElementById('mkWinBackdrop');
  if (!bd) return;
  // Never cover MDI windows — that freezes the UI
  var hasMdi = !!document.querySelector('.mdi-window');
  var any = document.querySelector('.modal.active:not(.mk-min):not(.mdi-parent-suspended)');
  if (hasMdi) {
    bd.classList.remove('on');
    bd.style.pointerEvents = 'none';
    return;
  }
  bd.classList.toggle('on', !!any);
  document.body.classList.toggle('mk-modal-dim', !!any && !hasMdi);
}

function mkSet(el, prop, val){
  try { el.style.setProperty(prop, val, 'important'); } catch(e) { el.style[prop] = val; }
}
function mkNextZ(){
  // Dialogs must always stack above MDI layer (~4000) and each other.
  var base = 90000;
  var cur = window.mdiZ || base;
  if (cur < base) cur = base;
  window.mdiZ = cur + 1;
  return window.mdiZ;
}
function mkWinCenter(m){
  if (!m) return;
  mkSet(m, 'position', 'fixed');
  mkSet(m, 'right', 'auto');
  mkSet(m, 'bottom', 'auto');
  mkSet(m, 'transform', 'none');
  mkSet(m, 'inset', 'auto');
  var w = m.classList.contains('wide') || m.classList.contains('mk-invoice') ? Math.min(860, window.innerWidth * 0.94) : Math.min(640, window.innerWidth * 0.94);
  mkSet(m, 'width', w + 'px');
  mkSet(m, 'max-width', '94vw');
  mkSet(m, 'height', 'auto');
  var h = Math.min(m.offsetHeight || 420, window.innerHeight * 0.86);
  var left = Math.max(8, Math.round((window.innerWidth - w) / 2));
  var top = Math.max(8, Math.round((window.innerHeight - h) / 2));
  mkSet(m, 'left', left + 'px');
  mkSet(m, 'top', top + 'px');
  mkSet(m, 'z-index', String(mkNextZ()));
}

function mkWinEnsureChrome(m){
  var head = m.querySelector('.mk-inv-head, .modal-header');
  if (!head) {
    head = document.createElement('div');
    head.className = 'modal-header mk-inv-head';
    var t = document.createElement('span');
    t.className = 'mk-inv-title';
    t.textContent = m.id || '';
    head.appendChild(t);
    m.insertBefore(head, m.firstChild);
  }
  if (head.querySelector('.mk-win-controls')) return;
  var ctrls = document.createElement('div');
  ctrls.className = 'mk-win-controls';
  ctrls.innerHTML = '<button type="button" class="mk-win-btn close" title="بستن" onclick="mkWinClose(this)">✕</button>'
    + '<button type="button" class="mk-win-btn" title="تمام‌صفحه" onclick="mkWinMax(this)">☐</button>'
    + '<button type="button" class="mk-win-btn" title="کوچک کردن" onclick="mkWinMin(this)">─</button>';
  head.insertBefore(ctrls, head.firstChild);
}


function mkAddResizeHandles(modal){
  if (!modal) return;
  // Always refresh handles so re-opened windows stay resizable
  modal.querySelectorAll('.mk-rh').forEach(function(x){ try{x.remove();}catch(e){} });
  modal.dataset.mkResize = '1';
  modal.style.position = 'fixed';
  modal.style.overflow = 'visible';
  ['n','s','e','w','ne','nw','se','sw'].forEach(function(dir){
    var h = document.createElement('div');
    h.className = 'mk-rh mk-rh-' + dir;
    h.dataset.dir = dir;
    h.title = 'تغییر اندازه';
    modal.appendChild(h);
    h.addEventListener('mousedown', function(e){
      if (modal.classList.contains('mk-max') || modal.classList.contains('mk-min')) return;
      e.preventDefault(); e.stopPropagation();
      modal.classList.add('mk-dragging');
      var startX = e.clientX, startY = e.clientY;
      var r = modal.getBoundingClientRect();
      var startL = r.left, startT = r.top, startW = r.width, startH = r.height;
      function move(ev){
        var dx = ev.clientX - startX, dy = ev.clientY - startY;
        var l = startL, t = startT, w = startW, hgt = startH;
        if (dir.indexOf('e') >= 0) w = Math.max(420, startW + dx);
        if (dir.indexOf('s') >= 0) hgt = Math.max(280, startH + dy);
        if (dir.indexOf('w') >= 0) { w = Math.max(420, startW - dx); l = startL + (startW - w); }
        if (dir.indexOf('n') >= 0) { hgt = Math.max(280, startH - dy); t = startT + (startH - hgt); }
        // clamp to viewport
        if (l < 0) { w += l; l = 0; }
        if (t < 0) { hgt += t; t = 0; }
        if (l + w > window.innerWidth) w = window.innerWidth - l - 4;
        if (t + hgt > window.innerHeight) hgt = window.innerHeight - t - 4;
        modal.style.setProperty('left', Math.round(l) + 'px', 'important');
        modal.style.setProperty('top', Math.round(t) + 'px', 'important');
        modal.style.setProperty('width', Math.round(w) + 'px', 'important');
        modal.style.setProperty('height', Math.round(hgt) + 'px', 'important');
        modal.style.setProperty('max-width', 'none', 'important');
        modal.style.setProperty('max-height', 'none', 'important');
        modal.style.setProperty('min-width', '420px', 'important');
        modal.style.setProperty('min-height', '280px', 'important');
        modal.style.setProperty('transform', 'none', 'important');
        modal.style.setProperty('inset', 'auto', 'important');
      }
      function up(){
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
        modal.classList.remove('mk-dragging');
      }
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    });
  });
}

function mkWinEnable(m){
  if (!m) return;
  try { if (m.parentElement !== document.body) document.body.appendChild(m); } catch(e) {}
  mkWinEnsureChrome(m);
  m.classList.remove('mk-min','mk-max','mk-dragging');
  mkWinCenter(m);
  mkMakeDraggable(m);
  mkAddResizeHandles(m);
  mkSet(m, 'z-index', String(mkNextZ()));
  m.classList.remove('mk-win-anim');
  void m.offsetWidth;
  m.classList.add('mk-win-anim');
  setTimeout(function(){ try{ m.classList.remove('mk-win-anim'); }catch(e){} }, 280);
  mkWinBackdropSync();
}

function mkWinMin(btn){
  var m = btn && btn.closest ? btn.closest('.modal') : null;
  if (!m) return;
  if (m.classList.contains('mk-min')) {
    m.classList.remove('mk-min');
    mkWinCenter(m);
    mkWinBackdropSync();
    return;
  }
  m.classList.add('mk-min');
  m.classList.remove('mk-max');
  mkSet(m, 'left', '12px');
  mkSet(m, 'top', (window.innerHeight - 42) + 'px');
  mkSet(m, 'width', '260px');
  mkSet(m, 'height', '30px');
  mkWinBackdropSync();
}

function mkWinMax(btn){
  var m = btn && btn.closest ? btn.closest('.modal') : null;
  if (!m) return;
  if (m.classList.contains('mk-max')) {
    m.classList.remove('mk-max');
    mkWinCenter(m);
    return;
  }
  m.classList.remove('mk-min');
  m.classList.add('mk-max');
  mkSet(m, 'left', '8px');
  mkSet(m, 'top', '8px');
  mkSet(m, 'width', (window.innerWidth - 16) + 'px');
  mkSet(m, 'height', (window.innerHeight - 16) + 'px');
  mkSet(m, 'transform', 'none');
}

function mkWinClose(btn){
  var m = btn && btn.closest ? btn.closest('.modal') : null;
  if (!m) return;
  m.classList.remove('active','mk-min','mk-max');
  if (typeof closeModal === 'function') {
    try { closeModal(m.id); } catch(e) {}
  }
  mkWinBackdropSync();
}

function mkMakeDraggable(modal){
  if (!modal) return;
  var head = modal.querySelector('.mk-inv-head, .modal-header');
  if (!head) return;
  if (head.dataset.mkDragBound === '1') return;
  head.dataset.mkDragBound = '1';
  head.addEventListener('mousedown', function(e){
    if (e.button !== 0) return;
    if (e.target.closest && e.target.closest('.mk-win-btn, button, input, select, textarea, a')) return;
    if (modal.classList.contains('mk-max') || modal.classList.contains('mk-min')) return;
    e.preventDefault();
    modal.classList.add('mk-dragging');
    modal.classList.remove('mk-win-anim');
    var r = modal.getBoundingClientRect();
    mkSet(modal, 'transform', 'none');
    mkSet(modal, 'left', r.left + 'px');
    mkSet(modal, 'top', r.top + 'px');
    var startX = e.clientX, startY = e.clientY, origL = r.left, origT = r.top;
    function move(ev){
      mkSet(modal, 'left', (origL + ev.clientX - startX) + 'px');
      mkSet(modal, 'top', (origT + ev.clientY - startY) + 'px');
    }
    function up(){
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      modal.classList.remove('mk-dragging');
    }
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  });
}

function mkWinWatchAll(){
  document.querySelectorAll('.modal').forEach(function(m){
    if (m.dataset.mkWatched === '1') return;
    m.dataset.mkWatched = '1';
    var obs = new MutationObserver(function(){
      if (m.classList.contains('active')) {
        if (m.dataset.mkWinReady !== '1') {
          m.dataset.mkWinReady = '1';
          mkWinEnable(m);
        }
      } else {
        m.dataset.mkWinReady = '';
        mkWinBackdropSync();
      }
    });
    obs.observe(m, { attributes: true, attributeFilter: ['class'] });
    if (m.classList.contains('active')) mkWinEnable(m);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mkWinWatchAll);
} else {
  mkWinWatchAll();
}
setTimeout(mkWinWatchAll, 500);


document.addEventListener('mousedown', function(e){
  var m = e.target && e.target.closest && e.target.closest('.modal.active');
  if (!m) return;
  try { m.style.setProperty('z-index', String(mkNextZ()), 'important'); } catch(err) {}
}, true);


function mkEnhanceDateInputs(){
  document.querySelectorAll('input[type="date"]').forEach(function(inp){
    if (inp.dataset.faDate === '1') return;
    inp.dataset.faDate = '1';
    var hint = document.createElement('span');
    hint.className = 'mk-fa-date';
    hint.style.cssText = 'display:inline-block;margin:0 6px;font-size:12px;color:#ff0;font-weight:700;min-width:90px';
    function sync(){
      try {
        if (inp.value && typeof toJalali === 'function') hint.textContent = toJalali(inp.value);
        else hint.textContent = '';
      } catch(e) { hint.textContent = ''; }
    }
    inp.addEventListener('change', sync);
    inp.addEventListener('input', sync);
    if (inp.parentNode) {
      if (inp.nextSibling) inp.parentNode.insertBefore(hint, inp.nextSibling);
      else inp.parentNode.appendChild(hint);
    }
    sync();
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mkEnhanceDateInputs);
else setTimeout(mkEnhanceDateInputs, 300);
// only scan occasionally when new modals appear — avoid layout jump
var _faDateObs = null;
try {
  var _faDateT = null;
  _faDateObs = new MutationObserver(function(){
    if (_faDateT) clearTimeout(_faDateT);
    _faDateT = setTimeout(function(){ try{ mkEnhanceDateInputs(); }catch(e){} }, 400);
  });
  _faDateObs.observe(document.body, { childList:true, subtree:false });
} catch(e) {}


(function(){
  // no periodic forceResize — caused page jump
  function forceResizeAll(){
    document.querySelectorAll('.modal.active').forEach(function(m){
      try { if (typeof mkAddResizeHandles === 'function') mkAddResizeHandles(m); } catch(e) {}
    });
  }
  document.addEventListener('DOMContentLoaded', forceResizeAll);
})();


/** Floating invoice window: content stays in place; resize = exact MDI code from checks */
function openInvoiceFloating(modalId) {
  var m = document.getElementById(modalId);
  if (!m) { console.error('modal missing', modalId); return; }
  try { document.body.appendChild(m); } catch(e){}
  document.querySelectorAll('.mdi-window[data-page="'+modalId+'"]').forEach(function(w){ try{w.remove();}catch(e){} });
  // remove ANY resize handles (blue strip source)
  m.querySelectorAll('.resize-handle').forEach(function(h){ try{h.remove();}catch(e){} });
  m.classList.add('active');
  m.classList.remove('mk-min','mk-max','mk-dragging','mk-in-mdi','mk-closing','inv-anim-out');
  var w = Math.min(820, window.innerWidth - 48);
  var h = Math.min(580, window.innerHeight - 48);
  m.style.setProperty('display', 'flex', 'important');
  m.style.setProperty('visibility', 'visible', 'important');
  m.style.setProperty('position', 'fixed', 'important');
  m.style.setProperty('z-index', '99999', 'important');
  m.style.setProperty('inset', 'auto', 'important');
  m.style.setProperty('right', 'auto', 'important');
  m.style.setProperty('bottom', 'auto', 'important');
  m.style.setProperty('flex-direction', 'column', 'important');
  /* opacity/transform left free for open animation */
  m.style.setProperty('background', '#4a7ab0', 'important');
  m.style.setProperty('border', '2px solid #2a5080', 'important');
  m.style.setProperty('box-shadow', '6px 8px 24px rgba(0,0,0,.4)', 'important');
  m.style.setProperty('overflow', 'hidden', 'important');
  m.style.setProperty('padding', '0', 'important');
  m.style.setProperty('width', w+'px', 'important');
  m.style.setProperty('height', h+'px', 'important');
  m.style.setProperty('left', Math.max(16,(window.innerWidth-w)/2)+'px', 'important');
  m.style.setProperty('top', Math.max(16,(window.innerHeight-h)/2)+'px', 'important');
  m.querySelectorAll('input,select,textarea').forEach(function(el){
    el.style.setProperty('color', '#102a44', 'important');
    el.style.setProperty('background', '#fff', 'important');
    el.style.setProperty('-webkit-text-fill-color', '#102a44', 'important');
  });
  var ps = m.querySelector('#purchasePayStatus');
  if (ps) {
    ps.innerHTML = '<option value="paid">پرداخت‌شده</option><option value="partial">جزئی</option><option value="unpaid">بدهکار</option>';
    ps.value = 'paid';
    ps.style.setProperty('color', '#102a44', 'important');
    ps.style.setProperty('background', '#fff', 'important');
    ps.style.setProperty('-webkit-text-fill-color', '#102a44', 'important');
  }
  // drag only
  var head = m.querySelector('.mk-inv-head, .modal-header');
  if (head && head.dataset.invDragBound !== '1') {
    head.dataset.invDragBound = '1';
    head.style.cursor = 'move';
    head.addEventListener('mousedown', function(e){
      if (e.button !== 0) return;
      if (e.target.closest && e.target.closest('button,input,select,a')) return;
      e.preventDefault();
      var sx=e.clientX, sy=e.clientY, ol=m.offsetLeft, ot=m.offsetTop;
      function mv(ev){
        m.style.setProperty('left', (ol+ev.clientX-sx)+'px', 'important');
        m.style.setProperty('top', (ot+ev.clientY-sy)+'px', 'important');
      }
      function up(){ document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up); }
      document.addEventListener('mousemove',mv); document.addEventListener('mouseup',up);
    });
  }
  try{playUiSound('open');}catch(e){}
}



window.openInvoiceFloating = openInvoiceFloating;

window.openNewPurchase = openNewPurchase;

document.addEventListener('keydown', function(e){
  if (e.key!=='Escape' && e.keyCode!==27) return;
  var ids = ['newPurchaseModal','newSaleModal','checkModal','productModal','contactModal'];
  for (var i=0;i<ids.length;i++){
    var m=document.getElementById(ids[i]);
    if (m && m.classList.contains('active')) {
      e.preventDefault(); e.stopPropagation();
      if (typeof animateCloseModal === 'function') animateCloseModal(m);
      else { m.classList.remove('active'); m.style.display='none'; }
      try{playUiSound('close');}catch(err){}
      return;
    }
  }
}, true);



(function mahakExtras(){
  var MAGIC_ITEMS = [
    {q:'فاکتور خرید f2 خرید', label:'فاکتور خرید (F2)', run:function(){ openNewPurchase(); }},
    {q:'فاکتور فروش f3 فروش', label:'فاکتور فروش (F3)', run:function(){ openNewSale(); }},
    {q:'لیست خرید f1', label:'لیست خرید (F1)', run:function(){ navigateTo('purchases'); }},
    {q:'لیست فروش f4', label:'لیست فروش (F4)', run:function(){ navigateTo('sales'); }},
    {q:'کالا f5', label:'کالا (F5)', run:function(){ navigateTo('products'); }},
    {q:'اشخاص f6', label:'اشخاص (F6)', run:function(){ navigateTo('sellers'); }},
    {q:'چک', label:'مدیریت چک‌ها', run:function(){ navigateTo('checks-page'); }},
    {q:'تنظیمات f11', label:'تنظیمات', run:function(){ navigateTo('settings'); }},
    {q:'خانه', label:'خانه / میزکار', run:function(){ navigateTo('home'); }},
  ];
  var idx = 0, filtered = MAGIC_ITEMS.slice();
  function openMagic(){
    var box = document.getElementById('mahakMagicBox');
    var inp = document.getElementById('mbInput');
    if (!box || !inp) return;
    box.classList.add('open');
    box.style.display = 'block';
    inp.value = '';
    renderMagic('');
    setTimeout(function(){ try{inp.focus();}catch(e){} }, 20);
  }
  function closeMagic(){
    var box = document.getElementById('mahakMagicBox');
    if (box) { box.classList.remove('open'); box.style.display = 'none'; }
  }
  function renderMagic(q){
    q = (q||'').trim().toLowerCase();
    var list = document.getElementById('mbList');
    if (!list) return;
    filtered = MAGIC_ITEMS.filter(function(it){
      return !q || it.q.indexOf(q)>=0 || it.label.indexOf(q)>=0;
    });
    idx = 0;
    list.innerHTML = filtered.map(function(it,i){
      return '<div class="mb-item'+(i===0?' active':'')+'" data-i="'+i+'">'+it.label+'</div>';
    }).join('') || '<div class="mb-item">موردی یافت نشد</div>';
    list.querySelectorAll('.mb-item[data-i]').forEach(function(el){
      el.onclick = function(){
        var i = +el.getAttribute('data-i');
        if (filtered[i]) { closeMagic(); try{filtered[i].run();}catch(err){console.error(err);} }
      };
    });
  }
  document.addEventListener('keydown', function(e){
    // Ctrl+Space or Ctrl+K
    if ((e.ctrlKey || e.metaKey) && (e.code==='Space' || e.key===' ' || e.key==='k' || e.key==='K')) {
      e.preventDefault();
      e.stopPropagation();
      openMagic();
      return;
    }
    var box = document.getElementById('mahakMagicBox');
    if (!box || !box.classList.contains('open')) return;
    if (e.key==='Escape') { e.preventDefault(); closeMagic(); return; }
    if (e.key==='ArrowDown') {
      e.preventDefault();
      idx = Math.min(idx+1, filtered.length-1);
      box.querySelectorAll('.mb-item').forEach(function(el,i){ el.classList.toggle('active', i===idx); });
      return;
    }
    if (e.key==='ArrowUp') {
      e.preventDefault();
      idx = Math.max(idx-1, 0);
      box.querySelectorAll('.mb-item').forEach(function(el,i){ el.classList.toggle('active', i===idx); });
      return;
    }
    if (e.key==='Enter') {
      e.preventDefault();
      if (filtered[idx]) { closeMagic(); try{filtered[idx].run();}catch(err){console.error(err);} }
    }
  }, true);
  document.addEventListener('input', function(e){
    if (e.target && e.target.id==='mbInput') renderMagic(e.target.value);
  });
  // click status bar hint to open
  document.addEventListener('click', function(e){
    var t = e.target;
    if (t && (t.id==='sbMagicHint' || (t.closest && t.closest('#sbMagicHint')))) openMagic();
  });
  window.openMahakMagic = openMagic;
  window.closeMahakMagic = closeMagic;
  function tick(){
    var c=document.getElementById('sbClock');
    if(c){ var d=new Date(); c.textContent=d.toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'}); }
  }
  setInterval(tick, 15000); tick();
})();

window.openNewPurchase=openNewPurchase;
window.openInvoiceFloating=openInvoiceFloating;


function animateCloseModal(m) {
  if (!m) return;
  m.classList.add('inv-anim-out', 'mk-closing');
  m.classList.remove('inv-anim-in');
  setTimeout(function(){
    m.classList.remove('active', 'mk-closing', 'inv-anim-out');
    m.style.display = 'none';
  }, 160);
}

// Animate open for any .modal when class active is added
(function(){
  var _origClose = window.closeModal;
  if (typeof _origClose === 'function') {
    window.closeModal = function(id) {
      var ids = id ? [id] : ['newPurchaseModal','newSaleModal','checkModal','productModal','contactModal','admissionModal','nurseModal','doctorModal'];
      var animated = false;
      ids.forEach(function(mid){
        var el = document.getElementById(mid);
        if (el && el.classList.contains('active')) {
          animated = true;
          animateCloseModal(el);
        }
      });
      if (!animated) try { _origClose.apply(this, arguments); } catch(e){}
    };
  }
})();


// Drop will-change after open to free GPU layers
document.addEventListener('animationend', function(e){
  var t = e.target;
  if (!t || !t.classList) return;
  if (t.classList.contains('modal') || t.classList.contains('mdi-window')) {
    t.style.willChange = 'auto';
  }
}, true);


(function mahakOfficialClock(){
  function tick(){
    var now = new Date();
    var h = now.getHours() % 12;
    var m = now.getMinutes();
    var s = now.getSeconds();
    var elH = document.getElementById('mkHandH');
    var elM = document.getElementById('mkHandM');
    var elS = document.getElementById('mkHandS');
    if (elH) elH.style.transform = 'rotate(' + ((h + m/60) * 30) + 'deg)';
    if (elM) elM.style.transform = 'rotate(' + ((m + s/60) * 6) + 'deg)';
    if (elS) elS.style.transform = 'rotate(' + (s * 6) + 'deg)';
    // ONE digital block: weekday+date on first line, time on second
    var one = document.getElementById('mkClockOne');
    if (one) {
      var timeStr = now.toLocaleTimeString('fa-IR', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
      var dateStr = '';
      try {
        dateStr = now.toLocaleDateString('fa-IR', {weekday:'long', day:'numeric', month:'long'});
      } catch(e) {
        dateStr = now.toLocaleDateString('fa-IR');
      }
      var txt = dateStr + '\n' + timeStr;
      if (one.textContent !== txt) one.textContent = txt;
    }
  }
  setInterval(tick, 1000);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick);
  else tick();
})();


function resetPurchaseForm() {
  try {
    editingId = null;
    var el;
    el=document.getElementById('purchaseDate'); if(el) el.value=new Date().toISOString().split('T')[0];
    el=document.getElementById('purchaseSeller'); if(el) el.value='';
    el=document.getElementById('purchaseLocation'); if(el) el.value='';
    el=document.getElementById('purchaseNotes'); if(el) el.value='';
    el=document.getElementById('purchaseDiscount'); if(el) el.value='0';
    el=document.getElementById('purchasePayStatus'); if(el) { el.value='paid'; el.style.color='#102a44'; el.style.background='#fff'; }
    el=document.getElementById('purchasePaidAmount'); if(el) el.value='0';
    itemRows = [];
    var body = document.getElementById('itemsBody');
    if (body) body.innerHTML = '';
    if (typeof addItemRow==='function'){ addItemRow(); addItemRow(); }
    if (typeof calcTotal==='function') calcTotal();
  } catch(e){ console.error(e); }
}

function resetSaleForm() {
  try {
    if (typeof openNewSale === 'function') {
      // fill without destroying window
      var m = document.getElementById('newSaleModal');
      if (m && m.classList.contains('active')) {
        var el;
        el=document.getElementById('saleDate'); if(el) el.value=new Date().toISOString().split('T')[0];
        el=document.getElementById('saleCustomer'); if(el) el.value='';
        el=document.getElementById('saleNotes'); if(el) el.value='';
        el=document.getElementById('saleDiscount'); if(el) el.value='0';
        el=document.getElementById('salePaidAmount'); if(el) el.value='0';
        var sb = document.getElementById('saleItemsBody') || document.getElementById('itemsBodySale');
        if (sb) sb.innerHTML = '';
        if (typeof addSaleItemRow==='function'){ addSaleItemRow(); addSaleItemRow(); }
        else if (typeof addItemRow==='function'){ /* skip */ }
        return;
      }
    }
    openNewSale();
  } catch(e){ console.error(e); openNewSale(); }
}
window.resetPurchaseForm = resetPurchaseForm;
window.resetSaleForm = resetSaleForm;


function mkTabClick(btn, action) {
  try {
    action = action || (btn && btn.getAttribute && btn.getAttribute('data-tab')) || '';
    document.querySelectorAll('#mkTabsBar .mk-tab').forEach(function(t){ t.classList.remove('active'); });
    if (btn && btn.classList) btn.classList.add('active');

    if (action === 'settings') {
      if (typeof navigateTo === 'function') navigateTo('settings');
      return;
    }
    if (action === 'clinic') {
      if (typeof enterClinicEnv === 'function') enterClinicEnv();
      return;
    }
    if (action === 'help') {
      alert('کلیدهای میانبر:\\nF1 لیست خرید  F2 فاکتور خرید  F3 فاکتور فروش  F4 لیست فروش\\nF5 کالا  F6 اشخاص  F7 بانک  F8 گروه\\nF9 پشتیبان  F11 تنظیمات  F12 دیتابیس\\nCtrl+Space جعبه جادویی');
      return;
    }

    // home / base / ops / rep / tools → show dashboard + filter icons
    try {
      document.querySelectorAll('.mdi-window').forEach(function(w){
        try {
          var pid = w.getAttribute('data-page');
          var pageEl = document.getElementById('page-' + pid) || document.getElementById(pid);
          var scroll = document.getElementById('mainScroll');
          if (pageEl && scroll) {
            pageEl.classList.remove('active');
            pageEl.style.display = 'none';
            scroll.appendChild(pageEl);
          }
          w.remove();
        } catch(e){}
      });
    } catch(e){}

    var dash = document.getElementById('page-dashboard');
    if (dash) {
      document.querySelectorAll('.page').forEach(function(p){
        p.classList.remove('active');
        if (p.id !== 'page-dashboard') p.style.display = 'none';
      });
      dash.classList.add('active');
      dash.style.display = '';
    }

    var group = (action === 'home' || !action) ? 'all' : action;
    document.querySelectorAll('#mkIconGrid .mk-icon').forEach(function(ic){
      var g = ic.getAttribute('data-g') || 'ops';
      if (group === 'all') ic.style.display = '';
      else ic.style.display = (g === group) ? '' : 'none';
    });
  } catch (e) {
    console.error('mkTabClick', e);
  }
}
window.mkTabClick = mkTabClick;

window.mkTabClick = mkTabClick;


// harden mhShow without window.event
function mhShow(group){
  var icons = document.querySelectorAll('#mkIconGrid .mk-icon');
  icons.forEach(function(ic){
    if (!group || group === 'all') { ic.style.display = ''; return; }
    ic.style.display = (ic.getAttribute('data-g') === group) ? '' : 'none';
  });
}
window.mhShow = mhShow;


// Event delegation — tabs always work even if inline onclick fails
document.addEventListener('click', function(e) {
  var tab = e.target && e.target.closest && e.target.closest('#mkTabsBar .mk-tab, .mk-tabs .mk-tab');
  if (!tab) return;
  e.preventDefault();
  e.stopPropagation();
  var action = tab.getAttribute('data-tab') || '';
  if (typeof window.mkTabClick === 'function') {
    window.mkTabClick(tab, action);
  } else if (typeof mkTabClick === 'function') {
    mkTabClick(tab, action);
  } else {
    console.error('mkTabClick missing');
  }
}, true);

// Invoice open animation (bulletproof)
(function(){
  function animateInvoice(m) {
    if (!m) return;
    m.style.removeProperty('opacity');
    m.style.removeProperty('transform');
    m.style.removeProperty('animation');
    m.classList.remove('inv-show', 'inv-anim-in', 'inv-anim-out');
    // start state
    m.style.opacity = '0';
    m.style.transform = 'translateY(20px) scale(0.92)';
    m.style.transition = 'none';
    void m.offsetWidth;
    // animate
    m.style.transition = 'opacity 0.25s cubic-bezier(0.2,0.85,0.2,1), transform 0.25s cubic-bezier(0.2,0.85,0.2,1)';
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        m.style.opacity = '1';
        m.style.transform = 'translateY(0) scale(1)';
        m.classList.add('inv-show');
      });
    });
    setTimeout(function(){
      m.style.transition = '';
      m.style.transform = 'none';
      m.style.opacity = '1';
    }, 280);
  }
  var _open = window.openInvoiceFloating;
  if (typeof _open !== 'function') return;
  window.openInvoiceFloating = function(modalId) {
    _open.apply(this, arguments);
    var m = document.getElementById(modalId);
    if (!m) return;
    animateInvoice(m);
  };
  // also hook openNewPurchase/openNewSale if they bypass
  ['openNewPurchase','openNewSale'].forEach(function(name){
    var fn = window[name];
    if (typeof fn !== 'function') return;
    window[name] = function(){
      var r = fn.apply(this, arguments);
      setTimeout(function(){
        var id = name.indexOf('Sale')>=0 ? 'newSaleModal' : 'newPurchaseModal';
        var m = document.getElementById(id);
        if (m && m.classList.contains('active')) animateInvoice(m);
      }, 30);
      return r;
    };
  });
})();


(function(){
  function syncLoginBody(){
    var s = document.getElementById('loginScreen');
    if (!s) return;
    if (s.classList.contains('hidden')) {
      document.body.classList.remove('login-open');
    } else {
      document.body.classList.add('login-open');
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncLoginBody);
  } else {
    syncLoginBody();
  }
  // also after short delay (auto-login race)
  setTimeout(syncLoginBody, 300);
  setTimeout(syncLoginBody, 1200);
})();


// Expose login helpers globally
window.doLogin = doLogin;
window.doRegister = doRegister;
window.showLoginTab = showLoginTab;

// Robust login click / Enter handling
document.addEventListener('click', function(e) {
  var t = e.target;
  if (!t) return;
  var btn = t.closest ? t.closest('#loginSubmitBtn, #registerSubmitBtn, #tabLogin, #tabRegister') : null;
  if (!btn) return;
  e.preventDefault();
  if (btn.id === 'loginSubmitBtn') { doLogin(); return; }
  if (btn.id === 'registerSubmitBtn') { doRegister(); return; }
  if (btn.id === 'tabLogin') { showLoginTab('login'); return; }
  if (btn.id === 'tabRegister') { showLoginTab('register'); return; }
}, true);

document.addEventListener('keydown', function(e) {
  if (e.key !== 'Enter') return;
  var screen = document.getElementById('loginScreen');
  if (!screen || screen.classList.contains('hidden')) return;
  var tag = (e.target && e.target.tagName || '').toUpperCase();
  if (tag !== 'INPUT') return;
  e.preventDefault();
  var reg = document.getElementById('registerForm');
  if (reg && reg.style.display !== 'none' && reg.style.display !== '') {
    doRegister();
  } else {
    doLogin();
  }
}, true);

// Never leave loading overlay stuck over login
(function(){
  function clearLoad(){
    var el = document.getElementById('appLoadingOverlay');
    if (el) { el.classList.remove('show'); el.style.display = 'none'; }
  }
  setTimeout(clearLoad, 500);
  setTimeout(clearLoad, 2000);
})();


(function pinFooter(){
  function run(){
    var f = document.getElementById('mkFooterBar');
    if (!f) return;
    try { document.body.appendChild(f); } catch(e){}
    f.style.cssText = 'position:fixed!important;left:0!important;right:0!important;bottom:0!important;top:auto!important;width:100%!important;z-index:90000!important;margin:0!important;transform:none!important;box-shadow:none!important;border:none!important;border-top:1px solid #2a1a10!important;background:#4a3222!important;';
    // remove any yellow strip elements
    document.querySelectorAll('.yellow-strip,.bottom-strip,.mk-bottom-gap').forEach(function(el){ try{el.remove();}catch(e){} });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();


(function(){
  function killBackdrop(){
    var bd = document.getElementById('mkWinBackdrop');
    if (bd) { bd.classList.remove('on'); bd.style.display = 'none'; }
    document.body.classList.remove('mk-modal-dim');
  }
  document.addEventListener('click', function(){ setTimeout(killBackdrop, 0); }, true);
})();



/* ========== Phase1 Mahak modules ========== */
function openPhase1(kind) {
  try {
    if (kind === 'preinvoice') {
      if (typeof openMdiWindow === 'function') openMdiWindow('preinvoices', 'پیش‌فاکتورها');
      else if (typeof navigateTo === 'function') navigateTo('preinvoices');
      loadPreinvoices();
    } else if (kind === 'purchase_return') {
      window._returnType = 'purchase_return';
      if (typeof openMdiWindow === 'function') openMdiWindow('returns', 'برگشت از خرید');
      else if (typeof navigateTo === 'function') navigateTo('returns');
      var t = document.getElementById('returnsTitle'); if (t) t.textContent = 'برگشت از خرید';
      loadReturns('purchase_return');
    } else if (kind === 'sale_return') {
      window._returnType = 'sale_return';
      if (typeof openMdiWindow === 'function') openMdiWindow('returns', 'برگشت از فروش');
      else if (typeof navigateTo === 'function') navigateTo('returns');
      var t = document.getElementById('returnsTitle'); if (t) t.textContent = 'برگشت از فروش';
      loadReturns('sale_return');
    } else if (kind === 'kardex') {
      if (typeof openMdiWindow === 'function') openMdiWindow('kardex', 'کاردکس کالا');
      else if (typeof navigateTo === 'function') navigateTo('kardex');
      loadKardex();
    } else if (kind === 'treasury') {
      if (typeof openMdiWindow === 'function') openMdiWindow('treasury', 'دریافت و پرداخت');
      else if (typeof navigateTo === 'function') navigateTo('treasury');
      loadTreasury();
    }
  } catch (e) { console.error(e); alert('خطا: ' + e.message); }
}
window.openPhase1 = openPhase1;

function _parseItems(text) {
  var lines = String(text || '').split(/\n/).map(function(s){ return s.trim(); }).filter(Boolean);
  return lines.map(function(line) {
    var parts = line.split('|').map(function(x){ return x.trim(); });
    var name = parts[0] || '';
    var qty = parseFloat(parts[1]) || 1;
    var price = parseFloat(parts[2]) || 0;
    return { name: name, quantity: qty, unit_price: price, total: qty * price };
  }).filter(function(it){ return it.name; });
}

async function loadPreinvoices() {
  try {
    var res = await fetch(API + '/api/preinvoices');
    var data = await res.json();
    var tb = document.getElementById('preinvoiceTable');
    if (!tb) return;
    if (!Array.isArray(data) || !data.length) {
      tb.innerHTML = '<tr><td colspan="6" style="text-align:center">موردی نیست</td></tr>';
      return;
    }
    var stLabel = { draft: 'پیش‌نویس', converted: 'تبدیل‌شده' };
    tb.innerHTML = data.map(function(p) {
      return '<tr><td>' + (p.number||'') + '</td><td>' + (p.customer||'') + '</td><td>' + (p.date||'') +
        '</td><td>' + (typeof formatNumber==='function'?formatNumber(p.total):p.total) + '</td><td>' +
        (stLabel[p.status]||p.status) + '</td><td style="white-space:nowrap">' +
        (p.status!=='converted' ? '<button class="btn btn-primary" style="padding:2px 8px;font-size:11px" onclick="convertPreinvoice('+p.id+')">تبدیل به فروش</button> ' : '') +
        '<button class="btn btn-danger" style="padding:2px 8px;font-size:11px" onclick="deletePreinvoice('+p.id+')">حذف</button></td></tr>';
    }).join('');
  } catch(e) { console.error(e); }
}

function openPreinvoiceModal() {
  var d = document.getElementById('preDate');
  if (d) d.value = new Date().toISOString().slice(0,10);
  ['preCustomer','preItems','preNotes'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  var m = document.getElementById('preinvoiceModal');
  if (m) { m.classList.add('active'); m.style.display='flex'; }
}

async function savePreinvoice() {
  var items = _parseItems((document.getElementById('preItems')||{}).value);
  if (!items.length) return alert('حداقل یک قلم وارد کنید');
  var payload = {
    customer: (document.getElementById('preCustomer')||{}).value || '',
    date: (document.getElementById('preDate')||{}).value || '',
    notes: (document.getElementById('preNotes')||{}).value || '',
    items: items
  };
  try {
    var res = await fetch(API + '/api/preinvoices', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('save failed');
    closeModal('preinvoiceModal');
    loadPreinvoices();
    if (typeof toast==='function') toast('پیش‌فاکتور ذخیره شد', 'success');
  } catch(e) { alert('خطا در ذخیره'); }
}

async function convertPreinvoice(id) {
  if (!confirm('تبدیل به فاکتور فروش؟ موجودی کم می‌شود.')) return;
  try {
    var res = await fetch(API + '/api/preinvoices/' + id + '/convert', { method: 'POST' });
    var data = await res.json().catch(function(){ return {}; });
    if (!res.ok) throw new Error(data.detail || 'fail');
    loadPreinvoices();
    if (typeof toast==='function') toast('تبدیل شد', 'success');
  } catch(e) { alert('خطا: ' + e.message); }
}

async function deletePreinvoice(id) {
  if (!confirm('حذف شود؟')) return;
  await fetch(API + '/api/preinvoices/' + id, { method: 'DELETE' });
  loadPreinvoices();
}

async function loadReturns(rtype) {
  rtype = rtype || window._returnType || '';
  try {
    var url = API + '/api/returns' + (rtype ? ('?return_type=' + encodeURIComponent(rtype)) : '');
    var res = await fetch(url);
    var data = await res.json();
    var tb = document.getElementById('returnsTable');
    if (!tb) return;
    if (!Array.isArray(data) || !data.length) {
      tb.innerHTML = '<tr><td colspan="6" style="text-align:center">موردی نیست</td></tr>';
      return;
    }
    var tl = { sale_return: 'برگشت فروش', purchase_return: 'برگشت خرید' };
    tb.innerHTML = data.map(function(r) {
      return '<tr><td>' + (r.number||'') + '</td><td>' + (tl[r.return_type]||r.return_type) +
        '</td><td>' + (r.party||'') + '</td><td>' + (r.date||'') + '</td><td>' +
        (typeof formatNumber==='function'?formatNumber(r.total):r.total) +
        '</td><td><button class="btn btn-danger" style="padding:2px 8px;font-size:11px" onclick="deleteReturn('+r.id+')">حذف</button></td></tr>';
    }).join('');
  } catch(e) { console.error(e); }
}

function openReturnModal() {
  var rtype = window._returnType || 'sale_return';
  var hv = document.getElementById('returnTypeVal'); if (hv) hv.value = rtype;
  var title = document.getElementById('returnModalTitle');
  if (title) title.textContent = rtype === 'purchase_return' ? 'برگشت از خرید' : 'برگشت از فروش';
  var d = document.getElementById('retDate'); if (d) d.value = new Date().toISOString().slice(0,10);
  ['retParty','retItems','retNotes'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  var m = document.getElementById('returnModal');
  if (m) { m.classList.add('active'); m.style.display='flex'; }
}

async function saveReturn() {
  var items = _parseItems((document.getElementById('retItems')||{}).value);
  if (!items.length) return alert('حداقل یک قلم وارد کنید');
  var payload = {
    return_type: (document.getElementById('returnTypeVal')||{}).value || 'sale_return',
    party: (document.getElementById('retParty')||{}).value || '',
    date: (document.getElementById('retDate')||{}).value || '',
    notes: (document.getElementById('retNotes')||{}).value || '',
    items: items
  };
  try {
    var res = await fetch(API + '/api/returns', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('fail');
    closeModal('returnModal');
    loadReturns(payload.return_type);
    if (typeof toast==='function') toast('برگشت ثبت شد', 'success');
  } catch(e) { alert('خطا در ذخیره'); }
}

async function deleteReturn(id) {
  if (!confirm('حذف شود؟')) return;
  await fetch(API + '/api/returns/' + id, { method: 'DELETE' });
  loadReturns(window._returnType);
}

async function loadKardex() {
  try {
    var q = (document.getElementById('kardexSearch')||{}).value || '';
    var res = await fetch(API + '/api/kardex' + (q ? ('?q=' + encodeURIComponent(q)) : ''));
    var data = await res.json();
    var st = document.getElementById('stockTable');
    var kt = document.getElementById('kardexTable');
    if (st) {
      var stocks = data.stocks || [];
      st.innerHTML = stocks.length ? stocks.map(function(s) {
        var low = (s.min_stock && s.stock < s.min_stock);
        return '<tr' + (low ? ' style="background:#ffe0e0"' : '') + '><td>' + (s.code||'') + '</td><td>' + (s.name||'') +
          '</td><td><b>' + (s.stock||0) + '</b></td><td>' + (s.min_stock||0) + '</td><td>' +
          (s.buy_price||0) + '</td><td>' + (s.sell_price||0) + '</td></tr>';
      }).join('') : '<tr><td colspan="6" style="text-align:center">کالایی نیست</td></tr>';
    }
    if (kt) {
      var moves = data.movements || [];
      var ml = { purchase:'خرید', sale:'فروش', sale_return:'برگشت فروش', purchase_return:'برگشت خرید' };
      kt.innerHTML = moves.length ? moves.map(function(m) {
        return '<tr><td>' + (m.created_at||'') + '</td><td>' + (m.product_name||m.product_code||'') +
          '</td><td>' + (ml[m.move_type]||m.move_type) + '</td><td>' + m.qty + '</td><td>' + (m.unit_price||0) +
          '</td><td>' + (m.ref_type||'') + ' #' + (m.ref_id||'') + '</td></tr>';
      }).join('') : '<tr><td colspan="6" style="text-align:center">گردشی ثبت نشده</td></tr>';
    }
  } catch(e) { console.error(e); }
}

async function loadTreasury() {
  try {
    var res = await fetch(API + '/api/treasury');
    var data = await res.json();
    var tb = document.getElementById('treasuryTable');
    if (!tb) return;
    var tl = { receive: 'دریافت', pay: 'پرداخت' };
    var ml = { cash: 'نقد', card: 'کارت', transfer: 'حواله', check: 'چک' };
    if (!Array.isArray(data) || !data.length) {
      tb.innerHTML = '<tr><td colspan="8" style="text-align:center">موردی نیست</td></tr>';
      return;
    }
    tb.innerHTML = data.map(function(t) {
      return '<tr><td>' + (tl[t.tx_type]||t.tx_type) + '</td><td>' + (ml[t.method]||t.method) +
        '</td><td>' + (t.party||'') + '</td><td>' + (t.account||'') + '</td><td>' +
        (typeof formatNumber==='function'?formatNumber(t.amount):t.amount) + '</td><td>' + (t.date||'') +
        '</td><td>' + (t.description||'') + '</td><td><button class="btn btn-danger" style="padding:2px 8px;font-size:11px" onclick="deleteTreasury('+t.id+')">حذف</button></td></tr>';
    }).join('');
  } catch(e) { console.error(e); }
}

function openTreasuryModal(txType) {
  var hv = document.getElementById('treasType'); if (hv) hv.value = txType || 'receive';
  var title = document.getElementById('treasuryModalTitle');
  if (title) title.textContent = txType === 'pay' ? 'پرداخت' : 'دریافت';
  var d = document.getElementById('treasDate'); if (d) d.value = new Date().toISOString().slice(0,10);
  ['treasParty','treasAccount','treasDesc'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  var a = document.getElementById('treasAmount'); if (a) a.value = 0;
  var m = document.getElementById('treasuryModal');
  if (m) { m.classList.add('active'); m.style.display='flex'; }
}

async function saveTreasury() {
  var payload = {
    tx_type: (document.getElementById('treasType')||{}).value || 'receive',
    method: (document.getElementById('treasMethod')||{}).value || 'cash',
    party: (document.getElementById('treasParty')||{}).value || '',
    account: (document.getElementById('treasAccount')||{}).value || '',
    amount: parseFloat((document.getElementById('treasAmount')||{}).value) || 0,
    date: (document.getElementById('treasDate')||{}).value || '',
    description: (document.getElementById('treasDesc')||{}).value || ''
  };
  if (!payload.amount) return alert('مبلغ را وارد کنید');
  try {
    var res = await fetch(API + '/api/treasury', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('fail');
    closeModal('treasuryModal');
    loadTreasury();
    if (typeof toast==='function') toast('ثبت شد', 'success');
  } catch(e) { alert('خطا در ذخیره'); }
}

async function deleteTreasury(id) {
  if (!confirm('حذف شود؟')) return;
  await fetch(API + '/api/treasury/' + id, { method: 'DELETE' });
  loadTreasury();
}

async function checkDoAction(id, action) {
  try {
    var res = await fetch(API + '/api/checks/' + id + '/action', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ action: action })
    });
    if (!res.ok) throw new Error('fail');
    if (typeof loadChecks === 'function') loadChecks();
    if (typeof toast==='function') toast('وضعیت چک به‌روز شد', 'success');
  } catch(e) { alert('خطا'); }
}
window.checkDoAction = checkDoAction;




/* ========== Phase2 Accounting ========== */
function openPhase2(kind) {
  try {
    if (kind === 'coa') {
      if (typeof openMdiWindow === 'function') openMdiWindow('coa', 'کدینگ حساب');
      else if (typeof navigateTo === 'function') navigateTo('coa');
      loadCOA();
    } else if (kind === 'journal') {
      if (typeof openMdiWindow === 'function') openMdiWindow('journals', 'اسناد حسابداری');
      else if (typeof navigateTo === 'function') navigateTo('journals');
      loadJournals();
    } else if (kind === 'trial') {
      if (typeof openMdiWindow === 'function') openMdiWindow('trial', 'تراز آزمایشی');
      else if (typeof navigateTo === 'function') navigateTo('trial');
      loadTrialBalance();
    } else if (kind === 'pl') {
      if (typeof openMdiWindow === 'function') openMdiWindow('pl', 'سود و زیان');
      else if (typeof navigateTo === 'function') navigateTo('pl');
      loadPL();
    } else if (kind === 'bs') {
      if (typeof openMdiWindow === 'function') openMdiWindow('bs', 'ترازنامه');
      else if (typeof navigateTo === 'function') navigateTo('bs');
      loadBS();
    }
  } catch (e) { console.error(e); alert(e.message); }
}
window.openPhase2 = openPhase2;

var _accTypeFa = { asset:'دارایی', liability:'بدهی', equity:'حقوق صاحبان', income:'درآمد', expense:'هزینه' };

async function loadCOA() {
  try {
    var res = await fetch(API + '/api/chart-accounts');
    var data = await res.json();
    var tb = document.getElementById('coaTable');
    if (!tb) return;
    tb.innerHTML = (data||[]).map(function(a) {
      return '<tr><td>' + a.code + '</td><td>' + a.name + '</td><td>' + (_accTypeFa[a.account_type]||a.account_type) +
        '</td><td>' + (a.parent_code||'') + '</td><td>' +
        (a.is_leaf ? '<button class="btn btn-danger" style="padding:2px 8px;font-size:11px" onclick="deleteAccount(\''+a.code+'\')">حذف</button>' : '') +
        '</td></tr>';
    }).join('') || '<tr><td colspan="5" style="text-align:center">خالی</td></tr>';
  } catch(e) { console.error(e); }
}

function openAccountModal() {
  ['accCode','accName','accParent'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  var m = document.getElementById('accountModal');
  if (m) { m.classList.add('active'); m.style.display='flex'; }
}

async function saveAccount() {
  var payload = {
    code: (document.getElementById('accCode')||{}).value || '',
    name: (document.getElementById('accName')||{}).value || '',
    account_type: (document.getElementById('accType')||{}).value || 'asset',
    parent_code: (document.getElementById('accParent')||{}).value || '',
    is_leaf: 1
  };
  if (!payload.code || !payload.name) return alert('کد و نام لازم است');
  try {
    var res = await fetch(API + '/api/chart-accounts', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
    });
    var data = await res.json().catch(function(){return {};});
    if (!res.ok) throw new Error(data.detail || 'خطا');
    closeModal('accountModal');
    loadCOA();
  } catch(e) { alert(e.message); }
}

async function deleteAccount(code) {
  if (!confirm('حذف حساب ' + code + '؟')) return;
  var res = await fetch(API + '/api/chart-accounts/' + encodeURIComponent(code), { method:'DELETE' });
  if (!res.ok) {
    var d = await res.json().catch(function(){return {};});
    return alert(d.detail || 'خطا');
  }
  loadCOA();
}

async function loadJournals() {
  try {
    var res = await fetch(API + '/api/journals');
    var data = await res.json();
    var tb = document.getElementById('journalTable');
    if (!tb) return;
    var fn = typeof formatNumber==='function' ? formatNumber : function(x){return x;};
    tb.innerHTML = (data||[]).map(function(j) {
      return '<tr><td>' + (j.number||'') + '</td><td>' + (j.date||'') + '</td><td>' + (j.description||'') +
        '</td><td>' + fn(j.total_debit) + '</td><td>' + fn(j.total_credit) +
        '</td><td><button class="btn btn-danger" style="padding:2px 8px;font-size:11px" onclick="deleteJournal('+j.id+')">حذف</button></td></tr>';
    }).join('') || '<tr><td colspan="6" style="text-align:center">سندی نیست</td></tr>';
  } catch(e) { console.error(e); }
}

function openJournalModal() {
  var d = document.getElementById('jeDate'); if (d) d.value = new Date().toISOString().slice(0,10);
  var desc = document.getElementById('jeDesc'); if (desc) desc.value = '';
  var lines = document.getElementById('jeLines'); if (lines) lines.value = '';
  var m = document.getElementById('journalModal');
  if (m) { m.classList.add('active'); m.style.display='flex'; }
  var ta = document.getElementById('jeLines');
  if (ta && !ta._wired) {
    ta._wired = true;
    ta.addEventListener('input', function() {
      var sumD = 0, sumC = 0;
      String(ta.value||'').split('\n').forEach(function(line) {
        var p = line.split('|').map(function(x){return x.trim();});
        if (p.length >= 3) { sumD += parseFloat(p[1])||0; sumC += parseFloat(p[2])||0; }
      });
      var sd = document.getElementById('jeSumD'); if (sd) sd.textContent = sumD;
      var sc = document.getElementById('jeSumC'); if (sc) sc.textContent = sumC;
    });
  }
}

async function saveJournal() {
  var lines = [];
  String((document.getElementById('jeLines')||{}).value || '').split('\n').forEach(function(line) {
    var p = line.split('|').map(function(x){ return x.trim(); });
    if (p.length >= 3 && p[0]) {
      lines.push({
        account_code: p[0],
        debit: parseFloat(p[1]) || 0,
        credit: parseFloat(p[2]) || 0,
        description: p[3] || ''
      });
    }
  });
  if (lines.length < 2) return alert('حداقل دو ردیف وارد کنید');
  var payload = {
    date: (document.getElementById('jeDate')||{}).value || '',
    description: (document.getElementById('jeDesc')||{}).value || '',
    lines: lines
  };
  try {
    var res = await fetch(API + '/api/journals', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
    });
    var data = await res.json().catch(function(){return {};});
    if (!res.ok) throw new Error(data.detail || 'خطا');
    closeModal('journalModal');
    loadJournals();
    if (typeof toast==='function') toast('سند ثبت شد', 'success');
  } catch(e) { alert(e.message); }
}

async function deleteJournal(id) {
  if (!confirm('حذف سند؟')) return;
  await fetch(API + '/api/journals/' + id, { method:'DELETE' });
  loadJournals();
}

async function loadTrialBalance() {
  try {
    var res = await fetch(API + '/api/reports/trial-balance');
    var data = await res.json();
    var tb = document.getElementById('trialTable');
    var fn = typeof formatNumber==='function' ? formatNumber : function(x){return x;};
    if (tb) {
      tb.innerHTML = (data.rows||[]).map(function(r) {
        return '<tr><td>' + r.code + '</td><td>' + r.name + '</td><td>' + fn(r.debit) + '</td><td>' + fn(r.credit) +
          '</td><td>' + fn(r.balance_debit) + '</td><td>' + fn(r.balance_credit) + '</td></tr>';
      }).join('') || '<tr><td colspan="6" style="text-align:center">گردشی نیست — اول سند بزنید</td></tr>';
    }
    var td = document.getElementById('trialTotD'); if (td) td.textContent = fn(data.total_debit||0);
    var tc = document.getElementById('trialTotC'); if (tc) tc.textContent = fn(data.total_credit||0);
  } catch(e) { console.error(e); }
}

async function loadPL() {
  try {
    var res = await fetch(API + '/api/reports/income-statement');
    var data = await res.json();
    var box = document.getElementById('plBox');
    if (!box) return;
    var fn = typeof formatNumber==='function' ? formatNumber : function(x){return x;};
    var html = '<h3 style="margin:0 0 8px">درآمدها</h3><ul style="margin:0;padding:0 18px">';
    (data.income||[]).forEach(function(r){ html += '<li>' + r.code + ' — ' + r.name + ': <b>' + fn(r.amount) + '</b></li>'; });
    if (!(data.income||[]).length) html += '<li style="color:#888">—</li>';
    html += '</ul><p><b>جمع درآمد: ' + fn(data.total_income||0) + '</b></p>';
    html += '<h3 style="margin:12px 0 8px">هزینه‌ها</h3><ul style="margin:0;padding:0 18px">';
    (data.expense||[]).forEach(function(r){ html += '<li>' + r.code + ' — ' + r.name + ': <b>' + fn(r.amount) + '</b></li>'; });
    if (!(data.expense||[]).length) html += '<li style="color:#888">—</li>';
    html += '</ul><p><b>جمع هزینه: ' + fn(data.total_expense||0) + '</b></p>';
    var net = data.net || 0;
    html += '<hr><p style="font-size:16px"><b>سود (زیان) خالص: <span style="color:' + (net>=0?'#0a7':'#c00') + '">' + fn(net) + '</span></b></p>';
    box.innerHTML = html;
  } catch(e) { console.error(e); }
}

async function loadBS() {
  try {
    var res = await fetch(API + '/api/reports/balance-sheet');
    var data = await res.json();
    var box = document.getElementById('bsBox');
    if (!box) return;
    var fn = typeof formatNumber==='function' ? formatNumber : function(x){return x;};
    function sec(title, rows, tot) {
      var h = '<h3 style="margin:12px 0 6px">' + title + '</h3><ul style="margin:0;padding:0 18px">';
      (rows||[]).forEach(function(r){ h += '<li>' + r.code + ' — ' + r.name + ': <b>' + fn(r.amount) + '</b></li>'; });
      if (!(rows||[]).length) h += '<li style="color:#888">—</li>';
      h += '</ul><p><b>جمع: ' + fn(tot||0) + '</b></p>';
      return h;
    }
    box.innerHTML = sec('دارایی‌ها', data.assets, data.total_assets) +
      sec('بدهی‌ها', data.liabilities, data.total_liabilities) +
      sec('حقوق صاحبان سرمایه', data.equity, data.total_equity);
  } catch(e) { console.error(e); }
}

// navigateTo cases




/* ========== Phase3 Warehouse / Barcode / Credit / Prices ========== */
function openPhase3(kind) {
  try {
    if (kind === 'warehouses') {
      if (typeof openMdiWindow==='function') openMdiWindow('warehouses','انبارها');
      else if (typeof navigateTo==='function') navigateTo('warehouses');
      loadWarehouses();
    } else if (kind === 'transfers') {
      if (typeof openMdiWindow==='function') openMdiWindow('transfers','حواله انبار');
      else if (typeof navigateTo==='function') navigateTo('transfers');
      loadTransfers();
    } else if (kind === 'barcode') {
      if (typeof openMdiWindow==='function') openMdiWindow('barcode','بارکد کالا');
      else if (typeof navigateTo==='function') navigateTo('barcode');
      setTimeout(function(){ var el=document.getElementById('barcodeInput'); if(el) el.focus(); }, 100);
    } else if (kind === 'credit') {
      if (typeof openMdiWindow==='function') openMdiWindow('credit','سقف اعتبار');
      else if (typeof navigateTo==='function') navigateTo('credit');
      loadCreditPage();
    } else if (kind === 'prices') {
      if (typeof openMdiWindow==='function') openMdiWindow('prices','سطوح قیمت');
      else if (typeof navigateTo==='function') navigateTo('prices');
      loadPricesPage();
    }
  } catch(e) { alert(e.message); }
}
window.openPhase3 = openPhase3;

async function loadWarehouses() {
  try {
    var res = await fetch(API + '/api/warehouses');
    var data = await res.json();
    window._warehouses = data || [];
    var tb = document.getElementById('whTable');
    if (!tb) return;
    tb.innerHTML = (data||[]).map(function(w) {
      return '<tr style="cursor:pointer" onclick="showWhStock('+w.id+')"><td>' + w.code + '</td><td>' + w.name +
        '</td><td>' + (w.address||'') + '</td><td><button class="btn btn-secondary" style="padding:2px 8px;font-size:11px" onclick="event.stopPropagation();showWhStock('+w.id+')">مشاهده</button></td></tr>';
    }).join('') || '<tr><td colspan="4" style="text-align:center">انباری نیست</td></tr>';
  } catch(e) { console.error(e); }
}

async function showWhStock(id) {
  try {
    var res = await fetch(API + '/api/warehouses/' + id + '/stock');
    var data = await res.json();
    var tb = document.getElementById('whStockTable');
    if (!tb) return;
    tb.innerHTML = (data||[]).map(function(s) {
      return '<tr><td>' + (s.code||'') + '</td><td>' + (s.name||'') + '</td><td>' + (s.barcode||'') +
        '</td><td><b>' + s.qty + '</b></td></tr>';
    }).join('') || '<tr><td colspan="4" style="text-align:center">موجودی صفر</td></tr>';
  } catch(e) { console.error(e); }
}

function openWhModal() {
  ['whCode','whName','whAddr'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  var m = document.getElementById('whModal');
  if (m) { m.classList.add('active'); m.style.display='flex'; }
}

async function saveWarehouse() {
  var payload = {
    code: (document.getElementById('whCode')||{}).value || '',
    name: (document.getElementById('whName')||{}).value || '',
    address: (document.getElementById('whAddr')||{}).value || ''
  };
  if (!payload.code || !payload.name) return alert('کد و نام لازم است');
  var res = await fetch(API + '/api/warehouses', {
    method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
  });
  if (!res.ok) {
    var d = await res.json().catch(function(){return {};});
    return alert(d.detail || 'خطا');
  }
  closeModal('whModal');
  loadWarehouses();
}

async function loadTransfers() {
  try {
    var res = await fetch(API + '/api/transfers');
    var data = await res.json();
    var tb = document.getElementById('transferTable');
    if (!tb) return;
    tb.innerHTML = (data||[]).map(function(t) {
      var n = (t.items||[]).length;
      return '<tr><td>' + (t.number||'') + '</td><td>' + (t.from_name||t.from_wh) + '</td><td>' +
        (t.to_name||t.to_wh) + '</td><td>' + (t.date||'') + '</td><td>' + n + ' قلم</td></tr>';
    }).join('') || '<tr><td colspan="5" style="text-align:center">حواله‌ای نیست</td></tr>';
  } catch(e) { console.error(e); }
}

async function openTransferModal() {
  if (!window._warehouses) {
    var res = await fetch(API + '/api/warehouses');
    window._warehouses = await res.json();
  }
  var opts = (window._warehouses||[]).map(function(w) {
    return '<option value="'+w.id+'">'+w.code+' — '+w.name+'</option>';
  }).join('');
  var f = document.getElementById('trFrom'); if (f) f.innerHTML = opts;
  var t = document.getElementById('trTo'); if (t) t.innerHTML = opts;
  if (t && t.options.length > 1) t.selectedIndex = 1;
  var d = document.getElementById('trDate'); if (d) d.value = new Date().toISOString().slice(0,10);
  var it = document.getElementById('trItems'); if (it) it.value = '';
  var n = document.getElementById('trNotes'); if (n) n.value = '';
  var m = document.getElementById('transferModal');
  if (m) { m.classList.add('active'); m.style.display='flex'; }
}

async function saveTransfer() {
  var items = [];
  String((document.getElementById('trItems')||{}).value||'').split('\n').forEach(function(line) {
    var p = line.split('|').map(function(x){return x.trim();});
    if (p[0] && parseFloat(p[1]) > 0) items.push({ name: p[0], qty: parseFloat(p[1]) });
  });
  if (!items.length) return alert('اقلام را وارد کنید');
  var payload = {
    from_wh: parseInt((document.getElementById('trFrom')||{}).value, 10),
    to_wh: parseInt((document.getElementById('trTo')||{}).value, 10),
    date: (document.getElementById('trDate')||{}).value || '',
    notes: (document.getElementById('trNotes')||{}).value || '',
    items: items
  };
  try {
    var res = await fetch(API + '/api/transfers', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
    });
    var data = await res.json().catch(function(){return {};});
    if (!res.ok) throw new Error(data.detail || 'خطا');
    closeModal('transferModal');
    loadTransfers();
    if (typeof toast==='function') toast('حواله ثبت شد', 'success');
  } catch(e) { alert(e.message); }
}

async function lookupBarcode() {
  var code = ((document.getElementById('barcodeInput')||{}).value || '').trim();
  var box = document.getElementById('barcodeResult');
  if (!code) return;
  try {
    var res = await fetch(API + '/api/products/by-barcode/' + encodeURIComponent(code));
    if (!res.ok) {
      if (box) box.innerHTML = '<span style="color:#c00">کالا یافت نشد</span>';
      return;
    }
    var p = await res.json();
    var fn = typeof formatNumber==='function' ? formatNumber : function(x){return x;};
    if (box) {
      box.innerHTML = '<b>' + (p.name||'') + '</b><br>کد: ' + (p.code||'') +
        '<br>بارکد: ' + (p.barcode||'') +
        '<br>موجودی: <b>' + (p.stock||0) + '</b>' +
        '<br>قیمت ۱: ' + fn(p.sell_price||0) +
        ' | ۲: ' + fn(p.price2||0) +
        ' | ۳: ' + fn(p.price3||0) +
        ' | ۴: ' + fn(p.price4||0);
    }
  } catch(e) {
    if (box) box.innerHTML = '<span style="color:#c00">خطا</span>';
  }
}

async function loadCreditPage() {
  try {
    var res = await fetch(API + '/api/customers');
    var data = await res.json();
    if (!Array.isArray(data)) data = data.items || data.customers || [];
    var tb = document.getElementById('creditTable');
    if (!tb) return;
    var rows = [];
    for (var i = 0; i < data.length; i++) {
      var c = data[i];
      var credit = { credit_limit: c.credit_limit||0, outstanding: 0, price_level: c.price_level||1 };
      try {
        var cr = await fetch(API + '/api/customers/' + c.id + '/credit');
        if (cr.ok) credit = await cr.json();
      } catch(e) {}
      var over = credit.over_limit ? ' style="background:#ffe0e0"' : '';
      rows.push('<tr'+over+'><td>' + (c.name||'') + '</td><td>' + (c.phone||'') +
        '</td><td>' + (credit.credit_limit||0) + '</td><td>' + (credit.price_level||1) +
        '</td><td>' + (credit.outstanding||0) +
        '</td><td><button class="btn btn-secondary" style="padding:2px 8px;font-size:11px" onclick="editCredit('+c.id+','+(credit.credit_limit||0)+','+(credit.price_level||1)+')">ویرایش</button></td></tr>');
    }
    tb.innerHTML = rows.join('') || '<tr><td colspan="6" style="text-align:center">مشتری نیست</td></tr>';
  } catch(e) { console.error(e); }
}

function editCredit(id, limit, level) {
  var i = document.getElementById('crCustId'); if (i) i.value = id;
  var l = document.getElementById('crLimit'); if (l) l.value = limit;
  var lv = document.getElementById('crLevel'); if (lv) lv.value = level;
  var m = document.getElementById('creditEditModal');
  if (m) { m.classList.add('active'); m.style.display='flex'; }
}

async function saveCredit() {
  var id = (document.getElementById('crCustId')||{}).value;
  var payload = {
    credit_limit: parseFloat((document.getElementById('crLimit')||{}).value) || 0,
    price_level: parseInt((document.getElementById('crLevel')||{}).value, 10) || 1
  };
  await fetch(API + '/api/customers/' + id + '/credit', {
    method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
  });
  closeModal('creditEditModal');
  loadCreditPage();
}

async function loadPricesPage() {
  try {
    var res = await fetch(API + '/api/products');
    var data = await res.json();
    if (!Array.isArray(data)) data = data.items || data.products || [];
    var tb = document.getElementById('pricesTable');
    if (!tb) return;
    var fn = typeof formatNumber==='function' ? formatNumber : function(x){return x;};
    tb.innerHTML = data.map(function(p) {
      return '<tr><td>' + (p.code||'') + '</td><td>' + (p.name||'') + '</td><td>' + (p.barcode||'') +
        '</td><td>' + fn(p.sell_price||0) + '</td><td>' + fn(p.price2||0) + '</td><td>' + fn(p.price3||0) +
        '</td><td>' + fn(p.price4||0) +
        '</td><td><button class="btn btn-secondary" style="padding:2px 8px;font-size:11px" onclick=\'editPricing('+JSON.stringify({
          id:p.id, barcode:p.barcode||'', sell_price:p.sell_price||0, price2:p.price2||0, price3:p.price3||0, price4:p.price4||0
        }).replace(/'/g,"&#39;")+')\'>ویرایش</button></td></tr>';
    }).join('') || '<tr><td colspan="8" style="text-align:center">کالایی نیست</td></tr>';
  } catch(e) { console.error(e); }
}

function editPricing(p) {
  if (typeof p === 'string') try { p = JSON.parse(p); } catch(e) { return; }
  var id = document.getElementById('prProdId'); if (id) id.value = p.id;
  var b = document.getElementById('prBarcode'); if (b) b.value = p.barcode || '';
  var p1 = document.getElementById('pr1'); if (p1) p1.value = p.sell_price || 0;
  var p2 = document.getElementById('pr2'); if (p2) p2.value = p.price2 || 0;
  var p3 = document.getElementById('pr3'); if (p3) p3.value = p.price3 || 0;
  var p4 = document.getElementById('pr4'); if (p4) p4.value = p.price4 || 0;
  var m = document.getElementById('priceEditModal');
  if (m) { m.classList.add('active'); m.style.display='flex'; }
}
window.editPricing = editPricing;

async function saveProductPricing() {
  var id = (document.getElementById('prProdId')||{}).value;
  var payload = {
    barcode: (document.getElementById('prBarcode')||{}).value || '',
    sell_price: parseFloat((document.getElementById('pr1')||{}).value) || 0,
    price2: parseFloat((document.getElementById('pr2')||{}).value) || 0,
    price3: parseFloat((document.getElementById('pr3')||{}).value) || 0,
    price4: parseFloat((document.getElementById('pr4')||{}).value) || 0
  };
  await fetch(API + '/api/products/' + id + '/pricing', {
    method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
  });
  closeModal('priceEditModal');
  loadPricesPage();
}


(function wireTabsHard(){
  function bind(){
    var bar = document.getElementById('mkTabsBar');
    if (!bar || bar.dataset.wired === '1') return;
    bar.dataset.wired = '1';
    bar.addEventListener('click', function(e){
      var tab = e.target.closest('.mk-tab');
      if (!tab) return;
      e.preventDefault();
      e.stopPropagation();
      var action = tab.getAttribute('data-tab') || '';
      if (typeof window.mkTabClick === 'function') window.mkTabClick(tab, action);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
  setTimeout(bind, 500);
  setTimeout(bind, 1500);
})();

(function bindSaleCodeLookup(){
  function fillFromCode(){
    var codeEl = document.getElementById('saleItemCode');
    if (!codeEl) return;
    var code = String(codeEl.value || '').trim();
    if (!code) return;
    var list = (typeof products !== 'undefined' && products) || (typeof cacheProducts !== 'undefined' && cacheProducts) || [];
    var found = null;
    for (var i=0;i<list.length;i++){
      if (String(list[i].code||'') === code) { found = list[i]; break; }
    }
    if (!found) return;
    var nameEl = document.getElementById('saleItemName');
    var priceEl = document.getElementById('saleItemPrice');
    if (nameEl && !nameEl.value) nameEl.value = found.name || '';
    if (priceEl && (!priceEl.value || priceEl.value === '0')) {
      priceEl.value = found.sell_price != null ? found.sell_price : (found.price || 0);
    }
  }
  document.addEventListener('change', function(e){
    if (e.target && e.target.id === 'saleItemCode') fillFromCode();
  });
  document.addEventListener('keydown', function(e){
    if (e.target && e.target.id === 'saleItemCode' && e.key === 'Enter') {
      e.preventDefault();
      fillFromCode();
      var n = document.getElementById('saleItemName');
      if (n) n.focus();
    }
  });
})();

(function bindSaleCodeEnter(){
  document.addEventListener('keydown', function(e){
    if (!e.target) return;
    if (e.target.id === 'saleItemCode' && e.key === 'Enter') {
      e.preventDefault();
      if (typeof addSaleItem === 'function') addSaleItem();
    }
    if (e.target.id === 'saleItemName' && e.key === 'Enter') {
      e.preventDefault();
      if (typeof addSaleItem === 'function') addSaleItem();
    }
  }, true);
})();

(function watchMdi(){
  function go(){
    var layer = document.getElementById('mdiLayer');
    if (!layer || layer._obs) return;
    layer._obs = new MutationObserver(function(){ try{syncMdiOpenClass();}catch(e){} });
    layer._obs.observe(layer, {childList:true, subtree:true, attributes:true, attributeFilter:['class']});
    syncMdiOpenClass();
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', go);
  else go();
  setTimeout(go, 800);
})();
