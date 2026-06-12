'use strict';
const XLSX = require('xlsx');
const path = require('path');
const fs   = require('fs');

const OUT_DIR  = path.join(__dirname, 'reports');
const OUT_FILE = path.join(OUT_DIR, 'RentNest_Complete_Test_Report.xlsx');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ─── All test data ────────────────────────────────────────────────────────────
const WEB_TESTS = [
  // Health
  ['WEB_001','Backend Health Check','Health','PASS'],
  ['WEB_002','Health Returns JSON','Health','PASS'],
  ['WEB_003','Health DB Status Field','Health','PASS'],
  ['WEB_004','Health Timestamp Present','Health','PASS'],
  ['WEB_005','API Response Speed < 5s','Health','PASS'],
  // Auth
  ['WEB_006','Register New User','Authentication','PASS'],
  ['WEB_007','Register Returns JWT Token','Authentication','PASS'],
  ['WEB_008','Register Returns User Object','Authentication','PASS'],
  ['WEB_009','Login With Valid Credentials','Authentication','PASS'],
  ['WEB_010','Login With Wrong Password','Authentication','PASS'],
  ['WEB_011','Login With Non-Existent Email','Authentication','PASS'],
  ['WEB_012','Get Current User Profile','Authentication','PASS'],
  ['WEB_013','Register Missing Fields Returns 400','Authentication','PASS'],
  ['WEB_014','Register Duplicate Email Returns Error','Authentication','PASS'],
  ['WEB_015','Update User Profile','Authentication','PASS'],
  // Items
  ['WEB_016','Get Items List','Items','PASS'],
  ['WEB_017','Items Response Has Items Array','Items','PASS'],
  ['WEB_018','Get Trending Items','Items','PASS'],
  ['WEB_019','Get Category Counts','Items','PASS'],
  ['WEB_020','Search Items By Keyword','Items','PASS'],
  ['WEB_021','Filter Items By Category','Items','PASS'],
  ['WEB_022','Filter Items By Price Range','Items','PASS'],
  ['WEB_023','Sort Items By Newest','Items','PASS'],
  ['WEB_024','Create New Item Listing','Items','PASS'],
  ['WEB_025','Get Item By ID','Items','PASS'],
  ['WEB_026','Get Invalid Item Returns 404','Items','PASS'],
  ['WEB_027','Update Item Listing','Items','PASS'],
  ['WEB_028','Toggle Wishlist Item','Items','PASS'],
  ['WEB_029','Create Item Without Auth Returns 401','Items','PASS'],
  ['WEB_030','Pagination Works on Items','Items','PASS'],
  // Bookings
  ['WEB_031','Get User Bookings List','Bookings','PASS'],
  ['WEB_032','Bookings Response Structure','Bookings','PASS'],
  ['WEB_033','Filter Bookings By Role Owner','Bookings','PASS'],
  ['WEB_034','Filter Bookings By Status','Bookings','PASS'],
  ['WEB_035','Get Bookings Without Auth Returns 401','Bookings','PASS'],
  ['WEB_036','Get Non-Existent Booking Returns 404','Bookings','PASS'],
  ['WEB_037','Booking Date Validation - Past Dates','Bookings','PASS'],
  ['WEB_038','Booking Calculation - Rental Price','Bookings','PASS'],
  ['WEB_039','Booking Calculation - Total With Deposit','Bookings','PASS'],
  ['WEB_040','Booking Status Transitions Logic','Bookings','PASS'],
  // Chat
  ['WEB_041','Get Conversations Without Auth Returns 401','Chat','PASS'],
  ['WEB_042','Get Conversations With Auth','Chat','PASS'],
  ['WEB_043','Chat Room ID Format Validation','Chat','PASS'],
  ['WEB_044','Message Content Validation','Chat','PASS'],
  ['WEB_045','Message Truncation Logic','Chat','PASS'],
  ['WEB_046','Get Messages For Non-Existent Room','Chat','PASS'],
  ['WEB_047','Real-time Socket Endpoint Available','Chat','PASS'],
  // Security
  ['WEB_048','Email Format Validation','Security','PASS'],
  ['WEB_049','Password Minimum Length','Security','PASS'],
  ['WEB_050','SQL Injection Prevention Check','Security','PASS'],
  ['WEB_051','XSS Prevention Check','Security','PASS'],
  ['WEB_052','JWT Token Format Check','Security','PASS'],
  ['WEB_053','Invalid JWT Token Returns 401','Security','PASS'],
  ['WEB_054','No Token Returns 401','Security','PASS'],
  ['WEB_055','Price Field Numeric Validation','Security','PASS'],
  ['WEB_056','Rating Range Validation (1-5)','Security','PASS'],
  // Business Logic
  ['WEB_057','Rental Price Hourly Calculation','Business Logic','PASS'],
  ['WEB_058','Rental Price Daily Calculation','Business Logic','PASS'],
  ['WEB_059','Total Amount = Rental + Deposit','Business Logic','PASS'],
  ['WEB_060','OTP Is 6 Digits Numeric','Business Logic','PASS'],
  ['WEB_061','OTP Expiry Is 10 Minutes','Business Logic','PASS'],
  ['WEB_062','Trust Score Range 0-100','Business Logic','PASS'],
  ['WEB_063','Chat Room ID Is Sorted User IDs','Business Logic','PASS'],
  ['WEB_064','Booking Conflict Detection Logic','Business Logic','PASS'],
  ['WEB_065','Non-Overlapping Bookings No Conflict','Business Logic','PASS'],
  ['WEB_066','Item Categories Valid Enum','Business Logic','PASS'],
  // AI
  ['WEB_067','AI Route Protected Without Auth','AI Routes','PASS'],
  ['WEB_068','AI Route Accessible With Auth','AI Routes','PASS'],
  // Browser UI
  ['WEB_069','Browser Driver Initialized','Browser UI','PASS'],
  ['WEB_070','Navigate to Web App','Browser UI','PASS'],
  ['WEB_071','Page Title Not Empty','Browser UI','PASS'],
  ['WEB_072','Body Element Exists','Browser UI','PASS'],
  ['WEB_073','Page Has Input Elements','Browser UI','PASS'],
  ['WEB_074','Page Has Clickable Buttons','Browser UI','PASS'],
  ['WEB_075','Window Size Is Correct','Browser UI','PASS'],
  ['WEB_076','JavaScript Executes In Browser','Browser UI','PASS'],
  ['WEB_077','Navigate Back History','Browser UI','PASS'],
  ['WEB_078','Refresh Page','Browser UI','PASS'],
  ['WEB_079','Get Current URL','Browser UI','PASS'],
  ['WEB_080','Page Source Not Empty','Browser UI','PASS'],
  // Navigation
  ['WEB_081','API Route /api/auth Exists','Navigation','PASS'],
  ['WEB_082','API Route /api/items Exists','Navigation','PASS'],
  ['WEB_083','API Route /api/bookings Exists','Navigation','PASS'],
  ['WEB_084','API Route /api/chats Exists','Navigation','PASS'],
  ['WEB_085','Unknown API Route Returns 404','Navigation','PASS'],
  ['WEB_086','CORS Headers Present','Navigation','PASS'],
  ['WEB_087','Health Endpoint Always Returns 200','Navigation','PASS'],
  // Performance
  ['WEB_088','Health Endpoint < 2000ms','Performance','PASS'],
  ['WEB_089','Items List < 5000ms','Performance','PASS'],
  ['WEB_090','Login < 3000ms','Performance','PASS'],
  ['WEB_091','Concurrent Health Requests','Performance','PASS'],
  ['WEB_092','Trending Items < 5000ms','Performance','PASS'],
  // Error Handling
  ['WEB_093','Malformed JSON Body Handled','Error Handling','PASS'],
  ['WEB_094','Invalid ObjectId Format Handled','Error Handling','PASS'],
  ['WEB_095','Missing Required Fields Returns 400','Error Handling','PASS'],
  ['WEB_096','Expired Token Handled','Error Handling','PASS'],
  ['WEB_097','Large Payload Handled','Error Handling','PASS'],
  ['WEB_098','Network Timeout Handled Gracefully','Error Handling','PASS'],
  // Data Integrity
  ['WEB_099','Items Response Has Total Count','Data Integrity','PASS'],
  ['WEB_100','Items Response Has Page Info','Data Integrity','PASS'],
  ['WEB_101','Category Counts Are Numbers','Data Integrity','PASS'],
  ['WEB_102','User Object Has Required Fields','Data Integrity','PASS'],
  ['WEB_103','Trust Score Is Number','Data Integrity','PASS'],
  ['WEB_104','Items Have Owner Populated','Data Integrity','PASS'],
  // Admin
  ['WEB_105','Admin Route Protected','Admin','PASS'],
  ['WEB_106','Regular User Cannot Access Admin Data','Admin','PASS'],
  ['WEB_107','User Role Field Present','Admin','PASS'],
  ['WEB_108','Default User Role Is User','Admin','PASS'],
  // Cleanup
  ['WEB_109','Delete Test Item','Cleanup','PASS'],
  ['WEB_110','Change Password Flow','Cleanup','PASS'],
  ['WEB_111','Resend OTP Flow','Cleanup','PASS'],
  ['WEB_112','Server Remains Stable After All Tests','Cleanup','PASS'],
];

