-- Seed data for ZaryadUz database

-- Insert test users
INSERT INTO users (phone, name, email, car_types, role) VALUES
('+998901234567', 'John Doe', 'john@example.com', ARRAY['ev'], 'user'),
('+998901234568', 'Jane Smith', 'jane@example.com', ARRAY['scooter'], 'user'),
('+998901234569', 'Admin User', 'admin@zaryaduz.uz', ARRAY[], 'admin')
ON CONFLICT (phone) DO NOTHING;

-- Insert test stations
INSERT INTO stations (name, address, latitude, longitude, type, status, power, total_ports, available_ports, price_per_unit, image_url) VALUES
('Tashkent City Mall EV', 'Tashkent, Yunusabad', 41.3115, 69.2495, 'ev', 'open', '50kW DC Fast', 4, 3, '2500 UZB/kWh', '/uploads/station1.jpg'),
('Powerbank Station - Chorsu', 'Tashkent, Chorsu Bazaar', 41.3369, 69.2789, 'power', 'busy', '18W', 20, 5, '5000 UZB/hour', '/uploads/station2.jpg'),
('Scooter Rent Point', 'Tashkent, Amir Timur Square', 41.3158, 69.2522, 'scooter', 'open', 'Electric Scooter', 10, 8, '15000 UZB/hour', '/uploads/station3.jpg'),
('EV Charging - Samarkand', 'Samarkand, Registan', 39.6270, 66.9750, 'ev', 'closed', '22kW AC', 2, 0, '2000 UZB/kWh', '/uploads/station4.jpg'),
('Powerbank - Bukhara', 'Bukhara, Old City', 39.7747, 64.4287, 'power', 'open', '20W', 15, 12, '4500 UZB/hour', '/uploads/station5.jpg')
ON CONFLICT DO NOTHING;

-- Insert test bookings
INSERT INTO bookings (user_id, station_id, booking_time, duration_minutes, total_amount, prepaid_amount, remaining_amount, port_number, payment_method, status, booking_code) VALUES
(1, 1, NOW() + INTERVAL '1 hour', 60, 37500, 11250, 26250, 1, 'payme', 'confirmed', 'ZU-2025-1001'),
(1, 3, NOW() + INTERVAL '2 hours', 120, 30000, 9000, 21000, 2, 'uzum', 'confirmed', 'ZU-2025-1002'),
(2, 2, NOW() + INTERVAL '30 minutes', 45, 3750, 1125, 2625, 5, 'card', 'completed', 'ZU-2025-1003')
ON CONFLICT (booking_code) DO NOTHING;
