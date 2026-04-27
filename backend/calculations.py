import swisseph as swe
from datetime import date, datetime, timedelta
from typing import Optional
import pytz
from timezonefinder import TimezoneFinder

SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
]

NAKSHATRAS = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
    'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
    'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha',
    'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
]

NAKSHATRA_LORDS = [
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu',
    'Jupiter', 'Saturn', 'Mercury', 'Ketu', 'Venus', 'Sun',
    'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu',
    'Jupiter', 'Saturn', 'Mercury'
]

DASHA_SEQUENCE = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury']
DASHA_YEARS = {
    'Ketu': 7, 'Venus': 20, 'Sun': 6, 'Moon': 10, 'Mars': 7,
    'Rahu': 18, 'Jupiter': 16, 'Saturn': 19, 'Mercury': 17
}
TOTAL_DASHA_YEARS = 120

NAK_SIZE = 360.0 / 27.0

PLANET_IDS = {
    'Sun': swe.SUN,
    'Moon': swe.MOON,
    'Mercury': swe.MERCURY,
    'Venus': swe.VENUS,
    'Mars': swe.MARS,
    'Jupiter': swe.JUPITER,
    'Saturn': swe.SATURN,
    'Rahu': swe.MEAN_NODE,
}

# Navamsa (D-9) starting sign index by birth sign's element
NAVAMSA_START = {
    0: 0, 4: 0, 8: 0,    # Fire  → Aries
    1: 9, 5: 9, 9: 9,    # Earth → Capricorn
    2: 6, 6: 6, 10: 6,   # Air   → Libra
    3: 3, 7: 3, 11: 3,   # Water → Cancer
}

# Dignity tables
EXALTATION_SIGN = {
    'Sun': 0, 'Moon': 1, 'Mercury': 5, 'Venus': 11,
    'Mars': 9, 'Jupiter': 3, 'Saturn': 6, 'Rahu': 1, 'Ketu': 7
}
DEBILITATION_SIGN = {p: (s + 6) % 12 for p, s in EXALTATION_SIGN.items()}
OWN_SIGNS = {
    'Sun': [4], 'Moon': [3], 'Mercury': [2, 5], 'Venus': [1, 6],
    'Mars': [0, 7], 'Jupiter': [8, 11], 'Saturn': [9, 10],
    'Rahu': [], 'Ketu': []
}
# (sign_index, from_degree, to_degree)
MOOLATRIKONA = {
    'Sun': (4, 0, 20), 'Moon': (1, 4, 20), 'Mercury': (5, 16, 20),
    'Venus': (6, 0, 15), 'Mars': (0, 0, 12), 'Jupiter': (8, 0, 10),
    'Saturn': (10, 0, 20),
}

# Combustion orbs in degrees (using direct orbs; retrograde planets slightly tighter but kept simple)
COMBUST_ORBS = {
    'Moon': 12, 'Mercury': 14, 'Venus': 10,
    'Mars': 17, 'Jupiter': 11, 'Saturn': 15,
}

# Sign lordship (used for house lord calculation and yoga detection)
SIGN_LORDS = {
    0: 'Mars', 1: 'Venus', 2: 'Mercury', 3: 'Moon', 4: 'Sun', 5: 'Mercury',
    6: 'Venus', 7: 'Mars', 8: 'Jupiter', 9: 'Saturn', 10: 'Saturn', 11: 'Jupiter',
}

# Which planet is exalted in each sign (excludes Rahu/Ketu)
EXALTED_IN_SIGN = {sign: planet for planet, sign in EXALTATION_SIGN.items() if planet not in ('Rahu', 'Ketu')}

