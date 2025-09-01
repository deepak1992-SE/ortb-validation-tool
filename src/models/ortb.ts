/**
 * OpenRTB 2.6 Data Model Interfaces
 * Based on IAB OpenRTB 2.6 specification
 */

export interface ORTBRequest {
  /** Unique ID of the bid request */
  id: string;
  /** Array of Impression objects representing the impressions offered */
  imp: Impression[];
  /** Details via a Site object about the publisher's website */
  site?: Site;
  /** Details via an App object about the publisher's app */
  app?: App;
  /** Details via a Device object about the user's device */
  device?: Device;
  /** Details via a User object about the human user of the device */
  user?: User;
  /** Indicator of test mode in which auctions are not billable */
  test?: number;
  /** Auction type, where 1 = First Price, 2 = Second Price Plus */
  at: number;
  /** Maximum time in milliseconds the exchange allows for bids */
  tmax?: number;
  /** White list of buyer seats (e.g., advertisers, agencies) allowed to bid */
  wseat?: string[];
  /** Block list of buyer seats (e.g., advertisers, agencies) restricted from bidding */
  bseat?: string[];
  /** Flag to indicate if Exchange can verify that the impressions offered represent all of the impressions available in context */
  allimps?: number;
  /** Array of allowed currencies for bids on this bid request using ISO-4217 alpha codes */
  cur?: string[];
  /** White list of languages for creatives using ISO-639-1-alpha-2 */
  wlang?: string[];
  /** Blocked advertiser categories using the IAB content categories */
  bcat?: string[];
  /** Block list of advertisers by their domains */
  badv?: string[];
  /** Block list of applications by their platform-specific exchange-independent application identifiers */
  bapp?: string[];
  /** A Sorce object that provides data about the inventory source and which entity makes the final decision */
  source?: Source;
  /** A Regs object that specifies any industry, legal, or governmental regulations in force for this request */
  regs?: Regulations;
  /** Placeholder for exchange-specific extensions to OpenRTB */
  ext?: Record<string, any>;
}

export interface Impression {
  /** A unique identifier for this impression within the context of the bid request */
  id: string;
  /** An array of Metric object */
  metric?: Metric[];
  /** A Banner object; required if this impression is offered as a banner ad opportunity */
  banner?: Banner;
  /** A Video object; required if this impression is offered as a video ad opportunity */
  video?: Video;
  /** An Audio object; required if this impression is offered as an audio ad opportunity */
  audio?: Audio;
  /** A Native object; required if this impression is offered as a native ad opportunity */
  native?: Native;
  /** A Pmp object containing any private marketplace deals in effect for this impression */
  pmp?: PMP;
  /** Name of ad mediation partner, SDK technology, or player responsible for rendering ad */
  displaymanager?: string;
  /** Version of ad mediation partner, SDK technology, or player responsible for rendering ad */
  displaymanagerver?: string;
  /** 1 = the ad is interstitial or full screen, 0 = not interstitial */
  instl?: number;
  /** Identifier for specific ad placement or ad tag that was used to initiate the auction */
  tagid?: string;
  /** Minimum bid for this impression expressed in CPM */
  bidfloor?: number;
  /** Currency specified using ISO-4217 alpha codes */
  bidfloorcur?: string;
  /** Indicates the type of browser opened upon clicking the creative in an app */
  clickbrowser?: number;
  /** Flag to indicate if the impression requires secure HTTPS URL creative assets and markup */
  secure?: number;
  /** Array of names for supportable iframe busters */
  iframebuster?: string[];
  /** Advisory as to the number of seconds that may elapse between the auction and the actual impression */
  exp?: number;
  /** Placeholder for exchange-specific extensions to OpenRTB */
  ext?: Record<string, any>;
}

export interface Site {
  /** Exchange-specific site ID */
  id?: string;
  /** Site name (may be aliased at the publisher's request) */
  name?: string;
  /** Domain of the site (e.g., "mysite.foo.com") */
  domain?: string;
  /** Array of IAB content categories of the site */
  cat?: string[];
  /** Array of IAB content categories that describe the current section of the site */
  sectioncat?: string[];
  /** Array of IAB content categories that describe the current page or view of the site */
  pagecat?: string[];
  /** URL of the page where the impression will be shown */
  page?: string;
  /** Referrer URL that caused navigation to the current page */
  ref?: string;
  /** Search string that caused navigation to the current page */
  search?: string;
  /** Indicates if the site has been programmatically crawled or human reviewed */
  mobile?: number;
  /** Indicates if the site has a privacy policy */
  privacypolicy?: number;
  /** Details about the Publisher of the site */
  publisher?: Publisher;
  /** Details about the Content within the site */
  content?: Content;
  /** Comma separated list of keywords about the site */
  keywords?: string;
  /** Placeholder for exchange-specific extensions to OpenRTB */
  ext?: Record<string, any>;
}

