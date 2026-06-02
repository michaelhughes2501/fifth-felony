-- ============================================================
-- Seed data — run after schema.sql
-- ============================================================

insert into jobs (title, company, location, description, fair_chance, apply_url) values
('Warehouse Associate', 'Greenline Logistics', 'Boston, MA', 'Full-time warehouse role. No background restrictions. Training provided.', true, 'https://example.com/apply/1'),
('Line Cook', 'Second Plate Kitchen', 'Boston, MA', 'Busy kitchen seeking reliable cooks. Fair-chance employer, all welcome.', true, 'https://example.com/apply/2'),
('Construction Laborer', 'Rebuild Contracting', 'Cambridge, MA', 'Entry-level construction. Daily pay available, on-the-job training.', true, 'https://example.com/apply/3'),
('Customer Support Rep', 'Bright Path Telecom', 'Remote', 'Remote phone support. Quiet workspace and internet required.', true, 'https://example.com/apply/4'),
('Landscaping Crew Member', 'Evergreen Grounds', 'Somerville, MA', 'Seasonal outdoor work. Valid license a plus but not required.', true, 'https://example.com/apply/5');

insert into housing (name, type, location, description, contact) values
('Fresh Start Transitional Home', 'transitional', 'Boston, MA', 'Up to 12 months supportive transitional housing with case management.', 'intake@freshstart.example.org'),
('Bridgeway Halfway House', 'halfway', 'Dorchester, MA', 'Structured halfway housing for individuals on supervised release.', '(617) 555-0142'),
('Open Door Rentals', 'rental', 'Quincy, MA', 'Affordable studio and 1BR rentals, no background check on application.', 'rentals@opendoor.example.org'),
('Harbor Light Shelter', 'shelter', 'Boston, MA', 'Emergency overnight shelter with meals and referrals.', '(617) 555-0188');

insert into legal_resources (name, category, location, description, contact) values
('Statewide Expungement Clinic', 'expungement', 'Massachusetts', 'Free help sealing or expunging eligible records. Monthly walk-in clinics.', 'clinic@legalaid.example.org'),
('Tenant Rights Hotline', 'housing rights', 'Massachusetts', 'Free advice on evictions, deposits, and discrimination in housing.', '(800) 555-0123'),
('Fair Employment Project', 'employment law', 'Boston, MA', 'Guidance on ban-the-box rights and workplace discrimination.', 'help@fairemployment.example.org'),
('ID & Documents Assistance', 'documentation', 'Massachusetts', 'Help replacing birth certificates, IDs, and Social Security cards.', 'docs@reentryhelp.example.org');
