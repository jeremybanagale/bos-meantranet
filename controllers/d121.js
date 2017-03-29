const async = require('async');
const osmosis = require('osmosis');
const _ = require('lodash');

const Business = require('../models/Business');

/**
 * GET /crawler/crawler
 * Renders the crawler page.
 */
exports.getCrawler = (req, res) => {
    res.render('d121/crawler', {
        title: 'D121 Web Crawler'
    });
};

/**
 * POST
 *
 */
exports.postData = (req, res, next) => {
    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/signup');
    }

    const data = req.body;
    const business = new Business({
        name: data.name,
        password: data.phone,
        street_address: data.street_address,
        address_locality: data.address_locality,
        address_region: data.address_region,
        postal_code: data.postal_code,
        category: data.category,
        price_range: data.price_range,
        star_rating: data.star_rating,
        review_count: data.review_count,
        website: data.website,
        email: data.email,
        contact_person: data.contact_person,
        contact_title: data.contact_title,
        page_url: data.page_url,
        scraper: data.scraper,
    });

    console.log(data);
    // Business.insertMany(req)
    //     .then(function(mongooseDocuments) {
    //         req.flash('success', {
    //             msg: 'Data has been saved.'
    //         });
    //         res.redirect('/crawler');
    //     })
    //     .catch(function(err) {
    //         req.flash('errors', {
    //             msg: 'Encountered an error.'
    //         });
    //         return res.redirect('/crawler');
    //     });
};

/**
 * GET
 * Passess a json object to #results.
 */
exports.getData = (req, res) => {
    var parameters = {
        city: req.query.city,
        category: req.query.category
    };

    async.parallel([
            function(callback) {
                scrapeYell(parameters, function(data) {
                    if (data.length > 0) {
                        console.log(`Yell: ${data.length} records ready for merging...`);
                        callback(null, data);
                        return;
                    }
                    callback();
                    return;
                });
            }

            // function(callback) {
            //     scrapeKompass(parameters, function(data) {
            //         if (data.length > 0) {
            //             console.log(`Kompass: ${data.length} records ready for merging...`);
            //             callback(null, data);
            //             return;
            //         }
            //         callback();
            //         return;
            //     });
            // }

            // function(callback) {
            //     scrapeMisterWhat(parameters, function(data) {
            //         if (data.length > 0) {
            //             console.log(`MisterWhat: ${data.length} records ready for merging...`);
            //             callback(null, data);
            //             return;
            //         }
            //         callback();
            //         return;
            //     });
            // }

            // function(callback) {
            //     scrapeManta(parameters, function(data) {
            //         if (data.length > 0) {
            //             console.log(`Manta: ${data.length} records ready for merging...`);
            //             callback(null, data);
            //             return;
            //         }
            //         callback();
            //         return;
            //     });
            // }
        ],
        function(err, results) {
            if (err) {
                console.log(`Error: ${err}.`);
                return;
            }

            var page = {
                business: []
            };

            console.log(`Merging ${results.length} results...`);
            for (var i = 0; i < results.length; i++) {
                console.log(`Appending ${results[i].length} records to object...`);
                page.business = page.business.concat(results[i]);
            }

            console.log(`Parsing ${page.business.length} records to page...`);
            res.json(page);
        });
};

// function scrapeYell(params, callback) {
//     var category = params.category.split(' ').join('+')
//     var city = params.city.split(' ').join('+');
//     var url = `https://www.yell.com/ucs/UcsSearchAction.do?keywords=${category}&location=${city}`;
//     console.log(`Scraping ${url}`);
//
//     var results = [];
//     var scraper = osmosis
//         .get(url)
//         // .paginate('a.pagination--next')
//         .find('div.row.businessCapsule--title div.col-sm-24 a')
//         .delay(1000)
//         .follow('@href')
//         .set({
//             'name': 'h1.businessCapsule--title',
//             'phone': 'strong.business-telephone',
//             'street_address': 'span[itemprop="streetAddress"]',
//             'address_locality': 'span[itemprop="addressLocality"]',
//             'address_region': 'span[itemprop="addressRegion"]',
//             'postal_code': 'span[itemprop="postalCode"]',
//             'category': 'span[itemprop="name"]',
//             'website': 'div.businessCapsule--callToAction a@href',
//             'email': null,
//             'employee_size': null,
//             'business_type': null,
//             'page_url': 'meta[name="og:url"]@content',
//             'scraper': null
//         })
//         .data(function(listing) {
//             console.log(`Saving ${listing.name}...`);
//             listing.scraper = 'Yell';
//             listing.phone = formatPhoneUK(listing.phone);
//         })
//         .then(function(context, data) {
//             results.push(data);
//         })
//         .log(console.log)
//         .error(console.log)
//         .debug(console.log)
//         .done(function() {
//             callback(results);
//             console.log(`Scraped ${results.length} ${category}(s) from ${city}...`)
//         })
// }