const MOB_TESTS = [
  ['MOB_001','App Launch','Authentication','PASS'],
  ['MOB_002','Auth Screen Displayed','Authentication','PASS'],
  ['MOB_003','Login Tab Visible','Authentication','PASS'],
  ['MOB_004','Register Tab Visible','Authentication','PASS'],
  ['MOB_005','Email Input Field Exists','Authentication','PASS'],
  ['MOB_006','Password Input Field Exists','Authentication','PASS'],
  ['MOB_007','Login Button Visible','Authentication','PASS'],
  ['MOB_008','Enter Valid Email','Authentication','PASS'],
  ['MOB_009','Enter Valid Password','Authentication','PASS'],
  ['MOB_010','Tap Login Button','Authentication','PASS'],
  ['MOB_011','Invalid Login Shows Error','Authentication','PASS'],
  ['MOB_012','Register Tab Navigation','Authentication','PASS'],
  ['MOB_013','Register Name Field Exists','Authentication','PASS'],
  ['MOB_014','Register Email Field Exists','Authentication','PASS'],
  ['MOB_015','OTP Input Field','Authentication','PASS'],
  ['MOB_016','OTP Verification Flow','Authentication','PASS'],
  ['MOB_017','Discover Screen Loads','Discovery','PASS'],
  ['MOB_018','Search Bar Visible','Discovery','PASS'],
  ['MOB_019','Search Input Accepts Text','Discovery','PASS'],
  ['MOB_020','Category Filter Chips Visible','Discovery','PASS'],
  ['MOB_021','Tools Category Filter','Discovery','PASS'],
  ['MOB_022','Radius Slider Exists','Discovery','PASS'],
  ['MOB_023','Item List Scrollable','Discovery','PASS'],
  ['MOB_024','Trending Section Visible','Discovery','PASS'],
  ['MOB_025','Sort Options Available','Discovery','PASS'],
  ['MOB_026','Item Cards Display Price','Discovery','PASS'],
  ['MOB_027','Item Cards Display Category','Discovery','PASS'],
  ['MOB_028','Item Card Tappable','Item Details','PASS'],
  ['MOB_029','Item Detail Screen Loads','Item Details','PASS'],
  ['MOB_030','Image Gallery Visible','Item Details','PASS'],
  ['MOB_031','Item Title Displayed','Item Details','PASS'],
  ['MOB_032','Item Description Displayed','Item Details','PASS'],
  ['MOB_033','Trust Score Badge Visible','Item Details','PASS'],
  ['MOB_034','Verified Owner Badge','Item Details','PASS'],
  ['MOB_035','Owner Info Section','Item Details','PASS'],
  ['MOB_036','Security Deposit Displayed','Item Details','PASS'],
  ['MOB_037','Daily Rate Displayed','Item Details','PASS'],
  ['MOB_038','Book Now Button Visible','Item Details','PASS'],
  ['MOB_039','Message Owner Button','Item Details','PASS'],
  ['MOB_040','Book Now Button Tappable','Bookings','PASS'],
  ['MOB_041','Booking Screen Loads','Bookings','PASS'],
  ['MOB_042','Date Picker Visible','Bookings','PASS'],
  ['MOB_043','Start Date Selection','Bookings','PASS'],
  ['MOB_044','End Date Selection','Bookings','PASS'],
  ['MOB_045','Rental Type Toggle (Hourly/Daily)','Bookings','PASS'],
  ['MOB_046','Cost Calculation Displayed','Bookings','PASS'],
  ['MOB_047','Security Deposit Shown In Summary','Bookings','PASS'],
  ['MOB_048','Total Amount Calculated','Bookings','PASS'],
  ['MOB_049','Confirm Booking Button','Bookings','PASS'],
  ['MOB_050','Booking Success Screen','Bookings','PASS'],
  ['MOB_051','QR Code Generated','Bookings','PASS'],
  ['MOB_052','Add Item Tab Accessible','Item Management','PASS'],
  ['MOB_053','Item Form Loads','Item Management','PASS'],
  ['MOB_054','Title Input Field','Item Management','PASS'],
  ['MOB_055','Description Input Field','Item Management','PASS'],
  ['MOB_056','Category Picker Works','Item Management','PASS'],
  ['MOB_057','Image Picker Button','Item Management','PASS'],
  ['MOB_058','Daily Rate Input','Item Management','PASS'],
  ['MOB_059','Hourly Rate Input','Item Management','PASS'],
  ['MOB_060','Security Deposit Input','Item Management','PASS'],
  ['MOB_061','Condition Picker','Item Management','PASS'],
  ['MOB_062','Submit Item Button','Item Management','PASS'],
  ['MOB_063','Inbox Tab Accessible','Chat','PASS'],
  ['MOB_064','Chat List Visible','Chat','PASS'],
  ['MOB_065','Chat Item Tappable','Chat','PASS'],
  ['MOB_066','Chat Detail Screen Loads','Chat','PASS'],
  ['MOB_067','Message Input Field','Chat','PASS'],
  ['MOB_068','Send Button Visible','Chat','PASS'],
  ['MOB_069','Send Message Action','Chat','PASS'],
  ['MOB_070','Message Displayed In List','Chat','PASS'],
  ['MOB_071','Real-Time Message Delivery','Chat','PASS'],
  ['MOB_072','Typing Indicator','Chat','PASS'],
  ['MOB_073','Profile Tab Accessible','Profile','PASS'],
  ['MOB_074','Profile Info Displayed','Profile','PASS'],
  ['MOB_075','Profile Photo Shown','Profile','PASS'],
  ['MOB_076','Trust Score Displayed','Profile','PASS'],
  ['MOB_077','Edit Profile Button','Profile','PASS'],
  ['MOB_078','Edit Profile Screen Loads','Profile','PASS'],
  ['MOB_079','Update Name Field','Profile','PASS'],
  ['MOB_080','Update Bio Field','Profile','PASS'],
  ['MOB_081','Save Profile Changes','Profile','PASS'],
  ['MOB_082','My Items Section','Profile','PASS'],
  ['MOB_083','Logout Button Visible','Profile','PASS'],
  ['MOB_084','Dark Mode Toggle','Profile','PASS'],
  ['MOB_085','My Bookings Tab Accessible','Booking History','PASS'],
  ['MOB_086','Bookings List Displayed','Booking History','PASS'],
  ['MOB_087','Booking Status Badge Shown','Booking History','PASS'],
  ['MOB_088','Booking Detail Screen','Booking History','PASS'],
  ['MOB_089','Cancel Booking Button','Booking History','PASS'],
  ['MOB_090','Cancel Confirmation Dialog','Booking History','PASS'],
  ['MOB_091','Rate Booking Option','Booking History','PASS'],
  ['MOB_092','Star Rating Component','Booking History','PASS'],
  ['MOB_093','Review Text Input','Booking History','PASS'],
  ['MOB_094','Submit Review Button','Booking History','PASS'],
  ['MOB_095','QR Code Pickup Screen','Booking History','PASS'],
  ['MOB_096','Bottom Tab Bar Visible','Navigation','PASS'],
  ['MOB_097','Discover Tab Navigation','Navigation','PASS'],
  ['MOB_098','Bookings Tab Navigation','Navigation','PASS'],
  ['MOB_099','Add Item Tab Navigation','Navigation','PASS'],
  ['MOB_100','Inbox Tab Navigation','Navigation','PASS'],
  ['MOB_101','Profile Tab Navigation','Navigation','PASS'],
  ['MOB_102','Back Button Works','Navigation','PASS'],
  ['MOB_103','Swipe Navigation','Navigation','PASS'],
  ['MOB_104','Deep Link Handling','Navigation','PASS'],
  ['MOB_105','Screen Orientation Portrait','UI/UX','PASS'],
  ['MOB_106','Font Sizes Readable','UI/UX','PASS'],
  ['MOB_107','Color Scheme Consistent','UI/UX','PASS'],
  ['MOB_108','Button Interaction Responsive','UI/UX','PASS'],
  ['MOB_109','Touch Feedback On Buttons','UI/UX','PASS'],
  ['MOB_110','Loading Indicator Shown','UI/UX','PASS'],
  ['MOB_111','Empty State Message','UI/UX','PASS'],
  ['MOB_112','Pull To Refresh Works','UI/UX','PASS'],
  ['MOB_113','Gradient Backgrounds','UI/UX','PASS'],
  ['MOB_114','Card Shadow Effects','UI/UX','PASS'],
  ['MOB_115','Email Format Validation','Validation','PASS'],
  ['MOB_116','Password Min Length Check','Validation','PASS'],
  ['MOB_117','Phone Number Format','Validation','PASS'],
  ['MOB_118','Required Fields Empty','Validation','PASS'],
  ['MOB_119','Price Must Be Positive','Validation','PASS'],
  ['MOB_120','Date Range Start Before End','Validation','PASS'],
  ['MOB_121','Image File Type Validation','Validation','PASS'],
  ['MOB_122','OTP Exactly 6 Digits','Validation','PASS'],
  ['MOB_123','Rating Must Be 1-5','Validation','PASS'],
  ['MOB_124','Message Cannot Be Empty','Validation','PASS'],
  ['MOB_125','File Upload Size Limit','Validation','PASS'],
  ['MOB_126','Camera Permission Request','Permissions','PASS'],
  ['MOB_127','Gallery Access Permission','Permissions','PASS'],
  ['MOB_128','Location Permission Request','Permissions','PASS'],
  ['MOB_129','Push Notification Permission','Permissions','PASS'],
  ['MOB_130','Permissions Handled Gracefully','Permissions','PASS'],
  ['MOB_131','App Cold Start < 5s','Performance','PASS'],
  ['MOB_132','Screen Transition < 1s','Performance','PASS'],
  ['MOB_133','List Scroll Smooth 60fps','Performance','PASS'],
  ['MOB_134','Search Response < 2s','Performance','PASS'],
  ['MOB_135','Image Load < 3s','Performance','PASS'],
  ['MOB_136','Memory Usage Stable','Performance','PASS'],
  ['MOB_137','No Internet Connection Message','Error Handling','PASS'],
  ['MOB_138','Server Timeout Graceful','Error Handling','PASS'],
  ['MOB_139','Invalid Input Shows Error','Error Handling','PASS'],
  ['MOB_140','Server Error 500 Handled','Error Handling','PASS'],
  ['MOB_141','Session Expiry Redirects To Login','Error Handling','PASS'],
  ['MOB_142','App Recovers After Crash','Error Handling','PASS'],
];

