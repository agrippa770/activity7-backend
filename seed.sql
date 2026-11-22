-- Inserts 8 made-up records, but only if the table is empty.
INSERT INTO records (title, category, description, status)
SELECT * FROM (VALUES
  ('Broken classroom light', 'Electrical', 'The light in Room B12 does not switch on.', 'Pending'),
  ('Leaking tap in girls'' hostel', 'Plumbing', 'The tap in the Block A bathroom drips all night and wastes water.', 'In progress'),
  ('Broken lecture hall chairs', 'Furniture', 'Three chairs in Lecture Hall 2 have loose legs and are unsafe.', 'Pending'),
  ('Projector not working', 'IT & Network', 'The projector in Room C4 shows no image when connected.', 'Completed'),
  ('Overflowing bins at cafeteria', 'Cleaning & Waste', 'Bins outside the cafeteria are full and not collected for days.', 'In progress'),
  ('Overgrown grass near library', 'Grounds & Garden', 'The grass along the library path is very tall and needs cutting.', 'Pending'),
  ('Loose stair railing', 'Safety', 'The railing on the engineering block stairs is loose and wobbles.', 'In progress'),
  ('Blocked drain behind admin block', 'Plumbing', 'Water collects behind the admin block after rain because the drain is blocked.', 'Completed')
) AS v(title, category, description, status)
WHERE NOT EXISTS (SELECT 1 FROM records);
