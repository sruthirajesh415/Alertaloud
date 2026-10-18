import { EmergencyGuide } from "../types";

export const EMERGENCY_GUIDES: EmergencyGuide[] = [
  // ================= CATEGORY A: 8 NATURAL CALAMITIES =================
  {
    id: "heavy-rain",
    title: "Heavy Rain & Waterlogging",
    category: "natural",
    icon: "CloudRain",
    authority: "National Disaster Management Authority & Meteorological Dept",
    isOfficial: true,
    summary: "Intense downpours leading to local drainage choking, road submergence, and baseline flooding.",
    before: [
      "Clear balcony, terrace, and exterior drain outlets of leaves and debris.",
      "Move electrical appliances, rugs, and lower-level documents to upper shelves or upstairs.",
      "Charge power banks, emergency flashlights, and mobile phones completely.",
      "Verify emergency drinking water supply (minimum 3 liters per person per day)."
    ],
    during: [
      "Stay indoors away from low-lying basement parking or submerged street underpasses.",
      "Avoid walking or driving through moving water; 15 cm of moving water can knock down an adult.",
      "If water begins entering living quarters, immediately switch off the main electrical MCB breaker.",
      "Keep children and elderly family members on the dry upper floor or elevated beds."
    ],
    after: [
      "Do not touch electrical outlets, wires, or submerged switches until certified dry.",
      "Boil all drinking water for at least 3 minutes before consumption.",
      "Document water damage with phone photos before clearing silt or debris.",
      "Watch for displaced rodents, insects, or snakes seeking shelter in dry corners."
    ],
    checklist: [
      "Packaged drinking water (3-day supply)",
      "High-lumen waterproof torch with extra batteries",
      "Non-perishable dry foods (biscuits, dates, nuts, canned food)",
      "Zip-lock plastic pouch for passports, ID cards, and land records",
      "Prescription medicines for 7 days in sealed bag"
    ],
    whereToGo: "Move to the highest floor of your building or designated community shelter situated at least 15 feet above street flood line.",
    emergencyNumber: "112",
    responsibleDept: "Disaster Control Room & Fire Services"
  },
  {
    id: "flood",
    title: "River Flood & Flash Flood",
    category: "natural",
    icon: "Waves",
    authority: "Central Water Commission & State Disaster Response Force",
    isOfficial: true,
    summary: "Rapid elevation of water levels from river overflow, dam water release, or flash runoff.",
    before: [
      "Identify high-ground evacuation routes that do not cross low bridges or riverbanks.",
      "Secure outdoor LPG gas cylinders, chemical containers, and loose garden items.",
      "Prepare your grab-and-go emergency go-bag by the main exit door.",
      "Move livestock or pets to higher unchained shelter ground immediately."
    ],
    during: [
      "Evacuate immediately upon official order; do not wait until water enters the living room.",
      "Never attempt to drive across flooded causeways; vehicle tires float in just 30 cm of water.",
      "Disconnect main electrical breaker and shut off cylinder gas valves before leaving.",
      "Wear sturdy non-slip footwear and take your emergency survival pouch."
    ],
    after: [
      "Return only when civil authorities officially announce the area is safe.",
      "Discard any food items that have come in contact with flood waters.",
      "Disinfect all flooded surfaces with bleach solution to prevent bacterial epidemics.",
      "Inspect building foundations and walls for structural cracks before re-occupying."
    ],
    checklist: [
      "Waterproof Go-Bag with shoulder straps",
      "Whistle for signaling search & rescue boats",
      "Essential medications and prescription copies",
      "Emergency cash in small denominations",
      "Water purification tablets or LifeStraw filter"
    ],
    whereToGo: "Designated Taluk/District Flood Relief Camp, Multi-Purpose Cyclone/Flood Shelter, or Public High School Hall on elevated ridge.",
    emergencyNumber: "112",
    responsibleDept: "State Disaster Management & Coast Guard / Army Rescue"
  },
  {
    id: "cyclone",
    title: "Cyclone & Strong Gales",
    category: "natural",
    icon: "Wind",
    authority: "Tropical Cyclone Warning Center & Meteorological Organization",
    isOfficial: true,
    summary: "High-velocity destructive winds exceeding 100 km/h, accompanied by heavy rain and tidal surges.",
    before: [
      "Board up or tape large glass windows with criss-cross heavy tape or storm shutters.",
      "Trim precarious tree branches hanging over rooflines, solar panels, or utility wires.",
      "Tie down or store inside all rooftop water tanks, metal sheets, and loose balcony furniture.",
      "Stock emergency food, non-cook staples, and infant formula for at least 5 days."
    ],
    during: [
      "Remain in the safest interior room without windows (such as a central hallway or bathroom).",
      "Beware the 'Eye of the Cyclone' — a sudden calm period lasting 30 minutes does NOT mean the storm is over; the other eyewall will follow with reversed winds.",
      "Unplug heavy electrical appliances to protect against extreme lightning surges.",
      "Keep shoes on and stay alert for falling masonry or roof tiles."
    ],
    after: [
      "Beware of snapped, fallen live electrical wires on roads and wet puddles.",
      "Do not enter damaged buildings until inspected by municipal engineers.",
      "Help injured neighbors and report blocked access roads to local emergency teams.",
      "Conserve phone battery for urgent SOS calls; avoid non-critical calls."
    ],
    checklist: [
      "Battery-powered or hand-crank AM/FM emergency radio",
      "Heavy duty emergency raincoat and gumboots",
      "First aid kit with antiseptics, gauze, and pain relievers",
      "Fully charged 20,000mAh power bank",
      "Multi-tool knife and duct tape roll"
    ],
    whereToGo: "Engineered RCC Multi-Purpose Cyclone Shelter, designated cyclone evacuation centers at least 5 km inland from the coast.",
    emergencyNumber: "112",
    responsibleDept: "Disaster Management Authority & Civil Defense"
  },
  {
    id: "lightning",
    title: "Thunderstorm & Lightning",
    category: "natural",
    icon: "Zap",
    authority: "Civil Protection & National Lightning Safety Council",
    isOfficial: true,
    summary: "Severe atmospheric electrical discharge accompanied by sudden squalls and localized hail.",
    before: [
      "Follow the 30-30 Rule: If the time between lightning and thunder is under 30 seconds, immediately take shelter indoors.",
      "Unplug sensitive electronics, modems, televisions, and charging computers.",
      "Secure outdoor pets and bring them inside the main structure.",
      "Avoid open fields, golf courses, hilltops, or tall solitary trees."
    ],
    during: [
      "Stay indoors away from concrete exterior walls, metal window frames, and plumbing fixtures.",
      "Do not take a shower or wash dishes during a lightning storm as metal pipes conduct electricity.",
      "If caught outdoors with no shelter: Crouch low on balls of feet with head tucked, minimizing contact with the ground; never lie flat.",
      "Avoid open water bodies, metal railings, fences, and utility poles."
    ],
    after: [
      "Wait at least 30 minutes after the last clap of thunder before heading outside.",
      "Administer immediate CPR if a person has been struck by lightning (they carry no residual charge and are safe to touch).",
      "Check trees and roof structures near the house for smoldering embers.",
      "Call emergency services immediately for any casualties."
    ],
    checklist: [
      "Surge protector power strips for household circuits",
      "Emergency battery lantern (do not use candles near electrical panels)",
      "First aid guide with CPR instructions",
      "Ear protection earmuffs for frightened pets or infants"
    ],
    whereToGo: "Substantial fully enclosed building with plumbing and wiring (which acts as a Faraday cage), or hard-top metal vehicle with windows rolled up.",
    emergencyNumber: "112",
    responsibleDept: "Emergency Medical Services & Fire Rescue"
  },
  {
    id: "tsunami",
    title: "Tsunami & Coastal Inundation",
    category: "natural",
    icon: "ShieldAlert",
    authority: "Intergovernmental Oceanographic Commission & Tsunami Warning Center",
    isOfficial: true,
    summary: "A series of massive, fast-moving ocean waves triggered by undersea earthquake or coastal landslide.",
    before: [
      "Recognize nature's tsunami warning signs: Strong earthquake shaking near the coast, sudden loud ocean roaring, or abnormal rapid retreat of coastal water exposing the seabed.",
      "Know your community tsunami evacuation maps and high-elevation assembly zones.",
      "Plan evacuation routes on foot, as roads quickly get choked by panic traffic."
    ],
    during: [
      "If you feel a strong earthquake near the sea, IMMEDIATELY RUN to high ground at least 30 meters (100 feet) above sea level or 3 km inland.",
      "DO NOT wait for an official siren; nature's sign is your warning.",
      "Never go down to the beach to look at exposed coral or retreating water.",
      "Remember: A tsunami is not a single wave, but a series of waves arriving over several hours. Subsequent waves are frequently larger."
    ],
    after: [
      "Stay in the high-elevation evacuation zone until authorities explicitly declare the all-clear.",
      "Avoid contaminated coastal flood waters and downed electric power lines.",
      "Check on neighbors who require physical mobility assistance.",
      "Only use mobile phones for emergency text broadcasts to keep lines open."
    ],
    checklist: [
      "Compact waterproof backpack with survival essentials",
      "Life jackets for each family member if living within 500m of shoreline",
      "Emergency whistle and signaling mirror",
      "Thermal survival space blankets",
      "Essential personal medical prescriptions"
    ],
    whereToGo: "Natural inland hill summit, high ridge (minimum 30m above sea level), or designated 4th floor or higher of engineered reinforced concrete tsunami evacuation towers.",
    emergencyNumber: "112",
    responsibleDept: "Coast Guard, Navy, & Disaster Response Force"
  },
  {
    id: "earthquake",
    title: "Earthquake & Tremor",
    category: "natural",
    icon: "Activity",
    authority: "Geological Survey & National Earthquake Center",
    isOfficial: true,
    summary: "Sudden violent ground shaking caused by subterranean tectonic plate displacement or fault slip.",
    before: [
      "Fasten heavy furniture, bookshelves, water heaters, and hanging mirrors securely to wall studs.",
      "Store heavy objects on bottom shelves to prevent lethal falling debris.",
      "Locate safe spots in every room: Under sturdy desks, tables, or interior doorframes.",
      "Keep shoes and flashlight right next to each bedroom bed."
    ],
    during: [
      "DROP, COVER, AND HOLD ON: Drop to your hands and knees, cover your head and neck under a sturdy table, and hold on until shaking stops.",
      "If no table is nearby, cover your head and face against an interior wall.",
      "Stay away from glass windows, exterior doors, and falling light fixtures.",
      "DO NOT run outside during shaking; falling brickwork and facade glass cause majority of casualties.",
      "NEVER use elevators."
    ],
    after: [
      "Be prepared for aftershocks; each aftershock can collapse already weakened structures.",
      "Check for gas leaks: If you smell sulfur or gas, open windows, evacuate immediately, and shut exterior main valve.",
      "Do not strike matches, flick electrical switches, or ignite open flames.",
      "Inspect chimneys, water pipes, and ceilings for fissures."
    ],
    checklist: [
      "Dust masks (N95 or particulate) to prevent inhaling building dust",
      "Heavy leather work gloves and thick-soled boots",
      "Crescent wrench to shut off main gas meter and water line",
      "First aid trauma kit with tourniquets and splints",
      "Battery-operated radio"
    ],
    whereToGo: "Open recreational ground, sports stadium, or wide park free from overhead high-voltage cables, glass skyscrapers, and brick boundary walls.",
    emergencyNumber: "112",
    responsibleDept: "Urban Search & Rescue (USAR) & Civil Protection"
  },
  {
    id: "landslide",
    title: "Landslide & Mudflow",
    category: "natural",
    icon: "Mountain",
    authority: "Geological Survey & Highway Safety Administration",
    isOfficial: true,
    summary: "Rapid downward movement of rock, earth, and saturated debris down steep mountain hillsides.",
    before: [
      "Stay alert to warning signs: New cracks in plaster or foundations, tilting utility poles or trees, or bulging ground.",
      "Listen for unusual sounds like trees cracking, boulders knocking together, or faint rumblings.",
      "Avoid building or camping near steep slopes, ravine mouths, or historic mudslide tracks."
    ],
    during: [
      "If you suspect landslide movement, evacuate downhill structures immediately; seconds count.",
      "Move out of the path of a debris flow directly perpendicular to the flow direction (crossways, up slope).",
      "If escape is impossible, curl into a tight protective ball and protect your head.",
      "Be alert to sudden changes in mountain stream flow (clear water turning muddy indicates uphill flow blockage)."
    ],
    after: [
      "Stay away from the slide area; secondary mudslides and soil slips frequently occur after initial movement.",
      "Check for injured or trapped persons without entering the slide track directly.",
      "Report broken utility gas lines and submerged roadways to emergency rescue teams.",
      "Re-plant damaged ground quickly with deep-root native vegetation to halt erosion."
    ],
    checklist: [
      "Emergency whistle to signal search teams if debris blocks exits",
      "Sturdy mountain hiking boots with ankle support",
      "Waterproof documentation cylinder",
      "High-energy emergency food bars",
      "Headlamp with spare lithium cells"
    ],
    whereToGo: "Designated stable ridge tops, community centers located on verified bedrock plateaus away from valley bottoms.",
    emergencyNumber: "112",
    responsibleDept: "Mountain Rescue, Police, & Fire Rescue"
  },
  {
    id: "heatwave",
    title: "Extreme Heatwave & Heatstroke",
    category: "natural",
    icon: "Sun",
    authority: "World Health Organization & National Disaster Management Authority",
    isOfficial: true,
    summary: "Prolonged periods of dangerously excessive ambient heat and humidity exceeding body tolerance.",
    before: [
      "Cover windows receiving morning or afternoon sun with curtains, blinds, or heat-reflective film.",
      "Check on elderly neighbors, patients with cardiovascular conditions, and outdoor workers.",
      "Stock Oral Rehydration Salts (ORS), electrolyte powders, buttermilk, and clean drinking water.",
      "Keep spray bottles and wet washcloths ready in the refrigerator."
    ],
    during: [
      "Avoid stepping outdoors between 11:00 AM and 4:00 PM during peak solar intensity.",
      "Drink water every 20 minutes even if you do not feel thirsty.",
      "Wear loose, lightweight, light-colored cotton clothing and wide-brim hats outdoors.",
      "NEVER leave infants, children, or pets in a parked car, even with cracked windows for 2 minutes (temperatures can exceed 55°C in minutes).",
      "Recognize Heatstroke: High body temp (>39.5°C), hot red dry skin, lack of sweat, confusion, vomiting. Move victim to shade and apply ice packs to armpits/groin immediately."
    ],
    after: [
      "Continue rehydrating with electrolyte fluids; avoid alcohol, excessive caffeine, and sugary sodas.",
      "Allow adequate nighttime ventilation once outdoor temperatures drop below indoor levels.",
      "Seek emergency medical attention if confusion, dizziness, or fainting persists."
    ],
    checklist: [
      "Packets of Oral Rehydration Solution (ORS) or electrolyte mix",
      "Digital oral/forehead thermometer",
      "Portable handheld rechargeable misting fan",
      "Wide-brim UV-blocking sun hat and 50+ SPF sunscreen",
      "Insulated thermal water flasks"
    ],
    whereToGo: "Air-conditioned public libraries, cooling centers, community halls, shopping malls, or shaded basement spaces.",
    emergencyNumber: "112",
    responsibleDept: "Emergency Medical Services & Public Health Authority"
  },

  // ================= CATEGORY B: 6 HOUSEHOLD & PERSONAL EMERGENCIES =================
  {
    id: "house-fire",
    title: "House Fire & Smoke",
    category: "household",
    icon: "Flame",
    authority: "State Fire & Emergency Rescue Service (Red Cross / NFPA Standard)",
    isOfficial: true,
    summary: "Uncontrolled indoor combustion involving electrical short circuits, kitchen oil, or furnishings.",
    before: [
      "Install and test smoke detectors on every level of the house and outside sleeping quarters.",
      "Keep a multipurpose ABC Dry Powder fire extinguisher in the kitchen and garage; know how to P-A-S-S (Pull, Aim, Squeeze, Sweep).",
      "Practice two fire escape routes from every bedroom with all family members.",
      "Never overload power extension strips or run electrical cords under heavy carpets."
    ],
    during: [
      "GET OUT, STAY OUT, AND CALL 101 / 112 / 911 IMMEDIATELY. Never re-enter a burning house for possessions.",
      "Crawl low under smoke; cleaner, cooler air is within 30 to 60 cm of the floor.",
      "Feel door handles with the BACK of your hand before opening: If hot, DO NOT open; use secondary window escape.",
      "If clothes catch fire: STOP, DROP, AND ROLL to smother flames.",
      "If trapped in a room: Close door, stuff wet towels under door crack, open window, and wave bright cloth to signal firefighters."
    ],
    after: [
      "Do not re-enter the structure until the Fire Chief has formally declared it safe.",
      "Seek medical treatment for any smoke inhalation, even if you feel fine initially (smoke toxins cause delayed pulmonary edema).",
      "Notify your insurance company and keep receipts for emergency lodging.",
      "Do not attempt to reconnect electrical wiring yourself."
    ],
    checklist: [
      "Working ABC Fire Extinguisher (min 2kg capacity)",
      "Fire-resistant document safe for certificates and wills",
      "Emergency escape ladder for 2nd floor bedrooms",
      "Emergency high-visibility signaling whistle",
      "Burn dressing hydrogel kit"
    ],
    whereToGo: "Pre-designated family neighborhood meeting point (e.g. big tree on sidewalk or mailbox 50m away from building).",
    emergencyNumber: "101 / 112",
    responsibleDept: "Fire & Rescue Department"
  },
  {
    id: "gas-leak",
    title: "LPG Gas Leak / Chemical Spill",
    category: "household",
    icon: "AlertTriangle",
    authority: "Civil Protection & Gas Safety Regulatory Authority",
    isOfficial: true,
    summary: "Pungent ethyl mercaptan odor indicating pressurized hydrocarbon gas escape with extreme explosive hazard.",
    before: [
      "Check LPG regulator rubber O-rings, hose pipe cracks, and expiry dates every 6 months.",
      "Install an automatic LPG gas leak detector alarm near kitchen floor level (LPG is heavier than air).",
      "Keep emergency LPG distributor numbers and local fire station numbers saved in family phones."
    ],
    during: [
      "DO NOT operate ANY electrical switches, doorbells, kitchen exhaust fans, or mobile phones inside the house (a tiny microscopic spark will trigger an explosion).",
      "Do not light matches, candles, gas lighters, or cigarettes.",
      "Open all doors and windows wide to allow gas to disperse into the open air.",
      "Carefully close the cylinder regulator knob/valve clockwise if safe to approach.",
      "Evacuate everyone from the house immediately and call the emergency gas helpline from OUTSIDE."
    ],
    after: [
      "Do not re-enter the property until qualified emergency technicians have cleared the premises with gas sniffers.",
      "Have a certified technician inspect the regulator, safety valve, and burner stove before lighting again.",
      "Ventilate all cabinets and floor corners where dense LPG tends to settle."
    ],
    checklist: [
      "Approved ISI/CE certified metallic wire reinforced LPG hose",
      "Gas leak sensor with audible buzzer",
      "Fire safety blanket for kitchen fires",
      "Emergency contact sticker attached directly to refrigerator"
    ],
    whereToGo: "Open outdoor street or park at least 50 meters upwind from the suspected leaking building.",
    emergencyNumber: "112 / 101",
    responsibleDept: "Fire Department & LPG Emergency Service Cell"
  },
  {
    id: "medical-emergency",
    title: "Medical Collapse & Cardiac Emergency",
    category: "household",
    icon: "HeartPulse",
    authority: "Red Cross & Emergency Medical Services (Universal First Aid Standard)",
    isOfficial: false,
    summary: "Sudden loss of consciousness, severe chest pain, breathing cessation, or stroke symptoms.",
    before: [
      "Store a complete list of all family members' existing diagnoses, blood groups, and active prescriptions on the refrigerator.",
      "Know the nearest 24/7 cardiac and trauma emergency hospital.",
      "Train at least two family members in Hands-Only CPR."
    ],
    during: [
      "Check Responsiveness and Breathing: Tap shoulders and shout 'Are you okay?' If unresponsive and not breathing normally, call 108 / 112 / 911 immediately.",
      "Hands-Only CPR: Place heel of one hand in center of victim's chest, interlock fingers, push hard and fast (100–120 beats per minute, to the beat of 'Stayin' Alive') until paramedics arrive.",
      "Suspected Stroke (F-A-S-T): Face drooping? Arm weakness? Slurred speech? Time to call emergency services instantly.",
      "If victim is breathing but unconscious and no spinal injury suspected, place them in the RECOVERY POSITION on their side."
    ],
    after: [
      "Provide arriving paramedics with the victim's exact prescription history and time of collapse.",
      "Accompany patient in ambulance with their national ID card and health insurance policy documents.",
      "Inform emergency room doctors of any known drug allergies (e.g., penicillin)."
    ],
    checklist: [
      "Digital blood pressure monitor and pulse oximeter",
      "Family medical history cards and emergency contacts in wallet",
      "Aspirin 300mg (for suspected heart attack under medical guidance)",
      "First aid trauma kit with sterile bandages and antiseptic"
    ],
    whereToGo: "Nearest 24/7 Tertiary Emergency Hospital with dedicated Cath Lab / ICU facility.",
    emergencyNumber: "108 / 112",
    responsibleDept: "Emergency Medical Services & Ambulance Fleet"
  },
  {
    id: "power-outage",
    title: "Power Outage & Electrical Hazard",
    category: "household",
    icon: "PowerOff",
    authority: "Electrical Inspectorate & National Grid Safety",
    isOfficial: true,
    summary: "Prolonged electrical grid collapse, downed live wires, or internal main panel electrical fault.",
    before: [
      "Keep critical medical equipment (e.g. oxygen concentrator, suction units) equipped with working backup batteries or an emergency generator.",
      "Maintain a solar or battery-backed inverter system for basic lighting and communication.",
      "Unplug expensive sensitive electronics before an anticipated storm outage."
    ],
    during: [
      "Keep refrigerator and freezer doors tightly closed to maintain temperature (unopened fridge keeps food cold for 4 hours; full freezer for 48 hours).",
      "Use LED battery lanterns or flashlights; avoid open flame candles which cause home fires.",
      "Turn off major switches and appliances to prevent power surge damage when electricity is suddenly restored.",
      "Never run a gasoline or diesel generator inside a house, garage, or enclosed space (carbon monoxide poisoning kills silently within minutes)."
    ],
    after: [
      "Check food safety: Discard any perishable food that has been above 5°C (40°F) for two hours or more.",
      "Turn on essential appliances one by one once the grid stabilizes.",
      "Replenish batteries and fuel reserves for the next emergency."
    ],
    checklist: [
      "High-capacity rechargeable power bank with solar charging capability",
      "LED emergency lighting system with magnetic mount",
      "Battery-powered carbon monoxide detector",
      "Thermal cooler box with reusable ice packs"
    ],
    whereToGo: "Community cooling/warming centers or municipal buildings with continuous generator backups.",
    emergencyNumber: "112 / Electricity Dept",
    responsibleDept: "Electrical Grid Authority & Municipal Emergency Cell"
  },
  {
    id: "break-in",
    title: "Break-in & Personal Safety Threat",
    category: "household",
    icon: "Shield",
    authority: "Police Department & Home Safety Council",
    isOfficial: true,
    summary: "Forced entry, suspicious intruders, or active personal security threat at residence.",
    before: [
      "Reinforce exterior door deadbolts, window latches, and sliding patio door security bars.",
      "Install motion-sensor perimeter security lights and a smart video doorbell.",
      "Designate a 'Safe Room' in the house with a solid-core lockable door, phone, and second exit."
    ],
    during: [
      "If you hear an intruder: Stay in your locked Safe Room, stay silent, and dial Police (100 / 112 / 911) immediately.",
      "Keep voice down to a whisper; inform the dispatcher of your exact address and where you are hiding.",
      "Do not attempt to confront an armed burglar over possessions; property can be replaced, lives cannot.",
      "Trigger the AlertAloud WhatsApp Neighbour SOS to alert nearby trusted neighbours without making a sound."
    ],
    after: [
      "Do not touch or disturb anything until police forensic teams have documented the crime scene.",
      "Provide responding officers with camera footage or physical descriptions.",
      "Replace all compromised locks and change digital garage door codes immediately."
    ],
    checklist: [
      "High-decibel personal panic alarm or air horn",
      "Heavy duty door security brace bar",
      "Working home security cameras with cloud recording",
      "Pepper spray or defensive deterrent within easy reach"
    ],
    whereToGo: "Safe Room inside house with locked door, or trusted neighbor's brightly lit residence once coast is clear.",
    emergencyNumber: "100 / 112",
    responsibleDept: "Police Emergency Response Team"
  },
  {
    id: "road-accident",
    title: "Road Traffic Accident & Collision",
    category: "household",
    icon: "Car",
    authority: "Highway Patrol & Trauma Response Network",
    isOfficial: true,
    summary: "Vehicular crash involving vehicle damage, trapped passengers, or pedestrian trauma.",
    before: [
      "Keep an emergency automotive glass breaker and seatbelt cutter within driver's arm reach.",
      "Carry a certified red reflective warning triangle and high-visibility yellow vest in trunk.",
      "Store emergency ICE (In Case of Emergency) contacts on your mobile lock screen."
    ],
    during: [
      "Ensure Safety First: Turn on vehicle hazard lights immediately and set up warning triangles 50 meters back to prevent secondary collisions.",
      "Turn off vehicle ignition keys to minimize fuel vapor fire risk.",
      "Do NOT move an injured or unconscious passenger unless there is an immediate fire hazard (moving causes irreversible spinal paralysis).",
      "Call 112 / 108 immediately. Report the exact highway milestone, lane, and number of injured individuals."
    ],
    after: [
      "Exchange driver licenses, vehicle registration, and insurance carrier details calmly.",
      "Take wide-angle photographs of vehicle positions, skid marks, and road conditions.",
      "Consult a doctor even after minor collisions for whiplash, internal bleeding, or concussion."
    ],
    checklist: [
      "Emergency seatbelt cutter and window glass punch",
      "High-visibility reflective vest",
      "Automotive trauma first aid pack (burn dressings, pressure bandages)",
      "Red reflective folding breakdown triangle"
    ],
    whereToGo: "Beyond highway guardrails on elevated embankment away from active high-speed traffic lanes.",
    emergencyNumber: "112 / 108",
    responsibleDept: "Highway Police & Trauma Ambulance Services"
  }
];