# Panchanga tables
TITHIS = [
    'Shukla Pratipada', 'Shukla Dwitiya', 'Shukla Tritiya', 'Shukla Chaturthi',
    'Shukla Panchami', 'Shukla Shashthi', 'Shukla Saptami', 'Shukla Ashtami',
    'Shukla Navami', 'Shukla Dashami', 'Shukla Ekadashi', 'Shukla Dwadashi',
    'Shukla Trayodashi', 'Shukla Chaturdashi', 'Purnima',
    'Krishna Pratipada', 'Krishna Dwitiya', 'Krishna Tritiya', 'Krishna Chaturthi',
    'Krishna Panchami', 'Krishna Shashthi', 'Krishna Saptami', 'Krishna Ashtami',
    'Krishna Navami', 'Krishna Dashami', 'Krishna Ekadashi', 'Krishna Dwadashi',
    'Krishna Trayodashi', 'Krishna Chaturdashi', 'Amavasya'
]
VARAS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
YOGA_NAMES_LIST = [
    'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda',
    'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata',
    'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva',
    'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti'
]
# 60 karanas: index 0 = Kimstughna (fixed), 1-56 = 7 repeating × 8, 57-59 = 3 fixed
_REPEATING_KARANAS = ['Bava', 'Balava', 'Kaulava', 'Taitula', 'Garaja', 'Vanija', 'Vishti']
KARANA_NAMES = ['Kimstughna'] + _REPEATING_KARANAS * 8 + ['Shakuni', 'Chatushpada', 'Naga']

_tf = TimezoneFinder()


def _lon_to_info(longitude: float) -> dict:
    lon = longitude % 360
    sign_index = int(lon / 30)
    degree_in_sign = lon % 30
    nak_index = int(lon / NAK_SIZE)
    pada = int((lon % NAK_SIZE) / (NAK_SIZE / 4)) + 1
    return {
        'sign': SIGNS[sign_index],
        'sign_index': sign_index,
        'degree': round(degree_in_sign, 4),
        'longitude': round(lon, 6),
        'nakshatra': NAKSHATRAS[nak_index],
        'nakshatra_index': nak_index,
        'nakshatra_lord': NAKSHATRA_LORDS[nak_index],
        'pada': pada,
    }


def _navamsa_sign_index(longitude: float) -> int:
    lon = longitude % 360
    sign_index = int(lon / 30)
    navamsa_offset = int((lon % 30) / (30.0 / 9))
    return (NAVAMSA_START[sign_index] + navamsa_offset) % 12


def _dasamsa_sign_index(longitude: float) -> int:
    lon = longitude % 360
    sign_index = int(lon / 30)
    dasamsa_offset = int((lon % 30) / 3)
    # Odd signs (0-indexed even): start from same sign; even signs: start from 9th
    start = sign_index if sign_index % 2 == 0 else (sign_index + 8) % 12
    return (start + dasamsa_offset) % 12


def _get_dignity(planet_name: str, sign_index: int, degree: float) -> str:
    if sign_index == EXALTATION_SIGN.get(planet_name):
        return 'exalted'
    if sign_index == DEBILITATION_SIGN.get(planet_name):
        return 'debilitated'
    if planet_name in MOOLATRIKONA:
        mt_sign, mt_from, mt_to = MOOLATRIKONA[planet_name]
        if sign_index == mt_sign and mt_from <= degree <= mt_to:
            return 'moolatrikona'
    if sign_index in OWN_SIGNS.get(planet_name, []):
        return 'own'
    return 'neutral'


def _birth_jd(birth_date: date, birth_time: str, lat: float, lon: float) -> float:
    """Convert local birth time to Julian Day (UT)."""
    hour, minute = map(int, birth_time.split(':'))
    tz_name = _tf.timezone_at(lat=lat, lng=lon) or 'UTC'
    tz = pytz.timezone(tz_name)
    local_dt = datetime(birth_date.year, birth_date.month, birth_date.day, hour, minute)
    local_dt = tz.localize(local_dt)
    utc_dt = local_dt.utctimetuple()
    hour_ut = utc_dt.tm_hour + utc_dt.tm_min / 60.0
    return swe.julday(utc_dt.tm_year, utc_dt.tm_mon, utc_dt.tm_mday, hour_ut)