export interface App {
  /** Exchange-specific app ID */
  id?: string;
  /** App name (may be aliased at the publisher's request) */
  name?: string;
  /** A platform-specific application identifier intended to be unique across exchanges */
  bundle?: string;
  /** Domain of the app (e.g., "mygame.foo.com") */
  domain?: string;
  /** App store URL for an installed app */
  storeurl?: string;
  /** Array of IAB content categories of the app */
  cat?: string[];
  /** Array of IAB content categories that describe the current section of the app */
  sectioncat?: string[];
  /** Array of IAB content categories that describe the current page or view of the app */
  pagecat?: string[];
  /** Application version */
  ver?: string;
  /** Indicates if the app has a privacy policy */
  privacypolicy?: number;
  /** 0 = app is free, 1 = the app is a paid version */
  paid?: number;
  /** Details about the Publisher of the app */
  publisher?: Publisher;
  /** Details about the Content within the app */
  content?: Content;
  /** Comma separated list of keywords about the app */
  keywords?: string;
  /** Placeholder for exchange-specific extensions to OpenRTB */
  ext?: Record<string, any>;
}

export interface Device {
  /** Browser user agent string */
  ua?: string;
  /** Location of the device assumed to be the user's current location */
  geo?: Geo;
  /** Standard "Do Not Track" flag as set in the header by the browser */
  dnt?: number;
  /** "Limit Ad Tracking" signal commercially endorsed */
  lmt?: number;
  /** IPv4 address closest to device */
  ip?: string;
  /** IP address closest to device as IPv6 */
  ipv6?: string;
  /** The general type of device */
  devicetype?: number;
  /** Device make (e.g., "Apple") */
  make?: string;
  /** Device model (e.g., "iPhone") */
  model?: string;
  /** Device operating system (e.g., "iOS") */
  os?: string;
  /** Device operating system version (e.g., "3.1.2") */
  osv?: string;
  /** Hardware version of the device (e.g., "5S" for iPhone 5S) */
  hwv?: string;
  /** Physical height of the screen in pixels */
  h?: number;
  /** Physical width of the screen in pixels */
  w?: number;
  /** Screen size as pixels per linear inch */
  ppi?: number;
  /** The ratio of physical pixels to device independent pixels */
  pxratio?: number;
  /** Support for JavaScript, where 0 = no, 1 = yes */
  js?: number;
  /** Indicates if the geolocation API will be available to JavaScript code running in the banner */
  geofetch?: number;
  /** Version of Flash supported by the browser */
  flashver?: string;
  /** Browser language using ISO-639-1-alpha-2 */
  language?: string;
  /** Carrier or ISP (e.g., "VERIZON") using exchange curated string names which should be published to bidders a priori */
  carrier?: string;
  /** Mobile carrier as the concatenated MCC-MNC code */
  mccmnc?: string;
  /** Network connection type */
  connectiontype?: number;
  /** ID sanctioned for advertiser use in the clear (i.e., not hashed) */
  ifa?: string;
  /** Hardware device ID (e.g., IMEI); hashed via SHA1 */
  didsha1?: string;
  /** Hardware device ID (e.g., IMEI); hashed via MD5 */
  didmd5?: string;
  /** Platform device ID (e.g., Android ID); hashed via SHA1 */
  dpidsha1?: string;
  /** Platform device ID (e.g., Android ID); hashed via MD5 */
  dpidmd5?: string;
  /** MAC address of the device; hashed via SHA1 */
  macsha1?: string;
  /** MAC address of the device; hashed via MD5 */
  macmd5?: string;
  /** Placeholder for exchange-specific extensions to OpenRTB */
  ext?: Record<string, any>;
}