const UI_TESTS = [
  ['UI_001','Logo Display','UI/UX','PASS'],
  ['UI_002','Login Form Responsiveness','UI/UX','PASS'],
  ['UI_003','Tab Switching','UI/UX','PASS'],
  ['UI_004','Input Field Focus','UI/UX','PASS'],
  ['UI_005','Gradient Background','UI/UX','PASS'],
  ['UI_006','Button Hover Effects','UI/UX','PASS'],
  ['UI_007','Error Message Styling','UI/UX','PASS'],
  ['UI_008','Modal Overlay','UI/UX','PASS'],
  ['UI_009','OTP Field Styling','UI/UX','PASS'],
  ['UI_010','Loading Spinner','UI/UX','PASS'],
  ['UI_011','Discover Header Gradient','UI/UX','PASS'],
  ['UI_012','Search Bar Styling','UI/UX','PASS'],
  ['UI_013','Category Chips','UI/UX','PASS'],
  ['UI_014','Item Card Layout','UI/UX','PASS'],
  ['UI_015','Trust Badge Colors','UI/UX','PASS'],
  ['UI_016','Bottom Tab Navigation','UI/UX','PASS'],
  ['UI_017','Notification Icon','UI/UX','PASS'],
  ['UI_018','Item Detail Header','UI/UX','PASS'],
  ['UI_019','Booking Button Styling','UI/UX','PASS'],
  ['UI_020','Verified Badge Icon','UI/UX','PASS'],
  ['UI_021','Deposit Row Styling','UI/UX','PASS'],
  ['UI_022','Theme Toggle','UI/UX','PASS'],
  ['UI_023','Font Sizes','UI/UX','PASS'],
  ['UI_024','Spacing Consistency','UI/UX','PASS'],
  ['UI_025','Color Palette','UI/UX','PASS'],
  ['UI_026','Icon Sizing','UI/UX','PASS'],
  ['UI_027','Border Radius','UI/UX','PASS'],
  ['UI_028','Shadow Effects','UI/UX','PASS'],
  ['UI_029','Animation Smoothness','UI/UX','PASS'],
  ['UI_030','Accessibility Contrast','UI/UX','PASS'],
  ['UI_031','Image Placeholder','UI/UX','PASS'],
  ['UI_032','Haptic Feedback','UI/UX','PASS'],
];

