"""Run this to debug ascendant calculation: python3 debug_chart.py"""
import swisseph as swe
from timezonefinder import TimezoneFinder
import pytz
from datetime import datetime

SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
         'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']

swe.set_sid_mode(swe.SIDM_LAHIRI)

lat, lon = 50.8503, 4.3517  # Brussels

tf = TimezoneFinder()
tz_name = tf.timezone_at(lat=lat, lng=lon)
print(f"Timezone detected: {tz_name}")

tz = pytz.timezone(tz_name)
local_dt = datetime(1990, 5, 2, 13, 5)
local_dt_aware = tz.localize(local_dt)
utc = local_dt_aware.utctimetuple()
print(f"Local: 1990-05-02 13:05  →  UTC: {utc.tm_hour:02d}:{utc.tm_min:02d}")

hour_ut = utc.tm_hour + utc.tm_min / 60.0
jd = swe.julday(utc.tm_year, utc.tm_mon, utc.tm_mday, hour_ut)
print(f"Julian Day: {jd:.6f}")

# Tropical ascendant
cusps, ascmc = swe.houses_ex(jd, lat, lon, b'P')
trop_asc = ascmc[0]
print(f"\nTropical ASC:  {trop_asc:.4f}° → {SIGNS[int(trop_asc/30)]} {trop_asc%30:.2f}°")

# Ayanamsa
aya = swe.get_ayanamsa_ut(jd)
print(f"Ayanamsa:      {aya:.4f}°")

# Sidereal ASC
sid_asc = (trop_asc - aya) % 360
print(f"Sidereal ASC:  {sid_asc:.4f}° → {SIGNS[int(sid_asc/30)]} {sid_asc%30:.2f}°")

# Moon for reference
flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL
result, _ = swe.calc_ut(jd, swe.MOON, flags)
moon_lon = result[0] % 360
print(f"\nMoon sidereal: {moon_lon:.4f}° → {SIGNS[int(moon_lon/30)]} {moon_lon%30:.2f}°")
