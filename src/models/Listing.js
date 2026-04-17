/**
 * Listing model
 *
 * Represents a securities listing (stock, forex, futures, option).
 */
export class Listing {
  constructor({
    id,
    ticker,
    name,
    type,
    exchangeAcronym,
    price,
    ask,
    bid,
    volume,
    changePercent,
    maintenanceMargin,
    initialMarginCost,
    stockDetail,
    forexDetail,
    futuresDetail,
    optionDetail,
    optionType,
    strikePrice,
    settlementDate,
    openInterest,
  }) {
    this.id                 = id
    this.ticker             = ticker             ?? ''
    this.name               = name               ?? ''
    this.type               = type               ?? ''
    this.exchangeAcronym    = exchangeAcronym    ?? ''
    this.price              = price              ?? 0
    this.ask                = ask                ?? 0
    this.bid                = bid                ?? 0
    this.volume             = volume             ?? 0
    this.changePercent      = changePercent      ?? 0
    this.maintenanceMargin  = maintenanceMargin  ?? 0
    this.initialMarginCost  = initialMarginCost  ?? 0
    this.stockDetail        = stockDetail        ?? null
    this.forexDetail        = forexDetail        ?? null
    this.futuresDetail      = futuresDetail      ?? null
    this.optionDetail       = optionDetail       ?? null
    // Option-specific (populated when type === 'OPTION')
    this.optionType         = optionType         ?? ''
    this.strikePrice        = strikePrice        ?? 0
    this.settlementDate     = settlementDate     ?? ''
    this.openInterest       = openInterest       ?? 0
  }
}

/**
 * Creates a Listing instance from a raw API response object.
 */
export function listingFromApi(data) {
  return new Listing({
    id:                data.id,
    ticker:            data.ticker,
    name:              data.name,
    type:              data.type,
    exchangeAcronym:   data.exchange_acronym    ?? data.exchangeAcronym,
    price:             data.price,
    ask:               data.ask,
    bid:               data.bid,
    volume:            data.volume,
    changePercent:     data.change_percent      ?? data.changePercent,
    maintenanceMargin: data.maintenance_margin  ?? data.maintenanceMargin,
    initialMarginCost: data.initial_margin_cost ?? data.initialMarginCost,
    stockDetail:       data.stock_detail        ?? data.stockDetail        ?? null,
    forexDetail:       data.forex_detail        ?? data.forexDetail        ?? null,
    futuresDetail:     data.futures_detail      ?? data.futuresDetail      ?? null,
    optionDetail:      data.option_detail       ?? data.optionDetail       ?? null,
    optionType:        data.optionType          ?? data.option_type        ?? '',
    strikePrice:       data.strikePrice         ?? data.strike_price       ?? 0,
    settlementDate:    data.settlementDate      ?? data.settlement_date    ?? '',
    openInterest:      data.openInterest        ?? data.open_interest      ?? 0,
  })
}