def _detect_yogas(planets: dict, lagna_sign_index: int) -> list:
    yogas = []
    KENDRAS = {1, 4, 7, 10}
    TRIKONAS = {1, 5, 9}

    def house_lord(house_num: int) -> str:
        return SIGN_LORDS[(lagna_sign_index + house_num - 1) % 12]

    # --- 1. Pancha Mahapurusha (priority 1) ---
    MAHA = {
        'Mars': ('Ruchaka', 'Pancha Mahapurusha'),
        'Mercury': ('Bhadra', 'Pancha Mahapurusha'),
        'Jupiter': ('Hamsa', 'Pancha Mahapurusha'),
        'Venus': ('Malavya', 'Pancha Mahapurusha'),
        'Saturn': ('Shasha', 'Pancha Mahapurusha'),
    }
    for planet, (yoga_name, yoga_type) in MAHA.items():
        p = planets.get(planet)
        if not p:
            continue
        if p['house'] in KENDRAS and p.get('dignity', '') in ('exalted', 'own', 'moolatrikona'):
            yogas.append({
                'name': yoga_name,
                'type': yoga_type,
                'planets': [planet],
                'houses': [p['house']],
                'description': f'{planet} {p["dignity"]} in kendra (house {p["house"]})',
                'priority': 1,
            })

    # --- 2. Raj Yoga: kendra lord + trikona lord conjunct or in mutual exchange (priority 2) ---
    kendra_lords = {house_lord(h) for h in KENDRAS}
    trikona_lords = {house_lord(h) for h in TRIKONAS}
    raj_pairs_seen: set = set()
    exchange_pairs_for_raj: set = set()

    for k_lord in kendra_lords:
        for t_lord in trikona_lords:
            if k_lord == t_lord:
                continue
            pair = frozenset([k_lord, t_lord])
            if pair in raj_pairs_seen:
                continue
            k_p = planets.get(k_lord)
            t_p = planets.get(t_lord)
            if not k_p or not t_p:
                continue
            k_h = next((h for h in KENDRAS if house_lord(h) == k_lord), '?')
            t_h = next((h for h in TRIKONAS if house_lord(h) == t_lord), '?')

            if k_p['house'] == t_p['house']:
                raj_pairs_seen.add(pair)
                yogas.append({
                    'name': 'Raj Yoga',
                    'type': 'Raj Yoga',
                    'planets': [k_lord, t_lord],
                    'houses': [k_p['house']],
                    'description': f'{k_lord} (H{k_h} lord) and {t_lord} (H{t_h} lord) conjunct in H{k_p["house"]}',
                    'priority': 2,
                })
            elif SIGN_LORDS.get(k_p['sign_index']) == t_lord and SIGN_LORDS.get(t_p['sign_index']) == k_lord:
                raj_pairs_seen.add(pair)
                exchange_pairs_for_raj.add(pair)
                yogas.append({
                    'name': 'Raj Yoga',
                    'type': 'Raj Yoga',
                    'planets': [k_lord, t_lord],
                    'houses': [k_p['house'], t_p['house']],
                    'description': f'{k_lord} (H{k_h} lord) and {t_lord} (H{t_h} lord) in mutual exchange',
                    'priority': 2,
                })

    # --- 3. Neecha Bhanga Raja Yoga: debilitation cancelled by kendra placement (priority 3) ---
    for planet_name in ('Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'):
        p = planets.get(planet_name)
        if not p or p.get('dignity') != 'debilitated':
            continue
        deb_sign = DEBILITATION_SIGN[planet_name]
        cancellation = False
        # Condition 1: lord of the debilitation sign is in a kendra from lagna
        deb_lord_p = planets.get(SIGN_LORDS[deb_sign])
        if deb_lord_p and deb_lord_p['house'] in KENDRAS:
            cancellation = True
        # Condition 2: the planet exalted in that sign is in a kendra from lagna
        exalted_p = planets.get(EXALTED_IN_SIGN.get(deb_sign, ''))
        if exalted_p and exalted_p['house'] in KENDRAS:
            cancellation = True
        if cancellation:
            yogas.append({
                'name': 'Neecha Bhanga Raja Yoga',
                'type': 'Raj Yoga',
                'planets': [planet_name],
                'houses': [p['house']],
                'description': f'{planet_name} debilitation cancelled — strength through reversal',
                'priority': 3,
            })

    moon = planets.get('Moon')
    jupiter = planets.get('Jupiter')
    sun = planets.get('Sun')
    mercury = planets.get('Mercury')
    mars = planets.get('Mars')
    venus = planets.get('Venus')

    # --- 4. Gajakesari: Jupiter in kendra from Moon (priority 4) ---
    if moon and jupiter:
        jup_from_moon = (jupiter['sign_index'] - moon['sign_index']) % 12 + 1
        if jup_from_moon in KENDRAS:
            yogas.append({
                'name': 'Gajakesari',
                'type': 'Benefic',
                'planets': ['Jupiter', 'Moon'],
                'houses': [moon['house'], jupiter['house']],
                'description': f'Jupiter in house {jup_from_moon} from Moon',
                'priority': 4,
            })

    # --- 5. Parivartana Yoga: mutual sign exchange, not already counted as Raj Yoga (priority 5) ---
    physical = [n for n in ('Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn') if n in planets]
    parivartana_seen: set = set()
    for i, p1_name in enumerate(physical):
        for p2_name in physical[i + 1:]:
            pair = frozenset([p1_name, p2_name])
            if pair in exchange_pairs_for_raj or pair in parivartana_seen:
                continue
            p1 = planets[p1_name]
            p2 = planets[p2_name]
            if SIGN_LORDS.get(p1['sign_index']) == p2_name and SIGN_LORDS.get(p2['sign_index']) == p1_name:
                parivartana_seen.add(pair)
                yogas.append({
                    'name': 'Parivartana Yoga',
                    'type': 'Exchange',
                    'planets': [p1_name, p2_name],
                    'houses': [p1['house'], p2['house']],
                    'description': f'{p1_name} and {p2_name} in mutual sign exchange',
                    'priority': 5,
                })

    # --- 6. Budha-Aditya: Sun and Mercury conjunct (priority 5) ---
    if sun and mercury and sun['house'] == mercury['house']:
        yogas.append({
            'name': 'Budha-Aditya',
            'type': 'Intelligence',
            'planets': ['Sun', 'Mercury'],
            'houses': [sun['house']],
            'description': f'Sun and Mercury conjunct in house {sun["house"]}',
            'priority': 5,
        })

    # --- 7. Chandra-Mangala: Moon and Mars conjunct (priority 5) ---
    if moon and mars and moon['house'] == mars['house']:
        yogas.append({
            'name': 'Chandra-Mangala',
            'type': 'Wealth',
            'planets': ['Moon', 'Mars'],
            'houses': [moon['house']],
            'description': f'Moon and Mars conjunct in house {moon["house"]}',
            'priority': 5,
        })

    # --- 8. Adhi Yoga: 2+ of Mercury/Jupiter/Venus in 6th–8th from Moon (priority 5) ---
    if moon:
        moon_si = moon['sign_index']
        benefics_in_678 = [
            n for n in ('Mercury', 'Jupiter', 'Venus')
            if planets.get(n) and (planets[n]['sign_index'] - moon_si) % 12 + 1 in {6, 7, 8}
        ]
        if len(benefics_in_678) >= 2:
            yogas.append({
                'name': 'Adhi Yoga',
                'type': 'Benefic',
                'planets': benefics_in_678,
                'houses': [planets[n]['house'] for n in benefics_in_678],
                'description': f'{", ".join(benefics_in_678)} in 6th–8th from Moon',
                'priority': 5,
            })

    # --- 9. Sunapha: planets in 2nd from Moon (priority 6) ---
    if moon:
        moon_si = moon['sign_index']
        excluded = {'Moon', 'Sun', 'Rahu', 'Ketu'}
        sunapha = [n for n, p in planets.items() if n not in excluded and p['sign_index'] == (moon_si + 1) % 12]
        if sunapha:
            yogas.append({
                'name': 'Sunapha',
                'type': 'Moon Yoga',
                'planets': ['Moon'] + sunapha,
                'houses': [moon['house']] + [planets[n]['house'] for n in sunapha],
                'description': f'{", ".join(sunapha)} in 2nd from Moon',
                'priority': 6,
            })

    # --- 10. Anapha: planets in 12th from Moon (priority 6) ---
    if moon:
        moon_si = moon['sign_index']
        excluded = {'Moon', 'Sun', 'Rahu', 'Ketu'}
        anapha = [n for n, p in planets.items() if n not in excluded and p['sign_index'] == (moon_si - 1) % 12]
        if anapha:
            yogas.append({
                'name': 'Anapha',
                'type': 'Moon Yoga',
                'planets': ['Moon'] + anapha,
                'houses': [moon['house']] + [planets[n]['house'] for n in anapha],
                'description': f'{", ".join(anapha)} in 12th from Moon',
                'priority': 6,
            })

    # --- 11. Vesi / Vasi: planets in 2nd / 12th from Sun (priority 7) ---
    if sun:
        sun_si = sun['sign_index']
        excluded = ('Sun', 'Moon', 'Rahu', 'Ketu')
        vesi = [n for n, p in planets.items() if n not in excluded and p['sign_index'] == (sun_si + 1) % 12]
        vasi = [n for n, p in planets.items() if n not in excluded and p['sign_index'] == (sun_si - 1) % 12]
        if vesi:
            yogas.append({
                'name': 'Vesi',
                'type': 'Sun Yoga',
                'planets': ['Sun'] + vesi,
                'houses': [sun['house']] + [planets[n]['house'] for n in vesi],
                'description': f'{", ".join(vesi)} in 2nd from Sun',
                'priority': 7,
            })
        if vasi:
            yogas.append({
                'name': 'Vasi',
                'type': 'Sun Yoga',
                'planets': ['Sun'] + vasi,
                'houses': [sun['house']] + [planets[n]['house'] for n in vasi],
                'description': f'{", ".join(vasi)} in 12th from Sun',
                'priority': 7,
            })

    # --- 12. Kemadruma: no planets in 2nd or 12th from Moon (priority 8 — affliction, lowest) ---
    if moon:
        moon_si = moon['sign_index']
        adj = {(moon_si + 1) % 12, (moon_si - 1) % 12}
        adjacent = [n for n, p in planets.items() if n not in ('Moon', 'Sun', 'Rahu', 'Ketu') and p['sign_index'] in adj]
        if not adjacent:
            yogas.append({
                'name': 'Kemadruma',
                'type': 'Affliction',
                'planets': ['Moon'],
                'houses': [moon['house']],
                'description': 'No planets in 2nd or 12th from Moon',
                'priority': 8,
            })

    # Sort by priority (most significant first), cap at 6
    yogas.sort(key=lambda y: y.get('priority', 9))
    return yogas[:6]