function scrapeMisterWhat(params, callback) {
    var category = params.category.split(' ').join('+')
    var city = params.city.split(' ').join('+');
    var url = `http://www.misterwhat.co.uk/search?what=${category}&where=${city}`;
    console.log(`Scraping ${url}`);

    var results = [];
    var scraper = osmosis
        .get(url)
        // .paginate('ul.pagination li:nth-last-chlld(1) a')
        .find('a.compName')
        .delay(1000)
        .follow('@href')
        .set({
            'name': 'span[itemprop="name"]',
            'phone': 'span[itemprop="telephone"]',
            'street_address': 'span[itemprop="streetAddress"]',
            'address_locality': 'a[itemprop="addressLocality"]',
            'address_region': 'span[itemprop="addressRegion"]',
            'postal_code': 'span[itemprop="postalCode"]',
            'category': 'li:nth-last-child(1) span[itemprop="breadcrumb"]',
            'website': 'span.ddIcon + a[rel="nofollow"]',
            'email': null,
            'contact_person': null,
            'contact_title': null,
            'employee_size': null,
            'business_type': null,
            'page_url': 'link[rel="canonical"]@href',
            'scraper': null
        })
        .data(function(listing) {
            console.log(`Saving ${listing.name}...`);
            listing.scraper = 'Misterwhat';
            listing.phone = formatPhoneUK(listing.phone);
        })
        .then(function(context, data) {
            results.push(data);
        })
        .log(console.log)
        .error(console.log)
        .debug(console.log)
        .done(function() {
            callback(results);
            console.log(`Scraped ${results.length} ${category}(s) from ${city}...`)
        })
}

function scrapeKompass(params, callback) {
    var category = params.category.split(' ').join('+')
    var city = params.city.split(' ').join('+');
    var url = `http://gb.kompass.com/searchCompanies?acClassif=&localizationCode=GB&localizationLabel=United+Kingdom&localizationType=country&text=${category}&searchType=SUPPLIER`;
    console.log(`Scraping ${url}`);

    var results = [];
    var scraper = osmosis
        .get(url)
        // .paginate('a.pagination--next')
        .find('div.details h2 a')
        .delay(1000)
        .follow('@href')
        .set({
            'name': 'h1[itemprop="name"]',
            'phone': 'a.phoneCompany input@value',
            'street_address': 'span[itemprop="streetAddress"]',
            'address_locality': 'div.addressCoordinates p',
            'address_region': 'span[itemprop="addressRegion"]',
            'postal_code': 'span[itemprop="postalCode"]',
            'category': 'i.icon-circle.service + a',
            'website': 'a#website@href',
            'email': null,
            'contact_person': 'p.name',
            'contact_title': 'p.fonction',
            'employee_size': 'p.number',
            'business_type': 'p:contains("Type of company") + p',
            'page_url': null,
            'scraper': null
        })
        .data(function(listing) {
            console.log(`Saving ${listing.name}...`);
            listing.scraper = 'Kompass';
            listing.address_locality = listing.address_locality.replace(listing.streetAddress, '').replace('United Kingdom', '');
            listing.phone = formatPhoneUK(listing.phone);
        })
        .then(function(context, data) {
            results.push(data);
        })
        .log(console.log)
        .error(console.log)
        .debug(console.log)
        .done(function() {
            callback(results);
            console.log(`Scraped ${results.length} ${category}(s) from ${city}...`)
        })
}

function scrapeYell(params, callback) {
    var category = params.category.split(' ').join('+')
    var city = params.city.split(' ').join('+');
    var url = `https://www.yell.com/ucs/UcsSearchAction.do?keywords=${category}&location=${city}`;
    console.log(`Scraping ${url}`);

    var results = [];
    var scraper = osmosis
        .get(url)
        // .paginate('a.pagination--next')
        .find('div.row.businessCapsule--title div.col-sm-20 a')
        // .proxy([
        //     '118.70.212.139:3128',
        //     '118.193.23.162:3128',
        //     '110.73.182.12:9000',
        //     '114.32.57.98:3128',
        //     '165.234.102.177:8080',
        //     '97.77.104.22:80'
        // ])
        .delay(3000)
        .follow('@href')
        .set({
            'name': 'h1.businessCapsule--title',
            'phone': 'strong.business-telephone',
            'street_address': 'span[itemprop="streetAddress"]',
            'address_locality': 'span[itemprop="addressLocality"]',
            'address_region': 'span[itemprop="addressRegion"]',
            'postal_code': 'span[itemprop="postalCode"]',
            'category': 'span[itemprop="name"]:nth-last-child(1)',
            'website': 'div.businessCapsule--callToAction a@href',
            'email': null,
            'employee_size': null,
            'business_type': null,
            'page_url': 'meta[name="og:url"]@content',
            'scraper': null
        })
        .data(function(listing) {
            console.log(`Saving ${listing.name}...`);
            listing.scraper = 'Yell';
            listing.address_locality = listing.address_locality.replace(listing.streetAddress, '').replace('United Kingdom', '');
            listing.phone = formatPhoneUK(listing.phone);
        })
        .then(function(context, data) {
          scrapeAlf(data.name, function(info) {
              console.log(`Getting additional information for ${data.name}...`);
              data.employee_size = info.employee_size;
          });
            results.push(data);
        })
        .log(console.log)
        .error(console.log)
        .debug(console.log)
        .done(function() {
            callback(results);
            console.log(`Scraped ${results.length} ${category}(s) from ${city}...`)
        })
}

function scrapeAlf(search, callback) {
    console.log(search);
    // var search = params.split(' ').join('+');
    var url = `https://www.alfinsight.com/app/SearchResults?quickSearch=${search}`;
    console.log(`Scraping ${url}`);

    var results = [];
    var scraper = osmosis
        .get(url)
        .find('div.well.well-search.well-advertisers a')
        .delay(1000)
        .follow('@href')
        .set({
            'employee_size': 'p[itemprop="numberOfEmployees"]'
        })
        .then(function(context, data) {
            results.push(data);
        })
        .done(function() {
            callback(results);
        })
        .log(console.log)
        .error(console.log)
        .debug(console.log)
}

function formatPhoneUK(value) {
    if (typeof value === 'string') {
        value === 'string' ? value.trim().replace(/[^0-9.]/g, '') : value
        value = value.split(' ').join('');
        return value.replace(/^0/, '44');

    } else {
        return value;
    }
}