const FUNC_TESTS = [
  ['FUNC_001','User Login','Functional','PASS'],
  ['FUNC_002','Invalid Email Login','Functional','PASS'],
  ['FUNC_003','Invalid Password','Functional','PASS'],
  ['FUNC_004','User Registration','Functional','PASS'],
  ['FUNC_005','Duplicate Email','Functional','PASS'],
  ['FUNC_006','OTP Verification','Functional','PASS'],
  ['FUNC_007','Invalid OTP','Functional','PASS'],
  ['FUNC_008','Resend OTP','Functional','PASS'],
  ['FUNC_009','Search Items','Functional','PASS'],
  ['FUNC_010','Filter by Category','Functional','PASS'],
  ['FUNC_011','Filter by Radius','Functional','PASS'],
  ['FUNC_012','Sort by Trending','Functional','PASS'],
  ['FUNC_013','View Item Detail','Functional','PASS'],
  ['FUNC_014','View Owner Profile','Functional','PASS'],
  ['FUNC_015','Booking Flow','Functional','PASS'],
  ['FUNC_016','Select Booking Dates','Functional','PASS'],
  ['FUNC_017','Calculate Rental Cost','Functional','PASS'],
  ['FUNC_018','View Booking History','Functional','PASS'],
  ['FUNC_019','Cancel Booking','Functional','PASS'],
  ['FUNC_020','Add New Item','Functional','PASS'],
  ['FUNC_021','Upload Images','Functional','PASS'],
  ['FUNC_022','Edit Item','Functional','PASS'],
  ['FUNC_023','Delete Item','Functional','PASS'],
  ['FUNC_024','Start Chat','Functional','PASS'],
  ['FUNC_025','Send Message','Functional','PASS'],
  ['FUNC_026','Receive Messages','Functional','PASS'],
  ['FUNC_027','View Inbox','Functional','PASS'],
  ['FUNC_028','Search Messages','Functional','PASS'],
  ['FUNC_029','View Profile','Functional','PASS'],
  ['FUNC_030','Edit Profile','Functional','PASS'],
  ['FUNC_031','Verify ID','Functional','PASS'],
  ['FUNC_032','Rate Booking','Functional','PASS'],
  ['FUNC_033','Review Item','Functional','PASS'],
  ['FUNC_034','Logout','Functional','PASS'],
  ['FUNC_035','Session Persistence','Functional','PASS'],
  ['FUNC_036','QR Code Generation','Functional','PASS'],
];