def _calculate_panchanga(jd: float, sun_lon: float, moon_lon: float) -> dict:
    elongation = (moon_lon - sun_lon) % 360

    # Tithi: each tithi = 12° of elongation
    tithi_index = int(elongation / 12)  # 0–29

    # Vara: convert JD to Vedic weekday (0=Sun … 6=Sat)
    y, mo, d, _ = swe.revjul(jd)
    dt = date(y, mo, int(d))
    python_wd = dt.weekday()          # 0=Mon … 6=Sun
    vedic_vara = (python_wd + 1) % 7  # 0=Sun, 1=Mon … 6=Sat

    # Yoga: (Sun + Moon) / (360/27)
    yoga_index = int(((sun_lon + moon_lon) % 360) / (360.0 / 27))  # 0–26

    # Karana: each karana = 6° of elongation
    karana_index = int(elongation / 6) % 60  # 0–59

    return {
        'tithi': TITHIS[tithi_index],
        'tithi_index': tithi_index + 1,
        'vara': VARAS[vedic_vara],
        'yoga': YOGA_NAMES_LIST[yoga_index],
        'yoga_index': yoga_index + 1,
        'karana': KARANA_NAMES[karana_index],
        'karana_index': karana_index + 1,
    }


def calculate_chart(birth_date: date, birth_time: str, lat: float, lon: float) -> dict:
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL

    jd = _birth_jd(birth_date, birth_time, lat, lon)
    ayanamsa = swe.get_ayanamsa_ut(jd)

    # Ascendant: compute tropical then subtract ayanamsa
    cusps, ascmc = swe.houses_ex(jd, lat, lon, b'P')
    lagna_lon = (ascmc[0] - ayanamsa) % 360
    lagna_info = _lon_to_info(lagna_lon)
    lagna_sign_index = lagna_info['sign_index']

    # Planets
    planets: dict = {}
    raw_lons: dict = {}
    for planet_name, planet_id in PLANET_IDS.items():
        result, _ = swe.calc_ut(jd, planet_id, flags)
        p_lon = result[0] % 360
        raw_lons[planet_name] = p_lon
        info = _lon_to_info(p_lon)
        info['name'] = planet_name
        info['house'] = (info['sign_index'] - lagna_sign_index) % 12 + 1
        info['is_retrograde'] = bool(result[3] < 0)
        planets[planet_name] = info

    # Ketu = Rahu + 180°
    ketu_lon = (raw_lons['Rahu'] + 180) % 360
    raw_lons['Ketu'] = ketu_lon
    ketu_info = _lon_to_info(ketu_lon)
    ketu_info['name'] = 'Ketu'
    ketu_info['house'] = (ketu_info['sign_index'] - lagna_sign_index) % 12 + 1
    ketu_info['is_retrograde'] = False
    planets['Ketu'] = ketu_info

    # Combust + dignity (requires Sun longitude already computed)
    sun_lon = raw_lons['Sun']
    for planet_name, p in planets.items():
        p['dignity'] = _get_dignity(planet_name, p['sign_index'], p['degree'])
        if planet_name in ('Sun', 'Rahu', 'Ketu'):
            p['combust'] = False
        else:
            orb = COMBUST_ORBS.get(planet_name, 15)
            dist = abs((raw_lons[planet_name] - sun_lon + 180) % 360 - 180)
            p['combust'] = bool(dist <= orb)

    # D-9 Navamsa
    lagna_nav_si = _navamsa_sign_index(lagna_lon)
    navamsa: dict = {
        'Lagna': {'sign': SIGNS[lagna_nav_si], 'sign_index': lagna_nav_si, 'house': 1}
    }
    for planet_name, p_lon in raw_lons.items():
        nav_si = _navamsa_sign_index(p_lon)
        navamsa[planet_name] = {
            'sign': SIGNS[nav_si],
            'sign_index': nav_si,
            'house': (nav_si - lagna_nav_si) % 12 + 1,
        }

    # D-10 Dasamsa
    lagna_das_si = _dasamsa_sign_index(lagna_lon)
    dasamsa: dict = {
        'Lagna': {'sign': SIGNS[lagna_das_si], 'sign_index': lagna_das_si, 'house': 1}
    }
    for planet_name, p_lon in raw_lons.items():
        das_si = _dasamsa_sign_index(p_lon)
        dasamsa[planet_name] = {
            'sign': SIGNS[das_si],
            'sign_index': das_si,
            'house': (das_si - lagna_das_si) % 12 + 1,
        }

    return {
        'lagna': lagna_info,
        'planets': planets,
        'navamsa': navamsa,
        'dasamsa': dasamsa,
        'panchanga': _calculate_panchanga(jd, planets['Sun']['longitude'], planets['Moon']['longitude']),
        'yogas': _detect_yogas(planets, lagna_sign_index),
        'metadata': {
            'julian_day_ut': round(jd, 6),
            'ayanamsa': round(ayanamsa, 6),
            'computation_version': '1.1.0',
            'computed_at': datetime.utcnow().isoformat() + 'Z',
        },
    }


