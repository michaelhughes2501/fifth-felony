-- Idempotent sample listings for local/demo environments. Edit or omit for production.
INSERT INTO jobs (title, company, location, description, fair_chance, apply_url)
SELECT v.title, v.company, v.location, v.description, v.fair_chance, v.apply_url
FROM (VALUES
  ('Warehouse Associate', 'Greenline Logistics', 'Boston, MA', 'Full-time warehouse role. Training provided.', true, 'https://example.com/apply/1'),
  ('Line Cook', 'Second Plate Kitchen', 'Boston, MA', 'Kitchen role with fair-chance hiring.', true, 'https://example.com/apply/2'),
  ('Construction Laborer', 'Rebuild Contracting', 'Cambridge, MA', 'Entry-level construction with on-the-job training.', true, 'https://example.com/apply/3'),
  ('Customer Support Rep', 'Bright Path Telecom', 'Remote', 'Remote support role. Quiet workspace and internet required.', true, 'https://example.com/apply/4'),
  ('Landscaping Crew Member', 'Evergreen Grounds', 'Somerville, MA', 'Seasonal outdoor work. Training provided.', true, 'https://example.com/apply/5')
) AS v(title, company, location, description, fair_chance, apply_url)
WHERE NOT EXISTS (SELECT 1 FROM jobs j WHERE j.title = v.title AND j.company = v.company);

INSERT INTO housing (name, type, location, description, contact)
SELECT v.name, v.type, v.location, v.description, v.contact
FROM (VALUES
  ('Fresh Start Transitional Home', 'transitional', 'Boston, MA', 'Supportive transitional housing with case management.', 'intake@freshstart.example.org'),
  ('Bridgeway Halfway House', 'halfway', 'Dorchester, MA', 'Structured housing for people on supervised release.', '(617) 555-0142'),
  ('Open Door Rentals', 'rental', 'Quincy, MA', 'Affordable studio and one-bedroom rentals.', 'rentals@opendoor.example.org'),
  ('Harbor Light Shelter', 'shelter', 'Boston, MA', 'Emergency overnight shelter with meals and referrals.', '(617) 555-0188')
) AS v(name, type, location, description, contact)
WHERE NOT EXISTS (SELECT 1 FROM housing h WHERE h.name = v.name);

INSERT INTO legal_resources (name, category, location, description, contact)
SELECT v.name, v.category, v.location, v.description, v.contact
FROM (VALUES
  ('Statewide Expungement Clinic', 'expungement', 'Massachusetts', 'Free eligibility and filing help at monthly clinics.', 'clinic@legalaid.example.org'),
  ('Tenant Rights Hotline', 'housing rights', 'Massachusetts', 'Free advice about evictions, deposits, and discrimination.', '(800) 555-0123'),
  ('Fair Employment Project', 'employment law', 'Boston, MA', 'Guidance on ban-the-box rights and workplace discrimination.', 'help@fairemployment.example.org'),
  ('ID & Documents Assistance', 'documentation', 'Massachusetts', 'Help replacing birth certificates, IDs, and Social Security cards.', 'docs@reentryhelp.example.org')
) AS v(name, category, location, description, contact)
WHERE NOT EXISTS (SELECT 1 FROM legal_resources r WHERE r.name = v.name);