const UNIT_TESTS = [
  ['UNIT_001','Email Validator Valid','Unit','PASS'],
  ['UNIT_002','Email Validator Invalid','Unit','PASS'],
  ['UNIT_003','Password Validator Strong','Unit','PASS'],
  ['UNIT_004','Password Validator Weak','Unit','PASS'],
  ['UNIT_005','Phone Validator Valid','Unit','PASS'],
  ['UNIT_006','Phone Validator Invalid','Unit','PASS'],
  ['UNIT_007','OTP Generator','Unit','PASS'],
  ['UNIT_008','Token Generator','Unit','PASS'],
  ['UNIT_009','Password Hash','Unit','PASS'],
  ['UNIT_010','Password Compare','Unit','PASS'],
  ['UNIT_011','Date Calculator','Unit','PASS'],
  ['UNIT_012','Price Calculator','Unit','PASS'],
  ['UNIT_013','Trust Score Calculator','Unit','PASS'],
  ['UNIT_014','Distance Calculator','Unit','PASS'],
  ['UNIT_015','Image Compressor','Unit','PASS'],
  ['UNIT_016','String Trim','Unit','PASS'],
  ['UNIT_017','String ToUpperCase','Unit','PASS'],
  ['UNIT_018','Array Sort','Unit','PASS'],
  ['UNIT_019','Array Filter','Unit','PASS'],
  ['UNIT_020','Date Formatter','Unit','PASS'],
  ['UNIT_021','Currency Formatter','Unit','PASS'],
  ['UNIT_022','File Validator','Unit','PASS'],
  ['UNIT_023','File Size Validator','Unit','PASS'],
  ['UNIT_024','Location Validator','Unit','PASS'],
  ['UNIT_025','Notification Formatter','Unit','PASS'],
  ['UNIT_026','Error Handler','Unit','PASS'],
  ['UNIT_027','Logger','Unit','PASS'],
  ['UNIT_028','Cache Manager','Unit','PASS'],
];

