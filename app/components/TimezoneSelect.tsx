'use client'

import { useEffect, useRef } from 'react'

const TIMEZONES = [
  { value: 'Pacific/Honolulu',     label: 'Hawaii (HST)' },
  { value: 'America/Anchorage',    label: 'Alaska (AKST)' },
  { value: 'America/Los_Angeles',  label: 'Pacific (PST/PDT)' },
  { value: 'America/Denver',       label: 'Mountain (MST/MDT)' },
  { value: 'America/Chicago',      label: 'Central (CST/CDT)' },
  { value: 'America/New_York',     label: 'Eastern (EST/EDT)' },
  { value: 'America/Toronto',      label: 'Toronto (EST/EDT)' },
  { value: 'America/Vancouver',    label: 'Vancouver (PST/PDT)' },
  { value: 'America/Mexico_City',  label: 'Mexico City (CST/CDT)' },
  { value: 'America/Sao_Paulo',    label: 'São Paulo (BRT)' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (ART)' },
  { value: 'America/Bogota',       label: 'Bogotá (COT)' },
  { value: 'Europe/London',        label: 'London (GMT/BST)' },
  { value: 'Europe/Dublin',        label: 'Dublin (IST/GMT)' },
  { value: 'Europe/Paris',         label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin',        label: 'Berlin (CET/CEST)' },
  { value: 'Europe/Rome',          label: 'Rome (CET/CEST)' },
  { value: 'Europe/Madrid',        label: 'Madrid (CET/CEST)' },
  { value: 'Europe/Amsterdam',     label: 'Amsterdam (CET/CEST)' },
  { value: 'Europe/Stockholm',     label: 'Stockholm (CET/CEST)' },
  { value: 'Europe/Athens',        label: 'Athens (EET/EEST)' },
  { value: 'Europe/Warsaw',        label: 'Warsaw (CET/CEST)' },
  { value: 'Europe/Kyiv',          label: 'Kyiv (EET/EEST)' },
  { value: 'Europe/Moscow',        label: 'Moscow (MSK)' },
  { value: 'Africa/Cairo',         label: 'Cairo (EET)' },
  { value: 'Africa/Nairobi',       label: 'Nairobi (EAT)' },
  { value: 'Africa/Johannesburg',  label: 'Johannesburg (SAST)' },
  { value: 'Africa/Lagos',         label: 'Lagos (WAT)' },
  { value: 'Asia/Dubai',           label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata',         label: 'India (IST)' },
  { value: 'Asia/Karachi',         label: 'Pakistan (PKT)' },
  { value: 'Asia/Dhaka',           label: 'Dhaka (BST)' },
  { value: 'Asia/Bangkok',         label: 'Bangkok (ICT)' },
  { value: 'Asia/Singapore',       label: 'Singapore (SGT)' },
  { value: 'Asia/Hong_Kong',       label: 'Hong Kong (HKT)' },
  { value: 'Asia/Shanghai',        label: 'China (CST)' },
  { value: 'Asia/Seoul',           label: 'Seoul (KST)' },
  { value: 'Asia/Tokyo',           label: 'Tokyo (JST)' },
  { value: 'Australia/Perth',      label: 'Perth (AWST)' },
  { value: 'Australia/Adelaide',   label: 'Adelaide (ACST/ACDT)' },
  { value: 'Australia/Brisbane',   label: 'Brisbane (AEST)' },
  { value: 'Australia/Sydney',     label: 'Sydney (AEST/AEDT)' },
  { value: 'Pacific/Auckland',     label: 'Auckland (NZST/NZDT)' },
  { value: 'Pacific/Fiji',         label: 'Fiji (FJT)' },
  { value: 'UTC',                  label: 'UTC' },
]

export default function TimezoneSelect() {
  const selectRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (selectRef.current && detected) {
      const match = TIMEZONES.find((tz) => tz.value === detected)
      if (match) selectRef.current.value = detected
    }
  }, [])

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="timezone" className="text-sm font-medium text-[--color-ink]">
        Timezone
      </label>
      <select
        ref={selectRef}
        id="timezone"
        name="timezone"
        required
        defaultValue="America/New_York"
        className="rounded-lg border border-[--color-paper-dark] bg-white px-3 py-2 text-sm text-[--color-ink] focus:outline-none focus:ring-2 focus:ring-[--color-accent]"
      >
        {TIMEZONES.map((tz) => (
          <option key={tz.value} value={tz.value}>
            {tz.label}
          </option>
        ))}
      </select>
    </div>
  )
}