def _build_antardashas(maha_planet: str, maha_start: date, maha_actual_years: float) -> list:
    maha_idx = DASHA_SEQUENCE.index(maha_planet)
    antardashas = []
    antar_start = maha_start
    for i in range(9):
        ap = DASHA_SEQUENCE[(maha_idx + i) % 9]
        antar_years = (maha_actual_years * DASHA_YEARS[ap]) / TOTAL_DASHA_YEARS
        antar_end = _add_years(antar_start, antar_years)
        antar_idx = DASHA_SEQUENCE.index(ap)
        pratyantar = []
        pt_start = antar_start
        for j in range(9):
            pp = DASHA_SEQUENCE[(antar_idx + j) % 9]
            pt_years = (antar_years * DASHA_YEARS[pp]) / TOTAL_DASHA_YEARS
            pt_end = _add_years(pt_start, pt_years)
            pratyantar.append({
                'planet': pp,
                'start_date': pt_start.isoformat(),
                'end_date': pt_end.isoformat(),
            })
            pt_start = pt_end
        antardashas.append({
            'planet': ap,
            'start_date': antar_start.isoformat(),
            'end_date': antar_end.isoformat(),
            'pratyantardashas': pratyantar,
        })
        antar_start = antar_end
    return antardashas


def calculate_dasha(birth_date: date, moon_longitude: float) -> dict:
    moon_lon = moon_longitude % 360
    nak_index = int(moon_lon / NAK_SIZE)
    nak_lord = NAKSHATRA_LORDS[nak_index]
    fraction_remaining = 1.0 - (moon_lon - nak_index * NAK_SIZE) / NAK_SIZE
    first_years = DASHA_YEARS[nak_lord] * fraction_remaining

    mahadashas = []
    current = birth_date

    end = _add_years(current, first_years)
    mahadashas.append({
        'planet': nak_lord,
        'start_date': current.isoformat(),
        'end_date': end.isoformat(),
        'years': round(first_years, 4),
        'antardashas': _build_antardashas(nak_lord, current, first_years),
    })
    current = end

    idx = (DASHA_SEQUENCE.index(nak_lord) + 1) % 9
    while (current - birth_date).days < 200 * 365:
        planet = DASHA_SEQUENCE[idx]
        years = float(DASHA_YEARS[planet])
        end = _add_years(current, years)
        mahadashas.append({
            'planet': planet,
            'start_date': current.isoformat(),
            'end_date': end.isoformat(),
            'years': years,
            'antardashas': _build_antardashas(planet, current, years),
        })
        current = end
        idx = (idx + 1) % 9

    today = date.today()
    current_maha = current_antar = current_pratyantar = None

    for m in mahadashas:
        if date.fromisoformat(m['start_date']) <= today <= date.fromisoformat(m['end_date']):
            current_maha = m
            for a in m['antardashas']:
                if date.fromisoformat(a['start_date']) <= today <= date.fromisoformat(a['end_date']):
                    current_antar = a
                    for pt in a['pratyantardashas']:
                        if date.fromisoformat(pt['start_date']) <= today <= date.fromisoformat(pt['end_date']):
                            current_pratyantar = pt
                            break
                    break
            break

    return {
        'current_mahadasha': current_maha,
        'current_antardasha': current_antar,
        'current_pratyantardasha': current_pratyantar,
        'all_mahadashas': mahadashas[:20],
    }


def _add_years(d: date, years: float) -> date:
    return d + timedelta(days=int(years * 365.25))