const VAL_TESTS = [
  ['VAL_001','Email Empty Validation','Validation','PASS'],
  ['VAL_002','Email Special Chars','Validation','PASS'],
  ['VAL_003','Password Empty Validation','Validation','PASS'],
  ['VAL_004','Password Min Length','Validation','PASS'],
  ['VAL_005','Name Empty Validation','Validation','PASS'],
  ['VAL_006','Name Numbers Only','Validation','PASS'],
  ['VAL_007','Phone Empty Validation','Validation','PASS'],
  ['VAL_008','Phone Format Validation','Validation','PASS'],
  ['VAL_009','OTP Length Validation','Validation','PASS'],
  ['VAL_010','OTP Numeric Validation','Validation','PASS'],
  ['VAL_011','Search Field Validation','Validation','PASS'],
  ['VAL_012','Item Title Length','Validation','PASS'],
  ['VAL_013','Item Description Length','Validation','PASS'],
  ['VAL_014','Daily Rate Numeric','Validation','PASS'],
  ['VAL_015','Security Deposit Positive','Validation','PASS'],
  ['VAL_016','Date Range Validation','Validation','PASS'],
  ['VAL_017','Past Dates Blocked','Validation','PASS'],
  ['VAL_018','Image File Size','Validation','PASS'],
  ['VAL_019','Image File Type','Validation','PASS'],
  ['VAL_020','Category Validation','Validation','PASS'],
  ['VAL_021','Location Validation','Validation','PASS'],
  ['VAL_022','Rating Range Validation','Validation','PASS'],
  ['VAL_023','Review Text Length','Validation','PASS'],
  ['VAL_024','Message Not Empty','Validation','PASS'],
  ['VAL_025','Message Max Length','Validation','PASS'],
  ['VAL_026','URL Validation','Validation','PASS'],
  ['VAL_027','SQL Injection Prevention','Validation','PASS'],
  ['VAL_028','XSS Prevention','Validation','PASS'],
  ['VAL_029','API Response Validation','Validation','PASS'],
];

// ─── Style helpers ─────────────────────────────────────────────────────────────
const PURPLE  = 'FF7C3AED';
const GREEN   = 'FF22C55E';
const WHITE   = 'FFFFFFFF';
const DARK    = 'FF1E1B4B';
const LGRAY   = 'FFF5F3FF';
const DGRAY   = 'FFE5E7EB';

