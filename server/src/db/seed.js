const db = require('./index');
const crypto = require('node:crypto');

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function seedDatabase() {
  console.log('Clearing existing data...');
  db.exec(`
    DELETE FROM users;
    DELETE FROM maintenance_logs;
    DELETE FROM maintenance_tasks;
    DELETE FROM equipment;
    DELETE FROM harvest_yields;
    DELETE FROM operation_inputs;
    DELETE FROM field_operations;
    DELETE FROM crop_rotations;
    DELETE FROM crops;
    DELETE FROM fields;
  `);

  console.log('Seeding Fields...');
  const insertField = db.prepare(`
    INSERT INTO fields (id, name, acreage, soil_type, ph_level, organic_matter_pct, irrigation_type, latitude, longitude, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const fieldsData = [
    [1, 'North Valley Plot', 120.0, 'Silt Loam', 6.6, 3.4, 'Center Pivot', 41.8781, -93.0977, 'Active'],
    [2, 'Ridge Creek 40', 85.0, 'Clay Loam', 6.2, 2.9, 'Rainfed', 41.8825, -93.1042, 'Active'],
    [3, 'River Bottom Flat', 160.0, 'Alluvial Silt Loam', 6.8, 4.1, 'Drip/Furrow', 41.8690, -93.0855, 'Active'],
    [4, 'East Prairie Section', 200.0, 'Black Chernozem Loam', 7.0, 4.5, 'Center Pivot', 41.8912, -93.0720, 'Active'],
    [5, 'South Hill Terrace', 95.0, 'Sandy Loam', 6.1, 2.4, 'Rainfed', 41.8540, -93.1110, 'Active'],
    [6, 'Willow Springs West', 140.0, 'Silty Clay Loam', 6.5, 3.8, 'Center Pivot', 41.8745, -93.1250, 'Active'],
    [7, 'Oak Ridge Bottom', 70.0, 'Deep Rich Loam', 6.7, 3.6, 'Rainfed', 41.8610, -93.0990, 'Active'],
    [8, 'Sunrise Pasture Conversion', 110.0, 'Sandy Loam', 6.3, 2.8, 'Center Pivot', 41.8995, -93.0880, 'Active']
  ];

  for (const f of fieldsData) {
    insertField.run(...f);
  }

  console.log('Seeding Crops Catalog...');
  const insertCrop = db.prepare(`
    INSERT INTO crops (id, name, variety, botanical_family, season, days_to_maturity, nitrogen_demand, root_depth, water_requirement, typical_yield_per_acre, yield_unit, market_price_per_unit, pests_diseases, companion_crops, incompatible_following)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const cropsData = [
    [1, 'Corn (Field Grain)', 'Pioneer P1197AM', 'Poaceae (Grass)', 'Spring', 112, 'Heavy Feeder', 'Medium Fibrous', 'High', 188.0, 'bu/ac', 4.85, 'Western Corn Rootworm, Northern Corn Leaf Blight, Goss Wilt', 'Soybeans, Field Peas', 'Corn (Monoculture), Sorghum'],
    [2, 'Soybeans', 'Asgrow AG27XF1', 'Fabaceae (Legume)', 'Spring', 105, 'Nitrogen Fixer', 'Deep Taproot', 'Moderate', 58.0, 'bu/ac', 11.90, 'Soybean Cyst Nematode, Sudden Death Syndrome, White Mold', 'Corn, Wheat', 'Canola (White Mold host)'],
    [3, 'Hard Red Winter Wheat', 'WB4401', 'Poaceae (Grass)', 'Fall', 240, 'Medium Feeder', 'Shallow Fibrous', 'Moderate', 74.0, 'bu/ac', 6.40, 'Fusarium Head Blight, Stripe Rust, Hessian Fly', 'Red Clover, Alfalfa', 'Barley, Wheat'],
    [4, 'Alfalfa (Hay)', 'Dairyland Magna 804', 'Fabaceae (Legume)', 'Spring', 60, 'Nitrogen Fixer', 'Very Deep Taproot', 'High', 5.5, 'tons/ac', 185.00, 'Alfalfa Weevil, Anthracnose, Crown Rot', 'Timothy Grass, Orchardgrass', 'Alfalfa (Autotoxicity)'],
    [5, 'Field Peas', 'AAC Carver Yellow', 'Fabaceae (Legume)', 'Spring', 95, 'Nitrogen Fixer', 'Shallow Taproot', 'Low', 46.0, 'bu/ac', 8.50, 'Aphanomyces Root Rot, Pea Aphid, Ascochyta', 'Canola, Wheat', 'Lentils, Dry Beans'],
    [6, 'Canola (Spring)', 'InVigor L345PC', 'Brassicaceae (Mustard)', 'Spring', 100, 'Heavy Feeder', 'Deep Taproot', 'Moderate', 48.0, 'bu/ac', 13.20, 'Blackleg, Sclerotinia Stem Rot, Flea Beetles', 'Wheat, Barley', 'Soybeans, Sunflowers'],
    [7, 'Sunflowers (Oilseed)', 'Croplan 458 E', 'Asteraceae (Composite)', 'Spring', 110, 'Medium Feeder', 'Deep Taproot', 'Low', 2150.0, 'lbs/ac', 0.28, 'Downy Mildew, Rust, Sunflower Moth, Head Rot', 'Small Grains', 'Sunflowers, Potatoes'],
    [8, 'Crimson Clover (Cover)', 'Dixie Reseeding', 'Fabaceae (Cover/Legume)', 'Fall', 120, 'Nitrogen Fixer', 'Fibrous Taproot', 'Moderate', 2.2, 'tons/ac', 0.00, 'Sclerotinia, Slugs', 'Winter Rye, Radish', 'None'],
    [9, 'Winter Cereal Rye (Cover)', 'Aroostook Cereal Rye', 'Poaceae (Cover/Grass)', 'Fall', 150, 'Light Feeder', 'Dense Fibrous', 'Low', 2.8, 'tons/ac', 0.00, 'Armyworm, Ergot', 'Hairy Vetch, Clover', 'None'],
    [10, 'Spring Malting Barley', 'Synergy Two-Row', 'Poaceae (Grass)', 'Spring', 90, 'Medium Feeder', 'Shallow Fibrous', 'Low', 84.0, 'bu/ac', 5.60, 'Net Blotch, Barley Yellow Dwarf, Smut', 'Peas, Canola', 'Wheat, Rye']
  ];

  for (const c of cropsData) {
    insertCrop.run(...c);
  }

  console.log('Seeding Multi-Year Crop Rotations (2023 - 2026)...');
  const insertRotation = db.prepare(`
    INSERT INTO crop_rotations (field_id, crop_id, year, season, target_yield, actual_yield, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const rotationsData = [
    // Field 1: North Valley (Textbook rotation Corn -> Soybeans -> Wheat -> Clover)
    [1, 1, 2023, 'Spring', 185.0, 192.5, 'Excellent early stand emergence', 'Harvested'],
    [1, 2, 2024, 'Spring', 56.0, 59.2, 'Good pod fill, nodulation strong', 'Harvested'],
    [1, 3, 2025, 'Spring', 72.0, 75.0, 'Planted post-soybeans, good snow cover', 'Harvested'],
    [1, 8, 2025, 'Fall', 2.0, 2.2, 'Winter legume cover crop for N capture', 'Harvested'],
    [1, 1, 2026, 'Spring', 190.0, null, 'Planned following clover N credit', 'Planned'],

    // Field 2: Ridge Creek 40 (Has a monoculture repetition to test alert engine!)
    [2, 1, 2023, 'Spring', 170.0, 168.0, 'First year corn on corn', 'Harvested'],
    [2, 1, 2024, 'Spring', 165.0, 154.0, 'Noticeable rootworm pressure observed', 'Harvested'],
    [2, 2, 2025, 'Spring', 52.0, 54.5, 'Switched to Soybeans to break rootworm', 'Harvested'],
    [2, 1, 2026, 'Spring', 175.0, null, 'Return to Corn after legume break', 'Planned'],

    // Field 3: River Bottom Flat (High yield alluvial rotation: Soybeans -> Corn -> Wheat)
    [3, 2, 2023, 'Spring', 60.0, 63.4, 'River silt provided optimal moisture', 'Harvested'],
    [3, 1, 2024, 'Spring', 200.0, 208.5, 'Top farm yield record', 'Harvested'],
    [3, 2, 2025, 'Spring', 62.0, 64.0, 'Clean fields, zero herbicide escapes', 'Harvested'],
    [3, 1, 2026, 'Spring', 205.0, null, 'Planned high-population hybrid', 'Planned'],

    // Field 4: East Prairie Section (Canola -> Winter Wheat -> Soybeans -> Corn)
    [4, 6, 2023, 'Spring', 46.0, 48.2, 'Canola bloom uniform', 'Harvested'],
    [4, 3, 2024, 'Spring', 70.0, 73.8, 'Wheat benefited from taproot aeration', 'Harvested'],
    [4, 2, 2025, 'Spring', 55.0, 57.0, 'High protein soybean variety', 'Harvested'],
    [4, 1, 2026, 'Spring', 185.0, null, 'Planned corn', 'Planned'],

    // Field 5: South Hill Terrace (Alfalfa multi-year forage stand)
    [5, 4, 2023, 'Spring', 5.0, 5.2, 'Alfalfa establishment year', 'Harvested'],
    [5, 4, 2024, 'Spring', 5.5, 5.8, 'Three cuttings achieved, prime dairy quality', 'Harvested'],
    [5, 4, 2025, 'Spring', 5.2, 5.1, 'Final production year of alfalfa stand', 'Harvested'],
    [5, 1, 2026, 'Spring', 195.0, null, 'Corn scheduled to take 100lb N alfalfa credit', 'Planned'],

    // Field 6: Willow Springs West (Field Peas -> Barley -> Sunflowers -> Wheat)
    [6, 5, 2023, 'Spring', 44.0, 46.5, 'Field peas inoculated with Rhizobium', 'Harvested'],
    [6, 10, 2024, 'Spring', 80.0, 85.0, 'Premium malting grade barley accepted', 'Harvested'],
    [6, 7, 2025, 'Spring', 2100.0, 2180.0, 'Confectionery sunflower contract', 'Harvested'],
    [6, 3, 2026, 'Spring', 72.0, null, 'Winter wheat planned', 'Planned'],

    // Field 7: Oak Ridge Bottom
    [7, 2, 2024, 'Spring', 54.0, 56.5, 'Good canopy closure', 'Harvested'],
    [7, 1, 2025, 'Spring', 180.0, 184.0, 'Uniform emergence', 'Harvested'],
    [7, 2, 2026, 'Spring', 58.0, null, 'Planned soybeans', 'Planned'],

    // Field 8: Sunrise Pasture
    [8, 1, 2024, 'Spring', 170.0, 172.0, 'Transition year', 'Harvested'],
    [8, 2, 2025, 'Spring', 50.0, 51.5, 'Soybeans establishing organic carbon', 'Harvested'],
    [8, 9, 2025, 'Fall', 2.5, 2.7, 'Winter rye cover to prevent sand blow', 'Harvested'],
    [8, 1, 2026, 'Spring', 180.0, null, 'Corn planned with cover terminate', 'Planned']
  ];

  for (const r of rotationsData) {
    insertRotation.run(...r);
  }

  console.log('Seeding Field Operations & Inputs...');
  const insertOp = db.prepare(`
    INSERT INTO field_operations (id, field_id, crop_id, operation_type, title, scheduled_date, completed_date, assigned_to, priority, status, weather_prerequisites, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const opsData = [
    [1, 1, 1, 'Tillage', 'Spring Vertical Tillage & Seedbed Prep', '2026-04-10', '2026-04-11', 'Jake Miller', 'Medium', 'Completed', 'Soil moisture < 20%, ground temp > 50F', 'Used Great Plains Turbo-Max at 8.5 mph. Seedbed smooth.'],
    [2, 1, 1, 'Planting', 'Corn Variable-Rate Seeding (34k seeds/ac)', '2026-04-18', '2026-04-19', 'Jake Miller', 'High', 'Completed', 'Dry soil, no frost forecast for 7 days', 'Kinze 16-row planter calibrated. Target depth 2.0 inches.'],
    [3, 1, 1, 'Fertilization', 'Side-dress 28% UAN Liquid Nitrogen (140 lbs N/ac)', '2026-05-28', null, 'Travis King', 'High', 'Planned', 'Wind < 12 mph, no standing water', 'Y-drop application around V6 vegetative stage.'],
    [4, 1, 1, 'Spraying', 'Post-Emergent Herbicide + Residual (Halex GT)', '2026-06-05', null, 'Maria Santos', 'Medium', 'Planned', 'Wind 3-9 mph, temp < 85F', 'Targeting waterhemp and giant ragweed escapes.'],
    [5, 1, 1, 'Scouting', 'Mid-Season Canopy & Drone Stand Count', '2026-06-20', null, 'Brett Walker (Agronomist)', 'Low', 'Planned', 'Clear skies, calm winds', 'Multispectral NDVI imagery flight.'],
    [6, 3, 1, 'Planting', 'High-Yield Corn Planting (36k seeds/ac)', '2026-04-20', '2026-04-21', 'Jake Miller', 'Critical', 'Completed', 'River bottom drained, warm 55F soil', 'Planting Pioneer hybrid with starter 10-34-0 in furrow.'],
    [7, 3, 1, 'Irrigation', 'Center Pivot System Test & First 0.75-inch Soak', '2026-05-15', null, 'Travis King', 'Medium', 'Planned', 'No rain in 5-day forecast', 'Inspect nozzle regulators and pivot tire pressure.'],
    [8, 2, 1, 'Planting', 'Corn Planting on Ridge Creek 40', '2026-04-24', null, 'Jake Miller', 'High', 'In Progress', 'Clear sunny window', 'Halfway complete, 45 acres seeded today.'],
    [9, 4, 1, 'Tillage', 'Pre-Plant Strip-Tillage', '2026-04-26', null, 'Travis King', 'Medium', 'Planned', 'Soil condition friable', 'Deep banding 40 lbs K2O and 30 lbs P2O5.'],
    [10, 5, 1, 'Tillage', 'Alfalfa Stand Termination & Chisel Plow', '2026-04-12', '2026-04-13', 'Travis King', 'High', 'Completed', 'Dry hill conditions', 'Terminated 3-year alfalfa sod. Excellent root channels.'],
    [11, 7, 2, 'Planting', 'No-Till Soybean Seeding (140k seeds/ac)', '2026-05-02', null, 'Maria Santos', 'High', 'Planned', 'Soil temp > 54F', 'Using John Deere 8R and 15-inch planter setup.']
  ];

  for (const o of opsData) {
    insertOp.run(...o);
  }

  const insertInput = db.prepare(`
    INSERT INTO operation_inputs (operation_id, input_name, category, quantity, unit, cost_per_unit, total_cost)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const inputsData = [
    // Op 1: Spring Tillage
    [1, 'Off-Road Farm Diesel Fuel', 'Fuel', 145.0, 'gal', 3.65, 529.25],
    [1, 'Operator Labor (Jake Miller)', 'Labor', 8.5, 'hours', 26.00, 221.00],

    // Op 2: Corn Seeding North Valley
    [2, 'Pioneer P1197AM Corn Seed (80k seed bags)', 'Seed', 51.0, 'bags', 285.00, 14535.00],
    [2, 'In-Furrow Starter Fertilizer (10-34-0)', 'Fertilizer', 600.0, 'gal', 4.10, 2460.00],
    [2, 'Equipment Fuel', 'Fuel', 95.0, 'gal', 3.65, 346.75],
    [2, 'Operator Labor', 'Labor', 10.0, 'hours', 26.00, 260.00],

    // Op 3: Side-dress Nitrogen
    [3, '28% UAN Liquid Nitrogen Solution', 'Fertilizer', 6200.0, 'gal', 2.30, 14260.00],
    [3, 'Instinct II Nitrogen Stabilizer', 'Chemical', 24.0, 'gal', 72.00, 1728.00],

    // Op 4: Herbicide spray
    [4, 'Halex GT Herbicide', 'Chemical', 55.0, 'gal', 58.00, 3190.00],
    [4, 'Class Act NG Water Conditioner / Surfactant', 'Chemical', 30.0, 'gal', 19.50, 585.00],

    // Op 6: River Bottom Corn Seeding
    [6, 'Dekalb DKC64-35RIB Seed Corn', 'Seed', 72.0, 'bags', 295.00, 21240.00],
    [6, 'Bio-Stimulant Micronutrient Starter', 'Fertilizer', 320.0, 'gal', 8.50, 2720.00],
    [6, 'Equipment Fuel', 'Fuel', 130.0, 'gal', 3.65, 474.50],

    // Op 10: Alfalfa Chisel Plow
    [10, 'Off-Road Heavy Diesel', 'Fuel', 180.0, 'gal', 3.65, 657.00],
    [10, 'Tractor Wear & Maintenance Share', 'Fuel', 1.0, 'service', 210.00, 210.00]
  ];

  for (const inp of inputsData) {
    insertInput.run(...inp);
  }

  console.log('Seeding Multi-Year Harvest Yields & Financial Performance...');
  const insertYield = db.prepare(`
    INSERT INTO harvest_yields (field_id, crop_id, year, season, harvest_date, total_yield, yield_per_acre, unit, moisture_pct, quality_grade, contract_buyer, sale_price_per_unit, total_revenue, total_input_cost, net_profit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const yieldsData = [
    // 2024 Yields
    [1, 2, 2024, 'Spring', '2024-10-14', 7104.0, 59.2, 'bu/ac', 13.2, 'US No. 1 Yellow Soybeans', 'ADM Grain Terminal', 12.10, 85958.40, 39600.00, 46358.40],
    [2, 1, 2024, 'Spring', '2024-10-22', 13090.0, 154.0, 'bu/ac', 16.4, 'US No. 2 Yellow Corn', 'Cargill Biofuels', 4.60, 60214.00, 44200.00, 16014.00],
    [3, 1, 2024, 'Spring', '2024-10-18', 33360.0, 208.5, 'bu/ac', 15.1, 'US No. 1 Yellow Corn', 'Bunge Ag', 4.75, 158460.00, 83200.00, 75260.00],
    [4, 3, 2024, 'Spring', '2024-07-28', 14760.0, 73.8, 'bu/ac', 12.5, 'Grade 1 Hard Red Winter Wheat', 'General Mills Regional', 6.65, 98154.00, 52000.00, 46154.00],
    [5, 4, 2024, 'Spring', '2024-09-05', 551.0, 5.8, 'tons/ac', 14.0, 'Premium Dairy Supreme Alfalfa', 'Riverview Dairy Cooperative', 195.00, 107445.00, 31350.00, 76095.00],
    [6, 10, 2024, 'Spring', '2024-08-10', 11900.0, 85.0, 'bu/ac', 12.8, 'Prime Malting Two-Row Barley', 'Anheuser-Busch InBev', 5.85, 69615.00, 37800.00, 31815.00],

    // 2025 Yields
    [1, 3, 2025, 'Spring', '2025-07-25', 9000.0, 75.0, 'bu/ac', 12.4, 'Grade 1 Hard Red Winter Wheat', 'General Mills Regional', 6.50, 58500.00, 34800.00, 23700.00],
    [2, 2, 2025, 'Spring', '2025-10-10', 4632.5, 54.5, 'bu/ac', 13.0, 'US No. 1 Yellow Soybeans', 'ADM Grain Terminal', 11.85, 54895.13, 28050.00, 26845.13],
    [3, 2, 2025, 'Spring', '2025-10-08', 10240.0, 64.0, 'bu/ac', 12.9, 'US No. 1 Yellow Soybeans', 'ADM Grain Terminal', 11.95, 122368.00, 52800.00, 69568.00],
    [4, 2, 2025, 'Spring', '2025-10-12', 11400.0, 57.0, 'bu/ac', 13.1, 'US No. 1 Yellow Soybeans', 'Bunge Ag', 11.90, 135660.00, 66000.00, 69660.00],
    [5, 4, 2025, 'Spring', '2025-09-02', 484.5, 5.1, 'tons/ac', 13.8, 'Dairy Quality Alfalfa', 'Riverview Dairy Cooperative', 188.00, 91086.00, 30400.00, 60686.00],
    [6, 7, 2025, 'Spring', '2025-10-25', 305200.0, 2180.0, 'lbs/ac', 9.5, 'Large Confectionery Sunflower', 'SunOpta Processing', 0.29, 88508.00, 44800.00, 43708.00],
    [7, 1, 2025, 'Spring', '2025-10-20', 12880.0, 184.0, 'bu/ac', 15.3, 'US No. 2 Yellow Corn', 'Cargill Biofuels', 4.80, 61824.00, 29400.00, 32424.00],
    [8, 2, 2025, 'Spring', '2025-10-16', 5665.0, 51.5, 'bu/ac', 13.4, 'US No. 1 Yellow Soybeans', 'ADM Grain Terminal', 11.80, 66847.00, 36300.00, 30547.00]
  ];

  for (const y of yieldsData) {
    insertYield.run(...y);
  }

  console.log('Seeding Farm Equipment Fleet...');
  const insertEquip = db.prepare(`
    INSERT INTO equipment (id, name, category, model, serial_number, year, current_hours, fuel_level_pct, status, location, last_service_date, next_service_hours, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const equipData = [
    [1, 'John Deere 8R 370', 'Tractor', '8R 370 AutoPowr IVT', '1RW8370PNN014921', 2022, 1492.0, 78.0, 'Active', 'Main Machine Shed A', '2026-03-15', 1500.0, 'Primary high-horsepower row crop tractor with dual rear wheels.'],
    [2, 'Case IH Axial-Flow 8250', 'Combine', '8250 Duals AFX Rotor', 'YJG08250KCA09214', 2021, 1010.5, 62.0, 'Maintenance Due', 'Combine Bay East', '2025-11-20', 1000.0, 'Flagship harvesting combine with 40ft draper and 12-row corn head. Overdue for 1000h rotor overhaul!'],
    [3, 'Hagie STS12 Self-Propelled Sprayer', 'Sprayer', 'STS12 120ft Carbon Boom', 'HAG12STS2023081', 2023, 492.0, 85.0, 'Active', 'Chemical Washpad Bay', '2026-02-10', 500.0, 'Precision pulse PWM spray system. 500-hour hydraulic service due in 8 operating hours!'],
    [4, 'Kinze 3600 16-Row Planter', 'Planter', '3600 Pivot Fold Bulk Fill', 'KNZ3616P2020554', 2020, 620.0, 100.0, 'Active', 'Implement Storage North', '2026-03-28', 750.0, 'Precision Planting SpeedTube and CleanSweep row cleaners installed.'],
    [5, 'Great Plains 3000 Turbo-Max', 'Tillage', '3000TM Vertical Finish', 'GP30TM20229810', 2022, 415.0, 100.0, 'Active', 'Implement Yard South', '2026-04-02', 500.0, '30-foot working width, hydraulic rolling baskets.'],
    [6, 'New Holland T7.300 Heavy Tractor', 'Tractor', 'T7.300 Auto Command PLM', 'NHT7300ZKC48102', 2023, 748.0, 91.0, 'Active', 'Main Machine Shed B', '2026-01-18', 800.0, 'Front hitch & PTO, dedicated utility, manure hauling, and forage packing.'],
    [7, 'Valley 8000 Center Pivot', 'Irrigation', '8000 Series 7-Span GPS', 'VAL8000IA201940', 2019, 3250.0, 100.0, 'Active', 'North Valley Field 1', '2025-09-30', 3500.0, 'Quarter-mile radius, AgSense remote telemetry control.'],
    [8, 'Bobcat T770 Compact Track Loader', 'Support / Loader', 'T770 High Flow Cab', 'BCT770T2021008', 2021, 1120.0, 48.0, 'Active', 'Maintenance Shop', '2026-02-22', 1200.0, 'Used for seed tender loading, bulk fertilizer handling, and farm road maintenance.']
  ];

  for (const eq of equipData) {
    insertEquip.run(...eq);
  }

  console.log('Seeding Maintenance Tasks & Schedules...');
  const insertTask = db.prepare(`
    INSERT INTO maintenance_tasks (id, equipment_id, task_name, interval_hours, last_completed_hours, last_completed_date, due_hours, estimated_cost, checklist)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tasksData = [
    // John Deere 8R
    [1, 1, '50-Hour Grease Zerks & Front Axle Lube', 50.0, 1450.0, '2026-04-10', 1500.0, 45.0, '["Grease tie rods and kingpins", "Check engine oil level", "Blow out cab air recirculation filter"]'],
    [2, 1, '250-Hour Engine Oil, Filter & Fuel Water Separator', 250.0, 1250.0, '2025-10-15', 1500.0, 380.0, '["Drain engine oil", "Replace John Deere Plus-50 II 15W-40", "Replace primary and secondary fuel filters", "Inspect serpentine drive belt"]'],

    // Case IH 8250 Combine (Overdue at 1010.5 hrs vs 1000 hrs)
    [3, 2, '500-Hour Hydraulic Fluid & Rotor Drive Belt Inspection', 500.0, 500.0, '2024-09-12', 1000.0, 850.0, '["Drain hydraulic reservoir", "Replace Case Hy-Tran Ultra Action fluid", "Inspect AFX rotor drive variator belt", "Grease header drive bearings"]'],
    [4, 2, '100-Hour Feederhouse Chain Tension & Sieve Inspection', 100.0, 950.0, '2025-10-05', 1050.0, 120.0, '["Check feederhouse slat tension", "Inspect clean grain elevator paddle wear", "Check chopper knives"]'],

    // Hagie Sprayer (492 hrs vs 500 hrs -> Due Soon in 8h)
    [5, 3, '500-Hour Hydrostatic Wheel Motor & Planetary Fluid Flush', 500.0, 0.0, '2023-04-01', 500.0, 620.0, '["Drain 4 planetary wheel hubs", "Refill with 80W-90 synthetic gear lube", "Pressure test spray solution pump seals", "Calibrate flow meter nozzles"]'],
    [6, 3, '50-Hour Spray Boom Grease & Nozzle Strainer Flush', 50.0, 450.0, '2026-03-25', 500.0, 60.0, '["Flush 50-mesh nozzle screens", "Grease boom breakaways", "Inspect hydraulic fold cylinders"]'],

    // Kinze Planter
    [7, 4, 'Annual Pre-Season Row Unit Meter Calibration & Disc Blade Check', 250.0, 500.0, '2026-03-20', 750.0, 540.0, '["Inspect opener disc diameter (>14.5 in)", "Test vacuum meter singulation", "Replace worn gauge wheel arm bushings", "Lube drive chains with dry graphite"]'],

    // Valley Pivot
    [8, 7, 'Annual Pre-Season Gearbox Oil Check & Span Alignment', 500.0, 3000.0, '2025-05-10', 3500.0, 320.0, '["Check 7 center drive gearboxes for water condensation", "Inspect pivot center collector ring", "Test auto-reverse safety stop switches"]']
  ];

  for (const t of tasksData) {
    insertTask.run(...t);
  }

  console.log('Seeding Maintenance History Logs...');
  const insertLog = db.prepare(`
    INSERT INTO maintenance_logs (equipment_id, task_id, service_date, hours_at_service, performed_by, cost, parts_replaced, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const logsData = [
    [1, 2, '2025-10-15', 1250.0, 'Travis King (Farm Tech)', 365.50, '12 gal Plus-50 II Oil, RE509672 Filter, FS19765 Fuel Filter', 'Oil sample sent to Blackstone Lab. Zero metal particulates detected.'],
    [1, 1, '2026-04-10', 1450.0, 'Jake Miller', 40.00, 'Moly grease tubes, air filter blowdown', 'Ready for spring planting duties.'],
    [2, 4, '2025-10-05', 950.0, 'Travis King', 115.00, 'Grease, new tensioner lock washer', 'Tensioned chain to factory 1.5-inch deflection.'],
    [3, 6, '2026-03-25', 450.0, 'Maria Santos', 55.00, '4 replacement TeeJet nozzle caps', 'Boom tested on water pattern table, uniform CV < 5%.'],
    [4, 7, '2026-03-20', 500.0, 'Travis King', 520.00, '16 Tru-Vee opener disc blades, 4 scraper sets', 'All row units certified for precision planting at 5-7 mph.']
  ];

  for (const l of logsData) {
    insertLog.run(...l);
  }

  console.log('Seeding Demo User Accounts...');
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, salt, full_name, role, farm_name, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const usersData = [
    [1, 'sarah@willowcreek.farm', 'farm123', 'Sarah Jenkins', 'Farm Manager', 'Willow Creek Farm', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'],
    [2, 'jake@willowcreek.farm', 'farm123', 'Jake Miller', 'Lead Agronomist & Operator', 'Willow Creek Farm', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'],
    [3, 'marcus@willowcreek.farm', 'farm123', 'Marcus Vance', 'Fleet & Machinery Tech', 'Willow Creek Farm', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80']
  ];

  for (const u of usersData) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(u[2], salt);
    insertUser.run(u[0], u[1], hash, salt, u[3], u[4], u[5], u[6]);
  }

  console.log('Database seeded successfully with realistic farm operations, rotations, equipment, users, and financial records!');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
