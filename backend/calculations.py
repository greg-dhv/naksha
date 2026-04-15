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

# Each nakshatra is ruled by a planet in this order, cycling through 27
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

NAK_SIZE = 360.0 / 27.0  # ~13.333°

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
        'pada': pada,
    }


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


def calculate_chart(
    birth_date: date,
    birth_time: str,
    lat: float,
    lon: float,
) -> dict:
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL

    jd = _birth_jd(birth_date, birth_time, lat, lon)

    # Ascendant — Whole Sign houses ('W')
    try:
        cusps, ascmc = swe.houses_ex(jd, lat, lon, b'W', flags)
    except Exception:
        # Fallback: use Placidus and extract ascendant only
        cusps, ascmc = swe.houses_ex(jd, lat, lon, b'P', flags)

    lagna_lon = ascmc[0] % 360
    lagna_info = _lon_to_info(lagna_lon)
    lagna_sign_index = lagna_info['sign_index']

    # Planets
    planets = {}
    for planet_name, planet_id in PLANET_IDS.items():
        result, _ = swe.calc_ut(jd, planet_id, flags)
        p_lon = result[0] % 360
        speed = result[3]

        info = _lon_to_info(p_lon)
        info['name'] = planet_name
        info['house'] = (info['sign_index'] - lagna_sign_index) % 12 + 1
        info['is_retrograde'] = bool(speed < 0)
        planets[planet_name] = info

    # Ketu = Rahu + 180°
    ketu_lon = (planets['Rahu']['longitude'] + 180) % 360
    ketu_info = _lon_to_info(ketu_lon)
    ketu_info['name'] = 'Ketu'
    ketu_info['house'] = (ketu_info['sign_index'] - lagna_sign_index) % 12 + 1
    ketu_info['is_retrograde'] = False
    planets['Ketu'] = ketu_info

    return {'lagna': lagna_info, 'planets': planets}


def calculate_dasha(birth_date: date, moon_longitude: float) -> dict:
    moon_lon = moon_longitude % 360
    nak_index = int(moon_lon / NAK_SIZE)
    nak_lord = NAKSHATRA_LORDS[nak_index]

    # Fraction of current nakshatra elapsed
    nak_start = nak_index * NAK_SIZE
    fraction_elapsed = (moon_lon - nak_start) / NAK_SIZE
    fraction_remaining = 1.0 - fraction_elapsed

    start_dasha_idx = DASHA_SEQUENCE.index(nak_lord)
    first_dasha_years = DASHA_YEARS[nak_lord] * fraction_remaining

    mahadashas = []
    current = birth_date

    # First (partial) dasha
    end = _add_years(current, first_dasha_years)
    mahadashas.append({
        'planet': nak_lord,
        'start_date': current.isoformat(),
        'end_date': end.isoformat(),
        'years': round(first_dasha_years, 4),
    })
    current = end

    # Subsequent full dashas — build enough to cover ~200 years from birth
    idx = (start_dasha_idx + 1) % 9
    while (current - birth_date).days < 200 * 365:
        planet = DASHA_SEQUENCE[idx]
        years = DASHA_YEARS[planet]
        end = _add_years(current, years)
        mahadashas.append({
            'planet': planet,
            'start_date': current.isoformat(),
            'end_date': end.isoformat(),
            'years': float(years),
        })
        current = end
        idx = (idx + 1) % 9

    # Find current mahadasha
    today = date.today()
    current_maha = None
    for m in mahadashas:
        if date.fromisoformat(m['start_date']) <= today <= date.fromisoformat(m['end_date']):
            current_maha = m
            break

    # Find current antardasha
    current_antar = None
    if current_maha:
        maha_start = date.fromisoformat(current_maha['start_date'])
        maha_end = date.fromisoformat(current_maha['end_date'])
        maha_total_years = (maha_end - maha_start).days / 365.25
        maha_planet = current_maha['planet']
        maha_idx = DASHA_SEQUENCE.index(maha_planet)

        antar_start = maha_start
        for i in range(9):
            ap = DASHA_SEQUENCE[(maha_idx + i) % 9]
            antar_years = (maha_total_years * DASHA_YEARS[ap]) / TOTAL_DASHA_YEARS
            antar_end = _add_years(antar_start, antar_years)
            if antar_start <= today <= antar_end:
                current_antar = {
                    'planet': ap,
                    'start_date': antar_start.isoformat(),
                    'end_date': antar_end.isoformat(),
                }
                break
            antar_start = antar_end

    return {
        'current_mahadasha': current_maha,
        'current_antardasha': current_antar,
        'all_mahadashas': mahadashas[:20],
    }


def _add_years(d: date, years: float) -> date:
    days = int(years * 365.25)
    return d + timedelta(days=days)