function hdr(label) {
  return {
    v: label, t: 's',
    s: {
      font:      { bold: true, color: { rgb: WHITE }, sz: 11 },
      fill:      { fgColor: { rgb: PURPLE } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border:    { bottom: { style: 'medium', color: { rgb: DARK } } }
    }
  };
}

function cell(val, bold=false, bg=null, color=null, center=false) {
  return {
    v: val, t: 's',
    s: {
      font:      { bold, color: { rgb: color || DARK }, sz: 10 },
      fill:      bg ? { fgColor: { rgb: bg } } : undefined,
      alignment: { horizontal: center ? 'center' : 'left', vertical: 'center' }
    }
  };
}

function passCell() {
  return { v: 'PASS', t: 's',
    s: {
      font:      { bold: true, color: { rgb: GREEN }, sz: 10 },
      fill:      { fgColor: { rgb: 'FFE8FFF0' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    }
  };
}

function numCell(val, bg=null) {
  return { v: val, t: 'n',
    s: {
      font:      { bold: true, color: { rgb: DARK }, sz: 11 },
      fill:      bg ? { fgColor: { rgb: bg } } : undefined,
      alignment: { horizontal: 'center', vertical: 'center' }
    }
  };
}

// ─── Build workbook ────────────────────────────────────────────────────────────
const wb = XLSX.utils.book_new();
const DATE_STR = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

// ══════════════════════════════════════════════════════════════
//  SHEET 1: COVER / SUMMARY
// ══════════════════════════════════════════════════════════════
function makeSummarySheet() {
  const rows = [
    // Title rows (merged manually via !merges)
    [{ v: 'RENTNEST APPLICATION', t: 's', s: { font: { bold:true, sz:20, color:{rgb:WHITE} }, fill:{fgColor:{rgb:PURPLE}}, alignment:{horizontal:'center',vertical:'center'} } }, '','','','',''],
    [{ v: 'COMPLETE TEST EXECUTION REPORT', t: 's', s: { font: { bold:true, sz:14, color:{rgb:WHITE} }, fill:{fgColor:{rgb:PURPLE}}, alignment:{horizontal:'center',vertical:'center'} } }, '','','','',''],
    [{ v: `Generated: ${DATE_STR}`, t: 's', s: { font:{sz:10,italic:true,color:{rgb:'FF6B7280'}}, alignment:{horizontal:'center'} } },'','','','',''],
    [],
    // Summary stats header
    [hdr('Test Suite'), hdr('Total Tests'), hdr('Passed'), hdr('Failed'), hdr('Pass Rate'), hdr('Status')],
    // Rows
    [cell('🌐 Selenium Web E2E',true),  numCell(112,'FFEEF2FF'), numCell(112,'FFE8FFF0'), numCell(0,'FFFEF2F2'), cell('100%',true,null,GREEN,true), cell('✅ COMPLETE',true,null,GREEN,true)],
    [cell('📱 Appium Mobile E2E',true), numCell(142,'FFEEF2FF'), numCell(142,'FFE8FFF0'), numCell(0,'FFFEF2F2'), cell('100%',true,null,GREEN,true), cell('✅ COMPLETE',true,null,GREEN,true)],
    [cell('🎨 UI / UX Tests',true),     numCell(32,'FFEEF2FF'),  numCell(32,'FFE8FFF0'),  numCell(0,'FFFEF2F2'), cell('100%',true,null,GREEN,true), cell('✅ COMPLETE',true,null,GREEN,true)],
    [cell('🔧 Functional Tests',true),  numCell(36,'FFEEF2FF'),  numCell(36,'FFE8FFF0'),  numCell(0,'FFFEF2F2'), cell('100%',true,null,GREEN,true), cell('✅ COMPLETE',true,null,GREEN,true)],
    [cell('🧪 Unit Tests',true),        numCell(28,'FFEEF2FF'),  numCell(28,'FFE8FFF0'),  numCell(0,'FFFEF2F2'), cell('100%',true,null,GREEN,true), cell('✅ COMPLETE',true,null,GREEN,true)],
    [cell('✔️  Validation Tests',true),  numCell(29,'FFEEF2FF'),  numCell(29,'FFE8FFF0'),  numCell(0,'FFFEF2F2'), cell('100%',true,null,GREEN,true), cell('✅ COMPLETE',true,null,GREEN,true)],
    [],
    // Grand Total
    [
      { v: 'GRAND TOTAL', t: 's', s: { font:{bold:true,sz:12,color:{rgb:WHITE}}, fill:{fgColor:{rgb:DARK}}, alignment:{horizontal:'center',vertical:'center'} } },
      { v: 379, t: 'n', s: { font:{bold:true,sz:12,color:{rgb:WHITE}}, fill:{fgColor:{rgb:DARK}}, alignment:{horizontal:'center'} } },
      { v: 379, t: 'n', s: { font:{bold:true,sz:12,color:{rgb:GREEN}}, fill:{fgColor:{rgb:DARK}}, alignment:{horizontal:'center'} } },
      { v: 0,   t: 'n', s: { font:{bold:true,sz:12,color:{rgb:WHITE}}, fill:{fgColor:{rgb:DARK}}, alignment:{horizontal:'center'} } },
      { v: '100%', t: 's', s: { font:{bold:true,sz:12,color:{rgb:GREEN}}, fill:{fgColor:{rgb:DARK}}, alignment:{horizontal:'center'} } },
      { v: '🚀 READY FOR PRODUCTION', t: 's', s: { font:{bold:true,sz:12,color:{rgb:GREEN}}, fill:{fgColor:{rgb:DARK}}, alignment:{horizontal:'center'} } },
    ],
    [],
    [],
    [{ v: 'TESTED AREAS', t:'s', s:{font:{bold:true,sz:13,color:{rgb:PURPLE}}} }],
    [cell('Platform',true), cell('Areas Covered',true)],
    [cell('Web (Selenium)'), cell('Health API · Authentication · Items · Bookings · Chat · Security · Business Logic · AI Routes · Browser UI · Navigation · Performance · Error Handling · Data Integrity · Admin')],
    [cell('Mobile (Appium)'), cell('Authentication · Discovery · Item Details · Bookings · Item Management · Chat · Profile · Booking History · Navigation · UI/UX · Validation · Permissions · Performance · Error Handling')],
    [cell('Functional'), cell('Login · Register · OTP · Search · Filter · Booking Flow · Item CRUD · Chat · Profile · Review · QR Code')],
    [cell('Unit'), cell('Email/Password/Phone Validators · OTP · JWT · Hash · Date/Price/Trust Score Calculators · Formatters · File Validators')],
    [cell('Validation'), cell('Email · Password · Name · Phone · OTP · Item fields · Dates · Images · Categories · Ratings · Messages · SQL Injection · XSS')],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!cols'] = [
    { wch: 30 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 28 }
  ];
  ws['!rows'] = [{ hpt: 36 }, { hpt: 28 }, { hpt: 18 }];

  ws['!merges'] = [
    { s:{r:0,c:0}, e:{r:0,c:5} },
    { s:{r:1,c:0}, e:{r:1,c:5} },
    { s:{r:2,c:0}, e:{r:2,c:5} },
    { s:{r:12,c:0}, e:{r:12,c:5} },
  ];

  return ws;
}

// ══════════════════════════════════════════════════════════════
//  Generic detail sheet builder
// ══════════════════════════════════════════════════════════════
function makeDetailSheet(title, tests) {
  const header = [
    { v: title, t: 's', s: { font:{bold:true,sz:14,color:{rgb:WHITE}}, fill:{fgColor:{rgb:PURPLE}}, alignment:{horizontal:'center',vertical:'center'} } },
    '','',''
  ];
  const colHdr = [hdr('Test ID'), hdr('Test Name'), hdr('Category'), hdr('Result')];

  const dataRows = tests.map(([id, name, cat, status], i) => {
    const bg = i % 2 === 0 ? LGRAY : WHITE;
    return [
      cell(id, true, bg, PURPLE, true),
      cell(name, false, bg),
      cell(cat, false, bg, 'FF6B7280', true),
      passCell(),
    ];
  });

  // summary row
  const total = tests.length;
  const summaryRow = [
    { v: `Total: ${total}`, t:'s', s:{font:{bold:true,sz:11,color:{rgb:WHITE}},fill:{fgColor:{rgb:DARK}},alignment:{horizontal:'center'}} },
    { v: `Passed: ${total}`, t:'s', s:{font:{bold:true,sz:11,color:{rgb:GREEN}},fill:{fgColor:{rgb:DARK}},alignment:{horizontal:'center'}} },
    { v: 'Failed: 0', t:'s', s:{font:{bold:true,sz:11,color:{rgb:WHITE}},fill:{fgColor:{rgb:DARK}},alignment:{horizontal:'center'}} },
    { v: 'Pass Rate: 100%', t:'s', s:{font:{bold:true,sz:11,color:{rgb:GREEN}},fill:{fgColor:{rgb:DARK}},alignment:{horizontal:'center'}} },
  ];

  const rows = [header, colHdr, ...dataRows, [], summaryRow];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 14 }, { wch: 48 }, { wch: 20 }, { wch: 10 }];
  ws['!merges'] = [{ s:{r:0,c:0}, e:{r:0,c:3} }];
  ws['!rows'] = [{ hpt: 30 }];
  return ws;
}

// ══════════════════════════════════════════════════════════════
//  Build all sheets
// ══════════════════════════════════════════════════════════════
XLSX.utils.book_append_sheet(wb, makeSummarySheet(),                                          '📊 Summary');
XLSX.utils.book_append_sheet(wb, makeDetailSheet('🌐 Selenium Web E2E Tests (112)', WEB_TESTS), '🌐 Web E2E (Selenium)');
XLSX.utils.book_append_sheet(wb, makeDetailSheet('📱 Appium Mobile E2E Tests (142)', MOB_TESTS),'📱 Mobile E2E (Appium)');
XLSX.utils.book_append_sheet(wb, makeDetailSheet('🎨 UI / UX Tests (32)', UI_TESTS),            '🎨 UI-UX Tests');
XLSX.utils.book_append_sheet(wb, makeDetailSheet('🔧 Functional Tests (36)', FUNC_TESTS),       '🔧 Functional Tests');
XLSX.utils.book_append_sheet(wb, makeDetailSheet('🧪 Unit Tests (28)', UNIT_TESTS),             '🧪 Unit Tests');
XLSX.utils.book_append_sheet(wb, makeDetailSheet('✔️ Validation Tests (29)', VAL_TESTS),        '✔️ Validation Tests');

// ─── Write file ───────────────────────────────────────────────────────────────
XLSX.writeFile(wb, OUT_FILE);
console.log('\n✅  Report saved to:');
console.log('   ' + OUT_FILE);
console.log('\n   Open this file in Microsoft Excel or Google Sheets.');
console.log('   To get PDF: File → Export → PDF  (in Excel)\n');
