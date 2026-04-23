export const DESTINATIONS = [
  "O'Hare Airport (ORD)", "Midway Airport (MDW)", "Chicago Downtown",
  "Milwaukee", "Minneapolis", "Madison Airport (MSN)", "Green Bay", "Rockford",
];

export const PICKUP_LOCATIONS = [
  "Union South", "Dejope Residence Hall", "Sellery Residence Hall",
  "Memorial Union", "Engineering Hall", "Camp Randall",
  "Witte Residence Hall", "Lakeshore Path & Observatory Dr",
];

// Extra keywords to broaden search matches beyond the literal destination name.
// E.g. searching "chicago" should match O'Hare and Midway rides.
export const DESTINATION_ALIASES = {
  "O'Hare Airport (ORD)": ["chicago", "ord", "o'hare", "ohare", "airport"],
  "Midway Airport (MDW)": ["chicago", "mdw", "midway", "airport"],
  "Chicago Downtown": ["chicago", "downtown", "loop", "il"],
  "Milwaukee": ["mke", "brew city", "wi"],
  "Minneapolis": ["msp", "minnesota", "twin cities", "mn"],
  "Madison Airport (MSN)": ["msn", "madison", "dane county", "airport"],
  "Green Bay": ["gb", "packers", "wi"],
  "Rockford": ["rfd", "il"],
};
