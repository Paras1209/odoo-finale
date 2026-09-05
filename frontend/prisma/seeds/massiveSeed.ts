// ===========================================
// DealFlow360 - Massive Seed Data Generator
// ===========================================
// Generates 250+ entries for each table in the database
// for comprehensive testing and demo purposes.
// ===========================================

import { PrismaClient, UserRole, CustomerTier, ProductCategory, QuotationStatus, LineType, BillingFrequency, ApprovalLevel, ApprovalStatus, FulfillmentStatus, ProrationRule, BillingScheduleStatus, InvoiceType, InvoiceStatus, CreditNoteStatus, ActorType, CounterOfferStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

// Helper functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateEmail(prefix: string, index: number): string {
  const domains = ['company.com', 'business.org', 'enterprise.net', 'corp.io', 'tech.co'];
  return `${prefix}${index}@${randomChoice(domains)}`;
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Data generators
const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle', 'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa', 'Edward', 'Deborah'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];
const companyPrefixes = ['Acme', 'Global', 'United', 'Premier', 'Elite', 'Dynamic', 'Innovative', 'Strategic', 'Advanced', 'Pro', 'Tech', 'Digital', 'Smart', 'Next', 'Peak', 'Prime', 'Apex', 'Core', 'Nova', 'Stellar', 'Quantum', 'Fusion', 'Synergy', 'Velocity', 'Momentum'];
const companySuffixes = ['Corp', 'Inc', 'LLC', 'Industries', 'Solutions', 'Systems', 'Technologies', 'Enterprises', 'Group', 'Holdings', 'Partners', 'Services', 'Consulting', 'International', 'Dynamics'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Boston', 'El Paso', 'Nashville', 'Detroit', 'Portland', 'Memphis', 'Oklahoma City', 'Las Vegas', 'Louisville', 'Baltimore', 'Milwaukee'];
const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'FL', 'OH', 'NC', 'WA', 'CO', 'MA', 'TN', 'MI', 'OR', 'NV', 'KY', 'MD', 'WI', 'MN'];

const hardwareProducts = [
  { name: 'ProBook Laptop 13"', sku: 'HW-LAPTOP-13', costPrice: 650, salePrice: 999 },
  { name: 'ProBook Laptop 15"', sku: 'HW-LAPTOP-15', costPrice: 800, salePrice: 1299 },
  { name: 'ProBook Laptop 17"', sku: 'HW-LAPTOP-17', costPrice: 950, salePrice: 1599 },
  { name: 'UltraBook Air', sku: 'HW-ULTRA-AIR', costPrice: 1100, salePrice: 1799 },
  { name: 'WorkStation Pro', sku: 'HW-WS-PRO', costPrice: 2000, salePrice: 3499 },
  { name: '24" Monitor HD', sku: 'HW-MON-24HD', costPrice: 150, salePrice: 279 },
  { name: '27" Monitor 4K', sku: 'HW-MON-27-4K', costPrice: 300, salePrice: 549 },
  { name: '32" Monitor 4K', sku: 'HW-MON-32-4K', costPrice: 450, salePrice: 799 },
  { name: '34" Ultrawide Monitor', sku: 'HW-MON-34UW', costPrice: 550, salePrice: 999 },
  { name: '49" Super Ultrawide', sku: 'HW-MON-49SUW', costPrice: 900, salePrice: 1499 },
  { name: 'Mechanical Keyboard RGB', sku: 'HW-KB-RGB', costPrice: 55, salePrice: 119 },
  { name: 'Wireless Keyboard', sku: 'HW-KB-WIRELESS', costPrice: 35, salePrice: 79 },
  { name: 'Ergonomic Keyboard', sku: 'HW-KB-ERGO', costPrice: 80, salePrice: 159 },
  { name: 'Gaming Keyboard', sku: 'HW-KB-GAME', costPrice: 90, salePrice: 179 },
  { name: 'Compact Keyboard', sku: 'HW-KB-COMPACT', costPrice: 40, salePrice: 89 },
  { name: 'Wireless Mouse', sku: 'HW-MOUSE-WIRELESS', costPrice: 25, salePrice: 59 },
  { name: 'Gaming Mouse', sku: 'HW-MOUSE-GAME', costPrice: 45, salePrice: 99 },
  { name: 'Ergonomic Mouse', sku: 'HW-MOUSE-ERGO', costPrice: 50, salePrice: 109 },
  { name: 'Trackball Mouse', sku: 'HW-MOUSE-TRACK', costPrice: 60, salePrice: 129 },
  { name: 'Vertical Mouse', sku: 'HW-MOUSE-VERT', costPrice: 40, salePrice: 89 },
  { name: 'USB Hub 7-Port', sku: 'HW-HUB-7P', costPrice: 20, salePrice: 49 },
  { name: 'USB-C Dock', sku: 'HW-DOCK-USBC', costPrice: 100, salePrice: 199 },
  { name: 'Thunderbolt Dock', sku: 'HW-DOCK-TB', costPrice: 180, salePrice: 349 },
  { name: 'Laptop Stand', sku: 'HW-STAND-LAPTOP', costPrice: 30, salePrice: 69 },
  { name: 'Monitor Arm Single', sku: 'HW-ARM-SINGLE', costPrice: 50, salePrice: 119 },
  { name: 'Monitor Arm Dual', sku: 'HW-ARM-DUAL', costPrice: 90, salePrice: 189 },
  { name: 'Webcam HD', sku: 'HW-CAM-HD', costPrice: 40, salePrice: 89 },
  { name: 'Webcam 4K', sku: 'HW-CAM-4K', costPrice: 100, salePrice: 199 },
  { name: 'Conference Camera', sku: 'HW-CAM-CONF', costPrice: 300, salePrice: 599 },
  { name: 'USB Microphone', sku: 'HW-MIC-USB', costPrice: 60, salePrice: 129 },
  { name: 'Headset Wireless', sku: 'HW-HEADSET-WIRELESS', costPrice: 80, salePrice: 169 },
  { name: 'Headset Wired', sku: 'HW-HEADSET-WIRED', costPrice: 40, salePrice: 89 },
  { name: 'Noise Canceling Headphones', sku: 'HW-HP-NC', costPrice: 150, salePrice: 299 },
  { name: 'Desktop PC Standard', sku: 'HW-PC-STD', costPrice: 500, salePrice: 899 },
  { name: 'Desktop PC Performance', sku: 'HW-PC-PERF', costPrice: 900, salePrice: 1599 },
  { name: 'Desktop PC Workstation', sku: 'HW-PC-WS', costPrice: 1500, salePrice: 2699 },
  { name: 'Mini PC', sku: 'HW-PC-MINI', costPrice: 350, salePrice: 649 },
  { name: 'Server Tower', sku: 'HW-SERVER-TWR', costPrice: 2500, salePrice: 4499 },
  { name: 'Server Rack 1U', sku: 'HW-SERVER-1U', costPrice: 3000, salePrice: 5499 },
  { name: 'Network Switch 8-Port', sku: 'HW-SW-8P', costPrice: 40, salePrice: 89 },
  { name: 'Network Switch 24-Port', sku: 'HW-SW-24P', costPrice: 150, salePrice: 299 },
  { name: 'Network Switch 48-Port', sku: 'HW-SW-48P', costPrice: 350, salePrice: 699 },
  { name: 'WiFi Router', sku: 'HW-WIFI-RTR', costPrice: 80, salePrice: 169 },
  { name: 'WiFi Mesh System', sku: 'HW-WIFI-MESH', costPrice: 200, salePrice: 399 },
  { name: 'Access Point', sku: 'HW-AP', costPrice: 100, salePrice: 199 },
  { name: 'NAS 2-Bay', sku: 'HW-NAS-2B', costPrice: 200, salePrice: 399 },
  { name: 'NAS 4-Bay', sku: 'HW-NAS-4B', costPrice: 400, salePrice: 799 },
  { name: 'External SSD 1TB', sku: 'HW-SSD-EXT-1T', costPrice: 80, salePrice: 159 },
  { name: 'External SSD 2TB', sku: 'HW-SSD-EXT-2T', costPrice: 150, salePrice: 299 },
  { name: 'External HDD 4TB', sku: 'HW-HDD-EXT-4T', costPrice: 80, salePrice: 149 },
  { name: 'UPS 650VA', sku: 'HW-UPS-650', costPrice: 60, salePrice: 119 },
  { name: 'UPS 1500VA', sku: 'HW-UPS-1500', costPrice: 150, salePrice: 299 },
  { name: 'Printer Laser BW', sku: 'HW-PRN-LBW', costPrice: 150, salePrice: 299 },
  { name: 'Printer Laser Color', sku: 'HW-PRN-LC', costPrice: 300, salePrice: 599 },
  { name: 'Printer Inkjet', sku: 'HW-PRN-INK', costPrice: 80, salePrice: 169 },
  { name: 'Scanner Flatbed', sku: 'HW-SCAN-FLAT', costPrice: 150, salePrice: 299 },
  { name: 'Document Scanner', sku: 'HW-SCAN-DOC', costPrice: 250, salePrice: 499 },
  { name: 'Graphics Tablet Small', sku: 'HW-TABLET-S', costPrice: 50, salePrice: 99 },
  { name: 'Graphics Tablet Medium', sku: 'HW-TABLET-M', costPrice: 150, salePrice: 299 },
  { name: 'Graphics Tablet Large', sku: 'HW-TABLET-L', costPrice: 350, salePrice: 699 },
  { name: 'Drawing Display', sku: 'HW-DISPLAY-DRAW', costPrice: 600, salePrice: 1199 },
  { name: 'KVM Switch 2-Port', sku: 'HW-KVM-2P', costPrice: 40, salePrice: 89 },
  { name: 'KVM Switch 4-Port', sku: 'HW-KVM-4P', costPrice: 100, salePrice: 199 },
  { name: 'Cable HDMI 2m', sku: 'HW-CBL-HDMI-2', costPrice: 5, salePrice: 15 },
  { name: 'Cable USB-C 1m', sku: 'HW-CBL-USBC-1', costPrice: 8, salePrice: 19 },
  { name: 'Cable DisplayPort 2m', sku: 'HW-CBL-DP-2', costPrice: 10, salePrice: 24 },
  { name: 'Cable Ethernet Cat6 3m', sku: 'HW-CBL-ETH-3', costPrice: 5, salePrice: 12 },
  { name: 'Surge Protector 6-Outlet', sku: 'HW-SURGE-6', costPrice: 15, salePrice: 34 },
  { name: 'Power Strip 8-Outlet', sku: 'HW-PWR-8', costPrice: 20, salePrice: 44 },
  { name: 'Desk Mat Large', sku: 'HW-MAT-L', costPrice: 15, salePrice: 34 },
  { name: 'Cable Management Kit', sku: 'HW-CBL-MGMT', costPrice: 20, salePrice: 44 },
  { name: 'Privacy Screen 24"', sku: 'HW-PRIV-24', costPrice: 40, salePrice: 89 },
  { name: 'Privacy Screen 27"', sku: 'HW-PRIV-27', costPrice: 50, salePrice: 109 },
  { name: 'Laptop Bag 15"', sku: 'HW-BAG-15', costPrice: 30, salePrice: 69 },
  { name: 'Laptop Backpack', sku: 'HW-BACKPACK', costPrice: 50, salePrice: 109 },
  { name: 'Tablet Stand', sku: 'HW-STAND-TAB', costPrice: 20, salePrice: 44 },
  { name: 'Phone Mount Desk', sku: 'HW-MOUNT-PHONE', costPrice: 15, salePrice: 34 },
  { name: 'Wireless Charger', sku: 'HW-CHRG-WIRELESS', costPrice: 20, salePrice: 44 },
  { name: 'USB Charger 4-Port', sku: 'HW-CHRG-USB4', costPrice: 25, salePrice: 54 },
  { name: 'Portable Battery 20000mAh', sku: 'HW-BATT-20K', costPrice: 35, salePrice: 79 },
  { name: 'Smart Speaker', sku: 'HW-SPKR-SMART', costPrice: 50, salePrice: 109 },
  { name: 'Bluetooth Speaker', sku: 'HW-SPKR-BT', costPrice: 40, salePrice: 89 },
  { name: 'USB Speakerphone', sku: 'HW-SPKR-CONF', costPrice: 100, salePrice: 199 },
];

const serviceProducts = [
  { name: 'Professional Setup Service', sku: 'SVC-SETUP-PRO', costPrice: 75, salePrice: 199, unit: 'hour' },
  { name: 'Basic Setup Service', sku: 'SVC-SETUP-BASIC', costPrice: 40, salePrice: 99, unit: 'hour' },
  { name: 'Enterprise Setup Service', sku: 'SVC-SETUP-ENT', costPrice: 150, salePrice: 399, unit: 'hour' },
  { name: 'User Training - Individual', sku: 'SVC-TRAIN-IND', costPrice: 50, salePrice: 149, unit: 'session' },
  { name: 'User Training - Group', sku: 'SVC-TRAIN-GRP', costPrice: 150, salePrice: 399, unit: 'session' },
  { name: 'Admin Training', sku: 'SVC-TRAIN-ADMIN', costPrice: 200, salePrice: 499, unit: 'session' },
  { name: 'Technical Training', sku: 'SVC-TRAIN-TECH', costPrice: 250, salePrice: 599, unit: 'session' },
  { name: 'Executive Training', sku: 'SVC-TRAIN-EXEC', costPrice: 300, salePrice: 799, unit: 'session' },
  { name: 'Priority Support - Incident', sku: 'SVC-SUPPORT-PRI', costPrice: 50, salePrice: 149, unit: 'incident' },
  { name: 'Standard Support - Incident', sku: 'SVC-SUPPORT-STD', costPrice: 25, salePrice: 79, unit: 'incident' },
  { name: 'Emergency Support - Incident', sku: 'SVC-SUPPORT-EMG', costPrice: 150, salePrice: 399, unit: 'incident' },
  { name: 'On-Site Support - Day', sku: 'SVC-ONSITE-DAY', costPrice: 400, salePrice: 999, unit: 'day' },
  { name: 'On-Site Support - Half Day', sku: 'SVC-ONSITE-HALF', costPrice: 200, salePrice: 549, unit: 'session' },
  { name: 'Remote Consultation', sku: 'SVC-CONSULT-REM', costPrice: 100, salePrice: 249, unit: 'hour' },
  { name: 'On-Site Consultation', sku: 'SVC-CONSULT-SITE', costPrice: 200, salePrice: 499, unit: 'hour' },
  { name: 'Architecture Review', sku: 'SVC-ARCH-REVIEW', costPrice: 500, salePrice: 1299, unit: 'session' },
  { name: 'Security Audit', sku: 'SVC-SEC-AUDIT', costPrice: 800, salePrice: 1999, unit: 'audit' },
  { name: 'Performance Audit', sku: 'SVC-PERF-AUDIT', costPrice: 600, salePrice: 1499, unit: 'audit' },
  { name: 'Compliance Review', sku: 'SVC-COMP-REVIEW', costPrice: 700, salePrice: 1799, unit: 'review' },
  { name: 'Data Migration - Basic', sku: 'SVC-MIGRATE-BASIC', costPrice: 300, salePrice: 799, unit: 'project' },
  { name: 'Data Migration - Advanced', sku: 'SVC-MIGRATE-ADV', costPrice: 800, salePrice: 1999, unit: 'project' },
  { name: 'System Integration', sku: 'SVC-INTEGRATE', costPrice: 1000, salePrice: 2499, unit: 'project' },
  { name: 'Custom Development - Hour', sku: 'SVC-DEV-HR', costPrice: 80, salePrice: 199, unit: 'hour' },
  { name: 'Custom Development - Day', sku: 'SVC-DEV-DAY', costPrice: 600, salePrice: 1499, unit: 'day' },
  { name: 'API Development', sku: 'SVC-API-DEV', costPrice: 500, salePrice: 1249, unit: 'project' },
  { name: 'Installation Service', sku: 'SVC-INSTALL', costPrice: 100, salePrice: 249, unit: 'unit' },
  { name: 'Configuration Service', sku: 'SVC-CONFIG', costPrice: 75, salePrice: 179, unit: 'hour' },
  { name: 'Troubleshooting Service', sku: 'SVC-TROUBLE', costPrice: 60, salePrice: 149, unit: 'hour' },
  { name: 'Backup Setup', sku: 'SVC-BACKUP', costPrice: 150, salePrice: 349, unit: 'setup' },
  { name: 'Disaster Recovery Plan', sku: 'SVC-DR-PLAN', costPrice: 400, salePrice: 999, unit: 'plan' },
  { name: 'Network Assessment', sku: 'SVC-NET-ASSESS', costPrice: 300, salePrice: 749, unit: 'assessment' },
  { name: 'Network Design', sku: 'SVC-NET-DESIGN', costPrice: 500, salePrice: 1249, unit: 'project' },
  { name: 'Cable Installation', sku: 'SVC-CABLE', costPrice: 50, salePrice: 129, unit: 'point' },
  { name: 'Server Setup', sku: 'SVC-SERVER', costPrice: 300, salePrice: 749, unit: 'server' },
  { name: 'Cloud Migration', sku: 'SVC-CLOUD-MIG', costPrice: 600, salePrice: 1499, unit: 'project' },
  { name: 'Software Licensing Consultation', sku: 'SVC-LIC-CONSULT', costPrice: 100, salePrice: 249, unit: 'hour' },
  { name: 'Warranty Extension', sku: 'SVC-WARRANTY', costPrice: 50, salePrice: 129, unit: 'year' },
  { name: 'Asset Tagging', sku: 'SVC-ASSET-TAG', costPrice: 5, salePrice: 15, unit: 'unit' },
  { name: 'Asset Disposal', sku: 'SVC-ASSET-DISPOSE', costPrice: 20, salePrice: 49, unit: 'unit' },
  { name: 'E-Waste Recycling', sku: 'SVC-EWASTE', costPrice: 15, salePrice: 39, unit: 'unit' },
  { name: 'Project Management - Week', sku: 'SVC-PM-WEEK', costPrice: 1000, salePrice: 2499, unit: 'week' },
  { name: 'Project Management - Month', sku: 'SVC-PM-MONTH', costPrice: 3500, salePrice: 8999, unit: 'month' },
  { name: 'Technical Writing', sku: 'SVC-TECH-WRITE', costPrice: 75, salePrice: 189, unit: 'hour' },
  { name: 'Documentation Service', sku: 'SVC-DOCS', costPrice: 60, salePrice: 149, unit: 'hour' },
  { name: 'Video Production - Training', sku: 'SVC-VIDEO-TRAIN', costPrice: 500, salePrice: 1249, unit: 'video' },
];

const subscriptionProducts = [
  { name: 'Cloud Storage - 100GB', sku: 'SUB-CLOUD-100', costPrice: 3, salePrice: 7.99, unit: 'month' },
  { name: 'Cloud Storage - 500GB', sku: 'SUB-CLOUD-500', costPrice: 8, salePrice: 19.99, unit: 'month' },
  { name: 'Cloud Storage - 1TB', sku: 'SUB-CLOUD-1T', costPrice: 15, salePrice: 34.99, unit: 'month' },
  { name: 'Cloud Storage - 5TB', sku: 'SUB-CLOUD-5T', costPrice: 40, salePrice: 89.99, unit: 'month' },
  { name: 'Cloud Storage - 10TB', sku: 'SUB-CLOUD-10T', costPrice: 70, salePrice: 149.99, unit: 'month' },
  { name: 'Security Suite - Basic', sku: 'SUB-SEC-BASIC', costPrice: 5, salePrice: 12.99, unit: 'month' },
  { name: 'Security Suite - Pro', sku: 'SUB-SEC-PRO', costPrice: 15, salePrice: 34.99, unit: 'month' },
  { name: 'Security Suite - Enterprise', sku: 'SUB-SEC-ENT', costPrice: 40, salePrice: 89.99, unit: 'month' },
  { name: 'Email Hosting - Basic', sku: 'SUB-EMAIL-BASIC', costPrice: 2, salePrice: 5.99, unit: 'month' },
  { name: 'Email Hosting - Business', sku: 'SUB-EMAIL-BUS', costPrice: 5, salePrice: 12.99, unit: 'month' },
  { name: 'Email Hosting - Enterprise', sku: 'SUB-EMAIL-ENT', costPrice: 10, salePrice: 24.99, unit: 'month' },
  { name: 'Collaboration Suite - Starter', sku: 'SUB-COLLAB-START', costPrice: 5, salePrice: 12.99, unit: 'month' },
  { name: 'Collaboration Suite - Team', sku: 'SUB-COLLAB-TEAM', costPrice: 12, salePrice: 29.99, unit: 'month' },
  { name: 'Collaboration Suite - Business', sku: 'SUB-COLLAB-BUS', costPrice: 20, salePrice: 49.99, unit: 'month' },
  { name: 'Project Management - Free', sku: 'SUB-PM-FREE', costPrice: 0, salePrice: 0, unit: 'month' },
  { name: 'Project Management - Pro', sku: 'SUB-PM-PRO', costPrice: 8, salePrice: 19.99, unit: 'month' },
  { name: 'Project Management - Business', sku: 'SUB-PM-BUS', costPrice: 20, salePrice: 49.99, unit: 'month' },
  { name: 'CRM - Starter', sku: 'SUB-CRM-START', costPrice: 10, salePrice: 24.99, unit: 'month' },
  { name: 'CRM - Professional', sku: 'SUB-CRM-PRO', costPrice: 30, salePrice: 74.99, unit: 'month' },
  { name: 'CRM - Enterprise', sku: 'SUB-CRM-ENT', costPrice: 80, salePrice: 199.99, unit: 'month' },
  { name: 'Backup Service - 100GB', sku: 'SUB-BACKUP-100', costPrice: 5, salePrice: 12.99, unit: 'month' },
  { name: 'Backup Service - 500GB', sku: 'SUB-BACKUP-500', costPrice: 15, salePrice: 34.99, unit: 'month' },
  { name: 'Backup Service - 1TB', sku: 'SUB-BACKUP-1T', costPrice: 25, salePrice: 59.99, unit: 'month' },
  { name: 'Backup Service - Unlimited', sku: 'SUB-BACKUP-UNL', costPrice: 50, salePrice: 119.99, unit: 'month' },
  { name: 'VPN Service - Personal', sku: 'SUB-VPN-PERS', costPrice: 3, salePrice: 8.99, unit: 'month' },
  { name: 'VPN Service - Team', sku: 'SUB-VPN-TEAM', costPrice: 10, salePrice: 24.99, unit: 'month' },
  { name: 'VPN Service - Business', sku: 'SUB-VPN-BUS', costPrice: 25, salePrice: 59.99, unit: 'month' },
  { name: 'DNS Management', sku: 'SUB-DNS', costPrice: 2, salePrice: 5.99, unit: 'month' },
  { name: 'SSL Certificate - Basic', sku: 'SUB-SSL-BASIC', costPrice: 5, salePrice: 12.99, unit: 'year' },
  { name: 'SSL Certificate - Wildcard', sku: 'SUB-SSL-WILD', costPrice: 50, salePrice: 119.99, unit: 'year' },
  { name: 'SSL Certificate - EV', sku: 'SUB-SSL-EV', costPrice: 150, salePrice: 349.99, unit: 'year' },
  { name: 'Monitoring Service - Basic', sku: 'SUB-MON-BASIC', costPrice: 10, salePrice: 24.99, unit: 'month' },
  { name: 'Monitoring Service - Pro', sku: 'SUB-MON-PRO', costPrice: 30, salePrice: 74.99, unit: 'month' },
  { name: 'Monitoring Service - Enterprise', sku: 'SUB-MON-ENT', costPrice: 100, salePrice: 249.99, unit: 'month' },
  { name: 'Log Management - 10GB', sku: 'SUB-LOG-10', costPrice: 15, salePrice: 34.99, unit: 'month' },
  { name: 'Log Management - 50GB', sku: 'SUB-LOG-50', costPrice: 40, salePrice: 94.99, unit: 'month' },
  { name: 'Log Management - 100GB', sku: 'SUB-LOG-100', costPrice: 70, salePrice: 164.99, unit: 'month' },
  { name: 'CDN Service - Basic', sku: 'SUB-CDN-BASIC', costPrice: 20, salePrice: 49.99, unit: 'month' },
  { name: 'CDN Service - Pro', sku: 'SUB-CDN-PRO', costPrice: 50, salePrice: 119.99, unit: 'month' },
  { name: 'CDN Service - Enterprise', sku: 'SUB-CDN-ENT', costPrice: 150, salePrice: 349.99, unit: 'month' },
  { name: 'Video Conferencing - Basic', sku: 'SUB-VIDEO-BASIC', costPrice: 5, salePrice: 12.99, unit: 'month' },
  { name: 'Video Conferencing - Pro', sku: 'SUB-VIDEO-PRO', costPrice: 15, salePrice: 34.99, unit: 'month' },
  { name: 'Video Conferencing - Business', sku: 'SUB-VIDEO-BUS', costPrice: 30, salePrice: 74.99, unit: 'month' },
  { name: 'Help Desk - Starter', sku: 'SUB-HELP-START', costPrice: 10, salePrice: 24.99, unit: 'month' },
  { name: 'Help Desk - Team', sku: 'SUB-HELP-TEAM', costPrice: 25, salePrice: 59.99, unit: 'month' },
  { name: 'Help Desk - Enterprise', sku: 'SUB-HELP-ENT', costPrice: 60, salePrice: 149.99, unit: 'month' },
  { name: 'Password Manager - Personal', sku: 'SUB-PWD-PERS', costPrice: 2, salePrice: 4.99, unit: 'month' },
  { name: 'Password Manager - Team', sku: 'SUB-PWD-TEAM', costPrice: 5, salePrice: 12.99, unit: 'month' },
  { name: 'Password Manager - Business', sku: 'SUB-PWD-BUS', costPrice: 10, salePrice: 24.99, unit: 'month' },
  { name: 'Document Management', sku: 'SUB-DOC-MGMT', costPrice: 15, salePrice: 34.99, unit: 'month' },
  { name: 'E-Signature - Basic', sku: 'SUB-ESIGN-BASIC', costPrice: 8, salePrice: 19.99, unit: 'month' },
  { name: 'E-Signature - Pro', sku: 'SUB-ESIGN-PRO', costPrice: 20, salePrice: 49.99, unit: 'month' },
  { name: 'E-Signature - Business', sku: 'SUB-ESIGN-BUS', costPrice: 40, salePrice: 99.99, unit: 'month' },
  { name: 'Accounting Software - Basic', sku: 'SUB-ACCT-BASIC', costPrice: 15, salePrice: 34.99, unit: 'month' },
  { name: 'Accounting Software - Pro', sku: 'SUB-ACCT-PRO', costPrice: 35, salePrice: 84.99, unit: 'month' },
  { name: 'Accounting Software - Enterprise', sku: 'SUB-ACCT-ENT', costPrice: 80, salePrice: 199.99, unit: 'month' },
  { name: 'HR Management - Starter', sku: 'SUB-HR-START', costPrice: 20, salePrice: 49.99, unit: 'month' },
  { name: 'HR Management - Pro', sku: 'SUB-HR-PRO', costPrice: 50, salePrice: 124.99, unit: 'month' },
  { name: 'HR Management - Enterprise', sku: 'SUB-HR-ENT', costPrice: 100, salePrice: 249.99, unit: 'month' },
  { name: 'Time Tracking - Basic', sku: 'SUB-TIME-BASIC', costPrice: 5, salePrice: 12.99, unit: 'month' },
  { name: 'Time Tracking - Pro', sku: 'SUB-TIME-PRO', costPrice: 12, salePrice: 29.99, unit: 'month' },
  { name: 'Inventory Management', sku: 'SUB-INV-MGMT', costPrice: 30, salePrice: 74.99, unit: 'month' },
  { name: 'Asset Management', sku: 'SUB-ASSET-MGMT', costPrice: 25, salePrice: 59.99, unit: 'month' },
  { name: 'Support Plan - Silver', sku: 'SUB-SPT-SILVER', costPrice: 100, salePrice: 249.99, unit: 'month' },
  { name: 'Support Plan - Gold', sku: 'SUB-SPT-GOLD', costPrice: 250, salePrice: 599.99, unit: 'month' },
  { name: 'Support Plan - Platinum', sku: 'SUB-SPT-PLAT', costPrice: 500, salePrice: 1199.99, unit: 'month' },
];

const warehouseLocations = [
  { name: 'Main Distribution Center', code: 'MAIN-DC', address: '100 Warehouse Blvd, Dallas, TX 75201', shippingCostWeight: 1.0 },
  { name: 'East Coast Hub', code: 'EAST-HUB', address: '200 Distribution Way, Atlanta, GA 30301', shippingCostWeight: 1.1 },
  { name: 'West Coast Hub', code: 'WEST-HUB', address: '300 Pacific Drive, Los Angeles, CA 90001', shippingCostWeight: 1.2 },
  { name: 'Northeast Depot', code: 'NE-DEPOT', address: '400 Commerce St, Boston, MA 02101', shippingCostWeight: 1.15 },
  { name: 'Southeast Depot', code: 'SE-DEPOT', address: '500 Business Park, Miami, FL 33101', shippingCostWeight: 1.25 },
  { name: 'Midwest Center', code: 'MW-CTR', address: '600 Industrial Ave, Chicago, IL 60601', shippingCostWeight: 1.05 },
  { name: 'Southwest Depot', code: 'SW-DEPOT', address: '700 Desert Road, Phoenix, AZ 85001', shippingCostWeight: 1.2 },
  { name: 'Northwest Hub', code: 'NW-HUB', address: '800 Evergreen Way, Seattle, WA 98101', shippingCostWeight: 1.3 },
  { name: 'Central Warehouse', code: 'CENTRAL', address: '900 Heart of America, Kansas City, MO 64101', shippingCostWeight: 1.0 },
  { name: 'Mountain Region Depot', code: 'MTN-DEPOT', address: '1000 Rocky Mountain Blvd, Denver, CO 80201', shippingCostWeight: 1.15 },
  { name: 'Texas Distribution', code: 'TX-DIST', address: '1100 Lone Star Drive, Houston, TX 77001', shippingCostWeight: 1.1 },
  { name: 'California North', code: 'CA-NORTH', address: '1200 Golden Gate Ave, San Francisco, CA 94101', shippingCostWeight: 1.25 },
  { name: 'Pacific Northwest', code: 'PAC-NW', address: '1300 Cascade Way, Portland, OR 97201', shippingCostWeight: 1.3 },
  { name: 'Great Lakes Depot', code: 'GL-DEPOT', address: '1400 Lake Shore Drive, Detroit, MI 48201', shippingCostWeight: 1.1 },
  { name: 'Mid-Atlantic Hub', code: 'MID-ATL', address: '1500 Independence Blvd, Philadelphia, PA 19101', shippingCostWeight: 1.15 },
  { name: 'New England Center', code: 'NE-CTR', address: '1600 Patriot Way, Hartford, CT 06101', shippingCostWeight: 1.2 },
  { name: 'Southern Hub', code: 'SOUTH-HUB', address: '1700 Magnolia Street, Nashville, TN 37201', shippingCostWeight: 1.1 },
  { name: 'Gulf Coast Depot', code: 'GULF-DEPOT', address: '1800 Bayou Road, New Orleans, LA 70101', shippingCostWeight: 1.2 },
  { name: 'Heartland Warehouse', code: 'HEART-WH', address: '1900 Cornfield Lane, Omaha, NE 68101', shippingCostWeight: 1.05 },
  { name: 'Desert Southwest', code: 'DESERT-SW', address: '2000 Cactus Boulevard, Las Vegas, NV 89101', shippingCostWeight: 1.25 },
];

export async function seedMassiveData(prisma: PrismaClient): Promise<void> {
  console.log('\n===========================================');
  console.log('Starting Massive Data Seed (250+ per table)');
  console.log('===========================================\n');

  const defaultPassword = await hashPassword('password123');

  // Helper to generate cuid-like IDs
  const generateId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = 'c';
    for (let i = 0; i < 24; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  };

  // ===========================================
  // USERS (250+)
  // ===========================================
  console.log('Seeding Users...');
  const userIds: string[] = [];
  const usersByRole: Record<UserRole, string[]> = { SALES_REP: [], SALES_MANAGER: [], FINANCE_OPS: [], ADMIN: [] };
  
  const usersData = [];
  for (let i = 1; i <= 260; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const rand = Math.random();
    let role: UserRole;
    if (rand < 0.6) role = 'SALES_REP';
    else if (rand < 0.8) role = 'SALES_MANAGER';
    else if (rand < 0.95) role = 'FINANCE_OPS';
    else role = 'ADMIN';

    const id = generateId();
    userIds.push(id);
    usersByRole[role].push(id);
    
    usersData.push({
      id,
      name: `${firstName} ${lastName}`,
      email: `user${i}@dealflow360.com`,
      passwordHash: defaultPassword,
      role,
      isActive: Math.random() > 0.05,
    });
  }
  
  await prisma.user.createMany({ data: usersData, skipDuplicates: true });
  console.log(`  Created ${userIds.length} users`);

  // ===========================================
  // CUSTOMERS (250+)
  // ===========================================
  console.log('Seeding Customers...');
  const tiers: CustomerTier[] = ['BRONZE', 'SILVER', 'GOLD'];
  const customerIds: string[] = [];
  const customersByTier: Record<CustomerTier, string[]> = { BRONZE: [], SILVER: [], GOLD: [] };
  
  const customersData = [];
  for (let i = 1; i <= 260; i++) {
    const tier = randomChoice(tiers);
    const companyName = `${randomChoice(companyPrefixes)} ${randomChoice(companySuffixes)}`;
    const city = randomChoice(cities);
    const state = randomChoice(states);
    const id = generateId();
    
    customerIds.push(id);
    customersByTier[tier].push(id);
    
    customersData.push({
      id,
      name: companyName,
      email: generateEmail('customer', i),
      portalPasswordHash: defaultPassword,
      tier,
      companyName,
      phone: `+1-555-${String(randomInt(100, 999))}-${String(randomInt(1000, 9999))}`,
      address: `${randomInt(100, 9999)} ${randomChoice(['Main', 'Oak', 'Elm', 'Park', 'Lake', 'River', 'Hill', 'Valley'])} ${randomChoice(['St', 'Ave', 'Blvd', 'Dr', 'Way', 'Rd'])}, ${city}, ${state} ${randomInt(10000, 99999)}`,
      isActive: Math.random() > 0.05,
    });
  }
  
  await prisma.customer.createMany({ data: customersData, skipDuplicates: true });
  console.log(`  Created ${customerIds.length} customers`);

  // ===========================================
  // WAREHOUSES (20)
  // ===========================================
  console.log('Seeding Warehouses...');
  const warehouseIds: string[] = [];
  
  const warehousesData = warehouseLocations.map(wh => {
    const id = generateId();
    warehouseIds.push(id);
    return {
      id,
      name: wh.name,
      code: wh.code,
      address: wh.address,
      shippingCostWeight: wh.shippingCostWeight,
      isActive: true,
    };
  });
  
  await prisma.warehouse.createMany({ data: warehousesData, skipDuplicates: true });
  console.log(`  Created ${warehouseIds.length} warehouses`);

  // ===========================================
  // PRODUCTS (250+)
  // ===========================================
  console.log('Seeding Products...');
  const productIds: string[] = [];
  const productsByCategory: Record<ProductCategory, string[]> = { HARDWARE: [], SERVICE: [], SUBSCRIPTION: [] };
  const subscriptionProductIds: string[] = [];
  const productsData: any[] = [];
  
  // Hardware products
  for (const hw of hardwareProducts) {
    const id = generateId();
    productIds.push(id);
    productsByCategory.HARDWARE.push(id);
    productsData.push({
      id,
      name: hw.name,
      sku: hw.sku,
      category: 'HARDWARE' as ProductCategory,
      costPrice: hw.costPrice,
      salePrice: hw.salePrice,
      unit: 'unit',
      taxPct: 8.25,
      description: `${hw.name} - High quality hardware product`,
      isActive: true,
    });
  }

  // Service products
  for (const svc of serviceProducts) {
    const id = generateId();
    productIds.push(id);
    productsByCategory.SERVICE.push(id);
    productsData.push({
      id,
      name: svc.name,
      sku: svc.sku,
      category: 'SERVICE' as ProductCategory,
      costPrice: svc.costPrice,
      salePrice: svc.salePrice,
      unit: svc.unit,
      taxPct: 0,
      description: `${svc.name} - Professional service`,
      isActive: true,
    });
  }

  // Subscription products
  for (const sub of subscriptionProducts) {
    const id = generateId();
    productIds.push(id);
    productsByCategory.SUBSCRIPTION.push(id);
    subscriptionProductIds.push(id);
    productsData.push({
      id,
      name: sub.name,
      sku: sub.sku,
      category: 'SUBSCRIPTION' as ProductCategory,
      costPrice: sub.costPrice,
      salePrice: sub.salePrice,
      unit: sub.unit,
      taxPct: 0,
      description: `${sub.name} - Recurring subscription service`,
      isActive: sub.salePrice > 0,
    });
  }
  
  await prisma.product.createMany({ data: productsData, skipDuplicates: true });
  console.log(`  Created ${productIds.length} products (${productsByCategory.HARDWARE.length} hardware, ${productsByCategory.SERVICE.length} services, ${productsByCategory.SUBSCRIPTION.length} subscriptions)`);

  // ===========================================
  // PRODUCT VARIANTS (250+)
  // ===========================================
  console.log('Seeding Product Variants...');
  const attributes = ['Size', 'Color', 'Capacity', 'Material', 'Speed', 'Memory', 'Storage'];
  const sizeValues = ['Small', 'Medium', 'Large', 'XL', 'XXL'];
  const colorValues = ['Black', 'White', 'Silver', 'Blue', 'Red', 'Green', 'Gold'];
  const capacityValues = ['128GB', '256GB', '512GB', '1TB', '2TB'];
  
  const variantsData: any[] = [];
  // Generate 3-4 variants per hardware product (should give us ~300 variants)
  for (const productId of productsByCategory.HARDWARE.slice(0, 85)) {
    const numVariants = randomInt(3, 4);
    for (let v = 0; v < numVariants; v++) {
      const attr = randomChoice(attributes);
      let value: string;
      if (attr === 'Size') value = randomChoice(sizeValues);
      else if (attr === 'Color') value = randomChoice(colorValues);
      else if (attr === 'Capacity' || attr === 'Storage') value = randomChoice(capacityValues);
      else if (attr === 'Memory') value = randomChoice(['8GB', '16GB', '32GB', '64GB']);
      else if (attr === 'Speed') value = randomChoice(['Standard', 'Fast', 'Ultra']);
      else value = randomChoice(['Basic', 'Premium', 'Pro']);

      variantsData.push({
        id: generateId(),
        productId,
        attribute: attr,
        value,
        extraPrice: randomDecimal(0, 100),
      });
    }
  }
  
  await prisma.productVariant.createMany({ data: variantsData, skipDuplicates: true });
  console.log(`  Created ${variantsData.length} product variants`);

  // ===========================================
  // PRICE LISTS (10)
  // ===========================================
  console.log('Seeding Price Lists...');
  const priceListIds: string[] = [];
  const priceListConfigs = [
    { name: 'Standard Price List', tier: null, currency: 'USD', isDefault: true },
    { name: 'Gold Tier - USD', tier: 'GOLD' as CustomerTier, currency: 'USD', isDefault: false },
    { name: 'Silver Tier - USD', tier: 'SILVER' as CustomerTier, currency: 'USD', isDefault: false },
    { name: 'Bronze Tier - USD', tier: 'BRONZE' as CustomerTier, currency: 'USD', isDefault: false },
    { name: 'Gold Tier - EUR', tier: 'GOLD' as CustomerTier, currency: 'EUR', isDefault: false },
    { name: 'Silver Tier - EUR', tier: 'SILVER' as CustomerTier, currency: 'EUR', isDefault: false },
    { name: 'Q1 Promotion', tier: null, currency: 'USD', isDefault: false },
    { name: 'Q4 Holiday Special', tier: null, currency: 'USD', isDefault: false },
    { name: 'Partner Pricing', tier: 'GOLD' as CustomerTier, currency: 'USD', isDefault: false },
    { name: 'Volume Discount', tier: null, currency: 'USD', isDefault: false },
  ];

  const priceListsData = priceListConfigs.map(plConfig => {
    const id = generateId();
    priceListIds.push(id);
    return {
      id,
      name: plConfig.name,
      customerTier: plConfig.tier,
      currency: plConfig.currency,
      isDefault: plConfig.isDefault,
      validFrom: new Date('2024-01-01'),
      validTo: new Date('2027-12-31'),
      isActive: true,
    };
  });

  await prisma.priceList.createMany({ data: priceListsData, skipDuplicates: true });
  console.log(`  Created ${priceListIds.length} price lists`);

  // ===========================================
  // PRICE LIST ITEMS (250+)
  // ===========================================
  console.log('Seeding Price List Items...');
  const priceListItemsData: any[] = [];
  
  // Get sale prices from our products data
  const productPriceMap = new Map<string, number>();
  productsData.forEach(p => productPriceMap.set(p.id, p.salePrice));
  
  for (const priceListId of priceListIds.slice(1)) {  // Skip default
    const sampleProducts = productIds.slice(0, 30);  // 30 products per price list = 270+ items
    for (const productId of sampleProducts) {
      const salePrice = productPriceMap.get(productId) || 100;
      const tierDiscount = priceListId.includes('gold') ? 0.9 : priceListId.includes('silver') ? 0.95 : 0.98;
      
      priceListItemsData.push({
        id: generateId(),
        priceListId,
        productId,
        price: salePrice * tierDiscount,
      });
    }
  }
  
  await prisma.priceListItem.createMany({ data: priceListItemsData, skipDuplicates: true });
  console.log(`  Created ${priceListItemsData.length} price list items`);

  // ===========================================
  // STOCK LEVELS (250+)
  // ===========================================
  console.log('Seeding Stock Levels...');
  let stockLevelCount = 0;
  
  // Create stock levels for hardware products in multiple warehouses
  for (const productId of productsByCategory.HARDWARE) {
    const numWarehouses = randomInt(2, 5);
    const selectedWarehouses = warehouseIds.sort(() => Math.random() - 0.5).slice(0, numWarehouses);
    
    for (const warehouseId of selectedWarehouses) {
      try {
        await prisma.stockLevel.upsert({
          where: { warehouseId_productId: { warehouseId, productId } },
          update: {},
          create: {
            warehouseId,
            productId,
            quantityAvailable: randomInt(10, 500),
            quantityReserved: randomInt(0, 20),
            reorderPoint: randomInt(5, 50),
          },
        });
        stockLevelCount++;
      } catch (e) {
        // Skip duplicates
      }
    }
  }
  console.log(`  Created ${stockLevelCount} stock levels`);

  // ===========================================
  // SUBSCRIPTION PLANS (65)
  // ===========================================
  console.log('Seeding Subscription Plans...');
  const frequencies: BillingFrequency[] = ['MONTHLY', 'QUARTERLY', 'YEARLY'];
  let subscriptionPlanCount = 0;
  
  for (const productId of subscriptionProductIds) {
    try {
      await prisma.subscriptionPlan.upsert({
        where: { productId },
        update: {},
        create: {
          productId,
          name: `Subscription Plan for ${productId.slice(-6)}`,
          frequency: randomChoice(frequencies),
          prorationRule: randomChoice(['NONE', 'DAILY', 'WEEKLY'] as ProrationRule[]),
          trialDays: randomChoice([0, 7, 14, 30]),
          isActive: true,
        },
      });
      subscriptionPlanCount++;
    } catch (e) {
      // Skip if already exists
    }
  }
  console.log(`  Created ${subscriptionPlanCount} subscription plans`);

  // ===========================================
  // PRODUCT PAIRINGS (250+)
  // ===========================================
  console.log('Seeding Product Pairings...');
  let pairingCount = 0;
  
  // Create pairings between hardware products
  for (let i = 0; i < productsByCategory.HARDWARE.length - 1; i++) {
    const suggestCount = randomInt(2, 4);
    for (let j = 0; j < suggestCount; j++) {
      const suggestedIdx = (i + j + 1) % productsByCategory.HARDWARE.length;
      if (i !== suggestedIdx) {
        try {
          await prisma.productPairing.upsert({
            where: {
              productId_suggestedProductId: {
                productId: productsByCategory.HARDWARE[i],
                suggestedProductId: productsByCategory.HARDWARE[suggestedIdx],
              },
            },
            update: {},
            create: {
              productId: productsByCategory.HARDWARE[i],
              suggestedProductId: productsByCategory.HARDWARE[suggestedIdx],
              weight: randomDecimal(0.5, 1.0),
              isPromoted: Math.random() > 0.7,
            },
          });
          pairingCount++;
        } catch (e) {
          // Skip duplicates
        }
      }
    }
  }

  // Cross-sell: hardware to services
  for (const hwId of productsByCategory.HARDWARE.slice(0, 50)) {
    const svcId = randomChoice(productsByCategory.SERVICE);
    try {
      await prisma.productPairing.upsert({
        where: { productId_suggestedProductId: { productId: hwId, suggestedProductId: svcId } },
        update: {},
        create: {
          productId: hwId,
          suggestedProductId: svcId,
          weight: randomDecimal(0.6, 0.9),
          isPromoted: true,
        },
      });
      pairingCount++;
    } catch (e) {}
  }
  console.log(`  Created ${pairingCount} product pairings`);

  // ===========================================
  // QUOTATIONS (250+)
  // ===========================================
  console.log('Seeding Quotations...');
  const quotationStatuses: QuotationStatus[] = ['DRAFT', 'PENDING_MANAGER_APPROVAL', 'PENDING_FINANCE_APPROVAL', 'APPROVED', 'REJECTED', 'CONFIRMED', 'FULFILLING', 'BILLED', 'CANCELLED'];
  const quotationIds: string[] = [];
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2026-09-01');

  for (let i = 1; i <= 280; i++) {
    const customerId = randomChoice(customerIds);
    const repId = randomChoice(usersByRole.SALES_REP.length > 0 ? usersByRole.SALES_REP : userIds);
    const status = randomChoice(quotationStatuses);
    const createdAt = randomDate(startDate, endDate);
    const validUntil = new Date(createdAt.getTime() + randomInt(14, 90) * 24 * 60 * 60 * 1000);
    
    const totalAmount = randomDecimal(500, 50000);
    const costRatio = randomDecimal(0.5, 0.8);
    const totalMargin = totalAmount * (1 - costRatio);
    const totalMarginPct = (1 - costRatio) * 100;
    const overallDiscountPct = randomDecimal(0, 15);
    const blendedRiskScore = randomDecimal(0, 25);

    // Counter offer fields for some quotations
    const hasCounterOffer = ['PENDING_MANAGER_APPROVAL', 'APPROVED', 'CONFIRMED'].includes(status) && Math.random() > 0.7;
    const counterOfferStatus = hasCounterOffer ? randomChoice(['PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED'] as CounterOfferStatus[]) : null;

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber: `Q-${String(2024000 + i).padStart(7, '0')}`,
        customerId,
        repId,
        status,
        blendedRiskScore,
        totalAmount,
        totalMargin,
        totalMarginPct,
        overallDiscountPct,
        notes: Math.random() > 0.5 ? `Notes for quotation ${i}` : null,
        validUntil,
        lastActivityAt: createdAt,
        createdAt,
        counterOfferStatus,
        counteredDiscountPct: hasCounterOffer ? randomDecimal(5, 20) : null,
        counteredTotalAmount: hasCounterOffer ? totalAmount * (1 - randomDecimal(0.05, 0.15)) : null,
        unitPriceTotal: totalAmount / (1 - overallDiscountPct / 100),
        counterOfferAt: hasCounterOffer ? new Date(createdAt.getTime() + randomInt(1, 7) * 24 * 60 * 60 * 1000) : null,
        counterOfferRespondedAt: hasCounterOffer && counterOfferStatus !== 'PENDING' ? new Date(createdAt.getTime() + randomInt(2, 14) * 24 * 60 * 60 * 1000) : null,
      },
    });
    quotationIds.push(quotation.id);
  }
  console.log(`  Created ${quotationIds.length} quotations`);

  // ===========================================
  // QUOTATION LINES (250+)
  // ===========================================
  console.log('Seeding Quotation Lines...');
  const lineTypes: LineType[] = ['ONE_TIME', 'RECURRING'];
  const billingFrequencies: BillingFrequency[] = ['MONTHLY', 'QUARTERLY', 'YEARLY'];
  const quotationLineIds: string[] = [];
  const quotationLineByQuotation: Record<string, string[]> = {};

  for (const quotationId of quotationIds) {
    const numLines = randomInt(1, 5);
    quotationLineByQuotation[quotationId] = [];
    
    for (let l = 0; l < numLines; l++) {
      const productId = randomChoice(productIds);
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) continue;

      const quantity = randomInt(1, 20);
      const unitPrice = Number(product.salePrice);
      const discountPct = randomDecimal(0, 15);
      const lineTotal = unitPrice * quantity * (1 - discountPct / 100);
      const marginAmount = lineTotal - (Number(product.costPrice) * quantity);
      const marginPct = (marginAmount / lineTotal) * 100;
      const lineType = product.category === 'SUBSCRIPTION' ? 'RECURRING' : randomChoice(lineTypes);

      const line = await prisma.quotationLine.create({
        data: {
          quotationId,
          productId,
          quantity,
          unitPrice,
          discountPct,
          lineTotal,
          lineType,
          billingFrequency: lineType === 'RECURRING' ? randomChoice(billingFrequencies) : null,
          marginAmount,
          marginPct,
        },
      });
      quotationLineIds.push(line.id);
      quotationLineByQuotation[quotationId].push(line.id);
    }
  }
  console.log(`  Created ${quotationLineIds.length} quotation lines`);

  // ===========================================
  // APPROVALS (250+)
  // ===========================================
  console.log('Seeding Approvals...');
  const approvalLevels: ApprovalLevel[] = ['MANAGER', 'FINANCE'];
  const approvalStatuses: ApprovalStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'RETURNED'];
  let approvalCount = 0;

  const quotationsNeedingApproval = quotationIds.filter(() => Math.random() > 0.3);
  for (const quotationId of quotationsNeedingApproval) {
    const needsManagerApproval = Math.random() > 0.2;
    const needsFinanceApproval = Math.random() > 0.5;

    if (needsManagerApproval) {
      const approverId = usersByRole.SALES_MANAGER.length > 0 ? randomChoice(usersByRole.SALES_MANAGER) : randomChoice(userIds);
      const status = randomChoice(approvalStatuses);
      await prisma.approval.create({
        data: {
          quotationId,
          level: 'MANAGER',
          approverId: status !== 'PENDING' ? approverId : null,
          status,
          reason: status === 'REJECTED' || status === 'RETURNED' ? 'Business justification needed' : null,
          actedAt: status !== 'PENDING' ? randomDate(startDate, endDate) : null,
        },
      });
      approvalCount++;
    }

    if (needsFinanceApproval) {
      const approverId = usersByRole.FINANCE_OPS.length > 0 ? randomChoice(usersByRole.FINANCE_OPS) : randomChoice(userIds);
      const status = randomChoice(approvalStatuses);
      await prisma.approval.create({
        data: {
          quotationId,
          level: 'FINANCE',
          approverId: status !== 'PENDING' ? approverId : null,
          status,
          reason: status === 'REJECTED' ? 'Margin below threshold' : null,
          actedAt: status !== 'PENDING' ? randomDate(startDate, endDate) : null,
        },
      });
      approvalCount++;
    }
  }
  console.log(`  Created ${approvalCount} approvals`);

  // ===========================================
  // FULFILLMENT SPLITS (250+)
  // ===========================================
  console.log('Seeding Fulfillment Splits...');
  const fulfillmentStatuses: FulfillmentStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  let fulfillmentCount = 0;

  for (const lineId of quotationLineIds.slice(0, 300)) {
    const numSplits = randomInt(1, 3);
    for (let s = 0; s < numSplits; s++) {
      const warehouseId = randomChoice(warehouseIds);
      const status = randomChoice(fulfillmentStatuses);
      const createdAt = randomDate(startDate, endDate);
      
      await prisma.fulfillmentSplit.create({
        data: {
          quotationLineId: lineId,
          warehouseId,
          quantityFulfilled: randomInt(1, 10),
          isBackorder: Math.random() > 0.85,
          isManualOverride: Math.random() > 0.9,
          estimatedShipDate: new Date(createdAt.getTime() + randomInt(1, 14) * 24 * 60 * 60 * 1000),
          actualShipDate: ['SHIPPED', 'DELIVERED'].includes(status) ? new Date(createdAt.getTime() + randomInt(2, 10) * 24 * 60 * 60 * 1000) : null,
          status,
        },
      });
      fulfillmentCount++;
    }
  }
  console.log(`  Created ${fulfillmentCount} fulfillment splits`);

  // ===========================================
  // BILLING SCHEDULES (250+)
  // ===========================================
  console.log('Seeding Billing Schedules...');
  const billingStatuses: BillingScheduleStatus[] = ['UPCOMING', 'INVOICED', 'PAID', 'REFUNDED', 'CANCELLED'];
  let billingScheduleCount = 0;

  // Get recurring quotation lines
  const recurringLines = await prisma.quotationLine.findMany({
    where: { lineType: 'RECURRING' },
    take: 100,
  });

  for (const line of recurringLines) {
    const numCycles = randomInt(3, 12);
    for (let cycle = 1; cycle <= numCycles; cycle++) {
      const dueDate = new Date(startDate.getTime() + cycle * 30 * 24 * 60 * 60 * 1000);
      await prisma.billingSchedule.create({
        data: {
          quotationLineId: line.id,
          cycleNumber: cycle,
          dueDate,
          amount: Number(line.lineTotal),
          status: randomChoice(billingStatuses),
        },
      });
      billingScheduleCount++;
    }
  }
  console.log(`  Created ${billingScheduleCount} billing schedules`);

  // ===========================================
  // INVOICES (250+)
  // ===========================================
  console.log('Seeding Invoices...');
  const invoiceTypes: InvoiceType[] = ['ONE_TIME', 'RECURRING'];
  const invoiceStatuses: InvoiceStatus[] = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];
  const invoiceIds: string[] = [];

  for (let i = 1; i <= 280; i++) {
    const quotationId = randomChoice(quotationIds);
    const invoiceType = randomChoice(invoiceTypes);
    const amount = randomDecimal(500, 25000);
    const taxAmount = amount * 0.0825;
    const totalAmount = amount + taxAmount;
    const status = randomChoice(invoiceStatuses);
    const createdAt = randomDate(startDate, endDate);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${String(2024000 + i).padStart(7, '0')}`,
        quotationId,
        invoiceType,
        amount,
        taxAmount,
        totalAmount,
        status,
        dueDate: new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000),
        issuedAt: status !== 'DRAFT' ? createdAt : null,
        paidAt: status === 'PAID' ? new Date(createdAt.getTime() + randomInt(5, 25) * 24 * 60 * 60 * 1000) : null,
        createdAt,
      },
    });
    invoiceIds.push(invoice.id);
  }
  console.log(`  Created ${invoiceIds.length} invoices`);

  // ===========================================
  // CREDIT NOTES (250+)
  // ===========================================
  console.log('Seeding Credit Notes...');
  const creditNoteStatuses: CreditNoteStatus[] = ['DRAFT', 'ISSUED', 'APPLIED', 'CANCELLED'];
  const creditNoteReasons = [
    'Pricing error correction',
    'Early payment discount',
    'Volume discount adjustment',
    'Quality issue compensation',
    'Service level credit',
    'Promotional adjustment',
    'Return merchandise credit',
    'Billing dispute resolution',
    'Contract renegotiation',
    'Customer loyalty credit',
  ];

  for (let i = 1; i <= 260; i++) {
    const invoiceId = randomChoice(invoiceIds);
    const status = randomChoice(creditNoteStatuses);
    const createdAt = randomDate(startDate, endDate);

    await prisma.creditNote.create({
      data: {
        creditNoteNumber: `CN-${String(2024000 + i).padStart(7, '0')}`,
        invoiceId,
        amount: randomDecimal(50, 2000),
        reason: randomChoice(creditNoteReasons),
        status,
        issuedAt: status !== 'DRAFT' ? createdAt : null,
        createdAt,
      },
    });
  }
  console.log(`  Created 260 credit notes`);

  // ===========================================
  // QUOTATION COMMENTS (250+)
  // ===========================================
  console.log('Seeding Quotation Comments...');
  const commentTexts = [
    'Please review the pricing on this line item.',
    'Customer requested expedited delivery.',
    'Discount approved per special agreement.',
    'Waiting for customer confirmation.',
    'Budget constraints mentioned by customer.',
    'Follow up scheduled for next week.',
    'Technical specifications confirmed.',
    'Quantity may increase after pilot phase.',
    'Competitor pricing mentioned.',
    'Extended warranty requested.',
    'Need manager approval for this discount level.',
    'Customer prefers quarterly billing.',
    'Delivery date is critical for this order.',
    'Reference previous order for pricing history.',
    'Special packaging requirements noted.',
  ];

  let commentCount = 0;
  for (const quotationId of quotationIds.slice(0, 180)) {
    const numComments = randomInt(1, 3);
    const lines = quotationLineByQuotation[quotationId] || [];
    
    for (let c = 0; c < numComments; c++) {
      const isCustomer = Math.random() > 0.6;
      const authorType: ActorType = isCustomer ? 'CUSTOMER' : 'INTERNAL';
      const authorId = isCustomer ? randomChoice(customerIds) : randomChoice(userIds);

      await prisma.quotationComment.create({
        data: {
          quotationId,
          quotationLineId: lines.length > 0 && Math.random() > 0.5 ? randomChoice(lines) : null,
          authorType,
          authorId,
          commentText: randomChoice(commentTexts),
        },
      });
      commentCount++;
    }
  }
  console.log(`  Created ${commentCount} quotation comments`);

  // ===========================================
  // AUDIT LOGS (250+)
  // ===========================================
  console.log('Seeding Audit Logs...');
  const entityTypes = ['QUOTATION', 'APPROVAL', 'INVOICE', 'PRODUCT', 'CUSTOMER', 'USER', 'ORDER', 'FULFILLMENT'];
  const actions = ['CREATE', 'UPDATE', 'APPROVE', 'REJECT', 'DELETE', 'VIEW', 'EXPORT', 'SUBMIT', 'CANCEL', 'CONFIRM'];
  const ipAddresses = ['192.168.1.100', '10.0.0.50', '172.16.0.25', '192.168.0.1', '10.10.10.10'];
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0',
    'Mozilla/5.0 (X11; Linux x86_64) Chrome/119.0.0.0',
  ];

  for (let i = 0; i < 300; i++) {
    const isCustomerAction = Math.random() > 0.8;
    const actorType: ActorType = isCustomerAction ? 'CUSTOMER' : 'INTERNAL';
    const actorId = isCustomerAction ? randomChoice(customerIds) : randomChoice(userIds);
    const entityType = randomChoice(entityTypes);
    let entityId: string;

    switch (entityType) {
      case 'QUOTATION':
        entityId = randomChoice(quotationIds);
        break;
      case 'INVOICE':
        entityId = randomChoice(invoiceIds);
        break;
      case 'PRODUCT':
        entityId = randomChoice(productIds);
        break;
      case 'CUSTOMER':
        entityId = randomChoice(customerIds);
        break;
      case 'USER':
        entityId = randomChoice(userIds);
        break;
      default:
        entityId = randomChoice(quotationIds);
    }

    await prisma.auditLog.create({
      data: {
        entityType,
        entityId,
        actorId,
        actorType,
        action: randomChoice(actions),
        reason: Math.random() > 0.7 ? 'Business process action' : null,
        beforeState: Math.random() > 0.5 ? { status: 'previous_state' } : null,
        afterState: Math.random() > 0.5 ? { status: 'new_state' } : null,
        ipAddress: randomChoice(ipAddresses),
        userAgent: randomChoice(userAgents),
        createdAt: randomDate(startDate, endDate),
      },
    });
  }
  console.log(`  Created 300 audit logs`);

  // ===========================================
  // SUMMARY
  // ===========================================
  console.log('\n===========================================');
  console.log('MASSIVE SEED COMPLETED!');
  console.log('===========================================');
  console.log(`
  Summary of seeded data:
  ----------------------
  Users:              ${userIds.length}
  Customers:          ${customerIds.length}
  Warehouses:         ${warehouseIds.length}
  Products:           ${productIds.length}
  Product Variants:   ${variantCount}
  Price Lists:        ${priceListIds.length}
  Price List Items:   ${priceListItemCount}
  Stock Levels:       ${stockLevelCount}
  Subscription Plans: ${subscriptionPlanCount}
  Product Pairings:   ${pairingCount}
  Quotations:         ${quotationIds.length}
  Quotation Lines:    ${quotationLineIds.length}
  Approvals:          ${approvalCount}
  Fulfillment Splits: ${fulfillmentCount}
  Billing Schedules:  ${billingScheduleCount}
  Invoices:           ${invoiceIds.length}
  Credit Notes:       260
  Quotation Comments: ${commentCount}
  Audit Logs:         300
  
  All test users use password: password123
  `);
}
