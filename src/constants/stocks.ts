export interface StockSuggestion {
  ticker: string;
  name: string;
  sector: string;
}

export const POPULAR_NSE_STOCKS: StockSuggestion[] = [
  { ticker: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Energy & Retail' },
  { ticker: 'TCS', name: 'Tata Consultancy Services', sector: 'IT Services' },
  { ticker: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking' },
  { ticker: 'INFY', name: 'Infosys Ltd', sector: 'IT Services' },
  { ticker: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking' },
  { ticker: 'TATAMOTORS', name: 'Tata Motors Ltd', sector: 'Automotive' },
  { ticker: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries', sector: 'Pharma' },
  { ticker: 'ITC', name: 'ITC Ltd', sector: 'FMCG' },
  { ticker: 'TATASTEEL', name: 'Tata Steel Ltd', sector: 'Metals' },
  { ticker: 'ZOMATO', name: 'Zomato Ltd (Eternal)', sector: 'Consumer Internet' },
  { ticker: 'TITAN', name: 'Titan Company Ltd', sector: 'Consumer Discretionary' },
  { ticker: 'HAL', name: 'Hindustan Aeronautics Ltd', sector: 'Defence' },
  { ticker: 'MARUTI', name: 'Maruti Suzuki India Ltd', sector: 'Automotive' },
  { ticker: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd', sector: 'Automotive' },
  { ticker: 'BAJFINANCE', name: 'Bajaj Finance Ltd', sector: 'NBFC' },
  { ticker: 'WIPRO', name: 'Wipro Ltd', sector: 'IT Services' },
  { ticker: 'HCLTECH', name: 'HCL Technologies Ltd', sector: 'IT Services' },
  { ticker: 'LT', name: 'Larsen & Toubro Ltd', sector: 'Infrastructure' },
  { ticker: 'ONGC', name: 'Oil & Natural Gas Corp Ltd', sector: 'Oil & Gas' },
  { ticker: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecom' },
  { ticker: 'NTPC', name: 'NTPC Ltd', sector: 'Power' },
  { ticker: 'POWERGRID', name: 'Power Grid Corporation of India', sector: 'Power' },
  { ticker: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', sector: 'Banking' },
  { ticker: 'AXISBANK', name: 'Axis Bank Ltd', sector: 'Banking' },
  { ticker: 'SBIN', name: 'State Bank of India', sector: 'Banking' },
  { ticker: 'ASIANPAINT', name: 'Asian Paints Ltd', sector: 'Paints & Chemicals' },
  { ticker: 'COALINDIA', name: 'Coal India Ltd', sector: 'Mining' },
  { ticker: 'DRREDDY', name: 'Dr. Reddy\'s Laboratories', sector: 'Pharma' },
  { ticker: 'CIPLA', name: 'Cipla Ltd', sector: 'Pharma' },
  { ticker: 'PERSISTENT', name: 'Persistent Systems Ltd', sector: 'IT Services' },
  { ticker: 'COFORGE', name: 'Coforge Ltd', sector: 'IT Services' },
  { ticker: 'LTIM', name: 'LTIMindtree Ltd', sector: 'IT Services' },
  { ticker: 'DIXON', name: 'Dixon Technologies Ltd', sector: 'Electronics' },
  { ticker: 'BEL', name: 'Bharat Electronics Ltd', sector: 'Defence' },
  { ticker: 'POLYCAB', name: 'Polycab India Ltd', sector: 'Cables & Wires' },
  { ticker: 'ADANIENT', name: 'Adani Enterprises Ltd', sector: 'Conglomerate' },
  { ticker: 'ADANIPORTS', name: 'Adani Ports & SEZ Ltd', sector: 'Ports' },
];

export function getSuggestions(query: string): StockSuggestion[] {
  if (!query || query.trim().length === 0) return [];
  const q = query.toUpperCase().trim();
  return POPULAR_NSE_STOCKS.filter(
    (s) => s.ticker.includes(q) || s.name.toUpperCase().includes(q)
  ).slice(0, 5);
}