export interface User {
  /** Exchange-specific ID for the user */
  id?: string;
  /** Buyer-specific ID for the user as mapped by the exchange for the buyer */
  buyeruid?: string;
  /** Year of birth as a 4-digit integer */
  yob?: number;
  /** Gender, where "M" = male, "F" = female, "O" = known to be other */
  gender?: string;
  /** Comma separated list of keywords, interests, or intent */
  keywords?: string;
  /** Optional feature to pass bidder data that was set in the exchange's cookie */
  customdata?: string;
  /** Location of the user's home base defined by a Geo object */
  geo?: Geo;
  /** Additional user data. Each Data object represents a different data source */
  data?: Data[];
  /** Placeholder for exchange-specific extensions to OpenRTB */
  ext?: Record<string, any>;
}

// Additional supporting interfaces
export interface Banner {
  format?: Format[];
  w?: number;
  h?: number;
  wmax?: number;
  hmax?: number;
  wmin?: number;
  hmin?: number;
  btype?: number[];
  battr?: number[];
  pos?: number;
  mimes?: string[];
  topframe?: number;
  expdir?: number[];
  api?: number[];
  id?: string;
  vcm?: number;
  ext?: Record<string, any>;
}

export interface Video {
  mimes: string[];
  minduration?: number;
  maxduration?: number;
  protocols?: number[];
  w?: number;
  h?: number;
  startdelay?: number;
  placement?: number;
  linearity?: number;
  skip?: number;
  skipmin?: number;
  skipafter?: number;
  sequence?: number;
  battr?: number[];
  maxextended?: number;
  minbitrate?: number;
  maxbitrate?: number;
  boxingallowed?: number;
  playbackmethod?: number[];
  playbackend?: number;
  delivery?: number[];
  pos?: number;
  companionad?: Banner[];
  api?: number[];
  companiontype?: number[];
  ext?: Record<string, any>;
}

export interface Audio {
  mimes: string[];
  minduration?: number;
  maxduration?: number;
  protocols?: number[];
  startdelay?: number;
  sequence?: number;
  battr?: number[];
  maxextended?: number;
  minbitrate?: number;
  maxbitrate?: number;
  delivery?: number[];
  companionad?: Banner[];
  api?: number[];
  companiontype?: number[];
  maxseq?: number;
  feed?: number;
  stitched?: number;
  nvol?: number;
  ext?: Record<string, any>;
}

export interface Native {
  request: string;
  ver?: string;
  api?: number[];
  battr?: number[];
  ext?: Record<string, any>;
}

export interface Format {
  w?: number;
  h?: number;
  wratio?: number;
  hratio?: number;
  wmin?: number;
  ext?: Record<string, any>;
}

export interface PMP {
  private_auction?: number;
  deals?: Deal[];
  ext?: Record<string, any>;
}

export interface Deal {
  id: string;
  bidfloor?: number;
  bidfloorcur?: string;
  at?: number;
  wseat?: string[];
  wadv?: string[];
  ext?: Record<string, any>;
}

export interface Publisher {
  id?: string;
  name?: string;
  cat?: string[];
  domain?: string;
  ext?: Record<string, any>;
}

export interface Content {
  id?: string;
  episode?: number;
  title?: string;
  series?: string;
  season?: string;
  artist?: string;
  genre?: string;
  album?: string;
  isrc?: string;
  producer?: Producer;
  url?: string;
  cat?: string[];
  prodq?: number;
  videoquality?: number;
  context?: number;
  contentrating?: string;
  userrating?: string;
  qagmediarating?: number;
  keywords?: string;
  livestream?: number;
  sourcerelationship?: number;
  len?: number;
  language?: string;
  embeddable?: number;
  data?: Data[];
  ext?: Record<string, any>;
}

export interface Producer {
  id?: string;
  name?: string;
  cat?: string[];
  domain?: string;
  ext?: Record<string, any>;
}

export interface Geo {
  lat?: number;
  lon?: number;
  type?: number;
  accuracy?: number;
  lastfix?: number;
  ipservice?: number;
  country?: string;
  region?: string;
  regionfips104?: string;
  metro?: string;
  city?: string;
  zip?: string;
  utcoffset?: number;
  ext?: Record<string, any>;
}

export interface Data {
  id?: string;
  name?: string;
  segment?: Segment[];
  ext?: Record<string, any>;
}

export interface Segment {
  id?: string;
  name?: string;
  value?: string;
  ext?: Record<string, any>;
}

export interface Source {
  fd?: number;
  tid?: string;
  pchain?: string;
  ext?: Record<string, any>;
}

export interface Regulations {
  coppa?: number;
  ext?: Record<string, any>;
}

export interface Metric {
  type: string;
  value: number;
  vendor?: string;
  ext?: Record<string, any>;
}