import { SearchResultCity } from 'models/cities';

export class SearchQueryHelper {
  private static readonly US_STATE_CODES: Record<string, string> = {
    ALASKA: 'AK',
    ALABAMA: 'AL',
    ARKANSAS: 'AR',
    ARIZONA: 'AZ',
    CALIFORNIA: 'CA',
    COLORADO: 'CO',
    CONNECTICUT: 'CT',
    'DISTRICT OF COLUMBIA': 'DC',
    DELAWARE: 'DE',
    FLORIDA: 'FL',
    GEORGIA: 'GA',
    HAWAII: 'HI',
    IOWA: 'IA',
    IDAHO: 'ID',
    ILLINOIS: 'IL',
    INDIANA: 'IN',
    KANSAS: 'KS',
    KENTUCKY: 'KY',
    LOUISIANA: 'LA',
    MASSACHUSETTS: 'MA',
    MARYLAND: 'MD',
    MAINE: 'ME',
    MICHIGAN: 'MI',
    MINNESOTA: 'MN',
    MISSOURI: 'MO',
    MISSISSIPPI: 'MS',
    MONTANA: 'MT',
    'NORTH CAROLINA': 'NC',
    'NORTH DAKOTA': 'ND',
    NEBRASKA: 'NE',
    'NEW HAMPSHIRE': 'NH',
    'NEW JERSEY': 'NJ',
    'NEW MEXICO': 'NM',
    NEVADA: 'NV',
    'NEW YORK': 'NY',
    OHIO: 'OH',
    OKLAHOMA: 'OK',
    OREGON: 'OR',
    PENNSYLVANIA: 'PA',
    'RHODE ISLAND': 'RI',
    'SOUTH CAROLINA': 'SC',
    'SOUTH DAKOTA': 'SD',
    TENNESSEE: 'TN',
    TEXAS: 'TX',
    UTAH: 'UT',
    VIRGINIA: 'VA',
    VERMONT: 'VT',
    WASHINGTON: 'WA',
    WISCONSIN: 'WI',
    'WEST VIRGINIA': 'WV',
    WYOMING: 'WY',
    'AMERICAN SAMOA': 'AS',
    GUAM: 'GU',
    'NORTHERN Mariana Islands': 'MP',
    'PUERTO RICO': 'PR',
    'UNITED STATES MINOR OUTLYING ISLANDS': 'UM',
    'VIRGIN ISLANDS': 'VI'
  };
  private static readonly US_STATE_FULL_NAMES = Object.keys(this.US_STATE_CODES);

  static replaceLastSeparated(query: string, splitOn: string) {
    let fullStateName: string;
    const separatedQuery = query.split(splitOn);
    const lastIdx = separatedQuery.length - 1;
    if (
      separatedQuery.length > 1 &&
      this.US_STATE_FULL_NAMES.includes((fullStateName = separatedQuery[lastIdx].trim().toUpperCase()))
    ) {
      separatedQuery[lastIdx] = separatedQuery[lastIdx]
        .replace(new RegExp(fullStateName, 'i'), this.US_STATE_CODES[fullStateName])
        .toLowerCase();
      return separatedQuery.join(splitOn);
    }
  }

  static formatQuery(query: string) {
    const formattedQuery = query.replaceAll(new RegExp(' {2,}', 'g'), ' ').trim().toLowerCase();
    return (
      this.replaceLastSeparated(formattedQuery, ',') ?? this.replaceLastSeparated(formattedQuery, ' ') ?? formattedQuery
    );
  }

  static getCityAndStateCode(city: SearchResultCity) {
    return city.cityAndStateCode ? city.cityAndStateCode : `${city.cityName}, ${city.stateCode}`;
  }
}
