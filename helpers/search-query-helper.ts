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
    'NORTHERN MARIANA ISLANDS': 'MP',
    'PUERTO RICO': 'PR',
    'UNITED STATES MINOR OUTLYING ISLANDS': 'UM',
    'VIRGIN ISLANDS': 'VI'
  };
  private static readonly US_STATE_FULL_NAMES = Object.keys(this.US_STATE_CODES);
  private static readonly US_STATE_FULL_NAMES_SORTED_BY_NUM_SPACES = this.US_STATE_FULL_NAMES.sort(
    (a, b) => b.split(' ').length - a.split(' ').length
  );

  static replaceStateNameInLastSectionAfterComma(query: string) {
    let fullStateName: string;
    const separatedQuery = query.split(',');
    const lastIdx = separatedQuery.length - 1;
    if (
      separatedQuery.length > 1 &&
      this.US_STATE_FULL_NAMES.includes((fullStateName = separatedQuery[lastIdx].trim().toUpperCase()))
    ) {
      separatedQuery[lastIdx] = separatedQuery[lastIdx]
        .replace(new RegExp(fullStateName, 'i'), this.US_STATE_CODES[fullStateName])
        .toLowerCase();
      return separatedQuery.join(',');
    }
  }

  static replaceStateNameAtEnd(query: string) {
    const upperQuery = query.toUpperCase();
    for (const fullStateName of this.US_STATE_FULL_NAMES_SORTED_BY_NUM_SPACES) {
      if (upperQuery.endsWith(fullStateName)) {
        return upperQuery
          .replace(new RegExp(`${fullStateName}$`, 'i'), this.US_STATE_CODES[fullStateName])
          .toLowerCase();
      }
    }
  }

  static formatQuery(query: string) {
    const formattedQuery = query.replaceAll(new RegExp(' {2,}', 'g'), ' ').trim().toLowerCase();
    return (
      this.replaceStateNameInLastSectionAfterComma(formattedQuery) ??
      this.replaceStateNameAtEnd(formattedQuery) ??
      formattedQuery
    );
  }

  static getCityAndStateCode(city: Pick<SearchResultCity, 'cityAndStateCode' | 'cityName' | 'stateCode'>) {
    return city.cityAndStateCode ? city.cityAndStateCode : `${city.cityName}, ${city.stateCode}`;
  }
}
